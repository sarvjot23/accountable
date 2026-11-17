"""Delete rules across features, and delete impact (RULE-8 to RULE-12, API-8)."""

import pytest


@pytest.fixture
def world(org, contact, deal, activity):
    """Two organizations; the first has 2 contacts, 2 deals and 4 activities."""
    o = org(name="Northwind Labs")
    other = org(name="Harbor Finance")
    c1 = contact(organization_id=o["id"], first_name="A")
    c2 = contact(organization_id=o["id"], first_name="B")
    d1 = deal(organization_id=o["id"], contact_id=c1["id"])
    d2 = deal(organization_id=o["id"])
    a1 = activity(contact_id=c1["id"])
    a2 = activity(deal_id=d1["id"], contact_id=c1["id"])
    a3 = activity(deal_id=d2["id"])
    a4 = activity(contact_id=c2["id"])
    oc = contact(organization_id=other["id"], first_name="Z")
    od = deal(organization_id=other["id"], contact_id=oc["id"])
    oa = activity(contact_id=oc["id"], deal_id=od["id"])
    return {
        "org": o, "contacts": [c1, c2], "deals": [d1, d2], "activities": [a1, a2, a3, a4],
        "other": {"org": other, "contact": oc, "deal": od, "activity": oa},
    }  # fmt: skip


def count(client, path):
    return len(client.get(path).json())


def test_organization_delete_impact(client, world):  # RULE-12 API-8
    impact = client.get(f"/api/organizations/{world['org']['id']}/delete-impact").json()
    assert impact == {"contacts": 2, "deals": 2, "activities": 4}


def test_deleting_an_organization_deletes_its_contacts_deals_and_activities(client, world):  # RULE-8 RULE-12
    impact = client.get(f"/api/organizations/{world['org']['id']}/delete-impact").json()
    contacts_before, deals_before = count(client, "/api/contacts"), count(client, "/api/deals")
    assert client.delete(f"/api/organizations/{world['org']['id']}").status_code == 204
    assert count(client, "/api/contacts") == contacts_before - impact["contacts"]
    assert count(client, "/api/deals") == deals_before - impact["deals"]
    recent = client.get("/api/dashboard").json()["recent_activity"]
    assert [a["id"] for a in recent] == [world["other"]["activity"]["id"]]
    # The other organization is untouched.
    other = client.get(f"/api/organizations/{world['other']['org']['id']}").json()
    assert len(other["contacts"]) == 1 and len(other["deals"]) == 1


def test_contact_delete_impact(client, world):  # RULE-12 API-8
    c1 = world["contacts"][0]
    assert client.get(f"/api/contacts/{c1['id']}/delete-impact").json() == {"activities": 2, "deals": 1}


def test_deleting_a_contact_keeps_activities_and_deals_unlinked(client, world):  # RULE-9
    c1 = world["contacts"][0]
    d1 = world["deals"][0]
    assert client.delete(f"/api/contacts/{c1['id']}").status_code == 204
    deal = client.get(f"/api/deals/{d1['id']}").json()
    assert deal["contact_id"] is None and deal["contact_name"] is None
    kept = client.get(f"/api/deals/{d1['id']}/timeline").json()
    assert [a["id"] for a in kept] == [world["activities"][1]["id"]]
    assert kept[0]["contact_id"] is None
    recent_ids = {a["id"] for a in client.get("/api/dashboard").json()["recent_activity"]}
    assert world["activities"][0]["id"] in recent_ids  # unlinked from everything, still history


def test_deal_delete_impact(client, world):  # RULE-12 API-8
    d1 = world["deals"][0]
    assert client.get(f"/api/deals/{d1['id']}/delete-impact").json() == {"activities": 1}


def test_deleting_a_deal_keeps_its_activities_unlinked(client, world):  # RULE-10
    d1 = world["deals"][0]
    a2 = world["activities"][1]
    assert client.delete(f"/api/deals/{d1['id']}").status_code == 204
    recent = {a["id"]: a for a in client.get("/api/dashboard").json()["recent_activity"]}
    assert recent[a2["id"]]["deal_id"] is None
    assert recent[a2["id"]]["contact_id"] == world["contacts"][0]["id"]


def test_deleting_an_activity_deletes_only_it(client, world):  # RULE-11
    a1 = world["activities"][0]
    assert client.get(f"/api/activities/{a1['id']}/delete-impact").json() == {"stage_change": False}
    before = count(client, "/api/contacts")
    assert client.delete(f"/api/activities/{a1['id']}").status_code == 204
    assert count(client, "/api/contacts") == before
    assert client.delete(f"/api/activities/{a1['id']}").status_code == 404


def test_deleting_a_stage_change_entry_leaves_the_deal_in_its_stage(client, world):  # RULE-11
    d2 = world["deals"][1]
    client.patch(f"/api/deals/{d2['id']}/move", json={"stage": "proposal"})
    entry = next(a for a in client.get(f"/api/deals/{d2['id']}/timeline").json() if a["type"] == "stage_change")
    assert client.delete(f"/api/activities/{entry['id']}").status_code == 204
    assert client.get(f"/api/deals/{d2['id']}").json()["stage"] == "proposal"
