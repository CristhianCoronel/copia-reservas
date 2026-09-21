from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.core.responses import BaseResponse
from app.domains.auth.router import get_current_user
from app.domains.auth import models as auth_models
from app.domains.social import schemas
from app.domains.social.services import SocialService

router = APIRouter()

@router.get("/groups", response_model=BaseResponse[list], tags=["B2C - Player"])
async def get_social_groups(current_user: auth_models.Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    data = await SocialService.get_social_groups(db)
    return BaseResponse(status=True, data=data)

@router.post("/teams", response_model=BaseResponse[dict], tags=["B2C - Player"])
async def create_team(data: schemas.EquipoCreate, current_user: auth_models.Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    res_data = await SocialService.create_team(data, current_user, db)
    return BaseResponse(status=True, data=res_data, message="Equipo creado exitosamente")

@router.get("/teams", response_model=BaseResponse[dict], tags=["B2C - Player"])
async def get_my_teams(current_user: auth_models.Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    data = await SocialService.get_my_teams(current_user, db)
    return BaseResponse(status=True, data=data)

@router.get("/teams/{team_id}/members", response_model=BaseResponse[list], tags=["B2C - Player"])
async def get_team_members(team_id: UUID, current_user: auth_models.Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    data = await SocialService.get_team_members(team_id, current_user, db)
    return BaseResponse(status=True, data=data)

@router.post("/teams/{team_id}/invite", response_model=BaseResponse[dict], tags=["B2C - Player"])
async def invite_team_member(team_id: UUID, data: schemas.EquipoInviteRequest, current_user: auth_models.Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    res_data = await SocialService.invite_team_member(team_id, data, current_user, db)
    return BaseResponse(status=True, data=res_data, message="Invitación enviada")

@router.get("/chats", response_model=BaseResponse[list], tags=["B2C - Player"])
async def get_my_chats(current_user: auth_models.Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    data = await SocialService.get_my_chats(current_user, db)
    return BaseResponse(status=True, data=data)

@router.get("/chats/{chat_id}/messages", response_model=BaseResponse[dict], tags=["B2C - Player"])
async def get_chat_messages(chat_id: UUID, offset: int = 0, limit: int = 50, current_user: auth_models.Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    data = await SocialService.get_chat_messages(chat_id, offset, limit, current_user, db)
    return BaseResponse(status=True, data=data)

@router.post("/chats/{chat_id}/messages", response_model=BaseResponse[dict], tags=["B2C - Player"])
async def send_chat_message(chat_id: UUID, data: schemas.MensajeCreate, current_user: auth_models.Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    res_data = await SocialService.send_chat_message(chat_id, data, current_user, db)
    return BaseResponse(status=True, data=res_data, message="Mensaje enviado")

@router.post("/interact", response_model=BaseResponse[dict], tags=["B2C - Player"])
async def interact_with_object(payload: dict, current_user: auth_models.Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await SocialService.interact_with_object(payload, current_user, db)
    return BaseResponse(status=True, data={}, message="Interacción procesada exitosamente.")
