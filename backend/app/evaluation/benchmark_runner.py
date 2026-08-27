import time
from typing import List, Dict, Any
from app.evaluation.metrics import precision_at_k, ndcg_at_k, reciprocal_rank, mean_reciprocal_rank
from app.services.matching.scorer import match_scorer
from app.services.matching.embedding_service import embedding_service


# Standardized Test Benchmark Dataset for Thesis Evaluation
BENCHMARK_JOBS = [
    {
        "id": "job_python_fastapi",
        "title": "Backend Engineering Intern",
        "description": "Building microservices with Python, FastAPI, PostgreSQL, and Docker.",
        "required_skills": ["Python", "FastAPI", "PostgreSQL"],
        "preferred_skills": ["Docker", "Git"],
        "min_education_level": "Bachelor"
    },
    {
        "id": "job_react_ts",
        "title": "Frontend Developer Intern",
        "description": "Developing modern interactive web apps with React, TypeScript, and Tailwind CSS.",
        "required_skills": ["React", "TypeScript", "Tailwind CSS"],
        "preferred_skills": ["Git", "REST APIs"],
        "min_education_level": "Bachelor"
    },
    {
        "id": "job_mobile_rn",
        "title": "Mobile App Developer Trainee",
        "description": "Building cross-platform mobile apps using React Native, TypeScript, and Firebase.",
        "required_skills": ["React Native", "TypeScript", "JavaScript"],
        "preferred_skills": ["Git"],
        "min_education_level": "Diploma"
    },
    {
        "id": "job_data_ai",
        "title": "AI & Machine Learning Intern",
        "description": "Assisting in building prediction models using Python, Pandas, Scikit-learn, and SQL.",
        "required_skills": ["Python", "Machine Learning", "SQL"],
        "preferred_skills": ["Pandas", "PyTorch"],
        "min_education_level": "Bachelor"
    },
    {
        "id": "job_qa_tester",
        "title": "QA Automation Engineer Intern",
        "description": "Writing automated test suites and regression scripts with Python and Selenium.",
        "required_skills": ["Python", "Selenium", "Git"],
        "preferred_skills": ["PostgreSQL"],
        "min_education_level": "Bachelor"
    }
]

BENCHMARK_PROFILES = [
    {
        "profile_id": "student_backend",
        "name": "Backend Specialist",
        "parsed_data": {
            "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Git"],
            "education": [{"degree": "Bachelor of Science", "field_of_study": "Computer Science"}],
            "experience": [{"title": "Junior Python Developer"}],
            "summary": "FastAPI and Python backend software engineer."
        },
        # Human relevance ground truth grades (3=Highly Relevant, 2=Relevant, 1=Marginally, 0=Irrelevant)
        "ground_truth_relevance": {
            "job_python_fastapi": 3,
            "job_data_ai": 2,
            "job_qa_tester": 2,
            "job_react_ts": 0,
            "job_mobile_rn": 0
        }
    },
    {
        "profile_id": "student_frontend",
        "name": "Frontend Specialist",
        "parsed_data": {
            "skills": ["React", "TypeScript", "JavaScript", "HTML", "CSS", "Tailwind CSS"],
            "education": [{"degree": "Bachelor of Science", "field_of_study": "Information Technology"}],
            "experience": [{"title": "Web Designer"}],
            "summary": "React and TypeScript web developer."
        },
        "ground_truth_relevance": {
            "job_react_ts": 3,
            "job_mobile_rn": 2,
            "job_python_fastapi": 0,
            "job_data_ai": 0,
            "job_qa_tester": 0
        }
    },
    {
        "profile_id": "student_mobile",
        "name": "Mobile Specialist",
        "parsed_data": {
            "skills": ["React Native", "React", "TypeScript", "JavaScript", "Firebase"],
            "education": [{"degree": "Diploma", "field_of_study": "Computer Science"}],
            "experience": [{"title": "Mobile App Developer"}],
            "summary": "React Native cross-platform mobile developer."
        },
        "ground_truth_relevance": {
            "job_mobile_rn": 3,
            "job_react_ts": 2,
            "job_python_fastapi": 0,
            "job_data_ai": 0,
            "job_qa_tester": 0
        }
    }
]


