from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.core.responses import BaseResponse
from app.domains.booking import schemas
from app.domains.booking.services import BookingService
from app.domains.auth.router import get_current_user

router = APIRouter()

@router.post("/b2c/reservas", response_model=BaseResponse[schemas.ReservaResponse], status_code=status.HTTP_201_CREATED)
async def crear_reserva(res_in: schemas.ReservaCreate, db: AsyncSession = Depends(get_db)):
    reserva = await BookingService.crear_reserva(res_in, db)
    return BaseResponse(status=True, data=reserva, message="Reserva creada exitosamente")

@router.get("/b2c/canchas", tags=["B2C - Booking"], response_model=BaseResponse[list])
async def listar_canchas(date: str = None, db: AsyncSession = Depends(get_db)):
    data = await BookingService.listar_canchas(date, db)
    return BaseResponse(status=True, data=data)

@router.get("/business/courts/{court_id}/availability", tags=["B2B - Business"], response_model=BaseResponse[list])
async def get_court_availability(court_id: str, date: str, db: AsyncSession = Depends(get_db)):
    data = await BookingService.get_court_availability(court_id, date, db)
    return BaseResponse(status=True, data=data)

class CourtPayload(BaseModel):
    name: str
    sport: str
    modalities: List[str]

class SolapamientosPayload(BaseModel):
    blocked_court_ids: List[str]

@router.get("/business/venues/{venue_id}/courts", tags=["B2B - Business"], response_model=BaseResponse[list])
async def get_venue_courts(venue_id: str, db: AsyncSession = Depends(get_db)):
    data = await BookingService.get_venue_courts(venue_id, db)
    return BaseResponse(status=True, data=data)

@router.post("/business/venues/{venue_id}/courts", tags=["B2B - Business"], response_model=BaseResponse[dict])
async def create_venue_court(venue_id: str, payload: CourtPayload, db: AsyncSession = Depends(get_db)):
    data = await BookingService.create_venue_court(venue_id, payload.name, payload.sport, payload.modalities, db)
    return BaseResponse(status=True, data=data, message="Cancha creada exitosamente")

@router.put("/business/courts/{court_id}/solapamientos", tags=["B2B - Business"], response_model=BaseResponse[dict])
async def update_court_solapamientos(court_id: str, payload: SolapamientosPayload, db: AsyncSession = Depends(get_db)):
    await BookingService.update_court_solapamientos(court_id, payload.blocked_court_ids, db)
    return BaseResponse(status=True, data={}, message="Solapamientos actualizados")

class IntervalPayload(BaseModel):
    hora_inicio: str
    hora_fin: str
    precio: float

class SchedulePayload(BaseModel):
    date: str
    intervals: List[IntervalPayload]

class BlockPayload(BaseModel):
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    motivo: str
    descripcion: Optional[str] = None

@router.get("/business/courts/{court_id}/schedule", tags=["B2B - Business"], response_model=BaseResponse[dict])
async def get_court_schedule(court_id: str, date: str, db: AsyncSession = Depends(get_db)):
    data = await BookingService.get_court_schedule(court_id, date, db)
    return BaseResponse(status=True, data=data)

@router.post("/business/courts/{court_id}/schedule", tags=["B2B - Business"], response_model=BaseResponse[dict])
async def save_court_schedule(court_id: str, payload: SchedulePayload, db: AsyncSession = Depends(get_db)):
    await BookingService.save_court_schedule(court_id, payload.date, payload.intervals, db)
    return BaseResponse(status=True, data={}, message="Horario guardado exitosamente")

