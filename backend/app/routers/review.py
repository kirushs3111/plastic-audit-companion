from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import get_current_admin
from app.models.plastic_entry import PlasticEntry
from app.models.user import User
from app.schemas.audit import PlasticEntryResponse, PlasticEntryReviewAssign

router = APIRouter(prefix="/review-queue", tags=["review-queue"])


@router.get("", response_model=list[PlasticEntryResponse])
def list_review_queue(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[PlasticEntry]:
    """
    Every entry logged as 'pending-review' - i.e. nobody knew the plastic
    type, so it was saved with photos only. This is the human alternative
    to an AI guess: a reviewer looks at the photos and assigns the type.
    """
    return (
        db.query(PlasticEntry)
        .options(joinedload(PlasticEntry.photos))
        .filter(PlasticEntry.needs_review.is_(True))
        .order_by(PlasticEntry.created_at.asc())
        .all()
    )


@router.post("/{entry_id}/assign", response_model=PlasticEntryResponse)
def assign_plastic_type(
    entry_id: UUID,
    payload: PlasticEntryReviewAssign,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PlasticEntry:
    entry = (
        db.query(PlasticEntry)
        .options(joinedload(PlasticEntry.photos))
        .filter(PlasticEntry.id == entry_id)
        .first()
    )
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    if not entry.needs_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This entry has already been reviewed",
        )

    entry.plastic_code = payload.plastic_code
    entry.needs_review = False
    db.commit()
    db.refresh(entry)
    return entry
