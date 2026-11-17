"""The sample data: a company selling IT, software and AI solutions (SEED-1 to SEED-5).

Dates are worked out from today, so the data always looks current, and the counts are
the same every time. `python -m accountable.seed` (or `npm run seed`) resets the database.
"""

from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import delete, insert
from sqlalchemy.engine import Connection

from accountable import clock, config, db
from accountable.activities.data import activities
from accountable.contacts.data import contacts
from accountable.deals import rules
from accountable.deals.data import deals
from accountable.deals.stages import stage
from accountable.organizations.data import organizations

ORGANIZATIONS = [
    # key, name, website, industry, notes
    ("meridian", "Meridian Health", "https://meridianhealth.example", "Healthcare",
     "Regional hospital group, 4 sites. Moving clinical systems to the cloud over the next two years."),
    ("northwind", "Northwind Logistics", "https://northwind-logistics.example", "Logistics",
     "Freight and warehousing across the Midwest. Interested in AI for route planning."),
    ("bluepeak", "Bluepeak Retail", "https://bluepeak.example", "Retail",
     "120 stores. Wants one view of stock and sales across stores and online."),
    ("harbor", "Harbor Finance", "https://harborfinance.example", "Finance",
     "Mid-size lender. Security and compliance come first in every decision."),
    ("ironclad", "Ironclad Manufacturing", "https://ironclad-mfg.example", "Manufacturing",
     "Two plants. Old network and an ERP that nobody likes."),
    ("westbrook", "Westbrook University", "https://westbrook.example", "Education",
     "12,000 students. IT team is small and stretched."),
]  # fmt: skip

CONTACTS = [
    # key, first, last, job title, organization, status
    ("grace", "Grace", "Liu", "Chief Information Officer", "meridian", "customer"),
    ("owen", "Owen", "Hart", "IT Director", "meridian", "customer"),
    ("priya", "Priya", "Nair", "Head of Data", "meridian", "qualified"),
    ("sam", "Sam", "Patel", "Chief Operating Officer", "northwind", "customer"),
    ("ella", "Ella", "Brooks", "Operations Analyst", "northwind", "lead"),
    ("victor", "Victor", "Diaz", "Chief Technology Officer", "northwind", "qualified"),
    ("lena", "Lena", "Cho", "Head of Ecommerce", "bluepeak", "qualified"),
    ("marco", "Marco", "Ruiz", "Chief Financial Officer", "bluepeak", "customer"),
    ("raj", "Raj", "Mehta", "Chief Information Officer", "harbor", "customer"),
    ("ava", "Ava", "Grant", "Head of Risk", "harbor", "lead"),
    ("noah", "Noah", "Kim", "Security Lead", "harbor", "lead"),
    ("tom", "Tom", "Becker", "Plant IT Manager", "ironclad", "lead"),
    ("mia", "Mia", "Russo", "Operations Director", "ironclad", "qualified"),
    ("dana", "Dana", "Okafor", "Director of IT Services", "westbrook", "lead"),
    ("leo", "Leo", "Fischer", "Dean of Admissions", "westbrook", "lead"),
]

