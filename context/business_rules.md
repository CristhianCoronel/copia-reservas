# Apuntes: reglas de negocio y flujos del sistema - "Separa Altoke"

Este documento contiene la matriz de problemáticas clasificadas por segmento (empresas B2B, jugadores B2C y el proyecto "Separa Altoke") con su planificación de resolución en el software, seguido de las reglas lógicas y matemáticas del negocio.

---

## 1. Matriz de problemáticas y plan de solución

### A. Empresas (dueños y administradores de complejos deportivos)

| Problema / dolor | Momento de arreglo | Cómo se resuelve (lógica de software) |
| :--- | :--- | :--- |
| **Doble reserva o sobreposición**: manejo ineficiente de agendas en papel, pizarras o Excel manuales por parte del staff. | **Pronto** | Base de datos relacional con restricciones transaccionales. Los endpoints de reserva efectúan un bloqueo optimista y validación horaria estricta a nivel de consulta SQL antes de pasar a estado `PENDING` o `CONFIRMED`. |
| **Cancelaciones de última hora ("plantones")**: pérdida económica por turnos reservados que no asisten y no avisan. | **Pronto** | La reserva se crea en estado `PENDING`. El usuario tiene un tiempo límite configurable (segun configure la empresa para su propia lógica de negocio) para enviar el comprobante por canal externo (WhatsApp). El administrador del complejo cancela manualmente en la app o el sistema purga reservas inactivas tras el vencimiento de la fecha límite sin confirmación. |
| **Horas muertas (baja demanda)**: dificultad para rentabilizar la infraestructura en horarios diurnos o días laborables. | **Nunca** | Es responsabilida de la empresa |
| **Staff poco tecnológico**: resistencia del personal de los complejos a utilizar sistemas informáticos complejos. | **Pronto** | Interfaz de administración integrada en la misma aplicación móvil (app), minimalista y adaptada a celulares. Permite registrar una reserva manual (por llamada o presencial) en un calendario gráfico interactivo en pocos toques, eliminando la necesidad de una computadora. |
| **Falta de visibilidad de sus locales**: complejos nuevos o pequeños que no pueden captar nuevos usuarios de forma constante. | **Después** | Motor de búsqueda geolocalizado en la app móvil (cálculo de distancia por latitud/longitud en base a la ubicación del jugador) para sugerir canchas cercanas y promociones de complejos aliados. |
| **Pasarelas de pago integradas (suscripción o reservas)**: dificultad para integrar APIs de pago bancarias complejas al inicio del proyecto. | **A futuro** | Se posterga la integración de pasarelas de pago automatizadas en línea. Toda la gestión transaccional monetaria se realiza mediante transferencias externas y validaciones propia de la empresa. |

---

### B. Jugadores (clientes y usuarios de las canchas)

