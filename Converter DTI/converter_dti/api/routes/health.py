"""Health and version endpoints."""

from fastapi import APIRouter

from converter_dti.config import APP_NAME, APP_VERSION, PROTOCOL_NAME, PROTOCOL_VERSION

router = APIRouter()


@router.get("/health")
def health() -> dict:
    """Service health check."""
    return {"status": "ok", "service": APP_NAME}


@router.get("/version")
def version() -> dict:
    """Version metadata endpoint."""
    return {
        "service": APP_NAME,
        "app_version": APP_VERSION,
        "protocol": PROTOCOL_NAME,
        "protocol_version": PROTOCOL_VERSION,
    }
