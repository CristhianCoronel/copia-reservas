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


@router.get("/system/companies/pending", tags=["System - SuperAdmin"])
async def get_pending_companies(db: AsyncSession = Depends(get_db)):
    """Obtiene la lista de empresas pendientes de validación/aprobación por sistema."""
    query = select(models.Empresa).where(models.Empresa.estado_aprobacion == 'PENDIENTE')
    result = await db.execute(query)
    empresas = result.scalars().all()
    
    data = []
    for e in empresas:
        data.append({
            "id": str(e.id),
            "companyName": e.razon_social,
            "contactName": e.contacto_legal if e.contacto_legal else "Sin Nombre",
            "phone": e.telefono_contacto,
            "document": e.ruc
        })
        
    return {"data": data}

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
