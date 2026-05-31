"""add media column to reviews

Adds ``reviews.media`` (JSON list of {url, type}) for customer photos/videos.

Revision ID: c4e6a8b0d2f3
Revises: a2c4e6f8b0d3
Create Date: 2026-05-31

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c4e6a8b0d2f3"
down_revision: Union[str, Sequence[str], None] = "a2c4e6f8b0d3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "reviews",
        sa.Column(
            "media",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'"),
        ),
    )


def downgrade() -> None:
    op.drop_column("reviews", "media")