| Problema / dolor | Momento de arreglo | Cómo se resuelve (lógica de software) |
| :--- | :--- | :--- |
| **Equipos incompletos o falta de rival**: dificultad para coordinar con amigos y frustración por cancelar partidos por falta de quórum. | **Pronto** | Lógica de **reserva grupal (partido abierto)**. El organizador crea la reserva y el backend genera un `MatchGroup` expuesto en la app para que otros jugadores locales se unan de forma individual hasta llenar el cupo (`max_players`). |
| **Fricción al dividir y cobrar el costo del turno**: el organizador debe cobrar manualmente a cada participante y consolidar el dinero. | **A futuro** | División de costo informativa. El backend calcula dinámicamente el `split_price_per_player` dividiendo la tarifa total entre `max_players`. En la app se permite al organizador marcar visualmente a cada participante como "pagado" (`PAID` en `GroupParticipant.payment_status`) para su control personal, aunque la transferencia sea externa. |
| **Desequilibrio de nivel competitivo**: jugar partidos aburridos contra rivales de nivel muy diferente (muy superior o inferior). | **Nunca** | Es responsabilidad del usuario |
| **Información de canchas desactualizada**: llegar al local y encontrar mala superficie, falta de estacionamiento o sin iluminación. | **Después** | Campos específicos en la tabla correspondiente para indicar cualidades (tipo de superficie, si es techada) y almacenar infromación adicional (servicios como quiosco, estacionamiento, duchas). Galería de fotos validada y sistema de comentarios calificados de usuarios comprobados. |
| **Falta de seriedad / tardanzas de compañeros**: jugadores que se comprometen pero no van o llegan tarde. | **Después** | Índice de confiabilidad y puntualidad del jugador basado en la calificación mutua post-partido. La reputación de un usuario es visible. |
| **Integración de pagos en línea en partidos grupales**: automatizar el recaudo individual de la cuota de cada jugador mediante la app. | **A futuro** | Se resolverá más adelante con billeteras digitales integradas en la app. Inicialmente, los jugadores coordinan de forma externa quién y cómo transfiere el dinero al organizador (comunicación interna). |
| **Desafíos y retos entre equipos**: equipos formados que buscan desafiar formalmente a otros equipos a jugar. | **A futuro lejano / Nunca** | Es una necesidad real de los jugadores, pero no se implementará un flujo nativo (objeto tipo Reto) por ahora debido a la alta complejidad técnica de coordinar agendas de dos grupos distintos, elegir una cancha neutral y unificar el pago de ambos equipos. Se deja para que lo coordinen de forma externa. |

---

### C. Requisitos y retos de "Separa Altoke" (la plataforma)

| Problema / reto | Momento de arreglo | Cómo se resuelve (lógica de software) |
| :--- | :--- | :--- |
| **Enfoque móvil exclusivo (mobile-first)**: la web de escritorio suele ser ajena a la dinámica del partido en la cancha y poco usada por los administradores en el campo de juego. | **Pronto** | El desarrollo completo se concentra en la aplicación móvil nativa o híbrida. Tanto la gestión comercial de las empresas como las reservas, búsquedas y emparejamiento de los jugadores se ejecutan únicamente vía app móvil. No existe portal web de cara al usuario. |
| **Masa crítica de usuarios (el huevo y la gallina)**: necesidad de crecer rápidamente la base de jugadores con bajo presupuesto. | **Pronto** | Sistema viral **"jugador invita jugador"** (referido B2C). Enlace dinámico (`/invite/<referral_code>`) autogenerado en el perfil. Si un nuevo usuario se registra con el código y completa su primer partido (individual o grupal), se le otorga saldo virtual a ambos usuarios. |
| **Puenteo de la plataforma**: usuarios que usan la app para descubrir canchas pero luego reservan directo para evitar comisiones. | **Nunca** | La plataforma no restringe el contacto directo de los locales. En su lugar, fomenta el uso de la app ofreciendo el sistema de control de cupos, división del costo del partido, historial de partidos jugados y reputación de asistencia. |
| **Baja participación en calificaciones**: los usuarios olvidan calificar el comportamiento, puntualidad o estado de la cancha tras jugar. | **A futuro** | Gamificación e incentivos directos en la app. Otorgar puntos de experiencia (XP) o tokens virtuales por calificar honestamente un partido, utilizables para redimir recompensas o personalizar su perfil de jugador. |

---

## 2. Modelo lógico, entidades y reglas de negocio

### A. Entidades principales y relaciones del sistema

1. **Configuración de sistema (`int_sistema_configuracion`)**:
   - Almacena parámetros globales de la plataforma "Separa Altoke" (estado operativo del sistema, versiones de la app, comisiones globales si aplican, banderas de mantenimiento).

2. **Geografía y Localización**:
   - **`geografia_peru`**: Tablas maestras de Ubigeo que contienen Departamento, Provincia y Distrito para la ubicación exacta de sedes y segmentación de jugadores.
   - **`pais` y `prefijo_telefonico`**: Tablas maestras para gestionar el código de país (ej. +51 para Perú) necesario en el registro de cuentas (validación SMS/WhatsApp) y estandarización de números de contacto.

