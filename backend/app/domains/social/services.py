from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func, or_
from fastapi import HTTPException
from app.domains.auth import models as auth_models
from app.domains.booking import models as booking_models
from app.domains.social import models as social_models
from app.domains.social import schemas
from uuid import UUID
import random
import datetime

class SocialService:
    @staticmethod
    async def get_social_groups(db: AsyncSession):
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
                "maxPlayers": p.cupo_maximo_jugadores,
                "currentPlayers": p.cupo_maximo_jugadores - p.cupos_disponibles,
                "totalCourtPrice": float(p.presupuesto_meta),
                "sport": "PADEL"
            })
        return data

    @staticmethod
    async def create_team(data: schemas.EquipoCreate, current_user: auth_models.Usuario, db: AsyncSession):
        from app.domains.booking.models import Equipo, EquipoMiembro
        
        existing = await db.execute(select(Equipo).where(Equipo.nombre == data.nombre))
        if existing.scalars().first():
            raise HTTPException(status_code=400, detail="Ya existe un equipo con ese nombre.")

        nuevo_equipo = Equipo(
            nombre=data.nombre,
            share_token=f"eq-{random.randint(1000, 9999)}",
            creador_id=current_user.persona.id
        )
        db.add(nuevo_equipo)
        await db.flush()

        miembro_admin = EquipoMiembro(
            equipo_id=nuevo_equipo.id,
            persona_id=current_user.persona.id,
            rol="CAPITAN",
            is_active=True
        )
        db.add(miembro_admin)

        nuevo_chat = social_models.Chat(
            tipo_canal="EQUIPO",
            referencia_id=nuevo_equipo.id
        )
        db.add(nuevo_chat)
        await db.flush()

        now = datetime.datetime.now(datetime.timezone.utc)
        chat_part = social_models.ChatParticipante(
            chat_id=nuevo_chat.id,
            persona_id=current_user.persona.id,
            rol="ADMIN",
            _no_leidos=0,
            joined_at=now
        )
        db.add(chat_part)
        await db.commit()
        return {"equipo_id": str(nuevo_equipo.id)}

    @staticmethod
    async def get_my_teams(current_user: auth_models.Usuario, db: AsyncSession):
        from app.domains.booking.models import EquipoMiembro, Equipo
        persona_id = current_user.persona.id
        from sqlalchemy.orm import aliased
        
        EM = aliased(EquipoMiembro)
        member_count_subq = (
            select(func.count(EM.id))
            .where(EM.equipo_id == Equipo.id)
            .where(EM.is_active == True)
            .correlate(Equipo)
            .scalar_subquery()
        )

        query = (
            select(EquipoMiembro, member_count_subq.label("member_count"))
            .join(Equipo, EquipoMiembro.equipo_id == Equipo.id)
            .options(selectinload(EquipoMiembro.equipo))
            .where(EquipoMiembro.persona_id == persona_id)
            .where(EquipoMiembro.is_active == True)
        )
        result = await db.execute(query)
        rows = result.all()
        
        teams_data = []
        for m, member_count in rows:
            teams_data.append({
                "id": str(m.equipo.id),
                "name": m.equipo.nombre,
                "sport": "Fútbol",
                "members": member_count or 0,
                "role": m.rol
            })
            
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
            estado = (msg.datos_objeto or {}).get("estado")
            if not estado or estado not in ["ACEPTADA", "RECHAZADA"]:
                team_name = "Equipo"
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
                    "id": str(msg.id),
                    "teamName": team_name,
                    "inviter": f"{msg.remitente.nombres} {msg.remitente.apellidos}" if msg.remitente else "Desconocido"
                })
                
        return {"teams": teams_data, "invitations": inv_data}

    @staticmethod
    async def get_team_members(team_id: UUID, current_user: auth_models.Usuario, db: AsyncSession):
        from app.domains.booking.models import EquipoMiembro
        
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
                "is_active": m.is_active,
                "is_me": m.persona.id == current_user.persona.id
            })
            
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
        return members_data

    @staticmethod
    async def invite_team_member(team_id: UUID, data: schemas.EquipoInviteRequest, current_user: auth_models.Usuario, db: AsyncSession):
        from app.domains.booking.models import EquipoMiembro, Equipo
        
        q_user = select(auth_models.Usuario).options(selectinload(auth_models.Usuario.persona)).where(
            or_(auth_models.Usuario.email == data.identifier, auth_models.Usuario.username == data.identifier)
        )
        user_invitado = (await db.execute(q_user)).scalars().first()
        if not user_invitado:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        if user_invitado.id == current_user.id:
            raise HTTPException(status_code=400, detail="No puedes invitarte a ti mismo")

        q_miembro = select(EquipoMiembro).where(
            EquipoMiembro.equipo_id == team_id,
            EquipoMiembro.persona_id == user_invitado.persona.id
        )
        if (await db.execute(q_miembro)).scalars().first():
            raise HTTPException(status_code=400, detail="El usuario ya es miembro de este equipo")

        q_equipo = select(Equipo).where(Equipo.id == team_id)
        equipo = (await db.execute(q_equipo)).scalars().first()
        if not equipo:
            raise HTTPException(status_code=404, detail="Equipo no encontrado")

        q_inv = (
            select(social_models.Mensaje)
            .join(social_models.Chat, social_models.Mensaje.chat_id == social_models.Chat.id)
            .join(social_models.ChatParticipante, social_models.Chat.id == social_models.ChatParticipante.chat_id)
            .where(social_models.Mensaje.tipo_mensaje == 'INVITACION')
            .where(social_models.Mensaje.datos_objeto.op("->>")('estado') == 'PENDIENTE')
            .where(social_models.ChatParticipante.persona_id == user_invitado.persona.id)
        )
        pendings = (await db.execute(q_inv)).scalars().all()
        for m in pendings:
            meta = (m.datos_objeto or {}).get("meta_relacional", {})
            if meta.get("tipo") == "EQUIPO" and meta.get("id_relacion") == str(team_id):
                raise HTTPException(status_code=400, detail="El usuario ya tiene una invitación pendiente")

        chat_id = None
        q_chats = select(social_models.Chat.id).where(social_models.Chat.tipo_canal == "JUGADOR_JUGADOR")
        all_j2j_chats = (await db.execute(q_chats)).scalars().all()
        if all_j2j_chats:
            q_find = (
                select(social_models.ChatParticipante.chat_id)
                .where(social_models.ChatParticipante.chat_id.in_(all_j2j_chats))
                .where(social_models.ChatParticipante.persona_id.in_([current_user.persona.id, user_invitado.persona.id]))
                .group_by(social_models.ChatParticipante.chat_id)
                .having(func.count(social_models.ChatParticipante.id) == 2)
            )
            chat_id = (await db.execute(q_find)).scalars().first()

        if not chat_id:
            nuevo_chat = social_models.Chat(tipo_canal="JUGADOR_JUGADOR")
            db.add(nuevo_chat)
            await db.flush()
            chat_id = nuevo_chat.id
            db.add(social_models.ChatParticipante(chat_id=chat_id, persona_id=current_user.persona.id, rol="ADMIN", _no_leidos=0, joined_at=datetime.datetime.now(datetime.timezone.utc)))
            db.add(social_models.ChatParticipante(chat_id=chat_id, persona_id=user_invitado.persona.id, rol="ADMIN", _no_leidos=0, joined_at=datetime.datetime.now(datetime.timezone.utc)))
            await db.flush()

        msg = social_models.Mensaje(
            chat_id=chat_id,
            remitente_id=current_user.persona.id,
            tipo_mensaje="INVITACION",
            contenido_texto=f"Te he invitado a unirte a {equipo.nombre}",
            datos_objeto={
                "meta_relacional": {"tipo": "EQUIPO", "id_relacion": str(team_id)},
                "estado": "PENDIENTE"
            }
        )
        db.add(msg)
        
        q_upd = select(social_models.ChatParticipante).where(
            social_models.ChatParticipante.chat_id == chat_id,
            social_models.ChatParticipante.persona_id == user_invitado.persona.id
        )
        target_part = (await db.execute(q_upd)).scalars().first()
        if target_part:
            target_part._no_leidos += 1
            
        await db.commit()
        return {
            "id": str(user_invitado.persona.id),
            "nombre": f"{user_invitado.persona.nombres} {user_invitado.persona.apellidos}",
            "rol": "MIEMBRO",
            "estado": "PENDIENTE",
            "is_me": False
        }

    @staticmethod
    async def get_my_chats(current_user: auth_models.Usuario, db: AsyncSession):
        from app.domains.booking.models import Equipo
        persona_id = current_user.persona.id

        query = (
            select(social_models.ChatParticipante)
            .options(selectinload(social_models.ChatParticipante.chat).selectinload(social_models.Chat.mensajes))
            .where(social_models.ChatParticipante.persona_id == persona_id)
            .order_by(social_models.ChatParticipante.joined_at.desc())
        )
        participaciones = (await db.execute(query)).scalars().all()

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
        return chats_data

    @staticmethod
    async def get_chat_messages(chat_id: UUID, offset: int, limit: int, current_user: auth_models.Usuario, db: AsyncSession):
        persona_id = current_user.persona.id
        query_part = select(social_models.ChatParticipante).where(
            social_models.ChatParticipante.chat_id == chat_id,
            social_models.ChatParticipante.persona_id == persona_id
        )
        if not (await db.execute(query_part)).scalars().first():
            raise HTTPException(status_code=403, detail="No eres participante de este chat.")

        query_msgs = (
            select(social_models.Mensaje)
            .options(selectinload(social_models.Mensaje.remitente))
            .where(social_models.Mensaje.chat_id == chat_id)
            .order_by(social_models.Mensaje.created_at.desc())
            .offset(offset)
            .limit(limit + 1)
        )
        mensajes_desc = (await db.execute(query_msgs)).scalars().all()
        
        has_more = len(mensajes_desc) > limit
        mensajes = mensajes_desc[:limit]
        mensajes.reverse()

        msgs_data = []
        for m in mensajes:
            msgs_data.append({
                "id": str(m.id),
                "chat_id": str(m.chat_id),
                "remitente_id": str(m.remitente_id),
                "remitente_nombre": f"{m.remitente.nombres} {m.remitente.apellidos}" if m.remitente else "Desconocido",
                "is_me": str(m.remitente_id) == str(persona_id),
                "tipo_mensaje": m.tipo_mensaje,
                "contenido_texto": m.contenido_texto,
                "archivo_url": m.archivo_url,
                "datos_objeto": m.datos_objeto,
                "created_at": m.created_at.isoformat()
            })
        return {"messages": msgs_data, "has_more": has_more}

    @staticmethod
    async def send_chat_message(chat_id: UUID, data: schemas.MensajeCreate, current_user: auth_models.Usuario, db: AsyncSession):
        persona_id = current_user.persona.id
        query_part = select(social_models.ChatParticipante).where(
            social_models.ChatParticipante.chat_id == chat_id,
            social_models.ChatParticipante.persona_id == persona_id
        )
        if not (await db.execute(query_part)).scalars().first():
            raise HTTPException(status_code=403, detail="No eres participante de este chat.")

        nuevo_mensaje = social_models.Mensaje(
            chat_id=chat_id,
            remitente_id=persona_id,
            tipo_mensaje=data.tipo_mensaje,
            contenido_texto=data.contenido_texto,
            archivo_url=data.archivo_url,
            datos_objeto=data.datos_objeto
        )
        db.add(nuevo_mensaje)
        
        q_otros = select(social_models.ChatParticipante).where(
            social_models.ChatParticipante.chat_id == chat_id,
            social_models.ChatParticipante.persona_id != persona_id
        )
        otros = (await db.execute(q_otros)).scalars().all()
        for o in otros:
            o._no_leidos += 1

        await db.commit()
        await db.refresh(nuevo_mensaje)
        
        return {
            "id": str(nuevo_mensaje.id),
            "chat_id": str(nuevo_mensaje.chat_id),
            "remitente_id": str(nuevo_mensaje.remitente_id),
            "remitente_nombre": f"{current_user.persona.nombres} {current_user.persona.apellidos}",
            "is_me": True,
            "tipo_mensaje": nuevo_mensaje.tipo_mensaje,
            "contenido_texto": nuevo_mensaje.contenido_texto,
            "archivo_url": nuevo_mensaje.archivo_url,
            "datos_objeto": nuevo_mensaje.datos_objeto,
            "created_at": nuevo_mensaje.created_at.isoformat()
        }

    @staticmethod
    async def interact_with_object(payload: dict, current_user: auth_models.Usuario, db: AsyncSession):
        persona_id = current_user.persona.id
        mensaje_id = payload.get("mensaje_id")
        action = payload.get("action")

        if not mensaje_id or not action:
            raise HTTPException(status_code=400, detail="Se requiere mensaje_id y action")

        query = select(social_models.Mensaje).where(social_models.Mensaje.id == UUID(mensaje_id))
        mensaje = (await db.execute(query)).scalars().first()
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
                    em = (await db.execute(q_em)).scalars().first()
                    if not em:
                        new_em = booking_models.EquipoMiembro(
                            equipo_id=UUID(equipo_id),
                            persona_id=persona_id,
                            rol="JUGADOR",
                            is_active=True
                        )
                        db.add(new_em)
                    
                    q_chat = select(social_models.Chat).where(
                        social_models.Chat.tipo_canal == "EQUIPO",
                        social_models.Chat.referencia_id == UUID(equipo_id)
                    )
                    chat_equipo = (await db.execute(q_chat)).scalars().first()
                    if chat_equipo:
                        q_part = select(social_models.ChatParticipante).where(
                            social_models.ChatParticipante.chat_id == chat_equipo.id,
                            social_models.ChatParticipante.persona_id == persona_id
                        )
                        part = (await db.execute(q_part)).scalars().first()
                        if not part:
                            new_part = social_models.ChatParticipante(
                                chat_id=chat_equipo.id,
                                persona_id=persona_id,
                                rol="MIEMBRO",
                                _no_leidos=0,
                                joined_at=datetime.datetime.now(datetime.timezone.utc)
                            )
                            db.add(new_part)

                datos_objeto["estado"] = "ACEPTADA"
            elif action == "RECHAZAR":
                datos_objeto["estado"] = "RECHAZADA"
                
        elif mensaje.tipo_mensaje == "COMPROBANTE_PAGO":
            if action == "APROBAR":
                datos_objeto["estado"] = "APROBADO"
            elif action == "RECHAZAR":
                datos_objeto["estado"] = "RECHAZADO"

        from sqlalchemy.orm.attributes import flag_modified
        mensaje.datos_objeto = datos_objeto
        flag_modified(mensaje, "datos_objeto")
        await db.commit()