# key, name, organization, contact, stage, value, close (see _close_date), stages it passed through
DEALS = [
    ("store", "Store analytics pilot", "bluepeak", "lena", "new", 24_000, ("in", 74), ["new"]),
    ("helpdesk", "Campus helpdesk AI", "westbrook", "dana", "new", 18_000, ("in", 90), ["new"]),
    ("fraud", "Fraud model review", "harbor", "ava", "qualified", 65_000, ("in", 31), ["new", "qualified"]),
    ("plant", "Plant network upgrade", "ironclad", "tom", "qualified", 42_000, ("in", 53), ["new", "qualified"]),
    ("cloud", "Cloud migration", "meridian", "grace", "proposal", 180_000, ("ago", 7), ["qualified", "proposal"]),
    ("route", "Route optimisation AI", "northwind", "sam", "proposal", 96_000, ("in", 17), ["qualified", "proposal"]),
    ("platform", "Data platform", "bluepeak", "marco", "negotiation", 150_000, ("ago", 17), ["proposal", "negotiation"]),
    ("managed", "Managed IT contract", "harbor", "raj", "negotiation", 120_000, ("in", 11), ["proposal", "negotiation"]),
    ("endpoint", "Endpoint security rollout", "meridian", "grace", "won", 92_000, ("month", 0), ["negotiation", "won"]),
    ("docsearch", "AI document search", "harbor", "raj", "won", 40_000, ("month", 1), ["negotiation", "won"]),
    ("wifi", "Warehouse Wi-Fi refresh", "northwind", "sam", "won", 64_000, ("month", 2), ["negotiation", "won"]),
    ("warehouse", "Clinical data warehouse", "meridian", "owen", "won", 120_000, ("month", 3),
     ["proposal", "negotiation", "won"]),
    ("pos", "Point-of-sale support contract", "bluepeak", "marco", "won", 28_000, ("month", 5), ["negotiation", "won"]),
    ("fleet", "Fleet tracking integration", "northwind", "victor", "won", 45_000, ("month", 6), ["negotiation", "won"]),
    ("chatbot", "Patient portal chatbot", "meridian", "priya", "won", 86_000, ("month", 7),
     ["proposal", "negotiation", "won"]),
    ("m365", "Microsoft 365 migration", "harbor", "raj", "won", 24_000, ("month", 8), ["negotiation", "won"]),
    ("backup", "Backup and recovery service", "ironclad", "mia", "won", 30_000, ("month", 9), ["negotiation", "won"]),
    ("outsourcing", "IT helpdesk outsourcing", "ironclad", "mia", "won", 38_000, ("month", 11), ["negotiation", "won"]),
    ("erp", "ERP integration", "ironclad", "tom", "lost", 75_000, ("ago", 75), ["proposal", "lost"]),
    ("portal", "Lab data portal", "westbrook", "leo", "lost", 8_000, ("ago", 150), ["qualified", "lost"]),
]  # fmt: skip

# type, description, contact, deal, days ago, follow-up (days from today), follow-up done
ACTIVITIES = [
    ("email", "Sent the revised SOW for the cloud migration", "grace", "cloud", 12, -5, False),
    ("call", "Call about budget sign-off. Marco needs the board's approval first", "marco", "platform", 9, -3, False),
    ("call", "Booked a demo of the support assistant", "dana", "helpdesk", 4, 1, False),
    ("email", "Shared the security review checklist", "raj", "managed", 3, 3, False),
    ("call", "Pilot results look good. Sam wants the numbers in writing", "sam", "route", 2, 6, False),
    ("note", "Wants a two-store pilot before a full rollout", "lena", "store", 15, None, False),
    ("email", "Emailed pricing options for the route planning model", "sam", "route", 14, None, False),
    ("call", "Call about the managed IT scope: 3 sites, 24/7 cover", "raj", "managed", 18, 10, True),
    ("note", "Grace is keen, procurement is the slow part", "grace", "cloud", 26, None, False),
    ("call", "Discovery call. Their fraud model is 6 years old", "ava", "fraud", 33, None, False),
    ("email", "Sent the network survey questions", "tom", "plant", 22, 15, True),
    ("note", "Met at the healthcare IT conference", "priya", None, 60, None, False),
    ("call", "Quarterly check-in. Happy with the data warehouse", "owen", "warehouse", 40, None, False),
    ("email", "Sent the endpoint rollout plan", "grace", "endpoint", 30, None, False),
    ("call", "Asked for references from other lenders", "noah", None, 20, None, False),
    ("note", "Lost on price. They went with an offshore team", "tom", "erp", 76, None, False),
    ("email", "Introduced our AI team to Victor", "victor", None, 45, None, False),
    ("call", "Admissions wants help with enquiry emails", "leo", None, 8, None, False),
    ("note", "Ella is gathering requirements for the warehouse dashboards", "ella", None, 11, None, False),
    ("email", "Sent the case study on store analytics", "lena", "store", 6, None, False),
    ("call", "Walked Mia through the backup options", "mia", "backup", 95, None, False),
    ("note", "Dana's team handles 300 tickets a week", "dana", "helpdesk", 25, None, False),
]


