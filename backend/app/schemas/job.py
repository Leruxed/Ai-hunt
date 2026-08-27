from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.models.job_posting import JobStatus, JobType


class JobPostingBase(BaseModel):
    title: str
    description: str
    job_type: JobType = JobType.INTERNSHIP
    location: Optional[str] = None
    is_remote: Optional[str] = "hybrid"
    required_skills: List[str] = []
    preferred_skills: Optional[List[str]] = []
    min_education_level: Optional[str] = None
    expires_at: Optional[datetime] = None


class JobPostingCreate(JobPostingBase):
    pass


class JobPostingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    job_type: Optional[JobType] = None
    location: Optional[str] = None
    is_remote: Optional[str] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    min_education_level: Optional[str] = None
    status: Optional[JobStatus] = None
    expires_at: Optional[datetime] = None


class EmployerInfo(BaseModel):
    company_name: str
    website: Optional[str] = None
    location: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class JobPostingResponse(JobPostingBase):
    id: str
    employer_id: str
    status: JobStatus
    posted_at: datetime
    employer: Optional[EmployerInfo] = None
    model_config = ConfigDict(from_attributes=True)


class ExternalJobResponse(BaseModel):
    id: str
    source: str
    title: str
    company_name: str
    location: Optional[str] = None
    description_snippet: Optional[str] = None
    apply_url: str
    source_board: Optional[str] = None
    required_skills: Optional[List[str]] = []
    fetched_at: datetime
    model_config = ConfigDict(from_attributes=True)
