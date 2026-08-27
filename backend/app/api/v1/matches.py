from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, require_student
from app.models.user import User
from app.models.resume import Resume, ResumeStatus
from app.models.job_posting import JobPosting, JobStatus
from app.models.external_job import ExternalJob
from app.schemas.job import JobPostingResponse, ExternalJobResponse
from app.schemas.match import RecommendationItem
from app.services.matching.scorer import match_scorer

router = APIRouter(prefix="/matches", tags=["Matches & Recommendations"])


@router.get("/recommendations", response_model=List[RecommendationItem])
def get_job_recommendations(
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """
    Returns ranked, explainable job recommendations for the student's active resume.
    Uses hybrid scoring (taxonomy overlap + dense vector semantic similarity).
    """
    # Fetch active or latest parsed resume
    resume = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.created_at.desc()).first()

    if not resume or not resume.parsed_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload and parse your resume before requesting job recommendations."
        )

    parsed_data = resume.parsed_data or {}
    resume_embedding = resume.embedding
    recommendations: List[RecommendationItem] = []

    # 1. Score against internal active job postings
    internal_jobs = db.query(JobPosting).filter(JobPosting.status == JobStatus.ACTIVE).all()
    for job in internal_jobs:
        score, skill_score, exp_score, edu_score, explanation = match_scorer.score_resume_against_job(
            resume_parsed_data=parsed_data,
            required_skills=job.required_skills or [],
            job_description=job.description,
            min_education_level=job.min_education_level,
            resume_embedding=resume_embedding,
            job_embedding=job.embedding
        )

        recommendations.append(
            RecommendationItem(
                match_score=score,
                skill_score=skill_score,
                experience_score=exp_score,
                education_score=edu_score,
                explanation=explanation,
                target_type="internal",
                target=JobPostingResponse.model_validate(job)
            )
        )

    # 2. Score against external cached job listings
    external_jobs = db.query(ExternalJob).all()
    for ext_job in external_jobs:
        score, skill_score, exp_score, edu_score, explanation = match_scorer.score_resume_against_job(
            resume_parsed_data=parsed_data,
            required_skills=ext_job.required_skills or [],
            job_description=ext_job.description_snippet or "",
            min_education_level=None,
            resume_embedding=resume_embedding,
            job_embedding=ext_job.embedding
        )

        recommendations.append(
            RecommendationItem(
                match_score=score,
                skill_score=skill_score,
                experience_score=exp_score,
                education_score=edu_score,
                explanation=explanation,
                target_type="external",
                target=ExternalJobResponse.model_validate(ext_job)
            )
        )

    # Sort merged feed in descending order of match score
    recommendations.sort(key=lambda r: r.match_score, reverse=True)

    return recommendations[:limit]
