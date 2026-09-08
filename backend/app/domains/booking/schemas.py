from pydantic import BaseModel, Field, validator
from typing import Optional
from uuid import UUID
from datetime import date, time

class ReservaCreate(BaseModel):
    cancha_id: UUID
    persona_organizadora_id: UUID
    fecha_reserva: date
    hora_inicio_solicitada: time
    hora_fin_solicitada: time
    precio_hora_historico: float
    precio_total_cancha: float
    monto_total_final: float

    @validator('hora_fin_solicitada')
    def end_time_must_be_after_start_time(cls, v, values):
        if 'hora_inicio_solicitada' in values and v <= values['hora_inicio_solicitada']:
            raise ValueError('La hora de fin debe ser posterior a la hora de inicio')
        return v

class ReservaResponse(BaseModel):
    id: UUID
    share_token: str
    estado: str
    fecha_reserva: date
    hora_inicio: time
    hora_fin: time

    class Config:
        from_attributes = True
