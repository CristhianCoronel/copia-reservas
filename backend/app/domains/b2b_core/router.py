from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from app.core.database import get_db
from app.core.responses import BaseResponse
from app.domains.b2b_core import schemas
from app.domains.b2b_core.services import B2bCoreService
from pydantic import BaseModel

router = APIRouter()

class StatusUpdate(BaseModel):
    status: str

@router.post("/empresas", response_model=BaseResponse[schemas.EmpresaResponse], status_code=status.HTTP_201_CREATED)
async def registrar_empresa(empresa_in: schemas.EmpresaCreate, db: AsyncSession = Depends(get_db)):
    empresa = await B2bCoreService.registrar_empresa(empresa_in, db)
    return BaseResponse(status=True, data=empresa, message="Empresa registrada exitosamente")

@router.get("/system/companies/pending", tags=["System - SuperAdmin"], response_model=BaseResponse[list])
async def get_pending_companies(db: AsyncSession = Depends(get_db)):
    """Obtiene la lista de empresas pendientes de validación/aprobación por sistema."""
    data = await B2bCoreService.get_pending_companies(db)
    return BaseResponse(status=True, data=data)

@router.put("/system/companies/{company_id}/status", tags=["System - SuperAdmin"], response_model=BaseResponse[dict])
async def update_company_status(company_id: uuid.UUID, payload: StatusUpdate, db: AsyncSession = Depends(get_db)):
    """Actualiza el estado de aprobación de una empresa (ej. APROBADA, RECHAZADA)."""
    msg = await B2bCoreService.update_company_status(company_id, payload.status, db)
    return BaseResponse(status=True, data={}, message=msg)

@router.get("/system/companies/registered", tags=["System - SuperAdmin"], response_model=BaseResponse[list])
async def get_registered_companies(db: AsyncSession = Depends(get_db)):
    """Obtiene la lista de empresas aprobadas con estadísticas de canchas y reservas."""
    data = await B2bCoreService.get_registered_companies(db)
    return BaseResponse(status=True, data=data)

@router.post("/business/companies/{company_id}/venues", tags=["B2B - Business"], response_model=BaseResponse[dict])
async def create_venue(company_id: str, payload: schemas.SedeCreate, db: AsyncSession = Depends(get_db)):
    data = await B2bCoreService.create_venue(company_id, payload, db)
    return BaseResponse(status=True, data=data, message="Sede creada exitosamente")

@router.put("/business/venues/{venue_id}", tags=["B2B - Business"], response_model=BaseResponse[dict])
async def update_venue(venue_id: str, payload: schemas.SedeUpdate, db: AsyncSession = Depends(get_db)):
    await B2bCoreService.update_venue(venue_id, payload, db)
    return BaseResponse(status=True, data={}, message="Sede actualizada exitosamente")

@router.delete("/business/venues/{venue_id}", tags=["B2B - Business"], response_model=BaseResponse[dict])
async def delete_venue(venue_id: str, db: AsyncSession = Depends(get_db)):
    await B2bCoreService.delete_venue(venue_id, db)
    return BaseResponse(status=True, data={}, message="Sede eliminada lógicamente")

@router.get("/business/venues/{venue_id}/schedules", tags=["B2B - Business"], response_model=BaseResponse[dict])
async def get_venue_schedules(venue_id: str, db: AsyncSession = Depends(get_db)):
    data = await B2bCoreService.get_venue_schedules(venue_id, db)
    return BaseResponse(status=True, data=data)

@router.post("/business/venues/{venue_id}/schedules", tags=["B2B - Business"], response_model=BaseResponse[dict])
async def set_venue_schedules(venue_id: str, payload: List[schemas.SedeHorarioAtencionCreate], db: AsyncSession = Depends(get_db)):
    await B2bCoreService.set_venue_schedules(venue_id, payload, db)
    return BaseResponse(status=True, data={}, message="Horarios actualizados exitosamente")

@router.post("/business/venues/{venue_id}/exceptions", tags=["B2B - Business"], response_model=BaseResponse[dict])
async def create_venue_exception(venue_id: str, payload: schemas.SedeExcepcionCreate, db: AsyncSession = Depends(get_db)):
    data = await B2bCoreService.create_venue_exception(venue_id, payload, db)
    return BaseResponse(status=True, data=data, message="Excepción horaria creada")

from app.domains.auth.router import get_current_user
from app.domains.auth.models import Usuario

@router.get("/business/companies/{company_id}", tags=["B2B - Business"], response_model=BaseResponse[dict])
async def get_company_details(company_id: str, db: AsyncSession = Depends(get_db)):
    data = await B2bCoreService.get_company_details(company_id, db)
    return BaseResponse(status=True, data=data)

@router.put("/business/companies/{company_id}", tags=["B2B - Business"], response_model=BaseResponse[dict])
async def update_company(company_id: str, payload: schemas.EmpresaUpdate, db: AsyncSession = Depends(get_db)):
    data = await B2bCoreService.update_company(company_id, payload, db)
    return BaseResponse(status=True, data=data, message="Empresa actualizada exitosamente")

@router.get("/business/venues/{venue_id}", tags=["B2B - Business"], response_model=BaseResponse[dict])
async def get_venue_details(venue_id: str, db: AsyncSession = Depends(get_db)):
    data = await B2bCoreService.get_venue_details(venue_id, db)
    return BaseResponse(status=True, data=data)

@router.get("/business/venues/{venue_id}/services", tags=["B2B - Business"], response_model=BaseResponse[list])
async def get_venue_services(venue_id: str, db: AsyncSession = Depends(get_db)):
    data = await B2bCoreService.get_venue_services(venue_id, db)
    return BaseResponse(status=True, data=data)

@router.post("/business/venues/{venue_id}/services", tags=["B2B - Business"], response_model=BaseResponse[dict])
async def add_venue_service(venue_id: str, payload: schemas.SedeServicioLink, db: AsyncSession = Depends(get_db)):
    data = await B2bCoreService.add_venue_service(venue_id, payload, db)
    return BaseResponse(status=True, data=data, message="Servicio agregado a la sede")

@router.delete("/business/venues/{venue_id}/services/{servicio_id}", tags=["B2B - Business"], response_model=BaseResponse[dict])
async def remove_venue_service(venue_id: str, servicio_id: str, db: AsyncSession = Depends(get_db)):
    await B2bCoreService.remove_venue_service(venue_id, servicio_id, db)
    return BaseResponse(status=True, data={}, message="Servicio removido de la sede")

@router.get("/business/companies/{company_id}/venues/{venue_id}/staff", tags=["B2B - Business"], response_model=BaseResponse[list])
async def get_venue_staff(company_id: str, venue_id: str, db: AsyncSession = Depends(get_db)):
    data = await B2bCoreService.get_venue_staff(company_id, venue_id, db)
    return BaseResponse(status=True, data=data)

@router.post("/business/companies/{company_id}/venues/{venue_id}/staff", tags=["B2B - Business"], response_model=BaseResponse[dict])
async def add_venue_staff(company_id: str, venue_id: str, payload: schemas.ContratoCreate, current_user: Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    data = await B2bCoreService.add_venue_staff(company_id, venue_id, payload.username, payload.rol, current_user, db)
    return BaseResponse(status=True, data=data, message="Colaborador asignado exitosamente")

@router.delete("/business/contracts/{contract_id}", tags=["B2B - Business"], response_model=BaseResponse[dict])
async def remove_staff_contract(contract_id: str, db: AsyncSession = Depends(get_db)):
    await B2bCoreService.remove_staff_contract(contract_id, db)
    return BaseResponse(status=True, data={}, message="Contrato revocado exitosamente")

