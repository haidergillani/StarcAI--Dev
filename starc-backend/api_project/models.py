"""
Minor changes might be needed, but unlikely

Each Document <- Multiple Text Chunks
Text Chunk <- Initial and Final Scores

Previously a text chunk stored a Model called Sentecnes but this has been removed
Ensure relations are now updated to reflect this change

Text Chunk allows flexibility incase subsections of a text need to be rewritten
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Boolean, Index
from sqlalchemy.orm import relationship
from .database import Base
from werkzeug.security import generate_password_hash, check_password_hash

# Create user with username, password, email connected to all their docs
class User(Base):
    __tablename__ = 'users'
    __table_args__ = (
        Index('idx_user_email', 'email'),      # For email lookups during auth
        Index('idx_user_username', 'username'), # For username lookups during auth
    )

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, nullable=False)
    password = Column(String, nullable=False)
    email = Column(String, nullable=False)
    is_oauth_user = Column(Boolean, default=False)
    documents = relationship('Document', backref='user', lazy=True, cascade="all, delete-orphan")

    # Set and check for password using Werkzeug functions.
    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        if self.is_oauth_user:
            return False
        return check_password_hash(self.password, password)

# Store basic document details.
class Document(Base):
    __tablename__ = 'documents'
    __table_args__ = (
        # Composite index for faster user document lookups
        Index('idx_user_docs', 'user_id', 'id'),
        # Index for title searches
        Index('idx_doc_title', 'title'),
        # Index for word count sorting/filtering
        Index('idx_word_count', 'word_count'),
        # Index for date-based queries
        Index('idx_upload_date', 'upload_date'),
    )

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    word_count = Column(Integer, default=0, nullable=False)
    text_chunks = relationship('TextChunks', backref='document', lazy=True, cascade="all, delete-orphan")

# Store a complete piece of text associated with each doc. By segregating docs and its text, we can allow for rewrite and scoring process for a subsection of an entire docs text is an extension feature than rewriting the entire doc.
class TextChunks(Base):
    __tablename__ = 'text_chunks'
    __table_args__ = (
        # Index for document lookups
        Index('idx_doc_chunks', 'document_id'),
        # Index for text search if needed
        Index('idx_input_text', 'input_text_chunk'),
    )

    id = Column(Integer, primary_key=True, index=True)
    input_text_chunk = Column(Text, nullable=False)
    rewritten_text = Column(Text, nullable=False)
    document_id = Column(Integer, ForeignKey('documents.id'), nullable=False)
    initial_score = relationship('InitialScore', backref='text_chunk', uselist=False, cascade="all, delete-orphan")
    final_score = relationship('FinalScore', backref='text_chunk', uselist=False, cascade="all, delete-orphan")

# Store scores for original text.
class InitialScore(Base):
    __tablename__ = 'initial_scores'
    __table_args__ = (
        # Index for score lookups
        Index('idx_initial_scores', 'text_chunk_id', 'score'),
    )

    id = Column(Integer, primary_key=True, index=True)
    score = Column(Float, nullable=False)
    optimism = Column(Float, nullable=False)
    forecast = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    text_chunk_id = Column(Integer, ForeignKey('text_chunks.id'), nullable=False)

# Store scores for rewritten text.
class FinalScore(Base):
    __tablename__ = 'final_scores'
    __table_args__ = (
        # Index for score lookups
        Index('idx_final_scores', 'text_chunk_id', 'score'),
    )

    id = Column(Integer, primary_key=True, index=True)
    score = Column(Float, nullable=False)
    optimism = Column(Float, nullable=False)
    forecast = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    text_chunk_id = Column(Integer, ForeignKey('text_chunks.id'), nullable=False)

class Suggestion(Base):
    __tablename__ = "suggestions"
    __table_args__ = (
        # Index for document suggestions
        Index('idx_doc_suggestions', 'document_id'),
    )

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    input_text_chunk = Column(String)
    rewritten_text = Column(String)

    document = relationship("Document", back_populates="suggestions")

Document.suggestions = relationship("Suggestion", order_by=Suggestion.id, back_populates="document")
