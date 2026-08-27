from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.evaluation.benchmark_runner import run_matching_benchmark

router = APIRouter(prefix="/evaluation", tags=["Academic Evaluation & Benchmarks"])


@router.post("/run-benchmark", status_code=status.HTTP_200_OK)
def trigger_matching_benchmark(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Executes the scientific recommendation evaluation suite against standardized test profiles
    and calculates Precision@K, NDCG@K, MRR, and scoring latency metrics.
    """
    results = run_matching_benchmark()
    return results


@router.get("/metrics-definitions")
def get_metrics_definitions():
    """
    Returns mathematical definitions and references for evaluation metrics used in thesis defense.
    """
    return {
        "precision_at_k": "Fraction of top-k recommended opportunities that meet human relevance threshold (>= 2).",
        "ndcg_at_k": "Normalized Discounted Cumulative Gain accounting for position-weighted relevance relative to ideal ranking.",
        "mrr": "Mean Reciprocal Rank measuring the inverse rank position of the first highly relevant opportunity.",
        "formula_match_score": "0.5 * (0.6*skill_overlap + 0.4*vector_cosine) + 0.3*experience + 0.2*education"
    }
