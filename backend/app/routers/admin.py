import csv
import io
import re
import zipfile
from pathlib import Path

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.deps import get_current_admin
from app.models.audit_session import AuditSession
from app.models.household import Household
from app.models.photo import Photo
from app.models.plastic_entry import PlasticEntry
from app.models.user import User
from app.schemas.admin import AdminOverview, PlasticTypeCount, RoomCount

router = APIRouter(prefix="/admin", tags=["admin"])
settings = get_settings()

_FORMULA_TRIGGER_CHARS = ("=", "+", "-", "@", "\t", "\r")


def _sanitize_csv_field(value: str | None) -> str:
    """
    Neutralizes CSV/Formula Injection (CWE-1236): household_name, address
    and city are free text a user fully controls. Without this, a value
    like "=cmd|'/c calc'!A1" gets written verbatim and can execute as a
    formula the moment an admin opens the export in Excel/Google Sheets.
    Prefixing with a single quote is the standard OWASP-recommended
    mitigation - spreadsheet apps then treat the cell as literal text.
    """
    if value is None:
        return ""
    if value.startswith(_FORMULA_TRIGGER_CHARS):
        return f"'{value}"
    return value


@router.get("/overview", response_model=AdminOverview)
def get_overview(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> AdminOverview:
    """
    Aggregate stats powering the admin dashboard's charts: most common
    plastic type, most common room, dataset size, and how much is still
    waiting in the Photo Review queue.
    """
    total_users = db.scalar(select(func.count(User.id))) or 0
    total_households = db.scalar(select(func.count(Household.id))) or 0
    total_audit_sessions = db.scalar(select(func.count(AuditSession.id))) or 0
    submitted_audit_sessions = (
        db.scalar(
            select(func.count(AuditSession.id)).where(AuditSession.submitted_at.isnot(None))
        )
        or 0
    )
    total_entries = db.scalar(select(func.count(PlasticEntry.id))) or 0
    total_items = db.scalar(select(func.coalesce(func.sum(PlasticEntry.quantity), 0))) or 0
    pending_review_count = (
        db.scalar(select(func.count(PlasticEntry.id)).where(PlasticEntry.needs_review.is_(True)))
        or 0
    )

    by_plastic_type_rows = db.execute(
        select(
            PlasticEntry.plastic_code,
            func.count(PlasticEntry.id),
            func.coalesce(func.sum(PlasticEntry.quantity), 0),
        )
        .where(PlasticEntry.plastic_code.isnot(None))
        .group_by(PlasticEntry.plastic_code)
        .order_by(func.sum(PlasticEntry.quantity).desc())
    ).all()

    by_room_rows = db.execute(
        select(
            PlasticEntry.room,
            func.count(PlasticEntry.id),
            func.coalesce(func.sum(PlasticEntry.quantity), 0),
        )
        .group_by(PlasticEntry.room)
        .order_by(func.sum(PlasticEntry.quantity).desc())
    ).all()

    return AdminOverview(
        total_users=total_users,
        total_households=total_households,
        total_audit_sessions=total_audit_sessions,
        submitted_audit_sessions=submitted_audit_sessions,
        total_entries=total_entries,
        total_items=total_items,
        pending_review_count=pending_review_count,
        by_plastic_type=[
            PlasticTypeCount(plastic_code=code, count=count, total_quantity=qty)
            for code, count, qty in by_plastic_type_rows
        ],
        by_room=[
            RoomCount(room=room.value if hasattr(room, "value") else room, count=count, total_quantity=qty)
            for room, count, qty in by_room_rows
        ],
    )


@router.get("/export.csv")
def export_csv(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> StreamingResponse:
    """
    One row per plastic entry, joined up to household/city - the flat
    dataset researchers and recycling planners actually consume. Matches
    the spec's Module 6 "CSV Export" feature.
    """
    rows = db.execute(
        select(
            PlasticEntry.id,
            PlasticEntry.room,
            PlasticEntry.item,
            PlasticEntry.plastic_code,
            PlasticEntry.quantity,
            PlasticEntry.identification_method,
            PlasticEntry.needs_review,
            PlasticEntry.created_at,
            Household.household_name,
            Household.address,
            Household.city,
            AuditSession.submitted_at,
        )
        .join(AuditSession, PlasticEntry.audit_session_id == AuditSession.id)
        .join(Household, AuditSession.household_id == Household.id)
        .order_by(PlasticEntry.created_at.asc())
    ).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "entry_id",
            "household_name",
            "address",
            "city",
            "room",
            "item",
            "plastic_code",
            "quantity",
            "identification_method",
            "needs_review",
            "entry_created_at",
            "session_submitted_at",
        ]
    )
    for row in rows:
        (
            entry_id,
            room,
            item,
            plastic_code,
            quantity,
            identification_method,
            needs_review,
            created_at,
            household_name,
            address,
            city,
            submitted_at,
        ) = row
        writer.writerow(
            [
                entry_id,
                _sanitize_csv_field(household_name),
                _sanitize_csv_field(address),
                _sanitize_csv_field(city),
                room.value if hasattr(room, "value") else room,
                item.value if hasattr(item, "value") else item,
                plastic_code if plastic_code is not None else "",
                quantity,
                identification_method.value
                if hasattr(identification_method, "value")
                else identification_method,
                needs_review,
                created_at.isoformat() if created_at else "",
                submitted_at.isoformat() if submitted_at else "",
            ]
        )

    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=plastic_audit_export.csv"},
    )


_UNSAFE_PATH_CHARS = re.compile(r"[^a-zA-Z0-9 _.-]")


def _safe_zip_path_component(value: str, fallback: str) -> str:
    """
    household_name is free text a user fully controls, and it's about to
    become a folder name inside a ZIP - without sanitizing it, a name
    like "../../../etc" could let the archive write outside the intended
    extraction directory when someone unzips it (Zip Slip, CWE-22).
    Stripping everything but a safe character set closes that off
    entirely, rather than trying to pattern-match "../" specifically.
    """
    cleaned = _UNSAFE_PATH_CHARS.sub("_", value).strip(" ._")
    return cleaned or fallback


@router.get("/export-photos.zip")
def export_photos_zip(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> StreamingResponse:
    """
    Every uploaded photo, organized by household, as a single ZIP - the
    bulk equivalent of clicking through the Photo Review queue one entry
    at a time. Only includes files that still exist on disk; a missing
    file is skipped rather than failing the whole export.
    """
    rows = (
        db.query(Photo, Household.household_name, PlasticEntry.room, PlasticEntry.item)
        .join(PlasticEntry, Photo.plastic_entry_id == PlasticEntry.id)
        .join(AuditSession, PlasticEntry.audit_session_id == AuditSession.id)
        .join(Household, AuditSession.household_id == Household.id)
        .order_by(Household.household_name.asc(), Photo.created_at.asc())
        .all()
    )

    upload_dir = Path(settings.upload_dir)
    buffer = io.BytesIO()

    with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for photo, household_name, room, item in rows:
            source_path = upload_dir / Path(photo.storage_url).name
            if not source_path.is_file():
                continue

            safe_household = _safe_zip_path_component(household_name, "household")
            room_value = room.value if hasattr(room, "value") else room
            item_value = item.value if hasattr(item, "value") else item
            extension = source_path.suffix
            # photo.id (a UUID) guarantees uniqueness even when two
            # photos share the same household/room/item/slot.
            arcname = (
                f"{safe_household}/{room_value}_{item_value}_{photo.slot.value}"
                f"_{photo.id}{extension}"
            )
            zf.write(source_path, arcname=arcname)

    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=plastic_audit_photos.zip"},
    )
