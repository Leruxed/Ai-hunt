import pytest
from app.models.user import User
from app.models.resume import Resume, ResumeStatus
from app.services.matching.embedding_service import embedding_service


def test_employer_ranked_applicants_and_notification_workflow(client, db):
    # 1. Register employer
    emp_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "lead_recruiter@techcorp.ph",
            "password": "RecruiterPass123!",
            "full_name": "Lead Recruiter",
            "role": "employer"
        }
    )
    emp_token = emp_resp.json()["access_token"]

    # 2. Employer posts a Python & FastAPI job
    job_resp = client.post(
        "/api/v1/jobs/",
        headers={"Authorization": f"Bearer {emp_token}"},
        json={
            "title": "Backend Engineering Intern",
            "description": "Building microservices with Python, FastAPI, and PostgreSQL.",
            "job_type": "internship",
            "required_skills": ["Python", "FastAPI", "PostgreSQL"],
            "preferred_skills": ["Docker"]
        }
    )
    assert job_resp.status_code == 201
    job_id = job_resp.json()["id"]

    # 3. Register Student A (High Match: Python, FastAPI, PostgreSQL)
    stu_a_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "student_a@university.edu",
            "password": "Password123!",
            "full_name": "Alice Candidate",
            "role": "student"
        }
    )
    stu_a_token = stu_a_resp.json()["access_token"]
    user_a = db.query(User).filter(User.email == "student_a@university.edu").first()

    resume_a_parsed = {
        "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Git"],
        "education": [{"degree": "BS", "field_of_study": "Computer Science"}],
        "experience": [{"title": "Junior Developer"}],
        "certifications": [],
        "summary": "Experienced in Python and FastAPI backend development."
    }
    vec_a = embedding_service.generate_embedding(
        embedding_service.build_resume_text_representation(resume_a_parsed)
    )
    resume_a = Resume(
        user_id=user_a.id,
        file_name="alice_resume.pdf",
        file_url="/files/alice.pdf",
        mime_type="application/pdf",
        parsed_data=resume_a_parsed,
        embedding=vec_a,
        status=ResumeStatus.ACTIVE
    )
    db.add(resume_a)
    db.commit()

    # 4. Register Student B (Low Match: HTML, CSS only)
    stu_b_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "student_b@university.edu",
            "password": "Password123!",
            "full_name": "Bob Candidate",
            "role": "student"
        }
    )
    stu_b_token = stu_b_resp.json()["access_token"]
    user_b = db.query(User).filter(User.email == "student_b@university.edu").first()

    resume_b_parsed = {
        "skills": ["HTML", "CSS"],
        "education": [{"degree": "Diploma"}],
        "experience": [],
        "certifications": [],
        "summary": "Beginner web designer."
    }
    vec_b = embedding_service.generate_embedding(
        embedding_service.build_resume_text_representation(resume_b_parsed)
    )
    resume_b = Resume(
        user_id=user_b.id,
        file_name="bob_resume.pdf",
        file_url="/files/bob.pdf",
        mime_type="application/pdf",
        parsed_data=resume_b_parsed,
        embedding=vec_b,
        status=ResumeStatus.ACTIVE
    )
    db.add(resume_b)
    db.commit()

    # 5. Both students apply to the job
    app_a_resp = client.post(
        "/api/v1/applications/",
        headers={"Authorization": f"Bearer {stu_a_token}"},
        json={"job_posting_id": job_id, "notes": "Excited for this role!"}
    )
    assert app_a_resp.status_code == 201
    app_a_id = app_a_resp.json()["id"]

    app_b_resp = client.post(
        "/api/v1/applications/",
        headers={"Authorization": f"Bearer {stu_b_token}"},
        json={"job_posting_id": job_id, "notes": "Hoping to learn."}
    )
    assert app_b_resp.status_code == 201

    # 6. Employer views ranked applicants
    ranked_resp = client.get(
        f"/api/v1/applications/posting/{job_id}/applicants",
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert ranked_resp.status_code == 200
    applicants = ranked_resp.json()
    assert len(applicants) == 2

    # Verification: Alice must be ranked #1 with higher match score
    assert applicants[0]["candidate_email"] == "student_a@university.edu"
    assert applicants[0]["match_score"] > applicants[1]["match_score"]
    assert applicants[0]["explanation"]["skill_match_percentage"] == 100.0
    assert set(applicants[0]["explanation"]["matched_skills"]) == {"Python", "FastAPI", "PostgreSQL"}

    # Bob should be ranked #2
    assert applicants[1]["candidate_email"] == "student_b@university.edu"

    # 7. Employer shortlists Alice
    update_resp = client.patch(
        f"/api/v1/applications/{app_a_id}/status",
        headers={"Authorization": f"Bearer {emp_token}"},
        json={"status": "shortlisted"}
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "shortlisted"

    # 8. Alice checks her notifications
    notif_resp = client.get(
        "/api/v1/notifications/",
        headers={"Authorization": f"Bearer {stu_a_token}"}
    )
    assert notif_resp.status_code == 200
    notifications = notif_resp.json()
    assert len(notifications) > 0
    notif = notifications[0]
    assert "Shortlisted" in notif["title"]
    assert notif["is_read"] is False

    # Check unread count
    unread_resp = client.get(
        "/api/v1/notifications/unread-count",
        headers={"Authorization": f"Bearer {stu_a_token}"}
    )
    assert unread_resp.status_code == 200
    assert unread_resp.json()["unread_count"] >= 1

    # 9. Alice marks notification as read
    read_resp = client.patch(
        f"/api/v1/notifications/{notif['id']}/read",
        headers={"Authorization": f"Bearer {stu_a_token}"}
    )
    assert read_resp.status_code == 200
    assert read_resp.json()["is_read"] is True
