# Juntas y Social (Jugador)

Agrupa los partidos abiertos (juntas) donde los jugadores se pueden sumar para dividir el costo.

### Endpoint: Obtener juntas abiertas
**Lógica:** Retorna los partidos organizados por otros jugadores que aún no están completos.
**Método:** `GET`
**Ruta de ejemplo:** `/api/player/social/groups`
**Ruta Regex:** `^\/api\/player\/social\/groups$`

```json
{
  "message": "Juntas abiertas obtenidas",
  "status": true,
  "data": [
    {
      "id": "g1",
      "title": "🔥 Pichanga Viernes Nocturna (Nivel Medio)",
      "organizer": "Carlos Mendoza",
      "organizerRating": 4.9,
      "courtName": "Cancha 1 - Sintético Pro 5v5",
      "date": "Viernes 04 Sep",
      "time": "20:00 - 21:00",
      "maxPlayers": 10,
      "currentPlayers": 7,
      "totalCourtPrice": 120,
      "sport": "FUTBOL5"
    }
  ]
}
```

### Endpoint: Unirse a una junta
**Lógica:** Permite a un jugador unirse a un partido abierto verificando disponibilidad.
**Método:** `POST`
**Ruta de ejemplo:** `/api/player/social/groups/{group_id}/join`
**Ruta Regex:** `^\/api\/player\/social\/groups\/[a-zA-Z0-9_-]+\/join$`

```json
{
  "message": "Te has unido al partido exitosamente",
  "status": true,
  "data": {
    "groupId": "g1",
    "currentPlayers": 8
  }
}
```
