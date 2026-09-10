import random
import string
from typing import Dict, List, Any

def get_random(bank, key):
    return random.choice(bank[key])

def generate_random_data(bank: Dict[str, Any], macro_processor, count: int) -> Dict[str, List[Dict[str, Any]]]:
    data = {
        "usuario": [],
        "persona": [],
        "empresa": [],
        "sede": [],
        "cancha": [],
        "contrato": [],
        "sede_horario_atencion": [],
        "cancha_horario": [],
        "sede_servicio": [],
        "reserva": [],
        "cancha_foto": []
    }
    
    import datetime
    today = datetime.date.today()
    next_4_days = [today + datetime.timedelta(days=d) for d in range(4)]
    
    for i in range(count):

        nombre = get_random(bank, "nombres")
        apellido = get_random(bank, "apellidos")
        dominio = get_random(bank, "dominios_email")
        
        user_id = macro_processor.process(f"${{UUID:fake_user_{i}}}")
        persona_id = macro_processor.process(f"${{UUID:fake_persona_{i}}}")
        username = f"{nombre.lower()}_{apellido.lower()}_{random.randint(100, 999)}"
        email = f"{username}@{dominio}"
        telefono = f"+519{random.randint(10000000, 99999999)}"
        doc = str(random.randint(10000000, 99999999))
        
        user_data = {
            "id": user_id,
            "username": username,
            "email": email,
            "telefono": telefono,
            "proveedor_auth": "LOCAL",
            "rol": "PLAYER",
            "is_active": True,
            "email_verificado": True,
            "password_hash": macro_processor.process("${HASH_PASSWORD:123456}"),
            "codigo_referido": "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        }
        
        if i > 0 and random.random() < 0.3:
            user_data["referido_por_usuario_id"] = random.choice(data["usuario"])["id"]
            
        data["usuario"].append(user_data)
        
        data["persona"].append({
            "id": persona_id,
            "usuario_id": user_id,
            "nombres": nombre,
            "apellidos": apellido,
            "tipo_documento": "DNI",
            "numero_documento": doc
        })
        

        if random.random() > 0.5: # 50% de probabilidad de tener una empresa
            empresa_id = macro_processor.process(f"${{UUID:fake_empresa_{i}}}")
            ruc = str(random.randint(20000000000, 20999999999))
            nombre_empresa = get_random(bank, "nombres_empresa").format(nombre=nombre, apellido=apellido)
            
            data["empresa"].append({
                "id": empresa_id,
                "creada_por_persona_id": persona_id,
                "share_token": f"token-{ruc}",
                "ruc": ruc,
                "razon_social": nombre_empresa + " SAC",
                "nombre_comercial": nombre_empresa,
                "estado_aprobacion": "APROBADA",
                "telefono_contacto": telefono,
                "email_contacto": email
            })
            

            sede_id = macro_processor.process(f"${{UUID:fake_sede_{i}}}")
            distrito = "Chiclayo" # Hardcodeado a distritos de Chiclayo por ahora
            nombre_sede = get_random(bank, "nombres_sede").format(distrito=distrito, nombre=nombre, apellido=apellido)
            direccion = get_random(bank, "direcciones_sede").format(numero=random.randint(100, 999), distrito=distrito)
            
            data["sede"].append({
                "id": sede_id,
                "empresa_id": empresa_id,
                "ubigeo_distrito_id": "140101",
                "nombre": nombre_sede,
                "direccion": direccion,
                "latitud": -6.771,
                "longitud": -79.840,
                "telefono": telefono,
                "tipo_adelanto_requerido": "PORCENTAJE",
                "valor_adelanto_requerido": 50.00
            })
            
            data["contrato"].append({
                "id": macro_processor.process(f"${{UUID:fake_contrato_{i}}}"),
                "empresa_id": empresa_id,
                "sede_id": None, # Alcance global
                "persona_id": persona_id,
                "rol": "ADMINISTRADOR",
                "otorgado_por": persona_id,
                "fecha_inicio": "2026-01-01",
                "is_active": True
            })

            for dia in range(7):
                data["sede_horario_atencion"].append({
                    "id": macro_processor.process(f"${{UUID:fake_sede_horario_{i}_{dia}}}"),
                    "sede_id": sede_id,
                    "dia_semana": dia,
                    "hora_apertura": "08:00:00",
                    "hora_cierre": "23:00:00"
                })

            servicio_keys = [
                "servicio_estacionamiento", "servicio_tienda", "servicio_banos",
                "servicio_duchas", "servicio_vestidores", "servicio_wifi",
                "servicio_seguridad", "servicio_camara"
            ]
            chosen_services = random.sample(servicio_keys, random.randint(1, 4))
            for s_key in chosen_services:
                data["sede_servicio"].append({
                    "id": macro_processor.process(f"${{UUID:fake_sede_servicio_{i}_{s_key}}}"),
                    "sede_id": sede_id,
                    "_servicio_id": macro_processor.process(f"${{UUID:{s_key}}}"),
                    "es_gratuito": True,
                    "costo_adicional": 0.00,
                    "descripcion": None
                })

            cancha_id = macro_processor.process(f"${{UUID:fake_cancha_{i}}}")
            data["cancha"].append({
                "id": cancha_id,
                "sede_id": sede_id,
                "nombre": get_random(bank, "nombres_cancha_f5"),
                "_deporte_id": "11111111-1111-1111-1111-111111111111", # ID F5
                "caracteristicas": {"superficie": get_random(bank, "tipos_superficie"), "techado": random.choice([True, False])},
                "is_active": True
            })
            
            for dia in range(7):
                data["cancha_horario"].append({
                    "id": macro_processor.process(f"${{UUID:fake_cancha_horario_valle_{i}_{dia}}}"),
                    "cancha_id": cancha_id,
                    "dia_semana": dia,
                    "hora_inicio": "08:00:00",
                    "hora_fin": "18:00:00",
                    "precio_por_hora": 60.00,
                    "is_active": True
                })
                data["cancha_horario"].append({
                    "id": macro_processor.process(f"${{UUID:fake_cancha_horario_pico_{i}_{dia}}}"),
                    "cancha_id": cancha_id,
                    "dia_semana": dia,
                    "hora_inicio": "18:00:00",
                    "hora_fin": "23:00:00",
                    "precio_por_hora": 120.00,
                    "is_active": True
                })
            
            imagenes_unsplash = [
                "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1459865264687-595d652de67e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            ]
            
            for f_idx, img_url in enumerate(random.sample(imagenes_unsplash, 2)):
                data["cancha_foto"].append({
                    "id": macro_processor.process(f"${{UUID:fake_cancha_foto_{i}_{f_idx}}}"),
                    "cancha_id": cancha_id,
                    "foto_url": img_url,
                    "orden": f_idx
                })
            
            num_reservas = random.randint(1, 3)
            fechas_elegidas = random.sample(next_4_days, k=min(num_reservas, 4))
            for idx, fecha in enumerate(fechas_elegidas):
                hora_inicio_int = random.randint(16, 22)
                hora_fin_int = hora_inicio_int + 1
                
                is_peak = hora_inicio_int >= 18
                precio = 120.00 if is_peak else 60.00
                
                data["reserva"].append({
                    "id": macro_processor.process(f"${{UUID:fake_reserva_{i}_{idx}}}"),
                    "cancha_id": cancha_id,
                    "tipo_origen": "INDIVIDUAL",
                    "persona_organizadora_id": persona_id,
                    "fecha_reserva": fecha.isoformat(),
                    "hora_inicio_solicitada": f"{hora_inicio_int:02d}:00:00",
                    "hora_fin_solicitada": f"{hora_fin_int:02d}:00:00",
                    "hora_inicio": f"{hora_inicio_int:02d}:00:00",
                    "hora_fin": f"{hora_fin_int:02d}:00:00",
                    "duracion_horas": 1.0,
                    "precio_hora_historico": precio,
                    "precio_total_cancha": precio,
                    "monto_total_final": precio,
                    "_saldo_pendiente": 0.00,
                    "estado": "CONFIRMADA",
                    "share_token": f"rsv-{random.randint(100000, 999999)}"
                })
            
    return data
