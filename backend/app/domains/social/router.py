from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import or_, and_, desc
from app.core.database import get_db
from app.domains.auth.router import get_current_user
from app.domains.auth import models as auth_models
from app.domains.booking import models as booking_models
from app.domains.social import models as social_models
from app.domains.social import schemas
from uuid import UUID

router = APIRouter()

@router.get("/groups", response_model=dict, tags=["B2C - Player"])
async def get_social_groups(current_user: auth_models.Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.domains.booking.models import PartidaAbierta, Reserva, Cancha
    from app.domains.b2b_core.models import Sede
    
    query = (
        select(PartidaAbierta)
        .join(Reserva, PartidaAbierta.reserva_id == Reserva.id)
        .join(Cancha, Reserva.cancha_id == Cancha.id)
        .join(Sede, Cancha.sede_id == Sede.id)
        .options(
            selectinload(PartidaAbierta.reserva).selectinload(Reserva.cancha).selectinload(Cancha.sede)
        )
        .where(PartidaAbierta.estado == 'RECAUDANDO')
    )
    result = await db.execute(query)
    partidas = result.scalars().all()
    
    data = []
    for p in partidas:
        data.append({
            "id": str(p.id),
            "title": "Partida Abierta",
            "organizer": "Organizador",
            "organizerRating": 4.5,
            "courtName": p.reserva.cancha.sede.nombre,
            "date": p.reserva.fecha_reserva.strftime("%Y-%m-%d"),
            "time": p.reserva.hora_inicio.strftime('%H:%M'),
            "maxPlayers": p.cupos_totales,
            "currentPlayers": p.cupos_totales - p.cupos_disponibles,
            "totalCourtPrice": float(p.presupuesto_meta),
            "sport": "PADEL" # Simplificación
        })
    return {"status": True, "data": data}

@router.get("/teams", response_model=dict, tags=["B2C - Player"])
async def get_my_teams(current_user: auth_models.Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.domains.booking.models import EquipoMiembro, Equipo
    persona_id = current_user.persona.id
    
    query = (
        select(EquipoMiembro)
        .join(Equipo, EquipoMiembro.equipo_id == Equipo.id)
        .options(selectinload(EquipoMiembro.equipo))
        .where(EquipoMiembro.persona_id == persona_id)
        .where(EquipoMiembro.is_active == True)
    )
    result = await db.execute(query)
    miembros = result.scalars().all()
    
    teams_data = []
    for m in miembros:
        teams_data.append({
            "id": str(m.equipo.id),
            "name": m.equipo.nombre,
            "sport": "Fútbol",
            "members": 1, # Simplificación
            "role": m.rol
        })
        
    # Obtener invitaciones pendientes (Mensajes de tipo INVITACION para el usuario que no han sido aceptadas)
    # Por simplificación, buscamos en los chats donde está el usuario
    q_inv = (
        select(social_models.Mensaje)
        .join(social_models.ChatParticipante, social_models.ChatParticipante.chat_id == social_models.Mensaje.chat_id)
        .options(selectinload(social_models.Mensaje.remitente))
        .where(social_models.ChatParticipante.persona_id == persona_id)
        .where(social_models.Mensaje.tipo_mensaje == 'INVITACION')
        .where(social_models.Mensaje.remitente_id != persona_id)
    )
    res_inv = await db.execute(q_inv)
    mensajes_inv = res_inv.scalars().all()
    
    inv_data = []
    for msg in mensajes_inv:
        # Solo mostrar si el estado es PENDIENTE (o si no tiene estado ACEPTADO/RECHAZADO)
        estado = (msg.datos_objeto or {}).get("estado")
        if not estado or estado not in ["ACEPTADA", "RECHAZADA"]:
            team_name = "Equipo"
            # Intentar obtener el nombre del equipo si está en meta_relacional
            meta = (msg.datos_objeto or {}).get("meta_relacional", {})
            if meta.get("tipo") == "EQUIPO":
                equipo_id = meta.get("id_relacion")
                if equipo_id:
                    q_team = select(Equipo).where(Equipo.id == UUID(equipo_id))
                    t_res = await db.execute(q_team)
                    t_obj = t_res.scalars().first()
                    if t_obj:
                        team_name = t_obj.nombre
                        
            inv_data.append({
                "id": str(msg.id), # Usamos el ID del mensaje para poder interactuar
                "teamName": team_name,
                "inviter": f"{msg.remitente.nombres} {msg.remitente.apellidos}" if msg.remitente else "Desconocido"
            })
            
    return {"status": True, "data": {"teams": teams_data, "invitations": inv_data}}

@router.get("/teams/{team_id}/members", response_model=dict, tags=["B2C - Player"])
async def get_team_members(team_id: UUID, current_user: auth_models.Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.domains.booking.models import EquipoMiembro, Equipo
    
    # 1. Active members
    q_miembros = (
        select(EquipoMiembro)
        .options(selectinload(EquipoMiembro.persona).selectinload(auth_models.Persona.usuario))
        .where(EquipoMiembro.equipo_id == team_id)
        .where(EquipoMiembro.is_active == True)
    )
    res_miembros = await db.execute(q_miembros)
    miembros = res_miembros.scalars().all()
    
    members_data = []
    for m in miembros:
        members_data.append({
            "id": str(m.persona.id),
            "nombre": f"{m.persona.nombres} {m.persona.apellidos}",
            "rol": m.rol,
            "estado": "ACTIVO",
            "is_me": m.persona.id == current_user.persona.id
        })
        
    # 2. Pending members (from INVITACION messages)
    q_inv = (
        select(social_models.Mensaje)
        .where(social_models.Mensaje.tipo_mensaje == 'INVITACION')
        .where(social_models.Mensaje.datos_objeto.op("->>")('estado') == 'PENDIENTE')
    )
    res_inv = await db.execute(q_inv)
    mensajes_inv = res_inv.scalars().all()
    
    for msg in mensajes_inv:
        meta = (msg.datos_objeto or {}).get("meta_relacional", {})
        if meta.get("tipo") == "EQUIPO" and meta.get("id_relacion") == str(team_id):
            q_part = (
                select(social_models.ChatParticipante)
                .options(selectinload(social_models.ChatParticipante.persona))
                .where(social_models.ChatParticipante.chat_id == msg.chat_id)
                .where(social_models.ChatParticipante.persona_id != msg.remitente_id)
            )
            res_part = await db.execute(q_part)
            part = res_part.scalars().first()
            if part:
                if not any(md["id"] == str(part.persona.id) for md in members_data):
                    members_data.append({
                        "id": str(part.persona.id),
                        "nombre": f"{part.persona.nombres} {part.persona.apellidos}",
                        "rol": "MIEMBRO",
                        "estado": "PENDIENTE",
                        "is_me": part.persona.id == current_user.persona.id
                    })

    return {"status": True, "data": members_data}

@router.get("/chats", response_model=dict, tags=["B2C - Player"])
async def get_my_chats(current_user: auth_models.Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.domains.booking.models import Equipo
    persona_id = current_user.persona.id

    query = (
        select(social_models.ChatParticipante)
        .options(selectinload(social_models.ChatParticipante.chat).selectinload(social_models.Chat.mensajes))
        .where(social_models.ChatParticipante.persona_id == persona_id)
        .order_by(desc(social_models.ChatParticipante.joined_at))
    )
    result = await db.execute(query)
    participaciones = result.scalars().all()

    chats_data = []
    for p in participaciones:
        chat = p.chat
        ultimo_mensaje = None
        if chat.mensajes:
            ultimo_mensaje_obj = chat.mensajes[-1]
            ultimo_mensaje = schemas.MensajeResponse.model_validate(ultimo_mensaje_obj).model_dump()

        referencia_nombre = None
        if chat.tipo_canal == 'EQUIPO' and chat.referencia_id:
            q_eq = select(Equipo).where(Equipo.id == chat.referencia_id)
            eq = (await db.execute(q_eq)).scalars().first()
            if eq:
                referencia_nombre = eq.nombre
        elif chat.tipo_canal == 'JUGADOR_JUGADOR':
            q_other = (
                select(social_models.ChatParticipante)
                .options(selectinload(social_models.ChatParticipante.persona))
                .where(social_models.ChatParticipante.chat_id == chat.id)
                .where(social_models.ChatParticipante.persona_id != persona_id)
            )
            other_part = (await db.execute(q_other)).scalars().first()
            if other_part:
                referencia_nombre = f"{other_part.persona.nombres} {other_part.persona.apellidos}"

        chats_data.append({
            "id": str(chat.id),
            "tipo_canal": chat.tipo_canal,
            "referencia_id": str(chat.referencia_id) if chat.referencia_id else None,
            "referencia_nombre": referencia_nombre,
            "ultimo_mensaje": ultimo_mensaje,
            "no_leidos": p._no_leidos
        })

    return {"status": True, "data": chats_data}

@router.get("/chats/{chat_id}/messages", response_model=dict, tags=["B2C - Player"])
async def get_chat_messages(chat_id: UUID, current_user: auth_models.Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    persona_id = current_user.persona.id

    query_part = select(social_models.ChatParticipante).where(
        social_models.ChatParticipante.chat_id == chat_id,
        social_models.ChatParticipante.persona_id == persona_id
    )
    result_part = await db.execute(query_part)
    if not result_part.scalars().first():
        raise HTTPException(status_code=403, detail="No eres participante de este chat.")

    query_msgs = (
        select(social_models.Mensaje)
        .options(selectinload(social_models.Mensaje.remitente))
        .where(social_models.Mensaje.chat_id == chat_id)
        .order_by(social_models.Mensaje.created_at.asc())
    )
    result_msgs = await db.execute(query_msgs)
    mensajes = result_msgs.scalars().all()

    msgs_data = []
    for m in mensajes:
        msgs_data.append({
            "id": str(m.id),
            "chat_id": str(m.chat_id),
            "remitente_id": str(m.remitente_id),
            "remitente_nombre": f"{m.remitente.nombres} {m.remitente.apellidos}" if m.remitente else "Desconocido",
            "tipo_mensaje": m.tipo_mensaje,
            "contenido_texto": m.contenido_texto,
            "archivo_url": m.archivo_url,
            "datos_objeto": m.datos_objeto,
            "created_at": m.created_at.isoformat()
        })

    return {"status": True, "data": msgs_data}

@router.post("/interact", response_model=dict, tags=["B2C - Player"])
async def interact_with_object(payload: dict, current_user: auth_models.Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    persona_id = current_user.persona.id
    mensaje_id = payload.get("mensaje_id")
    action = payload.get("action")

    if not mensaje_id or not action:
        raise HTTPException(status_code=400, detail="Se requiere mensaje_id y action")

    query = select(social_models.Mensaje).where(social_models.Mensaje.id == UUID(mensaje_id))
    result = await db.execute(query)
    mensaje = result.scalars().first()

    if not mensaje:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")

    datos_objeto = mensaje.datos_objeto or {}
    
    if mensaje.tipo_mensaje == "INVITACION":
        if action == "ACEPTAR":
            meta = datos_objeto.get("meta_relacional", {})
            if meta.get("tipo") == "EQUIPO":
                equipo_id = meta.get("id_relacion")
                q_em = select(booking_models.EquipoMiembro).where(
                    booking_models.EquipoMiembro.equipo_id == UUID(equipo_id),
                    booking_models.EquipoMiembro.persona_id == persona_id
                )
                res_em = await db.execute(q_em)
                em = res_em.scalars().first()
                if not em:
                    new_em = booking_models.EquipoMiembro(
                        equipo_id=UUID(equipo_id),
                        persona_id=persona_id,
                        rol="JUGADOR",
                        is_active=True
                    )
                    db.add(new_em)
            datos_objeto["estado"] = "ACEPTADA"
        elif action == "RECHAZAR":
            datos_objeto["estado"] = "RECHAZADA"
            
    elif mensaje.tipo_mensaje == "COMPROBANTE_PAGO":
        if action == "APROBAR":
            datos_objeto["estado"] = "APROBADO"
        elif action == "RECHAZAR":
            datos_objeto["estado"] = "RECHAZADO"

    # Important to update the JSON column properly
    from sqlalchemy.orm.attributes import flag_modified
    mensaje.datos_objeto = datos_objeto
    flag_modified(mensaje, "datos_objeto")
    await db.commit()

    return {"status": True, "message": "Interacción procesada exitosamente."}
