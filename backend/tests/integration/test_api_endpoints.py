import io
import pytest
from app.models.user import UserRole


def test_auth_registration_and_login(client):
    # 1. Register student
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "student@university.edu",
            "password": "SecurePassword123!",
            "full_name": "Juan Dela Cruz",
            "role": "student"
        }
    )
    assert reg_resp.status_code == 201
    data = reg_resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "student@university.edu"
    assert data["user"]["role"] == "student"

    # 2. Duplicate registration rejected
    dup_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "student@university.edu",
            "password": "AnotherPassword",
            "role": "student"
        }
    )
    assert dup_resp.status_code == 400

    # 3. Login
    login_resp = client.post(
        "/api/v1/auth/login",
        data={
            "username": "student@university.edu",
            "password": "SecurePassword123!"
        }
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    # 4. Get Current User (/me)
    me_resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["full_name"] == "Juan Dela Cruz"


def test_employer_job_posting_and_student_application(client):
    # 1. Register employer
    emp_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "hr@innovatetech.com",
            "password": "EmployerPass123!",
            "full_name": "Innovate Tech HR",
            "role": "employer"
        }
    )
    emp_token = emp_resp.json()["access_token"]

    # 2. Register student
    stu_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "maria@university.edu",
            "password": "StudentPass123!",
            "full_name": "Maria Santos",
            "role": "student"
        }
    )
    stu_token = stu_resp.json()["access_token"]

    # 3. Employer creates a job posting
    job_resp = client.post(
        "/api/v1/jobs/",
        headers={"Authorization": f"Bearer {emp_token}"},
        json={
            "title": "Software Engineer Intern",
            "description": "Looking for passionate interns familiar with Python and React.",
            "job_type": "internship",
            "location": "Makati City, Metro Manila",
            "is_remote": "hybrid",
            "required_skills": ["python", "reactjs", "postgresql"],
            "preferred_skills": ["docker"]
        }
    )
    assert job_resp.status_code == 201
    job_data = job_resp.json()
    job_id = job_data["id"]
    # Skills should be normalized
    assert job_data["required_skills"] == ["Python", "React", "PostgreSQL"]

    # 4. Student applies to the job
    app_resp = client.post(
        "/api/v1/applications/",
        headers={"Authorization": f"Bearer {stu_token}"},
        json={
            "job_posting_id": job_id,
            "notes": "Eager to learn and contribute to your team!"
        }
    )
    assert app_resp.status_code == 201
    assert app_resp.json()["status"] == "submitted"

    # 5. Student duplicate application attempt should be blocked with 400
    dup_app_resp = client.post(
        "/api/v1/applications/",
        headers={"Authorization": f"Bearer {stu_token}"},
        json={"job_posting_id": job_id}
    )
    assert dup_app_resp.status_code == 400
    assert "already submitted" in dup_app_resp.json()["detail"].lower()

    # 6. Employer views applicants and updates candidate status
    app_list_resp = client.get(
        f"/api/v1/applications/posting/{job_id}/applicants",
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert app_list_resp.status_code == 200
    applicants = app_list_resp.json()
    assert len(applicants) == 1
    app_id = applicants[0]["id"]

    # Update candidate status to shortlisted
    status_resp = client.patch(
        f"/api/v1/applications/{app_id}/status",
        headers={"Authorization": f"Bearer {emp_token}"},
        json={"status": "shortlisted"}
    )
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == "shortlisted"
