from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.domains.auth import models, schemas
from app.core.security import get_password_hash, verify_password, create_access_token
import random
import string

def generate_codigo_referido(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

class AuthService:
    @staticmethod
    async def registrar_usuario(user_in: schemas.UsuarioCreate, db: AsyncSession):
        result = await db.execute(
            select(models.Usuario).where(
                (models.Usuario.email == user_in.email) | (models.Usuario.username == user_in.username)
            )
        )
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="El email o username ya está registrado.")
        
        nuevo_usuario = models.Usuario(
            email=user_in.email,
            username=user_in.username,
            password_hash=get_password_hash(user_in.password),
            proveedor_auth=user_in.proveedor_auth,
            rol=user_in.rol,
            codigo_referido=generate_codigo_referido(),
            telefono=user_in.telefono
        )
        db.add(nuevo_usuario)
        await db.flush()
        
        nueva_persona = models.Persona(
            usuario_id=nuevo_usuario.id,
            nombres=user_in.persona.nombres,
            apellidos=user_in.persona.apellidos,
            tipo_documento=user_in.persona.tipo_documento,
            numero_documento=user_in.persona.numero_documento
        )
        db.add(nueva_persona)
        await db.commit()
        await db.refresh(nuevo_usuario, ['persona'])
        return nuevo_usuario

    @staticmethod
    async def login(req: schemas.LoginRequest, db: AsyncSession):
        result = await db.execute(
            select(models.Usuario).where(
                (models.Usuario.email == req.email) | (models.Usuario.username == req.email)
            )
        )
        user = result.scalars().first()
        
        if not user or not verify_password(req.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales incorrectas"
            )
            
        access_token = create_access_token(subject=user.email)
        return {
            "token": access_token,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "username": user.username,
                "rol": user.rol
            }
        }

class PlayerAuthService:
    @staticmethod
    async def get_my_accounts(current_user: models.Usuario, db: AsyncSession):
        persona = current_user.persona
        from sqlalchemy import func
        
        result_referrals = await db.execute(
            select(func.count(models.Usuario.id)).where(models.Usuario.referido_por_usuario_id == current_user.id)
        )
        successful_referrals = result_referrals.scalar() or 0

        personal_data = {
            "id": str(persona.id) if persona else str(current_user.id),
            "fullName": f"{persona.nombres} {persona.apellidos}" if persona else current_user.username,
            "document": persona.numero_documento if persona else "",
            "role": current_user.rol,
            "avatar": "".join([part[0] for part in (f"{persona.nombres} {persona.apellidos}" if persona else current_user.username).split()[:2]]).upper(),
            "username": current_user.username,
            "email": current_user.email,
            "phone": current_user.telefono,
            "referral": {
                "code": current_user.codigo_referido,
                "successfulReferrals": successful_referrals,
                "totalEarned": successful_referrals * 15.0
            }
        }

        from app.domains.b2b_core.models import Empresa, Contrato, Sede
        from sqlalchemy import or_

        companies_data = []
        if persona:
            result_empresas = await db.execute(
                select(Empresa)
                .outerjoin(Contrato, Contrato.empresa_id == Empresa.id)
                .where(
                    or_(
                        Empresa.creada_por_persona_id == persona.id,
                        Contrato.persona_id == persona.id
                    )
                )
                .group_by(Empresa.id)
            )
            empresas = result_empresas.scalars().all()
            
            for emp in empresas:
                result_sedes = await db.execute(
                    select(Sede).where(Sede.empresa_id == emp.id)
                )
                sedes = result_sedes.scalars().all()
                companies_data.append({
                    "id": str(emp.id),
                    "name": emp.razon_social,
                    "commercialName": emp.nombre_comercial,
                    "isSingleVenue": emp.es_sede_unica,
                    "venues": [
                        {"id": str(sede.id), "name": sede.nombre, "address": sede.direccion} for sede in sedes
                    ]
                })
                
        return {
            "personal": personal_data,
            "companies": companies_data,
            "isSuperAdmin": current_user.rol == "ADMIN"
        }

    @staticmethod
    async def get_my_reservations(current_user: models.Usuario, db: AsyncSession):
        from app.domains.booking.models import Reserva, Cancha, PagoReserva
        from app.domains.b2b_core.models import Sede
        persona_id = current_user.persona.id
        query = (
            select(Reserva)
            .join(Cancha, Reserva.cancha_id == Cancha.id)
            .join(Sede, Cancha.sede_id == Sede.id)
            .options(
                selectinload(Reserva.cancha).selectinload(Cancha.sede), 
                selectinload(Reserva.pagos).selectinload(PagoReserva.persona)
            )
            .where(Reserva.persona_organizadora_id == persona_id)
            .order_by(Reserva.fecha_reserva.desc(), Reserva.hora_inicio.desc())
        )
        result = await db.execute(query)
        reservas = result.scalars().all()
        
        data = []
        for r in reservas:
            pagos = []
            for p in r.pagos:
                pagos.append({
                    "id": str(p.id),
                    "amount": float(p.monto),
                    "status": p.estado,
                    "user": f"{p.persona.nombres} {p.persona.apellidos}" if p.persona else "Participante",
                    "avatar": "ME" if p.persona_id == persona_id else "".join([part[0] for part in f"{p.persona.nombres} {p.persona.apellidos}".split()[:2]]).upper() if p.persona else "OT"
                })
                
            data.append({
                "id": str(r.id),
                "courtName": r.cancha.nombre,
                "venueName": r.cancha.sede.nombre,
                "date": r.fecha_reserva.strftime("%Y-%m-%d"),
                "time": f"{r.hora_inicio.strftime('%H:%M')} - {r.hora_fin.strftime('%H:%M')}",
                "status": r.estado,
                "totalPrice": float(r.precio_total_cancha),
                "pendingAmount": float(r._saldo_pendiente),
                "payments": pagos
            })
        return data