def _close_date(spec: tuple[str, int], today: date) -> date:
    kind, n = spec
    if kind == "in":
        return today + timedelta(days=n)
    if kind == "ago":
        return today - timedelta(days=n)
    month = rules.add_months(today, -n)
    if n == 0:
        return min(today, month + timedelta(days=5))
    return month + timedelta(days=9)


def _at(day: date, hour: int, now: datetime) -> datetime:
    return min(datetime.combine(day, time(hour), tzinfo=UTC), now)


def reset(conn: Connection) -> None:
    for table in (activities, deals, contacts, organizations):
        conn.execute(delete(table))


def seed(conn: Connection) -> None:
    """Delete everything and load the sample data."""
    today, now = clock.today(), clock.now()
    reset(conn)

    org_ids: dict[str, int] = {}
    for key, name, website, industry, notes in ORGANIZATIONS:
        created = _at(today - timedelta(days=420), 15, now)
        values = dict(name=name, website=website, industry=industry, notes=notes, created_at=created, updated_at=created)
        org_ids[key] = conn.execute(insert(organizations).values(**values)).inserted_primary_key[0]

    domains = {key: website.removeprefix("https://") for key, _, website, _, _ in ORGANIZATIONS}
    contact_ids: dict[str, int] = {}
    for key, first, last, job, org, status in CONTACTS:
        created = _at(today - timedelta(days=400), 15, now)
        email = f"{first.lower()}.{last.lower()}@{domains[org]}"
        values = dict(
            first_name=first, last_name=last, email=email, phone=f"+1 555 01{len(contact_ids):02d}",
            job_title=job, organization_id=org_ids[org], status=status, created_at=created, updated_at=created,
        )  # fmt: skip
        contact_ids[key] = conn.execute(insert(contacts).values(**values)).inserted_primary_key[0]

    deal_ids: dict[str, int] = {}
    positions: dict[str, int] = {}
    for key, name, org, person, stage_key, value, close, path in DEALS:
        close_date = _close_date(close, today)
        closed = not stage(stage_key).open
        # Each stage change is a week or so apart, the last on the close date for closed deals.
        last_change = close_date if closed else today - timedelta(days=5 + 3 * len(deal_ids) % 20)
        change_days = [last_change - timedelta(days=9 * (len(path) - 1 - i)) for i in range(len(path))]
        created = _at(change_days[0] - timedelta(days=10), 14, now)
        positions[stage_key] = positions.get(stage_key, 0) + 1
        values = dict(
            name=name, organization_id=org_ids[org], contact_id=contact_ids[person], stage=stage_key, value=value,
            probability=stage(stage_key).probability, probability_manual=False, close_date=close_date,
            close_date_manual=False, position=float(positions[stage_key]),
            stage_changed_at=_at(change_days[-1], 15, now) if len(path) > 1 else created,
            created_at=created, updated_at=created,
        )  # fmt: skip
        deal_id = conn.execute(insert(deals).values(**values)).inserted_primary_key[0]
        deal_ids[key] = deal_id
        for i in range(1, len(path)):
            at = _at(change_days[i], 15, now)
            conn.execute(
                insert(activities).values(
                    type="stage_change", description=rules.stage_change_description(path[i - 1], path[i]),
                    occurred_at=at, contact_id=contact_ids[person], deal_id=deal_id, follow_up_done=False,
                    from_stage=path[i - 1], to_stage=path[i], created_at=at, updated_at=at,
                )  # fmt: skip
            )

    for kind, description, person, deal_key, days_ago, follow_up, done in ACTIVITIES:
        at = _at(today - timedelta(days=days_ago), 16, now)
        conn.execute(
            insert(activities).values(
                type=kind, description=description, occurred_at=at, contact_id=contact_ids[person],
                deal_id=deal_ids[deal_key] if deal_key else None,
                follow_up_date=today + timedelta(days=follow_up) if follow_up is not None else None,
                follow_up_done=done, created_at=at, updated_at=at,
            )  # fmt: skip
        )


def main() -> None:
    """Reset the database in use to the sample data."""
    db.migrate()
    with db.get_engine().begin() as conn:
        seed(conn)
    db.dispose_all()
    print(f"Loaded the sample data into {config.db_path()}")


if __name__ == "__main__":
    main()
