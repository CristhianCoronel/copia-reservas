# Apuntes: reglas de negocio y flujos del sistema - "Separa Altoke"

Este documento contiene la matriz de problemáticas clasificadas por segmento (empresas B2B, jugadores B2C y el proyecto "Separa Altoke") con su planificación de resolución en el software, seguido de las reglas lógicas y matemáticas del negocio.

---

## 1. Matriz de problemáticas y plan de solución

### A. Empresas (dueños y administradores de complejos deportivos)

| Problema / dolor | Momento de arreglo | Cómo se resuelve (lógica de software) |
| :--- | :--- | :--- |
| **Doble reserva o sobreposición**: manejo ineficiente de agendas en papel, pizarras o Excel manuales por parte del personal. | **Pronto** | Base de datos relacional con restricciones transaccionales. Los puntos de acceso de reserva efectúan un bloqueo optimista y validación horaria estricta a nivel de consulta SQL antes de pasar a estado `PENDIENTE_PAGO` o `CONFIRMADA`. |
| **Cancelaciones de última hora**: pérdida económica por turnos reservados que se cancelan fuera de las políticas de la sede. | **Pronto** | La reserva se crea en estado `PENDIENTE_PAGO`. El usuario tiene un tiempo límite configurable para enviar un comprobante por un canal externo o pagar con su monedero virtual. La sede valida cada comprobante externo de forma individual; el sistema libera las reservas que vencen sin cumplir el pago requerido. |
| **Horas muertas (baja demanda)**: dificultad para rentabilizar la infraestructura en horarios diurnos o días laborables. | **Nunca** | Es responsabilida de la empresa |
| **Staff poco tecnológico**: resistencia del personal de los complejos a utilizar sistemas informáticos complejos. | **Pronto** | Interfaz de administración integrada en la misma aplicación móvil (app), minimalista y adaptada a celulares. Permite registrar una reserva manual (por llamada o presencial) en un calendario gráfico interactivo en pocos toques, eliminando la necesidad de una computadora. |
| **Falta de visibilidad de sus locales**: complejos nuevos o pequeños que no pueden captar nuevos usuarios de forma constante. | **Después** | Motor de búsqueda geolocalizado en la PWA móvil cuando la sede tenga coordenadas registradas. Las coordenadas solo pueden ser registradas por cuentas empresariales con plan de pago. |
| **Pasarelas de pago integradas**: dificultad para integrar APIs bancarias al inicio del proyecto. | **A futuro** | Desde el lanzamiento se admite el pago con el monedero virtual interno. También se permiten transferencias externas a la empresa: el cliente envía un comprobante y la sede valida cada transacción antes de reconocerla como pago. |

---

### B. Jugadores (clientes y usuarios de las canchas)

| Problema / dolor | Momento de arreglo | Cómo se resuelve (lógica de software) |
| :--- | :--- | :--- |
| **Equipos incompletos o falta de rival**: dificultad para coordinar con amigos y frustración por cancelar partidos por falta de quórum. | **Pronto** | Lógica de **reserva grupal (partido abierto)**. El organizador crea la reserva y el backend genera una `junta` expuesta en la PWA para que otros jugadores locales se unan hasta llenar el cupo máximo (`cupo_maximo_jugadores`). |
| **Fricción al dividir y cobrar el costo del turno**: el organizador debe cobrar manualmente a cada participante y consolidar el dinero. | **Desde el lanzamiento** | El backend calcula el importe sugerido por jugador. Cada participante puede aportar desde su monedero virtual; también puede pagar externamente y enviar un comprobante. La junta muestra el estado de cada aporte, pero la sede solo valida los comprobantes externos que le correspondan. |
| **Desequilibrio de nivel competitivo**: jugar partidos aburridos contra rivales de nivel muy diferente (muy superior o inferior). | **Nunca** | Es responsabilidad del usuario |
| **Información de canchas desactualizada**: llegar al local y encontrar mala superficie, falta de estacionamiento o sin iluminación. | **Después** | Campos específicos para indicar cualidades físicas y servicios de la sede. No se implementan calificaciones, comentarios ni reputación: la plataforma no aborda ese problema porque dependería por completo de la honestidad de las personas. |
| **Falta de seriedad o tardanzas de compañeros**: jugadores que se comprometen pero no van o llegan tarde. | **Nunca** | No se implementará un sistema de calificación, reputación, medición de asistencia ni penalización de jugadores. |
| **Integración de pagos en línea en partidos grupales**: automatizar el recaudo individual de la cuota de cada jugador mediante la app. | **Desde el lanzamiento** | Se permite transferir valor desde el monedero virtual de cada jugador. También se mantienen los pagos externos mediante comprobantes, que la sede debe validar uno por uno. |
| **Desafíos y retos entre equipos**: equipos formados que buscan desafiar formalmente a otros equipos a jugar. | **A futuro lejano / Nunca** | Es una necesidad real de los jugadores, pero no se implementará un flujo nativo (objeto tipo Reto) por ahora debido a la alta complejidad técnica de coordinar agendas de dos grupos distintos, elegir una cancha neutral y unificar el pago de ambos equipos. Se deja para que lo coordinen de forma externa. |

