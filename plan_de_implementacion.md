# Arquitectura del Sistema: Web de Impresiones 3D

Este documento detalla la arquitectura propuesta para la aplicación web de gestión de impresiones 3D. Se ha creado la carpeta principal del proyecto (`Impresiones 3D`) en la ruta especificada.

## ⚠️ User Review Required

Por favor, revisa la arquitectura propuesta, la estructura de carpetas y las 3 decisiones técnicas clave. Si estás de acuerdo con este enfoque, aprobaré el plan y procederemos a inicializar los proyectos (Next.js y FastAPI) dentro de la carpeta creada.

## ❓ Open Questions

> [!IMPORTANT]
> Mencionaste **"lgraphify para la estructura del proyecto"**. ¿Te referías a **Lerna** (para monorepos), **GraphQL** (para la API), o alguna otra herramienta específica? En este plan he asumido una estructura de monorepo estándar separando frontend y backend, pero me gustaría confirmar tu intención con esta herramienta antes de generar el código.

---

## 1. Separación de Responsabilidades (Frontend y Backend)

Dado el stack que has elegido, la mejor forma de abordar este proyecto es separar claramente las responsabilidades entre el frontend y el backend, utilizando **Firebase** de forma estratégica.

### Frontend (Next.js, TypeScript, Tailwind CSS, Three.js)
* **Responsabilidad:** Interfaz de usuario, renderizado de modelos 3D, gestión del estado del cliente, autenticación de usuarios y visualización de datos.
* **Interacción:** Consumirá la API de FastAPI para operaciones complejas (reportes, Google Sheets, cálculos pesados de costos) y se conectará directamente a Firebase (Firestore/Auth) para lecturas rápidas de catálogos y autenticación.
* **Three.js:** Se utilizará para visualizar los modelos 3D en el catálogo o cuando un cliente solicite una cotización y suba un archivo STL/OBJ.
* **PDFs en cliente:** Se añade `jspdf` para generar el PDF de cotización desde el panel administrativo y permitir su descarga inmediata.

### Backend (Python, FastAPI, Uvicorn)
* **Responsabilidad:** Lógica de negocio compleja, integración con APIs externas (Google Sheets API), generación de reportes quincenales, cálculos de costos precisos y control transaccional del inventario.
* **Por qué es necesario:** Aunque Firebase puede hacer mucho, generar respaldos automáticos en Google Sheets, procesar reportes quincenales y manejar lógica de cotizaciones segura (sin exponer márgenes de ganancia en el frontend) requiere un entorno backend controlado. FastApi es rápido, tipado y se integra perfectamente con las librerías de datos de Python.

### Base de Datos (Firebase Firestore & Storage)
* **Firestore:** Almacenará usuarios, catálogo de productos, inventario, registros de costos y cotizaciones.
* **Storage:** Almacenará las imágenes de los productos y los modelos 3D (.stl, .obj, .gltf) subidos por los clientes para cotizar.

---

## 2. Estructura de Carpetas (Type-Based Structure)

Has solicitado una estructura basada en tipos (*Type-based structure*), donde los archivos se agrupan por su rol funcional (componentes, servicios, modelos, rutas) en lugar de por dominio de negocio. Aquí tienes la propuesta para el monorepo dentro de tu carpeta `Impresiones 3D`:

