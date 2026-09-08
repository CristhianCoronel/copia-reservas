from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.database import get_db

# Import models to register them with SQLAlchemy Base
from app.domains.auth import models as auth_models
from app.domains.b2b_core import models as b2b_models
from app.domains.booking import models as booking_models

from app.domains.auth.router import router as auth_router
from app.domains.b2b_core.router import router as b2b_router
from app.domains.booking.router import router as booking_router

# (Espacio en blanco)

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

@app.get("/api/v1/b2c/canchas", tags=["B2C - Booking"])
async def listar_canchas(db: AsyncSession = Depends(get_db)):
    """Endpoint MVP: Obtiene la lista de canchas activas."""
    result = await db.execute(
        select(booking_models.Cancha).where(booking_models.Cancha.is_active == True)
    )
    canchas = result.scalars().all()
    return {"data": [{"id": str(c.id), "nombre": c.nombre, "deporte_id": str(c._deporte_id)} for c in canchas]}

# Aquí montamos los routers oficiales
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth & Identity"])
app.include_router(b2b_router, prefix="/api/v1/b2b", tags=["B2B - Administration"])
app.include_router(booking_router, prefix="/api/v1/b2c/reservas", tags=["B2C - Booking"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.app_port, reload=True)
