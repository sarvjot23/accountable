"""Follow-up rules (RULE-7), as plain functions with no database access (RULE-16)."""

from collections.abc import Iterable, Mapping
from datetime import date
from typing import Literal

FollowUpStatus = Literal["overdue", "today", "upcoming"]


def follow_up_status(follow_up_date: date | None, done: bool, today: date) -> FollowUpStatus | None:
    """An activity with a follow-up date that isn't done is a task: overdue, due today or upcoming."""
    if follow_up_date is None or done:
        return None
    if follow_up_date < today:
        return "overdue"
    if follow_up_date == today:
        return "today"
    return "upcoming"


def group_follow_ups(items: Iterable[Mapping], today: date, upcoming_days: int | None = None) -> dict[str, list]:
    """Open tasks grouped into overdue, today and upcoming, each in date order.

    With `upcoming_days`, upcoming tasks further out than that are left out.
    """
    groups: dict[str, list] = {"overdue": [], "today": [], "upcoming": []}
    for item in items:
        status = follow_up_status(item["follow_up_date"], item["follow_up_done"], today)
        if status is None:
            continue
        if status == "upcoming" and upcoming_days is not None:
            if (item["follow_up_date"] - today).days > upcoming_days:
                continue
        groups[status].append(item)
    for group in groups.values():
        group.sort(key=lambda i: (i["follow_up_date"], i.get("id", 0)))
    return groups
