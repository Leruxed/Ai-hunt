from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.application import ApplicationStatus
from app.schemas.job import JobPostingResponse
from app.schemas.user import UserResponse
from app.schemas.match import MatchExplanation


class ApplicationCreate(BaseModel):
    job_posting_id: str
    resume_id: Optional[str] = None
    notes: Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class ApplicationResponse(BaseModel):
    id: str
    user_id: str
    job_posting_id: str
    resume_id: Optional[str] = None
    status: ApplicationStatus
    notes: Optional[str] = None
    applied_at: datetime
    updated_at: Optional[datetime] = None
    job_posting: Optional[JobPostingResponse] = None
    user: Optional[UserResponse] = None
    model_config = ConfigDict(from_attributes=True)


class RankedApplicantResponse(BaseModel):
    id: str
    application_id: str
    user_id: str
    candidate_name: str
    candidate_email: str
    status: ApplicationStatus
    applied_at: datetime
    resume_id: Optional[str] = None
    resume_url: Optional[str] = None
    resume_filename: Optional[str] = None
    match_score: float
    skill_score: float
    experience_score: float
    education_score: float
    explanation: MatchExplanation
    model_config = ConfigDict(from_attributes=True)
