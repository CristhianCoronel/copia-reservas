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
        "cancha": []
    }
    
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
        
        data["usuario"].append({
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
        })
        
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
            

            cancha_id = macro_processor.process(f"${{UUID:fake_cancha_{i}}}")
            data["cancha"].append({
                "id": cancha_id,
                "sede_id": sede_id,
                "nombre": get_random(bank, "nombres_cancha_f5"),
                "_deporte_id": "11111111-1111-1111-1111-111111111111", # ID F5
                "is_active": True
            })
            
    return data
