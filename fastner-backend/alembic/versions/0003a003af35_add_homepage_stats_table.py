"""add homepage_stats table

Revision ID: 0003a003af35
Revises: c7e9a1b3d5f8
Create Date: 2026-08-06 03:06:08.578651

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0003a003af35'
down_revision: Union[str, Sequence[str], None] = 'c7e9a1b3d5f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Only creates the homepage_stats table. The autogenerate run also surfaced
    # unrelated pre-existing drift (product_categories / products.sku indexes);
    # that is intentionally left out of this migration.
    op.create_table('homepage_stats',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('key', sa.String(length=64), nullable=False),
    sa.Column('label', sa.String(length=128), nullable=False),
    sa.Column('manual_value', sa.Integer(), nullable=True),
    sa.Column('suffix', sa.String(length=8), server_default='+', nullable=False),
    sa.Column('position', sa.Integer(), server_default=sa.text('0'), nullable=False),
    sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_homepage_stats_key'), 'homepage_stats', ['key'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_homepage_stats_key'), table_name='homepage_stats')
    op.drop_table('homepage_stats')
