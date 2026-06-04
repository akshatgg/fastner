"""add is_out_of_stock to products

Admin "out of quantity" flag. Unlike is_active (which hides the product), an
out-of-stock product still appears in the catalog but cannot be added to the cart.

Revision ID: e1a3c5d7f9b2
Revises: d6f8a0c2e4b7
Create Date: 2026-06-04 10:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e1a3c5d7f9b2'
down_revision: Union[str, Sequence[str], None] = 'd6f8a0c2e4b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'products',
        sa.Column(
            'is_out_of_stock',
            sa.Boolean(),
            server_default=sa.text('false'),
            nullable=False,
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('products', 'is_out_of_stock')
