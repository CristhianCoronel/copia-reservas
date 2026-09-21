from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from fastapi import HTTPException
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.config import settings
from app.core.responses import BaseResponse
from app.domains.auth import schemas, models
from app.domains.auth.services import AuthService, PlayerAuthService

router = APIRouter()
player_router = APIRouter()

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

@router.post("/register", response_model=BaseResponse[schemas.UsuarioResponse], status_code=status.HTTP_201_CREATED)
async def registrar_usuario(user_in: schemas.UsuarioCreate, db: AsyncSession = Depends(get_db)):
    nuevo_usuario = await AuthService.registrar_usuario(user_in, db)
    return BaseResponse(status=True, data=nuevo_usuario, message="Usuario registrado exitosamente")

@router.post("/login", tags=["Auth & Identity"], response_model=BaseResponse[dict])
async def login(req: schemas.LoginRequest, db: AsyncSession = Depends(get_db)):
    data = await AuthService.login(req, db)
    return BaseResponse(status=True, data=data, message="Login exitoso")

@player_router.get("/profile/me/accounts", tags=["B2C - Player"], response_model=BaseResponse[dict])
async def get_my_accounts(current_user: models.Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Obtiene el perfil y las empresas/sedes a las que tiene acceso el jugador."""
    data = await PlayerAuthService.get_my_accounts(current_user, db)
    return BaseResponse(status=True, data=data, message="Cuentas obtenidas correctamente")

@player_router.get("/reservations", tags=["B2C - Player"], response_model=BaseResponse[list])
async def get_my_reservations(current_user: models.Usuario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    data = await PlayerAuthService.get_my_reservations(current_user, db)
    return BaseResponse(status=True, data=data, message="Reservas obtenidas correctamente")

@router.get("/dev/users", tags=["Dev - Tools"], response_model=BaseResponse[list])
async def get_dev_users(db: AsyncSession = Depends(get_db)):
    # Dev only endpoint to list users for quick switching
    result = await db.execute(
        select(models.Usuario, models.Persona)
        .join(models.Persona, models.Usuario.id == models.Persona.usuario_id, isouter=True)
    )
    rows = result.all()
    
    data = []
    for u, p in rows:
        data.append({
            "id": str(u.id),
            "username": u.username,
            "role": u.rol,
            "name": f"{p.nombres} {p.apellidos}" if p else u.username
        })
    return BaseResponse(status=True, data=data, message="Usuarios de desarrollo")