---

### C. Requisitos y retos de "Separa Altoke" (la plataforma)

| Problema / reto | Momento de arreglo | Cómo se resuelve (lógica de software) |
| :--- | :--- | :--- |
| **Enfoque móvil (mobile-first)**: la web de escritorio suele ser ajena a la dinámica del partido en la cancha y poco usada por los administradores. | **Pronto** | El producto se desarrolla como una **PWA diseñada para celulares**. La gestión empresarial, reservas, búsquedas y juntas se ejecutan en la PWA, que puede instalarse desde el navegador. Por ello los enlaces públicos son válidos: permiten consultar una reserva, junta o equipo y continuar el flujo en el navegador o en la PWA, sin depender de una aplicación nativa. |
| **Masa crítica de usuarios (el huevo y la gallina)**: necesidad de crecer rápidamente la base de jugadores con bajo presupuesto. | **Pronto** | Sistema viral **"jugador invita jugador"** (referido B2C). Enlace dinámico (`/invite/<referral_code>`) autogenerado en el perfil. Si un nuevo usuario se registra con el código y completa su primer partido (individual o grupal), se les otorgan cupones de descuento u otros beneficios a ambos. |
| **Puenteo de la plataforma**: usuarios que usan la app para descubrir canchas pero luego reservan directo para evitar comisiones. | **Nunca** | La plataforma no restringe el contacto directo de los locales. En su lugar, fomenta el uso de la app ofreciendo el sistema de control de cupos, división del costo del partido y el historial de partidos jugados. |
| **Información subjetiva sobre jugadores y sedes**: los reportes dependen de la honestidad de las personas y pueden generar conflictos. | **Nunca** | No se implementa ningún sistema de calificaciones, comentarios, reputación, XP o ranking. La plataforma solo registra hechos operativos necesarios para reservas y pagos. |
| **Métricas de contacto de WhatsApp**: necesidad de saber cuántos usuarios intentan contactar a las empresas para demostrar el valor de la plataforma. | **Pronto** | Los botones para contactar por WhatsApp incluirán rastreo (tracking) de clics a nivel de frontend/backend, permitiendo saber qué números son más pulsados y medir la conversión (empresas contactadas a través de la app). |

---

## 2. Modelo lógico, entidades y reglas de negocio

### A. Entidades principales y relaciones del sistema

> **Regla de Arquitectura (Nomenclatura de tablas de sistema):** Todas las tablas gestionadas exclusivamente por la administración de Separa Altoke, incluidos catálogos maestros, configuración, campañas y programas internos, deben llevar el prefijo `_` (por ejemplo, `_deporte`, `_servicio`, `_sistema_configuracion`). Las tablas operativas de empresas, sedes, personas y reservas no llevan ese prefijo.

