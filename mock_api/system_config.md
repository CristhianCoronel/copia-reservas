# Configuración del Sistema y Descuentos (Sistema)

Reglas gestionadas por "Separa Altoke" globalmente.

### Endpoint: Obtener promociones y descuentos globales
**Lógica:** Trae los cupones internos (`int_descuentos`) válidos para ser aplicados en reservas.
**Método:** `GET`
**Ruta de ejemplo:** `/api/system/discounts`
**Ruta Regex:** `^\/api\/system\/discounts$`

```json
{
  "message": "Promociones obtenidas",
  "status": true,
  "data": [
    {
      "code": "PRIMERA-VEZ",
      "discountType": "percentage",
      "value": 15,
      "maxDiscount": 20.00,
      "validUntil": "2026-12-31"
    }
  ]
}
```
