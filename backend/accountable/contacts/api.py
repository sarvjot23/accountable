"""Contact routes (API-3, API-6) and their request and response models (DATA-3)."""

from datetime import datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, ConfigDict, EmailStr, ValidationInfo, field_validator
from sqlalchemy.engine import Connection

from accountable.activities import data as activities_data
from accountable.activities.api import ActivityOut
from accountable.contacts import data
from accountable.db import get_conn
from accountable.deals import data as deals_data
from accountable.deals.api import DealOut, deal_out
from accountable.organizations import data as organizations_data

router = APIRouter(tags=["contacts"])
Conn = Annotated[Connection, Depends(get_conn)]

Status = Literal["lead", "qualified", "customer"]

_OPTIONAL_LIMITS = {"last_name": ("last name", 80), "phone": ("phone number", 40), "job_title": ("job title", 120)}


def _limit(label: str, size: int):
    def check(v: str | None) -> str | None:
        if v and len(v) > size:
            raise ValueError(f"Keep the {label} to {size} characters or fewer")
        return v or None

    return check


class ContactIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    first_name: str
    last_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    job_title: str | None = None
    organization_id: int | None = None
    status: Status = "lead"

    @field_validator("first_name")
    @classmethod
    def _first_name(cls, v: str) -> str:
        if not v:
            raise ValueError("Enter a first name")
        return _limit("first name", 80)(v)

    @field_validator("email", mode="before")
    @classmethod
    def _email(cls, v):
        if isinstance(v, str) and not v.strip():
            return None
        if isinstance(v, str) and "@" not in v:
            raise ValueError("Enter an email address, such as sam@northwind.com")
        return v

    @field_validator("last_name", "phone", "job_title")
    @classmethod
    def _optional_text(cls, v: str | None, info: ValidationInfo) -> str | None:
        label, size = _OPTIONAL_LIMITS[str(info.field_name)]
        return _limit(label, size)(v)


class ContactOut(BaseModel):
    id: int
    first_name: str
    last_name: str | None
    name: str
    email: str | None
    phone: str | None
    job_title: str | None
    organization_id: int | None
    organization_name: str | None
    status: Status
    created_at: datetime
    updated_at: datetime


class ContactDetail(ContactOut):
    deals: list[DealOut]


class ContactDeleteImpact(BaseModel):
    activities: int
    deals: int


def _get_or_404(conn: Connection, contact_id: int) -> dict:
    row = data.get(conn, contact_id)
    if row is None:
        raise HTTPException(404, "We couldn't find that contact")
    return row


def _check_links(conn: Connection, body: ContactIn) -> None:
    if body.organization_id is not None and not organizations_data.exists(conn, body.organization_id):
        raise HTTPException(422, "That organization doesn't exist")


@router.get("/contacts", response_model=list[ContactOut])
def list_contacts(conn: Conn, status: Status | None = None):
    return data.list_all(conn, status=status)


@router.post("/contacts", response_model=ContactOut, status_code=201)
def create_contact(body: ContactIn, conn: Conn):
    _check_links(conn, body)
    return data.get(conn, data.create(conn, body.model_dump()))


@router.get("/contacts/{contact_id}", response_model=ContactDetail)
def get_contact(contact_id: int, conn: Conn):
    row = _get_or_404(conn, contact_id)
    return row | {"deals": [deal_out(d) for d in deals_data.list_all(conn, contact_id=contact_id)]}


@router.put("/contacts/{contact_id}", response_model=ContactOut)
def update_contact(contact_id: int, body: ContactIn, conn: Conn):
    _get_or_404(conn, contact_id)
    _check_links(conn, body)
    data.update_one(conn, contact_id, body.model_dump())
    return data.get(conn, contact_id)


@router.get("/contacts/{contact_id}/timeline", response_model=list[ActivityOut])
def contact_timeline(contact_id: int, conn: Conn):
    _get_or_404(conn, contact_id)
    return activities_data.timeline(conn, contact_id=contact_id)


@router.get("/contacts/{contact_id}/delete-impact", response_model=ContactDeleteImpact)
def contact_delete_impact(contact_id: int, conn: Conn):
    _get_or_404(conn, contact_id)
    return data.delete_impact(conn, contact_id)


@router.delete("/contacts/{contact_id}", status_code=204)
def delete_contact(contact_id: int, conn: Conn):
    _get_or_404(conn, contact_id)
    data.delete_one(conn, contact_id)
    return Response(status_code=204)
