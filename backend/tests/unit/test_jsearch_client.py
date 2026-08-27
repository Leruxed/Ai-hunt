import pytest
from app.services.external_jobs.jsearch_client import jsearch_client, MOCK_PH_JOBS


@pytest.mark.asyncio
async def test_jsearch_client_offline_mock_fallback():
    # Without an API key configured, client should return mock dataset
    jobs = await jsearch_client.search_jobs("Software Engineer Intern Philippines")
    assert isinstance(jobs, list)
    assert len(jobs) > 0
    assert any("Shopee" in j.get("employer_name", "") or "Globe" in j.get("employer_name", "") for j in jobs)


@pytest.mark.asyncio
async def test_jsearch_query_filtering():
    # Filter by React
    react_jobs = await jsearch_client.search_jobs("React")
    assert isinstance(react_jobs, list)
    assert len(react_jobs) > 0