3. **Usuarios, personas, empresas y suscripciones**:
   - **`usuario`**: Entidad principal de autenticación (credenciales como email/teléfono, hash de contraseña opcional, rol base `ADMIN | PLAYER`, fecha de registro). El login se implementa con **Google (OAuth 2.0 / OIDC)**: la app móvil obtiene el token de identidad de Google y el backend crea o reconoce al usuario. Todo `usuario` es, sin excepción, una **persona física**; no existen cuentas de acceso corporativas.
   - **`persona`**: Perfil físico del usuario (nombres, apellidos, tipo/número de documento, teléfono de contacto, foto de perfil, reputación de juego). Aplica para jugadores, organizadores, trabajadores de sedes y también quienes administran empresas.
   - **`empresa`**: Entidad corporativa / comercial (RUC/tax ID, razón social, nombre comercial, contacto legal, logotipo). Es la propietaria de los complejos deportivos, pero **no tiene usuario ni login propio**: las **personas registran sus empresas** en la plataforma (quien la registra queda como administradora) y las empresas **contratan a otras personas** para que accedan y operen sus sedes. Toda acción "de una empresa" es en realidad una persona actuando en su nombre bajo un contrato vigente. Las empresas deben poder indicar libremente sus **términos y condiciones** particulares aplicables a sus reservas.
   - **`plan_suscripcion` y `suscripcion_empresa`**: Un `plan_suscripcion` agrupa los beneficios del sistema y tiene una vigencia general (vigente/disponible o no). La `suscripcion_empresa` gestiona por cuánto tiempo está suscrita una empresa a dicho plan (fechas de inicio y fin), controlando así el acceso y operatividad del complejo en la plataforma.

4. **Sedes, contratos y personal**:
   - Una `empresa` gestiona de 1 a N **`sedes`** (complejos deportivos locales con dirección, coordenadas GPS para geolocalización, teléfono de contacto y estado).
   - **`contrato`**: Único puente de acceso de una persona (`persona`) al ámbito de una `empresa`. Define la vigencia y relación de colaboración, a nivel **empresa** (ej. `ADMIN_EMPRESA`, otorgado automáticamente a la persona que registró la empresa) o a nivel **sede** (ej. `ADMIN_SEDE`, `RECEPCIONISTA`, `OPERADOR_MANTENIMIENTO`), con fechas de inicio, fin y estado activo/inactivo. Mediante contratos, una empresa puede habilitar a tantas personas como necesite sin que ninguna tenga credenciales corporativas.

5. **Canchas, servicios y detalles particulares de sede**:
   - **`cancha`**: Pertenece a una `sede`. Define el tipo de deporte (`FUTBOL5`, `FUTBOL7`, `PADEL`, `TENIS`, `BASQUET`), tipo de superficie (`SINTETICO`, `CESPED`, `LOZA`, `PARQUET`), si es techada y si cuenta con iluminación nocturna.
   - **`servicio_sede`**: Catálogo de servicios adicionales del complejo.
     - *Ejemplos*: estacionamiento privado, duchas/vestuarios con agua caliente, quiosco/bar/snack, WiFi gratis, iluminación LED, alquiler de balones y petos, zona de parrilla/barbacoa, cajas de seguridad, vigilancia 24/7.
   - **`detalle_particular_sede`**: Reglas, políticas y cualidades en texto definidas libremente por la empresa para su local.
     - *Ejemplos*: "Se prohíbe el uso de choperas o toperoles de metal", "Es obligatorio presentar DNI físico o digital en recepción antes de ingresar a la cancha", "Prohibido el ingreso de bebidas alcohólicas externas", "Tolerancia de espera máxima: 10 minutos post inicio de hora", "Se permiten mascotas únicamente en áreas abiertas circundantes".

