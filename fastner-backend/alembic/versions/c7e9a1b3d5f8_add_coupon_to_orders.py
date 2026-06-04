"""add coupon fields to orders

Links an order to the coupon applied at checkout (soft FK + code snapshot) and
records the rupee discount. GST is charged on the post-discount amount, so the
existing total column already reflects the discount.

Revision ID: c7e9a1b3d5f8
Revises: b5d7f9a1c3e6
Create Date: 2026-06-04 11:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7e9a1b3d5f8'
down_revision: Union[str, Sequence[str], None] = 'b5d7f9a1c3e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('orders', sa.Column('coupon_id', sa.UUID(), nullable=True))
    op.add_column('orders', sa.Column('coupon_code', sa.String(length=40), nullable=True))
    op.add_column(
        'orders',
        sa.Column('discount_amount', sa.Numeric(precision=12, scale=2), server_default=sa.text('0'), nullable=False),
    )
    op.create_foreign_key(
        'fk_orders_coupon_id', 'orders', 'coupons', ['coupon_id'], ['id'], ondelete='SET NULL'
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_orders_coupon_id', 'orders', type_='foreignkey')
    op.drop_column('orders', 'discount_amount')
    op.drop_column('orders', 'coupon_code')
    op.drop_column('orders', 'coupon_id')
