"""The sample data (SEED-1 to SEED-5, APP-6).

The data is built from today, so its figures are checked by rule, not hard-coded.
"""

from collections import Counter
from datetime import date

import pytest

from accountable import clock
from accountable.seed import seed


@pytest.fixture
def seeded(client, conn):
    seed(conn)
    conn.commit()
    return client


def get(client, path):
    return client.get(path).json()


def test_six_organizations_across_industries(seeded):  # SEED-2
    orgs = get(seeded, "/api/organizations")
    assert len(orgs) == 6
    assert {o["industry"] for o in orgs} == {
        "Healthcare",
        "Logistics",
        "Retail",
        "Finance",
        "Manufacturing",
        "Education",
    }


def test_fifteen_contacts_at_every_status(seeded):  # SEED-3
    people = get(seeded, "/api/contacts")
    assert len(people) == 15
    assert Counter(c["status"] for c in people) == {"lead": 6, "qualified": 4, "customer": 5}
    per_org = Counter(c["organization_id"] for c in people)
    assert all(2 <= n <= 3 for n in per_org.values())


def test_about_twenty_deals_at_every_stage(seeded):  # SEED-4
    deals = get(seeded, "/api/deals")
    assert len(deals) == 20
    stages = Counter(d["stage"] for d in deals)
    assert stages == {"new": 2, "qualified": 2, "proposal": 2, "negotiation": 2, "won": 10, "lost": 2}
    assert sum(d["is_late"] for d in deals) == 2
    assert min(d["value"] for d in deals) == 8_000
    assert max(d["value"] for d in deals) == 180_000


def test_won_deals_fill_most_months(seeded):  # SEED-4
    monthly = get(seeded, "/api/dashboard")["monthly"]
    assert sum(m["deals_won"] for m in monthly) == 10
    assert sum(1 for m in monthly if m["revenue_won"] > 0) >= 9
    assert monthly[-1]["revenue_won"] > 0  # something won this month


def test_about_forty_activities_with_histories_and_follow_ups(seeded, conn):  # SEED-5
    from sqlalchemy import func, select

    from accountable.activities.data import activities

    total = conn.scalar(select(func.count()).select_from(activities))
    assert 35 <= total <= 45
    kinds = Counter(conn.scalars(select(activities.c.type)))
    assert set(kinds) == {"note", "call", "email", "stage_change"}

    follow_ups = get(seeded, "/api/dashboard")["follow_ups"]
    assert follow_ups["overdue"] == 2
    upcoming = [i for i in follow_ups["items"] if i["follow_up_status"] == "upcoming"]
    assert len(upcoming) == 3
    assert all((date.fromisoformat(i["follow_up_date"]) - clock.today()).days <= 7 for i in upcoming)


def test_every_deal_has_its_stage_history(seeded):  # SEED-5
    for d in get(seeded, "/api/deals"):
        entries = [a for a in get(seeded, f"/api/deals/{d['id']}/timeline") if a["type"] == "stage_change"]
        if d["stage"] != "new":
            assert entries, d["name"]
            assert entries[0]["to_stage"] == d["stage"]  # newest entry ends at the current stage


def test_dates_are_worked_out_from_today(seeded):  # SEED-1
    today = clock.today()
    deals = get(seeded, "/api/deals")
    for d in deals:
        close = date.fromisoformat(d["close_date"])
        if d["stage"] in ("won", "lost"):
            assert close <= today
    late = [d for d in deals if d["is_late"]]
    assert all(date.fromisoformat(d["close_date"]) < today for d in late)


def test_seed_on_a_month_start_still_has_this_month(client, conn):  # SEED-1
    clock.fix(date(2027, 3, 1))
    seed(conn)
    conn.commit()
    monthly = get(client, "/api/dashboard")["monthly"]
    assert monthly[-1]["month"] == "2027-03"
    assert monthly[-1]["deals_won"] == 1


def test_seeding_twice_gives_the_same_counts(seeded, conn):  # SEED-1 APP-6
    before = [len(get(seeded, f"/api/{kind}")) for kind in ("organizations", "contacts", "deals")]
    dashboard_before = get(seeded, "/api/dashboard")
    seed(conn)
    conn.commit()
    after = [len(get(seeded, f"/api/{kind}")) for kind in ("organizations", "contacts", "deals")]
    assert before == after == [6, 15, 20]
    dashboard_after = get(seeded, "/api/dashboard")
    assert dashboard_before["open_pipeline"] == dashboard_after["open_pipeline"]
    assert len(dashboard_before["recent_activity"]) == len(dashboard_after["recent_activity"]) == 15


def test_seed_command_resets_changes(seeded, conn):  # APP-6
    org_id = get(seeded, "/api/organizations")[0]["id"]
    seeded.delete(f"/api/organizations/{org_id}")
    seeded.post("/api/organizations", json={"name": "Extra"})
    seed(conn)
    conn.commit()
    names = {o["name"] for o in get(seeded, "/api/organizations")}
    assert "Extra" not in names and len(names) == 6
