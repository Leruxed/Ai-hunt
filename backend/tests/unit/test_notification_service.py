import pytest
from app.models.user import User, UserRole
from app.models.application import ApplicationStatus
from app.models.notification import Notification
from app.services.notifications.notification_service import notification_service
from app.core.security import get_password_hash


def test_notification_status_formatting_and_creation(db):
    # Create test user
    user = User(
        email="notif_test@university.edu",
        hashed_password=get_password_hash("Password123!"),
        full_name="Notif Student",
        role=UserRole.STUDENT
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Trigger shortlist notification
    notif = notification_service.notify_status_change(
        db=db,
        user_id=user.id,
        job_title="Backend Intern",
        company_name="Cloud Tech Manila",
        new_status=ApplicationStatus.SHORTLISTED,
        application_id="app-12345"
    )

    assert notif is not None
    assert notif.user_id == user.id
    assert notif.is_read is False
    assert "Shortlisted" in notif.title
    assert "Cloud Tech Manila" in notif.message
    assert notif.metadata_json["new_status"] == "shortlisted"
    assert notif.metadata_json["application_id"] == "app-12345"


def test_custom_notification_creation(db):
    user = User(
        email="notif_custom@university.edu",
        hashed_password=get_password_hash("Password123!"),
        full_name="Custom Notif Student",
        role=UserRole.STUDENT
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    notif = notification_service.create_notification(
        db=db,
        user_id=user.id,
        title="Resume Parsed Successfully",
        message="Your resume was parsed and 8 skills were detected.",
        notification_type="resume_parsed"
    )

    assert notif.title == "Resume Parsed Successfully"
    assert notif.notification_type == "resume_parsed"
    assert notif.is_read is False
