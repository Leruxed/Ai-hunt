from typing import List, Dict, Any, Tuple, Optional
from app.schemas.match import MatchExplanation
from app.services.resume_parser.skills_taxonomy import skills_normalizer
from app.services.matching.embedding_service import embedding_service


class MatchScorer:
    """
    Weighted matching engine delivering explainable scores between candidate resumes and job postings.
    Formula:
        match_score = 0.5 * skill_score + 0.3 * experience_score + 0.2 * education_score
    Where skill_score blends structured taxonomy overlap with dense vector semantic similarity.
    """

    def __init__(
        self,
        skill_weight: float = 0.5,
        experience_weight: float = 0.3,
        education_weight: float = 0.2
    ):
        self.skill_weight = skill_weight
        self.experience_weight = experience_weight
        self.education_weight = education_weight

    def calculate_skill_overlap(
        self,
        resume_skills: List[str],
        required_skills: List[str]
    ) -> Tuple[float, List[str], List[str]]:
        """
        Computes exact/taxonomy skill overlap score and categorizes matched vs missing skills.
        """
        if not required_skills:
            return 1.0, resume_skills, []

        norm_resume_skills = set(skills_normalizer.normalize_skills_list(resume_skills))
        norm_required_skills = set(skills_normalizer.normalize_skills_list(required_skills))

        matched = list(norm_required_skills.intersection(norm_resume_skills))
        missing = list(norm_required_skills.difference(norm_resume_skills))

        score = len(matched) / len(norm_required_skills)
        return score, matched, missing

    def calculate_experience_score(
        self,
        resume_experience: List[Dict[str, Any]],
        job_description: str
    ) -> float:
        """
        Evaluates candidate experience relevance.
        """
        if not resume_experience:
            return 0.5  # Neutral baseline for student intern candidates
        return min(1.0, 0.6 + (len(resume_experience) * 0.15))

    def calculate_education_score(
        self,
        resume_education: List[Dict[str, Any]],
        min_education_level: Optional[str] = None
    ) -> float:
        """
        Evaluates candidate education background.
        """
        if not resume_education:
            return 0.7  # Baseline for ongoing college students
        return 0.9

    def score_resume_against_job(
        self,
        resume_parsed_data: Dict[str, Any],
        required_skills: List[str],
        job_description: str = "",
        min_education_level: Optional[str] = None,
        resume_embedding: Optional[List[float]] = None,
        job_embedding: Optional[List[float]] = None
    ) -> Tuple[float, float, float, float, MatchExplanation]:
        """
        Produces overall match score along with full explainability breakdown.
        Blends semantic vector similarity with taxonomy overlap when embeddings exist.
        """
        candidate_skills = resume_parsed_data.get("skills", [])
        candidate_exp = resume_parsed_data.get("experience", [])
        candidate_edu = resume_parsed_data.get("education", [])

        # 1. Exact & taxonomy skill overlap
        overlap_score, matched_skills, missing_skills = self.calculate_skill_overlap(
            candidate_skills, required_skills
        )

        # 2. Semantic vector cosine similarity (if available)
        if resume_embedding and job_embedding:
            semantic_sim = embedding_service.compute_cosine_similarity(
                resume_embedding, job_embedding
            )
            # 60% taxonomy overlap + 40% semantic similarity
            skill_score = (0.6 * overlap_score) + (0.4 * semantic_sim)
        else:
            skill_score = overlap_score

        # 3. Experience score
        exp_score = self.calculate_experience_score(candidate_exp, job_description)

        # 4. Education score
        edu_score = self.calculate_education_score(candidate_edu, min_education_level)

        # 5. Composite score
        total_score = round(
            (self.skill_weight * skill_score) +
            (self.experience_weight * exp_score) +
            (self.education_weight * edu_score),
            3
        )

        # Build transparent explainability summary
        match_pct = round(overlap_score * 100, 1)
        total_required = len(matched_skills) + len(missing_skills)
        
        if total_required > 0 and len(matched_skills) == total_required:
            summary = f"Strong match ({match_pct}% skills overlap). You possess all {len(matched_skills)} required skills."
        elif matched_skills:
            summary = f"Good match ({match_pct}% skills overlap). Matched {len(matched_skills)} of {total_required} required skills."
        else:
            summary = "Growth opportunity. Missing primary required skills."

        explanation = MatchExplanation(
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            summary=summary,
            skill_match_percentage=match_pct
        )

        return total_score, skill_score, exp_score, edu_score, explanation


# Global singleton instance
match_scorer = MatchScorer()
