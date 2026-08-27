import math
from typing import List


def precision_at_k(
    ranked_relevance: List[int],
    k: int,
    relevance_threshold: int = 1
) -> float:
    """
    Computes Precision@k: fraction of items in the top-k that are relevant.
    Args:
        ranked_relevance: List of relevance scores (e.g. 0 to 3) in ranked order.
        k: Cut-off rank.
        relevance_threshold: Minimum score considered relevant (default 1).
    """
    if k <= 0:
        return 0.0
    sub = ranked_relevance[:k]
    if not sub:
        return 0.0
    relevant_count = sum(1 for r in sub if r >= relevance_threshold)
    return round(relevant_count / k, 4)


def dcg_at_k(ranked_relevance: List[int], k: int) -> float:
    """
    Computes Discounted Cumulative Gain at rank k using the standard exponential formulation:
    DCG@k = sum_{i=1}^k (2^{rel_i} - 1) / log2(i + 1)
    """
    dcg = 0.0
    for i, rel in enumerate(ranked_relevance[:k]):
        gain = (2.0 ** rel) - 1.0
        discount = math.log2(i + 2)  # i+2 because i is 0-indexed (rank 1 -> log2(2) = 1)
        dcg += gain / discount
    return dcg


def ndcg_at_k(ranked_relevance: List[int], k: int) -> float:
    """
    Computes Normalized Discounted Cumulative Gain at rank k:
    NDCG@k = DCG@k / IDCG@k
    """
    if k <= 0 or not ranked_relevance:
        return 0.0

    actual_dcg = dcg_at_k(ranked_relevance, k)
    
    # Ideal DCG: Sort relevance in perfect descending order
    ideal_relevance = sorted(ranked_relevance, reverse=True)
    ideal_dcg = dcg_at_k(ideal_relevance, k)

    if ideal_dcg == 0.0:
        return 0.0

    return round(actual_dcg / ideal_dcg, 4)


def reciprocal_rank(ranked_relevance: List[int], relevance_threshold: int = 1) -> float:
    """
    Computes Reciprocal Rank for a single query: 1 / rank of first relevant item.
    """
    for i, rel in enumerate(ranked_relevance):
        if rel >= relevance_threshold:
            return round(1.0 / (i + 1), 4)
    return 0.0


def mean_reciprocal_rank(
    all_ranked_relevances: List[List[int]],
    relevance_threshold: int = 1
) -> float:
    """
    Computes Mean Reciprocal Rank (MRR) across multiple queries.
    """
    if not all_ranked_relevances:
        return 0.0
    rrs = [reciprocal_rank(r, relevance_threshold) for r in all_ranked_relevances]
    return round(sum(rrs) / len(rrs), 4)
