"""Follow-up grouping (RULE-7)."""

from datetime import date

from accountable.activities import rules

TODAY = date(2026, 11, 17)


def test_follow_up_status():  # RULE-7
    assert rules.follow_up_status(date(2026, 11, 16), False, TODAY) == "overdue"
    assert rules.follow_up_status(TODAY, False, TODAY) == "today"
    assert rules.follow_up_status(date(2026, 11, 18), False, TODAY) == "upcoming"


def test_done_and_dateless_follow_ups_are_not_tasks():  # RULE-7
    assert rules.follow_up_status(date(2026, 11, 16), True, TODAY) is None
    assert rules.follow_up_status(None, False, TODAY) is None


def test_group_follow_ups_overdue_today_upcoming_in_date_order():  # RULE-7
    items = [
        {"id": 1, "follow_up_date": date(2026, 11, 20), "follow_up_done": False},
        {"id": 2, "follow_up_date": date(2026, 11, 12), "follow_up_done": False},
        {"id": 3, "follow_up_date": TODAY, "follow_up_done": False},
        {"id": 4, "follow_up_date": date(2026, 11, 14), "follow_up_done": False},
        {"id": 5, "follow_up_date": date(2026, 11, 10), "follow_up_done": True},
        {"id": 6, "follow_up_date": None, "follow_up_done": False},
        {"id": 7, "follow_up_date": date(2026, 11, 18), "follow_up_done": False},
    ]
    groups = rules.group_follow_ups(items, TODAY)
    assert [i["id"] for i in groups["overdue"]] == [2, 4]
    assert [i["id"] for i in groups["today"]] == [3]
    assert [i["id"] for i in groups["upcoming"]] == [7, 1]


def test_upcoming_can_be_limited_to_a_window():  # RULE-7
    items = [
        {"id": 1, "follow_up_date": date(2026, 12, 1), "follow_up_done": False},  # 14 days out
        {"id": 2, "follow_up_date": date(2026, 12, 2), "follow_up_done": False},  # 15 days out
    ]
    groups = rules.group_follow_ups(items, TODAY, upcoming_days=14)
    assert [i["id"] for i in groups["upcoming"]] == [1]
