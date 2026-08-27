from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.dependencies import get_db, get_current_user, require_student, require_employer
from app.models.user import User
from app.models.employer_profile import EmployerProfile
from app.models.job_posting import JobPosting
from app.models.resume import Resume
from app.models.application import Application, ApplicationStatus
from app.schemas.application import (
    ApplicationCreate,
    ApplicationStatusUpdate,
    ApplicationResponse,
    RankedApplicantResponse,
)
from app.services.matching.scorer import match_scorer
from app.services.notifications.notification_service import notification_service

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_to_job(
    app_in: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """
    Student submits an application to an internal job posting.
    Prevents duplicate submissions via database constraint check.
    """
    posting = db.query(JobPosting).filter(JobPosting.id == app_in.job_posting_id).first()
    if not posting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found.")

    # Get active resume
    resume_id = app_in.resume_id
    if not resume_id:
        active_resume = db.query(Resume).filter(
            Resume.user_id == current_user.id
        ).order_by(Resume.created_at.desc()).first()
        if active_resume:
            resume_id = active_resume.id

    application = Application(
        user_id=current_user.id,
        job_posting_id=posting.id,
        resume_id=resume_id,
        notes=app_in.notes,
        status=ApplicationStatus.SUBMITTED
    )

    try:
        db.add(application)
        db.commit()
        db.refresh(application)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted an application for this position."
        )

    return application


@router.get("/my-applications", response_model=List[ApplicationResponse])
def list_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """
    Student lists all submitted applications with live status tracking.
    """
    return db.query(Application).filter(
        Application.user_id == current_user.id
    ).order_by(Application.applied_at.desc()).all()


@router.get("/posting/{posting_id}/applicants", response_model=List[RankedApplicantResponse])
def list_and_rank_posting_applicants(
    posting_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_employer)
):
    """
    Employer lists all applicants for a specific job posting they own,
    automatically ranked by AI match score against the posting requirements.
    """
    employer = db.query(EmployerProfile).filter(EmployerProfile.user_id == current_user.id).first()
    if not employer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employer profile required.")

    posting = db.query(JobPosting).filter(
        JobPosting.id == posting_id,
        JobPosting.employer_id == employer.id
    ).first()

    if not posting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found or unauthorized.")

    applications = db.query(Application).filter(
        Application.job_posting_id == posting_id
    ).all()

    ranked_results: List[RankedApplicantResponse] = []

    for app in applications:
        candidate_user = db.query(User).filter(User.id == app.user_id).first()
        if not candidate_user:
            continue

        resume = None
        if app.resume_id:
            resume = db.query(Resume).filter(Resume.id == app.resume_id).first()
        if not resume:
            resume = db.query(Resume).filter(
                Resume.user_id == candidate_user.id
            ).order_by(Resume.created_at.desc()).first()

        parsed_data = resume.parsed_data if resume and resume.parsed_data else {}
        resume_embedding = resume.embedding if resume else None

        # Compute match score against this job posting
        total_score, skill_score, exp_score, edu_score, explanation = match_scorer.score_resume_against_job(
            resume_parsed_data=parsed_data,
            required_skills=posting.required_skills or [],
            job_description=posting.description or "",
            min_education_level=posting.min_education_level,
            resume_embedding=resume_embedding,
            job_embedding=posting.embedding
        )

        ranked_results.append(
            RankedApplicantResponse(
                id=app.id,
                application_id=app.id,
                user_id=candidate_user.id,
                candidate_name=candidate_user.full_name or "Candidate",
                candidate_email=candidate_user.email,
                status=app.status,
                applied_at=app.applied_at,
                resume_id=resume.id if resume else None,
                resume_url=resume.file_url if resume else None,
                resume_filename=resume.file_name if resume else None,
                match_score=total_score,
                skill_score=skill_score,
                experience_score=exp_score,
                education_score=edu_score,
                explanation=explanation
            )
        )

    # Sort candidates by AI match score in descending order
    ranked_results.sort(key=lambda x: x.match_score, reverse=True)
    return ranked_results


@router.patch("/{application_id}/status", response_model=ApplicationResponse)
def update_application_status(
    application_id: str,
    status_update: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_employer)
):
    """
    Employer updates candidate application status (e.g. shortlisted, interview_scheduled, accepted).
    Automatically creates and dispatches an in-app notification to the candidate.
    """
    employer = db.query(EmployerProfile).filter(EmployerProfile.user_id == current_user.id).first()
    if not employer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employer profile required.")

    application = db.query(Application).join(JobPosting).filter(
        Application.id == application_id,
        JobPosting.employer_id == employer.id
    ).first()

    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found or unauthorized.")

    old_status = application.status
    application.status = status_update.status
    db.commit()
    db.refresh(application)

    # Dispatch notification to candidate if status changed
    if old_status != application.status and application.job_posting:
        notification_service.notify_status_change(
            db=db,
            user_id=application.user_id,
            job_title=application.job_posting.title,
            company_name=employer.company_name,
            new_status=application.status,
            application_id=application.id
        )

    return application