1. **Configuración de sistema (`_sistema_configuracion`)**:
   - Almacena parámetros globales de la plataforma "Separa Altoke" (estado operativo del sistema, versiones de la app, comisiones globales si aplican, banderas de mantenimiento).

2. **Geografía y Localización**:
   - **`_geografia_peru`**: Tablas maestras de Ubigeo que contienen Departamento, Provincia y Distrito para la ubicación exacta de sedes y segmentación de jugadores.
   - **`_pais`**: Tabla maestra para gestionar los países disponibles, que incluye el código de país y la longitud esperada del celular. Esto es necesario para validar números y estandarizar contactos.

3. **Usuarios, personas, empresas y suscripciones**:
    - **`usuario`**: Entidad principal de autenticación. El inicio de sesión y el registro se permiten mediante Google (OAuth 2.0 / OIDC) o mediante correo electrónico y contraseña. Todo `usuario` es una persona física; no existen cuentas de acceso corporativas.
       - Después de crear la cuenta, el usuario puede navegar, pero no puede crear reservas, equipos, juntas ni registrar u operar empresas hasta registrar y verificar un número celular mediante SMS.
   - **`persona`**: Perfil físico del usuario (nombres, apellidos, tipo/número de documento, teléfono de contacto, foto de perfil). Aplica para jugadores, organizadores, trabajadores de sedes y también quienes administran empresas.
   - **`empresa`**: Entidad corporativa / comercial (RUC/tax ID, razón social, nombre comercial, contacto legal, logotipo). Es la propietaria de los complejos deportivos, pero **no tiene usuario ni login propio**: las **personas registran sus empresas** en la plataforma (quien la registra queda como administradora) y las empresas **contratan a otras personas** para que accedan y operen sus sedes. Toda acción "de una empresa" es en realidad una persona actuando en su nombre bajo un contrato vigente. Las empresas deben poder indicar libremente sus **términos y condiciones** particulares aplicables a sus reservas.
   - **`_plan_suscripcion` y `suscripcion_empresa`**: Un `_plan_suscripcion` agrupa los beneficios del sistema y tiene una vigencia general (vigente/disponible o no). La `suscripcion_empresa` gestiona por cuánto tiempo está suscrita una empresa a dicho plan (fechas de inicio y fin), controlando así el acceso y operatividad del complejo en la plataforma.

4. **Sedes, contratos y personal**:
   - Una `empresa` gestiona de 1 a N **`sedes`** (complejos deportivos locales con dirección, coordenadas GPS opcionales, teléfono de contacto y estado). Solo una cuenta empresarial con plan de pago puede registrar coordenadas.
   - **`contrato`**: Único puente de acceso de una persona (`persona`) al ámbito de una `empresa`. Define la vigencia y relación de colaboración, a nivel **empresa** (ej. `ADMIN_EMPRESA`, otorgado automáticamente a la persona que registró la empresa) o a nivel **sede** (ej. `ADMIN_SEDE`, `RECEPCIONISTA`, `OPERADOR_MANTENIMIENTO`), con fechas de inicio, fin y estado activo/inactivo. Mediante contratos, una empresa puede habilitar a tantas personas como necesite sin que ninguna tenga credenciales corporativas.

