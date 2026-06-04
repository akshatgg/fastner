"""add approval, GST and refund fields to orders

Adds the GST snapshot (tax_rate/tax_amount/total), a payment lifecycle column,
the expected delivery date, the decline reason and the Razorpay refund id, and
migrates the old status values into the new approval lifecycle.

Old → new status:  placed/paid → pending_approval (payment_status reflects
whether it was actually paid). shipped/delivered/cancelled are unchanged.

Revision ID: f3b5d7a9c1e4
Revises: e1a3c5d7f9b2
Create Date: 2026-06-04 10:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3b5d7a9c1e4'
down_revision: Union[str, Sequence[str], None] = 'e1a3c5d7f9b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Widen status to fit the new value names (e.g. "pending_approval").
    op.alter_column(
        'orders', 'status',
        existing_type=sa.String(length=16),
        type_=sa.String(length=20),
        existing_nullable=False,
        existing_server_default=sa.text("'placed'"),
        server_default=sa.text("'pending_approval'"),
    )
    op.add_column(
        'orders',
        sa.Column('payment_status', sa.String(length=20), server_default=sa.text("'unpaid'"), nullable=False),
    )
    op.add_column(
        'orders',
        sa.Column('tax_rate', sa.Numeric(precision=5, scale=2), server_default=sa.text('0'), nullable=False),
    )
    op.add_column(
        'orders',
        sa.Column('tax_amount', sa.Numeric(precision=12, scale=2), server_default=sa.text('0'), nullable=False),
    )
    op.add_column(
        'orders',
        sa.Column('total', sa.Numeric(precision=12, scale=2), server_default=sa.text('0'), nullable=False),
    )
    op.add_column('orders', sa.Column('expected_delivery_date', sa.Date(), nullable=True))
    op.add_column('orders', sa.Column('decline_reason', sa.String(length=512), nullable=True))
    op.add_column('orders', sa.Column('razorpay_refund_id', sa.String(length=64), nullable=True))

    # --- migrate existing rows ---------------------------------------------
    # Mark previously-paid orders as paid (by old status or by a captured payment).
    op.execute(
        "UPDATE orders SET payment_status = 'paid' "
        "WHERE status = 'paid' OR razorpay_payment_id IS NOT NULL"
    )
    # Fold the old placed/paid statuses into the new pending_approval state.
    op.execute(
        "UPDATE orders SET status = 'pending_approval' "
        "WHERE status IN ('placed', 'paid')"
    )
    # Backfill the order total from the (untaxed) subtotal for historical rows.
    op.execute("UPDATE orders SET total = subtotal + tax_amount WHERE total = 0")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("UPDATE orders SET status = 'placed' WHERE status = 'pending_approval'")
    op.drop_column('orders', 'razorpay_refund_id')
    op.drop_column('orders', 'decline_reason')
    op.drop_column('orders', 'expected_delivery_date')
    op.drop_column('orders', 'total')
    op.drop_column('orders', 'tax_amount')
    op.drop_column('orders', 'tax_rate')
    op.drop_column('orders', 'payment_status')
    op.alter_column(
        'orders', 'status',
        existing_type=sa.String(length=20),
        type_=sa.String(length=16),
        existing_nullable=False,
        existing_server_default=sa.text("'pending_approval'"),
        server_default=sa.text("'placed'"),
    )
