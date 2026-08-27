from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user, require_employer
from app.models.user import User
from app.models.employer_profile import EmployerProfile
from app.models.job_posting import JobPosting, JobStatus
from app.models.external_job import ExternalJob
from app.schemas.job import JobPostingCreate, JobPostingUpdate, JobPostingResponse, ExternalJobResponse
from app.services.resume_parser.skills_taxonomy import skills_normalizer

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post("/", response_model=JobPostingResponse, status_code=status.HTTP_201_CREATED)
def create_job_posting(
    job_in: JobPostingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_employer)
):
    """
    Employer creates a new job or internship posting.
    Normalizes required skills to canonical taxonomy names.
    """
    employer = db.query(EmployerProfile).filter(EmployerProfile.user_id == current_user.id).first()
    if not employer:
        # Create profile on the fly if missing
        employer = EmployerProfile(user_id=current_user.id, company_name=current_user.full_name or "Company")
        db.add(employer)
        db.flush()

    # Normalize required & preferred skills
    normalized_required = skills_normalizer.normalize_skills_list(job_in.required_skills)
    normalized_preferred = skills_normalizer.normalize_skills_list(job_in.preferred_skills or [])

    posting = JobPosting(
        employer_id=employer.id,
        title=job_in.title,
        description=job_in.description,
        job_type=job_in.job_type,
        location=job_in.location,
        is_remote=job_in.is_remote,
        required_skills=normalized_required,
        preferred_skills=normalized_preferred,
        min_education_level=job_in.min_education_level,
        status=JobStatus.ACTIVE,
        expires_at=job_in.expires_at
    )
    db.add(posting)
    db.commit()
    db.refresh(posting)
    return posting


@router.get("/", response_model=List[JobPostingResponse])
def list_job_postings(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all active internal job/internship postings.
    """
    query = db.query(JobPosting).filter(JobPosting.status == JobStatus.ACTIVE)
    if search:
        query = query.filter(JobPosting.title.ilike(f"%{search}%"))
    
    postings = query.order_by(JobPosting.posted_at.desc()).offset(skip).limit(limit).all()
    return postings


@router.get("/my-postings", response_model=List[JobPostingResponse])
def list_my_job_postings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_employer)
):
    """
    List job postings created by the authenticated employer.
    """
    employer = db.query(EmployerProfile).filter(EmployerProfile.user_id == current_user.id).first()
    if not employer:
        return []
    
    return db.query(JobPosting).filter(JobPosting.employer_id == employer.id).order_by(JobPosting.posted_at.desc()).all()


@router.get("/{job_id}", response_model=JobPostingResponse)
def get_job_posting(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed internal job posting by ID.
    """
    posting = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not posting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found")
    return posting
