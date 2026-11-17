"""Settings. The database path comes from ACCOUNTABLE_DB so tests can use their own."""

import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DB_PATH = BACKEND_DIR / "data" / "accountable.db"
MIGRATIONS_DIR = BACKEND_DIR / "migrations"


def db_path() -> Path:
    """The SQLite file in use, read each time so a test can point it elsewhere."""
    value = os.environ.get("ACCOUNTABLE_DB")
    return Path(value).resolve() if value else DEFAULT_DB_PATH


def db_url(path: Path | None = None) -> str:
    return f"sqlite:///{(path or db_path()).as_posix()}"