5. **Canchas, deportes, modalidades y servicios**:
   - **Catálogo de Deportes**: Los deportes disponibles (Fútbol, Pádel, Tenis, etc.) son definidos exclusivamente por la administración del sistema a través de un catálogo maestro.
   - **`cancha`**: Pertenece a una `sede` y se asocia a **un único deporte** del catálogo. 
     - *Regla de Multideporte:* Si una misma cancha física se usa para más de un deporte (ej. loza deportiva para Básquet y Fútbol), la sede debe registrarla varias veces (una por cada deporte) y configurarla para que se solape a sí misma, bloqueando las demás opciones cuando se reserve.
     - *Modalidades:* Valores como "Fútbol 5", "Fútbol 7" o "Fútbol 11" **no son deportes**, sino etiquetas de modalidades. La sede asigna libremente las modalidades a la cancha a través de un arreglo.
     - *Características físicas:* Se mantienen como un texto u objeto libre para darle mayor libertad descriptiva a la empresa.
   - **`servicio_sede`**: Vincula a la sede con un **catálogo de servicios maestro**. Este catálogo de comodidades está gestionado exclusivamente por la administración de la plataforma "Separa Altoke" para mantener la estandarización. Las sedes solo eligen de la lista.
     - *Ejemplos*: estacionamiento privado, duchas/vestuarios con agua caliente, quiosco/bar/snack, WiFi gratis, iluminación LED, alquiler de balones y petos, zona de parrilla/barbacoa, cajas de seguridad, vigilancia 24/7.
   - **`detalle_particular_sede`**: Reglas, políticas y cualidades en texto definidas libremente por la empresa para su local.
     - *Ejemplos*: "Se prohíbe el uso de choperas o toperoles de metal", "Es obligatorio presentar DNI físico o digital en recepción antes de ingresar a la cancha", "Prohibido el ingreso de bebidas alcohólicas externas", "Tolerancia de espera máxima: 10 minutos post inicio de hora", "Se permiten mascotas únicamente en áreas abiertas circundantes".

6. **Horarios, tarifas dinámicas y políticas de reserva de la empresa**:
   - **Horario de Sede vs Horario de Cancha**:
     - La sede configura su horario de atención general (días y horas operativas) y excepciones positivas/negativas (ej. feriados, aperturas especiales los domingos). Este horario es el límite absoluto de disponibilidad.
     - `cancha_horario` define las horas particulares de operación y precios dinámicos *dentro* del marco de atención de la sede. Si una cancha está en mantenimiento diario por unas horas, esas horas simplemente no existen en su tabla de tarifas, invalidando las reservas en ese tramo.
   - **Esquemas de precios**:
     - *Precio fijo*: tarifa uniforme por hora para la cancha sin variación de horario.
     - *Precio por horario (tarifas dinámicas)*: tarifa variante según el día y franja horaria. Permite definir costo estándar (ej. 08:00 - 17:00) y tarifa pico nocturna con recargo por iluminación (ej. 18:00 - 23:00).
   - **Regulación de reservas por la empresa**:
     - *Máximo de horas*: La `empresa` configura el límite máximo de horas continuas que una persona/equipo puede reservar por transacción (ej. máximo 2 horas consecutivas).
     - *Promociones propias de la empresa*: La empresa registra promociones textuales y su vigencia (ej: "20% de descuento de lunes a miércoles de 14:00 a 17:00", con rango de `fecha_inicio` y `fecha_fin`).



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

### B. Estrategias de llegada al mercado e integraciones internas

Las tablas con prefijo `_` representan módulos y mecanismos internos administrados exclusivamente por el proyecto **"Separa Altoke"** para traccionar usuarios y gestionar la economía de la plataforma:

1. **`_descuentos`**:
   - Catálogo global de cupones y reglas de descuento expedidos por Separa Altoke (tipo monto fijo o porcentaje, monto máximo de descuento, tope de usos globales y por usuario, fecha inicio/fin de campaña).
2. **`_programas_referidos`**:
   - Configuración de las campañas de referidos (ej. "Invita a un amigo y ambos reciben un cupón de descuento al completar su 1er partido"). Define los incentivos para el referente y el referido.
3. **`_codigos_referidos`**:
   - Registra los códigos únicos autogenerados para cada usuario `persona` (ej: `JUAN123`) o códigos promocionales de marketing, permitiendo rastrear conversiones, registros exitosos y recompensas entregadas.
4. **Gestión del dinero virtual y pagos externos (Política Core)**:
   - Desde el lanzamiento, "Separa Altoke" soporta un monedero virtual para los jugadores. El saldo virtual puede utilizarse para pagar reservas, aportar a juntas, completar pagos y recibir reembolsos internos.
   - La plataforma no considera como crédito del monedero los pagos externos realizados directamente a una empresa. En esos casos, el cliente envía un comprobante y la sede valida cada transacción individualmente.
   - Un pago externo validado y un pago con monedero son formas distintas de pago, pero ambos pueden contribuir al umbral requerido para confirmar una reserva. La plataforma registra el origen, importe, estado y fecha de cada pago.
   - La sede no valida los créditos internos del monedero; solo valida comprobantes de pagos externos.