```text
Impresiones 3D/
│
├── frontend/                     # Aplicación Next.js
│   ├── src/
│   │   ├── components/           # Componentes UI reutilizables (Botones, Tarjetas, Three.js Canvas)
│   │   ├── pages/                # (o `app/` si usas App Router) Rutas de la aplicación
│   │   ├── hooks/                # Custom React hooks (ej. useAuth, useInventory)
│   │   ├── services/             # Funciones para llamar a FastAPI y Firebase
│   │   ├── types/                # Interfaces y tipos globales de TypeScript
│   │   ├── utils/                # Funciones de ayuda (formateadores, validadores)
│   │   ├── context/              # Contextos globales de React (Estado del carrito, Auth)
│   │   └── styles/               # Archivos CSS globales (Tailwind)
│   │
│   ├── public/                   # Assets estáticos y modelos 3D predeterminados
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                      # Aplicación FastAPI
│   ├── app/
│   │   ├── api/                  # Controladores y rutas (endpoints)
│   │   ├── core/                 # Configuraciones, variables de entorno, seguridad
│   │   ├── models/               # Modelos de datos (Pydantic models)
│   │   ├── services/             # Lógica de negocio (Cálculo de costos, lógica de Google Sheets)
│   │   ├── utils/                # Funciones de utilidad (Generación de PDFs, parseo de fechas)
│   │   └── main.py               # Punto de entrada de FastAPI
│   │
│   ├── requirements.txt          # Dependencias de Python
│   └── .env                      # Credenciales y secrets
│
└── .gitignore                    # Ignorar node_modules, __pycache__, etc.
```

---

## 3. Decisiones Técnicas Clave (Top 3)

### Decisión 1: Estrategia de Acceso a Datos (Híbrida Firebase + FastAPI)
* **Decisión:** El Frontend accederá directamente a Firebase (Firestore) para lecturas públicas (Catálogo) y Autenticación, aprovechando la velocidad y el tiempo real de Firebase. Sin embargo, para **escrituras críticas** (crear cotizaciones, actualizar inventario, generar reportes de pago), el Frontend enviará las peticiones al **Backend de FastAPI**, y será FastAPI quien valide la información y escriba en Firebase y en Google Sheets simultáneamente.
* **Por qué:** Garantiza la seguridad de los datos, previene manipulación en el cliente y centraliza la lógica compleja (como calcular cuánto material gasta una pieza) en el servidor.

### Decisión 2: Patrón de Exportación a Google Sheets (Background Tasks)
* **Decisión:** Utilizar los `BackgroundTasks` de FastAPI (o Celery si escala mucho) para la generación de respaldos y reportes quincenales en Google Sheets.
* **Por qué:** Conectar y escribir en la API de Google Sheets puede ser lento (varios segundos). Si se hace de forma síncrona, el usuario experimentará lentitud en la web. Al delegarlo a una tarea en segundo plano, la web responde instantáneamente de que "la cotización fue guardada", mientras el servidor hace el respaldo asincrónicamente.

### Decisión 3: Renderizado 3D (React Three Fiber)
* **Decisión:** En lugar de usar Three.js vanilla directamente, usaremos **`@react-three/fiber`** y **`@react-three/drei`**.
* **Por qué:** Son envolturas declarativas de Three.js para React. Te permitirán renderizar los modelos `.stl` o `.gltf` de tus impresiones como si fueran componentes de React, manejando la cámara, las luces y los controles orbitales con mucha menos cantidad de código y mejor integración con el ciclo de vida de Next.js.

---

## Plan de Ejecución
1. ✅ Inicializar el entorno de desarrollo (Next.js en `/frontend` y FastAPI en `/backend`).
2. ✅ Configurar Firebase y conectar el Frontend.
3. ✅ Crear la estructura base y los componentes principales del UI usando Tailwind.
4. ✅ Desarrollar la visualización 3D para el catálogo.
5. ✅ Desarrollar los endpoints de FastAPI (auth, quotes, reports).
6. ✅ Implementar Panel de Reportes Mensuales con comparativa de colaboradores.
7. ⬜ Integración con Google Sheets para respaldos automáticos.
8. ⬜ Probar el flujo completo de cotización -> inventario -> reporte en Google Sheets.

---

## 5. Funcionalidades Implementadas

### 5.1 Panel de Reportes Mensuales (`/admin/reportes`)
- **Frontend:** `frontend/src/app/admin/reportes/page.tsx`
- **KPIs:** Total ganado, items vendidos, colaboradores activos, categorías activas
- **Comparativa por Colaborador:** Ranking con items, categorías, valor por item, total ganado
- **Filtros:** Período (mes), colaborador, categoría
- **Distribución por Categoría:** Gráfico de barras mostrando items por categoría
- **Pestañas de Compras:** "Compras Manuales" y "Compras Web" con indicadores de carga y badges de estado

