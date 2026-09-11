from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime
from uuid import UUID

class MensajeBase(BaseModel):
    tipo_mensaje: str
    contenido_texto: Optional[str] = None
    archivo_url: Optional[str] = None
    datos_objeto: Optional[Dict[str, Any]] = None

class MensajeResponse(MensajeBase):
    id: UUID
    chat_id: UUID
    remitente_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

class MensajeCreate(MensajeBase):
    pass

class ChatParticipanteResponse(BaseModel):
    persona_id: UUID
    rol: str
    joined_at: datetime
    
    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    id: UUID
    tipo_canal: str
    referencia_id: Optional[UUID]
    participantes: List[ChatParticipanteResponse]
    ultimo_mensaje: Optional[MensajeResponse] = None

    class Config:
        from_attributes = True

class GrupoAbiertoResponse(BaseModel):
    id: UUID
    title: str
    organizer: str
    organizerRating: float
    courtName: str
    date: str
    time: str
    maxPlayers: int
    currentPlayers: int
    totalCourtPrice: float
    sport: str

class EquipoResponse(BaseModel):
    id: UUID
    name: str
    sport: str
    members: int
    role: str

class InvitacionResponse(BaseModel):
    id: UUID
    teamName: str
    inviter: str
