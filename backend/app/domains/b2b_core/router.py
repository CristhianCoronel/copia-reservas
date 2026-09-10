from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.domains.b2b_core import models, schemas
import uuid

router = APIRouter()

def generate_share_token(prefix="emp"):
    return f"{prefix}-{uuid.uuid4().hex[:8]}"

@router.post("/empresas", response_model=schemas.EmpresaResponse, status_code=status.HTTP_201_CREATED)
async def registrar_empresa(empresa_in: schemas.EmpresaCreate, db: AsyncSession = Depends(get_db)):

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
        fecha_inicio=nueva_empresa.created_at.date() if nueva_empresa.created_at else None # Se autogenerará
    )
    db.add(nuevo_contrato)
    
    await db.commit()
    await db.refresh(nueva_empresa)
    return nueva_empresa


@router.get("/system/companies/pending", tags=["System - SuperAdmin"])
async def get_pending_companies(db: AsyncSession = Depends(get_db)):
    """Obtiene la lista de empresas pendientes de validación/aprobación por sistema."""
    query = select(models.Empresa).where(models.Empresa.estado_aprobacion == 'PENDIENTE')
    result = await db.execute(query)
    empresas = result.scalars().all()
    
    data = []
    for e in empresas:
        data.append({
            "id": str(e.id),
            "companyName": e.razon_social,
            "contactName": e.contacto_legal if e.contacto_legal else "Sin Nombre",
            "phone": e.telefono_contacto,
            "document": e.ruc
        })
        
    return {"data": data}
