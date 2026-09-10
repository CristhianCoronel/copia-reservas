from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.database import get_db


from app.domains.auth import models as auth_models
from app.domains.b2b_core import models as b2b_models
from app.domains.booking import models as booking_models

from app.domains.auth.router import router as auth_router, player_router
from app.domains.b2b_core.router import router as b2b_router
from app.domains.booking.router import router as booking_router



import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="API Separa Altoke",
    description="Backend modular para plataforma de reservas B2B y B2C.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["System"])
async def health_check():
    """Valida que la API y la configuración base funcionen correctamente."""
    return {
        "status": "ok",
        "env": settings.app_env,
        "message": "Separa Altoke API is running"
    }




app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth & Identity"])
app.include_router(player_router, prefix="/api/v1/player", tags=["B2C - Player"])
app.include_router(b2b_router, prefix="/api/v1/b2b", tags=["B2B - Administration"])
app.include_router(booking_router, prefix="/api/v1", tags=["Booking & Misc"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.app_port, reload=True)
