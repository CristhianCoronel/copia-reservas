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

@router.post("/", response_model=schemas.ReservaResponse, status_code=status.HTTP_201_CREATED)
async def crear_reserva(res_in: schemas.ReservaCreate, db: AsyncSession = Depends(get_db)):
    # --- LOGICA ANTICOLISIÓN ---
    # Verificar si ya existe una reserva ACTIVA o PENDIENTE en esa cancha que se solape en tiempo
    overlapping_query = select(models.Reserva).where(
        and_(
            models.Reserva.cancha_id == res_in.cancha_id,
            models.Reserva.fecha_reserva == res_in.fecha_reserva,
            models.Reserva.estado.in_(['PENDIENTE_PAGO', 'CONFIRMADA']),
            # Condición de solapamiento: (A_start < B_end) AND (A_end > B_start)
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

    # Crear la reserva
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
