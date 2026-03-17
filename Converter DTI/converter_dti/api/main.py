"""FastAPI application entrypoint."""

from fastapi import FastAPI

from converter_dti.config import APP_NAME
from converter_dti.api.routes.convert import router as convert_router
from converter_dti.api.routes.health import router as health_router

app = FastAPI(title=APP_NAME)
app.include_router(health_router)
app.include_router(convert_router)
