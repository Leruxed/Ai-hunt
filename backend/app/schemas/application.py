from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.application import ApplicationStatus
from app.schemas.job import JobPostingResponse
from app.schemas.user import UserResponse


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