### 5.2 Registro de Compras Manuales
- **Frontend:** `frontend/src/app/admin/reportes/page.tsx` (sección de formulario)
- **Datos de Cliente:** nombre y teléfono
- **Múltiples Productos por Compra:** dimensiones, peso, tiempo de impresión, filamento usado, costos unitarios (diseño, accesorios, empaque, personalización)
- **Asignación por Colaborador:** cada producto se asigna a un colaborador específico
- **Guardado Automático:** al guardar, se divide en reportes individuales por colaborador en la colección `reports`

### 5.3 Visualización de Compras Web (Cotizaciones Aceptadas)
- **Frontend:** `frontend/src/app/admin/reportes/page.tsx` (pestaña "Compras Web")
- Obtiene cotizaciones desde `GET /api/v1/quotes`
- Filtra localmente por `estado === 'aceptado'`
- Muestra cliente, producto, cantidad, valor y badge de estado "Aceptada" (verde)
- Sin colaborador asignado → no aparece en comparativa por colaborador

### 5.4 Backend de Reportes
- **Modelo:** `backend/app/models/report.py` — `ReportItem` con `clienteNombre`, `clienteTelefono`, `origen` ("manual"/"web"), `ProductoDetalle` (dimensiones, costos, filamento, tiempo, accesorios, personalización, empaque, colaboradorUid)
- **Endpoints:** `backend/app/api/endpoints/reports.py`
  - `GET /reports`: Lista con filtros por período (`fecha_desde`/`fecha_hasta`), `colaboradorUid`, `estado`
  - `POST /reports`: Crear uno o múltiples reportes (detecta si es array)
  - `DELETE /reports/{id}`: Eliminar un reporte
- **Serialización:** `serialize_doc()` que convierte `DocumentSnapshot` a dict con conversión automática de timestamps

### 5.5 Filtros y Endpoints API
- **Quotes:** `backend/app/api/endpoints/quotes.py` — filtros `estado`, `fecha_desde`, `fecha_hasta` en GET
- **Auth:** `backend/app/api/endpoints/auth.py` — filtro `rol` en GET /users
- **Router:** `backend/app/api/router.py` — incluye router de reports

### 5.6 Seguridad (Firestore Rules)
- **Archivo:** `backend/firestore.rules`
- Corregido `isStaff()`: verificaba campo `role` (inexistente) → ahora verifica `rol`
- Agregadas reglas para colección `reports`: solo staff (admin/colaborador) puede leer/escribir

### Archivos Clave Implementados
| Archivo | Propósito |
|---------|-----------|
| `frontend/src/app/admin/reportes/page.tsx` | Panel completo de reportes (KPIs, comparativa, tabs, formulario) |
| `frontend/src/app/admin/page.tsx` | Manejo de aceptación de cotizaciones (handleSaveQuote) |
| `frontend/src/types/reportes.ts` | Interfaces TypeScript (ReportItem, ReportCreate, ReportData, ProductoDetalle) |
| `frontend/src/services/reporteService.ts` | Servicio API para reportes y colaboradores |
| `backend/app/models/report.py` | Modelo Pydantic ReportItem con datos de cliente y producto |
| `backend/app/api/endpoints/reports.py` | CRUD de reportes con filtros |
| `backend/app/api/endpoints/quotes.py` | Filtros de estado y fechas en cotizaciones |
| `backend/app/api/endpoints/auth.py` | Filtro de rol en usuarios |
| `backend/firestore.rules` | Reglas de seguridad con isStaff() corregido |

### 5.7 Asignación de Colaborador al Aceptar Cotización
- Al hacer clic en "Aceptada" en `/admin`, se abre un **modal de asignación**
- **Dos modos de asignación:**
  - **Por producto:** seleccionar un colaborador distinto para cada producto de la cotización
  - **A toda la compra:** asignar el mismo colaborador a todos los productos
