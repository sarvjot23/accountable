"""The organizations table and its queries."""

from sqlalchemy import Column, Integer, String, Table, Text, delete, insert, select, update
from sqlalchemy.engine import Connection

from accountable import clock
from accountable.activities import data as activities_data
from accountable.contacts import data as contacts_data
from accountable.db import UtcDateTime, insert_id, metadata
from accountable.deals import data as deals_data

organizations = Table(
    "organizations",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String(120), nullable=False),
    Column("website", String(300)),
    Column("industry", String(80)),
    Column("notes", Text),
    Column("created_at", UtcDateTime, nullable=False),
    Column("updated_at", UtcDateTime, nullable=False),
)


def _with_summary(conn: Connection, rows) -> list[dict]:
    contact_counts = contacts_data.count_by_organization(conn)
    open_deals = deals_data.open_summary_by_organization(conn)
    out = []
    for row in rows:
        count, value = open_deals.get(row["id"], (0, 0))
        out.append(
            dict(row)
            | {"contacts_count": contact_counts.get(row["id"], 0), "open_deals_count": count, "open_value": value}
        )
    return out


def list_all(conn: Connection) -> list[dict]:
    rows = conn.execute(select(organizations).order_by(organizations.c.name, organizations.c.id)).mappings().all()
    return _with_summary(conn, rows)


def get(conn: Connection, organization_id: int) -> dict | None:
    row = conn.execute(select(organizations).where(organizations.c.id == organization_id)).mappings().first()
    return _with_summary(conn, [row])[0] if row else None


def exists(conn: Connection, organization_id: int) -> bool:
    return conn.execute(select(organizations.c.id).where(organizations.c.id == organization_id)).first() is not None


def create(conn: Connection, fields: dict) -> int:
    now = clock.now()
    return insert_id(conn, insert(organizations).values(**fields, created_at=now, updated_at=now))


def update_one(conn: Connection, organization_id: int, fields: dict) -> None:
    conn.execute(
        update(organizations).where(organizations.c.id == organization_id).values(**fields, updated_at=clock.now())
    )


def delete_impact(conn: Connection, organization_id: int) -> dict:
    """RULE-8 and RULE-12: what deleting this organization would delete."""
    contact_ids = contacts_data.ids_for_organization(conn, organization_id)
    deal_ids = deals_data.ids_for_organization(conn, organization_id)
    return {
        "contacts": len(contact_ids),
        "deals": len(deal_ids),
        "activities": activities_data.count_linked(conn, contact_ids, deal_ids),
    }


def delete_one(conn: Connection, organization_id: int) -> None:
    """RULE-8: delete the organization, its contacts, its deals and every activity linked to any of them.

    The activities go first; the database's foreign keys then delete the contacts and deals.
    """
    contact_ids = contacts_data.ids_for_organization(conn, organization_id)
    deal_ids = deals_data.ids_for_organization(conn, organization_id)
    activities_data.delete_linked(conn, contact_ids, deal_ids)
    conn.execute(delete(organizations).where(organizations.c.id == organization_id))
