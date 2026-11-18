"""The deals table and its queries."""

from collections.abc import Mapping

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    delete,
    func,
    insert,
    select,
    update,
)
from sqlalchemy.engine import Connection

from accountable import clock
from accountable.activities import data as activities_data
from accountable.contacts import data as contacts_data
from accountable.db import UtcDateTime, count, insert_id, metadata
from accountable.deals import rules
from accountable.deals.stages import OPEN_STAGES
from accountable.organizations import data as organizations_data

deals = Table(
    "deals",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String(160), nullable=False),
    Column("organization_id", Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True),
    Column("contact_id", Integer, ForeignKey("contacts.id", ondelete="SET NULL"), index=True),
    Column("stage", String(20), nullable=False, index=True),
    Column("value", Integer, nullable=False),
    Column("probability", Integer, nullable=False),
    Column("probability_manual", Boolean, nullable=False),
    Column("close_date", Date),
    Column("close_date_manual", Boolean, nullable=False),
    Column("position", Float, nullable=False),
    Column("stage_changed_at", UtcDateTime, nullable=False),
    Column("created_at", UtcDateTime, nullable=False),
    Column("updated_at", UtcDateTime, nullable=False),
)


def _select():
    orgs = organizations_data.organizations
    people = contacts_data.contacts
    return select(
        deals,
        orgs.c.name.label("organization_name"),
        people.c.first_name.label("contact_first_name"),
        people.c.last_name.label("contact_last_name"),
    ).select_from(
        deals.join(orgs, deals.c.organization_id == orgs.c.id).outerjoin(people, deals.c.contact_id == people.c.id)
    )


def _row(row) -> dict:
    out = dict(row)
    first, last = out.pop("contact_first_name"), out.pop("contact_last_name")
    out["contact_name"] = contacts_data.full_name(first, last)
    return out


def list_all(conn: Connection, organization_id: int | None = None, contact_id: int | None = None) -> list[dict]:
    query = _select().order_by(deals.c.position, deals.c.id)
    if organization_id is not None:
        query = query.where(deals.c.organization_id == organization_id)
    if contact_id is not None:
        query = query.where(deals.c.contact_id == contact_id)
    return [_row(r) for r in conn.execute(query).mappings()]


def get(conn: Connection, deal_id: int) -> dict | None:
    row = conn.execute(_select().where(deals.c.id == deal_id)).mappings().first()
    return _row(row) if row else None


def exists(conn: Connection, deal_id: int) -> bool:
    return conn.execute(select(deals.c.id).where(deals.c.id == deal_id)).first() is not None


def column_positions(conn: Connection, stage: str, exclude_id: int | None = None) -> list[tuple[int, float]]:
    """A stage column in board order, as (id, position)."""
    query = select(deals.c.id, deals.c.position).where(deals.c.stage == stage).order_by(deals.c.position, deals.c.id)
    if exclude_id is not None:
        query = query.where(deals.c.id != exclude_id)
    return [(r.id, r.position) for r in conn.execute(query)]


def _end_of(conn: Connection, stage: str, exclude_id: int | None = None) -> float:
    return rules.end_position(p for _, p in column_positions(conn, stage, exclude_id))


def create(conn: Connection, fields: Mapping) -> int:
    """Add a deal at the end of its stage's column, with its stage's probability unless one is given."""
    now = clock.now()
    values = {k: v for k, v in fields.items() if k not in ("probability", "close_date")}
    values |= rules.new_deal(fields["stage"], fields.get("probability"), fields.get("close_date"), clock.today())
    values |= {
        "position": _end_of(conn, fields["stage"]),
        "stage_changed_at": now,
        "created_at": now,
        "updated_at": now,
    }
    return insert_id(conn, insert(deals).values(**values))


def _save(conn: Connection, deal_id: int, changes: Mapping) -> None:
    conn.execute(update(deals).where(deals.c.id == deal_id).values(**changes, updated_at=clock.now()))


def _record_stage_change(conn: Connection, deal_id: int, contact_id: int | None, from_stage: str, to_stage: str):
    activities_data.add_stage_change(
        conn,
        deal_id=deal_id,
        contact_id=contact_id,
        from_stage=from_stage,
        to_stage=to_stage,
        description=rules.stage_change_description(from_stage, to_stage),
    )


def edit(conn: Connection, current: Mapping, submitted: Mapping) -> None:
    """Save the deal form (RULE-3, RULE-5). A new stage puts the card at the end of its column."""
    changes, moved = rules.edit_deal(current, submitted, clock.today(), clock.now())
    if moved:
        changes["position"] = _end_of(conn, changes["stage"], exclude_id=current["id"])
    _save(conn, current["id"], changes)
    if moved:
        contact_id = submitted.get("contact_id", current["contact_id"])
        _record_stage_change(conn, current["id"], contact_id, current["stage"], changes["stage"])


def move(conn: Connection, current: Mapping, stage: str, before_id: int | None, after_id: int | None) -> None:
    """PIPE-16: one call saves the card's place and, if its stage changed, applies RULE-3.

    Raises ValueError if a neighbour isn't in the target column.
    """
    column = column_positions(conn, stage, exclude_id=current["id"])
    position, renumbered = rules.drop_position(column, before_id, after_id)
    for deal_id, new_position in renumbered.items():
        conn.execute(update(deals).where(deals.c.id == deal_id).values(position=new_position))
    changes = rules.stage_change(current, stage, clock.today(), clock.now())
    _save(conn, current["id"], changes | {"position": position})
    if changes:
        _record_stage_change(conn, current["id"], current["contact_id"], current["stage"], stage)


def open_summary_by_organization(conn: Connection) -> dict[int, tuple[int, int]]:
    """Each organization's open deals: (count, value) (RULE-2)."""
    query = (
        select(deals.c.organization_id, func.count(), func.coalesce(func.sum(deals.c.value), 0))
        .where(deals.c.stage.in_(OPEN_STAGES))
        .group_by(deals.c.organization_id)
    )
    return {org_id: (open_count, value) for org_id, open_count, value in conn.execute(query)}


def ids_for_organization(conn: Connection, organization_id: int) -> list[int]:
    return list(conn.scalars(select(deals.c.id).where(deals.c.organization_id == organization_id)))


def count_for_contact(conn: Connection, contact_id: int) -> int:
    return count(conn, select(func.count()).select_from(deals).where(deals.c.contact_id == contact_id))


def delete_impact(conn: Connection, deal_id: int) -> dict:
    """RULE-10 and RULE-12: what deleting this deal would unlink."""
    return {"activities": activities_data.count_linked(conn, [], [deal_id])}


def delete_one(conn: Connection, deal_id: int) -> None:
    """RULE-10: the database's foreign keys unlink its activities."""
    conn.execute(delete(deals).where(deals.c.id == deal_id))
