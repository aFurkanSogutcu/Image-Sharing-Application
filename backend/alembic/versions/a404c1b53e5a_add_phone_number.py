"""add_phone_number

Revision ID: a404c1b53e5a
Revises: 
Create Date: 2025-09-16 11:20:15.265967

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a404c1b53e5a'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('phone_number', sa.String(20), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    pass
