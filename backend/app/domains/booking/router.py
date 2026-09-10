from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, or_
from app.core.database import get_db
from app.domains.booking import models, schemas
import uuid

router = APIRouter()

def generate_reserva_token():
    return f"rsv-{uuid.uuid4().hex[:8]}"

@router.post("/b2c/reservas", response_model=schemas.ReservaResponse, status_code=status.HTTP_201_CREATED)
async def crear_reserva(res_in: schemas.ReservaCreate, db: AsyncSession = Depends(get_db)):

    overlapping_query = select(models.Reserva).where(
        and_(
            models.Reserva.cancha_id == res_in.cancha_id,
            models.Reserva.fecha_reserva == res_in.fecha_reserva,
            models.Reserva.estado.in_(['PENDIENTE_PAGO', 'CONFIRMADA']),

            models.Reserva.hora_inicio < res_in.hora_fin_solicitada,
            models.Reserva.hora_fin > res_in.hora_inicio_solicitada
        )
    )
    
    result = await db.execute(overlapping_query)
    conflicto = result.scalars().first()
    
    if conflicto:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La cancha ya no está disponible en el horario seleccionado."
        )


    nueva_reserva = models.Reserva(
        share_token=generate_reserva_token(),
        cancha_id=res_in.cancha_id,
        tipo_origen="INDIVIDUAL",
        persona_organizadora_id=res_in.persona_organizadora_id,
        fecha_reserva=res_in.fecha_reserva,
        hora_inicio_solicitada=res_in.hora_inicio_solicitada,
        hora_fin_solicitada=res_in.hora_fin_solicitada,
        hora_inicio=res_in.hora_inicio_solicitada,
        hora_fin=res_in.hora_fin_solicitada,
        duracion_horas=(
            res_in.hora_fin_solicitada.hour - res_in.hora_inicio_solicitada.hour + 
            (res_in.hora_fin_solicitada.minute - res_in.hora_inicio_solicitada.minute)/60.0
        ),
        precio_hora_historico=res_in.precio_hora_historico,
        precio_total_cancha=res_in.precio_total_cancha,
        monto_total_final=res_in.monto_total_final,
        _saldo_pendiente=res_in.monto_total_final, # Inicialmente debe todo
        estado="PENDIENTE_PAGO"
    )
    
    db.add(nueva_reserva)
    await db.commit()
    await db.refresh(nueva_reserva)
    
    return nueva_reserva


from sqlalchemy.orm import selectinload
from sqlalchemy import func
from datetime import datetime

@router.get("/b2c/canchas", tags=["B2C - Booking"])
async def listar_canchas(date: str = None, db: AsyncSession = Depends(get_db)):
    """Obtiene la lista de canchas activas con información de su sede y empresa."""
    from app.domains.b2b_core.models import Sede, Empresa
    
    query = (
        select(models.Cancha)
        .join(Sede, models.Cancha.sede_id == Sede.id)
        .join(Empresa, Sede.empresa_id == Empresa.id)
        .options(
            selectinload(models.Cancha.sede).selectinload(Sede.empresa),
            selectinload(models.Cancha.fotos)
        )
        .where(models.Cancha.is_active == True)
    )
    result = await db.execute(query)
    canchas = result.scalars().all()
    
    data = []
    for c in canchas:
        data.append({
            "id": str(c.id),
            "name": c.nombre,
            "sport": "Fútbol" if c._deporte_id else "Deporte",
            "isCovered": False, # TODO: Agregar a modelo
            "address": c.sede.direccion if c.sede else "",
            "distanceKm": 1.2, # TODO: Calcular según geoloc
            "companyName": c.sede.empresa.nombre_comercial if c.sede and c.sede.empresa else "Empresa",
            "regularPrice": 50.0, # TODO: Agregar a modelo
            "peakPrice": 80.0,
            "services": ["Estacionamiento", "Baños"] if c.caracteristicas else [],
            "rules": c.sede.politica_cancelacion if c.sede else "",
            "images": [f.foto_url for f in sorted(c.fotos, key=lambda x: x.orden)] if c.fotos else []
        })
        
    return {"data": data}


@router.get("/business/courts/{court_id}/availability", tags=["B2B - Business"])
async def get_court_availability(court_id: str, date: str, db: AsyncSession = Depends(get_db)):
    """Calcula disponibilidad basada en las reservas existentes en la BD para esa cancha y fecha."""
    try:
        fecha_obj = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")
        

    query = select(models.Reserva).where(
        and_(
            models.Reserva.cancha_id == court_id,
            models.Reserva.fecha_reserva == fecha_obj,
            models.Reserva.estado.in_(['PENDIENTE_PAGO', 'CONFIRMADA'])
        )
    )
    result = await db.execute(query)
    reservas = result.scalars().all()
    
    # ::!todo!::Generar slots de 16:00 a 23:00 como default (esto luego vendría del horario de la sede)
    slots = []
    for hora in range(16, 23):
        hora_str_inicio = f"{hora}:00:00"
        hora_str_fin = f"{hora+1}:00:00"
        
        is_peak = hora >= 18
        regular_price = 50.0
        peak_price = 90.0
        

        available = True
        for r in reservas:
            r_hora_inicio = r.hora_inicio.hour
            r_hora_fin = r.hora_fin.hour
            if r_hora_inicio <= hora and r_hora_fin > hora:
                available = False
                break
                
        slots.append({
            "time": f"{hora}:00 - {hora+1}:00",
            "isPeak": is_peak,
            "price": peak_price if is_peak else regular_price,
            "available": available
        })
        
    return {"data": slots}

@router.get("/social/groups", tags=["B2C - Social"])
async def get_social_groups():
    return {"data": []}

@router.get("/system/catalogs", tags=["System - SuperAdmin"])
async def get_system_catalogs():
    return {"data": [{"id": "1", "name": "Deportes", "items": 4}]}
