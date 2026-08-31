# Reservas (Jugador)

Maneja el historial de reservas de un jugador.

### Endpoint: Obtener reservas del jugador
**Lógica:** Retorna el historial de reservas (juntas o privadas) donde participa el jugador.
**Método:** `GET`
**Ruta de ejemplo:** `/api/player/reservations/me`
**Ruta Regex:** `^\/api\/player\/reservations\/me$`

```json
{
  "message": "Reservas obtenidas correctamente",
  "status": true,
  "data": [
    {
      "id": "1",
      "courtName": "Cancha 1 - Sintético Pro 5v5",
      "venueName": "Triple Doble",
      "date": "30-Aug-2026",
      "time": "19:00 - 20:00",
      "status": "CONFIRMED",
      "amount": 120
    }
  ]
}
```

### Endpoint: Crear nueva reserva
**Lógica:** Crea una nueva solicitud de reserva de cancha.
**Método:** `POST`
**Ruta de ejemplo:** `/api/player/reservations`

```json
{
  "message": "Solicitud de reserva creada. Esperando pago.",
  "status": true,
  "data": {
    "id": "new_res_123",
    "status": "PENDING",
    "courtId": "c1",
    "date": "30-Aug-2026",
    "time": "20:00 - 21:00"
  }
}
```
