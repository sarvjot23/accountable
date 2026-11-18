"""SQLite foreign keys are on for every connection (DATA-8)."""

import pytest
from sqlalchemy import insert, text
from sqlalchemy.exc import IntegrityError

from accountable import clock, db


def test_foreign_keys_are_on_for_every_connection(db_path):  # DATA-8
    engine = db.get_engine()
    connections = [engine.connect() for _ in range(3)]
    try:
        assert [c.scalar(text("PRAGMA foreign_keys")) for c in connections] == [1, 1, 1]
    finally:
        for c in connections:
            c.close()


def test_a_broken_link_is_refused_by_the_database(db_path):  # DATA-8
    from accountable.contacts.data import contacts

    now = clock.now()
    with pytest.raises(IntegrityError), db.get_engine().begin() as conn:
        conn.execute(
            insert(contacts).values(first_name="A", status="lead", organization_id=999, created_at=now, updated_at=now)
        )


def test_naive_timestamps_are_refused(db_path):  # DATA-1: timestamps are always UTC
    from datetime import datetime

    from accountable.organizations.data import organizations

    with pytest.raises(Exception), db.get_engine().begin() as conn:  # noqa: B017
        conn.execute(insert(organizations).values(name="A", created_at=datetime(2026, 1, 1), updated_at=clock.now()))
