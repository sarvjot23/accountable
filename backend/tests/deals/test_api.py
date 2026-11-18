"""Deal routes, field rules, stage changes and moves (DATA-4, RULE-3, API-4, API-5, PIPE-16)."""

import pytest


@pytest.fixture
def org_id(org):
    return org()["id"]


def test_create_takes_the_stage_probability(client, deal, org_id):  # DATA-4 API-4
    body = deal(organization_id=org_id, stage="qualified", value=65_000)
    assert body["stage"] == "qualified"
    assert body["probability"] == 25
    assert body["probability_manual"] is False
    assert body["expected_revenue"] == 16_250
    assert body["is_late"] is False
    assert body["organization_name"] == "Northwind Labs"


def test_new_deals_start_at_new(client, deal, org_id):  # DATA-4
    assert deal(organization_id=org_id)["stage"] == "new"


def test_a_deal_without_an_organization_is_refused(client):  # DATA-4
    response = client.post("/api/deals", json={"name": "Cloud migration", "value": 10_000})
    assert response.status_code == 422
    assert response.json()["detail"] == "Choose an organization"
    response = client.post("/api/deals", json={"name": "Cloud", "value": 1, "organization_id": 999})
    assert response.json()["detail"] == "That organization doesn't exist"


@pytest.mark.parametrize(
    ("fields", "message"),
    [
        ({"name": ""}, "Enter a name"),
        ({"name": "x" * 161}, "Keep the name to 160 characters or fewer"),
        ({"value": -1}, "Enter a value of 0 or more"),
        ({"value": 10.5}, "Enter the value in whole dollars"),
        ({"probability": 101}, "Enter a probability from 0 to 100"),
        ({"stage": "pending"}, None),
    ],
)
def test_field_rules(client, org_id, fields, message):  # DATA-4
    payload = {"name": "Cloud", "value": 100, "organization_id": org_id} | fields
    response = client.post("/api/deals", json=payload)
    assert response.status_code == 422
    if message:
        assert response.json()["detail"] == message


def test_late_in_responses(client, deal, org_id):  # API-4
    late = deal(organization_id=org_id, stage="proposal", close_date="2026-11-10")
    assert late["is_late"] is True
    due_today = deal(organization_id=org_id, stage="proposal", close_date="2026-11-17")
    assert due_today["is_late"] is False
    listed = {d["id"]: d for d in client.get("/api/deals").json()}
    assert listed[late["id"]]["is_late"] is True


def test_put_updates_and_marks_manual_values(client, deal, org_id):  # API-4 DATA-4
    d = deal(organization_id=org_id, stage="proposal", value=10_000, close_date="2026-12-01")
    payload = {
        "name": "Cloud migration, phase 1",
        "organization_id": org_id,
        "stage": "proposal",
        "value": 12_000,
        "probability": 60,
        "close_date": "2026-12-15",
    }
    body = client.put(f"/api/deals/{d['id']}", json=payload).json()
    assert body["name"] == "Cloud migration, phase 1"
    assert body["probability"] == 60 and body["probability_manual"] is True
    assert body["close_date"] == "2026-12-15" and body["close_date_manual"] is True
    assert body["expected_revenue"] == 7_200


def timeline(client, deal_id):
    return client.get(f"/api/deals/{deal_id}/timeline").json()


def test_form_stage_change_applies_rule_3(client, deal, contact, org_id):  # RULE-3
    c = contact(organization_id=org_id)
    d = deal(organization_id=org_id, contact_id=c["id"], stage="proposal")
    payload = {"name": d["name"], "organization_id": org_id, "contact_id": c["id"], "stage": "won", "value": 10_000}
    body = client.put(f"/api/deals/{d['id']}", json=payload | {"probability": 50}).json()
    assert body["stage"] == "won"
    assert body["probability"] == 100
    assert body["close_date"] == "2026-11-17"
    entries = timeline(client, d["id"])
    assert len(entries) == 1
    assert entries[0]["type"] == "stage_change"
    assert entries[0]["description"] == "Moved from Proposal to Won"
    assert entries[0]["contact_id"] == c["id"]


def test_move_across_columns_writes_one_stage_change_entry(client, deal, org_id):  # PIPE-16 API-5 RULE-3
    d = deal(organization_id=org_id, stage="proposal", value=10_000)
    response = client.patch(f"/api/deals/{d['id']}/move", json={"stage": "negotiation"})
    assert response.status_code == 200
    body = response.json()
    assert body["stage"] == "negotiation"
    assert body["probability"] == 75
    assert body["expected_revenue"] == 7_500
    assert body["stage_changed_at"].startswith("2026-11-17T15:30")
    entries = timeline(client, d["id"])
    assert [e["description"] for e in entries] == ["Moved from Proposal to Negotiation"]
    assert entries[0]["from_stage"] == "proposal" and entries[0]["to_stage"] == "negotiation"


def test_move_within_a_column_changes_only_the_position(client, deal, org_id):  # PIPE-16 API-5
    a, b, c = (deal(organization_id=org_id, name=n, stage="new") for n in "abc")
    response = client.patch(
        f"/api/deals/{c['id']}/move", json={"stage": "new", "before_id": a["id"], "after_id": b["id"]}
    )
    body = response.json()
    assert body["stage"] == "new" and body["probability"] == 10
    assert a["position"] < body["position"] < b["position"]
    assert timeline(client, c["id"]) == []
    order = [d["name"] for d in client.get("/api/deals").json()]
    assert order == ["a", "c", "b"]


def test_move_to_the_top_of_another_column(client, deal, org_id):  # API-5
    top = deal(organization_id=org_id, stage="won", name="top")
    d = deal(organization_id=org_id, stage="new")
    body = client.patch(f"/api/deals/{d['id']}/move", json={"stage": "won", "after_id": top["id"]}).json()
    assert body["position"] < top["position"]
    assert body["close_date"] == "2026-11-17"


def test_move_with_a_neighbour_from_another_column_is_refused(client, deal, org_id):  # API-5 API-1
    a = deal(organization_id=org_id, stage="new")
    b = deal(organization_id=org_id, stage="qualified")
    response = client.patch(f"/api/deals/{a['id']}/move", json={"stage": "proposal", "before_id": b["id"]})
    assert response.status_code == 422
    assert "Refresh" in response.json()["detail"]


def test_moves_keep_a_manual_close_date(client, deal, org_id):  # RULE-3
    d = deal(organization_id=org_id, stage="proposal", close_date="2026-12-01")
    payload = {"name": d["name"], "organization_id": org_id, "stage": "proposal", "value": 10_000}
    client.put(f"/api/deals/{d['id']}", json=payload | {"close_date": "2026-11-12"})
    body = client.patch(f"/api/deals/{d['id']}/move", json={"stage": "won"}).json()
    assert body["close_date"] == "2026-11-12"


def test_stage_change_adds_the_card_at_the_end_of_its_new_column(client, deal, org_id):  # RULE-3
    first = deal(organization_id=org_id, stage="won")
    d = deal(organization_id=org_id, stage="new")
    payload = {"name": d["name"], "organization_id": org_id, "stage": "won", "value": 10_000}
    body = client.put(f"/api/deals/{d['id']}", json=payload).json()
    assert body["position"] > first["position"]


def test_unknown_deal_is_404(client):  # API-4
    assert client.get("/api/deals/999").json() == {"detail": "We couldn't find that deal"}
    assert client.patch("/api/deals/999/move", json={"stage": "new"}).status_code == 404