- Los productos sin colaborador se aceptan pero **no generan reporte** (no aparecen en ganancias)
- Al confirmar: se guarda la cotización como `aceptado` Y se crean **reportes en la colección `reports`** con los items asignados

### 5.8 Badge de Origen en Reportes
- En la tabla de "Compras Manuales", cada item muestra un badge:
  - 🟦 **Web** (origen = 'web') — items provenientes de cotizaciones aceptadas con colaborador asignado
  - ⬜ **Manual** (origen = 'manual') — items registrados manualmente
- Las ganancias de items con origen 'web' se suman automáticamente a la **comparativa por colaborador**

### Flujo de Datos: Cotización Aceptada → Reportes
1. Admin hace clic en "Aceptada" en `/admin` → se abre modal de asignación
2. Admin elige modo (por producto o toda la compra) y selecciona colaborador(es)
3. Se confirma → `PUT /api/v1/quotes/{id}` con `estado: "aceptado"` + `POST /api/v1/reports` por cada colaborador
4. En reportes: pestaña "Compras Web" muestra la cotización, "Compras Manuales" muestra el item con badge "Web"
5. La comparativa por colaborador incluye automáticamente las ganancias web asignadas

### Archivos Clave (adicionales)
| Archivo | Propósito |
|---------|-----------|
| `frontend/src/types/reportes.ts` | Tipos `Colaborador`, `ReportItem`, `ReportCreate`, `ProductoDetalle` |
| `frontend/src/services/reporteService.ts` | `fetchColaboradores`, `crearReporte` usados desde admin page |

---

## 6. Diseño de Autenticación, Roles y Flujo Git (Backend)

### Requerimientos de Usuario y Registro
*   **Roles Disponibles:**
    *   `administrador`: Control total del sistema, puede cambiar roles de otros usuarios.
    *   `colaborador`: Imprime piezas, registra horas/trabajos e inventario, genera reportes quincenales de pagos.
    *   `cliente`: Sube piezas, cotiza modelos y realiza pedidos.
*   **Autenticación Soportada:**
    *   Correo electrónico y contraseña.
    *   Google Authentication (Google Sign-In).
*   **Reglas de Registro:**
    *   Todo registro público por defecto asigna el rol de `cliente`.
    *   Únicamente las cuentas con rol `administrador` pueden modificar o asignar roles.
    *   Se inicializarán **2 cuentas fijas de administrador** preconfiguradas para poder gestionar los roles del sistema desde el principio.
*   **Datos de Registro Solicitados:**
    *   `nombre`: Nombre completo.
    *   `cedula`: Cédula de identidad nacional.
    *   `rol`: Rol asignado en el sistema (por defecto `cliente`).
    *   `edad`: Edad del usuario.
    *   `fecha_nacimiento`: Fecha de nacimiento.
    *   `telefono`: Número telefónico.
    *   `password`: Contraseña y validación de contraseña.

### Flujo de Git para el Desarrollo

