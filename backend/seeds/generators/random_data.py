import random
import string
import datetime
import json
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
        "cancha_foto": [],
        "equipo": [],
        "equipo_miembro": [],
        "reserva": [],
        "pago_reserva": [],
        "partida_abierta": [],
        "partida_abierta_participante": [],
        "chat": [],
        "chat_participante": [],
        "mensaje": []
    }
    
    today = datetime.datetime.now(datetime.timezone.utc)
    # Rango desde -7 días hasta +4 días
    past_future_days = [today + datetime.timedelta(days=d) for d in range(-7, 4)]
    
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
            "password_hash": macro_processor.process(f"${{HASH_PASSWORD:{username}-}}"),
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
        

        if i == 0 or random.random() > 0.5: # 50% de probabilidad, pero el primer user siempre crea una empresa para tener canchas fallback
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
                "_deporte_id": macro_processor.process("${UUID:deporte_futbol5}"), # ID F5
                "caracteristicas": json.dumps({"superficie": get_random(bank, "tipos_superficie"), "techado": random.choice([True, False])}),
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

        # --- SEEDING RESERVAS, EQUIPOS Y CHATS ---
        # El 20% de los usuarios no tiene historial de reservas para probar UI vacía
        if random.random() < 0.8:
            num_reservas = random.randint(1, 4)
            fechas_elegidas = random.sample(past_future_days, k=min(num_reservas, len(past_future_days)))
            
            # Crear un equipo para este usuario (50% de probabilidad)
            equipo_id = None
            if random.random() > 0.5:
                equipo_id = macro_processor.process(f"${{UUID:fake_equipo_{i}}}")
                nombre_equipo = get_random(bank, "apellidos") + " FC " + "".join(random.choices(string.ascii_uppercase, k=3))
                data["equipo"].append({
                    "id": equipo_id,
                    "nombre": nombre_equipo,
                    "share_token": f"eq-{random.randint(1000, 9999)}",
                    "creador_id": persona_id
                })
                data["equipo_miembro"].append({
                    "id": macro_processor.process(f"${{UUID:fake_equipo_miembro_{i}_admin}}"),
                    "equipo_id": equipo_id,
                    "persona_id": persona_id,
                    "rol": "CAPITAN",
                    "is_active": True
                })

                # Generar CHAT para el equipo
                chat_equipo_id = macro_processor.process(f"${{UUID:fake_chat_equipo_{i}}}")
                data["chat"].append({
                    "id": chat_equipo_id,
                    "tipo_canal": "EQUIPO",
                    "referencia_id": equipo_id
                })
                data["chat_participante"].append({
                    "id": macro_processor.process(f"${{UUID:fake_chat_part_eq_{i}_{persona_id}}}"),
                    "chat_id": chat_equipo_id,
                    "persona_id": persona_id,
                    "rol": "ADMIN",
                    "_no_leidos": 0
                })

                # Mensaje de bienvenida e invitación (interactivo)
                base_time = today - datetime.timedelta(days=10)
                data["mensaje"].append({
                    "id": macro_processor.process(f"${{UUID:fake_msg_eq_{i}_1}}"),
                    "chat_id": chat_equipo_id,
                    "remitente_id": persona_id,
                    "tipo_mensaje": "TEXTO",
                    "contenido_texto": "¡Bienvenidos a nuestro nuevo equipo!",
                    "datos_objeto": None,
                    "created_at": (base_time).isoformat()
                })

                # Agregar 2 a 3 integrantes adicionales
                num_extra_members = random.randint(2, 3)
                # 80% de los grupos tienen a sus miembros con invitación ACEPTADA, 20% PENDIENTE
                group_accepted = random.random() < 0.8
                
                # Elegir IDs de usuario aleatorios distintos al actual
                possible_user_indices = [j for j in range(count) if j != i]
                chosen_indices = random.sample(possible_user_indices, min(num_extra_members, len(possible_user_indices)))
                
                for idx_member, j in enumerate(chosen_indices):
                    member_persona_id = macro_processor.process(f"${{UUID:fake_persona_{j}}}")
                    estado_invitacion = "ACEPTADA" if group_accepted else "PENDIENTE"
                    
                    # Crear chat directo entre capitan e invitado para la invitación
                    chat_directo_id = macro_processor.process(f"${{UUID:fake_chat_dir_{i}_{j}}}")
                    data["chat"].append({
                        "id": chat_directo_id,
                        "tipo_canal": "JUGADOR_JUGADOR",
                        "referencia_id": None
                    })
                    data["chat_participante"].extend([{
                        "id": macro_processor.process(f"${{UUID:fake_chat_part_dir_cap_{i}_{j}}}"),
                        "chat_id": chat_directo_id,
                        "persona_id": persona_id,
                        "rol": "ADMIN",
                        "_no_leidos": 0
                    }, {
                        "id": macro_processor.process(f"${{UUID:fake_chat_part_dir_inv_{i}_{j}}}"),
                        "chat_id": chat_directo_id,
                        "persona_id": member_persona_id,
                        "rol": "ADMIN",
                        "_no_leidos": 1 if estado_invitacion == "PENDIENTE" else 0
                    }])

                    # Objeto INVITACION interactiva para este miembro en su chat directo
                    data["mensaje"].append({
                        "id": macro_processor.process(f"${{UUID:fake_msg_eq_inv_{i}_{j}}}"),
                        "chat_id": chat_directo_id,
                        "remitente_id": persona_id,
                        "tipo_mensaje": "INVITACION",
                        "contenido_texto": f"Te he invitado a unirte a {nombre_equipo}",
                        "datos_objeto": json.dumps({
                            "meta_relacional": {
                                "tipo": "EQUIPO",
                                "id_relacion": str(equipo_id)
                            },
                            "estado": estado_invitacion
                        }),
                        "created_at": (base_time + datetime.timedelta(minutes=5 * (idx_member + 1))).isoformat()
                    })
                    
                    # Añadirlo al equipo (y al chat del equipo) solo si aceptó
                    if estado_invitacion == "ACEPTADA":
                        data["chat_participante"].append({
                            "id": macro_processor.process(f"${{UUID:fake_chat_part_eq_{i}_{member_persona_id}}}"),
                            "chat_id": chat_equipo_id,
                            "persona_id": member_persona_id,
                            "rol": "MIEMBRO",
                            "_no_leidos": 0
                        })
                        
                        data["equipo_miembro"].append({
                            "id": macro_processor.process(f"${{UUID:fake_equipo_miembro_{i}_{j}}}"),
                            "equipo_id": equipo_id,
                            "persona_id": member_persona_id,
                            "rol": "JUGADOR",
                            "is_active": True
                        })


            for idx, fecha in enumerate(fechas_elegidas):
                hora_inicio_int = random.randint(16, 22)
                hora_fin_int = hora_inicio_int + 1
                
                is_peak = hora_inicio_int >= 18
                precio = 120.00 if is_peak else 60.00
                
                # Elegir aleatoriamente si es partida abierta, de equipo o individual
                # (Solo equipo si el usuario creo uno)
                if equipo_id:
                    reserva_tipo = random.choice(["PARTIDA_ABIERTA", "INDIVIDUAL", "EQUIPO"])
                else:
                    reserva_tipo = random.choice(["PARTIDA_ABIERTA", "INDIVIDUAL"])
                
                is_social = (reserva_tipo == "PARTIDA_ABIERTA")
                
                reserva_id = macro_processor.process(f"${{UUID:fake_reserva_{i}_{idx}}}")
                max_jugadores = random.choice([10, 14]) if is_social else None
                monto_por_persona = precio / max_jugadores if is_social else precio
                
                # Si la reserva esta en el pasado, el estado debería ser COMPLETADA
                # Si está en el futuro, CONFIRMADA (o PENDIENTE_PAGO si es social y falta gente)
                is_past = fecha < today
                
                if is_social:
                    estado_reserva = "PENDIENTE_PAGO"
                elif is_past:
                    estado_reserva = "COMPLETADA"
                else:
                    estado_reserva = "CONFIRMADA"

                # Asumimos que hay alguna cancha disponible creada globalmente o localmente
                # En este script, como las empresas no siempre se crean para este usuario, 
                # vamos a usar un ID mock.
                mock_cancha_id = macro_processor.process(f"${{UUID:fake_cancha_0}}") # Fallback, pero idealmente toma una real.
                if len(data["cancha"]) > 0:
                    mock_cancha_id = random.choice(data["cancha"])["id"]

                data["reserva"].append({
                    "id": reserva_id,
                    "cancha_id": mock_cancha_id,
                    "tipo_origen": reserva_tipo,
                    "persona_organizadora_id": persona_id,
                    "equipo_id": equipo_id if reserva_tipo == "EQUIPO" else None,
                    "fecha_reserva": fecha.strftime("%Y-%m-%d"),
                    "hora_inicio_solicitada": f"{hora_inicio_int:02d}:00:00",
                    "hora_fin_solicitada": f"{hora_fin_int:02d}:00:00",
                    "hora_inicio": f"{hora_inicio_int:02d}:00:00",
                    "hora_fin": f"{hora_fin_int:02d}:00:00",
                    "duracion_horas": 1.0,
                    "precio_hora_historico": precio,
                    "precio_total_cancha": precio,
                    "monto_total_final": precio,
                    "_saldo_pendiente": precio - monto_por_persona,
                    "estado": estado_reserva,
                    "share_token": f"rsv-{random.randint(100000, 999999)}"
                })

                # Si es una reserva de equipo, inyectar el interactivo NOTIFICACION_RESERVA en su chat
                if reserva_tipo == "EQUIPO" and equipo_id:
                    chat_equipo_id = macro_processor.process(f"${{UUID:fake_chat_equipo_{i}}}")
                    msg_time = fecha - datetime.timedelta(days=2) # 2 dias antes del partido
                    data["mensaje"].append({
                        "id": macro_processor.process(f"${{UUID:fake_msg_eq_rsv_{i}_{idx}}}"),
                        "chat_id": chat_equipo_id,
                        "remitente_id": persona_id,
                        "tipo_mensaje": "NOTIFICACION_RESERVA",
                        "contenido_texto": "¡He reservado la cancha para nosotros!",
                        "datos_objeto": json.dumps({
                            "reserva_id": str(reserva_id),
                            "cancha_nombre": "Cancha Sintética F5",
                            "sede_nombre": "Sede Principal",
                            "fecha": fecha.strftime("%Y-%m-%d"),
                            "hora_inicio": f"{hora_inicio_int:02d}:00",
                            "hora_fin": f"{hora_fin_int:02d}:00",
                            "monto_total": float(precio),
                            "estado": estado_reserva
                        }),
                        "created_at": msg_time.isoformat()
                    })
                
                if is_social:
                    partida_id = macro_processor.process(f"${{UUID:fake_partida_{i}_{idx}}}")
                    data["partida_abierta"].append({
                        "id": partida_id,
                        "share_token": f"pa-{random.randint(10000, 99999)}",
                        "reserva_id": reserva_id,
                        "organizador_id": persona_id,
                        "_deporte_id": macro_processor.process("${UUID:deporte_futbol5}"),
                        "presupuesto_meta": precio,
                        "cupos_totales": max_jugadores,
                        "cupos_disponibles": max_jugadores - 1,
                        "estado": "RECAUDANDO"
                    })
                    data["partida_abierta_participante"].append({
                        "id": macro_processor.process(f"${{UUID:fake_partida_part_{i}_{idx}_org}}"),
                        "partida_abierta_id": partida_id,
                        "persona_id": persona_id,
                        "aporte_monedero": monto_por_persona
                    })

                    # Generar CHAT para la partida abierta
                    chat_junta_id = macro_processor.process(f"${{UUID:fake_chat_junta_{i}_{idx}}}")
                    data["chat"].append({
                        "id": chat_junta_id,
                        "tipo_canal": "PARTIDA_ABIERTA",
                        "referencia_id": partida_id
                    })
                    data["chat_participante"].append({
                        "id": macro_processor.process(f"${{UUID:fake_chat_part_junta_{i}_{idx}}}"),
                        "chat_id": chat_junta_id,
                        "persona_id": persona_id,
                        "rol": "ADMIN",
                        "_no_leidos": 1
                    })

                    # Mensajes de junta
                    base_time = fecha - datetime.timedelta(days=1)
                    data["mensaje"].append({
                        "id": macro_processor.process(f"${{UUID:fake_msg_junta_{i}_{idx}_1}}"),
                        "chat_id": chat_junta_id,
                        "remitente_id": persona_id,
                        "tipo_mensaje": "TEXTO",
                        "contenido_texto": "Hola gente, faltan cupos, compartan.",
                        "datos_objeto": None,
                        "created_at": (base_time).isoformat()
                    })

                    # Simulamos que alguien envía un comprobante de pago
                    pago_id = macro_processor.process(f"${{UUID:fake_pago_{i}_{idx}_org}}")
                    data["mensaje"].append({
                        "id": macro_processor.process(f"${{UUID:fake_msg_junta_{i}_{idx}_2}}"),
                        "chat_id": chat_junta_id,
                        "remitente_id": persona_id,
                        "tipo_mensaje": "COMPROBANTE_PAGO",
                        "contenido_texto": "Acabo de enviar el comprobante de pago inicial",
                        "datos_objeto": json.dumps({
                            "pago_id": str(pago_id),
                            "monto": float(monto_por_persona),
                            "estado": "PENDIENTE",
                            "comprobante_url": "https://via.placeholder.com/300x500.png?text=Voucher+Yape",
                            "revisado_por": None
                        }),
                        "created_at": (base_time + datetime.timedelta(minutes=15)).isoformat()
                    })
                else:
                    pago_id = macro_processor.process(f"${{UUID:fake_pago_{i}_{idx}_org}}")

                # Pago organizador
                data["pago_reserva"].append({
                    "id": pago_id,
                    "reserva_id": reserva_id,
                    "persona_id": persona_id,
                    "monto": monto_por_persona,
                    "estado": "APROBADO" if not is_social else "PENDIENTE", # En social el mock voucher esta pendiente
                    "metodo_pago": "YAPE"
                })

    return data
