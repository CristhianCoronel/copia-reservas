from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.domains.b2b_core import models, schemas
import uuid

router = APIRouter()

def generate_share_token(prefix="emp"):
    return f"{prefix}-{uuid.uuid4().hex[:8]}"

@router.post("/empresas", response_model=schemas.EmpresaResponse, status_code=status.HTTP_201_CREATED)
async def registrar_empresa(empresa_in: schemas.EmpresaCreate, db: AsyncSession = Depends(get_db)):

    result = await db.execute(select(models.Empresa).where(models.Empresa.ruc == empresa_in.ruc))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="El RUC ya está registrado en la plataforma.")

    nueva_empresa = models.Empresa(
        creada_por_persona_id=empresa_in.creada_por_persona_id,
        share_token=generate_share_token(),
        ruc=empresa_in.ruc,
        razon_social=empresa_in.razon_social,
        nombre_comercial=empresa_in.nombre_comercial,
        telefono_contacto=empresa_in.telefono_contacto,
        email_contacto=empresa_in.email_contacto
    )
    db.add(nueva_empresa)
    

    await db.flush()
    nuevo_contrato = models.Contrato(
        empresa_id=nueva_empresa.id,
        persona_id=empresa_in.creada_por_persona_id,
        rol="ADMINISTRADOR",
        otorgado_por=empresa_in.creada_por_persona_id,
        fecha_inicio=nueva_empresa.created_at.date() if nueva_empresa.created_at else None # Se autogenerará
    )
    db.add(nuevo_contrato)
    
    await db.commit()
    await db.refresh(nueva_empresa)
    return nueva_empresa


from sqlalchemy.orm import selectinload

from app.domains.auth.models import Persona, Usuario

@router.get("/system/companies/pending", tags=["System - SuperAdmin"])
async def get_pending_companies(db: AsyncSession = Depends(get_db)):
    """Obtiene la lista de empresas pendientes de validación/aprobación por sistema."""
    query = select(models.Empresa).options(
        selectinload(models.Empresa.creador).selectinload(Persona.usuario)
    ).where(models.Empresa.estado_aprobacion == 'PENDIENTE')
    
    result = await db.execute(query)
    empresas = result.scalars().all()
    
    data = []
    for e in empresas:
        data.append({
            "id": str(e.id),
            "companyName": e.razon_social,
            "commercialName": e.nombre_comercial,
            "contactName": e.contacto_legal if e.contacto_legal else "Sin Nombre",
            "phone": e.telefono_contacto,
            "email": e.email_contacto,
            "document": e.ruc,
            "createdAt": e.created_at.isoformat() if e.created_at else None,
            "creatorName": f"{e.creador.nombres} {e.creador.apellidos}" if e.creador else "Desconocido",
            "creatorDocument": e.creador.numero_documento if e.creador else "Desconocido",
            "creatorEmail": e.creador.usuario.email if e.creador and e.creador.usuario else "Desconocido",
            "creatorPhone": e.creador.usuario.telefono if e.creador and e.creador.usuario else "Desconocido",
            "creatorCreatedAt": e.creador.usuario.created_at.isoformat() if e.creador and e.creador.usuario and e.creador.usuario.created_at else None
        })
        
    return {"data": data}

from pydantic import BaseModel

class StatusUpdate(BaseModel):
    status: str

@router.put("/system/companies/{company_id}/status", tags=["System - SuperAdmin"])
async def update_company_status(company_id: uuid.UUID, payload: StatusUpdate, db: AsyncSession = Depends(get_db)):
    """Actualiza el estado de aprobación de una empresa (ej. APROBADA, RECHAZADA)."""
    result = await db.execute(select(models.Empresa).where(models.Empresa.id == company_id))
    empresa = result.scalars().first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    empresa.estado_aprobacion = payload.status
    await db.commit()
    return {"status": True, "message": f"Estado actualizado a {payload.status}"}

from sqlalchemy.orm import selectinload
from app.domains.booking.models import Cancha, Reserva
from app.domains.auth.models import Persona
from datetime import datetime, timedelta

