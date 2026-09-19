from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID

class EmpresaCreate(BaseModel):
    ruc: str
    razon_social: str
    nombre_comercial: str
    telefono_contacto: str
    email_contacto: EmailStr
    creada_por_persona_id: UUID

class EmpresaResponse(BaseModel):
    id: UUID
    share_token: str
    ruc: str
    razon_social: str
    nombre_comercial: str
    estado_aprobacion: str

    class Config:
        from_attributes = True

class SedeCreate(BaseModel):
    nombre: str
    direccion: str
    telefono: str

class SedeUpdate(BaseModel):
    nombre: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None

from datetime import time, date

class SedeHorarioAtencionCreate(BaseModel):
    dia_semana: int
    hora_apertura: time
    hora_cierre: time

class SedeExcepcionCreate(BaseModel):
    fecha_excepcion: date
    estado_operativo: str # 'CERRADO' or 'ABIERTO_ESPECIAL'
    hora_apertura: Optional[time] = None
    hora_cierre: Optional[time] = None
    descripcion: Optional[str] = None


