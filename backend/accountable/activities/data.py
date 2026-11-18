"""The activities table and its queries."""

from collections import defaultdict
from collections.abc import Iterable, Mapping

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    delete,
    false,
    func,
    insert,
    or_,
    select,
    update,
)
from sqlalchemy.engine import Connection

from accountable import clock
from accountable.activities import rules
from accountable.contacts import data as contacts_data
from accountable.db import UtcDateTime, count, insert_id, metadata
from accountable.deals import data as deals_data
from accountable.organizations import data as organizations_data

TYPES = ("note", "call", "email")
STAGE_CHANGE = "stage_change"

activities = Table(
    "activities",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("type", String(20), nullable=False),
    Column("description", Text, nullable=False),
    Column("occurred_at", UtcDateTime, nullable=False),
    Column("contact_id", Integer, ForeignKey("contacts.id", ondelete="SET NULL"), index=True),
    Column("deal_id", Integer, ForeignKey("deals.id", ondelete="SET NULL"), index=True),
    Column("follow_up_date", Date),
    Column("follow_up_done", Boolean, nullable=False),
    Column("from_stage", String(20)),
    Column("to_stage", String(20)),
    Column("created_at", UtcDateTime, nullable=False),
    Column("updated_at", UtcDateTime, nullable=False),
)


def _select():
    people = contacts_data.contacts
    sales = deals_data.deals
    deal_org = organizations_data.organizations.alias("deal_org")
    contact_org = organizations_data.organizations.alias("contact_org")
    return select(
        activities,
        people.c.first_name.label("contact_first_name"),
        people.c.last_name.label("contact_last_name"),
        sales.c.name.label("deal_name"),
        func.coalesce(deal_org.c.id, contact_org.c.id).label("organization_id"),
        func.coalesce(deal_org.c.name, contact_org.c.name).label("organization_name"),
    ).select_from(
        activities.outerjoin(people, activities.c.contact_id == people.c.id)
        .outerjoin(sales, activities.c.deal_id == sales.c.id)
        .outerjoin(deal_org, sales.c.organization_id == deal_org.c.id)
        .outerjoin(contact_org, people.c.organization_id == contact_org.c.id)
    )


def _newest_first(query):
    return query.order_by(activities.c.occurred_at.desc(), activities.c.id.desc())


def _row(row) -> dict:
    out = dict(row)
    first, last = out.pop("contact_first_name"), out.pop("contact_last_name")
    out["contact_name"] = contacts_data.full_name(first, last)
    out["follow_up_status"] = rules.follow_up_status(out["follow_up_date"], out["follow_up_done"], clock.today())
    return out


def get(conn: Connection, activity_id: int) -> dict | None:
    row = conn.execute(_select().where(activities.c.id == activity_id)).mappings().first()
    return _row(row) if row else None


def timeline(conn: Connection, contact_id: int | None = None, deal_id: int | None = None) -> list[dict]:
    """API-6 and REC-6: a contact's or a deal's activities, newest first."""
    query = _select()
    if contact_id is not None:
        query = query.where(activities.c.contact_id == contact_id)
    if deal_id is not None:
        query = query.where(activities.c.deal_id == deal_id)
    return [_row(r) for r in conn.execute(_newest_first(query)).mappings()]


def recent(conn: Connection, limit: int = 15) -> list[dict]:
    """DASH-13: the newest activities of every type, linked or not."""
    return [_row(r) for r in conn.execute(_newest_first(_select()).limit(limit)).mappings()]


def open_follow_ups(conn: Connection) -> list[dict]:
    """Every activity with a follow-up that isn't done (RULE-7)."""
    query = _select().where(activities.c.follow_up_date.is_not(None), activities.c.follow_up_done == false())
    return [_row(r) for r in conn.execute(query.order_by(activities.c.follow_up_date, activities.c.id)).mappings()]


def create(conn: Connection, fields: Mapping) -> int:
    now = clock.now()
    values = {"occurred_at": now, "follow_up_done": False} | {k: v for k, v in fields.items() if v is not None}
    return insert_id(conn, insert(activities).values(**values, created_at=now, updated_at=now))


def add_stage_change(
    conn: Connection, *, deal_id: int, contact_id: int | None, from_stage: str, to_stage: str, description: str
) -> int:
    """RULE-3: the entry for a stage change, linked to the deal and its main contact."""
    return create(
        conn,
        {
            "type": STAGE_CHANGE,
            "description": description,
            "deal_id": deal_id,
            "contact_id": contact_id,
            "from_stage": from_stage,
            "to_stage": to_stage,
        },
    )


def update_one(conn: Connection, activity_id: int, fields: Mapping) -> None:
    conn.execute(update(activities).where(activities.c.id == activity_id).values(**fields, updated_at=clock.now()))


def set_done(conn: Connection, activity_id: int, done: bool) -> None:
    update_one(conn, activity_id, {"follow_up_done": done})


def delete_one(conn: Connection, activity_id: int) -> None:
    """RULE-11: an activity is deleted on its own; a deleted stage-change entry leaves the deal as it is."""
    conn.execute(delete(activities).where(activities.c.id == activity_id))


def _linked(contact_ids: Iterable[int], deal_ids: Iterable[int]):
    contact_ids, deal_ids = list(contact_ids), list(deal_ids)
    return or_(activities.c.contact_id.in_(contact_ids), activities.c.deal_id.in_(deal_ids))


def count_linked(conn: Connection, contact_ids: Iterable[int], deal_ids: Iterable[int]) -> int:
    """Activities linked to any of these contacts or deals."""
    return count(conn, select(func.count()).select_from(activities).where(_linked(contact_ids, deal_ids)))


def delete_linked(conn: Connection, contact_ids: Iterable[int], deal_ids: Iterable[int]) -> None:
    conn.execute(delete(activities).where(_linked(contact_ids, deal_ids)))


def stage_history(conn: Connection) -> dict[int, list[str]]:
    """Each deal's stages from its stage-change entries, for the funnel (RULE-14)."""
    query = (
        select(activities.c.deal_id, activities.c.from_stage, activities.c.to_stage)
        .where(activities.c.type == STAGE_CHANGE, activities.c.deal_id.is_not(None))
        .order_by(activities.c.occurred_at, activities.c.id)
    )
    history: dict[int, list[str]] = defaultdict(list)
    for deal_id, from_stage, to_stage in conn.execute(query):
        history[deal_id] += [s for s in (from_stage, to_stage) if s]
    return dict(history)
