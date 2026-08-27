import io
import pytest
from app.models.resume import Resume, ResumeStatus
from app.models.user import User


def test_resume_upload_and_semantic_matching(client, db):
    # 1. Register student
    stu_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "student_phase2@university.edu",
            "password": "SecurePassword123!",
            "full_name": "Phase2 Student",
            "role": "student"
        }
    )
    stu_token = stu_resp.json()["access_token"]

    # 2. Register employer
    emp_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "hr_phase2@cloudcorp.com",
            "password": "EmployerPass123!",
            "full_name": "Cloud Corp HR",
            "role": "employer"
        }
    )
    emp_token = emp_resp.json()["access_token"]

    # 3. Employer creates two job postings (one closely matching, one unrelated)
    client.post(
        "/api/v1/jobs/",
        headers={"Authorization": f"Bearer {emp_token}"},
        json={
            "title": "Python Backend Developer Intern",
            "description": "Building microservices with Python, FastAPI, and PostgreSQL.",
            "job_type": "internship",
            "required_skills": ["Python", "FastAPI", "PostgreSQL"],
            "preferred_skills": ["Docker"]
        }
    )

    client.post(
        "/api/v1/jobs/",
        headers={"Authorization": f"Bearer {emp_token}"},
        json={
            "title": "Flutter Mobile Developer Intern",
            "description": "Building cross-platform mobile apps with Dart and Flutter.",
            "job_type": "internship",
            "required_skills": ["Flutter", "Dart"],
            "preferred_skills": ["Firebase"]
        }
    )

    # 4. Student creates resume record in the test session
    student = db.query(User).filter(User.email == "student_phase2@university.edu").first()
    resume = Resume(
        user_id=student.id,
        file_name="sample_resume.pdf",
        file_url="/files/sample.pdf",
        mime_type="application/pdf",
        raw_text="Experienced in Python, FastAPI, React, PostgreSQL.",
        parsed_data={
            "skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
            "education": [{"degree": "BS", "field_of_study": "Computer Science"}],
            "experience": [{"title": "Intern", "company": "Tech Lab"}],
            "certifications": [],
            "summary": "Junior Python Backend Engineer"
        },
        status=ResumeStatus.ACTIVE
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    resume_id = resume.id

    # 5. Trigger parsed-data update to generate vector embeddings
    update_resp = client.put(
        f"/api/v1/resumes/{resume_id}/parsed-data",
        headers={"Authorization": f"Bearer {stu_token}"},
        json={
            "parsed_data": {
                "skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
                "education": [{"degree": "BS", "field_of_study": "Computer Science"}],
                "experience": [{"title": "Intern", "company": "Tech Lab"}],
                "certifications": [],
                "summary": "Junior Python Backend Engineer"
            },
            "status": "active"
        }
    )
    assert update_resp.status_code == 200

    # 6. Request recommendations feed
    rec_resp = client.get(
        "/api/v1/matches/recommendations",
        headers={"Authorization": f"Bearer {stu_token}"}
    )
    assert rec_resp.status_code == 200
    recommendations = rec_resp.json()
    assert len(recommendations) == 2

    # Top recommendation must be the Python Backend position
    top_rec = recommendations[0]
    assert top_rec["target"]["title"] == "Python Backend Developer Intern"
    assert top_rec["match_score"] > recommendations[1]["match_score"]
    assert top_rec["explanation"]["skill_match_percentage"] == 100.0
    assert set(top_rec["explanation"]["matched_skills"]) == {"Python", "FastAPI", "PostgreSQL"}
