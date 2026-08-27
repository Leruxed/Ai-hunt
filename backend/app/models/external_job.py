import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, JSON, UniqueConstraint
from app.db.session import Base
from app.models.resume import VectorType


class ExternalJob(Base):
    __tablename__ = "external_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    source = Column(String(50), nullable=False, index=True)  # e.g., "JSearch", "LinkedIn", "Adzuna"
    external_ref = Column(String(255), nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    company_name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    description_snippet = Column(Text, nullable=True)
    apply_url = Column(String(1024), nullable=False)
    source_board = Column(String(100), nullable=True)  # e.g., "via LinkedIn through JSearch"
    required_skills = Column(JSON, nullable=True, default=list)
    embedding = Column(VectorType(384), nullable=True)
    fetched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = Column(DateTime, nullable=True, index=True)

    # Unique constraint on (source, external_ref) to ensure idempotency during background sync
    __table_args__ = (
        UniqueConstraint("source", "external_ref", name="uq_external_source_ref"),
    )
