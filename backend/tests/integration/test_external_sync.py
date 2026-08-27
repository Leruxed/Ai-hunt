import pytest
from app.models.external_job import ExternalJob
from app.models.user import User
from app.models.resume import Resume, ResumeStatus
from app.services.external_jobs.sync_worker import sync_external_jobs


@pytest.mark.asyncio
async def test_external_sync_and_merged_recommendation_feed(client, db):
    # 1. Run sync worker with test query
    sync_result = await sync_external_jobs(db, queries=["Software Engineer Intern Philippines"])
    assert sync_result["status"] == "success"
    assert sync_result["jobs_created"] > 0

    # 2. Verify external jobs exist in cache table
    external_jobs = db.query(ExternalJob).all()
    assert len(external_jobs) > 0
    first_job = external_jobs[0]
    assert first_job.source == "JSearch"
    assert len(first_job.embedding) == 384
    assert first_job.apply_url.startswith("http")

    # 3. Test deduplication idempotency (running sync again should update, not duplicate)
    count_before = db.query(ExternalJob).count()
    second_sync = await sync_external_jobs(db, queries=["Software Engineer Intern Philippines"])
    count_after = db.query(ExternalJob).count()
    assert count_after == count_before
    assert second_sync["jobs_updated"] > 0

    # 4. Register a student with matching skills
    stu_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "student_sync@university.edu",
            "password": "SecurePassword123!",
            "full_name": "Sync Student",
            "role": "student"
        }
    )
    stu_token = stu_resp.json()["access_token"]
    student = db.query(User).filter(User.email == "student_sync@university.edu").first()

    # Create active resume for student
    resume = Resume(
        user_id=student.id,
        file_name="resume.pdf",
        file_url="/files/resume.pdf",
        mime_type="application/pdf",
        raw_text="Experienced in Python, FastAPI, React, PostgreSQL",
        parsed_data={
            "skills": ["Python", "FastAPI", "React", "PostgreSQL"],
            "education": [{"degree": "BS", "field_of_study": "Computer Science"}],
            "experience": [{"title": "Intern", "company": "Tech"}],
            "certifications": [],
            "summary": "Full Stack Developer"
        },
        status=ResumeStatus.ACTIVE
    )
    db.add(resume)
    db.commit()

    # 5. Query recommendation feed - should include external postings with source badges
    rec_resp = client.get(
        "/api/v1/matches/recommendations",
        headers={"Authorization": f"Bearer {stu_token}"}
    )
    assert rec_resp.status_code == 200
    recommendations = rec_resp.json()
    assert len(recommendations) > 0

    # Verify presence of external recommendations
    external_recs = [r for r in recommendations if r["target_type"] == "external"]
    assert len(external_recs) > 0
    assert external_recs[0]["target"]["source"] == "JSearch"
    assert external_recs[0]["explanation"]["summary"] != ""


def test_list_external_jobs_endpoint(client, db):
    # Register user and test GET /api/v1/external-jobs/
    stu_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "browse_student@university.edu",
            "password": "SecurePassword123!",
            "full_name": "Browse Student",
            "role": "student"
        }
    )
    stu_token = stu_resp.json()["access_token"]

    list_resp = client.get(
        "/api/v1/external-jobs/",
        headers={"Authorization": f"Bearer {stu_token}"}
    )
    assert list_resp.status_code == 200
    assert isinstance(list_resp.json(), list)