@router.get("/system/companies/registered", tags=["System - SuperAdmin"])
async def get_registered_companies(db: AsyncSession = Depends(get_db)):
    """Obtiene la lista de empresas aprobadas con estadísticas de canchas y reservas."""
    query = (
        select(models.Empresa)
        .options(
            selectinload(models.Empresa.creador),
            selectinload(models.Empresa.sedes).selectinload(models.Sede.canchas).selectinload(Cancha.reservas)
        )
        .where(models.Empresa.estado_aprobacion == 'APROBADA')
    )
    result = await db.execute(query)
    empresas = result.scalars().all()
    
    data = []
    seven_days_ago = datetime.now().date() - timedelta(days=7)
    
    for e in empresas:
        canchas_totales = 0
        reservas_por_estado = {}
        reservas_lista = []
        reservas_last_week = 0
        for s in e.sedes:
            canchas_totales += len(s.canchas)
            for c in s.canchas:
                for r in c.reservas:
                    reservas_por_estado[r.estado] = reservas_por_estado.get(r.estado, 0) + 1
                    
                    if r.fecha_reserva and r.fecha_reserva >= seven_days_ago:
                        reservas_last_week += 1
                        
                    reservas_lista.append({
                        "id": str(r.id),
                        "fecha": r.fecha_reserva.isoformat() if r.fecha_reserva else "",
                        "estado": r.estado,
                        "solicitante_id": str(r.persona_organizadora_id)
                    })
                    
        # Para evitar un N+1 masivo, extraemos nombres de solicitantes
        solicitantes_ids = list(set(r["solicitante_id"] for r in reservas_lista))
        if solicitantes_ids:
            personas_res = await db.execute(select(Persona).where(Persona.id.in_(solicitantes_ids)))
            personas = {str(p.id): f"{p.nombres} {p.apellidos}" for p in personas_res.scalars().all()}
            for r in reservas_lista:
                r["solicitante"] = personas.get(r["solicitante_id"], "Desconocido")
        else:
            for r in reservas_lista:
                r["solicitante"] = "Desconocido"

        data.append({
            "id": str(e.id),
            "companyName": e.razon_social,
            "ownerName": f"{e.creador.nombres} {e.creador.apellidos}" if e.creador else "Desconocido",
            "courtsCount": canchas_totales,
            "reservasLastWeek": reservas_last_week,
            "planName": "Plan Profesional",
            "since": e.created_at.date().isoformat() if e.created_at else "",
            "reservasStats": reservas_por_estado,
            "reservas": reservas_lista
        })
        
    return {"status": True, "data": data}

@router.post("/business/companies/{company_id}/venues", tags=["B2B - Business"])
async def create_venue(company_id: str, payload: schemas.SedeCreate, db: AsyncSession = Depends(get_db)):
    nueva_sede = models.Sede(
        empresa_id=company_id,
        nombre=payload.nombre,
        direccion=payload.direccion,
        telefono=payload.telefono,
        ubigeo_distrito_id="140101", # TODO: Get from system later
        latitud=0.0,
        longitud=0.0,
        tipo_adelanto_requerido="PORCENTAJE",
        valor_adelanto_requerido=50.0
    )
    db.add(nueva_sede)
    
    # Check if company had es_sede_unica = True and set to False if it's the second venue
    # For now we'll just set it to False
    emp = await db.execute(select(models.Empresa).where(models.Empresa.id == company_id))
    emp_obj = emp.scalars().first()
    if emp_obj:
        emp_obj.es_sede_unica = False
        
    await db.commit()
    await db.refresh(nueva_sede)
    return {"status": True, "data": {"id": str(nueva_sede.id), "name": nueva_sede.nombre}}

@router.put("/business/venues/{venue_id}", tags=["B2B - Business"])
async def update_venue(venue_id: str, payload: schemas.SedeUpdate, db: AsyncSession = Depends(get_db)):
    sede = await db.execute(select(models.Sede).where(models.Sede.id == venue_id))
    sede_obj = sede.scalars().first()
    if not sede_obj:
        raise HTTPException(status_code=404, detail="Sede no encontrada")
    
    if payload.nombre is not None: sede_obj.nombre = payload.nombre
    if payload.direccion is not None: sede_obj.direccion = payload.direccion
    if payload.telefono is not None: sede_obj.telefono = payload.telefono
    
    await db.commit()
    return {"status": True}

