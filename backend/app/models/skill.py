import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base


class Skill(Base):
    __tablename__ = "skills"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    canonical_name = Column(String(100), unique=True, index=True, nullable=False)
    category = Column(String(100), index=True, nullable=False)  # e.g., "Programming Language", "Frontend", "Backend", "Cloud"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    resume_skills = relationship("ResumeSkill", back_populates="skill", cascade="all, delete-orphan")


class ResumeSkill(Base):
    __tablename__ = "resume_skills"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    years_of_experience = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Compound unique constraint
    __table_args__ = (
        UniqueConstraint("resume_id", "skill_id", name="uq_resume_skill"),
    )

    # Relationships
    resume = relationship("Resume", back_populates="resume_skills")
    skill = relationship("Skill", back_populates="resume_skills")
