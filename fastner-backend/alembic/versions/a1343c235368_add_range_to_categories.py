"""add range to categories

Revision ID: a1343c235368
Revises: 0003a003af35
Create Date: 2026-08-06 03:16:56.885955

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1343c235368'
down_revision: Union[str, Sequence[str], None] = '0003a003af35'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add the storefront range to categories. Existing rows default to
    # "industrial" (the only range with data today). Indexed for range-filtered
    # storefront tree queries.
    op.add_column(
        'categories',
        sa.Column(
            'range',
            sa.String(length=20),
            server_default=sa.text("'industrial'"),
            nullable=False,
        ),
    )
    op.create_index(op.f('ix_categories_range'), 'categories', ['range'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_categories_range'), table_name='categories')
    op.drop_column('categories', 'range')
