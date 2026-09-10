# Generación de Datos (Seeder)

El proyecto incluye un script en Python para generar y restablecer la base de datos con datos de prueba, ideal para los entornos de desarrollo.

## ¿Qué hace el script?

1. Elimina y vuelve a crear el esquema `public` utilizando `01_schema.sql`.
2. Inserta datos base requeridos desde los archivos CSV (por ejemplo `deportes.csv`, `paises.csv`, `ubigeo.csv`, etc.).
3. Inserta usuarios de prueba fijos útiles para hacer login (`admin_altoke`, `dueno_chiclayo`, `jugador_pro`).
4. Genera de forma aleatoria (pero coherente) usuarios, personas, empresas, sedes y canchas utilizando una base de datos de combinaciones en `bank.json`. Todo esto sin utilizar dependencias externas como Faker.

## Uso del Script

El script está diseñado para ejecutarse dentro del contenedor del backend en Docker.

Para resetear la base de datos y generar datos de prueba para desarrollo, usa el siguiente comando:

```bash
docker exec separaaltoke_api python -m seeds.cli reset --env dev --fake-count 50
```

### Argumentos:

- `reset`: Indica que se debe borrar el esquema actual y volver a crearlo desde cero.
- `--env`: Define el entorno de los datos. El entorno `dev` carga los datos predeterminados configurados en `backend/seeds/data/dev/`. El entorno `prod` omitirá la carga de datos de prueba o mock, ideal para una base de datos vacía o sólo con diccionarios de sistema.
- `--fake-count`: Especifica cuántos registros aleatorios (empresas, jugadores, sedes, etc.) se van a generar e insertar masivamente. (Por defecto: 0).

## Credenciales de Desarrollo

Para ingresar al frontend (Auth) durante el desarrollo local, puedes utilizar los usuarios cargados por defecto:

* **Administrador:** 
  - Correo: `admin@separaaltoke.com` 
  - Password: `admin123`
  
* **Dueño de Empresa:**
  - Correo: `dueno@chiclayo.com`
  - Password: `dueno123`

* **Jugador:**
  - Correo: `jugador@test.com`
  - Password: `jugador123`

*(Revisar `backend/seeds/data/dev/usuarios.csv` para ver y/o ajustar las contraseñas base generadas mediante la macro `${HASH_PASSWORD:...}`)*
