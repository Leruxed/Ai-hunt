from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict
from app.models.resume import ResumeStatus


class EducationEntry(BaseModel):
    institution: Optional[str] = None
    degree: Optional[str] = None  # e.g., "BS", "Undergraduate", "High School"
    field_of_study: Optional[str] = None  # e.g., "Computer Science", "Information Technology"
    start_year: Optional[str] = None
    end_year: Optional[str] = None
    is_current: bool = False


class ExperienceEntry(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    description: Optional[str] = None
    years: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False


class ParsedResumeData(BaseModel):
    skills: List[str] = []
    education: List[EducationEntry] = []
    experience: List[ExperienceEntry] = []
    certifications: List[str] = []
    summary: Optional[str] = None


class ResumeResponse(BaseModel):
    id: str
    user_id: str
    file_name: str
    file_url: str
    mime_type: str
    status: ResumeStatus
    parsed_data: Optional[ParsedResumeData] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class ResumeUpdateData(BaseModel):
    parsed_data: ParsedResumeData
    status: Optional[ResumeStatus] = ResumeStatus.ACTIVE
