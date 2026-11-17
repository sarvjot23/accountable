"""The contacts table and its queries."""

from sqlalchemy import Column, ForeignKey, Integer, String, Table, delete, func, insert, select, update
from sqlalchemy.engine import Connection

from accountable import clock
from accountable.activities import data as activities_data
from accountable.db import UtcDateTime, metadata
from accountable.deals import data as deals_data
from accountable.organizations import data as organizations_data

STATUSES = ("lead", "qualified", "customer")

contacts = Table(
    "contacts",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("first_name", String(80), nullable=False),
    Column("last_name", String(80)),
    Column("email", String(254)),
    Column("phone", String(40)),
    Column("job_title", String(120)),
    Column("organization_id", Integer, ForeignKey("organizations.id", ondelete="CASCADE"), index=True),
    Column("status", String(20), nullable=False),
    Column("created_at", UtcDateTime, nullable=False),
    Column("updated_at", UtcDateTime, nullable=False),
)


def full_name(first: str | None, last: str | None) -> str | None:
    """A contact's name for display; also used by deals and activities."""
    if not first:
        return None
    return f"{first} {last}".strip() if last else first


def _select():
    orgs = organizations_data.organizations
    return select(contacts, orgs.c.name.label("organization_name")).select_from(
        contacts.outerjoin(orgs, contacts.c.organization_id == orgs.c.id)
    )


def _row(row) -> dict:
    return dict(row) | {"name": full_name(row["first_name"], row["last_name"])}


def list_all(conn: Connection, status: str | None = None, organization_id: int | None = None) -> list[dict]:
    query = _select().order_by(contacts.c.first_name, contacts.c.last_name, contacts.c.id)
    if status is not None:
        query = query.where(contacts.c.status == status)
    if organization_id is not None:
        query = query.where(contacts.c.organization_id == organization_id)
    return [_row(r) for r in conn.execute(query).mappings()]


def get(conn: Connection, contact_id: int) -> dict | None:
    row = conn.execute(_select().where(contacts.c.id == contact_id)).mappings().first()
    return _row(row) if row else None


def exists(conn: Connection, contact_id: int) -> bool:
    return conn.execute(select(contacts.c.id).where(contacts.c.id == contact_id)).first() is not None


def create(conn: Connection, fields: dict) -> int:
    now = clock.now()
    result = conn.execute(insert(contacts).values(**fields, created_at=now, updated_at=now))
    return result.inserted_primary_key[0]


def update_one(conn: Connection, contact_id: int, fields: dict) -> None:
    conn.execute(update(contacts).where(contacts.c.id == contact_id).values(**fields, updated_at=clock.now()))


def count_by_organization(conn: Connection) -> dict[int, int]:
    query = select(contacts.c.organization_id, func.count()).group_by(contacts.c.organization_id)
    return {org_id: count for org_id, count in conn.execute(query) if org_id is not None}


def ids_for_organization(conn: Connection, organization_id: int) -> list[int]:
    query = select(contacts.c.id).where(contacts.c.organization_id == organization_id)
    return list(conn.scalars(query))


def delete_impact(conn: Connection, contact_id: int) -> dict:
    """RULE-9 and RULE-12: what deleting this contact would unlink."""
    return {
        "activities": activities_data.count_linked(conn, [contact_id], []),
        "deals": deals_data.count_for_contact(conn, contact_id),
    }


def delete_one(conn: Connection, contact_id: int) -> None:
    """RULE-9: the database's foreign keys unlink their activities and deals."""
    conn.execute(delete(contacts).where(contacts.c.id == contact_id))
