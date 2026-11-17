"""Activity routes (API-7) and their request and response models (DATA-5, DATA-6)."""

from datetime import date, datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import AwareDatetime, BaseModel, ConfigDict, field_validator
from sqlalchemy.engine import Connection

from accountable.activities import data
from accountable.contacts import data as contacts_data
from accountable.db import get_conn
from accountable.deals import data as deals_data

router = APIRouter(tags=["activities"])
Conn = Annotated[Connection, Depends(get_conn)]

ActivityType = Literal["note", "call", "email"]


class ActivityIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    type: ActivityType = "note"
    description: str
    occurred_at: AwareDatetime | None = None
    contact_id: int | None = None
    deal_id: int | None = None
    follow_up_date: date | None = None

    @field_validator("description")
    @classmethod
    def _description(cls, v: str) -> str:
        if not v:
            raise ValueError("Enter a description")
        if len(v) > 5000:
            raise ValueError("Keep the description to 5,000 characters or fewer")
        return v


class DoneIn(BaseModel):
    done: bool = True


class ActivityOut(BaseModel):
    id: int
    type: Literal["note", "call", "email", "stage_change"]
    description: str
    occurred_at: datetime
    contact_id: int | None
    contact_name: str | None
    deal_id: int | None
    deal_name: str | None
    organization_id: int | None
    organization_name: str | None
    follow_up_date: date | None
    follow_up_done: bool
    follow_up_status: Literal["overdue", "today", "upcoming"] | None
    from_stage: str | None
    to_stage: str | None
    created_at: datetime
    updated_at: datetime


class ActivityDeleteImpact(BaseModel):
    stage_change: bool


def _get_or_404(conn: Connection, activity_id: int) -> dict:
    row = data.get(conn, activity_id)
    if row is None:
        raise HTTPException(404, "We couldn't find that activity")
    return row


def _check_links(conn: Connection, body: ActivityIn) -> None:
    if body.contact_id is None and body.deal_id is None:
        raise HTTPException(422, "Choose a contact, a deal or both")
    if body.contact_id is not None and not contacts_data.exists(conn, body.contact_id):
        raise HTTPException(422, "That contact doesn't exist")
    if body.deal_id is not None and not deals_data.exists(conn, body.deal_id):
        raise HTTPException(422, "That deal doesn't exist")


@router.post("/activities", response_model=ActivityOut, status_code=201)
def create_activity(body: ActivityIn, conn: Conn):
    _check_links(conn, body)
    return data.get(conn, data.create(conn, body.model_dump()))


@router.put("/activities/{activity_id}", response_model=ActivityOut)
def update_activity(activity_id: int, body: ActivityIn, conn: Conn):
    current = _get_or_404(conn, activity_id)
    fields = body.model_dump(exclude_unset=False)
    if current["type"] == data.STAGE_CHANGE:
        # REC-8: a stage-change entry keeps its type, links and stages; only its words and time change.
        changes = {"description": fields["description"]}
        if fields["occurred_at"] is not None:
            changes["occurred_at"] = fields["occurred_at"]
    else:
        was_linked = current["contact_id"] is not None or current["deal_id"] is not None
        if was_linked or body.contact_id is not None or body.deal_id is not None:
            _check_links(conn, body)
        changes = fields
        if changes["occurred_at"] is None:
            del changes["occurred_at"]
    data.update_one(conn, activity_id, changes)
    return data.get(conn, activity_id)


@router.patch("/activities/{activity_id}/done", response_model=ActivityOut)
def mark_done(activity_id: int, body: DoneIn, conn: Conn):
    _get_or_404(conn, activity_id)
    data.set_done(conn, activity_id, body.done)
    return data.get(conn, activity_id)


@router.get("/activities/{activity_id}/delete-impact", response_model=ActivityDeleteImpact)
def activity_delete_impact(activity_id: int, conn: Conn):
    row = _get_or_404(conn, activity_id)
    return {"stage_change": row["type"] == data.STAGE_CHANGE}


@router.delete("/activities/{activity_id}", status_code=204)
def delete_activity(activity_id: int, conn: Conn):
    _get_or_404(conn, activity_id)
    data.delete_one(conn, activity_id)
    return Response(status_code=204)