Para mantener el proyecto organizado de manera estructurada:
1.  Todo el desarrollo del backend se realizará en la rama **`backend`** y luego se hará merge a **`main`**.
2.  Todo el desarrollo del frontend se realizará en la rama **`frontend`** y luego se hará merge a **`main`**.
3.  Los commits siempre deben seguir la siguiente estructura:
    `<palabra_reservada> (<rama_afectada>) <descripción_de_los_ajustes_o_implementaciones_mencionando_los_archivos_modificados>`
    *   *Palabras reservadas:* `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, etc.
    *   *Ejemplo:* `feat (frontend) agregar campo de foto y visualizador de referencia en cotizar/page.tsx y admin/page.tsx`

#### Convención de Mensajes de Commit
Todos los commits del proyecto deberán seguir estrictamente la siguiente estructura:
```text
<palabra_reservada>(<rama_afectada>): <descripción_de_los_ajustes_o_implementaciones_mencionando_los_archivos_modificados>
```
* **Palabras reservadas:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
* **Rama afectada:** `backend`, `frontend` o `main`.
* **Ejemplos:**
  * `feat(backend): agregar endpoint /users en auth.py`
  * `fix(frontend): corregir alineación del layout en page.tsx`
  * `docs(backend): actualizar plan de implementacion con reglas de commits`

---

## 7. Auditoría de Seguridad Integral (2026-08-14)

Auditoría completa (backend FastAPI, `firestore.rules`, frontend Next.js, subida de imágenes a Cloudinary, CORS, cabeceras HTTP) realizada a pedido del usuario, actuando como revisor de seguridad. Continúa el trabajo de la Fase 1 (2026-08-10, ver `optimization_project` en memoria) pero cubre huecos que quedaron fuera de esa ronda y de la ronda de RBAC de cotizaciones/compras (2026-08-14). **Estado: todo lo que es código ya está implementado y verificado (TestClient + tsc + browser); quedan 3 acciones pendientes que requieren que el usuario actúe en dashboards externos a los que no tengo acceso (marcadas ⏳ abajo).**

### 🔴 Crítico

1. ✅ **[Implementado]** Colaborador podía saltarse la restricción "solo administrador" en Inversiones/Reportes/Precios usando la consola del navegador o `curl` — la restricción solo existía en el frontend. `firestore.rules` (`isAdmin()` nuevo, reemplaza `isStaff()` en `inversiones`/`reports`/`settings`) y `backend/app/api/endpoints/inversiones.py` / `reports.py` (`RoleChecker(['administrador'])`) ahora exigen administrador tanto en Firestore como en el backend. Verificado con `TestClient`: colaborador → 403 en `GET/POST /inversiones` y `GET /reports`; administrador → 200.

2. ⏳ **[Requiere tu acción — dashboard de Cloudinary]** Preset de subida "unsigned" usable por cualquiera en internet sin login, desde `/cotizar` (página pública) y `/catalogo`. No lo pude arreglar desde código porque la opción robusta (subida firmada) requiere que definas si querés invertir en ese endpoint nuevo, y la mitigación rápida requiere entrar al dashboard de Cloudinary, algo que no puedo hacer por vos. Recomendado, de más rápido a más robusto:
   - **Ya, sin tocar código:** en el dashboard de Cloudinary → Settings → Upload → preset `impresiones3d_unsigned`: activar "Strict" (solo `image`), poner un tamaño máximo, fijar un folder, desactivar `overwrite`.
   - **Robusto (requiere código nuevo, no incluido en esta ronda):** endpoint `POST /api/v1/uploads/sign` en el backend que firme la subida con `API_SECRET`, y el frontend deja de mandar `upload_preset` sin firma.

3. ✅ **[Implementado, mitigación parcial]** `POST /quotes` público sin límite de tasa: se agregó `slowapi` (`backend/app/core/limiter.py`) con `10/minute` por IP en `POST /quotes` y `5/minute` en `POST /auth/register`. Verificado en aislamiento (429 tras superar el límite). **Limitación real:** el límite es en memoria; en un despliegue serverless (Vercel) no persiste entre invocaciones frías, así que es una mitigación de mejor esfuerzo contra ráfagas, no una defensa completa contra bots.
   ⏳ **[Requiere tu acción — cuenta de reCAPTCHA/Turnstile]** La defensa robusta es un CAPTCHA en el formulario de `/cotizar`; necesita que crees una site key gratuita en Google reCAPTCHA o Cloudflare Turnstile — no es algo que pueda generar por vos. Avisame si querés que lo cablee en código una vez tengas la key.

### 🟠 Alto

4. ✅ **[Implementado]** Colaborador ya no puede eliminar productos del catálogo (`backend/app/api/endpoints/products.py: delete_product` ahora exige `rol == "administrador"`); conserva crear/editar, según tu confirmación. Verificado: colaborador → 403 en `DELETE /products/{id}`.
5. ✅ **[Implementado]** Mensajes de error verbosos sanitizados en `auth.py`, `quotes.py`, `reports.py`, `inversiones.py` y `deps.py`: el detalle real ahora se loguea en servidor (`logger.error`/`logger.warning`) y al cliente se le devuelve un mensaje genérico. `register_user`/`sync_google_user` ya no reenvían el error crudo de Firebase (evita enumeración de cuentas por correo).
6. ✅ **[Implementado]** `CORSMiddleware`: se cambió `allow_credentials=True` → `False` en `backend/app/main.py`. La app autentica con Bearer token (no cookies), así que no lo necesitaba — esto neutraliza el riesgo real de combinar el `allow_origin_regex` amplio (`*.vercel.app`) con credenciales habilitadas, sin tener que acotar el regex (que hubiera requerido saber el slug exacto del equipo/proyecto en Vercel).
7. ✅ **[Implementado]** Rate limit de `5/minute` por IP en `POST /auth/register` (ver punto 3 sobre la limitación de estado en memoria en serverless).

### 🟡 Medio

8. ✅ **[Implementado, parcial]** Cabeceras `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` y `Strict-Transport-Security` (solo en producción) agregadas en `backend/app/main.py` (middleware) y `frontend/next.config.ts` (`headers()`). Verificado en el navegador (fetch a `/` devuelve las 5 cabeceras) y con `TestClient`.
   ⏳ **No incluye CSP** (`Content-Security-Policy`): una CSP mal calibrada puede romper en silencio el login con Google (popup), la carga de imágenes de Cloudinary o el visor 3D de Three.js, y no puedo iniciar sesión para probar esos flujos autenticados en producción. Recomiendo construirla en una ronda aparte, probándola contigo en producción antes de confirmar.
9. ✅ **[Implementado]** `/docs`, `/redoc`, `/openapi.json` deshabilitados cuando `ENVIRONMENT=production` (`backend/app/main.py`). Verificado: con `ENVIRONMENT=production`, `GET /docs` → 404.
10. ✅ **[Implementado]** Contraseña mínima subida de 6 a 8 caracteres (`backend/app/models/user.py`). Verificado con Pydantic.
11. ✅ **[Implementado]** `imagenFrontal/Lateral/Trasera/Diagonal` ahora exigen empezar con `https://res.cloudinary.com/` (o estar vacíos) — `backend/app/models/quote.py`. Verificado con Pydantic.

