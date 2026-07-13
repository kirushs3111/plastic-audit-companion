from datetime import date

from pydantic import BaseModel


class HuntStatus(BaseModel):
    plastic_code: int
    abbreviation: str
    target: int
    progress: int
    completed: bool


class HuntsResponse(BaseModel):
    hunts: list[HuntStatus]


class BadgeStatus(BaseModel):
    id: str
    title: str
    description: str
    emoji: str
    earned: bool
    progress: int
    target: int


class BadgesResponse(BaseModel):
    badges: list[BadgeStatus]


class PassportMonthEntry(BaseModel):
    plastic_code: int
    quantity: int


class PassportMonth(BaseModel):
    month: date  # first day of the month, for stable sorting/labeling
    total_items: int
    by_plastic_type: list[PassportMonthEntry]


class HouseholdPassport(BaseModel):
    household_id: str
    household_name: str
    months: list[PassportMonth]
