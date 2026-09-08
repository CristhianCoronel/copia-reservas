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

def generate_codigo_referido(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

@router.post("/register", response_model=schemas.UsuarioResponse, status_code=status.HTTP_201_CREATED)
async def registrar_usuario(user_in: schemas.UsuarioCreate, db: AsyncSession = Depends(get_db)):
    # 1. Verificar si el email o username ya existe
    result = await db.execute(
        select(models.Usuario).where(
            (models.Usuario.email == user_in.email) | (models.Usuario.username == user_in.username)
        )
    )
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="El email o username ya está registrado.")
    
    # 2. Crear Usuario
    nuevo_usuario = models.Usuario(
        email=user_in.email,
        username=user_in.username,
        # TODO: Implementar hash de contraseña (Argon2/Bcrypt)
        password_hash=user_in.password,
        proveedor_auth=user_in.proveedor_auth,
        rol=user_in.rol,
        codigo_referido=generate_codigo_referido(),
        telefono=user_in.telefono
    )
    db.add(nuevo_usuario)
    await db.flush() # Para obtener el ID del usuario
    
    # 3. Crear Persona vinculada
    nueva_persona = models.Persona(
        usuario_id=nuevo_usuario.id,
        nombres=user_in.persona.nombres,
        apellidos=user_in.persona.apellidos,
        tipo_documento=user_in.persona.tipo_documento,
        numero_documento=user_in.persona.numero_documento
    )
    db.add(nueva_persona)
    await db.commit()
    
    # Recargar con relaciones
    await db.refresh(nuevo_usuario, ['persona'])
    return nuevo_usuario
