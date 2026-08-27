import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base


class TargetType(str, enum.Enum):
    INTERNAL = "internal"
    EXTERNAL = "external"


class MatchScore(Base):
    __tablename__ = "match_scores"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    target_id = Column(String(36), nullable=False, index=True)  # References either job_postings.id or external_jobs.id
    target_type = Column(Enum(TargetType), default=TargetType.INTERNAL, nullable=False, index=True)
    score = Column(Float, nullable=False, index=True)  # Overall match score [0.0 to 1.0]
    skill_score = Column(Float, nullable=True)
    experience_score = Column(Float, nullable=True)
    education_score = Column(Float, nullable=True)
    explanation = Column(JSON, nullable=False, default=dict)  # {matched_skills: [], missing_skills: [], summary: ""}
    computed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Unique constraint per resume and target
    __table_args__ = (
        UniqueConstraint("resume_id", "target_id", "target_type", name="uq_resume_target_match"),
    )

    # Relationships
    resume = relationship("Resume", back_populates="match_scores")