6. **Horarios, tarifas dinámicas y políticas de reserva de la empresa**:
   - **`cancha_horario`**: Configuración de franjas horarias operativas por día de la semana (`day_of_week`: 0=lunes a 6=domingo).
   - **Esquemas de precios**:
     - *Precio fijo*: tarifa uniforme por hora para la cancha sin variación de horario.
     - *Precio por horario (tarifas dinámicas)*: tarifa variante según el día y franja horaria. Permite definir costo estándar (ej. 08:00 - 17:00) y tarifa pico nocturna con recargo por iluminación (ej. 18:00 - 23:00).
   - **Regulación de reservas por la empresa**:
     - *Máximo de horas*: La `empresa` configura el límite máximo de horas continuas que una persona/equipo puede reservar por transacción (ej. máximo 2 horas consecutivas).
     - *Promociones propias de la empresa*: La empresa registra promociones textuales y su vigencia (ej: "20% de descuento de lunes a miércoles de 14:00 a 17:00", con rango de `fecha_inicio` y `fecha_fin`).

7. **Calificaciones y reputación mutua**:
   - **`calificacion_empresa` / `calificacion_sede`** y **`calificacion_cancha`**: Puntuación de 1 a 5 estrellas + comentarios otorgados por los jugadores (`persona`) que asistieron y completaron una reserva.
   - Se requiere un vínculo a una reserva completada (`COMPLETED`) para evitar valoraciones falsas o malintencionadas.

8. **Reservas, formas de reserva, pagos y asistentes**:
   - **Tipos de origen de reserva**:
     - **Reserva por persona**: Una `persona` individual efectúa la reserva para uso privado.
     - **Reserva por equipo**: Un `equipo` (grupo constituido de personas con nombre/escudo) hace la reserva. El vínculo a la persona física responsable de la transacción se almacena en el campo `organizador` (`persona_organizadora_id`).
     - **Reserva por junta (partido abierto / pichanga pública)**: Una `junta` es una invitación pública creada para completar participantes. Cualquier jugador libre puede unirse. La reserva pertenece a la `junta` y el usuario creador (`persona`) se vincula como organizador inicial.
   - **Partidos y asistentes**:
     - Toda reserva implica lógicamente la realización de un **`partido`**.
     - El `partido` se compone de N **`asistentes`** (`partido_asistente`), donde cada asistente es una `persona`. Se registra su estado de asistencia (`CONFIRMADO`, `ASISTIO`, `NO_ASISTIO`).
   - **Pagos múltiples por reserva (`pago_reserva`)**:
     - Una reserva puede liquidarse en 1 a N pagos (abonos parciales o cuotas divididas).
     - Cada pago es realizado por una `persona` (no siempre la misma; ej: el organizador efectúa el pago inicial del 50% como seña/garantía y los demás integrantes aportan cuotas individuales para cubrir el saldo restante).

9. **Sistema de Mensajería y Objetos Interactivos (`chat` y `mensaje`)**:
   - Herramienta para comunicación interna con canales definidos:
     - **Jugador ↔ Jugador**: Mensajes directos para coordinar o conversar.
     - **Jugadores ↔ Equipos**: Comunicación interna de la plantilla del equipo.
     - **Jugadores ↔ Juntas**: Chat temporal para los participantes de una pichanga.
     - **Jugador ↔ Empresa**: Consultas directas, coordinación y envíos de comprobantes.
   - **Mensajes tipo "Objeto"** (Mensajes estructurados en el chat):
     - **Texto / Imagen / Audio**: Elementos de comunicación regular.
     - **Comprobante de Pago**: Un mensaje interactivo (con o sin imagen adjunta) que el sistema reconoce estructuralmente como el envío de un pago total o parcial. Permite a la empresa u organizador de la junta gestionar el cobro nativamente dentro del chat, con un estado de aprobación (Aprobado/Rechazado).
     - **Invitación**: Un bloque interactivo (con botones Aceptar/Rechazar) para unirse a un equipo, una junta o invitar a un amigo al sistema.
     - **Notificación / Resumen de Reserva**: Tarjeta informativa con los detalles de la reserva (cancha, fecha, costo) enviada al chat del usuario o grupo a modo de confirmación, facilitando su revisión y compartición.

---

### B. Estrategias de llegada al mercado e integraciones internas (`int_`)

Las tablas con prefijo `int_` representan módulos y mecanismos internos administrados exclusivamente por el proyecto **"Separa Altoke"** para traccionar usuarios y gestionar la economía de la plataforma:

