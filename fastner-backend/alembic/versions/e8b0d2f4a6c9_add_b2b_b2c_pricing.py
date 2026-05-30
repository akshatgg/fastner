"""add b2b/b2c pricing

Adds dual pricing to products (``price_b2c``, ``price_b2b``, ``b2b_min_qty``)
and a ``mode`` column to ``cart_items`` so a cart is priced entirely as either
retail (B2C) or bulk (B2B).

Revision ID: e8b0d2f4a6c9
Revises: d4f6a8c0b2e5
Create Date: 2026-05-30 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e8b0d2f4a6c9'
down_revision: Union[str, Sequence[str], None] = 'd4f6a8c0b2e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'products', sa.Column('price_b2c', sa.Numeric(precision=12, scale=2), nullable=True)
    )
    op.add_column(
        'products', sa.Column('price_b2b', sa.Numeric(precision=12, scale=2), nullable=True)
    )
    op.add_column(
        'products',
        sa.Column('b2b_min_qty', sa.Integer(), server_default=sa.text('1'), nullable=False),
    )
    op.add_column(
        'cart_items',
        sa.Column('mode', sa.String(length=8), server_default=sa.text("'b2c'"), nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('cart_items', 'mode')
    op.drop_column('products', 'b2b_min_qty')
    op.drop_column('products', 'price_b2b')
    op.drop_column('products', 'price_b2c')
