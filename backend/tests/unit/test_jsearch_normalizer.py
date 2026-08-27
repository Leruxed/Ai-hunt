import pytest
from app.services.external_jobs.normalizer import external_job_normalizer


def test_jsearch_normalization_and_embedding():
    raw_job = {
        "job_id": "test_jsearch_999",
        "job_title": "React & Python Full Stack Intern",
        "employer_name": "Metro Tech Solutions",
        "job_city": "Taguig",
        "job_country": "Philippines",
        "job_apply_link": "https://example.com/apply/999",
        "job_publisher": "LinkedIn",
        "job_description": "We are seeking a talented intern skilled in React, TypeScript, Python, FastAPI, and PostgreSQL to assist with cloud applications."
    }

    normalized = external_job_normalizer.normalize_jsearch_job(raw_job)

    assert normalized is not None
    assert normalized["source"] == "JSearch"
    assert normalized["external_ref"] == "test_jsearch_999"
    assert normalized["title"] == "React & Python Full Stack Intern"
    assert normalized["company_name"] == "Metro Tech Solutions"
    assert normalized["location"] == "Taguig, Philippines"
    assert normalized["source_board"] == "LinkedIn via JSearch"
    assert normalized["apply_url"] == "https://example.com/apply/999"

    # Verify skill extraction
    assert "React" in normalized["required_skills"]
    assert "TypeScript" in normalized["required_skills"]
    assert "Python" in normalized["required_skills"]
    assert "FastAPI" in normalized["required_skills"]
    assert "PostgreSQL" in normalized["required_skills"]

    # Verify 384-dimensional vector embedding
    assert len(normalized["embedding"]) == 384
    assert normalized["expires_at"] > normalized["fetched_at"]


def test_jsearch_normalization_missing_fields():
    # Incomplete job without apply link should return None safely
    incomplete_job = {
        "job_id": "inv_1",
        "job_title": "Software Intern"
    }
    assert external_job_normalizer.normalize_jsearch_job(incomplete_job) is None
