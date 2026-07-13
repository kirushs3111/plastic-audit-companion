from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.audit_session import AuditSession
from app.models.household import Household
from app.models.plastic_entry import PlasticEntry
from app.models.user import User
from app.schemas.gamification import (
    BadgesResponse,
    BadgeStatus,
    HouseholdPassport,
    HuntsResponse,
    HuntStatus,
    PassportMonth,
    PassportMonthEntry,
)

router = APIRouter(tags=["gamification"])


def _submitted_entries_query(db: Session, user_id: UUID):
    """Every PlasticEntry belonging to a *submitted* audit under a
    household this user owns. Badges and the Passport both only count
    completed audits - matching how the admin dataset counts entries."""
    return (
        db.query(PlasticEntry)
        .join(AuditSession, PlasticEntry.audit_session_id == AuditSession.id)
        .join(Household, AuditSession.household_id == Household.id)
        .filter(Household.user_id == user_id, AuditSession.submitted_at.isnot(None))
    )


PLASTIC_ABBREVIATIONS = {1: "PET", 2: "HDPE", 3: "PVC", 4: "LDPE", 5: "PP", 6: "PS", 7: "OTHER"}
HUNT_TARGET = 5


@router.get("/hunts", response_model=HuntsResponse)
def get_my_hunts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HuntsResponse:
    """
    Plastic Hunt: "Find 5 PET bottles" style challenges, one per resin
    type. Progress is the real lifetime quantity of that type logged
    across the user's submitted audits - not a separate counter to keep
    in sync.
    """
    entries_q = _submitted_entries_query(db, current_user.id)

    rows = (
        entries_q.filter(PlasticEntry.plastic_code.isnot(None))
        .with_entities(PlasticEntry.plastic_code, func.coalesce(func.sum(PlasticEntry.quantity), 0))
        .group_by(PlasticEntry.plastic_code)
        .all()
    )
    quantities = {code: qty for code, qty in rows}

    hunts = [
        HuntStatus(
            plastic_code=code,
            abbreviation=PLASTIC_ABBREVIATIONS[code],
            target=HUNT_TARGET,
            progress=min(quantities.get(code, 0), HUNT_TARGET),
            completed=quantities.get(code, 0) >= HUNT_TARGET,
        )
        for code in range(1, 8)
    ]

    return HuntsResponse(hunts=hunts)


@router.get("/badges", response_model=BadgesResponse)
def get_my_badges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BadgesResponse:
    """
    "Plastic Detective" badges. All computed live from the user's real
    submitted-audit history - there is no separate badges table to keep in
    sync, so a badge earned here always reflects the current data.
    """
    entries_q = _submitted_entries_query(db, current_user.id)

    total_items = entries_q.with_entities(
        func.coalesce(func.sum(PlasticEntry.quantity), 0)
    ).scalar() or 0

    submitted_session_count = (
        db.query(func.count(AuditSession.id))
        .join(Household, AuditSession.household_id == Household.id)
        .filter(Household.user_id == current_user.id, AuditSession.submitted_at.isnot(None))
        .scalar()
        or 0
    )

    distinct_rooms = entries_q.with_entities(PlasticEntry.room).distinct().count()

    distinct_known_types = (
        entries_q.filter(PlasticEntry.plastic_code.isnot(None))
        .with_entities(PlasticEntry.plastic_code)
        .distinct()
        .count()
    )

    # identification_method stays "pending-review" even after an admin
    # resolves it (only needs_review flips back to False), so this single
    # filter counts every item that was ever logged via a photo instead of
    # a known type - resolved or not.
    pending_review_logged = entries_q.filter(
        PlasticEntry.identification_method == "pending-review"
    ).count()

    distinct_months = (
        db.query(func.count(func.distinct(func.date_trunc("month", AuditSession.submitted_at))))
        .join(Household, AuditSession.household_id == Household.id)
        .filter(Household.user_id == current_user.id, AuditSession.submitted_at.isnot(None))
        .scalar()
        or 0
    )

    badges = [
        BadgeStatus(
            id="first-steps",
            title="First Steps",
            description="Submit your first household audit.",
            emoji="🌱",
            earned=submitted_session_count >= 1,
            progress=min(submitted_session_count, 1),
            target=1,
        ),
        BadgeStatus(
            id="century-club",
            title="Century Club",
            description="Count 100 plastic items in total, across all audits.",
            emoji="💯",
            earned=total_items >= 100,
            progress=min(total_items, 100),
            target=100,
        ),
        BadgeStatus(
            id="full-house",
            title="Full House",
            description="Log at least one item in every one of the 7 rooms.",
            emoji="🏠",
            earned=distinct_rooms >= 7,
            progress=min(distinct_rooms, 7),
            target=7,
        ),
        BadgeStatus(
            id="resin-ranger",
            title="Resin Ranger",
            description="Correctly identify at least one item of all 7 plastic types.",
            emoji="♻️",
            earned=distinct_known_types >= 7,
            progress=min(distinct_known_types, 7),
            target=7,
        ),
        BadgeStatus(
            id="plastic-detective",
            title="Plastic Detective",
            description="Photograph 5 unidentified plastics for review.",
            emoji="🔍",
            earned=pending_review_logged >= 5,
            progress=min(pending_review_logged, 5),
            target=5,
        ),
        BadgeStatus(
            id="consistent-auditor",
            title="Consistent Auditor",
            description="Submit audits in 3 different months - the House Plastic Passport tracks change over time.",
            emoji="📅",
            earned=distinct_months >= 3,
            progress=min(distinct_months, 3),
            target=3,
        ),
    ]

    return BadgesResponse(badges=badges)


@router.get("/households/{household_id}/passport", response_model=HouseholdPassport)
def get_household_passport(
    household_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HouseholdPassport:
    """
    House Plastic Passport: submitted-audit totals for this household,
    grouped by calendar month and broken down by plastic type, so you can
    see how counts change audit to audit over time.
    """
    household = db.get(Household, household_id)
    if household is None or household.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

    month_col = func.date_trunc("month", AuditSession.submitted_at).label("month")

    rows = db.execute(
        select(
            month_col,
            PlasticEntry.plastic_code,
            func.coalesce(func.sum(PlasticEntry.quantity), 0),
        )
        .join(AuditSession, PlasticEntry.audit_session_id == AuditSession.id)
        .where(
            AuditSession.household_id == household_id,
            AuditSession.submitted_at.isnot(None),
            PlasticEntry.plastic_code.isnot(None),
        )
        .group_by(month_col, PlasticEntry.plastic_code)
        .order_by(month_col.asc())
    ).all()

    months_map: dict = {}
    for month, plastic_code, quantity in rows:
        key = month.date()
        months_map.setdefault(key, []).append(
            PassportMonthEntry(plastic_code=plastic_code, quantity=quantity)
        )

    months = [
        PassportMonth(
            month=month,
            total_items=sum(e.quantity for e in entries),
            by_plastic_type=entries,
        )
        for month, entries in sorted(months_map.items())
    ]

    return HouseholdPassport(
        household_id=str(household.id),
        household_name=household.household_name,
        months=months,
    )
