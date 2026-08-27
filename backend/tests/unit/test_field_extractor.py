import pytest
from app.services.resume_parser.field_extractor import llm_field_extractor
from app.schemas.resume import ParsedResumeData


@pytest.mark.asyncio
async def test_heuristic_fallback_extraction():
    sample_text = """
    Juan Dela Cruz
    Email: juan@university.edu
    
    Summary:
    Motivated Bachelor of Science in Computer Science student with strong foundations in full stack web development and cloud architecture.
    
    Technical Skills:
    Python, FastAPI, ReactJS, TypeScript, PostgreSQL, Docker, Git.
    
    Education:
    Bachelor of Science in Computer Science - University of the Philippines (2022 - Present)
    
    Experience:
    Software Developer Intern - Tech Solutions Inc.
    Assisted in building REST APIs with FastAPI and React dashboards.
    """

    parsed: ParsedResumeData = await llm_field_extractor.extract_fields(sample_text)

    assert isinstance(parsed, ParsedResumeData)
    # Check skills extraction and canonical normalization
    assert "Python" in parsed.skills
    assert "FastAPI" in parsed.skills
    assert "React" in parsed.skills  # "ReactJS" should normalize to "React"
    assert "TypeScript" in parsed.skills
    assert "PostgreSQL" in parsed.skills
    assert "Docker" in parsed.skills
    assert "Git" in parsed.skills

    # Check education extraction
    assert len(parsed.education) > 0
    assert "Bachelor" in parsed.education[0].degree or "Computer Science" in (parsed.education[0].field_of_study or "")

    # Check experience extraction
    assert len(parsed.experience) > 0
    assert "Junior" in parsed.experience[0].title or "Developer" in parsed.experience[0].title
