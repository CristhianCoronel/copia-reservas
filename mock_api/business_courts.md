# Gestión de Canchas (Empresa)

Agrupa todo lo relacionado a la consulta y gestión de canchas de una sede (empresa).

### Endpoint: Obtener lista de canchas de la empresa
**Lógica:** Devuelve las canchas de la empresa para su gestión (cambio de tarifas, bloqueo, edición).
**Método:** `GET`
**Ruta de ejemplo:** `/api/business/courts`
**Ruta Regex:** `^\/api\/business\/courts$`

```json
{
  "message": "Canchas de la sede obtenidas correctamente",
  "status": true,
  "data": [
    {
      "id": "c1",
      "name": "Cancha 1 - Sintético Pro 5v5",
      "sport": "FUTBOL5",
      "surface": "Césped Sintético 50mm",
      "isCovered": true,
      "hasLights": true,
      "regularPrice": 80,
      "peakPrice": 120,
      "services": ["Estacionamiento", "Duchas", "WiFi", "Bar/Snack"],
      "rules": "Prohibido usar choperas o toperoles de metal. Presentar DNI.",
      "imageColor": "#10B981"
    }
  ]
}
```

### Endpoint: Crear cancha
**Lógica:** Crea una nueva cancha en la sede de la empresa.
**Método:** `POST`
**Ruta de ejemplo:** `/api/business/courts`

```json
{
  "message": "Cancha creada correctamente",
  "status": true,
  "data": {
    "id": "c3_new",
    "name": "Nueva Cancha",
    "sport": "FUTBOL5"
  }
}
```

### Endpoint: Editar cancha
**Lógica:** Actualiza la información de una cancha existente.
**Método:** `PUT`
**Ruta de ejemplo:** `/api/business/courts/{court_id}`

```json
{
  "message": "Cancha actualizada correctamente",
  "status": true,
  "data": {
    "id": "c1",
    "name": "Cancha Editada"
  }
}
```
