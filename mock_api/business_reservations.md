# Gestión de Reservas (Empresa)

Maneja las reservas pendientes que la empresa (administrador de sede) debe aprobar.

### Endpoint: Obtener reservas pendientes (Empresa)
**Lógica:** Devuelve la lista de reservas que están a la espera de validación de pago.
**Método:** `GET`
**Ruta de ejemplo:** `/api/business/reservations/pending`
**Ruta Regex:** `^\/api\/business\/reservations\/pending$`

```json
{
  "message": "Reservas pendientes obtenidas",
  "status": true,
  "data": [
    {
      "id": "b101",
      "userName": "Gonzalo Ramírez",
      "phone": "+51 987 654 321",
      "courtName": "Cancha 1 - Sintético Pro 5v5",
      "date": "30-Aug-2026",
      "time": "19:00 - 20:00",
      "amount": 120,
      "paymentMethod": "Transferencia BCP / Yape"
    }
  ]
}
```

### Endpoint: Aprobar reserva pendiente
**Lógica:** Aprueba una reserva pendiente (marca como pagada).
**Método:** `POST`
**Ruta de ejemplo:** `/api/business/reservations/{reservation_id}/approve`

```json
{
  "message": "Reserva aprobada exitosamente",
  "status": true,
  "data": []
}
```
