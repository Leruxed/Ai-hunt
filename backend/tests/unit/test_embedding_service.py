import pytest
import math
from app.services.matching.embedding_service import embedding_service


def test_embedding_dimensions_and_norm():
    text = "FastAPI backend developer proficient in Python, PostgreSQL, and Docker containerization."
    vec = embedding_service.generate_embedding(text)

    # Must be exactly 384 dimensions
    assert len(vec) == 384
    
    # Vector should be normalized to unit length
    norm = math.sqrt(sum(x * x for x in vec))
    assert pytest.approx(norm, rel=1e-3) == 1.0


def test_empty_string_embedding():
    vec = embedding_service.generate_embedding("")
    assert len(vec) == 384
    assert all(x == 0.0 for x in vec)


def test_cosine_similarity_properties():
    text_python = "Python FastAPI backend developer with PostgreSQL database skills"
    text_python_alt = "Junior Python engineer building REST APIs with PostgreSQL"
    text_unrelated = "Senior Chef specializing in traditional French bakery and pastry arts"

    vec_py1 = embedding_service.generate_embedding(text_python)
    vec_py2 = embedding_service.generate_embedding(text_python_alt)
    vec_unrelated = embedding_service.generate_embedding(text_unrelated)

    # Identical vectors should have similarity 1.0
    sim_self = embedding_service.compute_cosine_similarity(vec_py1, vec_py1)
    assert pytest.approx(sim_self, abs=1e-3) == 1.0

    # Semantically related texts should have high similarity
    sim_related = embedding_service.compute_cosine_similarity(vec_py1, vec_py2)

    # Completely unrelated texts should have lower similarity
    sim_unrelated = embedding_service.compute_cosine_similarity(vec_py1, vec_unrelated)

    assert sim_related > sim_unrelated
