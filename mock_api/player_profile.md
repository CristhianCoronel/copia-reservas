# Perfil (Jugador)

Información personal, monedero virtual y referidos.

### Endpoint: Obtener datos del perfil
**Lógica:** Trae los datos personales, reputación, saldo en monedero virtual y estadísticas.
**Método:** `GET`
**Ruta de ejemplo:** `/api/player/profile/me`
**Ruta Regex:** `^\/api\/player\/profile\/me$`

```json
{
  "message": "Perfil cargado exitosamente",
  "status": true,
  "data": {
    "userId": "u1",
    "fullName": "Juan Pérez",
    "document": "***456",
    "role": "Jugador",
    "reputation": {
      "score": 4.9,
      "completedMatches": 18
    },
    "walletBalance": 30.00,
    "referral": {
      "code": "TOCA-JUAN77",
      "successfulReferrals": 3,
      "totalEarned": 45.00
    }
  }
}
```

### Endpoint: Actualizar perfil
**Lógica:** Actualiza los datos del perfil del jugador.
**Método:** `PUT`
**Ruta de ejemplo:** `/api/player/profile/me`

```json
{
  "message": "Perfil actualizado exitosamente",
  "status": true,
  "data": {
    "userId": "u1",
    "fullName": "Juan Pérez Editado",
    "document": "***456"
  }
}
```