def run_matching_benchmark() -> Dict[str, Any]:
    """
    Executes the full scientific matching benchmark against ground truth datasets.
    Calculates NDCG@3, NDCG@5, Precision@3, Precision@5, MRR, and scoring latency.
    """
    start_time = time.perf_counter()
    
    # Pre-generate embeddings for test corpus
    job_embeddings = {}
    for job in BENCHMARK_JOBS:
        text_rep = embedding_service.build_job_text_representation(
            title=job["title"],
            description=job["description"],
            required_skills=job["required_skills"],
            preferred_skills=job.get("preferred_skills")
        )
        job_embeddings[job["id"]] = embedding_service.generate_embedding(text_rep)

    profile_results = []
    all_relevance_rankings: List[List[int]] = []

    for profile in BENCHMARK_PROFILES:
        parsed_data = profile["parsed_data"]
        resume_text_rep = embedding_service.build_resume_text_representation(parsed_data)
        resume_vec = embedding_service.generate_embedding(resume_text_rep)

        scored_jobs = []
        for job in BENCHMARK_JOBS:
            score, s_score, exp_score, edu_score, explanation = match_scorer.score_resume_against_job(
                resume_parsed_data=parsed_data,
                required_skills=job["required_skills"],
                job_description=job["description"],
                min_education_level=job.get("min_education_level"),
                resume_embedding=resume_vec,
                job_embedding=job_embeddings[job["id"]]
            )
            rel_grade = profile["ground_truth_relevance"].get(job["id"], 0)
            scored_jobs.append({
                "job_id": job["id"],
                "title": job["title"],
                "score": score,
                "ground_truth_relevance": rel_grade
            })

        # Sort ranked list descending by AI score
        scored_jobs.sort(key=lambda x: x["score"], reverse=True)

        ranked_relevance_labels = [j["ground_truth_relevance"] for j in scored_jobs]
        all_relevance_rankings.append(ranked_relevance_labels)

        p3 = precision_at_k(ranked_relevance_labels, k=3, relevance_threshold=2)
        p5 = precision_at_k(ranked_relevance_labels, k=5, relevance_threshold=2)
        ndcg3 = ndcg_at_k(ranked_relevance_labels, k=3)
        ndcg5 = ndcg_at_k(ranked_relevance_labels, k=5)
        rr = reciprocal_rank(ranked_relevance_labels, relevance_threshold=2)

        profile_results.append({
            "profile_id": profile["profile_id"],
            "profile_name": profile["name"],
            "top_match": scored_jobs[0]["title"],
            "top_score": scored_jobs[0]["score"],
            "ranked_jobs": scored_jobs,
            "metrics": {
                "precision_at_3": p3,
                "precision_at_5": p5,
                "ndcg_at_3": ndcg3,
                "ndcg_at_5": ndcg5,
                "reciprocal_rank": rr
            }
        })

    total_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

    # Compute macro-averages
    avg_p3 = round(sum(p["metrics"]["precision_at_3"] for p in profile_results) / len(profile_results), 4)
    avg_p5 = round(sum(p["metrics"]["precision_at_5"] for p in profile_results) / len(profile_results), 4)
    avg_ndcg3 = round(sum(p["metrics"]["ndcg_at_3"] for p in profile_results) / len(profile_results), 4)
    avg_ndcg5 = round(sum(p["metrics"]["ndcg_at_5"] for p in profile_results) / len(profile_results), 4)
    mrr = mean_reciprocal_rank(all_relevance_rankings, relevance_threshold=2)

    return {
        "benchmark_status": "completed",
        "queries_evaluated": len(BENCHMARK_PROFILES),
        "corpus_size": len(BENCHMARK_JOBS),
        "execution_time_ms": total_time_ms,
        "macro_metrics": {
            "mean_reciprocal_rank": mrr,
            "precision_at_3": avg_p3,
            "precision_at_5": avg_p5,
            "ndcg_at_3": avg_ndcg3,
            "ndcg_at_5": avg_ndcg5
        },
        "profiles": profile_results
    }
