"""Tests never use the real database (APP-7)."""

import os
import tempfile
from pathlib import Path

from accountable import config, db


def test_tests_point_at_a_temporary_database(db_path):  # APP-7
    assert os.environ["ACCOUNTABLE_DB"]
    assert config.db_path() == db_path.resolve()
    assert config.db_path() != config.DEFAULT_DB_PATH
    assert Path(tempfile.gettempdir()).resolve() in config.db_path().parents


def test_the_engine_in_use_is_the_test_one(db_path):  # APP-7
    assert db.get_engine().url.database == db_path.resolve().as_posix()


def test_even_without_a_per_test_database_the_default_is_not_used():  # APP-7
    assert config.db_path() != config.DEFAULT_DB_PATH
