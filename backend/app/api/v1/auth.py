from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.core.dependencies import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.employer_profile import EmployerProfile
from app.models.resume import Resume
from app.models.application import Application
from app.models.notification import Notification
from app.schemas.user import UserCreate, UserResponse, Token
from app.services.storage.storage_service import storage_service

router = APIRouter(prefix="/auth", tags=["Authentication & Privacy"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user (Student, Employer, or Coordinator).
    If Employer, creates an associated EmployerProfile.
    """
    # Check if email is already registered
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # Create user
    user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role
    )
    db.add(user)
    db.flush()

    # Create empty employer profile if user is an employer
    if user_in.role == UserRole.EMPLOYER:
        profile = EmployerProfile(
            user_id=user.id,
            company_name=user_in.full_name or "Company Name"
        )
        db.add(profile)

    db.commit()
    db.refresh(user)

    # Generate JWT
    access_token = create_access_token(subject=user.id, role=user.role.value)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = db.query(User).filter(User.email == form_data.username.lower()).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.id, role=user.role.value)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current logged in user details.
    """
    return current_user


@router.get("/me/export")
def export_my_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Data Portability Export in compliance with Section 18 of Republic Act No. 10173 (Data Privacy Act of 2012).
    Returns complete structured JSON export of all personal data, resumes, applications, and activity.
    """
    # Fetch resumes
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).all()
    resumes_data = [
        {
            "id": r.id,
            "file_name": r.file_name,
            "status": r.status.value,
            "parsed_data": r.parsed_data,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in resumes
    ]

    # Fetch applications
    applications = db.query(Application).filter(Application.user_id == current_user.id).all()
    applications_data = [
        {
            "id": a.id,
            "job_posting_id": a.job_posting_id,
            "job_title": a.job_posting.title if a.job_posting else None,
            "company_name": a.job_posting.employer.company_name if (a.job_posting and a.job_posting.employer) else None,
            "status": a.status.value,
            "notes": a.notes,
            "applied_at": a.applied_at.isoformat() if a.applied_at else None
        }
        for a in applications
    ]

    # Fetch notifications
    notifications = db.query(Notification).filter(Notification.user_id == current_user.id).all()
    notifications_data = [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.notification_type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None
        }
        for n in notifications
    ]

    # Employer profile if applicable
    employer_profile = None
    if current_user.role == UserRole.EMPLOYER:
        emp = db.query(EmployerProfile).filter(EmployerProfile.user_id == current_user.id).first()
        if emp:
            employer_profile = {
                "company_name": emp.company_name,
                "company_description": emp.company_description,
                "website": emp.website,
                "location": emp.location
            }

    return {
        "compliance_standard": "Republic Act No. 10173 (Philippine Data Privacy Act of 2012)",
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "user_profile": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role.value,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None
        },
        "employer_profile": employer_profile,
        "resumes": resumes_data,
        "applications": applications_data,
        "notifications": notifications_data
    }


@router.delete("/me", status_code=status.HTTP_200_OK)
def delete_my_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Right to Erasure / Account Deletion in compliance with Section 16 of RA 10173.
    Permanently deletes user account, cascading deletion across all DB entities,
    and wipes uploaded resume documents on physical storage.
    """
    user_id = current_user.id

    # 1. Wipe physical files from disk
    storage_service.delete_user_folder(user_id)

    # 2. Delete user from database (triggers CASCADE on resumes, applications, scores, notifs)
    db.delete(current_user)
    db.commit()

    return {
        "status": "success",
        "message": "Account and all associated personal data permanently erased in compliance with RA 10173."
    }
