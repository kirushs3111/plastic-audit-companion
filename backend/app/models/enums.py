import enum


class RoomId(str, enum.Enum):
    KITCHEN = "kitchen"
    BEDROOM = "bedroom"
    BATHROOM = "bathroom"
    LIVING_ROOM = "living-room"
    GARDEN = "garden"
    GARAGE = "garage"
    OTHER = "other"


class ItemCategoryId(str, enum.Enum):
    BOTTLE = "bottle"
    BAG = "bag"
    CHAIR = "chair"
    BUCKET = "bucket"
    LUNCH_BOX = "lunch-box"
    TOY = "toy"
    CONTAINER = "container"
    PIPE = "pipe"
    OTHER = "other"


class IdentificationMethod(str, enum.Enum):
    KNOWN = "known"
    PENDING_REVIEW = "pending-review"


class PhotoSlot(str, enum.Enum):
    FRONT = "front"
    BACK = "back"
    BOTTOM = "bottom"
