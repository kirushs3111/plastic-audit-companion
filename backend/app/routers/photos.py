import mimetypes
import uuid
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.audit_session import AuditSession
from app.models.household import Household
from app.models.photo import Photo
from app.models.plastic_entry import PlasticEntry
from app.models.user import User
from app.schemas.audit import PhotoUploadResponse

router = APIRouter(prefix="/photos", tags=["photos"])
settings = get_settings()

# The extension used on disk is derived ONLY from this mapping, never from
# the client-supplied filename. If it came from the filename instead, an
# attacker could upload a file named "evil.html" containing a <script>
# tag while declaring Content-Type: image/jpeg - it would pass the
# content-type check, get saved as "{uuid}.html", and a browser visiting
# that URL directly would render it as HTML instead of an image (stored
# XSS via file upload).
CONTENT_TYPE_TO_EXTENSION = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
}


def _sniff_matches_declared_type(contents: bytes, declared_content_type: str) -> bool:
    """
    The Content-Type header is exactly as client-controlled as the
    filename - trusting it alone would just move the same vulnerability
    from the extension to the header. This checks the file's actual
    magic bytes against what's claimed, so declaring image/jpeg on an
    HTML payload gets rejected rather than silently accepted.
    """
    if declared_content_type == "image/jpeg":
        return contents.startswith(b"\xff\xd8\xff")
    if declared_content_type == "image/png":
        return contents.startswith(b"\x89PNG\r\n\x1a\n")
    if declared_content_type == "image/webp":
        return contents[:4] == b"RIFF" and contents[8:12] == b"WEBP"
    if declared_content_type == "image/heic":
        # HEIC is an ISO base media file format box structure - the
        # reliable signal is an "ftyp" box near the start rather than a
        # single fixed byte sequence.
        return b"ftyp" in contents[:32]
    return False


@router.post("/upload", response_model=PhotoUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
) -> PhotoUploadResponse:
    """
    Stores an uploaded photo on local disk. The frontend calls this
    first, then passes the returned storage_url into
    POST /audit-sessions/{id}/entries.

    Note this storage_url is an internal disk reference, not a fetchable
    URL - once the photo is attached to an entry, it can only be viewed
    through GET /api/photos/{photo_id}/file, which checks the requester
    owns it (or is an admin) before serving the bytes. There is no public,
    unauthenticated way to view an uploaded photo.
    """
    if file.content_type not in CONTENT_TYPE_TO_EXTENSION:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}",
        )

    contents = await file.read()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"File exceeds {settings.max_upload_size_mb}MB limit",
        )

    if not _sniff_matches_declared_type(contents, file.content_type):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="File contents don't match the declared image type",
        )

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    extension = CONTENT_TYPE_TO_EXTENSION[file.content_type]
    unique_name = f"{uuid.uuid4()}{extension}"
    destination = upload_dir / unique_name
    destination.write_bytes(contents)

    return PhotoUploadResponse(
        storage_url=f"/uploads/{unique_name}",
        original_filename=file.filename or unique_name,
    )


@router.get("/{photo_id}/file")
def get_photo_file(
    photo_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FileResponse:
    """
    Serves the actual photo bytes - the only way to view an uploaded
    photo. Requires the requester to either own the household this photo
    belongs to, or be an admin. Returns 404 (not 403) for anyone else, to
    avoid confirming whether a given photo ID even exists.
    """
    photo = (
        db.query(Photo)
        .join(PlasticEntry, Photo.plastic_entry_id == PlasticEntry.id)
        .join(AuditSession, PlasticEntry.audit_session_id == AuditSession.id)
        .join(Household, AuditSession.household_id == Household.id)
        .filter(Photo.id == photo_id)
        .with_entities(Photo, Household.user_id)
        .first()
    )

    if photo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    photo_row, owner_id = photo
    if owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    filename = Path(photo_row.storage_url).name
    file_path = Path(settings.upload_dir) / filename
    if not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    media_type, _ = mimetypes.guess_type(filename)
    return FileResponse(path=file_path, media_type=media_type or "application/octet-stream")
