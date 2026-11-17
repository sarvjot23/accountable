"""Every figure behind the dashboard, worked out in one pass (DASH-1)."""

from sqlalchemy.engine import Connection

from accountable import clock
from accountable.activities import data as activities_data
from accountable.activities import rules as activity_rules
from accountable.deals import data as deals_data
from accountable.deals import rules as deal_rules

FOLLOW_UP_DAYS = 14
RECENT_ACTIVITY = 15


def _share(part: int, whole: int) -> int:
    return round(part * 100 / whole) if whole else 0


def figures(conn: Connection) -> dict:
    today = clock.today()
    deals = deals_data.list_all(conn)

    open_totals = deal_rules.open_totals(deals)  # RULE-2
    monthly = deal_rules.won_by_month(deals, today)  # RULE-13
    this_month, last_month = monthly[-1], monthly[-2]
    late = [d for d in deals if deal_rules.is_late(d["stage"], d["close_date"], today)]  # RULE-6
    funnel = deal_rules.funnel(deals, activities_data.stage_history(conn), today)  # RULE-14
    groups = activity_rules.group_follow_ups(  # RULE-7
        activities_data.open_follow_ups(conn), today, upcoming_days=FOLLOW_UP_DAYS
    )

    return {
        "today": today,
        "open_pipeline": {"value": open_totals["value"], "count": open_totals["count"]},
        "expected_revenue": {
            "value": open_totals["expected_revenue"],
            "share": _share(open_totals["expected_revenue"], open_totals["value"]),
        },
        "won_this_month": {
            "value": this_month["revenue_won"],
            "count": this_month["deals_won"],
            "last_month_value": last_month["revenue_won"],
            "change": this_month["revenue_won"] - last_month["revenue_won"],
            "share_of_best_month": _share(this_month["revenue_won"], max(m["revenue_won"] for m in monthly)),
        },
        "late_deals": {
            "count": len(late),
            "value": sum(d["value"] for d in late),
            "share_of_open": _share(sum(d["value"] for d in late), open_totals["value"]),
        },
        "monthly": monthly,
        "revenue_won_12_months": sum(m["revenue_won"] for m in monthly),
        "deals_won_12_months": sum(m["deals_won"] for m in monthly),
        "funnel": funnel,
        "follow_ups": {
            "overdue": len(groups["overdue"]),
            "due_today": len(groups["today"]),
            "upcoming": len(groups["upcoming"]),
            "items": groups["overdue"] + groups["today"] + groups["upcoming"],
        },
        "recent_activity": activities_data.recent(conn, RECENT_ACTIVITY),
    }
