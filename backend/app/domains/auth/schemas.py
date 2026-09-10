from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class PersonaBase(BaseModel):
    nombres: str
    apellidos: str
    tipo_documento: str = Field(..., pattern="^(DNI|CE|PASAPORTE)$")
    numero_documento: str

class UsuarioCreate(BaseModel):
    email: EmailStr
    username: str
    password: str = Field(..., min_length=8)
    telefono: Optional[str] = None
    proveedor_auth: str = "LOCAL"
    rol: str = "PLAYER"
    persona: PersonaBase

class PersonaResponse(PersonaBase):
    id: UUID

    class Config:
        from_attributes = True

class UsuarioResponse(BaseModel):
    id: UUID
    email: EmailStr
    username: str
    rol: str
    is_active: bool
    persona: Optional[PersonaResponse] = None

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str
