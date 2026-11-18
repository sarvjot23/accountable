"""Deal and pipeline rules, as plain functions with no database access (RULE-16).

Deals are passed in as mappings with the table's field names.
"""

from collections.abc import Iterable, Mapping, Sequence
from datetime import date, datetime
from typing import Any

from accountable.deals.stages import OPEN_STAGES, stage

FUNNEL_STAGES = ("new", "qualified", "proposal", "negotiation", "won")
MIN_GAP = 1e-6  # positions closer than this get the column renumbered


def expected_revenue(value: int, probability: int) -> int:
    """RULE-1: value × probability ÷ 100, rounded half up to the dollar."""
    return (value * probability + 50) // 100


def open_totals(deals: Iterable[Mapping]) -> dict:
    """RULE-2: count, value and expected revenue of the open deals only."""
    open_deals = [d for d in deals if d["stage"] in OPEN_STAGES]
    return {
        "count": len(open_deals),
        "value": sum(d["value"] for d in open_deals),
        "expected_revenue": sum(expected_revenue(d["value"], d["probability"]) for d in open_deals),
    }


def is_late(stage_key: str, close_date: date | None, today: date) -> bool:
    """RULE-6: open, with a close date before today."""
    return stage_key in OPEN_STAGES and close_date is not None and close_date < today


def stage_change(deal: Mapping, new_stage: str, today: date, now: datetime) -> dict:
    """RULE-3 and RULE-4: the field changes when a deal moves to `new_stage` ({} if it doesn't move)."""
    target = stage(new_stage)
    if deal["stage"] == new_stage:
        return {}
    changes = {
        "stage": new_stage,
        "probability": target.probability,
        "probability_manual": False,
        "stage_changed_at": now,
    }
    if not target.open and not deal["close_date_manual"]:
        changes["close_date"] = today
    return changes


def new_deal(stage_key: str, probability: int | None, close_date: date | None, today: date) -> dict:
    """A new deal's probability and close date (RULE-5): the stage's usual probability unless one
    is given (then it's manual); a close date given in the form is manual, the same as when it's
    edited later; with none, today if it's added straight into Won or Lost."""
    target = stage(stage_key)
    manual = probability is not None and probability != target.probability
    date_manual = close_date is not None
    if not target.open and close_date is None:
        close_date = today
    return {
        "probability": probability if probability is not None else target.probability,
        "probability_manual": manual,
        "close_date": close_date,
        "close_date_manual": date_manual,
    }


def stage_change_description(from_stage: str, to_stage: str) -> str:
    return f"Moved from {stage(from_stage).label} to {stage(to_stage).label}"


def edit_deal(current: Mapping, submitted: Mapping, today: date, now: datetime) -> tuple[dict, bool]:
    """RULE-3 and RULE-5 for the deal form.

    `submitted` holds the form's fields. Returns the changes to save, and whether the stage
    changed (so the caller adds the stage-change entry). A probability that differs from the
    saved one was set by hand; so was a close date that differs.
    """
    changes = {k: v for k, v in submitted.items() if k not in ("stage", "probability", "close_date")}
    moved = "stage" in submitted and submitted["stage"] != current["stage"]
    if moved:
        changes |= stage_change(current, submitted["stage"], today, now)

    if "probability" in submitted and submitted["probability"] != current["probability"]:
        changes["probability"] = submitted["probability"]
        changes["probability_manual"] = True

    if "close_date" in submitted and submitted["close_date"] != current["close_date"]:
        changes["close_date"] = submitted["close_date"]
        changes["close_date_manual"] = submitted["close_date"] is not None
    return changes, moved


def end_position(positions: Iterable[float]) -> float:
    """The position for a card added at the end of a column."""
    return max(positions, default=0.0) + 1.0


def drop_position(
    column: Sequence[tuple[int, float]], before_id: int | None, after_id: int | None
) -> tuple[float, dict[int, float]]:
    """PIPE-15: where a dropped card goes.

    `column` is the target column in order, as (id, position), without the moved card.
    `before_id` is the card that ends up just above it, `after_id` the one just below.
    Returns the card's new position and, if the gap was too small, new positions for the
    rest of the column.
    """
    ids = [card_id for card_id, _ in column]
    try:
        if before_id is not None:
            index = ids.index(before_id) + 1
        elif after_id is not None:
            index = ids.index(after_id)
        else:
            index = len(ids)
    except ValueError:
        raise ValueError("That card isn't in this column") from None

    above = column[index - 1][1] if index > 0 else None
    below = column[index][1] if index < len(column) else None
    if above is None:
        return (1.0 if below is None else below - 1.0), {}
    if below is None:
        return above + 1.0, {}
    if below - above > MIN_GAP:
        return (above + below) / 2, {}
    renumbered = {card_id: float(i + 1 if i < index else i + 2) for i, (card_id, _) in enumerate(column)}
    return float(index + 1), renumbered


def month_start(d: date) -> date:
    return d.replace(day=1)


def add_months(d: date, months: int) -> date:
    """The first day of the month `months` away from d's month."""
    total = d.year * 12 + (d.month - 1) + months
    return date(total // 12, total % 12 + 1, 1)


def window_start(today: date, months: int = 12) -> date:
    """The first day of the 12-month window that ends with this month."""
    return add_months(month_start(today), -(months - 1))


def furthest_stage(current: str, history: Iterable[str]) -> int:
    """RULE-14: the index in FUNNEL_STAGES of the furthest stage a deal reached (Lost doesn't count)."""
    reached = [FUNNEL_STAGES.index(s) for s in [current, *history] if s in FUNNEL_STAGES]
    return max(reached, default=0)


def funnel(deals: Iterable[Mapping], history: Mapping[int, Iterable[str]], today: date) -> dict:
    """RULE-14: value and count reaching each stage, and its share of the value at New.

    `history` maps a deal id to the stages its stage-change entries mention.
    """
    start = window_start(today)
    totals = [{"value": 0, "count": 0} for _ in FUNNEL_STAGES]
    for d in deals:
        if d["stage"] not in OPEN_STAGES and (d["close_date"] is None or d["close_date"] < start):
            continue
        reached = furthest_stage(d["stage"], history.get(d["id"], ()))
        for i in range(reached + 1):
            totals[i]["value"] += d["value"]
            totals[i]["count"] += 1

    at_new = totals[0]["value"]

    def share(value: int) -> int:
        return round(value * 100 / at_new) if at_new else 0

    stages = [
        {"stage": key, "label": stage(key).label, **t, "share": share(t["value"])}
        for key, t in zip(FUNNEL_STAGES, totals, strict=True)
    ]
    return {
        "stages": stages,
        "new_to_won_share": share(totals[-1]["value"]),
        "new_count": totals[0]["count"],
        "won_count": totals[-1]["count"],
    }


def won_by_month(deals: Iterable[Mapping], today: date, months: int = 12) -> list[dict]:
    """RULE-13: deals and revenue won in each of the last `months` months, oldest first."""
    starts = [add_months(month_start(today), -i) for i in range(months - 1, -1, -1)]
    rows: dict[date, dict[str, Any]] = {
        s: {"month": s.isoformat()[:7], "deals_won": 0, "revenue_won": 0} for s in starts
    }
    for d in deals:
        if d["stage"] != "won" or d["close_date"] is None:
            continue
        key = month_start(d["close_date"])
        if key in rows:
            rows[key]["deals_won"] += 1
            rows[key]["revenue_won"] += d["value"]
    return list(rows.values())