1. **`int_descuentos`**:
   - Catálogo global de cupones y reglas de descuento expedidos por Separa Altoke (tipo monto fijo o porcentaje, monto máximo de descuento, tope de usos globales y por usuario, fecha inicio/fin de campaña).
2. **`int_programas_referidos`**:
   - Configuración de las campañas de referidos (ej. "Invita a un amigo y ambos reciben $5 / S/. 15 de crédito virtual al completar su 1er partido"). Define los incentivos para el referente y el referido.
3. **`int_codigos_referidos`**:
   - Registra los códigos únicos autogenerados para cada usuario `persona` (ej: `JUAN123`) o códigos promocionales de marketing, permitiendo rastrear conversiones, registros exitosos y recompensas entregadas.
4. **`int_monedero_virtual` / `int_transacciones_saldo`**:
   - Billetera virtual de créditos/puntos internos acumulados por los usuarios a través de referidos, incentivos de gamificación o promociones de la plataforma. Permite aplicar saldo como medio de pago o descuento en futuras reservas.
5. **`int_campanas_marketing`**:
   - Módulo interno de campañas push, SMS o correo para activar horarios con baja ocupación en sedes aliadas o reenganchar jugadores inactivos.

---

### C. Reglas algorítmicas y validaciones principales

1. **Validación anticolisión de horarios**:
   Antes de registrar una reserva en estado `PENDING` o `CONFIRMED`, el backend debe asegurar que no existan colisiones horarias en la misma cancha y fecha:
   $$\text{reserva\_existente.inicio} < \text{nueva.fin} \quad \text{y} \quad \text{reserva\_existente.fin} > \text{nueva.inicio}$$

2. **Cálculo de cuota proporcional en juntas**:
   Para reservas de tipo junta (partido abierto), el sistema calcula el valor sugerido por integrante:
   $$\text{Precio por jugador} = \frac{\text{Precio total de la cancha}}{\text{Cupo máximo de jugadores}}$$

3. **Flujo de estados de la reserva**:
   - `PENDING`: Creada en la app a la espera de confirmación de pago externo. Cuenta con un tiempo de expiración configurable (ej. liberación automática tras 15 o 30 minutos sin comprobante).
   - `CONFIRMED`: El administrador/recepcionista del complejo valida la recepción del dinero y marca la reserva como confirmada.
   - `CANCELLED`: Cancelada por la empresa o usuario según políticas de cancelación. Libera inmediatamente la cancha.
   - `COMPLETED`: Horario del partido culminado. Desbloquea el módulo de calificaciones para jugadores y canchas.

---

### D. Aspectos adicionales faltantes a considerar (recomendaciones de arquitectura)

Al evaluar el dominio de negocio, se han identificado las siguientes reglas y entidades complementarias necesarias para evitar vacíos operativos en el software:

1. **Bloqueo por mantenimiento u operación interna (`cancha_bloqueo`)**:
   - Las empresas necesitan reservar franjas horarias por mantenimiento, reparación, mal clima o eventos propios de la sede sin simular una reserva de cliente.
2. **Temporizador de reserva y estado `PENDIENTE_PAGO` (bloqueo temporal)**:
   - Implementar un bloqueo temporal corto (ej. 15 minutos) durante el flujo de creación para evitar que dos usuarios seleccionen el mismo turno simultáneamente antes de subir su comprobante.
3. **Políticas de cancelación, devolución y tolerancia**:
   - Definir parámetros por sede: tiempo límite para cancelar sin penalidad (ej. hasta 24h antes) y el destino del pago abonado (devolución externa o saldo a favor en la sede).
4. **Índice de confiabilidad y control de ausentismo ("plantones")**:
   - Registrar asistencias no cumplidas en las `juntas` o reservas. Un usuario con alto índice de ausentismo sin aviso debe ser restringido de unirse a nuevas juntas públicas.
5. **Fotocopia de precios en reservas (`historico_precio`)**:
   - La reserva debe guardar el costo por hora pactado en la transacción original. Cambios futuros en las tarifas dinámicas de la cancha no deben alterar el monto de reservas pasadas o pendientes.
