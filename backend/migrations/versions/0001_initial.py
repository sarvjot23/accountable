"""The first four tables: organizations, contacts, deals and activities.

Revision ID: 0001
Revises:
Create Date: 2026-11-17
"""

import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def _timestamps() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "organizations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("website", sa.String(300)),
        sa.Column("industry", sa.String(80)),
        sa.Column("notes", sa.Text()),
        *_timestamps(),
    )
    op.create_table(
        "contacts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("first_name", sa.String(80), nullable=False),
        sa.Column("last_name", sa.String(80)),
        sa.Column("email", sa.String(254)),
        sa.Column("phone", sa.String(40)),
        sa.Column("job_title", sa.String(120)),
        sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id", ondelete="CASCADE")),
        sa.Column("status", sa.String(20), nullable=False),
        *_timestamps(),
    )
    op.create_index("ix_contacts_organization_id", "contacts", ["organization_id"])
    op.create_table(
        "deals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column(
            "organization_id", sa.Integer(), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("contact_id", sa.Integer(), sa.ForeignKey("contacts.id", ondelete="SET NULL")),
        sa.Column("stage", sa.String(20), nullable=False),
        sa.Column("value", sa.Integer(), nullable=False),
        sa.Column("probability", sa.Integer(), nullable=False),
        sa.Column("probability_manual", sa.Boolean(), nullable=False),
        sa.Column("close_date", sa.Date()),
        sa.Column("close_date_manual", sa.Boolean(), nullable=False),
        sa.Column("position", sa.Float(), nullable=False),
        sa.Column("stage_changed_at", sa.DateTime(), nullable=False),
        *_timestamps(),
    )
    op.create_index("ix_deals_organization_id", "deals", ["organization_id"])
    op.create_index("ix_deals_contact_id", "deals", ["contact_id"])
    op.create_index("ix_deals_stage", "deals", ["stage"])
    op.create_table(
        "activities",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("occurred_at", sa.DateTime(), nullable=False),
        sa.Column("contact_id", sa.Integer(), sa.ForeignKey("contacts.id", ondelete="SET NULL")),
        sa.Column("deal_id", sa.Integer(), sa.ForeignKey("deals.id", ondelete="SET NULL")),
        sa.Column("follow_up_date", sa.Date()),
        sa.Column("follow_up_done", sa.Boolean(), nullable=False),
        sa.Column("from_stage", sa.String(20)),
        sa.Column("to_stage", sa.String(20)),
        *_timestamps(),
    )
    op.create_index("ix_activities_contact_id", "activities", ["contact_id"])
    op.create_index("ix_activities_deal_id", "activities", ["deal_id"])


def downgrade() -> None:
    op.drop_table("activities")
    op.drop_table("deals")
    op.drop_table("contacts")
    op.drop_table("organizations")
