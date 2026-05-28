"""create catalog tables

Adds the product catalog: a ``categories`` adjacency-list tree, ``products``,
the ``product_categories`` many-to-many link (with a single primary category
per product), and the faceted-filter tables ``filter_groups`` /
``filter_values`` / ``product_filter_values``.

Revision ID: a1c2e3f4d5b6
Revises: b3f7a1e9c204
Create Date: 2026-05-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a1c2e3f4d5b6'
down_revision: Union[str, Sequence[str], None] = 'b3f7a1e9c204'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # --- categories (adjacency-list tree) ---
    op.create_table(
        'categories',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('parent_id', sa.UUID(), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('path', sa.String(length=1024), nullable=False),
        sa.Column('depth', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('position', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('image_url', sa.String(length=1024), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['parent_id'], ['categories.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('parent_id', 'slug', name='uq_categories_parent_slug'),
    )
    op.create_index(op.f('ix_categories_parent_id'), 'categories', ['parent_id'], unique=False)
    op.create_index(op.f('ix_categories_slug'), 'categories', ['slug'], unique=False)
    op.create_index(op.f('ix_categories_path'), 'categories', ['path'], unique=False)

    # --- products ---
    op.create_table(
        'products',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('sku', sa.String(length=100), nullable=True),
        sa.Column('short_description', sa.String(length=512), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('specifications', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column('images', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'[]'::jsonb"), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('position', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_products_slug'), 'products', ['slug'], unique=True)
    op.create_index(op.f('ix_products_sku'), 'products', ['sku'], unique=True)

    # --- product_categories (M2M; one primary per product) ---
    op.create_table(
        'product_categories',
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('category_id', sa.UUID(), nullable=False),
        sa.Column('is_primary', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('position', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('product_id', 'category_id'),
    )
    op.create_index(
        op.f('ix_product_categories_category_id'),
        'product_categories',
        ['category_id'],
        unique=False,
    )
    # At most one primary category per product.
    op.create_index(
        'uq_product_categories_one_primary',
        'product_categories',
        ['product_id'],
        unique=True,
        postgresql_where=sa.text('is_primary'),
    )

    # --- filter_groups ---
    op.create_table(
        'filter_groups',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('unit', sa.String(length=32), nullable=True),
        sa.Column('position', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_filter_groups_slug'), 'filter_groups', ['slug'], unique=True)

    # --- filter_values ---
    op.create_table(
        'filter_values',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('filter_group_id', sa.UUID(), nullable=False),
        sa.Column('value', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('position', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['filter_group_id'], ['filter_groups.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('filter_group_id', 'slug', name='uq_filter_values_group_slug'),
    )
    op.create_index(
        op.f('ix_filter_values_filter_group_id'),
        'filter_values',
        ['filter_group_id'],
        unique=False,
    )

    # --- product_filter_values (M2M) ---
    op.create_table(
        'product_filter_values',
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('filter_value_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['filter_value_id'], ['filter_values.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('product_id', 'filter_value_id'),
    )
    op.create_index(
        op.f('ix_product_filter_values_filter_value_id'),
        'product_filter_values',
        ['filter_value_id'],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_product_filter_values_filter_value_id'), table_name='product_filter_values')
    op.drop_table('product_filter_values')

    op.drop_index(op.f('ix_filter_values_filter_group_id'), table_name='filter_values')
    op.drop_table('filter_values')

    op.drop_index(op.f('ix_filter_groups_slug'), table_name='filter_groups')
    op.drop_table('filter_groups')

    op.drop_index('uq_product_categories_one_primary', table_name='product_categories')
    op.drop_index(op.f('ix_product_categories_category_id'), table_name='product_categories')
    op.drop_table('product_categories')

    op.drop_index(op.f('ix_products_sku'), table_name='products')
    op.drop_index(op.f('ix_products_slug'), table_name='products')
    op.drop_table('products')

    op.drop_index(op.f('ix_categories_path'), table_name='categories')
    op.drop_index(op.f('ix_categories_slug'), table_name='categories')
    op.drop_index(op.f('ix_categories_parent_id'), table_name='categories')
    op.drop_table('categories')
