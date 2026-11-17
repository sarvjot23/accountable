"""GET /api/dashboard: every dashboard figure in one response (API-9, DASH-1)."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.engine import Connection

from accountable.activities.api import ActivityOut
from accountable.dashboard import data
from accountable.db import get_conn

router = APIRouter(tags=["dashboard"])
Conn = Annotated[Connection, Depends(get_conn)]


class OpenPipeline(BaseModel):
    value: int
    count: int


class ExpectedRevenue(BaseModel):
    value: int
    share: int


class WonThisMonth(BaseModel):
    value: int
    count: int
    last_month_value: int
    change: int
    share_of_best_month: int


class LateDeals(BaseModel):
    count: int
    value: int
    share_of_open: int


class Month(BaseModel):
    month: str
    deals_won: int
    revenue_won: int


class FunnelStage(BaseModel):
    stage: str
    label: str
    value: int
    count: int
    share: int


class Funnel(BaseModel):
    stages: list[FunnelStage]
    new_to_won_share: int
    new_count: int
    won_count: int


class FollowUps(BaseModel):
    overdue: int
    due_today: int
    upcoming: int
    items: list[ActivityOut]


class Dashboard(BaseModel):
    today: date
    open_pipeline: OpenPipeline
    expected_revenue: ExpectedRevenue
    won_this_month: WonThisMonth
    late_deals: LateDeals
    monthly: list[Month]
    revenue_won_12_months: int
    deals_won_12_months: int
    funnel: Funnel
    follow_ups: FollowUps
    recent_activity: list[ActivityOut]


@router.get("/dashboard", response_model=Dashboard)
def dashboard(conn: Conn):
    return data.figures(conn)
