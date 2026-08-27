from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.external_job import ExternalJob
from app.schemas.job import ExternalJobResponse
from app.services.external_jobs.sync_worker import sync_external_jobs

router = APIRouter(prefix="/external-jobs", tags=["External Jobs"])


@router.get("/", response_model=List[ExternalJobResponse])
def list_cached_external_jobs(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List cached external job opportunities from public boards (JSearch).
    """
    query = db.query(ExternalJob)
    if search:
        query = query.filter(
            (ExternalJob.title.ilike(f"%{search}%")) |
            (ExternalJob.company_name.ilike(f"%{search}%"))
        )

    return query.order_by(ExternalJob.fetched_at.desc()).offset(skip).limit(limit).all()


@router.post("/sync", status_code=status.HTTP_200_OK)
async def trigger_external_jobs_sync(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Triggers background synchronization of Philippine internship & entry-level job listings
    from external job aggregators into the EXTERNAL_JOBS cache table.
    """
    result = await sync_external_jobs(db)
    return result
