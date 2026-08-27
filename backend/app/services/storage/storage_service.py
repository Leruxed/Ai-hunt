import os
import uuid
import aiofiles
from pathlib import Path
from typing import Tuple
from app.core.config import settings


class StorageService:
    """
    Handles secure file storage for uploaded resumes.
    PII-safe: does not store student names or sensitive PII in file paths.
    """

    def __init__(self, base_dir: str = settings.LOCAL_STORAGE_DIR):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    async def save_resume_file(
        self, user_id: str, file_bytes: bytes, file_extension: str
    ) -> Tuple[str, str]:
        """
        Saves resume file to a secure directory partitioned by user ID and a generated UUID.
        
        Returns:
            Tuple of (relative_file_path, storage_file_url)
        """
        # Ensure user folder exists
        user_folder = self.base_dir / user_id
        user_folder.mkdir(parents=True, exist_ok=True)

        # Generate unique storage filename to avoid collisions and prevent PII exposure
        unique_file_id = str(uuid.uuid4())
        safe_filename = f"{unique_file_id}{file_extension}"
        destination_path = user_folder / safe_filename

        # Write file securely
        async with aiofiles.open(destination_path, "wb") as out_file:
            await out_file.write(file_bytes)

        relative_path = f"{user_id}/{safe_filename}"
        file_url = f"/api/v1/resumes/files/{user_id}/{safe_filename}"

        return relative_path, file_url

    def get_file_path(self, user_id: str, filename: str) -> Path:
        """
        Resolves file path with strict directory traversal prevention.
        """
        # Sanitize user_id and filename
        safe_user = Path(user_id).name
        safe_file = Path(filename).name
        resolved_path = (self.base_dir / safe_user / safe_file).resolve()

        # Prevent directory traversal attacks
        if not str(resolved_path).startswith(str(self.base_dir.resolve())):
            raise PermissionError("Illegal path traversal attempt.")

        return resolved_path

    async def delete_resume_file(self, user_id: str, filename: str) -> bool:
        """Deletes a file upon resume deletion or data privacy compliance requests."""
        try:
            file_path = self.get_file_path(user_id, filename)
            if file_path.exists():
                file_path.unlink()
                return True
        except Exception:
            pass
        return False


# Global singleton instance
storage_service = StorageService()
