"""migrate to supabase auth: remove custom password/otp columns

Revision ID: e8b4d2f91a3c
Revises: c3f9e1a72b05
Create Date: 2026-08-13

Removes hashed_password, is_email_verified, email_otp_hash, email_otp_expires_at
from the users table. Authentication is now fully delegated to Supabase Auth.
The user.id (UUID) is now expected to match the auth.users.id from Supabase,
inserted via database trigger on new signup.
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e8b4d2f91a3c"
down_revision: str | None = "c3f9e1a72b05"
branch_labels: str | tuple[str, ...] | None = None
depends_on: str | tuple[str, ...] | None = None


def upgrade() -> None:
    # Remove custom auth columns — Supabase Auth takes ownership
    op.drop_column("users", "hashed_password")
    op.drop_column("users", "is_email_verified")
    op.drop_column("users", "email_otp_hash")
    op.drop_column("users", "email_otp_expires_at")


def downgrade() -> None:
    # Re-add columns with safe defaults if rolling back
    op.add_column(
        "users",
        sa.Column(
            "hashed_password",
            sa.String(length=255),
            nullable=False,
            server_default="MIGRATED_TO_SUPABASE_AUTH",
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "is_email_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )
    op.add_column(
        "users",
        sa.Column("email_otp_hash", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("email_otp_expires_at", sa.DateTime(timezone=True), nullable=True),
    )