@router.delete("/business/venues/{venue_id}", tags=["B2B - Business"])
async def delete_venue(venue_id: str, db: AsyncSession = Depends(get_db)):
    sede = await db.execute(select(models.Sede).where(models.Sede.id == venue_id))
    sede_obj = sede.scalars().first()
    if not sede_obj:
        raise HTTPException(status_code=404, detail="Sede no encontrada")
    
    sede_obj.estado = "INACTIVA"
    await db.commit()
    return {"status": True}

from typing import List

@router.get("/business/venues/{venue_id}/schedules", tags=["B2B - Business"])
async def get_venue_schedules(venue_id: str, db: AsyncSession = Depends(get_db)):
    # Regular schedules
    sched = await db.execute(select(models.SedeHorarioAtencion).where(models.SedeHorarioAtencion.sede_id == venue_id))
    regular = sched.scalars().all()
    
    # Exceptions
    exc = await db.execute(select(models.SedeExcepcionHorario).where(models.SedeExcepcionHorario.sede_id == venue_id))
    exceptions = exc.scalars().all()
    
    return {
        "status": True,
        "data": {
            "regular": [
                {
                    "id": str(r.id),
                    "dia_semana": r.dia_semana,
                    "hora_apertura": r.hora_apertura.strftime("%H:%M") if r.hora_apertura else None,
                    "hora_cierre": r.hora_cierre.strftime("%H:%M") if r.hora_cierre else None
                } for r in regular
            ],
            "exceptions": [
                {
                    "id": str(e.id),
                    "fecha_excepcion": e.fecha_excepcion.isoformat(),
                    "estado_operativo": e.estado_operativo,
                    "hora_apertura": e.hora_apertura.strftime("%H:%M") if e.hora_apertura else None,
                    "hora_cierre": e.hora_cierre.strftime("%H:%M") if e.hora_cierre else None,
                    "descripcion": e.descripcion
                } for e in exceptions
            ]
        }
    }

@router.post("/business/venues/{venue_id}/schedules", tags=["B2B - Business"])
async def set_venue_schedules(venue_id: str, payload: List[schemas.SedeHorarioAtencionCreate], db: AsyncSession = Depends(get_db)):
    # Delete existing regular schedule for this venue
    await db.execute(models.SedeHorarioAtencion.__table__.delete().where(models.SedeHorarioAtencion.sede_id == venue_id))
    
    # Insert new ones
    for item in payload:
        new_sched = models.SedeHorarioAtencion(
            sede_id=venue_id,
            dia_semana=item.dia_semana,
            hora_apertura=item.hora_apertura,
            hora_cierre=item.hora_cierre
        )
        db.add(new_sched)
    
    await db.commit()
    return {"status": True}

@router.post("/business/venues/{venue_id}/exceptions", tags=["B2B - Business"])
async def create_venue_exception(venue_id: str, payload: schemas.SedeExcepcionCreate, db: AsyncSession = Depends(get_db)):
    new_exc = models.SedeExcepcionHorario(
        sede_id=venue_id,
        fecha_excepcion=payload.fecha_excepcion,
        estado_operativo=payload.estado_operativo,
        hora_apertura=payload.hora_apertura,
        hora_cierre=payload.hora_cierre,
        descripcion=payload.descripcion
    )
    db.add(new_exc)
    await db.commit()
    await db.refresh(new_exc)
    return {"status": True, "data": {"id": str(new_exc.id)}}

@router.delete("/business/venues/{venue_id}/exceptions/{exception_id}", tags=["B2B - Business"])
async def delete_venue_exception(venue_id: str, exception_id: str, db: AsyncSession = Depends(get_db)):
    exc = await db.execute(select(models.SedeExcepcionHorario).where(models.SedeExcepcionHorario.id == exception_id, models.SedeExcepcionHorario.sede_id == venue_id))
    exc_obj = exc.scalars().first()
    if exc_obj:
        await db.execute(models.SedeExcepcionHorario.__table__.delete().where(models.SedeExcepcionHorario.id == exception_id))
        await db.commit()
    return {"status": True}

