import uuid
import json
from datetime import datetime, timezone
import enum
from typing import List, Optional
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, JSON, TypeDecorator
from sqlalchemy.orm import relationship
from app.db.session import Base


class ResumeStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PARSING = "parsing"
    PARSED = "parsed"
    ACTIVE = "active"
    ARCHIVED = "archived"
    FAILED = "failed"


class VectorType(TypeDecorator):
    """
    Cross-compatible vector column type.
    Uses native pgvector Vector on PostgreSQL, and falls back to JSON on SQLite.
    """
    impl = JSON
    cache_ok = True

    def __init__(self, dim: int = 384, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.dim = dim

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            from pgvector.sqlalchemy import Vector
            return dialect.type_descriptor(Vector(self.dim))
        return dialect.type_descriptor(JSON())

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql":
            return value
        return value if isinstance(value, list) else list(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return value


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_url = Column(String(1024), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size_bytes = Column(Column(JSON).type, nullable=True)
    raw_text = Column(JSON, nullable=True)  # extracted text stored safely
    parsed_data = Column(JSON, nullable=True)  # structured {skills, education, experience}
    embedding = Column(VectorType(384), nullable=True)
    status = Column(Enum(ResumeStatus), default=ResumeStatus.UPLOADED, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="resumes")
    resume_skills = relationship("ResumeSkill", back_populates="resume", cascade="all, delete-orphan")
    match_scores = relationship("MatchScore", back_populates="resume", cascade="all, delete-orphan")
