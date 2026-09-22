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

class EmpresaUpdate(BaseModel):
    nombre_comercial: Optional[str] = None
    es_sede_unica: Optional[bool] = None
    terminos_condiciones: Optional[str] = None
    politica_cancelacion: Optional[str] = None
    telefono_contacto: Optional[str] = None
    email_contacto: Optional[EmailStr] = None

class SedeCreate(BaseModel):
    nombre: str
    direccion: str
    telefono: str

class SedeUpdate(BaseModel):
    nombre: Optional[str] = None
    direccion: Optional[str] = None
    referencia: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    maps_url: Optional[str] = None
    horas_limite_cancelacion: Optional[int] = None
    max_horas_reserva_continua: Optional[int] = None
    reserva_minutos_espera: Optional[int] = None
    tipo_adelanto_requerido: Optional[str] = None
    valor_adelanto_requerido: Optional[float] = None

class ContratoCreate(BaseModel):
    username: str
    rol: str # 'ADMINISTRADOR', 'RECEPCIONISTA', 'OPERADOR_MANTENIMIENTO'

class SedeServicioLink(BaseModel):
    servicio_id: UUID
    es_gratuito: bool = True
    costo_adicional: Optional[float] = None
    descripcion: Optional[str] = None

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



