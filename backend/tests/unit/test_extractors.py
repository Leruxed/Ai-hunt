import pytest
from app.services.resume_parser.extractors import (
    validate_file_magic_bytes,
    FileValidationError,
    extract_document_text,
)


def test_empty_file_rejected():
    with pytest.raises(FileValidationError, match="empty"):
        validate_file_magic_bytes(b"", "resume.pdf")


def test_invalid_extension_rejected():
    with pytest.raises(FileValidationError, match="Unsupported file extension"):
        validate_file_magic_bytes(b"dummy content", "resume.exe")


def test_fake_pdf_header_validation():
    # File with .pdf extension but executable/garbage content
    with pytest.raises(FileValidationError):
        validate_file_magic_bytes(b"MZ\x90\x00\x03\x00\x00\x00", "resume.pdf")


def test_valid_pdf_magic_bytes():
    pdf_bytes = b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"
    mime, ext = validate_file_magic_bytes(pdf_bytes, "valid_resume.pdf")
    assert mime == "application/pdf"
    assert ext == ".pdf"
