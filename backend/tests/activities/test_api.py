"""Activity routes, timelines and follow-ups (DATA-5, DATA-6, REC-7, API-6, API-7)."""

import pytest


@pytest.fixture
def linked(org, contact, deal):
    o = org()
    c = contact(organization_id=o["id"])
    d = deal(organization_id=o["id"], contact_id=c["id"])
    return c, d


def test_create_defaults(client, linked, activity):  # DATA-5 API-7
    c, _ = linked
    body = activity(contact_id=c["id"])
    assert body["type"] == "note"
    assert body["occurred_at"].startswith("2026-11-17T15:30")
    assert body["follow_up_done"] is False
    assert body["follow_up_status"] is None
    assert body["contact_name"] == "Sam Patel"
    assert body["organization_name"] == "Northwind Labs"


def test_an_activity_needs_a_contact_or_a_deal(client):  # DATA-6
    response = client.post("/api/activities", json={"type": "call", "description": "Called"})
    assert response.status_code == 422
    assert response.json()["detail"] == "Choose a contact, a deal or both"


def test_type_and_description_rules(client, linked):  # DATA-5
    c, _ = linked
    assert client.post("/api/activities", json={"type": "stage_change", "description": "x", "contact_id": c["id"]}).status_code == 422
    response = client.post("/api/activities", json={"type": "call", "description": " ", "contact_id": c["id"]})
    assert response.json()["detail"] == "Enter a description"
    response = client.post("/api/activities", json={"type": "call", "description": "x" * 5001, "contact_id": c["id"]})
    assert response.status_code == 422


def test_linked_to_both_it_is_in_both_timelines_newest_first(client, linked, activity):  # REC-7 API-6
    c, d = linked
    older = activity(contact_id=c["id"], deal_id=d["id"], occurred_at="2026-11-10T09:00:00Z", description="Older")
    newer = activity(contact_id=c["id"], deal_id=d["id"], occurred_at="2026-11-12T09:00:00Z", description="Newer")
    for path in (f"/api/contacts/{c['id']}/timeline", f"/api/deals/{d['id']}/timeline"):
        assert [a["id"] for a in client.get(path).json()] == [newer["id"], older["id"]]
    entry = client.get(f"/api/contacts/{c['id']}/timeline").json()[0]
    assert entry["deal_name"] == "Cloud migration"


def test_follow_up_status_and_done(client, linked, activity):  # API-7
    c, _ = linked
    overdue = activity(contact_id=c["id"], follow_up_date="2026-11-12")
    assert overdue["follow_up_status"] == "overdue"
    response = client.patch(f"/api/activities/{overdue['id']}/done", json={})
    assert response.status_code == 200
    assert response.json()["follow_up_done"] is True
    assert response.json()["follow_up_status"] is None
    undone = client.patch(f"/api/activities/{overdue['id']}/done", json={"done": False}).json()
    assert undone["follow_up_status"] == "overdue"


def test_edit_an_activity(client, linked, activity):  # API-7
    c, d = linked
    a = activity(contact_id=c["id"])
    payload = {"type": "call", "description": "Called about budget", "deal_id": d["id"], "follow_up_date": "2026-11-20"}
    body = client.put(f"/api/activities/{a['id']}", json=payload).json()
    assert body["type"] == "call" and body["description"] == "Called about budget"
    assert body["contact_id"] is None and body["deal_id"] == d["id"]
    assert body["follow_up_status"] == "upcoming"
    assert body["occurred_at"] == a["occurred_at"]
    response = client.put(f"/api/activities/{a['id']}", json={"type": "call", "description": "x"})
    assert response.json()["detail"] == "Choose a contact, a deal or both"


def test_a_new_follow_up_date_opens_the_task_again(client, linked, activity):  # RULE-7 API-7
    c, _ = linked
    a = activity(contact_id=c["id"], follow_up_date="2026-11-12")
    client.patch(f"/api/activities/{a['id']}/done", json={})
    payload = {"type": "note", "description": a["description"], "contact_id": c["id"]}
    same = client.put(f"/api/activities/{a['id']}", json=payload | {"follow_up_date": "2026-11-12"}).json()
    assert same["follow_up_done"] is True  # an edit that keeps the date leaves it done
    moved = client.put(f"/api/activities/{a['id']}", json=payload | {"follow_up_date": "2026-11-24"}).json()
    assert moved["follow_up_done"] is False
    assert moved["follow_up_status"] == "upcoming"


def test_stage_change_entries_can_be_edited_only_in_text_and_time(client, linked):  # API-7 DATA-5
    _, d = linked
    client.patch(f"/api/deals/{d['id']}/move", json={"stage": "qualified"})
    entry = client.get(f"/api/deals/{d['id']}/timeline").json()[0]
    payload = {"type": "note", "description": "Qualified after the call", "occurred_at": "2026-11-16T10:00:00Z"}
    body = client.put(f"/api/activities/{entry['id']}", json=payload).json()
    assert body["type"] == "stage_change"
    assert body["description"] == "Qualified after the call"
    assert body["occurred_at"].startswith("2026-11-16T10:00")
    assert body["deal_id"] == d["id"]
    assert body["to_stage"] == "qualified"


def test_stage_change_entries_can_be_deleted(client, linked):  # API-7
    _, d = linked
    client.patch(f"/api/deals/{d['id']}/move", json={"stage": "qualified"})
    entry = client.get(f"/api/deals/{d['id']}/timeline").json()[0]
    assert client.get(f"/api/activities/{entry['id']}/delete-impact").json() == {"stage_change": True}
    assert client.delete(f"/api/activities/{entry['id']}").status_code == 204
    assert client.get(f"/api/deals/{d['id']}/timeline").json() == []
    assert client.get(f"/api/deals/{d['id']}").json()["stage"] == "qualified"


def test_timeline_of_unknown_record_is_404(client):  # API-6
    assert client.get("/api/contacts/999/timeline").status_code == 404
    assert client.get("/api/deals/999/timeline").status_code == 404