@router.post("/business/courts/{court_id}/blocks", tags=["B2B - Business"], response_model=BaseResponse[dict])
async def create_court_block(court_id: str, payload: BlockPayload, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    data = await BookingService.create_court_block(court_id, payload, current_user, db)
    return BaseResponse(status=True, data=data, message="Bloqueo creado exitosamente")

@router.get("/business/venues/{venue_id}/reservations/pending", tags=["B2B - Business"], response_model=BaseResponse[list])
async def get_pending_reservations(venue_id: str, db: AsyncSession = Depends(get_db)):
    data = await BookingService.get_pending_reservations(venue_id, db)
    return BaseResponse(status=True, data=data)

@router.get("/business/companies/{company_id}/reservations/pending", tags=["B2B - Business"], response_model=BaseResponse[list])
async def get_company_pending_reservations(company_id: str, db: AsyncSession = Depends(get_db)):
    data = await BookingService.get_company_pending_reservations(company_id, db)
    return BaseResponse(status=True, data=data)

@router.get("/business/companies/{company_id}/courts-summary", tags=["B2B - Business"], response_model=BaseResponse[list])
async def get_company_courts_summary(company_id: str, db: AsyncSession = Depends(get_db)):
    data = await BookingService.get_company_courts_summary(company_id, db)
    return BaseResponse(status=True, data=data)

@router.put("/business/reservations/{reserva_id}/approve", tags=["B2B - Business"], response_model=BaseResponse[dict])
async def approve_reservation(reserva_id: str, db: AsyncSession = Depends(get_db)):
    await BookingService.approve_reservation(reserva_id, db)
    return BaseResponse(status=True, data={}, message="Reserva aprobada")

@router.put("/business/reservations/{reserva_id}/cancel", tags=["B2B - Business"], response_model=BaseResponse[dict])
async def cancel_reservation(reserva_id: str, db: AsyncSession = Depends(get_db)):
    await BookingService.cancel_reservation(reserva_id, db)
    return BaseResponse(status=True, data={}, message="Reserva cancelada")

class ManualReservaPayload(BaseModel):
    userName: str
    phone: Optional[str] = None
    alreadyPaid: bool
    time: str

@router.post("/business/courts/{court_id}/reservations", tags=["B2B - Business"], response_model=BaseResponse[dict])
async def create_manual_reservation(court_id: str, payload: ManualReservaPayload, date: str, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await BookingService.create_manual_reservation(court_id, payload, date, current_user, db)
    return BaseResponse(status=True, data={}, message="Reserva manual creada")

@router.get("/system/catalogs", tags=["System - SuperAdmin"], response_model=BaseResponse[dict])
async def get_system_catalogs(db: AsyncSession = Depends(get_db)):
    data = await BookingService.get_system_catalogs(db)
    return BaseResponse(status=True, data=data)

class DeportePayload(BaseModel):
    nombre: str
    is_active: bool = True

class ServicioPayload(BaseModel):
    nombre: str
    icono: Optional[str] = None
    categoria: Optional[str] = None

@router.post("/system/catalogs/deportes", tags=["System - SuperAdmin"], response_model=BaseResponse[dict])
async def create_deporte(payload: DeportePayload, db: AsyncSession = Depends(get_db)):
    data = await BookingService.create_deporte(payload, db)
    return BaseResponse(status=True, data=data, message="Deporte creado")

@router.put("/system/catalogs/deportes/{deporte_id}", tags=["System - SuperAdmin"], response_model=BaseResponse[dict])
async def update_deporte(deporte_id: str, payload: DeportePayload, db: AsyncSession = Depends(get_db)):
    data = await BookingService.update_deporte(deporte_id, payload, db)
    return BaseResponse(status=True, data=data, message="Deporte actualizado")

@router.delete("/system/catalogs/deportes/{deporte_id}", tags=["System - SuperAdmin"], response_model=BaseResponse[dict])
async def delete_deporte(deporte_id: str, db: AsyncSession = Depends(get_db)):
    await BookingService.delete_deporte(deporte_id, db)
    return BaseResponse(status=True, data={}, message="Deporte eliminado")

@router.post("/system/catalogs/servicios", tags=["System - SuperAdmin"], response_model=BaseResponse[dict])
async def create_servicio(payload: ServicioPayload, db: AsyncSession = Depends(get_db)):
    data = await BookingService.create_servicio(payload, db)
    return BaseResponse(status=True, data=data, message="Servicio creado")

@router.put("/system/catalogs/servicios/{servicio_id}", tags=["System - SuperAdmin"], response_model=BaseResponse[dict])
async def update_servicio(servicio_id: str, payload: ServicioPayload, db: AsyncSession = Depends(get_db)):
    data = await BookingService.update_servicio(servicio_id, payload, db)
    return BaseResponse(status=True, data=data, message="Servicio actualizado")

@router.delete("/system/catalogs/servicios/{servicio_id}", tags=["System - SuperAdmin"], response_model=BaseResponse[dict])
async def delete_servicio(servicio_id: str, db: AsyncSession = Depends(get_db)):
    await BookingService.delete_servicio(servicio_id, db)
    return BaseResponse(status=True, data={}, message="Servicio eliminado")
