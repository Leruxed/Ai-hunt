import pytest
from app.models.user import User
from app.models.resume import Resume, ResumeStatus
from app.models.job_posting import JobPosting, JobType, JobStatus
from app.models.employer_profile import EmployerProfile


def test_data_portability_export_ra_10173(client, db):
    # 1. Register student
    stu_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "privacy_export@university.edu",
            "password": "SecurePassword123!",
            "full_name": "Export Student",
            "role": "student"
        }
    )
    stu_token = stu_resp.json()["access_token"]
    user = db.query(User).filter(User.email == "privacy_export@university.edu").first()

    # 2. Add sample resume and application
    resume = Resume(
        user_id=user.id,
        file_name="privacy_resume.pdf",
        file_url="/files/privacy_resume.pdf",
        mime_type="application/pdf",
        raw_text="Python and React experience",
        parsed_data={"skills": ["Python", "React"]},
        status=ResumeStatus.ACTIVE
    )
    db.add(resume)
    db.commit()

    # 3. Request data export archive
    export_resp = client.get(
        "/api/v1/auth/me/export",
        headers={"Authorization": f"Bearer {stu_token}"}
    )
    assert export_resp.status_code == 200
    export_data = export_resp.json()

    assert "Republic Act No. 10173" in export_data["compliance_standard"]
    assert export_data["user_profile"]["email"] == "privacy_export@university.edu"
    assert len(export_data["resumes"]) == 1
    assert export_data["resumes"][0]["parsed_data"]["skills"] == ["Python", "React"]


def test_right_to_erasure_account_deletion_ra_10173(client, db):
    # 1. Register user
    stu_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "erasure_target@university.edu",
            "password": "SecurePassword123!",
            "full_name": "Erasure Student",
            "role": "student"
        }
    )
    stu_token = stu_resp.json()["access_token"]
    user_id = stu_resp.json()["user"]["id"]

    # 2. Request permanent account deletion
    del_resp = client.delete(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {stu_token}"}
    )
    assert del_resp.status_code == 200
    assert "permanently erased" in del_resp.json()["message"].lower()

    # 3. Verify user no longer exists in database
    deleted_user = db.query(User).filter(User.id == user_id).first()
    assert deleted_user is None


def test_matching_benchmark_execution(client, db):
    # Register an admin/user to trigger benchmark
    adm_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "eval_admin@university.edu",
            "password": "AdminPassword123!",
            "full_name": "Evaluation Admin",
            "role": "coordinator"
        }
    )
    adm_token = adm_resp.json()["access_token"]

    # Run matching benchmark suite
    benchmark_resp = client.post(
        "/api/v1/evaluation/run-benchmark",
        headers={"Authorization": f"Bearer {adm_token}"}
    )
    assert benchmark_resp.status_code == 200
    results = benchmark_resp.json()

    assert results["benchmark_status"] == "completed"
    assert results["queries_evaluated"] >= 3
    assert "precision_at_3" in results["macro_metrics"]
    assert "ndcg_at_3" in results["macro_metrics"]
    assert "mean_reciprocal_rank" in results["macro_metrics"]
    assert results["macro_metrics"]["ndcg_at_3"] > 0.8  # Strong ranking accuracy


def test_security_headers_present(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
