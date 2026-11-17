"""The fixed stage table (DATA-7), and GET /api/meta/stages (API-10)."""

from dataclasses import asdict, dataclass

from fastapi import APIRouter
from pydantic import BaseModel


@dataclass(frozen=True)
class Stage:
    key: str
    label: str
    probability: int
    open: bool
    color: str
    text_color: str


MIDNIGHT = "#073B4C"
WHITE = "#FFFFFF"

STAGES: tuple[Stage, ...] = (
    Stage("new", "New", 10, True, "#06D6A0", MIDNIGHT),
    Stage("qualified", "Qualified", 25, True, "#FFC145", MIDNIGHT),
    Stage("proposal", "Proposal", 50, True, "#F78C6B", MIDNIGHT),
    Stage("negotiation", "Negotiation", 75, True, "#118AB2", WHITE),
    Stage("won", "Won", 100, False, MIDNIGHT, WHITE),
    Stage("lost", "Lost", 0, False, "#CDD8DB", MIDNIGHT),
)

_BY_KEY = {s.key: s for s in STAGES}
STAGE_KEYS = tuple(_BY_KEY)
OPEN_STAGES = tuple(s.key for s in STAGES if s.open)
CLOSED_STAGES = tuple(s.key for s in STAGES if not s.open)


def stage(key: str) -> Stage:
    try:
        return _BY_KEY[key]
    except KeyError:
        raise ValueError(f"Unknown stage: {key}") from None


class StageOut(BaseModel):
    key: str
    label: str
    probability: int
    open: bool
    color: str
    text_color: str


router = APIRouter(tags=["meta"])


@router.get("/meta/stages", response_model=list[StageOut])
def list_stages() -> list[dict]:
    return [asdict(s) for s in STAGES]