5. **`_campanas_marketing`**:
   - Módulo interno de campañas push, SMS o correo para activar horarios con baja ocupación en sedes aliadas o reenganchar jugadores inactivos.

---

### C. Reglas algorítmicas y validaciones principales

1. **Validación anticolisión de horarios y solapamiento cruzado**:
   Antes de registrar una reserva en estado `PENDIENTE_PAGO` o `CONFIRMADA`, el backend debe verificar:
   - Que no existan colisiones horarias en la misma cancha y fecha:
     $$\text{reserva\_existente.inicio} < \text{nueva.fin} \quad \text{y} \quad \text{reserva\_existente.fin} > \text{nueva.inicio}$$
   - Que la cancha solicitada **no bloquee el espacio** de otra cancha ya reservada, ni esté bloqueada por una reserva en una cancha contenedora (canchas que comparten el mismo espacio físico). Las canchas afectadas desaparecen de la disponibilidad mientras dure el turno de la cancha que originó el bloqueo.

2. **Cálculo de cuota proporcional en juntas**:
   Para reservas de tipo junta (partido abierto), el sistema calcula el valor sugerido por integrante:
   $$\text{Precio por jugador} = \frac{\text{Precio total de la cancha}}{\text{Cupo máximo de jugadores}}$$

3. **Flujo de estados de la reserva**:
    - `PENDIENTE_PAGO`: Creada y bloqueada temporalmente mientras espera alcanzar el pago requerido. El plazo de expiración es configurable por sede. Puede recibir pagos del monedero virtual o comprobantes externos.
    - `CONFIRMADA`: Se alcanza el porcentaje o monto de adelanto configurado por la sede. Si la sede exige, por ejemplo, el 20 %, la reserva cambia automáticamente a `CONFIRMADA` cuando la suma de pagos aplicables alcanza ese umbral. Los comprobantes externos deben estar previamente validados por la sede; los pagos del monedero se consideran válidos según el registro interno de transacciones.
    - `CANCELADA`: Cancelada por la empresa o el usuario según las políticas de la sede. Libera inmediatamente la cancha y activa las reglas de devolución aplicables.
    - `COMPLETADA`: El horario del partido culminó y la reserva quedó pagada conforme a las reglas aplicables. No habilita sistemas de calificación ni reputación.

---

### D. Aspectos adicionales faltantes a considerar (recomendaciones de arquitectura)

Al evaluar el dominio de negocio, se han identificado las siguientes reglas y entidades complementarias necesarias para evitar vacíos operativos en el software:

1. **Bloqueo por mantenimiento u operación interna (`cancha_bloqueo`)**:
   - Las empresas necesitan reservar franjas horarias por mantenimiento, reparación, mal clima o eventos propios de la sede sin simular una reserva de cliente.
2. **Temporizador de reserva y configuración dinámica de cobros (`PENDIENTE_PAGO`)**:
   - Implementar un bloqueo temporal durante el flujo de creación. El tiempo límite de expiración para confirmar el pago, así como el porcentaje o monto fijo exigido por adelantado, **no es global, sino que es configurado por cada sede** (`reserva_minutos_espera`, `tipo_adelanto_requerido`, `valor_adelanto_requerido`). Esto permite que un local exija 50 % con 15 minutos de plazo y otro exija 0 %, pasando la reserva directamente a `CONFIRMADA`.
   - La sede valida comprobante por comprobante cuando el pago es externo. No valida ni aprueba los créditos generados por transacciones internas del monedero virtual.
3. **Políticas de cancelación, devolución y tolerancia**:
   - Definir parámetros por sede: tiempo límite para cancelar sin penalidad (ej. hasta 24h antes) y el destino del pago abonado (devolución externa coordinada directamente por la empresa).
