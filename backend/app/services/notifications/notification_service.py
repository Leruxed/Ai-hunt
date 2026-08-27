from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.application import ApplicationStatus


STATUS_MESSAGES: Dict[ApplicationStatus, Dict[str, str]] = {
    ApplicationStatus.UNDER_REVIEW: {
        "title": "Application Under Review ⏳",
        "template": "Your application for '{job_title}' at {company_name} is now being actively reviewed by the hiring team."
    },
    ApplicationStatus.SHORTLISTED: {
        "title": "Congratulations! You're Shortlisted 🎉",
        "template": "Great news! You have been shortlisted for '{job_title}' at {company_name}. Expect next steps soon."
    },
    ApplicationStatus.INTERVIEW_SCHEDULED: {
        "title": "Interview Invitation 📅",
        "template": "An interview has been requested for your application for '{job_title}' at {company_name}."
    },
    ApplicationStatus.ACCEPTED: {
        "title": "Offer / Accepted! 🌟",
        "template": "Congratulations! Your application for '{job_title}' at {company_name} has been accepted!"
    },
    ApplicationStatus.REJECTED: {
        "title": "Application Status Update",
        "template": "Thank you for your interest in '{job_title}' at {company_name}. The team has decided to move forward with other candidates at this time."
    },
}


class NotificationService:
    """
    Dispatches and persists in-app notification events for candidate and employer actions.
    """

    def notify_status_change(
        self,
        db: Session,
        user_id: str,
        job_title: str,
        company_name: str,
        new_status: ApplicationStatus,
        application_id: str
    ) -> Optional[Notification]:
        """
        Creates and persists an in-app notification when an employer updates application status.
        """
        meta = STATUS_MESSAGES.get(new_status)
        if not meta:
            title = f"Application Status: {new_status.value.replace('_', ' ').title()}"
            message = f"Your application for '{job_title}' at {company_name} was updated to {new_status.value}."
        else:
            title = meta["title"]
            message = meta["template"].format(job_title=job_title, company_name=company_name)

        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type="application_status_update",
            metadata_json={
                "application_id": application_id,
                "job_title": job_title,
                "company_name": company_name,
                "new_status": new_status.value
            },
            is_read=False
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    def create_notification(
        self,
        db: Session,
        user_id: str,
        title: str,
        message: str,
        notification_type: str = "general",
        metadata_json: Optional[Dict[str, Any]] = None
    ) -> Notification:
        """
        Creates a generic in-app notification.
        """
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            metadata_json=metadata_json or {},
            is_read=False
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification


# Global singleton instance
notification_service = NotificationService()
