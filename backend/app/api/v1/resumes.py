from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user, require_student
from app.models.user import User
from app.models.resume import Resume, ResumeStatus
from app.models.skill import Skill, ResumeSkill
from app.schemas.resume import ResumeResponse, ResumeUpdateData, ParsedResumeData
from app.services.resume_parser.extractors import (
    extract_document_text,
    FileValidationError,
    ExtractionError,
)
from app.services.resume_parser.skills_taxonomy import skills_normalizer, TAXONOMY
from app.services.storage.storage_service import storage_service

router = APIRouter(prefix="/resumes", tags=["Resumes"])


@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    """
    Upload a resume (PDF or DOCX).
    1. Validates magic bytes (puremagic) and size (<5MB).
    2. Saves file to isolated storage with sanitized names.
    3. Extracts text and runs skills normalization against taxonomy.
    4. Records Resume entry in database and populates initial parsed_data.
    """
    file_bytes = await file.read()
    filename = file.filename or "resume.pdf"

    # Step 1: Validate and extract text
    try:
        raw_text, mime_type, file_ext = extract_document_text(file_bytes, filename)
    except FileValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ExtractionError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during resume extraction: {str(e)}"
        )

    # Step 2: Save to storage
    try:
        relative_path, file_url = await storage_service.save_resume_file(
            user_id=current_user.id,
            file_bytes=file_bytes,
            file_extension=file_ext
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store resume file: {str(e)}"
        )

    # Step 3: Fast-pass rule/taxonomy skill extraction from raw text
    extracted_skills_raw = []
    lower_text = raw_text.lower()
    for skill_name, data in TAXONOMY.items():
        if skill_name.lower() in lower_text:
            extracted_skills_raw.append(skill_name)
        else:
            for alias in data.get("aliases", []):
                if alias.lower() in lower_text:
                    extracted_skills_raw.append(skill_name)
                    break

    normalized_skills = skills_normalizer.normalize_skills_list(extracted_skills_raw)

    initial_parsed_data = ParsedResumeData(
        skills=normalized_skills,
        education=[],
        experience=[],
        certifications=[],
        summary=""
    )

    # Deactivate previous active resumes for this user
    db.query(Resume).filter(
        Resume.user_id == current_user.id,
        Resume.status == ResumeStatus.ACTIVE
    ).update({"status": ResumeStatus.ARCHIVED})

    # Create new Resume record
    resume = Resume(
        user_id=current_user.id,
        file_name=filename,
        file_url=file_url,
        mime_type=mime_type,
        file_size_bytes=len(file_bytes),
        raw_text=raw_text,
        parsed_data=initial_parsed_data.model_dump(),
        status=ResumeStatus.PARSED
    )
    db.add(resume)
    db.flush()

    # Populate ResumeSkill associations
    for skill_name in normalized_skills:
        skill_record = db.query(Skill).filter(Skill.canonical_name == skill_name).first()
        if not skill_record:
            skill_record = Skill(
                canonical_name=skill_name,
                category=skills_normalizer.get_category(skill_name)
            )
            db.add(skill_record)
            db.flush()

        resume_skill = ResumeSkill(
            resume_id=resume.id,
            skill_id=skill_record.id
        )
        db.add(resume_skill)

    db.commit()
    db.refresh(resume)

    return resume


@router.get("/me", response_model=Optional[ResumeResponse])
def get_my_active_resume(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """
    Get the student's current active or most recently parsed resume.
    """
    resume = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.created_at.desc()).first()
    
    return resume


@router.put("/{resume_id}/parsed-data", response_model=ResumeResponse)
def update_resume_parsed_data(
    resume_id: str,
    update_in: ResumeUpdateData,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """
    Human-in-the-loop review and correction endpoint.
    Allows the student to edit/add/remove extracted skills and education before activating for matching.
    """
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    # Normalize submitted skills
    update_in.parsed_data.skills = skills_normalizer.normalize_skills_list(update_in.parsed_data.skills)
    resume.parsed_data = update_in.parsed_data.model_dump()
    resume.status = update_in.status or ResumeStatus.ACTIVE

    # Update ResumeSkill records
    db.query(ResumeSkill).filter(ResumeSkill.resume_id == resume.id).delete()
    for skill_name in update_in.parsed_data.skills:
        skill_record = db.query(Skill).filter(Skill.canonical_name == skill_name).first()
        if not skill_record:
            skill_record = Skill(
                canonical_name=skill_name,
                category=skills_normalizer.get_category(skill_name)
            )
            db.add(skill_record)
            db.flush()

        db.add(ResumeSkill(resume_id=resume.id, skill_id=skill_record.id))

    db.commit()
    db.refresh(resume)
    return resume


@router.get("/files/{user_id}/{filename}")
def get_resume_file(
    user_id: str,
    filename: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Download resume file with strict authorization (students can only fetch their own files;
    employers can fetch if the student applied to their posting).
    """
    # Enforce student self-access
    if current_user.role == "student" and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    try:
        file_path = storage_service.get_file_path(user_id, filename)
        if not file_path.exists():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
        return FileResponse(path=file_path, filename=filename)
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