4. **Ausencia de reputación y calificaciones**:
   - **Regla principal:** El sistema no aborda calificaciones de jugadores, sedes o partidos, comentarios públicos, reputación, puntuaciones, XP, rankings ni métricas de asistencia. Estas funciones dependerían por completo de la honestidad de las personas y podrían ser manipuladas mediante falsos reportes, amiguismos o venganzas.
   - **`equipo`**: Agrupación visual y de chat interno. Permite reservar a nombre de un equipo, pero no posee reputación, puntuación ni historial competitivo.
5. **Dinámica de Chat de Equipo (RSVP y Pagos)**:
   - Los miembros del equipo pueden compartir una reserva (`tipo_origen = EQUIPO`) en el chat grupal como una tarjeta interactiva.
   - **RSVP:** Los miembros pueden confirmar su asistencia, marcar ausencia o abstenerse.
   - **Transparencia de Pagos:** Para incentivar la confianza y los abonos directos, el chat cruzará los datos de los miembros con la tabla `pago_reserva`. Así, la tarjeta compartida mostrará en tiempo real quiénes van y cuánto dinero exacto ha aportado cada uno a la sede, facilitando la auditoría interna del grupo.
6. **Juntas (partidos abiertos) y monedero virtual**:
   - **Monedero desde el lanzamiento:** La plataforma cuenta con un monedero virtual interno. Los jugadores pueden recibir saldo, utilizarlo para reservas y juntas, y recibir reembolsos internos cuando corresponda. Las operaciones de recarga y retiro deben quedar registradas, aunque cualquier retiro hacia una cuenta bancaria pueda quedar fuera de la interfaz inicial.
   - **Lógica de juntas:** Los usuarios pueden crear juntas para dividir el costo de una cancha. El sistema descuenta o retiene el aporte virtual de cada jugador. Si se alcanza el importe requerido, confirma la reserva. Si el plazo expira sin alcanzar la meta, reembolsa automáticamente los aportes virtuales.
   - Los pagos externos no ingresan al monedero. Se registran como pagos de la reserva solo después de que la sede valide su comprobante.
7. **Fotocopia de precios en reservas (`historico_precio`)**:
   - La reserva debe guardar el costo por hora pactado en el momento de crearla. El precio queda congelado desde ese instante; cambios futuros en las tarifas dinámicas de la cancha no alteran reservas pasadas, pendientes o confirmadas.
8. **Niveles de permiso en contratos de personal (Alcance Dinámico)**:
   - La tabla `contrato` utiliza un sistema de **rol único con alcance dinámico**.
   - El campo `rol` define qué puede hacer el usuario (`ADMINISTRADOR`, `RECEPCIONISTA`, `OPERADOR_MANTENIMIENTO`).
   - El campo `sede_id` define **dónde** lo puede hacer: si tiene un UUID específico, el trabajador opera solo en ese local. Si es nulo, el trabajador tiene alcance **Global** (aplica a todas las sedes presentes y futuras de la empresa).
9. **Regla de acumulabilidad de cupones**:
   - Determinar si un cupón interno de Separa Altoke (`_descuentos`) se puede aplicar en reservas que ya cuentan con una promoción activa de la empresa.
10. **Tiempo Real y WebSockets**:
    - Para soportar el sistema de chat nativo, notificaciones instantáneas de pago y actualizaciones en vivo de cupos en las juntas, se requerirá infraestructura de conexión bidireccional (ej. WebSockets, Server-Sent Events, o servicios como Firebase/Pusher).
11. **Almacenamiento Interno de Archivos**:
    - Dado que los datos se manejarán internamente (sin AWS/GCP), los comprobantes, audios y fotos de sedes deberán persistirse en el sistema de archivos (File System) del servidor. Es recomendable usar un servidor web optimizado para despachar archivos estáticos (ej. Nginx) y, para no perder las ventajas de escalabilidad, se sugiere implementar un Object Storage de código abierto autoalojado (como **MinIO**). Es obligatorio configurar políticas estrictas de copias de seguridad (backups) físicas para este volumen de disco.
