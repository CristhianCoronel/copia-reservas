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
    
    # Formateamos para que coincida con la interfaz Court del Frontend
    data = []
    for c in canchas:
        data.append({
            "id": str(c.id),
            "name": c.nombre,
            "sport": "FUTBOL5", # MVP Hardcode
            "isCovered": False,
            "services": ["Estacionamiento", "Duchas"],
            "regularPrice": 120.0,
            "peakPrice": 150.0,
            "imageColor": "#1E293B",
            "distanceKm": 1.5,
            "address": "Sede Principal",
            "rules": "Prohibido toperoles"
        })
    return {"data": data}

@app.get("/api/v1/player/profile/me", tags=["B2C - Player"])
async def get_my_profile():
    """Endpoint MVP: Obtiene el perfil del jugador actual (Mock para que Frontend cargue)."""
    return {
        "data": {
            "fullName": "Juan Perez (MVP)",
            "document": "71234567",
            "role": "Jugador",
            "referral": {
                "code": "JUAN-5X92",
                "successfulReferrals": 2,
                "totalEarned": 30.00
            }
        }
    }

@app.get("/api/v1/player/social/groups", tags=["B2C - Social"])
async def get_social_groups():
    return {"data": [{"id": "1", "name": "Fútbol Centro", "members": 150}]}

@app.get("/api/v1/system/companies/pending", tags=["System - SuperAdmin"])
async def get_pending_companies():
    return {"data": [{"id": "1", "companyName": "Canchas El 10", "contactName": "Diego A.", "phone": "999888777", "document": "20555555551"}]}

@app.get("/api/v1/system/catalogs", tags=["System - SuperAdmin"])
async def get_system_catalogs():
    return {"data": [{"id": "1", "name": "Deportes", "items": 4}]}

@app.get("/api/v1/business/courts/{court_id}/availability", tags=["B2B - Business"])
async def get_court_availability(court_id: str, date: str):
    # Mock data directly from CourtsView fallback
    return {"data": [
        {"time": "18:00 - 19:00", "isPeak": True, "price": 150.0, "available": True},
        {"time": "19:00 - 20:00", "isPeak": True, "price": 150.0, "available": False},
        {"time": "20:00 - 21:00", "isPeak": True, "price": 150.0, "available": True}
    ]}

@app.post("/api/v1/auth/login", tags=["Auth & Identity"])
async def login_mock():
    return {"status": True, "data": {"token": "mock-jwt-token"}}

# Aquí montamos los routers oficiales
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth & Identity"])
app.include_router(b2b_router, prefix="/api/v1/b2b", tags=["B2B - Administration"])
app.include_router(booking_router, prefix="/api/v1/b2c/reservas", tags=["B2C - Booking"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.app_port, reload=True)
