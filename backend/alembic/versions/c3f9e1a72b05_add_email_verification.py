"""Add email verification fields to users

Revision ID: c3f9e1a72b05
Revises: 8a3f2e9b1c04
Create Date: 2026-08-13 10:27:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c3f9e1a72b05"
down_revision: Union[str, None] = "8a3f2e9b1c04"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add email verification columns to users table
    op.add_column(
        "users",
        sa.Column(
            "is_email_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column(
        "users",
        sa.Column("email_otp_hash", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column(
            "email_otp_expires_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )
    # Mark all existing users as verified so they can still log in
    op.execute("UPDATE users SET is_email_verified = true")


def downgrade() -> None:
    op.drop_column("users", "email_otp_expires_at")
    op.drop_column("users", "email_otp_hash")
    op.drop_column("users", "is_email_verified")