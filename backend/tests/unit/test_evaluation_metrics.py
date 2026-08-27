import pytest
from app.evaluation.metrics import (
    precision_at_k,
    dcg_at_k,
    ndcg_at_k,
    reciprocal_rank,
    mean_reciprocal_rank,
)


def test_precision_at_k_calculation():
    # 3 relevant items in top 5
    relevance = [3, 2, 0, 2, 0, 1]
    
    # At k=3, items are [3, 2, 0] -> 2 items >= 2
    assert precision_at_k(relevance, k=3, relevance_threshold=2) == pytest.approx(2 / 3, abs=1e-3)
    
    # At k=5, items are [3, 2, 0, 2, 0] -> 3 items >= 2
    assert precision_at_k(relevance, k=5, relevance_threshold=2) == pytest.approx(3 / 5, abs=1e-3)
    
    # Edge case: empty list or k=0
    assert precision_at_k([], k=3) == 0.0
    assert precision_at_k([3, 2], k=0) == 0.0


def test_ndcg_at_k_calculation():
    # Perfect ranking should have NDCG = 1.0
    perfect_ranking = [3, 3, 2, 1, 0]
    assert ndcg_at_k(perfect_ranking, k=3) == 1.0
    assert ndcg_at_k(perfect_ranking, k=5) == 1.0

    # Sub-optimal ranking where top item has 0 relevance
    suboptimal = [0, 2, 3, 1, 0]
    score = ndcg_at_k(suboptimal, k=3)
    assert 0.0 < score < 1.0

    # Completely irrelevant items
    zero_ranking = [0, 0, 0]
    assert ndcg_at_k(zero_ranking, k=3) == 0.0


def test_mrr_calculation():
    # Query 1: First relevant at rank 1 -> RR = 1.0
    # Query 2: First relevant at rank 2 -> RR = 0.5
    # Query 3: First relevant at rank 4 -> RR = 0.25
    queries = [
        [3, 0, 0],
        [0, 2, 0],
        [0, 0, 0, 3]
    ]
    mrr = mean_reciprocal_rank(queries, relevance_threshold=2)
    expected_mrr = (1.0 + 0.5 + 0.25) / 3.0
    assert pytest.approx(mrr, abs=1e-3) == round(expected_mrr, 4)
