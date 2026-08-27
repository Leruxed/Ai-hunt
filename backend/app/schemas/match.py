from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, ConfigDict
from app.models.match_score import TargetType
from app.schemas.job import JobPostingResponse, ExternalJobResponse


class MatchExplanation(BaseModel):
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    summary: str = ""
    skill_match_percentage: float = 0.0


class MatchScoreResponse(BaseModel):
    id: str
    resume_id: str
    target_id: str
    target_type: TargetType
    score: float  # [0.0 - 1.0]
    skill_score: Optional[float] = None
    experience_score: Optional[float] = None
    education_score: Optional[float] = None
    explanation: MatchExplanation
    computed_at: datetime
    model_config = ConfigDict(from_attributes=True)


class RecommendationItem(BaseModel):
    match_score: float
    skill_score: float
    experience_score: float
    education_score: float
    explanation: MatchExplanation
    target_type: TargetType
    target: Union[JobPostingResponse, ExternalJobResponse]
