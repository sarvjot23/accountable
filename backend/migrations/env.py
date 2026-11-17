"""Alembic environment, using the app's shared MetaData."""

from alembic import context
from sqlalchemy import create_engine

from accountable import config as app_config
from accountable.db import load_tables

target_metadata = load_tables()


def run_migrations_online() -> None:
    connection = context.config.attributes.get("connection")
    if connection is not None:
        context.configure(connection=connection, target_metadata=target_metadata, render_as_batch=True)
        with context.begin_transaction():
            context.run_migrations()
        return
    engine = create_engine(context.config.get_main_option("sqlalchemy.url") or app_config.db_url())
    with engine.connect() as conn:
        context.configure(connection=conn, target_metadata=target_metadata, render_as_batch=True)
        with context.begin_transaction():
            context.run_migrations()


run_migrations_online()
