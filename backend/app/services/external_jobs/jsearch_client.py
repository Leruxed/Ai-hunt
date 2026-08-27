from typing import List, Dict, Any, Optional
import httpx
from app.core.config import settings


MOCK_PH_JOBS: List[Dict[str, Any]] = [
    {
        "job_id": "jsearch_ph_001",
        "job_title": "Software Engineer Intern",
        "employer_name": "Shopee Philippines",
        "job_city": "Taguig",
        "job_country": "Philippines",
        "job_apply_link": "https://careers.shopee.ph/job/software-intern-001",
        "job_publisher": "LinkedIn",
        "job_description": "Shopee is looking for energetic Software Engineer Interns to join our engineering team in Bonifacio Global City. You will build backend microservices using Python, FastAPI, and PostgreSQL, and participate in code reviews.",
    },
    {
        "job_id": "jsearch_ph_002",
        "job_title": "Junior React & TypeScript Developer",
        "employer_name": "Globe Telecom Innovation Hub",
        "job_city": "Makati",
        "job_country": "Philippines",
        "job_apply_link": "https://www.globe.com.ph/careers/jr-frontend-002",
        "job_publisher": "Indeed",
        "job_description": "Work on customer-facing web and mobile applications using React, TypeScript, Tailwind CSS, and REST APIs. Great opportunity for recent graduates and final-year students.",
    },
    {
        "job_id": "jsearch_ph_003",
        "job_title": "Full Stack Developer Trainee (OJT)",
        "employer_name": "Accenture Philippines",
        "job_city": "Mandaluyong",
        "job_country": "Philippines",
        "job_apply_link": "https://www.accenture.com/ph-en/careers/trainee-003",
        "job_publisher": "Glassdoor",
        "job_description": "Accelerate your career with our full stack training program. Gain hands-on project experience with JavaScript, Node.js, React, Docker, and Agile Scrum methodologies.",
    },
    {
        "job_id": "jsearch_ph_004",
        "job_title": "AI & Data Science Intern",
        "employer_name": "GCash (Mynt)",
        "job_city": "Taguig",
        "job_country": "Philippines",
        "job_apply_link": "https://www.gcash.com/careers/ai-intern-004",
        "job_publisher": "JobStreet via Google",
        "job_description": "Assist our analytics and machine learning team in analyzing financial transaction patterns. Requirements: Python, Pandas, NumPy, Machine Learning fundamentals, and SQL.",
    },
    {
        "job_id": "jsearch_ph_005",
        "job_title": "Junior Mobile App Developer (React Native)",
        "employer_name": "Maya Philippines",
        "job_city": "Mandaluyong",
        "job_country": "Philippines",
        "job_apply_link": "https://www.maya.ph/careers/mobile-dev-005",
        "job_publisher": "LinkedIn",
        "job_description": "Build high-performance fintech mobile features. Experience with React Native, TypeScript, Redux/Zustand, and Git version control required.",
    }
]


class JSearchClient:
    """
    Client for querying external jobs via JSearch API on RapidAPI.
    Features automatic fallback to realistic Philippine mock fixtures when API keys are omitted or unavailable.
    """

    def __init__(
        self,
        api_key: str = settings.RAPIDAPI_KEY,
        api_host: str = settings.JSEARCH_API_HOST,
        api_url: str = settings.JSEARCH_API_URL
    ):
        self.api_key = api_key
        self.api_host = api_host
        self.api_url = api_url

    async def search_jobs(
        self,
        query: str,
        num_pages: int = 1,
        date_posted: str = "all"
    ) -> List[Dict[str, Any]]:
        """
        Queries external jobs matching query.
        Returns a list of raw job dictionaries.
        """
        if not self.api_key:
            # Return realistic local mock data for zero-cost offline development
            return self._get_filtered_mock_jobs(query)

        headers = {
            "x-rapidapi-key": self.api_key,
            "x-rapidapi-host": self.api_host
        }
        params = {
            "query": query,
            "page": "1",
            "num_pages": str(num_pages),
            "date_posted": date_posted
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(self.api_url, headers=headers, params=params)
                if response.status_code == 200:
                    data = response.json()
                    return data.get("data", [])
                elif response.status_code == 429:
                    print("[JSearchClient] Quota limit reached (HTTP 429). Falling back to cached/mock listings.")
                    return self._get_filtered_mock_jobs(query)
                else:
                    print(f"[JSearchClient] API error (HTTP {response.status_code}): {response.text}")
                    return self._get_filtered_mock_jobs(query)
        except Exception as e:
            print(f"[JSearchClient] Request failed ({str(e)}). Falling back to mock listings.")
            return self._get_filtered_mock_jobs(query)

    def _get_filtered_mock_jobs(self, query: str) -> List[Dict[str, Any]]:
        """Returns mock dataset for development and offline testing."""
        clean_q = query.lower()
        results = []
        for job in MOCK_PH_JOBS:
            # Match query against title or description or return all if generic
            if any(term in job["job_title"].lower() or term in job["job_description"].lower() for term in clean_q.split()):
                results.append(job)
        return results if results else MOCK_PH_JOBS


# Global singleton instance
jsearch_client = JSearchClient()
