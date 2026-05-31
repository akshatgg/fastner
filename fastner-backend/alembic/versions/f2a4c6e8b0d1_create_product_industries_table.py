"""create product_industries table

Adds the ``product_industries`` join table linking products to the industries
they serve (the same admin-managed rows behind the "Industries We Serve"
section). Lets products be tagged with industries and surfaced when an industry
name is searched.

Revision ID: f2a4c6e8b0d1
Revises: b8d0f2a4c6e1
Create Date: 2026-05-31 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f2a4c6e8b0d1'
down_revision: Union[str, Sequence[str], None] = 'b8d0f2a4c6e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'product_industries',
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('industry_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['industry_id'], ['industries.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('product_id', 'industry_id'),
    )
    op.create_index(
        op.f('ix_product_industries_industry_id'),
        'product_industries',
        ['industry_id'],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f('ix_product_industries_industry_id'),
        table_name='product_industries',
    )
    op.drop_table('product_industries')
