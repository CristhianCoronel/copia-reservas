from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.domains.auth import models, schemas
import uuid
import random
import string

router = APIRouter()
player_router = APIRouter()

def generate_codigo_referido(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

@router.post("/register", response_model=schemas.UsuarioResponse, status_code=status.HTTP_201_CREATED)
async def registrar_usuario(user_in: schemas.UsuarioCreate, db: AsyncSession = Depends(get_db)):

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
        # ::!todo!::Implementar hash de contraseña (Argon2/Bcrypt)
        password_hash=user_in.password,
        proveedor_auth=user_in.proveedor_auth,
        rol=user_in.rol,
        codigo_referido=generate_codigo_referido(),
        telefono=user_in.telefono
    )
    db.add(nuevo_usuario)
    await db.flush() # Para obtener el ID del usuario
    

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


from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.config import settings
from app.core.security import verify_password, create_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        email_or_username: str = payload.get("sub")
        if email_or_username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        

    result = await db.execute(
        select(models.Usuario)
        .options(selectinload(models.Usuario.persona))
        .where((models.Usuario.email == email_or_username) | (models.Usuario.username == email_or_username))
    )
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user


@router.post("/login", tags=["Auth & Identity"])
async def login(req: schemas.LoginRequest, db: AsyncSession = Depends(get_db)):
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
        "status": True,
        "data": {
            "token": access_token,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "username": user.username,
                "rol": user.rol
            }
        }
    }


@player_router.get("/profile/me/accounts", tags=["B2C - Player"])
async def get_my_accounts(current_user: models.Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Obtiene el perfil y las empresas/sedes a las que tiene acceso el jugador."""
    persona = current_user.persona
    

    from sqlalchemy import func
    
    result_referrals = await db.execute(
        select(func.count(models.Usuario.id)).where(models.Usuario.referido_por_usuario_id == current_user.id)
    )
    successful_referrals = result_referrals.scalar() or 0

    personal_data = {
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
    from app.domains.booking.models import Reserva, Cancha, PagoReserva, PartidaAbierta, PartidaAbiertaParticipante, Equipo, EquipoMiembro
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
                "venues": [
                    {
                        "id": str(sede.id),
                        "name": sede.nombre,
                        "address": sede.direccion
                    } for sede in sedes
                ]
            })
            
    return {
        "status": True,
        "data": {
            "personal": personal_data,
            "companies": companies_data,
            "isSuperAdmin": current_user.rol == "ADMIN"
        }
    }

@player_router.get("/reservations", tags=["B2C - Player"])
async def get_my_reservations(current_user: models.Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
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
    return {"status": True, "data": data}

@player_router.get("/social/groups", tags=["B2C - Player"])
async def get_social_groups(current_user: models.Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.domains.booking.models import PartidaAbierta, Reserva, Cancha
    from app.domains.b2b_core.models import Sede
    
    # Obtener partidas abiertas en estado de recaudación
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

@player_router.get("/teams", tags=["B2C - Player"])
async def get_my_teams(current_user: models.Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
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
    
    data = []
    for m in miembros:
        data.append({
            "id": str(m.equipo.id),
            "name": m.equipo.nombre,
            "sport": "Fútbol",
            "members": 1, # Simplificación
            "role": m.rol
        })
    return {"status": True, "data": data}

