# Registro de Empresa (Sistema)

Módulo para que un jugador registre su complejo deportivo y pase a ser administrador B2B.

### Endpoint: Registrar nueva empresa
**Lógica:** Crea la empresa en estado PENDIENTE de aprobación y le asigna el rol de admin al creador.
**Método:** `POST`
**Ruta de ejemplo:** `/api/system/companies/register`

```json
{
  "message": "Empresa registrada. Pendiente de validación.",
  "status": true,
  "data": {
    "id": "e_new_1",
    "commercialName": "Nuevo Complejo",
    "status": "PENDIENTE"
  }
}
```
