from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, or_
from app.core.database import get_db
from app.domains.booking import models, schemas
from app.domains.auth.router import get_current_user
import uuid

router = APIRouter()

def generate_reserva_token():
    return f"rsv-{uuid.uuid4().hex[:8]}"

@router.post("/b2c/reservas", response_model=schemas.ReservaResponse, status_code=status.HTTP_201_CREATED)
async def crear_reserva(res_in: schemas.ReservaCreate, db: AsyncSession = Depends(get_db)):

    overlapping_query = select(models.Reserva).where(
        and_(
            models.Reserva.cancha_id == res_in.cancha_id,
            models.Reserva.fecha_reserva == res_in.fecha_reserva,
            models.Reserva.estado.in_(['PENDIENTE_PAGO', 'CONFIRMADA']),

            models.Reserva.hora_inicio < res_in.hora_fin_solicitada,
            models.Reserva.hora_fin > res_in.hora_inicio_solicitada
        )
    )
    
    result = await db.execute(overlapping_query)
    conflicto = result.scalars().first()
    
    if conflicto:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La cancha ya no está disponible en el horario seleccionado."
        )


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
        _saldo_pendiente=res_in.monto_total_final, # Inicialmente debe todo
        estado="PENDIENTE_PAGO"
    )
    
    db.add(nueva_reserva)
    await db.commit()
    await db.refresh(nueva_reserva)
    
    return nueva_reserva


from sqlalchemy.orm import selectinload
from sqlalchemy import func
from datetime import datetime, time

@router.get("/b2c/canchas", tags=["B2C - Booking"])
async def listar_canchas(date: str = None, db: AsyncSession = Depends(get_db)):
    """Obtiene la lista de canchas activas con información de su sede y empresa."""
    from app.domains.b2b_core.models import Sede, Empresa
    
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
    result = await db.execute(query)
    canchas = result.scalars().all()
    
    data = []
    for c in canchas:
        data.append({
            "id": str(c.id),
            "name": c.nombre,
            "sport": "Fútbol" if c._deporte_id else "Deporte",
            "isCovered": False, # TODO: Agregar a modelo
            "address": c.sede.direccion if c.sede else "",
            "distanceKm": 1.2, # TODO: Calcular según geoloc
            "companyName": c.sede.empresa.nombre_comercial if c.sede and c.sede.empresa else "Empresa",
            "regularPrice": 50.0, # TODO: Agregar a modelo
            "peakPrice": 80.0,
            "services": ["Estacionamiento", "Baños"] if c.caracteristicas else [],
            "rules": (c.sede.empresa.politica_cancelacion or "") if (c.sede and c.sede.empresa) else "",
            "images": [f.foto_url for f in sorted(c.fotos, key=lambda x: x.orden)] if c.fotos else []
        })
        
    return {"data": data}


@router.get("/business/courts/{court_id}/availability", tags=["B2B - Business"])
async def get_court_availability(court_id: str, date: str, db: AsyncSession = Depends(get_db)):
    """Calcula disponibilidad basada en las reservas existentes en la BD para esa cancha y fecha."""
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
    result = await db.execute(query)
    reservas = result.scalars().all()
    
    # ::!todo!::Generar slots de 16:00 a 23:00 como default (esto luego vendría del horario de la sede)
    slots = []
    for hora in range(16, 23):
        hora_str_inicio = f"{hora}:00:00"
        hora_str_fin = f"{hora+1}:00:00"
        
        is_peak = hora >= 18
        regular_price = 50.0
        peak_price = 90.0
        

        available = True
        for r in reservas:
            r_hora_inicio = r.hora_inicio.hour
            r_hora_fin = r.hora_fin.hour
            if r_hora_inicio <= hora and r_hora_fin > hora:
                available = False
                break
                
        slots.append({
            "time": f"{hora}:00 - {hora+1}:00",
            "isPeak": is_peak,
            "price": peak_price if is_peak else regular_price,
            "available": available
        })
    return {"data": slots}

from pydantic import BaseModel
from typing import List

class CourtPayload(BaseModel):
    name: str
    sport: str
    modalities: List[str]

class SolapamientosPayload(BaseModel):
    blocked_court_ids: List[str]

