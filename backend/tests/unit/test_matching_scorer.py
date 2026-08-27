import pytest
from app.services.matching.scorer import match_scorer


def test_perfect_skill_match():
    resume_data = {
        "skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
        "experience": [{"title": "Intern", "company": "Tech Corp"}],
        "education": [{"degree": "BS", "field_of_study": "Computer Science"}]
    }
    required_skills = ["Python", "FastAPI", "PostgreSQL"]

    score, skill_s, exp_s, edu_s, explanation = match_scorer.score_resume_against_job(
        resume_parsed_data=resume_data,
        required_skills=required_skills,
        job_description="Junior Python Backend Engineer"
    )

    assert skill_s == 1.0
    assert explanation.skill_match_percentage == 100.0
    assert set(explanation.matched_skills) == {"Python", "FastAPI", "PostgreSQL"}
    assert explanation.missing_skills == []
    assert score >= 0.85


def test_partial_skill_match_with_explainability():
    resume_data = {
        "skills": ["React", "JavaScript", "HTML/CSS"],
        "experience": [],
        "education": []
    }
    required_skills = ["React", "TypeScript", "Node.js"]

    score, skill_s, exp_s, edu_s, explanation = match_scorer.score_resume_against_job(
        resume_parsed_data=resume_data,
        required_skills=required_skills,
        job_description="Frontend Developer Intern"
    )

    assert round(skill_s, 2) == 0.33
    assert explanation.matched_skills == ["React"]
    assert set(explanation.missing_skills) == {"TypeScript", "Node.js"}
    assert "Missing" in explanation.summary or "Good match" in explanation.summary