12. **Manejo de Tareas Asíncronas y Colas (Workers/Cron)**:
    - El sistema tiene varias reglas dependientes del tiempo: "liberar la cancha si el pago no se confirma en 15 min", "enviar push 2 horas antes del partido", "vencer suscripciones". Esto requiere un gestor de colas de tareas en segundo plano (ej. Celery, RabbitMQ, BullMQ o AWS EventBridge) desconectado del hilo principal de peticiones.
13. **Auditoría y Trazabilidad (Audit Logs)**:
    - Implementar un registro inmutable (tabla de auditoría) para acciones críticas. Se debe rastrear de forma exacta quién (ID del recepcionista/admin) canceló una reserva, aprobó un comprobante o modificó un precio, y en qué fecha/hora. Esto es crítico para la resolución de disputas con el usuario final y para auditorías internas de las empresas.
14. **Estandarización de Zonas Horarias (Timezones)**:
    - Es vital que la capa de persistencia (Base de Datos) guarde todas las fechas y horas (horarios de canchas, reservas, mensajes) estrictamente en formato UTC. La conversión a la zona horaria local (`America/Lima`) debe ser responsabilidad exclusiva del frontend/app móvil para evitar bugs lógicos ante futuras expansiones geográficas.
15. **Seguridad Multi-inquilino (Multi-tenant Security)**:
    - Al ser una plataforma B2B2C, a nivel de backend (API) deben existir middlewares estrictos de autorización (RBAC) para garantizar que un token JWT de una persona (jugador o trabajadora con contrato en la "Empresa A") no pueda leer chats, confirmar reservas, ni consultar los balances financieros de la "Empresa B" manipulando los IDs de la URL. El token siempre identifica a una `persona`; el acceso B2B se valida contra sus `contrato` vigentes.
16. **Gestión de Casuísticas Reales de Sede (Encuestas)**:
   - **Lista Negra por Sede:** Las sedes pueden bloquear a clientes problemáticos (`sede_lista_negra`). Un usuario en la lista negra de una sede dejará de ver a dicha sede en el buscador y el sistema rechazará sus intentos de reserva. Esta medida operativa no constituye un sistema de reputación o calificación.
    - **Libreta de Saldos a Favor:** Ante cancelaciones sin devolución de dinero, la sede puede anotar un monto a favor (`sede_saldo_cliente`). *Requisito de UI:* Debe existir un apartado visible en la app tanto para el cliente (lectura) como para la empresa (edición) que muestre este saldo.
    - **Extensión Horaria Efectiva:** Promociones tipo "acumula 6 horas y la séptima es gratis" son reglas textuales de la sede. Para ejecutarlas, el admin puede modificar la **hora de fin efectiva** de una reserva sin alterar la **hora solicitada**, extendiendo el bloqueo de la cancha sin requerir crear reservas fantasmas.
17. **Verificación de Cuentas de Usuario (SMS)**:
    - Las cuentas nuevas deben verificar su número telefónico.
    - **Limitantes de cuentas no verificadas:** No pueden crear reservas (el flujo les exige verificar), no pueden crear equipos, y no pueden registrar empresas ni operar sedes. Operan en modo de solo lectura y navegación.
18. **Aprobación Manual de Empresas**:
    - Las empresas se registran con estado `PENDIENTE`. Sus sedes no son visibles en el buscador de la app hasta que la administración central verifique la legitimidad y cambie el estado a `APROBADA`.
