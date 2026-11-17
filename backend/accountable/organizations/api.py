"""Organization routes (API-2) and their request and response models (DATA-2)."""

import re
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, ConfigDict, field_validator
from sqlalchemy.engine import Connection

from accountable.contacts import data as contacts_data
from accountable.contacts.api import ContactOut
from accountable.db import get_conn
from accountable.deals import data as deals_data
from accountable.deals.api import DealOut, deal_out
from accountable.organizations import data

router = APIRouter(tags=["organizations"])
Conn = Annotated[Connection, Depends(get_conn)]

_WEB_ADDRESS = re.compile(r"^(https?://)?([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?(/\S*)?$", re.IGNORECASE)


class OrganizationIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str
    website: str | None = None
    industry: str | None = None
    notes: str | None = None

    @field_validator("name")
    @classmethod
    def _name(cls, v: str) -> str:
        if not v:
            raise ValueError("Enter a name")
        if len(v) > 120:
            raise ValueError("Keep the name to 120 characters or fewer")
        return v

    @field_validator("website")
    @classmethod
    def _website(cls, v: str | None) -> str | None:
        if not v:
            return None
        if len(v) > 300 or not _WEB_ADDRESS.match(v):
            raise ValueError("Enter a web address, such as northwind.com")
        return v if re.match(r"^https?://", v, re.IGNORECASE) else f"https://{v}"

    @field_validator("industry")
    @classmethod
    def _industry(cls, v: str | None) -> str | None:
        if v and len(v) > 80:
            raise ValueError("Keep the industry to 80 characters or fewer")
        return v or None

    @field_validator("notes")
    @classmethod
    def _notes(cls, v: str | None) -> str | None:
        if v and len(v) > 5000:
            raise ValueError("Keep the notes to 5,000 characters or fewer")
        return v or None


class OrganizationOut(BaseModel):
    id: int
    name: str
    website: str | None
    industry: str | None
    notes: str | None
    contacts_count: int
    open_deals_count: int
    open_value: int
    created_at: datetime
    updated_at: datetime


class OrganizationDetail(OrganizationOut):
    contacts: list[ContactOut]
    deals: list[DealOut]


class OrganizationDeleteImpact(BaseModel):
    contacts: int
    deals: int
    activities: int


def _get_or_404(conn: Connection, organization_id: int) -> dict:
    row = data.get(conn, organization_id)
    if row is None:
        raise HTTPException(404, "We couldn't find that organization")
    return row


@router.get("/organizations", response_model=list[OrganizationOut])
def list_organizations(conn: Conn):
    return data.list_all(conn)


@router.post("/organizations", response_model=OrganizationOut, status_code=201)
def create_organization(body: OrganizationIn, conn: Conn):
    return data.get(conn, data.create(conn, body.model_dump()))


@router.get("/organizations/{organization_id}", response_model=OrganizationDetail)
def get_organization(organization_id: int, conn: Conn):
    row = _get_or_404(conn, organization_id)
    return row | {
        "contacts": contacts_data.list_all(conn, organization_id=organization_id),
        "deals": [deal_out(d) for d in deals_data.list_all(conn, organization_id=organization_id)],
    }


@router.put("/organizations/{organization_id}", response_model=OrganizationOut)
def update_organization(organization_id: int, body: OrganizationIn, conn: Conn):
    _get_or_404(conn, organization_id)
    data.update_one(conn, organization_id, body.model_dump())
    return data.get(conn, organization_id)


@router.get("/organizations/{organization_id}/delete-impact", response_model=OrganizationDeleteImpact)
def organization_delete_impact(organization_id: int, conn: Conn):
    _get_or_404(conn, organization_id)
    return data.delete_impact(conn, organization_id)


@router.delete("/organizations/{organization_id}", status_code=204)
def delete_organization(organization_id: int, conn: Conn):
    _get_or_404(conn, organization_id)
    data.delete_one(conn, organization_id)
    return Response(status_code=204)
