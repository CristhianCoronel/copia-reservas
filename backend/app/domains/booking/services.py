from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_, or_, func
from fastapi import HTTPException, status
from app.domains.booking import models, schemas
from app.domains.auth.models import Persona, Usuario
from app.domains.b2b_core.models import Sede, Empresa
from datetime import datetime, time
import uuid
from typing import List

def generate_reserva_token():
    return f"rsv-{uuid.uuid4().hex[:8]}"

class BookingService:
    @staticmethod
    async def crear_reserva(res_in: schemas.ReservaCreate, db: AsyncSession):
        overlapping_query = select(models.Reserva).where(
            and_(
                models.Reserva.cancha_id == res_in.cancha_id,
                models.Reserva.fecha_reserva == res_in.fecha_reserva,
                models.Reserva.estado.in_(['PENDIENTE_PAGO', 'CONFIRMADA']),
                models.Reserva.hora_inicio < res_in.hora_fin_solicitada,
                models.Reserva.hora_fin > res_in.hora_inicio_solicitada
            )
        )
        conflicto = (await db.execute(overlapping_query)).scalars().first()
        if conflicto:
            raise HTTPException(status_code=409, detail="La cancha ya no está disponible en el horario seleccionado.")

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
            _saldo_pendiente=res_in.monto_total_final,
            estado="PENDIENTE_PAGO"
        )
        db.add(nueva_reserva)
        await db.commit()
        await db.refresh(nueva_reserva)
        return nueva_reserva

    @staticmethod
    async def listar_canchas(date: str, db: AsyncSession):
        query = (
            select(models.Cancha)
            .join(Sede, models.Cancha.sede_id == Sede.id)
            .join(Empresa, Sede.empresa_id == Empresa.id)
            .options(
                selectinload(models.Cancha.sede).selectinload(Sede.empresa),
                selectinload(models.Cancha.fotos)
            )
            .where(models.Cancha.is_active == True)
        )
        canchas = (await db.execute(query)).scalars().all()
        
        data = []
        for c in canchas:
            data.append({
                "id": str(c.id),
                "name": c.nombre,
                "sport": "Fútbol" if c._deporte_id else "Deporte",
                "isCovered": False,
                "address": c.sede.direccion if c.sede else "",
                "distanceKm": 1.2,
                "companyName": c.sede.empresa.nombre_comercial if c.sede and c.sede.empresa else "Empresa",
                "regularPrice": 50.0,
                "peakPrice": 80.0,
                "services": ["Estacionamiento", "Baños"] if c.caracteristicas else [],
                "rules": (c.sede.empresa.politica_cancelacion or "") if (c.sede and c.sede.empresa) else "",
                "images": [f.foto_url for f in sorted(c.fotos, key=lambda x: x.orden)] if c.fotos else []
            })
        return data

    @staticmethod
    async def get_court_availability(court_id: str, date: str, db: AsyncSession):
        try:
            fecha_obj = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")

        query = select(models.Reserva).where(
            and_(
                models.Reserva.cancha_id == court_id,
                models.Reserva.fecha_reserva == fecha_obj,
                models.Reserva.estado.in_(['PENDIENTE_PAGO', 'CONFIRMADA'])
            )
        )
        reservas = (await db.execute(query)).scalars().all()
        
        slots = []
        for hora in range(16, 23):
            is_peak = hora >= 18
            available = True
            for r in reservas:
                if r.hora_inicio.hour <= hora and r.hora_fin.hour > hora:
                    available = False
                    break
            slots.append({
                "time": f"{hora}:00 - {hora+1}:00",
                "isPeak": is_peak,
                "price": 90.0 if is_peak else 50.0,
                "available": available
            })
        return slots

    @staticmethod
    async def get_venue_courts(venue_id: str, db: AsyncSession):
        query = select(models.Cancha).options(
            selectinload(models.Cancha.solapamientos_principales)
        ).where(and_(models.Cancha.sede_id == venue_id, models.Cancha.is_active == True))
        
        canchas = (await db.execute(query)).scalars().all()
        data = []
        for c in canchas:
            data.append({
                "id": str(c.id),
                "name": c.nombre,
                "sport": "Fútbol",
                "modalities": c.modalidades if c.modalidades else ["Fútbol 5"],
                "basePrice": 60.0,
                "blocked_court_ids": [str(s.cancha_bloqueada_id) for s in c.solapamientos_principales]
            })
        return data

    @staticmethod
    async def create_venue_court(venue_id: str, payload_name: str, payload_sport: str, payload_modalities: List[str], db: AsyncSession):
        nueva_cancha = models.Cancha(
            sede_id=venue_id,
            nombre=payload_name,
            _deporte_id="00000000-0000-0000-0000-000000000000",
            modalidades=payload_modalities,
            is_active=True
        )
        db.add(nueva_cancha)
        await db.commit()
        await db.refresh(nueva_cancha)
        return {
            "id": str(nueva_cancha.id),
            "name": nueva_cancha.nombre,
            "sport": payload_sport,
            "modalities": nueva_cancha.modalidades,
            "basePrice": 60.0,
            "blocked_court_ids": []
        }

    @staticmethod
    async def update_court_solapamientos(court_id: str, blocked_ids: List[str], db: AsyncSession):
        await db.execute(models.CanchaSolapamiento.__table__.delete().where(
            models.CanchaSolapamiento.cancha_principal_id == court_id
        ))
        for b_id in blocked_ids:
            db.add(models.CanchaSolapamiento(cancha_principal_id=court_id, cancha_bloqueada_id=b_id))
        await db.commit()

    @staticmethod
    async def get_court_schedule(court_id: str, date: str, db: AsyncSession):
        try:
            fecha_obj = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de fecha inválido")
        
        dia_semana = fecha_obj.weekday()
        
        cancha = (await db.execute(select(models.Cancha).options(selectinload(models.Cancha.sede)).where(models.Cancha.id == court_id))).scalars().first()
        if not cancha:
            raise HTTPException(status_code=404, detail="Cancha no encontrada")
            
        from app.domains.b2b_core.models import SedeHorarioAtencion
        horario_sede = (await db.execute(select(SedeHorarioAtencion).where(
            SedeHorarioAtencion.sede_id == cancha.sede_id,
            SedeHorarioAtencion.dia_semana == dia_semana
        ))).scalars().first()
        
        hora_apertura = horario_sede.hora_apertura if horario_sede else time(16, 0)
        hora_cierre = horario_sede.hora_cierre if horario_sede else time(23, 0)
        
        tarifas_base = (await db.execute(select(models.CanchaHorario).where(
            models.CanchaHorario.cancha_id == court_id,
            models.CanchaHorario.dia_semana == dia_semana,
            models.CanchaHorario.is_active == True
        ))).scalars().all()
        
        fecha_inicio_dia = datetime.combine(fecha_obj, time.min)
        fecha_fin_dia = datetime.combine(fecha_obj, time.max)
        
        bloqueos = (await db.execute(select(models.CanchaBloqueo).where(
            models.CanchaBloqueo.cancha_id == court_id,
            models.CanchaBloqueo.fecha_hora_inicio >= fecha_inicio_dia,
            models.CanchaBloqueo.fecha_hora_fin <= fecha_fin_dia
        ))).scalars().all()
        
        query = (
            select(models.Reserva, Persona.nombres, Persona.apellidos, Usuario.telefono)
            .join(Persona, models.Reserva.persona_organizadora_id == Persona.id)
            .join(Usuario, Persona.usuario_id == Usuario.id)
            .where(
                models.Reserva.cancha_id == court_id,
                models.Reserva.fecha_reserva == fecha_obj,
                models.Reserva.estado.in_(['PENDIENTE_PAGO', 'CONFIRMADA'])
            )
        )
        reservas_data = (await db.execute(query)).all()

        return {
            "openingTime": hora_apertura.strftime("%H:%M"),
            "closingTime": hora_cierre.strftime("%H:%M"),
            "tariffs": [{"start": t.hora_inicio.strftime("%H:%M"), "end": t.hora_fin.strftime("%H:%M"), "price": float(t.precio_por_hora)} for t in tarifas_base],
            "blocks": [{"id": str(b.id), "start": b.fecha_hora_inicio.strftime("%H:%M"), "end": b.fecha_hora_fin.strftime("%H:%M"), "reason": b.motivo} for b in bloqueos],
            "reservations": [{
                "id": str(r.id), 
                "start": r.hora_inicio.strftime("%H:%M"), 
                "end": r.hora_fin.strftime("%H:%M"), 
                "status": "OCUPADO" if r.estado in ["CONFIRMADA", "PENDIENTE_PAGO"] else r.estado,
                "userName": f"{nombres} {apellidos}",
                "phone": telefono,
                "paymentStatus": "CONFIRMADO" if r.estado == "CONFIRMADA" else "PENDIENTE"
            } for r, nombres, apellidos, telefono in reservas_data]
        }

    @staticmethod
    async def save_court_schedule(court_id: str, payload_date: str, payload_intervals: list, db: AsyncSession):
        try:
            fecha_obj = datetime.strptime(payload_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de fecha inválido")
            
        dia_semana = fecha_obj.weekday()
        
        await db.execute(models.CanchaHorario.__table__.delete().where(
            models.CanchaHorario.cancha_id == court_id,
            models.CanchaHorario.dia_semana == dia_semana
        ))
        
        for interval in payload_intervals:
            h_ini = datetime.strptime(interval.hora_inicio, "%H:%M").time()
            h_fin = datetime.strptime(interval.hora_fin, "%H:%M").time()
            ch = models.CanchaHorario(
                cancha_id=court_id,
                dia_semana=dia_semana,
                hora_inicio=h_ini,
                hora_fin=h_fin,
                precio_por_hora=interval.precio
            )
            db.add(ch)
        await db.commit()

    @staticmethod
    async def create_court_block(court_id: str, payload, current_user, db: AsyncSession):
        persona_id = current_user.persona.id if current_user.persona else current_user.id
        b = models.CanchaBloqueo(
            cancha_id=court_id,
            fecha_hora_inicio=payload.fecha_hora_inicio,
            fecha_hora_fin=payload.fecha_hora_fin,
            motivo=payload.motivo,
            descripcion=payload.descripcion,
            registrado_por=persona_id
        )
        db.add(b)
        await db.commit()
        return {"id": str(b.id)}

    @staticmethod
    async def get_pending_reservations(venue_id: str, db: AsyncSession):
        query = (
            select(
                models.Reserva, 
                Persona.nombres, 
                Persona.apellidos, 
                Usuario.telefono, 
                models.Cancha.nombre.label('cancha_nombre'),
                models.PagoReserva.monto,
                models.PagoReserva.metodo_pago,
                models.PagoReserva.comprobante_url
            )
            .join(models.Cancha, models.Reserva.cancha_id == models.Cancha.id)
            .join(Persona, models.Reserva.persona_organizadora_id == Persona.id)
            .join(Usuario, Persona.usuario_id == Usuario.id)
            .outerjoin(models.PagoReserva, and_(models.PagoReserva.reserva_id == models.Reserva.id, models.PagoReserva.estado == 'PENDIENTE'))
            .where(
                models.Cancha.sede_id == venue_id,
                models.Reserva.estado == 'PENDIENTE_PAGO'
            )
        )
        rows = (await db.execute(query)).all()
        
        res_dict = {}
        for r, nombres, apellidos, telefono, cancha_nombre, monto, metodo_pago, comprobante_url in rows:
            if str(r.id) not in res_dict:
                res_dict[str(r.id)] = {
                    "id": str(r.id),
                    "userName": f"{nombres} {apellidos}",
                    "phone": telefono or "",
                    "courtName": cancha_nombre,
                    "date": "Hoy",
                    "time": r.hora_inicio.strftime("%H:%M"),
                    "amount": float(monto) if monto else float(r._saldo_pendiente),
                    "paymentMethod": metodo_pago or "Desconocido",
                    "comprobanteUrl": comprobante_url
                }
        return list(res_dict.values())

    @staticmethod
    async def get_company_pending_reservations(company_id: str, db: AsyncSession):
        query = (
            select(
                models.Reserva, 
                Persona.nombres, 
                Persona.apellidos, 
                Usuario.telefono, 
                models.Cancha.nombre.label('cancha_nombre'),
                Sede.nombre.label('sede_nombre'),
                models.PagoReserva.monto,
                models.PagoReserva.metodo_pago,
                models.PagoReserva.comprobante_url
            )
            .join(models.Cancha, models.Reserva.cancha_id == models.Cancha.id)
            .join(Sede, models.Cancha.sede_id == Sede.id)
            .join(Persona, models.Reserva.persona_organizadora_id == Persona.id)
            .join(Usuario, Persona.usuario_id == Usuario.id)
            .outerjoin(models.PagoReserva, and_(models.PagoReserva.reserva_id == models.Reserva.id, models.PagoReserva.estado == 'PENDIENTE'))
            .where(
                Sede.empresa_id == company_id,
                models.Reserva.estado == 'PENDIENTE_PAGO'
            )
        )
        rows = (await db.execute(query)).all()
        
        res_dict = {}
        for r, nombres, apellidos, telefono, cancha_nombre, sede_nombre, monto, metodo_pago, comprobante_url in rows:
            if str(r.id) not in res_dict:
                res_dict[str(r.id)] = {
                    "id": str(r.id),
                    "userName": f"{nombres} {apellidos}",
                    "phone": telefono or "",
                    "courtName": f"{cancha_nombre} ({sede_nombre})",
                    "date": "Hoy",
                    "time": r.hora_inicio.strftime("%H:%M"),
                    "amount": float(monto) if monto else float(r._saldo_pendiente),
                    "paymentMethod": metodo_pago or "Desconocido",
                    "comprobanteUrl": comprobante_url
                }
        return list(res_dict.values())

    @staticmethod
    async def get_company_courts_summary(company_id: str, db: AsyncSession):
        query_canchas = (
            select(models.Cancha, Sede)
            .join(Sede, models.Cancha.sede_id == Sede.id)
            .where(Sede.empresa_id == company_id, models.Cancha.is_active == True)
        )
        canchas_sedes = (await db.execute(query_canchas)).all()
        
        query_pendientes = (
            select(models.Reserva.cancha_id, func.count(models.Reserva.id))
            .join(models.Cancha, models.Reserva.cancha_id == models.Cancha.id)
            .join(Sede, models.Cancha.sede_id == Sede.id)
            .where(
                Sede.empresa_id == company_id,
                models.Reserva.estado == 'PENDIENTE_PAGO'
            )
            .group_by(models.Reserva.cancha_id)
        )
        res_pendientes = (await db.execute(query_pendientes)).all()
        pendientes_dict = {str(row[0]): row[1] for row in res_pendientes}
        
        sedes_dict = {}
        for cancha, sede in canchas_sedes:
            s_id = str(sede.id)
            if s_id not in sedes_dict:
                sedes_dict[s_id] = {
                    "venueId": s_id,
                    "venueName": sede.nombre,
                    "courts": []
                }
            sedes_dict[s_id]["courts"].append({
                "id": str(cancha.id),
                "name": cancha.nombre,
                "pendingCount": pendientes_dict.get(str(cancha.id), 0)
            })
        return list(sedes_dict.values())

    @staticmethod
    async def approve_reservation(reserva_id: str, db: AsyncSession):
        reserva = (await db.execute(select(models.Reserva).where(models.Reserva.id == reserva_id))).scalars().first()
        if not reserva:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")
        reserva.estado = "CONFIRMADA"
        reserva._saldo_pendiente = 0
        pagos = (await db.execute(select(models.PagoReserva).where(models.PagoReserva.reserva_id == reserva_id))).scalars().all()
        for pago in pagos:
            if pago.estado == "PENDIENTE":
                pago.estado = "APROBADO"
        await db.commit()

    @staticmethod
    async def cancel_reservation(reserva_id: str, db: AsyncSession):
        reserva = (await db.execute(select(models.Reserva).where(models.Reserva.id == reserva_id))).scalars().first()
        if not reserva:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")
        reserva.estado = "CANCELADA"
        pagos = (await db.execute(select(models.PagoReserva).where(models.PagoReserva.reserva_id == reserva_id))).scalars().all()
        for pago in pagos:
            if pago.estado == "PENDIENTE":
                pago.estado = "RECHAZADO"
        await db.commit()

    @staticmethod
    async def create_manual_reservation(court_id: str, payload, date: str, current_user, db: AsyncSession):
        try:
            fecha_obj = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de fecha inválido")

        hora_inicio_sol = datetime.strptime(payload.time, "%H:%M").time()
        hora_fin_sol = time((hora_inicio_sol.hour + 1) % 24, hora_inicio_sol.minute)

        persona_id = current_user.persona.id if current_user.persona else current_user.id
        nueva_reserva = models.Reserva(
            share_token=generate_reserva_token(),
            cancha_id=court_id,
            tipo_origen="MANUAL",
            persona_organizadora_id=persona_id,
            fecha_reserva=fecha_obj,
            hora_inicio_solicitada=hora_inicio_sol,
            hora_fin_solicitada=hora_fin_sol,
            hora_inicio=hora_inicio_sol,
            hora_fin=hora_fin_sol,
            duracion_horas=1.0,
            precio_hora_historico=0.0,
            precio_total_cancha=0.0,
            monto_total_final=0.0,
            _saldo_pendiente=0.0 if payload.alreadyPaid else 0.0, 
            estado="CONFIRMADA" if payload.alreadyPaid else "PENDIENTE_PAGO"
        )
        db.add(nueva_reserva)
        await db.commit()

    @staticmethod
    async def get_system_catalogs(db: AsyncSession):
        deportes = (await db.execute(select(models.Deporte))).scalars().all()
        servicios = (await db.execute(select(models.Servicio))).scalars().all()
        return {
            "sports": [{"id": str(d.id), "name": d.nombre, "is_active": d.is_active} for d in deportes],
            "services": [{"id": str(s.id), "name": s.nombre, "icon": s.icono, "category": s.categoria} for s in servicios]
        }

    @staticmethod
    async def create_deporte(payload, db: AsyncSession):
        nuevo = models.Deporte(nombre=payload.nombre, is_active=payload.is_active)
        db.add(nuevo)
        await db.commit()
        await db.refresh(nuevo)
        return {"id": str(nuevo.id), "name": nuevo.nombre, "is_active": nuevo.is_active}

    @staticmethod
    async def update_deporte(deporte_id: str, payload, db: AsyncSession):
        deporte = (await db.execute(select(models.Deporte).where(models.Deporte.id == deporte_id))).scalars().first()
        if not deporte:
            raise HTTPException(status_code=404, detail="Deporte no encontrado")
        deporte.nombre = payload.nombre
        deporte.is_active = payload.is_active
        await db.commit()
        return {"id": str(deporte.id), "name": deporte.nombre, "is_active": deporte.is_active}

    @staticmethod
    async def delete_deporte(deporte_id: str, db: AsyncSession):
        if (await db.execute(select(models.Cancha).where(models.Cancha._deporte_id == deporte_id))).scalars().first():
            raise HTTPException(status_code=409, detail="No se puede eliminar: hay canchas vinculadas a este deporte")
        deporte = (await db.execute(select(models.Deporte).where(models.Deporte.id == deporte_id))).scalars().first()
        if not deporte:
            raise HTTPException(status_code=404, detail="Deporte no encontrado")
        await db.delete(deporte)
        await db.commit()

    @staticmethod
    async def create_servicio(payload, db: AsyncSession):
        nuevo = models.Servicio(nombre=payload.nombre, icono=payload.icono, categoria=payload.categoria)
        db.add(nuevo)
        await db.commit()
        await db.refresh(nuevo)
        return {"id": str(nuevo.id), "name": nuevo.nombre, "icon": nuevo.icono, "category": nuevo.categoria}

    @staticmethod
    async def update_servicio(servicio_id: str, payload, db: AsyncSession):
        servicio = (await db.execute(select(models.Servicio).where(models.Servicio.id == servicio_id))).scalars().first()
        if not servicio:
            raise HTTPException(status_code=404, detail="Servicio no encontrado")
        servicio.nombre = payload.nombre
        servicio.icono = payload.icono
        servicio.categoria = payload.categoria
        await db.commit()
        return {"id": str(servicio.id), "name": servicio.nombre, "icon": servicio.icono, "category": servicio.categoria}

    @staticmethod
    async def delete_servicio(servicio_id: str, db: AsyncSession):
        from sqlalchemy import text
        linked = (await db.execute(text("SELECT 1 FROM sede_servicio WHERE servicio_id = :sid LIMIT 1"), {"sid": servicio_id})).first()
        if linked:
            raise HTTPException(status_code=409, detail="No se puede eliminar: hay sedes vinculadas a este servicio")
        servicio = (await db.execute(select(models.Servicio).where(models.Servicio.id == servicio_id))).scalars().first()
        if not servicio:
            raise HTTPException(status_code=404, detail="Servicio no encontrado")
        await db.delete(servicio)
        await db.commit()