6. **Validación de cupos mínimos y posiciones por deporte en juntas**:
   - Restringir la junta al cupo exacto del deporte (ej. fútbol 5 = máx 10 personas, pádel = máx 4 personas). Opcionalmente permitir especificar roles buscados (ej: "Se busca 1 arquero").
7. **Niveles de permiso en contratos de personal**:
   - Especificar en la entidad `contrato` los privilegios del trabajador y su alcance (ej. `ADMIN_EMPRESA` —otorgado a la persona que registró la empresa— puede crear sedes, editar precios globales y contratar personal; `ADMIN_SEDE` puede editar precios y cancelar; `RECEPCIONISTA` solo puede confirmar pagos y ver calendario).
8. **Regla de acumulabilidad de cupones**:
   - Determinar si un cupón interno de Separa Altoke (`int_descuentos`) se puede aplicar en reservas que ya cuentan con una promoción activa de la empresa.
9. **Tiempo Real y WebSockets**:
   - Para soportar el sistema de chat nativo, notificaciones instantáneas de pago y actualizaciones en vivo de cupos en las juntas, se requerirá infraestructura de conexión bidireccional (ej. WebSockets, Server-Sent Events, o servicios como Firebase/Pusher).
10. **Almacenamiento Interno de Archivos**:
    - Dado que los datos se manejarán internamente (sin AWS/GCP), los comprobantes, audios y fotos de sedes deberán persistirse en el sistema de archivos (File System) del servidor. Es recomendable usar un servidor web optimizado para despachar archivos estáticos (ej. Nginx) y, para no perder las ventajas de escalabilidad, se sugiere implementar un Object Storage de código abierto autoalojado (como **MinIO**). Es obligatorio configurar políticas estrictas de copias de seguridad (backups) físicas para este volumen de disco.
11. **Manejo de Tareas Asíncronas y Colas (Workers/Cron)**:
    - El sistema tiene varias reglas dependientes del tiempo: "liberar la cancha si el pago no se confirma en 15 min", "enviar push 2 horas antes del partido", "vencer suscripciones". Esto requiere un gestor de colas de tareas en segundo plano (ej. Celery, RabbitMQ, BullMQ o AWS EventBridge) desconectado del hilo principal de peticiones.
12. **Auditoría y Trazabilidad (Audit Logs)**:
    - Implementar un registro inmutable (tabla de auditoría) para acciones críticas. Se debe rastrear de forma exacta quién (ID del recepcionista/admin) canceló una reserva, aprobó un comprobante o modificó un precio, y en qué fecha/hora. Esto es crítico para la resolución de disputas con el usuario final y para auditorías internas de las empresas.
13. **Estandarización de Zonas Horarias (Timezones)**:
    - Es vital que la capa de persistencia (Base de Datos) guarde todas las fechas y horas (horarios de canchas, reservas, mensajes) estrictamente en formato UTC. La conversión a la zona horaria local (`America/Lima`) debe ser responsabilidad exclusiva del frontend/app móvil para evitar bugs lógicos ante futuras expansiones geográficas.
14. **Políticas de Retención y Purga (Data Archiving)**:
   - Los chats masivos temporales (juntas) y las imágenes de comprobantes consumirán mucho almacenamiento rápidamente. Se debe diseñar una estrategia para archivar (mover a storage más barato) o purgar datos transaccionales históricos "fríos" mayores a N meses, evitando encarecer y degradar la base de datos principal.
15. **Seguridad Multi-inquilino (Multi-tenant Security)**:
    - Al ser una plataforma B2B2C, a nivel de backend (API) deben existir middlewares estrictos de autorización (RBAC) para garantizar que un token JWT de una persona (jugador o trabajadora con contrato en la "Empresa A") no pueda leer chats, confirmar reservas, ni consultar los balances financieros de la "Empresa B" manipulando los IDs de la URL. El token siempre identifica a una `persona`; el acceso B2B se valida contra sus `contrato` vigentes.
