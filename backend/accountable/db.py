"""The engine, the shared MetaData, and a connection per request."""

from collections.abc import Iterator
from datetime import UTC, datetime

from sqlalchemy import DateTime, Engine, MetaData, create_engine, event, inspect
from sqlalchemy.engine import Connection
from sqlalchemy.types import TypeDecorator

from accountable import config

metadata = MetaData()

_engines: dict[str, Engine] = {}


class UtcDateTime(TypeDecorator):
    """A timestamp stored as naive UTC and always read back as timezone-aware UTC (DATA-1)."""

    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect):
        if value is None:
            return None
        if value.tzinfo is None:
            raise ValueError("timestamps must be timezone-aware")
        return value.astimezone(UTC).replace(tzinfo=None)

    def process_result_value(self, value: datetime | None, dialect):
        return value.replace(tzinfo=UTC) if value is not None else None


def _turn_on_foreign_keys(dbapi_connection, _record) -> None:
    # SQLite ignores foreign keys unless asked, so ask on every connection (DATA-8).
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def get_engine() -> Engine:
    """The engine for the database in use (config.db_path()), made once per path."""
    path = config.db_path()
    url = config.db_url(path)
    if url not in _engines:
        path.parent.mkdir(parents=True, exist_ok=True)
        engine = create_engine(url, connect_args={"check_same_thread": False})
        event.listen(engine, "connect", _turn_on_foreign_keys)
        _engines[url] = engine
    return _engines[url]


def dispose_all() -> None:
    """Close every pooled connection and forget the engines (tests, and before a reseed)."""
    for engine in _engines.values():
        engine.dispose()
    _engines.clear()


def load_tables() -> MetaData:
    """Import every feature's tables so the shared MetaData knows them all."""
    from accountable.activities import data as _activities  # noqa: F401
    from accountable.contacts import data as _contacts  # noqa: F401
    from accountable.deals import data as _deals  # noqa: F401
    from accountable.organizations import data as _organizations  # noqa: F401

    return metadata


def is_new_database() -> bool:
    """True when the database has never been migrated (no file, or no alembic_version)."""
    if not config.db_path().exists():
        return True
    with get_engine().connect() as conn:
        return not inspect(conn).has_table("alembic_version")


def migrate() -> None:
    """Bring the database up to date with the migrations (APP-14)."""
    from alembic import command
    from alembic.config import Config

    cfg = Config()
    cfg.set_main_option("script_location", str(config.MIGRATIONS_DIR))
    with get_engine().begin() as conn:
        cfg.attributes["connection"] = conn
        command.upgrade(cfg, "head")


def get_conn() -> Iterator[Connection]:
    """FastAPI dependency: one connection and one transaction per request."""
    with get_engine().begin() as conn:
        yield conn
