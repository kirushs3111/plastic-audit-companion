from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.audit_session import AuditSession
from app.models.household import Household
from app.models.photo import Photo
from app.models.plastic_entry import PlasticEntry
from app.models.user import User
from app.routers.households import _get_owned_household
from app.schemas.audit import (
    AuditSessionCreate,
    AuditSessionResponse,
    AuditSessionSummary,
    PlasticEntryCreate,
    PlasticEntryResponse,
)

router = APIRouter(prefix="/audit-sessions", tags=["audit-sessions"])


def _get_owned_session(
    session_id: UUID, db: Session, current_user: User
) -> AuditSession:
    audit_session = (
        db.query(AuditSession)
        .options(
            joinedload(AuditSession.entries).joinedload(PlasticEntry.photos),
            joinedload(AuditSession.household),
        )
        .filter(AuditSession.id == session_id)
        .first()
    )
    if audit_session is None or audit_session.household.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Audit session not found"
        )
    return audit_session


@router.post("", response_model=AuditSessionResponse, status_code=status.HTTP_201_CREATED)
def create_audit_session(
    payload: AuditSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AuditSession:
    # Confirms the household belongs to this user before allowing a session
    # to be created under it.
    _get_owned_household(payload.household_id, db, current_user)

    audit_session = AuditSession(household_id=payload.household_id)
    db.add(audit_session)
    db.commit()
    db.refresh(audit_session)
    return audit_session


@router.get("", response_model=list[AuditSessionSummary])
def list_my_audit_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AuditSessionSummary]:
    """Powers the User Dashboard's "Previous Audits" list."""
    rows = (
        db.query(
            AuditSession,
            func.count(PlasticEntry.id).label("entry_count"),
            func.coalesce(func.sum(PlasticEntry.quantity), 0).label("total_items"),
        )
        .join(Household, AuditSession.household_id == Household.id)
        .outerjoin(PlasticEntry, PlasticEntry.audit_session_id == AuditSession.id)
        .filter(Household.user_id == current_user.id)
        .group_by(AuditSession.id)
        .order_by(AuditSession.updated_at.desc())
        .all()
    )

    return [
        AuditSessionSummary(
            id=session.id,
            household_id=session.household_id,
            submitted_at=session.submitted_at,
            updated_at=session.updated_at,
            entry_count=entry_count,
            total_items=total_items,
        )
        for session, entry_count, total_items in rows
    ]


@router.get("/{session_id}", response_model=AuditSessionResponse)
def get_audit_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AuditSession:
    return _get_owned_session(session_id, db, current_user)


@router.post(
    "/{session_id}/entries",
    response_model=PlasticEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_plastic_entry(
    session_id: UUID,
    payload: PlasticEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PlasticEntry:
    audit_session = _get_owned_session(session_id, db, current_user)
    if audit_session.is_submitted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add items to an already-submitted audit",
        )

    entry = PlasticEntry(
        audit_session_id=audit_session.id,
        room=payload.room,
        item=payload.item,
        plastic_code=payload.plastic_code,
        quantity=payload.quantity,
        identification_method=payload.identification_method,
        needs_review=payload.plastic_code is None,
        user_confirmed=True,
    )
    db.add(entry)
    db.flush()  # assigns entry.id before we attach photos

    for photo in payload.photos:
        db.add(Photo(plastic_entry_id=entry.id, **photo.model_dump()))

    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{session_id}/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plastic_entry(
    session_id: UUID,
    entry_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    audit_session = _get_owned_session(session_id, db, current_user)
    entry = next((e for e in audit_session.entries if e.id == entry_id), None)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    db.delete(entry)
    db.commit()


@router.post("/{session_id}/submit", response_model=AuditSessionResponse)
def submit_audit_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AuditSession:
    audit_session = _get_owned_session(session_id, db, current_user)
    if audit_session.is_submitted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Audit already submitted"
        )
    if not audit_session.entries:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot submit an audit with no items",
        )

    audit_session.submitted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(audit_session)
    return audit_session