@router.get("/business/venues/{venue_id}/courts", tags=["B2B - Business"])
async def get_venue_courts(venue_id: str, db: AsyncSession = Depends(get_db)):
    query = select(models.Cancha).options(
        selectinload(models.Cancha.solapamientos_principales)
    ).where(and_(models.Cancha.sede_id == venue_id, models.Cancha.is_active == True))
    
    result = await db.execute(query)
    canchas = result.scalars().all()
    
    data = []
    for c in canchas:
        data.append({
            "id": str(c.id),
            "name": c.nombre,
            "sport": "Fútbol", # Mock, real name needs join
            "modalities": c.modalidades if c.modalidades else ["Fútbol 5"],
            "basePrice": 60.0, # Mock
            "blocked_court_ids": [str(s.cancha_bloqueada_id) for s in c.solapamientos_principales]
        })
    return {"data": data}

@router.post("/business/venues/{venue_id}/courts", tags=["B2B - Business"])
async def create_venue_court(venue_id: str, payload: CourtPayload, db: AsyncSession = Depends(get_db)):
    # Mock hardcoded sport ID
    nueva_cancha = models.Cancha(
        sede_id=venue_id,
        nombre=payload.name,
        _deporte_id="00000000-0000-0000-0000-000000000000",
        modalidades=payload.modalities,
        is_active=True
    )
    db.add(nueva_cancha)
    await db.commit()
    await db.refresh(nueva_cancha)
    return {
        "id": str(nueva_cancha.id),
        "name": nueva_cancha.nombre,
        "sport": payload.sport,
        "modalities": nueva_cancha.modalidades,
        "basePrice": 60.0,
        "blocked_court_ids": []
    }

@router.put("/business/courts/{court_id}/solapamientos", tags=["B2B - Business"])
async def update_court_solapamientos(court_id: str, payload: SolapamientosPayload, db: AsyncSession = Depends(get_db)):
    # Delete existing
    await db.execute(models.CanchaSolapamiento.__table__.delete().where(
        models.CanchaSolapamiento.cancha_principal_id == court_id
    ))
    
    # Insert new
    for b_id in payload.blocked_court_ids:
        solap = models.CanchaSolapamiento(
            cancha_principal_id=court_id,
            cancha_bloqueada_id=b_id
        )
        db.add(solap)
        
    await db.commit()
    return {"status": True}

from typing import Optional

class IntervalPayload(BaseModel):
    hora_inicio: str # "16:00"
    hora_fin: str # "17:00"
    precio: float

class SchedulePayload(BaseModel):
    date: str
    intervals: List[IntervalPayload]

class BlockPayload(BaseModel):
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    motivo: str
    descripcion: Optional[str] = None