### ⚪ Bajo / housekeeping

12. ⏳ Las variables `ADMIN_1_PASSWORD`/`ADMIN_2_PASSWORD` (solo para el arranque inicial) quedan en texto plano en la config de entorno de Vercel indefinidamente — acción manual tuya: rotarlas ahí una vez confirmes que las 2 cuentas admin ya existen.
13. Sigue sin haber CI/CD ni análisis automatizado de dependencias (ya señalado en la Fase 1 / `optimization_project`, aún pendiente, sin cambios en esta ronda).

### Cómo verificar en producción
- Iniciar sesión como colaborador y confirmar que las URLs `/admin/inversiones` y `/admin/reportes` (y las llamadas de red a `/api/v1/inversiones` y `/api/v1/reports`) devuelven 403 si se intenta acceder directamente.
- Confirmar que colaborador ya no ve el botón de eliminar producto en `/catalogo` (o que un `DELETE` directo devuelve 403).
- Revisar que el registro/login normal siga funcionando (los mensajes de error genéricos no deberían impedir el flujo, solo dejar de mostrar detalle interno).

### No son hallazgos (controles ya correctos, verificados en esta auditoría)
- No hay secretos (`.env`, `firebase-credentials.json`) en el historial de git — `.gitignore` los cubre correctamente en las 3 ubicaciones.
- Autenticación basada en Bearer token (no cookies) → sin superficie de CSRF clásica en escrituras autenticadas.
- `firestore.rules` de `quotes`/`users` (Fase 1 + RBAC 2026-08-14) siguen siendo correctas: `create` en `quotes` bloqueado a nivel de reglas (solo el backend con Admin SDK escribe), auto-escalación de rol bloqueada en `users`.
- Validación Pydantic estricta en `quote.py`/`product.py` (whitelists de `estado`/`subEstado`/`empaque`/`personalizacion`, límites numéricos) sigue vigente y bien aplicada.


