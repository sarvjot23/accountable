"""The FastAPI app: mounts each feature's router under /api, and on start runs migrations
and seeds a new database (APP-2, APP-14)."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from accountable import db
from accountable.activities.api import router as activities_router
from accountable.contacts.api import router as contacts_router
from accountable.dashboard.api import router as dashboard_router
from accountable.deals.api import router as deals_router
from accountable.deals.stages import router as stages_router
from accountable.organizations.api import router as organizations_router


def start_up() -> None:
    """Migrate the database, and fill it with the sample data if it's new."""
    new = db.is_new_database()
    db.migrate()
    if new:
        from accountable.seed import seed

        with db.get_engine().begin() as conn:
            seed(conn)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    start_up()
    yield
    db.dispose_all()


app = FastAPI(title="Accountable", version="0.1.0", lifespan=lifespan)

for router in (
    organizations_router,
    contacts_router,
    deals_router,
    activities_router,
    dashboard_router,
    stages_router,
):
    app.include_router(router, prefix="/api")


def _plain_message(error: dict) -> str:
    """One validation error as a plain sentence (API-1)."""
    message = str(error.get("msg", "This value isn't valid"))
    if message.startswith("Value error, "):
        return message.removeprefix("Value error, ")
    field = next((str(p) for p in reversed(error.get("loc", ())) if isinstance(p, str) and p != "body"), None)
    label = field.replace("_", " ") if field else "the request"
    if error.get("type") == "missing":
        return f"Enter {label}"
    return f"Check {label}: {message[0].lower()}{message[1:]}"


@app.exception_handler(RequestValidationError)
async def validation_error(_request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = exc.errors()
    detail = _plain_message(errors[0]) if errors else "The request isn't valid"
    return JSONResponse(status_code=422, content={"detail": detail})