@router.get("/business/courts/{court_id}/schedule", tags=["B2B - Business"])
async def get_court_schedule(court_id: str, date: str, db: AsyncSession = Depends(get_db)):
    """Retorna horarios, tarifas base, bloqueos y reservas de la fecha especificada."""
    try:
        fecha_obj = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido")
    
    dia_semana = fecha_obj.weekday() # Lunes=0, Domingo=6
    
    cancha = await db.execute(select(models.Cancha).options(selectinload(models.Cancha.sede)).where(models.Cancha.id == court_id))
    cancha = cancha.scalars().first()
    if not cancha:
        raise HTTPException(status_code=404, detail="Cancha no encontrada")
        
    from app.domains.b2b_core.models import SedeHorarioAtencion
    horario_sede = await db.execute(select(SedeHorarioAtencion).where(
        SedeHorarioAtencion.sede_id == cancha.sede_id,
        SedeHorarioAtencion.dia_semana == dia_semana
    ))
    horario_sede = horario_sede.scalars().first()
    
    hora_apertura = horario_sede.hora_apertura if horario_sede else time(16, 0)
    hora_cierre = horario_sede.hora_cierre if horario_sede else time(23, 0)
    
    tarifas_base = await db.execute(select(models.CanchaHorario).where(
        models.CanchaHorario.cancha_id == court_id,
        models.CanchaHorario.dia_semana == dia_semana,
        models.CanchaHorario.is_active == True
    ))
    tarifas_base = tarifas_base.scalars().all()
    
    
    fecha_inicio_dia = datetime.combine(fecha_obj, time.min)
    fecha_fin_dia = datetime.combine(fecha_obj, time.max)
    
    bloqueos = await db.execute(select(models.CanchaBloqueo).where(
        models.CanchaBloqueo.cancha_id == court_id,
        models.CanchaBloqueo.fecha_hora_inicio >= fecha_inicio_dia,
        models.CanchaBloqueo.fecha_hora_fin <= fecha_fin_dia
    ))
    bloqueos = bloqueos.scalars().all()
    
    from app.domains.auth.models import Persona, Usuario
    
    query = (
        select(models.Reserva, Persona.nombres, Persona.apellidos, Usuario.telefono)
        .join(Persona, models.Reserva.persona_organizadora_id == Persona.id)
        .join(Usuario, Persona.usuario_id == Usuario.id)
        .where(
            models.Reserva.cancha_id == court_id,
            models.Reserva.fecha_reserva == fecha_obj,
            models.Reserva.estado.in_(['PENDIENTE_PAGO', 'CONFIRMADA', 'OCUPADO'])
        )
    )
    result = await db.execute(query)
    reservas_data = result.all()

    return {
        "status": True,
        "data": {
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
    }

@router.post("/business/courts/{court_id}/schedule", tags=["B2B - Business"])
async def save_court_schedule(court_id: str, payload: SchedulePayload, db: AsyncSession = Depends(get_db)):
    try:
        fecha_obj = datetime.strptime(payload.date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido")
        
    dia_semana = fecha_obj.weekday()
    
    await db.execute(models.CanchaHorario.__table__.delete().where(
        models.CanchaHorario.cancha_id == court_id,
        models.CanchaHorario.dia_semana == dia_semana
    ))
    
    for interval in payload.intervals:
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
    return {"status": True}

@router.post("/business/courts/{court_id}/blocks", tags=["B2B - Business"])
async def create_court_block(court_id: str, payload: BlockPayload, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
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
    return {"status": True, "data": {"id": str(b.id)}}

@router.get("/social/groups", tags=["B2C - Social"])
async def get_social_groups():
    return {"data": []}

@router.get("/business/venues/{venue_id}/reservations/pending", tags=["B2B - Business"])
async def get_pending_reservations(venue_id: str, db: AsyncSession = Depends(get_db)):
    from app.domains.auth.models import Persona, Usuario
    
    query = (
        select(
            models.Reserva, 
            Persona.nombres, 
            Persona.apellidos, 
            Usuario.telefono, 
            models.Cancha.nombre.label('cancha_nombre'),
            models.PagoReserva.monto,
            models.PagoReserva.metodo_pago
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
    result = await db.execute(query)
    rows = result.all()
    
    data = []
    res_dict = {}
    for r, nombres, apellidos, telefono, cancha_nombre, monto, metodo_pago in rows:
        if str(r.id) not in res_dict:
            res_dict[str(r.id)] = {
                "id": str(r.id),
                "userName": f"{nombres} {apellidos}",
                "phone": telefono or "",
                "courtName": cancha_nombre,
                "date": "Hoy",
                "time": r.hora_inicio.strftime("%H:%M"),
                "amount": float(monto) if monto else float(r._saldo_pendiente),
                "paymentMethod": metodo_pago or "Desconocido"
            }
            
    return {"data": list(res_dict.values())}

@router.get("/business/companies/{company_id}/reservations/pending", tags=["B2B - Business"])
async def get_company_pending_reservations(company_id: str, db: AsyncSession = Depends(get_db)):
    from app.domains.auth.models import Persona, Usuario
    from app.domains.b2b_core.models import Sede
    
    query = (
        select(
            models.Reserva, 
            Persona.nombres, 
            Persona.apellidos, 
            Usuario.telefono, 
            models.Cancha.nombre.label('cancha_nombre'),
            Sede.nombre.label('sede_nombre'),
            models.PagoReserva.monto,
            models.PagoReserva.metodo_pago
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
    result = await db.execute(query)
    rows = result.all()
    
    data = []
    res_dict = {}
    for r, nombres, apellidos, telefono, cancha_nombre, sede_nombre, monto, metodo_pago in rows:
        if str(r.id) not in res_dict:
            res_dict[str(r.id)] = {
                "id": str(r.id),
                "userName": f"{nombres} {apellidos}",
                "phone": telefono or "",
                "courtName": f"{cancha_nombre} ({sede_nombre})",
                "date": "Hoy",
                "time": r.hora_inicio.strftime("%H:%M"),
                "amount": float(monto) if monto else float(r._saldo_pendiente),
                "paymentMethod": metodo_pago or "Desconocido"
            }
            
    return {"data": list(res_dict.values())}

@router.get("/business/companies/{company_id}/courts-summary", tags=["B2B - Business"])
async def get_company_courts_summary(company_id: str, db: AsyncSession = Depends(get_db)):
    from app.domains.b2b_core.models import Sede
    from sqlalchemy import func
    
    query_canchas = (
        select(models.Cancha, Sede)
        .join(Sede, models.Cancha.sede_id == Sede.id)
        .where(Sede.empresa_id == company_id, models.Cancha.is_active == True)
    )
    result = await db.execute(query_canchas)
    canchas_sedes = result.all()
    
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
    res_pendientes = await db.execute(query_pendientes)
    pendientes_dict = {str(row[0]): row[1] for row in res_pendientes.all()}
    
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
        
    return {"status": True, "data": list(sedes_dict.values())}

@router.put("/business/reservations/{reserva_id}/approve", tags=["B2B - Business"])
async def approve_reservation(reserva_id: str, db: AsyncSession = Depends(get_db)):
    reserva = await db.execute(select(models.Reserva).where(models.Reserva.id == reserva_id))
    reserva = reserva.scalars().first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
        
    reserva.estado = "CONFIRMADA"
    reserva._saldo_pendiente = 0
    
    pagos = await db.execute(select(models.PagoReserva).where(models.PagoReserva.reserva_id == reserva_id))
    for pago in pagos.scalars().all():
        if pago.estado == "PENDIENTE":
            pago.estado = "APROBADO"
            
    await db.commit()
    return {"status": True}

@router.put("/business/reservations/{reserva_id}/cancel", tags=["B2B - Business"])
async def cancel_reservation(reserva_id: str, db: AsyncSession = Depends(get_db)):
    reserva = await db.execute(select(models.Reserva).where(models.Reserva.id == reserva_id))
    reserva = reserva.scalars().first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
        
    reserva.estado = "CANCELADA"
    
    pagos = await db.execute(select(models.PagoReserva).where(models.PagoReserva.reserva_id == reserva_id))
    for pago in pagos.scalars().all():
        if pago.estado == "PENDIENTE":
            pago.estado = "RECHAZADO"
            
    await db.commit()
    return {"status": True}

class ManualReservaPayload(BaseModel):
    userName: str
    phone: Optional[str] = None
    alreadyPaid: bool
    time: str

@router.post("/business/courts/{court_id}/reservations", tags=["B2B - Business"])
async def create_manual_reservation(
    court_id: str, 
    payload: ManualReservaPayload, 
    date: str,
    current_user = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    try:
        fecha_obj = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido")

    hora_inicio_sol = datetime.strptime(payload.time, "%H:%M").time()
    # Asumimos 1 hora para reservas manuales
    hora_fin_sol = time((hora_inicio_sol.hour + 1) % 24, hora_inicio_sol.minute)

    persona_id = current_user.persona.id if current_user.persona else current_user.id
    
    # Check if a Persona exists, otherwise use a placeholder
    # For manual, we will just associate with the receptionist persona
    
    nueva_reserva = models.Reserva(
        share_token=generate_reserva_token(),
        cancha_id=court_id,
        tipo_origen="MANUAL",
        persona_organizadora_id=persona_id, # Recepcionista
        fecha_reserva=fecha_obj,
        hora_inicio_solicitada=hora_inicio_sol,
        hora_fin_solicitada=hora_fin_sol,
        hora_inicio=hora_inicio_sol,
        hora_fin=hora_fin_sol,
        duracion_horas=1.0,
        precio_hora_historico=0.0, # Puede llenarse con tarifa
        precio_total_cancha=0.0,
        monto_total_final=0.0,
        _saldo_pendiente=0.0 if payload.alreadyPaid else 0.0, 
        estado="CONFIRMADA" if payload.alreadyPaid else "PENDIENTE_PAGO"
    )
    db.add(nueva_reserva)
    await db.commit()
    return {"status": True}

@router.get("/system/catalogs", tags=["System - SuperAdmin"])
async def get_system_catalogs(db: AsyncSession = Depends(get_db)):
    """Obtiene los catálogos del sistema: deportes y servicios."""
    deportes_result = await db.execute(select(models.Deporte))
    servicios_result = await db.execute(select(models.Servicio))
    
    deportes = deportes_result.scalars().all()
    servicios = servicios_result.scalars().all()
    
    return {"status": True, "data": {
        "sports": [{"id": str(d.id), "name": d.nombre, "is_active": d.is_active} for d in deportes],
        "services": [{"id": str(s.id), "name": s.nombre, "icon": s.icono, "category": s.categoria} for s in servicios]
    }}

# --- CRUD Deportes ---
from pydantic import BaseModel
from typing import Optional

class DeportePayload(BaseModel):
    nombre: str
    is_active: bool = True

class ServicioPayload(BaseModel):
    nombre: str
    icono: Optional[str] = None
    categoria: Optional[str] = None

@router.post("/system/catalogs/deportes", tags=["System - SuperAdmin"])
async def create_deporte(payload: DeportePayload, db: AsyncSession = Depends(get_db)):
    nuevo = models.Deporte(nombre=payload.nombre, is_active=payload.is_active)
    db.add(nuevo)
    await db.commit()
    await db.refresh(nuevo)
    return {"status": True, "data": {"id": str(nuevo.id), "name": nuevo.nombre, "is_active": nuevo.is_active}}

@router.put("/system/catalogs/deportes/{deporte_id}", tags=["System - SuperAdmin"])
async def update_deporte(deporte_id: str, payload: DeportePayload, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Deporte).where(models.Deporte.id == deporte_id))
    deporte = result.scalars().first()
    if not deporte:
        raise HTTPException(status_code=404, detail="Deporte no encontrado")
    deporte.nombre = payload.nombre
    deporte.is_active = payload.is_active
    await db.commit()
    return {"status": True, "data": {"id": str(deporte.id), "name": deporte.nombre, "is_active": deporte.is_active}}

@router.delete("/system/catalogs/deportes/{deporte_id}", tags=["System - SuperAdmin"])
async def delete_deporte(deporte_id: str, db: AsyncSession = Depends(get_db)):
    # Verificar que no haya canchas vinculadas
    canchas_result = await db.execute(select(models.Cancha).where(models.Cancha._deporte_id == deporte_id))
    if canchas_result.scalars().first():
        raise HTTPException(status_code=409, detail="No se puede eliminar: hay canchas vinculadas a este deporte")
    result = await db.execute(select(models.Deporte).where(models.Deporte.id == deporte_id))
    deporte = result.scalars().first()
    if not deporte:
        raise HTTPException(status_code=404, detail="Deporte no encontrado")
    await db.delete(deporte)
    await db.commit()
    return {"status": True, "message": "Deporte eliminado"}

# --- CRUD Servicios ---
@router.post("/system/catalogs/servicios", tags=["System - SuperAdmin"])
async def create_servicio(payload: ServicioPayload, db: AsyncSession = Depends(get_db)):
    nuevo = models.Servicio(nombre=payload.nombre, icono=payload.icono, categoria=payload.categoria)
    db.add(nuevo)
    await db.commit()
    await db.refresh(nuevo)
    return {"status": True, "data": {"id": str(nuevo.id), "name": nuevo.nombre, "icon": nuevo.icono, "category": nuevo.categoria}}

@router.put("/system/catalogs/servicios/{servicio_id}", tags=["System - SuperAdmin"])
async def update_servicio(servicio_id: str, payload: ServicioPayload, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Servicio).where(models.Servicio.id == servicio_id))
    servicio = result.scalars().first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    servicio.nombre = payload.nombre
    servicio.icono = payload.icono
    servicio.categoria = payload.categoria
    await db.commit()
    return {"status": True, "data": {"id": str(servicio.id), "name": servicio.nombre, "icon": servicio.icono, "category": servicio.categoria}}

@router.delete("/system/catalogs/servicios/{servicio_id}", tags=["System - SuperAdmin"])
async def delete_servicio(servicio_id: str, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    # Verificar que no haya sedes vinculadas
    linked = await db.execute(text("SELECT 1 FROM sede_servicio WHERE servicio_id = :sid LIMIT 1"), {"sid": servicio_id})
    if linked.first():
        raise HTTPException(status_code=409, detail="No se puede eliminar: hay sedes vinculadas a este servicio")
    result = await db.execute(select(models.Servicio).where(models.Servicio.id == servicio_id))
    servicio = result.scalars().first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    await db.delete(servicio)
    await db.commit()
    return {"status": True, "message": "Servicio eliminado"}
