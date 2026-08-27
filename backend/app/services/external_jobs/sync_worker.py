from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.external_job import ExternalJob
from app.services.external_jobs.jsearch_client import jsearch_client
from app.services.external_jobs.normalizer import external_job_normalizer


async def sync_external_jobs(
    db: Session,
    queries: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Background sync worker that queries external job boards (JSearch),
    normalizes listings into the EXTERNAL_JOBS cache table, and purges stale listings.
    """
    search_queries = queries or settings.DEFAULT_PH_SEARCH_QUERIES
    total_fetched = 0
    total_created = 0
    total_updated = 0

    seen_refs = set()

    for query in search_queries:
        raw_jobs = await jsearch_client.search_jobs(query)
        total_fetched += len(raw_jobs)

        for raw_job in raw_jobs:
            normalized = external_job_normalizer.normalize_jsearch_job(raw_job)
            if not normalized:
                continue

            ref = normalized["external_ref"]
            if ref in seen_refs:
                continue
            seen_refs.add(ref)

            # Check if job already exists in cache table
            existing = db.query(ExternalJob).filter(
                ExternalJob.source == normalized["source"],
                ExternalJob.external_ref == ref
            ).first()

            if existing:
                # Update existing record and refresh expiration
                existing.title = normalized["title"]
                existing.company_name = normalized["company_name"]
                existing.location = normalized["location"]
                existing.description_snippet = normalized["description_snippet"]
                existing.apply_url = normalized["apply_url"]
                existing.source_board = normalized["source_board"]
                existing.required_skills = normalized["required_skills"]
                existing.embedding = normalized["embedding"]
                existing.fetched_at = normalized["fetched_at"]
                existing.expires_at = normalized["expires_at"]
                total_updated += 1
            else:
                # Insert new external job row
                new_job = ExternalJob(
                    source=normalized["source"],
                    external_ref=normalized["external_ref"],
                    title=normalized["title"],
                    company_name=normalized["company_name"],
                    location=normalized["location"],
                    description_snippet=normalized["description_snippet"],
                    apply_url=normalized["apply_url"],
                    source_board=normalized["source_board"],
                    required_skills=normalized["required_skills"],
                    embedding=normalized["embedding"],
                    fetched_at=normalized["fetched_at"],
                    expires_at=normalized["expires_at"]
                )
                db.add(new_job)
                total_created += 1

    # Prune expired external jobs
    now = datetime.now(timezone.utc)
    deleted_count = db.query(ExternalJob).filter(
        ExternalJob.expires_at < now
    ).delete()

    db.commit()

    return {
        "status": "success",
        "queries_processed": len(search_queries),
        "jobs_fetched": total_fetched,
        "jobs_created": total_created,
        "jobs_updated": total_updated,
        "expired_pruned": deleted_count
    }
