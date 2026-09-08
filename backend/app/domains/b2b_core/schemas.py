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