19. **Modelo de Suscripción (Gratis vs Premium)**:
    - **Cuenta Premium (De Pago):**
      - Subir hasta 5 fotos por cancha.
      - Definir las coordenadas de la sede para que la gente vea la distancia.
      - Poner su enlace de Google Maps para que con un clic el usuario lo vea en el mapa.
      - Recibir notificaciones por correo y en la aplicación de una solicitud de reserva.
      - Registrar horarios de hasta los 14 días siguientes.
    - **Cuenta Gratuita (Freemium):**
      - Sin capacidad de subir fotos de la cancha.
      - Sin soporte para coordenadas de distancia.
      - Sin enlace a Google Maps.
      - Sin notificaciones por correo/app de reservas.
      - Solo pueden registrar horarios para el día de hoy, mañana y pasado mañana (3 días máximo).
      - **Sin creación de trabajadores:** La cuenta gratuita solo permite un único administrador global. Para que los trabajadores de la sede operen el sistema, el dueño se ve obligado a compartir sus credenciales (perdiendo capacidad de auditoría), fomentando la transición al plan de pago para obtener cuentas de acceso (contratos) separadas.
20. **Campaña de Referidos B2B**:
    - Las empresas pueden generar enlaces de invitación para compartirlos con sus clientes (ej. a través de SMS o WhatsApp). 
    - **Incentivo de captación:** Durante las campañas de expansión, los 3 primeros usuarios que se registren en la plataforma a través del enlace de referidos de una empresa, recibirán de parte de la plataforma un descuento aplicable exclusivamente en su primera reserva con dicha empresa. La empresa no asume un descuento eterno, es una táctica de un solo uso para migrar a sus clientes a la app.
    - *Validación:* La comprobación de si el descuento ya fue usado se gestiona exclusivamente a nivel de lógica de backend (cruzando el historial de reservas de ese usuario con esa empresa). No requiere flags en base de datos.
21. **Nombres de Usuario (Username) Públicos**:
    - Todo usuario registrado debe elegir un `username` único.
    - **Objetivo de privacidad:** Al invitar a alguien a un equipo o junta, la búsqueda se hará a través del `username` en lugar de exponer o tener que adivinar correos electrónicos o números telefónicos, agilizando la conexión social en la plataforma sin revelar datos sensibles.
22. **Viralidad Estructural (Referidos y Enlaces Públicos)**:
    - **Sistema de Referidos (B2C):** Todo usuario al registrarse recibe automáticamente un `codigo_referido` (6 caracteres hexadecimales). Los nuevos usuarios pueden ingresar este código al crear su cuenta.
      - *Recompensa Condicionada:* Si el usuario invitado completa exitosamente una reserva (`estado = CONFIRMADA`) dentro de su primer mes de registro, el usuario original que lo invitó recibirá automáticamente un cupón de descuento para sus próximos partidos. Esta mecánica asegura retornos reales de inversión y evita el fraude por creación masiva de cuentas vacías.
    - **Share Tokens (Enlaces Compartibles):** Entidades grupales como *Equipos*, *Juntas* y *Reservas* exponen un `share_token` (token aleatorio sin prefijos) para generar URLs públicas. Estas URLs permiten a usuarios sin cuenta visualizar información de forma segura (ej. ver el "boarding pass" de una reserva con la dirección de la sede) o registrarse e unirse al evento inmediatamente, protegiendo las llaves primarias (UUIDs) de la base de datos contra accesos no autorizados.
23. **Campañas de Lanzamiento y Retención B2C**:
    - **Recompensa a "Early Adopters" (Fricción contra multicuentas):** Para desincentivar la creación de múltiples cuentas falsas buscando el descuento de primera reserva, los usuarios que se registren durante la primera semana de lanzamiento recibirán automáticamente un descuento sustancial aplicable **únicamente en su cuarta reserva**. Este cupón tendrá una validez de 1 mes, obligándolos a madurar su cuenta real y generar volumen de transacciones antes de obtener el premio.
    - **Lealtad del Capitán (Estrategia Sugerida):** Dado que en cada grupo siempre hay un "organizador" (el que se encarga de separar la cancha), la plataforma puede implementar a futuro un cupón automático de "La 10ma cancha invita la casa". Si un jugador acumula 9 reservas organizadas y concretadas a su nombre, la décima reserva (en cualquier sede) tiene un descuento equivalente al 100% asumido por Separa Altoke. Esto fideliza agresivamente al "capitán" para que obligue a sus amigos a usar la app en lugar de llamar directamente por teléfono a la sede.
