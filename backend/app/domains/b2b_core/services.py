from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from app.domains.b2b_core import models, schemas
from app.domains.auth.models import Persona, Usuario
from app.domains.booking.models import Cancha, Reserva
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

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
    async def get_company_details(company_id: str, db: AsyncSession):
        result = await db.execute(select(models.Empresa).where(models.Empresa.id == company_id))
        emp = result.scalars().first()
        if not emp:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")

        sub_res = await db.execute(
            select(models.SuscripcionEmpresa, models.PlanSuscripcion)
            .join(models.PlanSuscripcion, models.SuscripcionEmpresa.plan_id == models.PlanSuscripcion.id)
            .where(models.SuscripcionEmpresa.empresa_id == company_id, models.SuscripcionEmpresa.estado == 'ACTIVA')
        )
        sub_row = sub_res.first()
        
        is_premium = False
        plan_nombre = "Freemium"
        if sub_row:
            sub, plan = sub_row
            plan_nombre = plan.nombre
            if plan.precio_mensual and plan.precio_mensual > 0 or "Premium" in plan.nombre:
                is_premium = True

        return {
            "id": str(emp.id),
            "ruc": emp.ruc,
            "razon_social": emp.razon_social,
            "nombre_comercial": emp.nombre_comercial,
            "es_sede_unica": emp.es_sede_unica,
            "terminos_condiciones": emp.terminos_condiciones or "",
            "politica_cancelacion": emp.politica_cancelacion or "",
            "telefono_contacto": emp.telefono_contacto,
            "email_contacto": emp.email_contacto,
            "logo_url": emp.logo_url,
            "is_premium": is_premium,
            "plan_nombre": plan_nombre
        }

    @staticmethod
    async def update_company(company_id: str, payload: schemas.EmpresaUpdate, db: AsyncSession):
        result = await db.execute(select(models.Empresa).where(models.Empresa.id == company_id))
        emp = result.scalars().first()
        if not emp:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")

        if payload.nombre_comercial is not None: emp.nombre_comercial = payload.nombre_comercial
        if payload.es_sede_unica is not None: emp.es_sede_unica = payload.es_sede_unica
        if payload.terminos_condiciones is not None: emp.terminos_condiciones = payload.terminos_condiciones
        if payload.politica_cancelacion is not None: emp.politica_cancelacion = payload.politica_cancelacion
        if payload.telefono_contacto is not None: emp.telefono_contacto = payload.telefono_contacto
        if payload.email_contacto is not None: emp.email_contacto = payload.email_contacto

        await db.commit()
        return {"id": str(emp.id)}

    @staticmethod
    async def get_venue_details(venue_id: str, db: AsyncSession):
        sede = await db.execute(select(models.Sede).where(models.Sede.id == venue_id))
        sede_obj = sede.scalars().first()
        if not sede_obj:
            raise HTTPException(status_code=404, detail="Sede no encontrada")

        return {
            "id": str(sede_obj.id),
            "empresa_id": str(sede_obj.empresa_id),
            "nombre": sede_obj.nombre,
            "direccion": sede_obj.direccion,
            "referencia": sede_obj.referencia or "",
            "telefono": sede_obj.telefono,
            "email": sede_obj.email or "",
            "maps_url": sede_obj.maps_url or "",
            "horas_limite_cancelacion": sede_obj.horas_limite_cancelacion,
            "max_horas_reserva_continua": sede_obj.max_horas_reserva_continua,
            "reserva_minutos_espera": sede_obj.reserva_minutos_espera,
            "tipo_adelanto_requerido": sede_obj.tipo_adelanto_requerido,
            "valor_adelanto_requerido": float(sede_obj.valor_adelanto_requerido or 0.0)
        }

    @staticmethod
    async def update_venue(venue_id: str, payload: schemas.SedeUpdate, db: AsyncSession):
        sede = await db.execute(select(models.Sede).where(models.Sede.id == venue_id))
        sede_obj = sede.scalars().first()
        if not sede_obj:
            raise HTTPException(status_code=404, detail="Sede no encontrada")
        
        if payload.nombre is not None: sede_obj.nombre = payload.nombre
        if payload.direccion is not None: sede_obj.direccion = payload.direccion
        if payload.referencia is not None: sede_obj.referencia = payload.referencia
        if payload.telefono is not None: sede_obj.telefono = payload.telefono
        if payload.email is not None: sede_obj.email = payload.email
        if payload.maps_url is not None: sede_obj.maps_url = payload.maps_url
        if payload.horas_limite_cancelacion is not None: sede_obj.horas_limite_cancelacion = payload.horas_limite_cancelacion
        if payload.max_horas_reserva_continua is not None: sede_obj.max_horas_reserva_continua = payload.max_horas_reserva_continua
        if payload.reserva_minutos_espera is not None: sede_obj.reserva_minutos_espera = payload.reserva_minutos_espera
        if payload.tipo_adelanto_requerido is not None: sede_obj.tipo_adelanto_requerido = payload.tipo_adelanto_requerido
        if payload.valor_adelanto_requerido is not None: sede_obj.valor_adelanto_requerido = payload.valor_adelanto_requerido
        
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
    async def get_venue_services(venue_id: str, db: AsyncSession):
        from app.domains.booking.models import Servicio
        query = (
            select(models.SedeServicio, Servicio)
            .join(Servicio, models.SedeServicio._servicio_id == Servicio.id)
            .where(models.SedeServicio.sede_id == venue_id)
        )
        result = await db.execute(query)
        rows = result.all()
        
        return [
            {
                "id": str(ss.id),
                "servicio_id": str(s.id),
                "nombre": s.nombre,
                "icono": s.icono,
                "categoria": s.categoria,
                "es_gratuito": ss.es_gratuito,
                "costo_adicional": float(ss.costo_adicional or 0.0),
                "descripcion": ss.descripcion or ""
            } for ss, s in rows
        ]

    @staticmethod
    async def add_venue_service(venue_id: str, payload: schemas.SedeServicioLink, db: AsyncSession):
        exist = await db.execute(
            select(models.SedeServicio).where(
                models.SedeServicio.sede_id == venue_id,
                models.SedeServicio._servicio_id == payload.servicio_id
            )
        )
        if exist.scalars().first():
            raise HTTPException(status_code=400, detail="Este servicio ya está asignado a la sede")

        nuevo_ss = models.SedeServicio(
            sede_id=venue_id,
            _servicio_id=payload.servicio_id,
            es_gratuito=payload.es_gratuito,
            costo_adicional=payload.costo_adicional,
            descripcion=payload.descripcion
        )
        db.add(nuevo_ss)
        await db.commit()
        await db.refresh(nuevo_ss)
        return {"id": str(nuevo_ss.id)}

    @staticmethod
    async def remove_venue_service(venue_id: str, service_id_or_link_id: str, db: AsyncSession):
        from sqlalchemy import or_
        await db.execute(
            models.SedeServicio.__table__.delete().where(
                models.SedeServicio.sede_id == venue_id,
                or_(
                    models.SedeServicio.id == service_id_or_link_id,
                    models.SedeServicio._servicio_id == service_id_or_link_id
                )
            )
        )
        await db.commit()

    @staticmethod
    async def get_venue_staff(company_id: str, venue_id: str, db: AsyncSession):
        from sqlalchemy import or_
        query = (
            select(models.Contrato, Persona, Usuario)
            .join(Persona, models.Contrato.persona_id == Persona.id)
            .join(Usuario, Persona.usuario_id == Usuario.id)
            .where(
                models.Contrato.empresa_id == company_id,
                models.Contrato.is_active == True,
                or_(models.Contrato.sede_id == venue_id, models.Contrato.sede_id == None)
            )
        )
        result = await db.execute(query)
        rows = result.all()
        
        return [
            {
                "id": str(c.id),
                "persona_id": str(p.id),
                "username": u.username,
                "nombres": p.nombres,
                "apellidos": p.apellidos,
                "fullName": f"{p.nombres} {p.apellidos}",
                "rol": c.rol,
                "sede_id": str(c.sede_id) if c.sede_id else None,
                "is_global": c.sede_id is None
            } for c, p, u in rows
        ]

    @staticmethod
    async def add_venue_staff(company_id: str, venue_id: Optional[str], username: str, rol: str, current_user: Usuario, db: AsyncSession):
        user_res = await db.execute(
            select(Usuario).options(selectinload(Usuario.persona)).where(Usuario.username == username)
        )
        target_user = user_res.scalars().first()
        if not target_user or not target_user.persona:
            raise HTTPException(status_code=404, detail="Usuario no encontrado con ese username")

        # Check existing active contract
        from sqlalchemy import or_
        exist = await db.execute(
            select(models.Contrato).where(
                models.Contrato.empresa_id == company_id,
                models.Contrato.persona_id == target_user.persona.id,
                models.Contrato.is_active == True,
                or_(models.Contrato.sede_id == venue_id, models.Contrato.sede_id == None)
            )
        )
        if exist.scalars().first():
            raise HTTPException(status_code=400, detail="El usuario ya cuenta con un contrato activo para esta sede o empresa")

        grantor_id = current_user.persona.id if current_user.persona else current_user.id
        nuevo_contrato = models.Contrato(
            empresa_id=company_id,
            sede_id=venue_id if venue_id else None,
            persona_id=target_user.persona.id,
            rol=rol,
            otorgado_por=grantor_id,
            fecha_inicio=datetime.now().date(),
            is_active=True
        )
        db.add(nuevo_contrato)
        await db.commit()
        await db.refresh(nuevo_contrato)
        return {
            "id": str(nuevo_contrato.id),
            "username": target_user.username,
            "fullName": f"{target_user.persona.nombres} {target_user.persona.apellidos}",
            "rol": nuevo_contrato.rol
        }

    @staticmethod
    async def remove_staff_contract(contract_id: str, db: AsyncSession):
        contract = await db.execute(select(models.Contrato).where(models.Contrato.id == contract_id))
        c_obj = contract.scalars().first()
        if not c_obj:
            raise HTTPException(status_code=404, detail="Contrato no encontrado")
        c_obj.is_active = False
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

