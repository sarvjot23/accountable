"""Start-up: migrations run, and a new database is seeded (APP-2, APP-14)."""

from fastapi.testclient import TestClient
from sqlalchemy import insert, inspect, select

from accountable import clock, db
from accountable.main import app


def start(client_app=app):
    with TestClient(client_app) as client:
        return client.get("/api/organizations").json()


def test_a_new_database_is_migrated_and_seeded(tmp_path, monkeypatch):  # APP-2
    path = tmp_path / "fresh" / "accountable.db"
    monkeypatch.setenv("ACCOUNTABLE_DB", str(path))
    assert not path.exists()
    orgs = start()
    assert path.exists()
    assert len(orgs) == 6
    with db.get_engine().connect() as conn:
        assert inspect(conn).has_table("alembic_version")
    db.dispose_all()


def test_an_existing_database_is_migrated_and_its_data_kept(db_path):  # APP-14 APP-2
    from accountable.organizations.data import organizations

    with db.get_engine().begin() as conn:
        now = clock.now()
        conn.execute(insert(organizations).values(name="Mine", created_at=now, updated_at=now))
    db.dispose_all()

    orgs = start()
    assert [o["name"] for o in orgs] == ["Mine"]  # kept, and not replaced by the sample data

    orgs = start()  # and again: starting twice changes nothing
    assert [o["name"] for o in orgs] == ["Mine"]
    with db.get_engine().connect() as conn:
        assert conn.scalar(select(organizations.c.name)) == "Mine"
