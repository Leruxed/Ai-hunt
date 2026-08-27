from typing import List, Dict, Any, Tuple
from app.schemas.match import MatchExplanation
from app.services.resume_parser.skills_taxonomy import skills_normalizer


class MatchScorer:
    """
    Weighted matching engine delivering explainable scores between candidate resumes and job postings.
    Weights are configurable:
        match_score = 0.5 * skill_score + 0.3 * experience_score + 0.2 * education_score
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
        Computes skill overlap score and categorizes matched vs missing skills.
        """
        if not required_skills:
            # If no skills explicitly required, default to high general baseline
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
        Evaluates candidate experience.
        For entry-level/internships, baseline score is positive if any relevant projects/roles exist.
        """
        if not resume_experience:
            return 0.5  # Neutral baseline for student intern candidates
        return min(1.0, 0.6 + (len(resume_experience) * 0.15))

    def calculate_education_score(
        self,
        resume_education: List[Dict[str, Any]],
        min_education_level: str = None
    ) -> float:
        """
        Evaluates candidate education background.
        """
        if not resume_education:
            return 0.7  # Good default for ongoing college students
        return 0.9

    def score_resume_against_job(
        self,
        resume_parsed_data: Dict[str, Any],
        required_skills: List[str],
        job_description: str = "",
        min_education_level: str = None
    ) -> Tuple[float, float, float, float, MatchExplanation]:
        """
        Produces overall match score along with full explainability breakdown.
        """
        candidate_skills = resume_parsed_data.get("skills", [])
        candidate_exp = resume_parsed_data.get("experience", [])
        candidate_edu = resume_parsed_data.get("education", [])

        # Skill score
        skill_score, matched_skills, missing_skills = self.calculate_skill_overlap(
            candidate_skills, required_skills
        )

        # Experience score
        exp_score = self.calculate_experience_score(candidate_exp, job_description)

        # Education score
        edu_score = self.calculate_education_score(candidate_edu, min_education_level)

        # Composite score
        total_score = round(
            (self.skill_weight * skill_score) +
            (self.experience_weight * exp_score) +
            (self.education_weight * edu_score),
            3
        )

        # Build explainability payload
        match_pct = round(skill_score * 100, 1)
        if matched_skills and not missing_skills:
            summary = f"Strong match ({match_pct}% skills match). You possess all {len(matched_skills)} required skills."
        elif matched_skills:
            summary = f"Good match ({match_pct}% skills match). Matched {len(matched_skills)}/{len(matched_skills) + len(missing_skills)} required skills."
        else:
            summary = "Found growth opportunity. Missing primary required skills."

        explanation = MatchExplanation(
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            summary=summary,
            skill_match_percentage=match_pct
        )

        return total_score, skill_score, exp_score, edu_score, explanation


# Global singleton instance
match_scorer = MatchScorer()
