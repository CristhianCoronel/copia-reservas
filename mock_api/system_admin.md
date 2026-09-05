# Administración Global (Sistema)

Módulo exclusivo para los superadministradores de la plataforma.

### Endpoint: Obtener empresas pendientes de aprobación
**Lógica:** Retorna la lista de empresas recién registradas que esperan ser validadas.
**Método:** `GET`
**Ruta de ejemplo:** `/api/system/companies/pending`
**Ruta Regex:** `^\/api\/system\/companies\/pending$`

```json
{
  "message": "Empresas pendientes obtenidas",
  "status": true,
  "data": [
    {
      "id": "e_pend_1",
      "name": "Canchas El Barrio SAC",
      "commercialName": "El Barrio",
      "ruc": "20123456789",
      "status": "PENDIENTE",
      "createdAt": "2026-08-28T10:00:00Z"
    }
  ]
}
```

### Endpoint: Aprobar o rechazar empresa
**Lógica:** Cambia el estado de una empresa pendiente.
**Método:** `PUT`
**Ruta de ejemplo:** `/api/system/companies/{company_id}/status`

```json
{
  "message": "Estado de la empresa actualizado a APROBADA",
  "status": true,
  "data": {
    "id": "e_pend_1",
    "status": "APROBADA"
  }
}
```

### Endpoint: Obtener catálogos maestros
**Lógica:** Retorna la lista de deportes y servicios admitidos en la plataforma.
**Método:** `GET`
**Ruta de ejemplo:** `/api/system/catalogs`
**Ruta Regex:** `^\/api\/system\/catalogs$`

```json
{
  "message": "Catálogos obtenidos",
  "status": true,
  "data": {
    "sports": [
      {"id": "sp1", "name": "Fútbol"},
      {"id": "sp2", "name": "Pádel"},
      {"id": "sp3", "name": "Básquet"}
    ],
    "services": [
      {"id": "sv1", "name": "Estacionamiento"},
      {"id": "sv2", "name": "Duchas"},
      {"id": "sv3", "name": "WiFi"},
      {"id": "sv4", "name": "Bar/Snack"}
    ]
  }
}
```
