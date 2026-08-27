from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "SkillMatch AI Backend"
    API_V1_STR: str = "/api/v1"
    VERSION: str = "0.1.0"
    
    # Environment & Debug
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Security
    SECRET_KEY: str = "development-secret-key-change-in-production-09a8f12c"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    BACKEND_CORS_ORIGINS: List[Union[str, AnyHttpUrl]] = [
        "http://localhost:3000",
        "http://localhost:8081",
        "http://localhost:19000",
        "http://localhost:19006",
        "exp://localhost:8081",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Database
    # Default to SQLite for local lightweight testing / fallbacks, PostgreSQL for production/Supabase
    DATABASE_URL: str = "sqlite:///./skillmatch.db"
    ASYNC_DATABASE_URL: str = "sqlite+aiosqlite:///./skillmatch.db"
    
    # Supabase / S3 Storage config (Optional / Fallback to local storage)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    STORAGE_BUCKET_RESUMES: str = "resumes"
    LOCAL_STORAGE_DIR: str = "./uploads/resumes"
    
    # File limits
    MAX_UPLOAD_SIZE_BYTES: int = 5 * 1024 * 1024  # 5 MB
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx"]
    ALLOWED_MIME_TYPES: List[str] = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword"
    ]
    
    # AI / LLM extraction config
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    
    # External Job Sourcing (JSearch / RapidAPI)
    RAPIDAPI_KEY: str = ""
    JSEARCH_API_HOST: str = "jsearch.p.rapidapi.com"
    JSEARCH_API_URL: str = "https://jsearch.p.rapidapi.com/search"
    EXTERNAL_JOB_EXPIRY_DAYS: int = 14
    DEFAULT_PH_SEARCH_QUERIES: List[str] = [
        "Software Engineer Intern Philippines",
        "Junior Web Developer Metro Manila",
        "React Frontend Intern Philippines",
        "Python Backend Developer Intern Philippines",
        "IT OJT Trainee Metro Manila"
    ]
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
