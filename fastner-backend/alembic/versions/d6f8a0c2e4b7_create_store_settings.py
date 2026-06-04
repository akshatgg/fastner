"""create store_settings table

A small key/value store for admin-editable, store-wide settings. Seeds the GST
rate at 18.00 so order tax is applied out of the box.

Revision ID: d6f8a0c2e4b7
Revises: c4e6a8b0d2f3
Create Date: 2026-06-04 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd6f8a0c2e4b7'
down_revision: Union[str, Sequence[str], None] = 'c4e6a8b0d2f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'store_settings',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('key', sa.String(length=64), nullable=False),
        sa.Column('value', sa.String(length=255), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_store_settings_key'), 'store_settings', ['key'], unique=True)

    # Seed the GST rate so tax applies immediately (admin can change it later).
    op.execute(
        "INSERT INTO store_settings (id, key, value) "
        "VALUES (gen_random_uuid(), 'gst_rate', '18.00')"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_store_settings_key'), table_name='store_settings')
    op.drop_table('store_settings')
