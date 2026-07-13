from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.household import Household
from app.models.user import User
from app.schemas.audit import HouseholdCreate, HouseholdResponse

router = APIRouter(prefix="/households", tags=["households"])


@router.post("", response_model=HouseholdResponse, status_code=status.HTTP_201_CREATED)
def create_household(
    payload: HouseholdCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Household:
    household = Household(user_id=current_user.id, **payload.model_dump())
    db.add(household)
    db.commit()
    db.refresh(household)
    return household


@router.get("", response_model=list[HouseholdResponse])
def list_my_households(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Household]:
    return (
        db.query(Household)
        .filter(Household.user_id == current_user.id)
        .order_by(Household.created_at.desc())
        .all()
    )


def _get_owned_household(
    household_id: UUID, db: Session, current_user: User
) -> Household:
    household = db.get(Household, household_id)
    if household is None or household.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Household not found"
        )
    return household


@router.get("/{household_id}", response_model=HouseholdResponse)
def get_household(
    household_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Household:
    return _get_owned_household(household_id, db, current_user)
