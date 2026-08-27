import re
from typing import Dict, List, Optional, Set, Tuple
from thefuzz import fuzz

# Curated, pre-agreed standard skills taxonomy for SkillMatch AI
TAXONOMY: Dict[str, Dict[str, Any]] = {
    # Programming Languages
    "Python": {"category": "Programming Language", "aliases": ["python3", "py"]},
    "JavaScript": {"category": "Programming Language", "aliases": ["js", "es6", "vanilla js"]},
    "TypeScript": {"category": "Programming Language", "aliases": ["ts"]},
    "Java": {"category": "Programming Language", "aliases": ["java 8", "java 11", "java 17", "core java", "j2ee"]},
    "C++": {"category": "Programming Language", "aliases": ["cpp", "c plus plus"]},
    "C#": {"category": "Programming Language", "aliases": ["csharp", "c sharp", ".net c#"]},
    "PHP": {"category": "Programming Language", "aliases": ["php7", "php8"]},
    "Go": {"category": "Programming Language", "aliases": ["golang"]},
    "Rust": {"category": "Programming Language", "aliases": []},
    "Kotlin": {"category": "Programming Language", "aliases": []},
    "Swift": {"category": "Programming Language", "aliases": []},
    "SQL": {"category": "Programming Language", "aliases": ["ansi sql", "structured query language"]},
    "HTML/CSS": {"category": "Frontend", "aliases": ["html", "html5", "css", "css3"]},

    # Frontend Frameworks & Libraries
    "React": {"category": "Frontend", "aliases": ["reactjs", "react.js", "react-js"]},
    "React Native": {"category": "Mobile", "aliases": ["react-native", "rn", "expo"]},
    "Next.js": {"category": "Frontend", "aliases": ["nextjs", "next.js", "next"]},
    "Vue.js": {"category": "Frontend", "aliases": ["vue", "vuejs", "vue 3", "vue 2"]},
    "Angular": {"category": "Frontend", "aliases": ["angularjs", "angular 2+", "angular.io"]},
    "Tailwind CSS": {"category": "Frontend", "aliases": ["tailwind", "tailwindcss"]},
    "Bootstrap": {"category": "Frontend", "aliases": ["bootstrap 5", "bootstrap 4"]},
    "Flutter": {"category": "Mobile", "aliases": ["flutter dart", "dart flutter"]},
    "Android Development": {"category": "Mobile", "aliases": ["android sdk", "android studio", "jetpack compose"]},
    "iOS Development": {"category": "Mobile", "aliases": ["swiftui", "uikit", "xcode"]},

    # Backend Frameworks
    "FastAPI": {"category": "Backend", "aliases": ["fast-api", "fastapi python"]},
    "Django": {"category": "Backend", "aliases": ["django rest framework", "drf"]},
    "Flask": {"category": "Backend", "aliases": []},
    "Node.js": {"category": "Backend", "aliases": ["nodejs", "node.js", "node"]},
    "Express.js": {"category": "Backend", "aliases": ["express", "expressjs", "express.js"]},
    "NestJS": {"category": "Backend", "aliases": ["nest.js", "nestjs"]},
    "Spring Boot": {"category": "Backend", "aliases": ["spring", "springboot", "spring-boot", "spring framework"]},
    ".NET Core": {"category": "Backend", "aliases": ["asp.net", "asp.net core", "dotnet", ".net"]},
    "Laravel": {"category": "Backend", "aliases": ["laravel php"]},

    # Databases & Storage
    "PostgreSQL": {"category": "Database", "aliases": ["postgres", "pgsql", "psql", "pgvector"]},
    "MySQL": {"category": "Database", "aliases": ["mysql 8", "mariadb"]},
    "MongoDB": {"category": "Database", "aliases": ["mongo", "mongodb atlas"]},
    "SQLite": {"category": "Database", "aliases": ["sqlite3"]},
    "Redis": {"category": "Database", "aliases": ["redis cache"]},
    "Supabase": {"category": "Cloud & BaaS", "aliases": ["supabase auth", "supabase db"]},
    "Firebase": {"category": "Cloud & BaaS", "aliases": ["firebase auth", "firestore", "firebase realtime database"]},

    # Cloud, DevOps & Tools
    "Git": {"category": "DevOps & Tools", "aliases": ["github", "gitlab", "bitbucket", "version control"]},
    "Docker": {"category": "DevOps & Tools", "aliases": ["docker compose", "containerization"]},
    "Kubernetes": {"category": "DevOps & Tools", "aliases": ["k8s"]},
    "AWS": {"category": "Cloud & DevOps", "aliases": ["amazon web services", "aws ec2", "aws s3", "aws lambda"]},
    "Google Cloud Platform": {"category": "Cloud & DevOps", "aliases": ["gcp", "google cloud"]},
    "Microsoft Azure": {"category": "Cloud & DevOps", "aliases": ["azure"]},
    "Linux": {"category": "DevOps & Tools", "aliases": ["ubuntu", "debian", "bash", "shell scripting", "unix"]},
    "REST API": {"category": "Architecture", "aliases": ["restful api", "rest", "web apis"]},
    "GraphQL": {"category": "Architecture", "aliases": ["graphql apis"]},
    "CI/CD": {"category": "DevOps & Tools", "aliases": ["github actions", "gitlab ci", "jenkins"]},

    # Data Science & AI/ML
    "Machine Learning": {"category": "AI / ML", "aliases": ["ml", "scikit-learn", "sklearn"]},
    "Deep Learning": {"category": "AI / ML", "aliases": ["neural networks", "pytorch", "tensorflow", "keras"]},
    "Natural Language Processing": {"category": "AI / ML", "aliases": ["nlp", "spacy", "nltk", "transformers", "huggingface"]},
    "Pandas": {"category": "Data Science", "aliases": ["pandas python"]},
    "NumPy": {"category": "Data Science", "aliases": []},
    "Data Analysis": {"category": "Data Science", "aliases": ["data analytics", "power bi", "tableau"]},

    # Soft & Professional Skills
    "Agile / Scrum": {"category": "Methodology", "aliases": ["scrum", "agile methodology", "kanban", "sprints"]},
    "Problem Solving": {"category": "Soft Skills", "aliases": ["analytical skills", "critical thinking"]},
    "Communication": {"category": "Soft Skills", "aliases": ["verbal communication", "written communication", "team collaboration"]},
    "Project Management": {"category": "Management", "aliases": ["jira", "trello", "asana"]},
}

