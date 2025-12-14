"""Add user_id to questions

Revision ID: d1e2f3g4h5i6
Revises: 2e2f9c9f7189
Create Date: 2024-05-18 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1e2f3g4h5i6'
down_revision: Union[str, Sequence[str], None] = '2e2f9c9f7189'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('questions', sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_questions_user_id', 'questions', 'users', ['user_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_questions_user_id', 'questions', type_='foreignkey')
    op.drop_column('questions', 'user_id')
