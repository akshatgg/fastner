"""create industries table

Adds the ``industries`` table backing the admin-managed "Industries We Serve"
marketing section — a flat list of showcase cards (name + photo + blurb).

Revision ID: c2d4e6f8a1b3
Revises: a1c2e3f4d5b6
Create Date: 2026-05-29 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c2d4e6f8a1b3'
down_revision: Union[str, Sequence[str], None] = 'a1c2e3f4d5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'industries',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('blurb', sa.String(length=512), nullable=True),
        sa.Column('image_url', sa.String(length=1024), nullable=True),
        sa.Column('position', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_industries_slug'), 'industries', ['slug'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_industries_slug'), table_name='industries')
    op.drop_table('industries')