# Inverted alias lookup table: alias_lower -> canonical_name
ALIAS_LOOKUP: Dict[str, str] = {}
for canonical, data in TAXONOMY.items():
    ALIAS_LOOKUP[canonical.lower()] = canonical
    for alias in data.get("aliases", []):
        ALIAS_LOOKUP[alias.lower()] = canonical


class SkillsTaxonomyNormalizer:
    """
    Normalizes extracted skill strings into standardized canonical skill taxonomy entries.
    Addresses Problem Statement #4 (semantic standardization beyond crude keywords).
    """

    def __init__(self, fuzzy_threshold: int = 85):
        self.fuzzy_threshold = fuzzy_threshold
        self.canonical_skills = list(TAXONOMY.keys())

    def normalize_skill(self, raw_skill: str) -> Optional[str]:
        """
        Takes a raw skill string and attempts to resolve it:
        1. Exact match / Alias lookup (O(1))
        2. Cleaned punctuation/whitespace lookup
        3. Fuzzy string matching (Levenshtein ratio)
        """
        if not raw_skill or not raw_skill.strip():
            return None

        clean_raw = raw_skill.strip()
        lower_raw = clean_raw.lower()

        # Step 1: Direct lookup
        if lower_raw in ALIAS_LOOKUP:
            return ALIAS_LOOKUP[lower_raw]

        # Step 2: Remove surrounding non-alphanumeric chars (except +, #, .)
        stripped = re.sub(r"^[^\w+#.]+|[^\w+#.]+$", "", lower_raw)
        if stripped in ALIAS_LOOKUP:
            return ALIAS_LOOKUP[stripped]

        # Step 3: Fuzzy matching against canonical skills and known aliases
        best_match = None
        highest_score = 0

        for alias_key, canonical in ALIAS_LOOKUP.items():
            score = fuzz.ratio(lower_raw, alias_key)
            if score > highest_score and score >= self.fuzzy_threshold:
                highest_score = score
                best_match = canonical

        return best_match

    def normalize_skills_list(self, raw_skills: List[str]) -> List[str]:
        """
        Normalizes a list of raw skills, deduplicates them, and preserves order.
        """
        seen: Set[str] = set()
        normalized_list: List[str] = []

        for item in raw_skills:
            canonical = self.normalize_skill(item)
            if canonical:
                if canonical not in seen:
                    seen.add(canonical)
                    normalized_list.append(canonical)
            else:
                # If no canonical match found, preserve the clean raw string to prevent data loss
                clean = item.strip()
                if clean and clean not in seen:
                    seen.add(clean)
                    normalized_list.append(clean)

        return normalized_list

    def get_category(self, canonical_skill: str) -> str:
        """Returns the category for a canonical skill, or 'Other' if custom."""
        if canonical_skill in TAXONOMY:
            return TAXONOMY[canonical_skill]["category"]
        return "Other"


# Global singleton instance
skills_normalizer = SkillsTaxonomyNormalizer()
