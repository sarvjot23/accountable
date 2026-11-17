"""One "today" for rules and figures (RULE-15)."""

from datetime import UTC, date, datetime

from accountable import clock


def test_fixed_today_and_now():  # RULE-15
    assert clock.today() == date(2026, 11, 17)
    assert clock.now() == datetime(2026, 11, 17, 15, 30, tzinfo=UTC)


def test_real_clock_when_not_fixed():  # RULE-15
    clock.fix(None)
    assert clock.today() == datetime.now().date()
    assert clock.now().tzinfo is UTC


def test_late_follows_the_one_today(client, org, deal):  # RULE-15
    d = deal(organization_id=org()["id"], stage="proposal", close_date="2026-11-16")
    assert client.get(f"/api/deals/{d['id']}").json()["is_late"] is True
    clock.fix(date(2026, 11, 15))
    assert client.get(f"/api/deals/{d['id']}").json()["is_late"] is False


def test_dashboard_figures_follow_the_one_today(client, org, deal):  # RULE-15
    o = org()
    d = deal(organization_id=o["id"], stage="proposal")
    client.patch(f"/api/deals/{d['id']}/move", json={"stage": "won"})
    body = client.get("/api/dashboard").json()
    assert body["today"] == "2026-11-17"
    assert body["monthly"][-1]["month"] == "2026-11"
    assert body["won_this_month"]["value"] == 10_000
    clock.fix(date(2026, 12, 2))
    body = client.get("/api/dashboard").json()
    assert body["monthly"][-1]["month"] == "2026-12"
    assert body["won_this_month"]["value"] == 0
    assert body["won_this_month"]["last_month_value"] == 10_000


def test_stage_change_uses_the_one_now(client, org, deal):  # RULE-15
    d = deal(organization_id=org()["id"])
    body = client.patch(f"/api/deals/{d['id']}/move", json={"stage": "qualified"}).json()
    assert datetime.fromisoformat(body["stage_changed_at"]) == clock.now()
