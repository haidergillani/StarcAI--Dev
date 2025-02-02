"""add missing columns to documents

Revision ID: fa05da820a34
Revises: 9045e68cf4ee
Create Date: 2024-03-19 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fa05da820a34'
down_revision: Union[str, None] = '9045e68cf4ee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add all missing columns to documents table
    op.add_column('documents', sa.Column('user_id', sa.Integer(), nullable=False))
    op.add_column('documents', sa.Column('word_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('documents', sa.Column('upload_date', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False))
    
    # Add foreign key constraint
    op.create_foreign_key('fk_documents_user', 'documents', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    
    # Add indexes
    op.create_index('idx_user_docs', 'documents', ['user_id', 'id'])
    op.create_index('idx_doc_title', 'documents', ['title'])
    op.create_index('idx_word_count', 'documents', ['word_count'])
    op.create_index('idx_upload_date', 'documents', ['upload_date'])


def downgrade() -> None:
    # Remove indexes
    op.drop_index('idx_upload_date', table_name='documents')
    op.drop_index('idx_word_count', table_name='documents')
    op.drop_index('idx_doc_title', table_name='documents')
    op.drop_index('idx_user_docs', table_name='documents')
    
    # Remove foreign key constraint
    op.drop_constraint('fk_documents_user', 'documents', type_='foreignkey')
    
    # Remove columns
    op.drop_column('documents', 'upload_date')
    op.drop_column('documents', 'word_count')
    op.drop_column('documents', 'user_id')
