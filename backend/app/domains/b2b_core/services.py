from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from app.domains.b2b_core import models, schemas
from app.domains.auth.models import Persona, Usuario
from app.domains.booking.models import Cancha, Reserva
import uuid
from datetime import datetime, timedelta
from typing import List

def generate_share_token(prefix="emp"):
    return f"{prefix}-{uuid.uuid4().hex[:8]}"

class B2bCoreService:
    @staticmethod
    async def registrar_empresa(empresa_in: schemas.EmpresaCreate, db: AsyncSession):
        result = await db.execute(select(models.Empresa).where(models.Empresa.ruc == empresa_in.ruc))
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="El RUC ya está registrado en la plataforma.")

        nueva_empresa = models.Empresa(
            creada_por_persona_id=empresa_in.creada_por_persona_id,
            share_token=generate_share_token(),
            ruc=empresa_in.ruc,
            razon_social=empresa_in.razon_social,
            nombre_comercial=empresa_in.nombre_comercial,
            telefono_contacto=empresa_in.telefono_contacto,
            email_contacto=empresa_in.email_contacto
        )
        db.add(nueva_empresa)
        await db.flush()
        
        nuevo_contrato = models.Contrato(
            empresa_id=nueva_empresa.id,
            persona_id=empresa_in.creada_por_persona_id,
            rol="ADMINISTRADOR",
            otorgado_por=empresa_in.creada_por_persona_id,
            fecha_inicio=nueva_empresa.created_at.date() if nueva_empresa.created_at else None
        )
        db.add(nuevo_contrato)
        await db.commit()
        await db.refresh(nueva_empresa)
        return nueva_empresa

    @staticmethod
    async def get_pending_companies(db: AsyncSession):
        query = select(models.Empresa).options(
            selectinload(models.Empresa.creador).selectinload(Persona.usuario)
        ).where(models.Empresa.estado_aprobacion == 'PENDIENTE')
        
        result = await db.execute(query)
        empresas = result.scalars().all()
        
        data = []
        for e in empresas:
            data.append({
                "id": str(e.id),
                "companyName": e.razon_social,
                "commercialName": e.nombre_comercial,
                "contactName": e.contacto_legal if e.contacto_legal else "Sin Nombre",
                "phone": e.telefono_contacto,
                "email": e.email_contacto,
                "document": e.ruc,
                "createdAt": e.created_at.isoformat() if e.created_at else None,
                "creatorName": f"{e.creador.nombres} {e.creador.apellidos}" if e.creador else "Desconocido",
                "creatorDocument": e.creador.numero_documento if e.creador else "Desconocido",
                "creatorEmail": e.creador.usuario.email if e.creador and e.creador.usuario else "Desconocido",
                "creatorPhone": e.creador.usuario.telefono if e.creador and e.creador.usuario else "Desconocido",
                "creatorCreatedAt": e.creador.usuario.created_at.isoformat() if e.creador and e.creador.usuario and e.creador.usuario.created_at else None
            })
        return data

    @staticmethod
    async def update_company_status(company_id: uuid.UUID, status_str: str, db: AsyncSession):
        result = await db.execute(select(models.Empresa).where(models.Empresa.id == company_id))
        empresa = result.scalars().first()
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        
        empresa.estado_aprobacion = status_str
        await db.commit()
        return f"Estado actualizado a {status_str}"

    @staticmethod
    async def get_registered_companies(db: AsyncSession):
        query = (
            select(models.Empresa)
            .options(
                selectinload(models.Empresa.creador),
                selectinload(models.Empresa.sedes).selectinload(models.Sede.canchas).selectinload(Cancha.reservas)
            )
            .where(models.Empresa.estado_aprobacion == 'APROBADA')
        )
        result = await db.execute(query)
        empresas = result.scalars().all()
        
        data = []
        seven_days_ago = datetime.now().date() - timedelta(days=7)
        
        for e in empresas:
            canchas_totales = 0
            reservas_por_estado = {}
            reservas_lista = []
            reservas_last_week = 0
            for s in e.sedes:
                canchas_totales += len(s.canchas)
                for c in s.canchas:
                    for r in c.reservas:
                        reservas_por_estado[r.estado] = reservas_por_estado.get(r.estado, 0) + 1
                        if r.fecha_reserva and r.fecha_reserva >= seven_days_ago:
                            reservas_last_week += 1
                            
                        reservas_lista.append({
                            "id": str(r.id),
                            "fecha": r.fecha_reserva.isoformat() if r.fecha_reserva else "",
                            "estado": r.estado,
                            "solicitante_id": str(r.persona_organizadora_id)
                        })
                        
            solicitantes_ids = list(set(r["solicitante_id"] for r in reservas_lista))
            if solicitantes_ids:
                personas_res = await db.execute(select(Persona).where(Persona.id.in_(solicitantes_ids)))
                personas = {str(p.id): f"{p.nombres} {p.apellidos}" for p in personas_res.scalars().all()}
                for r in reservas_lista:
                    r["solicitante"] = personas.get(r["solicitante_id"], "Desconocido")
            else:
                for r in reservas_lista:
                    r["solicitante"] = "Desconocido"

            data.append({
                "id": str(e.id),
                "companyName": e.razon_social,
                "ownerName": f"{e.creador.nombres} {e.creador.apellidos}" if e.creador else "Desconocido",
                "courtsCount": canchas_totales,
                "reservasLastWeek": reservas_last_week,
                "planName": "Plan Profesional",
                "since": e.created_at.date().isoformat() if e.created_at else "",
                "reservasStats": reservas_por_estado,
                "reservas": reservas_lista
            })
        return data

    @staticmethod
    async def create_venue(company_id: str, payload: schemas.SedeCreate, db: AsyncSession):
        nueva_sede = models.Sede(
            empresa_id=company_id,
            nombre=payload.nombre,
            direccion=payload.direccion,
            telefono=payload.telefono,
            ubigeo_distrito_id="140101",
            latitud=0.0,
            longitud=0.0,
            tipo_adelanto_requerido="PORCENTAJE",
            valor_adelanto_requerido=50.0
        )
        db.add(nueva_sede)
        
        emp = await db.execute(select(models.Empresa).where(models.Empresa.id == company_id))
        emp_obj = emp.scalars().first()
        if emp_obj:
            emp_obj.es_sede_unica = False
            
        await db.commit()
        await db.refresh(nueva_sede)
        return {"id": str(nueva_sede.id), "name": nueva_sede.nombre}

    @staticmethod
    async def update_venue(venue_id: str, payload: schemas.SedeUpdate, db: AsyncSession):
        sede = await db.execute(select(models.Sede).where(models.Sede.id == venue_id))
        sede_obj = sede.scalars().first()
        if not sede_obj:
            raise HTTPException(status_code=404, detail="Sede no encontrada")
        
        if payload.nombre is not None: sede_obj.nombre = payload.nombre
        if payload.direccion is not None: sede_obj.direccion = payload.direccion
        if payload.telefono is not None: sede_obj.telefono = payload.telefono
        
        await db.commit()

    @staticmethod
    async def delete_venue(venue_id: str, db: AsyncSession):
        sede = await db.execute(select(models.Sede).where(models.Sede.id == venue_id))
        sede_obj = sede.scalars().first()
        if not sede_obj:
            raise HTTPException(status_code=404, detail="Sede no encontrada")
        
        sede_obj.estado = "INACTIVA"
        await db.commit()

    @staticmethod
    async def get_venue_schedules(venue_id: str, db: AsyncSession):
        sched = await db.execute(select(models.SedeHorarioAtencion).where(models.SedeHorarioAtencion.sede_id == venue_id))
        regular = sched.scalars().all()
        
        exc = await db.execute(select(models.SedeExcepcionHorario).where(models.SedeExcepcionHorario.sede_id == venue_id))
        exceptions = exc.scalars().all()
        
        return {
            "regular": [
                {
                    "id": str(r.id),
                    "dia_semana": r.dia_semana,
                    "hora_apertura": r.hora_apertura.strftime("%H:%M") if r.hora_apertura else None,
                    "hora_cierre": r.hora_cierre.strftime("%H:%M") if r.hora_cierre else None
                } for r in regular
            ],
            "exceptions": [
                {
                    "id": str(e.id),
                    "fecha_excepcion": e.fecha_excepcion.isoformat(),
                    "estado_operativo": e.estado_operativo,
                    "hora_apertura": e.hora_apertura.strftime("%H:%M") if e.hora_apertura else None,
                    "hora_cierre": e.hora_cierre.strftime("%H:%M") if e.hora_cierre else None,
                    "descripcion": e.descripcion
                } for e in exceptions
            ]
        }

    @staticmethod
    async def set_venue_schedules(venue_id: str, payload: List[schemas.SedeHorarioAtencionCreate], db: AsyncSession):
        await db.execute(models.SedeHorarioAtencion.__table__.delete().where(models.SedeHorarioAtencion.sede_id == venue_id))
        
        for item in payload:
            new_sched = models.SedeHorarioAtencion(
                sede_id=venue_id,
                dia_semana=item.dia_semana,
                hora_apertura=item.hora_apertura,
                hora_cierre=item.hora_cierre
            )
            db.add(new_sched)
        
        await db.commit()

    @staticmethod
    async def create_venue_exception(venue_id: str, payload: schemas.SedeExcepcionCreate, db: AsyncSession):
        new_exc = models.SedeExcepcionHorario(
            sede_id=venue_id,
            fecha_excepcion=payload.fecha_excepcion,
            estado_operativo=payload.estado_operativo,
            hora_apertura=payload.hora_apertura,
            hora_cierre=payload.hora_cierre,
            descripcion=payload.descripcion
        )
        db.add(new_exc)
        await db.commit()
        await db.refresh(new_exc)
        return {"id": str(new_exc.id)}

    @staticmethod
    async def delete_venue_exception(venue_id: str, exception_id: str, db: AsyncSession):
        exc = await db.execute(select(models.SedeExcepcionHorario).where(models.SedeExcepcionHorario.id == exception_id, models.SedeExcepcionHorario.sede_id == venue_id))
        exc_obj = exc.scalars().first()
        if exc_obj:
            await db.execute(models.SedeExcepcionHorario.__table__.delete().where(models.SedeExcepcionHorario.id == exception_id))
            await db.commit()
