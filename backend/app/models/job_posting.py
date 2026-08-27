import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.models.resume import VectorType


class JobStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    CLOSED = "closed"
    FILLED = "filled"


class JobType(str, enum.Enum):
    INTERNSHIP = "internship"
    OJT = "ojt"
    FULL_TIME = "full_time"
    PART_TIME = "part_time"


class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    employer_id = Column(String(36), ForeignKey("employer_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    job_type = Column(Enum(JobType), default=JobType.INTERNSHIP, nullable=False, index=True)
    location = Column(String(255), nullable=True)
    is_remote = Column(String(50), default="hybrid")
    required_skills = Column(JSON, nullable=False, default=list)  # list of canonical skill strings
    preferred_skills = Column(JSON, nullable=True, default=list)
    min_education_level = Column(String(100), nullable=True)
    embedding = Column(VectorType(384), nullable=True)
    status = Column(Enum(JobStatus), default=JobStatus.ACTIVE, nullable=False, index=True)
    posted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = Column(DateTime, nullable=True)

    # Relationships
    employer = relationship("EmployerProfile", back_populates="job_postings")
    applications = relationship("Application", back_populates="job_posting", cascade="all, delete-orphan")
