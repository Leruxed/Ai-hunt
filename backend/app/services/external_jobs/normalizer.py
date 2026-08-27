import re
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from app.core.config import settings
from app.services.resume_parser.skills_taxonomy import skills_normalizer, TAXONOMY
from app.services.matching.embedding_service import embedding_service


class ExternalJobNormalizer:
    """
    Normalizes heterogeneous external job listing objects into standardized,
    sanitized dictionary representations ready for database persistence into EXTERNAL_JOBS.
    """

    def normalize_jsearch_job(self, raw_job: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Extracts, normalizes, and embeds a raw JSearch job object.
        """
        external_ref = raw_job.get("job_id") or raw_job.get("id")
        title = raw_job.get("job_title") or raw_job.get("title")
        company = raw_job.get("employer_name") or raw_job.get("company_name") or "Verified Partner"
        apply_url = raw_job.get("job_apply_link") or raw_job.get("apply_url")

        if not external_ref or not title or not apply_url:
            return None

        # Build location
        city = raw_job.get("job_city", "")
        country = raw_job.get("job_country", "Philippines")
        location_str = f"{city}, {country}".strip(", ") if city else country

        # Build description snippet
        full_desc = raw_job.get("job_description") or raw_job.get("description_snippet") or ""
        snippet = full_desc[:600].strip() + ("..." if len(full_desc) > 600 else "")

        # Source board tagging (e.g., "LinkedIn via JSearch")
        publisher = raw_job.get("job_publisher") or "Web"
        source_board = f"{publisher} via JSearch" if "JSearch" not in publisher else publisher

        # Extract technical and domain skills from title + description
        extracted_skills = self._extract_skills_from_text(f"{title} {full_desc}")

        # Generate 384-dimensional semantic vector embedding
        embedding_text = embedding_service.build_job_text_representation(
            title=title,
            description=full_desc,
            required_skills=extracted_skills
        )
        vector_embedding = embedding_service.generate_embedding(embedding_text)

        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=settings.EXTERNAL_JOB_EXPIRY_DAYS)

        return {
            "source": "JSearch",
            "external_ref": str(external_ref),
            "title": title,
            "company_name": company,
            "location": location_str,
            "description_snippet": snippet,
            "apply_url": apply_url,
            "source_board": source_board,
            "required_skills": extracted_skills,
            "embedding": vector_embedding,
            "fetched_at": now,
            "expires_at": expires_at
        }

    def _extract_skills_from_text(self, text: str) -> List[str]:
        """Scans job description against standard taxonomy to tag required skills."""
        lower_text = text.lower()
        skills_found: List[str] = []

        for canonical, data in TAXONOMY.items():
            if re.search(rf"\b{re.escape(canonical.lower())}\b", lower_text):
                skills_found.append(canonical)
            else:
                for alias in data.get("aliases", []):
                    if re.search(rf"\b{re.escape(alias.lower())}\b", lower_text):
                        skills_found.append(canonical)
                        break

        return skills_normalizer.normalize_skills_list(skills_found)


# Global singleton instance
external_job_normalizer = ExternalJobNormalizer()
