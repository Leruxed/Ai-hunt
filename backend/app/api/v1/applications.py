from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.dependencies import get_db, get_current_user, require_student, require_employer
from app.models.user import User
from app.models.employer_profile import EmployerProfile
from app.models.job_posting import JobPosting
from app.models.resume import Resume, ResumeStatus
from app.models.application import Application, ApplicationStatus
from app.schemas.application import ApplicationCreate, ApplicationStatusUpdate, ApplicationResponse

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


@router.get("/posting/{posting_id}/applicants", response_model=List[ApplicationResponse])
def list_posting_applicants(
    posting_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_employer)
):
    """
    Employer lists all applicants for a specific job posting they own.
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

    return db.query(Application).filter(
        Application.job_posting_id == posting_id
    ).order_by(Application.applied_at.desc()).all()


@router.patch("/{application_id}/status", response_model=ApplicationResponse)
def update_application_status(
    application_id: str,
    status_update: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_employer)
):
    """
    Employer updates candidate application status (e.g. shortlisted, interview_scheduled, accepted).
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

    application.status = status_update.status
    db.commit()
    db.refresh(application)
    return application
