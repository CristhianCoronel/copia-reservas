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
      "companyName": "Canchas El Barrio SAC",
      "address": "Av. Ejercito 123",
      "distanceKm": 1.2,
      "sport": "FUTBOL5",
      "isCovered": true,
      "hasLights": true,
      "regularPrice": 80,
      "peakPrice": 120,
      "whatsapp": "+51999888777",
      "services": ["ESTACIONAMIENTO", "DUCHAS", "WIFI", "BAR/SNACK"],
      "rules": "Prohibido usar choperas o toperoles de metal. Presentar DNI.",
      "imageColor": "#10B981",
      "images": [
        "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1518605368461-1e1e1fd51ed4?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1551280857-2b9ebf10fc13?auto=format&fit=crop&w=800&q=80"
      ]
    },
    {
      "id": "c2",
      "name": "Pista Central - Pádel Open",
      "companyName": "Pádel Club City",
      "address": "Av. Los Héroes 456",
      "distanceKm": 3.5,
      "sport": "PADEL",
      "isCovered": false,
      "hasLights": true,
      "regularPrice": 60,
      "peakPrice": 90,
      "whatsapp": "+51987654321",
      "services": ["ESTACIONAMIENTO", "BEBIDAS"],
      "rules": "Traer palas propias. Alquiler disponible.",
      "imageColor": "#3B82F6",
      "images": [
        "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&q=80"
      ]
    },
    {
      "id": "c3",
      "name": "Tabloncillo VIP",
      "companyName": "Hoops Arena",
      "address": "Calle Las Gaviotas 789",
      "distanceKm": 5.1,
      "sport": "BASQUET",
      "isCovered": true,
      "hasLights": true,
      "regularPrice": 100,
      "peakPrice": 150,
      "whatsapp": "+51999000111",
      "services": ["ESTACIONAMIENTO", "DUCHAS", "TRIBUNAS"],
      "rules": "Uso obligatorio de zapatillas de suela limpia.",
      "imageColor": "#F59E0B",
      "images": [
        "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80"
      ]
    },
    {
      "id": "c4",
      "name": "Cancha 2 - La Jaula 5v5",
      "companyName": "Canchas El Barrio SAC",
      "address": "Av. Ejercito 123",
      "distanceKm": 1.2,
      "sport": "FUTBOL5",
      "isCovered": false,
      "hasLights": true,
      "regularPrice": 40,
      "peakPrice": 60,
      "whatsapp": "+51999888777",
      "services": ["ESTACIONAMIENTO", "BAR/SNACK"],
      "rules": "No manchar paredes.",
      "imageColor": "#EF4444",
      "images": [
        "https://images.unsplash.com/photo-1518605368461-1e1e1fd51ed4?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1551280857-2b9ebf10fc13?auto=format&fit=crop&w=800&q=80"
      ]
    }
  ]
}
```

### Endpoint: Obtener disponibilidad de cancha por fecha
**Lógica:** Devuelve los bloques de tiempo disponibles para una cancha en una fecha específica.
**Método:** `GET`
**Ruta de ejemplo:** `/api/business/courts/{court_id}/availability?date=YYYY-MM-DD`
**Ruta Regex:** `^\/api\/business\/courts\/[^\/]+\/availability.*$`

```json
{
  "message": "Disponibilidad obtenida",
  "status": true,
  "data": [
    {"time": "15:00 - 16:00", "isPeak": false, "price": 80, "available": true},
    {"time": "16:00 - 17:00", "isPeak": false, "price": 80, "available": false},
    {"time": "17:00 - 18:00", "isPeak": false, "price": 80, "available": true},
    {"time": "18:00 - 19:00", "isPeak": true, "price": 120, "available": true},
    {"time": "19:00 - 20:00", "isPeak": true, "price": 120, "available": true},
    {"time": "20:00 - 21:00", "isPeak": true, "price": 120, "available": false},
    {"time": "21:00 - 22:00", "isPeak": true, "price": 120, "available": true}
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
