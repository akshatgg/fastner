"""create cart_items table

Adds the ``cart_items`` table backing the per-user, server-backed enquiry cart.
One row per (user, product), enforced by ``uq_cart_items_user_product``.

Revision ID: d4f6a8c0b2e5
Revises: c2d4e6f8a1b3
Create Date: 2026-05-29 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4f6a8c0b2e5'
down_revision: Union[str, Sequence[str], None] = 'c2d4e6f8a1b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'cart_items',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('quantity', sa.Integer(), server_default=sa.text('1'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'product_id', name='uq_cart_items_user_product'),
    )
    op.create_index(op.f('ix_cart_items_user_id'), 'cart_items', ['user_id'], unique=False)
    op.create_index(op.f('ix_cart_items_product_id'), 'cart_items', ['product_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_cart_items_product_id'), table_name='cart_items')
    op.drop_index(op.f('ix_cart_items_user_id'), table_name='cart_items')
    op.drop_table('cart_items')
