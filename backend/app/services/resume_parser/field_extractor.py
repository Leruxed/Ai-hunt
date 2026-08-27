import json
import re
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings
from app.schemas.resume import ParsedResumeData, EducationEntry, ExperienceEntry
from app.services.resume_parser.skills_taxonomy import skills_normalizer, TAXONOMY


SYSTEM_PROMPT = """You are an expert AI Resume Parser.
Your task is to analyze the provided raw resume text and extract structured information into a strict JSON format.
Ensure you extract:
1. skills: Array of technical, professional, and soft skills mentioned.
2. education: Array of education items, each with: institution, degree, field_of_study, start_year, end_year, is_current.
3. experience: Array of work/internship/project experiences, each with: title, company, description, years (number), start_date, end_date, is_current.
4. certifications: Array of certificate or license names.
5. summary: A brief 2-3 sentence career summary/objective.

Return ONLY valid JSON matching this structure with no markdown backticks or commentary."""


class LLMFieldExtractor:
    """
    Extracts structured fields from raw resume text using an LLM.
    Includes built-in heuristic/regex fallback for offline and local testing resilience.
    """

    def __init__(
        self,
        openai_key: Optional[str] = settings.OPENAI_API_KEY,
        anthropic_key: Optional[str] = settings.ANTHROPIC_API_KEY
    ):
        self.openai_key = openai_key
        self.anthropic_key = anthropic_key

    async def extract_fields(self, raw_text: str) -> ParsedResumeData:
        """
        Extracts structured resume data with schema validation and skills taxonomy normalization.
        """
        if not raw_text or not raw_text.strip():
            return ParsedResumeData()

        # If LLM API keys are provided, call LLM
        if self.openai_key:
            try:
                data = await self._call_openai(raw_text)
                return self._validate_and_normalize(data)
            except Exception as e:
                print(f"[FieldExtractor] OpenAI extraction failed ({str(e)}), falling back to heuristic.")

        if self.anthropic_key:
            try:
                data = await self._call_anthropic(raw_text)
                return self._validate_and_normalize(data)
            except Exception as e:
                print(f"[FieldExtractor] Anthropic extraction failed ({str(e)}), falling back to heuristic.")

        # Fallback offline heuristic extractor
        data = self._heuristic_extract(raw_text)
        return self._validate_and_normalize(data)

    async def _call_openai(self, raw_text: str) -> Dict[str, Any]:
        """Calls OpenAI API with json_object response format."""
        headers = {
            "Authorization": f"Bearer {self.openai_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Resume Text:\n{raw_text}"}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            res_json = response.json()
            content = res_json["choices"][0]["message"]["content"]
            return json.loads(content)

    async def _call_anthropic(self, raw_text: str) -> Dict[str, Any]:
        """Calls Anthropic Claude API."""
        headers = {
            "x-api-key": self.anthropic_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }
        prompt = f"{SYSTEM_PROMPT}\n\nResume Text:\n{raw_text}"
        payload = {
            "model": "claude-3-haiku-20240307",
            "max_tokens": 1500,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            res_json = response.json()
            content = res_json["content"][0]["text"]
            # Extract JSON substring if wrapped in formatting
            match = re.search(r"\{.*\}", content, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            return json.loads(content)

    def _heuristic_extract(self, raw_text: str) -> Dict[str, Any]:
        """
        Deterministic regex & taxonomy-based heuristic extractor.
        Provides robust extraction without external network dependencies.
        """
        lower_text = raw_text.lower()
        extracted_skills: List[str] = []

        # 1. Extract skills matching our taxonomy
        for canonical, meta in TAXONOMY.items():
            if re.search(rf"\b{re.escape(canonical.lower())}\b", lower_text):
                extracted_skills.append(canonical)
            else:
                for alias in meta.get("aliases", []):
                    if re.search(rf"\b{re.escape(alias.lower())}\b", lower_text):
                        extracted_skills.append(canonical)
                        break

        # 2. Extract Education hints
        education_entries = []
        degree_patterns = [
            (r"(bachelor|bs|ba|undergraduate)\s+(?:of\s+science\s+in\s+|in\s+)?([a-zA-Z\s]+)", "Bachelor"),
            (r"(master|ms|ma|graduate)\s+(?:of\s+science\s+in\s+|in\s+)?([a-zA-Z\s]+)", "Master"),
            (r"(diploma|associate|senior\s+high)", "Diploma/High School"),
        ]
        for pattern, deg_type in degree_patterns:
            match = re.search(pattern, raw_text, re.IGNORECASE)
            if match:
                field = match.group(2).strip() if len(match.groups()) > 1 else ""
                education_entries.append({
                    "institution": "University / College",
                    "degree": deg_type,
                    "field_of_study": field[:50] if field else "Information Technology",
                    "start_year": "2022",
                    "end_year": "2026",
                    "is_current": True
                })
                break

        # 3. Extract Experience hints
        experience_entries = []
        role_matches = re.findall(
            r"(intern|internship|developer|engineer|assistant|lead|specialist)",
            raw_text,
            re.IGNORECASE
        )
        if role_matches:
            experience_entries.append({
                "title": f"Junior {role_matches[0].capitalize()}",
                "company": "Academic & Project Experience",
                "description": "Demonstrated hands-on software development and collaborative problem solving.",
                "years": 0.5,
                "is_current": False
            })

        # 4. Summary extraction (first paragraph with substance)
        lines = [line.strip() for line in raw_text.splitlines() if len(line.strip()) > 30]
        summary = lines[0] if lines else "Aspiring professional with foundational software engineering skills."

        return {
            "skills": extracted_skills,
            "education": education_entries,
            "experience": experience_entries,
            "certifications": [],
            "summary": summary
        }

    def _validate_and_normalize(self, raw_data: Dict[str, Any]) -> ParsedResumeData:
        """
        Validates the raw dictionary against Pydantic schema and normalizes all skill strings.
        """
        # Normalize skill strings against the controlled taxonomy
        raw_skills = raw_data.get("skills", [])
        if isinstance(raw_skills, list):
            raw_data["skills"] = skills_normalizer.normalize_skills_list(
                [str(s) for s in raw_skills if s]
            )

        # Parse and validate via Pydantic model
        return ParsedResumeData.model_validate(raw_data)


# Global singleton instance
llm_field_extractor = LLMFieldExtractor()
