"""make room.movie_id nullable, add external_url, add storage_providers table

Revision ID: 8a3f2e9b1c04
Revises: d8720b47c441
Create Date: 2026-07-15 06:30:00.000000

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "8a3f2e9b1c04"
down_revision: str | None = "d8720b47c441"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Make rooms.movie_id nullable
    op.alter_column("rooms", "movie_id", existing_type=postgresql.UUID(as_uuid=True), nullable=True)

    # 2. Drop the CASCADE FK on movie_id and add SET NULL instead
    op.drop_constraint("fk_rooms_movie_id_movies", "rooms", type_="foreignkey")
    op.create_foreign_key(
        "fk_rooms_movie_id_movies",
        "rooms",
        "movies",
        ["movie_id"],
        ["id"],
        ondelete="SET NULL",
    )

    # 3. Add external_url column to rooms
    op.add_column("rooms", sa.Column("external_url", sa.String(length=2048), nullable=True))


def downgrade() -> None:
    op.drop_column("rooms", "external_url")

    op.drop_constraint("fk_rooms_movie_id_movies", "rooms", type_="foreignkey")
    op.create_foreign_key(
        "fk_rooms_movie_id_movies",
        "rooms",
        "movies",
        ["movie_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.alter_column("rooms", "movie_id", existing_type=postgresql.UUID(as_uuid=True), nullable=False)
