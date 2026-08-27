import pytest
from app.services.resume_parser.skills_taxonomy import skills_normalizer


def test_exact_and_alias_normalization():
    assert skills_normalizer.normalize_skill("Python") == "Python"
    assert skills_normalizer.normalize_skill("python3") == "Python"
    assert skills_normalizer.normalize_skill("py") == "Python"
    assert skills_normalizer.normalize_skill("reactjs") == "React"
    assert skills_normalizer.normalize_skill("react.js") == "React"
    assert skills_normalizer.normalize_skill("ts") == "TypeScript"
    assert skills_normalizer.normalize_skill("k8s") == "Kubernetes"
    assert skills_normalizer.normalize_skill("postgres") == "PostgreSQL"
    assert skills_normalizer.normalize_skill("nodejs") == "Node.js"


def test_fuzzy_skill_normalization():
    # Typo variations should resolve via Levenshtein ratio
    assert skills_normalizer.normalize_skill("FastAPII") == "FastAPI"
    assert skills_normalizer.normalize_skill("postgressql") == "PostgreSQL"
    assert skills_normalizer.normalize_skill("Tensorfloww") == "Deep Learning"


def test_skills_list_deduplication_and_ordering():
    raw = ["reactjs", "React", "Python", "python3", "ts", "TypeScript", "NonExistentCustomSkill"]
    normalized = skills_normalizer.normalize_skills_list(raw)
    
    # Should deduplicate React, Python, TypeScript and retain NonExistentCustomSkill
    assert normalized == ["React", "Python", "TypeScript", "NonExistentCustomSkill"]
