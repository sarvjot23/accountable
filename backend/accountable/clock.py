"""The one place the date and time come from (RULE-15).

Always call `clock.today()` and `clock.now()` through the module, so tests can fix them
with `clock.fix(...)`.
"""

from datetime import UTC, date, datetime

_fixed_now: datetime | None = None
_fixed_today: date | None = None


def now() -> datetime:
    """The current moment, timezone-aware in UTC."""
    return _fixed_now if _fixed_now is not None else datetime.now(UTC)


def today() -> date:
    """Today's date on this computer (its local date)."""
    if _fixed_today is not None:
        return _fixed_today
    return datetime.now().date()


def fix(today_: date | None, now_: datetime | None = None) -> None:
    """Fix "today" (and "now") for tests. `fix(None)` goes back to the real clock."""
    global _fixed_now, _fixed_today
    _fixed_today = today_
    if today_ is not None and now_ is None:
        now_ = datetime(today_.year, today_.month, today_.day, 12, 0, tzinfo=UTC)
    _fixed_now = now_
