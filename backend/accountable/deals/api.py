"""Deal routes (API-4, API-5, API-6) and their request and response models (DATA-4)."""

from datetime import date, datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.engine import Connection

from accountable import clock
from accountable.activities import data as activities_data
from accountable.activities.api import ActivityOut
from accountable.contacts import data as contacts_data
from accountable.db import get_conn
from accountable.deals import data, rules
from accountable.organizations import data as organizations_data

router = APIRouter(tags=["deals"])
Conn = Annotated[Connection, Depends(get_conn)]

StageKey = Literal["new", "qualified", "proposal", "negotiation", "won", "lost"]


class DealIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str
    organization_id: int | None = Field(default=None, validate_default=True)
    contact_id: int | None = None
    stage: StageKey = "new"
    value: int
    probability: int | None = None
    close_date: date | None = None

    @field_validator("name")
    @classmethod
    def _name(cls, v: str) -> str:
        if not v:
            raise ValueError("Enter a name")
        if len(v) > 160:
            raise ValueError("Keep the name to 160 characters or fewer")
        return v

    @field_validator("organization_id")
    @classmethod
    def _organization(cls, v: int | None) -> int:
        if v is None:
            raise ValueError("Choose an organization")
        return v

    @field_validator("value", mode="before")
    @classmethod
    def _value(cls, v):
        if isinstance(v, float) and not v.is_integer():
            raise ValueError("Enter the value in whole dollars")
        if v is None or (isinstance(v, (int, float)) and v < 0):
            raise ValueError("Enter a value of 0 or more")
        return v

    @field_validator("probability")
    @classmethod
    def _probability(cls, v: int | None) -> int | None:
        if v is not None and not 0 <= v <= 100:
            raise ValueError("Enter a probability from 0 to 100")
        return v


class MoveIn(BaseModel):
    """A card dropped on the board: its stage, and the cards just above (before) and below (after) it."""

    stage: StageKey
    before_id: int | None = None
    after_id: int | None = None


class DealOut(BaseModel):
    id: int
    name: str
    organization_id: int
    organization_name: str
    contact_id: int | None
    contact_name: str | None
    stage: StageKey
    value: int
    probability: int = Field(ge=0, le=100)
    probability_manual: bool
    close_date: date | None
    close_date_manual: bool
    position: float
    stage_changed_at: datetime
    expected_revenue: int
    is_late: bool
    created_at: datetime
    updated_at: datetime


class DealDeleteImpact(BaseModel):
    activities: int


def deal_out(row: dict) -> dict:
    """A deal with its expected revenue (RULE-1) and whether it's late (RULE-6)."""
    return row | {
        "expected_revenue": rules.expected_revenue(row["value"], row["probability"]),
        "is_late": rules.is_late(row["stage"], row["close_date"], clock.today()),
    }


def _get_or_404(conn: Connection, deal_id: int) -> dict:
    row = data.get(conn, deal_id)
    if row is None:
        raise HTTPException(404, "We couldn't find that deal")
    return row


def _check_links(conn: Connection, body: DealIn) -> None:
    if body.organization_id is None or not organizations_data.exists(conn, body.organization_id):
        raise HTTPException(422, "That organization doesn't exist")
    if body.contact_id is not None and not contacts_data.exists(conn, body.contact_id):
        raise HTTPException(422, "That contact doesn't exist")


@router.get("/deals", response_model=list[DealOut])
def list_deals(conn: Conn):
    return [deal_out(d) for d in data.list_all(conn)]


@router.post("/deals", response_model=DealOut, status_code=201)
def create_deal(body: DealIn, conn: Conn):
    _check_links(conn, body)
    return deal_out(_get_or_404(conn, data.create(conn, body.model_dump())))


@router.get("/deals/{deal_id}", response_model=DealOut)
def get_deal(deal_id: int, conn: Conn):
    return deal_out(_get_or_404(conn, deal_id))


@router.put("/deals/{deal_id}", response_model=DealOut)
def update_deal(deal_id: int, body: DealIn, conn: Conn):
    current = _get_or_404(conn, deal_id)
    _check_links(conn, body)
    submitted = body.model_dump()
    if submitted["probability"] is None:
        del submitted["probability"]
    data.edit(conn, current, submitted)
    return deal_out(_get_or_404(conn, deal_id))


@router.patch("/deals/{deal_id}/move", response_model=DealOut)
def move_deal(deal_id: int, body: MoveIn, conn: Conn):
    current = _get_or_404(conn, deal_id)
    try:
        data.move(conn, current, body.stage, body.before_id, body.after_id)
    except ValueError:
        raise HTTPException(422, "The board changed while you were moving that card. Refresh and try again.") from None
    return deal_out(_get_or_404(conn, deal_id))


@router.get("/deals/{deal_id}/timeline", response_model=list[ActivityOut])
def deal_timeline(deal_id: int, conn: Conn):
    _get_or_404(conn, deal_id)
    return activities_data.timeline(conn, deal_id=deal_id)


@router.get("/deals/{deal_id}/delete-impact", response_model=DealDeleteImpact)
def deal_delete_impact(deal_id: int, conn: Conn):
    _get_or_404(conn, deal_id)
    return data.delete_impact(conn, deal_id)


@router.delete("/deals/{deal_id}", status_code=204)
def delete_deal(deal_id: int, conn: Conn):
    _get_or_404(conn, deal_id)
    data.delete_one(conn, deal_id)
    return Response(status_code=204)
