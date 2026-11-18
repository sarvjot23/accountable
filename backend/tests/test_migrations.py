"""Migrations match the code's tables and keep existing data (APP-14)."""

from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import func, insert, select, text

from accountable import clock, config, db


def head_revision() -> str | None:
    cfg = Config()
    cfg.set_main_option("script_location", str(config.MIGRATIONS_DIR))
    return ScriptDirectory.from_config(cfg).get_current_head()


def test_migrated_schema_matches_the_code(db_path):  # APP-14
    metadata = db.load_tables()
    with db.get_engine().connect() as conn:
        context = MigrationContext.configure(conn, opts={"compare_type": True})
        differences = compare_metadata(context, metadata)
    assert differences == []


def test_database_is_at_the_latest_revision(db_path):  # APP-14
    with db.get_engine().connect() as conn:
        assert conn.scalar(text("select version_num from alembic_version")) == head_revision()


def test_upgrading_a_database_with_data_keeps_the_data(db_path):  # APP-14
    from accountable.organizations.data import organizations

    with db.get_engine().begin() as conn:
        now = clock.now()
        conn.execute(insert(organizations).values(name="Kept", created_at=now, updated_at=now))
    db.migrate()
    db.migrate()
    with db.get_engine().connect() as conn:
        assert conn.scalar(select(func.count()).select_from(organizations)) == 1
        assert conn.scalar(select(organizations.c.name)) == "Kept"


def test_migrating_from_nothing(tmp_path, monkeypatch):  # APP-14
    monkeypatch.setenv("ACCOUNTABLE_DB", str(tmp_path / "empty.db"))
    assert db.is_new_database()
    db.migrate()
    assert not db.is_new_database()
    db.dispose_all()
