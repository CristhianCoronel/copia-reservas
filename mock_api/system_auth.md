# Autenticación (Sistema)

Maneja el inicio de sesión y la generación de tokens JWT.

### Endpoint: Iniciar sesión
**Lógica:** Endpoint simulado que acepta cualquier email y contraseña y devuelve un token JWT válido.
**Método:** `POST`
**Ruta de ejemplo:** `/api/auth/login`

```json
{
  "message": "Inicio de sesión exitoso",
  "status": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mocked_token.SeparaAltoke2026",
    "user": {
      "id": "u1",
      "fullName": "Juan Pérez",
      "role": "jugador"
    }
  }
}
```
