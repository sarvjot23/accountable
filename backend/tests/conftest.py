"""Shared fixtures: a fresh migrated database per test, a fixed "today", and an API client.

The database path is pointed at a temporary file before anything else runs, so tests
never touch backend/data/accountable.db (APP-7).
"""

import os
import shutil
import tempfile
from datetime import UTC, date, datetime
from pathlib import Path

import pytest

_SESSION_DIR = Path(tempfile.mkdtemp(prefix="accountable-tests-"))
os.environ["ACCOUNTABLE_DB"] = str(_SESSION_DIR / "session.db")

from accountable import clock, db  # noqa: E402

TODAY = date(2026, 11, 17)
NOW = datetime(2026, 11, 17, 15, 30, tzinfo=UTC)

_template: Path | None = None


def migrated_template() -> Path:
    """One database built through the migrations, copied for each test (fast, and still migrated)."""
    global _template
    if _template is None:
        path = _SESSION_DIR / "template.db"
        os.environ["ACCOUNTABLE_DB"] = str(path)
        db.migrate()
        db.dispose_all()
        _template = path
    return _template


@pytest.fixture
def db_path(tmp_path, monkeypatch) -> Path:
    """A fresh, migrated, empty database for this test."""
    template = migrated_template()
    path = tmp_path / "test.db"
    shutil.copyfile(template, path)
    monkeypatch.setenv("ACCOUNTABLE_DB", str(path))
    yield path
    db.dispose_all()


@pytest.fixture(autouse=True)
def fixed_today():
    """Every test runs on Tuesday 17 November 2026, 15:30 UTC (RULE-15)."""
    clock.fix(TODAY, NOW)
    yield TODAY
    clock.fix(None)


@pytest.fixture
def conn(db_path):
    """A connection to the test database; call conn.commit() to make writes visible to the API."""
    with db.get_engine().connect() as connection:
        yield connection


@pytest.fixture
def client(db_path):
    from fastapi.testclient import TestClient

    from accountable.main import app

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def org(client):
    """Make an organization through the API and return it."""

    def make(**fields):
        response = client.post("/api/organizations", json={"name": "Northwind Labs"} | fields)
        assert response.status_code == 201, response.text
        return response.json()

    return make


@pytest.fixture
def contact(client):
    def make(**fields):
        response = client.post("/api/contacts", json={"first_name": "Sam", "last_name": "Patel"} | fields)
        assert response.status_code == 201, response.text
        return response.json()

    return make


@pytest.fixture
def deal(client):
    def make(**fields):
        response = client.post("/api/deals", json={"name": "Cloud migration", "value": 10_000} | fields)
        assert response.status_code == 201, response.text
        return response.json()

    return make


@pytest.fixture
def activity(client):
    def make(**fields):
        response = client.post("/api/activities", json={"type": "note", "description": "Spoke about scope"} | fields)
        assert response.status_code == 201, response.text
        return response.json()

    return make
