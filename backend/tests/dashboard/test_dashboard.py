"""GET /api/dashboard against a small hand-built data set, on 17 Nov 2026
(DASH-1, DASH-3 to DASH-6, DASH-11, DASH-13, RULE-13, RULE-14, API-9)."""

import pytest


@pytest.fixture
def data(org, contact, deal, activity):
    o = org(name="Bluepeak Retail")
    c = contact(organization_id=o["id"], first_name="Lena", last_name="Cho")
    deals = {
        "new": deal(organization_id=o["id"], stage="new", value=10_000, close_date="2027-01-10"),
        "late": deal(organization_id=o["id"], stage="proposal", value=20_000, close_date="2026-11-10"),
        "won_now": deal(organization_id=o["id"], stage="won", value=30_000, close_date="2026-11-05"),
        "won_last": deal(organization_id=o["id"], stage="won", value=15_000, close_date="2026-10-20"),
        "won_old": deal(organization_id=o["id"], stage="won", value=5_000, close_date="2025-11-30"),
        "lost": deal(organization_id=o["id"], stage="lost", value=8_000, close_date="2026-09-01"),
    }
    tasks = {
        "overdue": activity(contact_id=c["id"], follow_up_date="2026-11-12", occurred_at="2026-11-01T10:00:00Z"),
        "today": activity(contact_id=c["id"], follow_up_date="2026-11-17", occurred_at="2026-11-02T10:00:00Z"),
        "soon": activity(contact_id=c["id"], follow_up_date="2026-11-20", occurred_at="2026-11-03T10:00:00Z"),
        "far": activity(contact_id=c["id"], follow_up_date="2026-12-20", occurred_at="2026-11-04T10:00:00Z"),
    }
    return {"org": o, "contact": c, "deals": deals, "tasks": tasks}


def dashboard(client):
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    return response.json()


def test_open_pipeline(client, data):  # DASH-3 API-9
    assert dashboard(client)["open_pipeline"] == {"value": 30_000, "count": 2}


def test_expected_revenue_and_its_share(client, data):  # DASH-4
    assert dashboard(client)["expected_revenue"] == {"value": 1_000 + 10_000, "share": 37}


def test_won_this_month_and_change(client, data):  # DASH-5 RULE-13
    assert dashboard(client)["won_this_month"] == {
        "value": 30_000,
        "count": 1,
        "last_month_value": 15_000,
        "change": 15_000,
        "share_of_best_month": 100,
    }


def test_late_deals(client, data):  # DASH-6
    assert dashboard(client)["late_deals"] == {"count": 1, "value": 20_000, "share_of_open": 67}


def test_by_month_for_12_months(client, data):  # RULE-13
    body = dashboard(client)
    months = body["monthly"]
    assert len(months) == 12
    assert months[0]["month"] == "2025-12" and months[-1]["month"] == "2026-11"
    by_month = {m["month"]: (m["deals_won"], m["revenue_won"]) for m in months}
    assert by_month["2026-11"] == (1, 30_000)
    assert by_month["2026-10"] == (1, 15_000)
    assert sum(m["deals_won"] for m in months) == 2  # Nov 2025 is outside the 12 months
    assert body["revenue_won_12_months"] == 45_000
    assert body["deals_won_12_months"] == 2


def test_funnel(client, data):  # RULE-14 API-9
    funnel = dashboard(client)["funnel"]
    rows = {s["stage"]: (s["value"], s["count"], s["share"]) for s in funnel["stages"]}
    # New: both open deals, the two won in the window and the lost one; the old win is left out.
    assert rows["new"] == (83_000, 5, 100)
    assert rows["qualified"] == (65_000, 3, 78)  # the lost deal has no history, so it counts at New only
    assert rows["proposal"] == (65_000, 3, 78)
    assert rows["negotiation"] == (45_000, 2, 54)
    assert rows["won"] == (45_000, 2, 54)
    assert funnel["new_to_won_share"] == 54
    assert (funnel["new_count"], funnel["won_count"]) == (5, 2)
    assert [s["label"] for s in funnel["stages"]] == ["New", "Qualified", "Proposal", "Negotiation", "Won"]


def test_funnel_uses_stage_history(client, data):  # RULE-14
    lost = data["deals"]["lost"]
    client.patch(f"/api/deals/{lost['id']}/move", json={"stage": "negotiation"})
    client.patch(f"/api/deals/{lost['id']}/move", json={"stage": "lost"})
    rows = {s["stage"]: s["count"] for s in dashboard(client)["funnel"]["stages"]}
    assert rows["negotiation"] == 3  # it reached Negotiation before it was lost
    assert rows["won"] == 2


def test_follow_ups_overdue_first_then_next_14_days(client, data):  # DASH-11
    follow_ups = dashboard(client)["follow_ups"]
    assert (follow_ups["overdue"], follow_ups["due_today"], follow_ups["upcoming"]) == (1, 1, 1)
    tasks = data["tasks"]
    assert [i["id"] for i in follow_ups["items"]] == [tasks["overdue"]["id"], tasks["today"]["id"], tasks["soon"]["id"]]
    item = follow_ups["items"][0]
    assert item["follow_up_status"] == "overdue"
    assert item["contact_name"] == "Lena Cho"


def test_done_follow_ups_leave_the_list(client, data):  # DASH-11 DASH-1
    overdue = data["tasks"]["overdue"]
    client.patch(f"/api/activities/{overdue['id']}/done", json={"done": True})
    follow_ups = dashboard(client)["follow_ups"]
    assert follow_ups["overdue"] == 0
    assert overdue["id"] not in [i["id"] for i in follow_ups["items"]]


def test_recent_activity_is_the_15_newest_of_every_type(client, data, activity):  # DASH-13
    c = data["contact"]
    for day in range(1, 15):
        activity(contact_id=c["id"], occurred_at=f"2026-10-{day:02d}T09:00:00Z", description=f"Old {day}")
    late = data["deals"]["late"]
    client.patch(f"/api/deals/{late['id']}/move", json={"stage": "negotiation"})  # a stage change, now
    recent = dashboard(client)["recent_activity"]
    assert len(recent) == 15
    assert recent[0]["type"] == "stage_change"
    assert recent[0]["organization_name"] == "Bluepeak Retail"
    times = [a["occurred_at"] for a in recent]
    assert times == sorted(times, reverse=True)


def test_reflects_a_deal_marked_won_and_a_new_follow_up(client, data, activity):  # DASH-1
    before = dashboard(client)
    late = data["deals"]["late"]
    client.patch(f"/api/deals/{late['id']}/move", json={"stage": "won"})
    activity(contact_id=data["contact"]["id"], follow_up_date="2026-11-18")
    after = dashboard(client)
    assert after["won_this_month"]["value"] == before["won_this_month"]["value"] + 20_000
    assert after["open_pipeline"]["count"] == before["open_pipeline"]["count"] - 1
    assert after["late_deals"]["count"] == 0
    assert after["follow_ups"]["upcoming"] == before["follow_ups"]["upcoming"] + 1


def test_empty_dashboard(client):  # API-9
    body = dashboard(client)
    assert body["open_pipeline"] == {"value": 0, "count": 0}
    assert body["expected_revenue"]["share"] == 0
    assert body["won_this_month"]["share_of_best_month"] == 0
    assert body["follow_ups"]["items"] == [] and body["recent_activity"] == []
