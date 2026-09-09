# Backend — RepliCars3D

API FastAPI para el sitio y panel de administración de RepliCars3D. Ver el [README de la raíz](../README.md) para la vista general del proyecto.

## Setup

```bash
python -m venv venv
./venv/Scripts/activate   # Windows; en Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Credenciales de Firebase: colocar el JSON de la cuenta de servicio en `app/core/firebase-credentials.json` (gitignored) para desarrollo local, o definir `FIREBASE_CREDENTIALS_JSON` (el JSON completo como string) para producción — ver `app/core/firebase.py`. La misma cuenta de servicio se usa para la API de Google Sheets (`app/core/sheets.py`), no hace falta un archivo aparte.

```bash
uvicorn app.main:app --reload --port 8000
```

`/docs` (Swagger) solo está disponible cuando `ENVIRONMENT` no es `production` — ver `app/main.py`.

## Variables de entorno

Ver [`.env.example`](.env.example) para la lista completa. Las más importantes:

| Variable | Qué es |
|---|---|
| `ENVIRONMENT` | `production` deshabilita `/docs`/`/redoc` y activa cabeceras HSTS. |
| `ALLOWED_ORIGINS` | Orígenes permitidos por CORS, separados por coma (los `*.vercel.app` ya están permitidos vía regex). |
| `FIREBASE_CREDENTIALS_JSON` | JSON de la cuenta de servicio de Firebase, como string (alternativa al archivo local). |
| `ADMIN_1_EMAIL` / `ADMIN_1_PASSWORD`, `ADMIN_2_EMAIL` / `ADMIN_2_PASSWORD` | Cuentas admin creadas automáticamente al iniciar (`app/core/admin_init.py`). |
| `ALLOWED_ADMIN_EMAILS` | Correos (coma-separados) que se promueven a `administrador` automáticamente al loguearse con Google — ver `sync_google_user` en `app/api/endpoints/auth.py`. |
| `CLOUD_NAME` / `API_KEY` / `API_SECRET` / `CLOUDINARY_UPLOAD_PRESET` | Cloudinary, para las imágenes que sube el cliente en `/cotizar`. |

## Estructura de `app/`

```
app/
├── main.py              # instancia FastAPI, CORS, rate limiting, cabeceras de seguridad
├── api/
│   ├── router.py        # registra cada router de endpoints/ (con try/except individual)
│   ├── deps.py          # dependencias compartidas: get_db, get_current_user, RoleChecker
│   └── endpoints/        # un archivo por recurso (quotes, auth, reports, inversiones, sync, products)
├── core/                 # inicialización de Firebase/Sheets, rate limiter, promoción de admins
├── models/               # esquemas Pydantic (request/response) por recurso
├── services/             # lógica de negocio reutilizable (pricing, reports, sync con Sheets)
└── utils/                # helpers chicos (serialize_doc, etc.)
```

Patrón de cada endpoint: `db = Depends(get_db)` para la conexión a Firestore (corta con 503 si no está disponible), `Depends(RoleChecker([...]))` para el control de acceso por rol, y un `try/except` alrededor de la escritura que logea el error real y devuelve un mensaje genérico al cliente.

## Sincronización con Google Sheets

El negocio tenía un historial de compras e inversiones en Google Sheets antes de esta app. Hay dos mecanismos separados:

- **Importación (`scripts/import_pedidos_confirmados.py`, `scripts/import_inversiones.py`)**: uno de una sola vez, ya ejecutados — traen el histórico del Sheet a Firestore. No se vuelven a correr (ver el aviso al principio de cada script).
- **Sincronización bajo demanda (`app/services/sheet_reconciler.py`, endpoints en `app/api/endpoints/sync.py`)**: botón "Sincronizar con Google Sheet" en el panel — trae filas nuevas que se hayan agregado al Sheet después de la importación inicial, y elimina en la app las que se hayan borrado ahí. Tiene un resguardo: si detecta que va a eliminar una porción sospechosamente grande de registros de una sola pasada (posible lectura incompleta de la API), aborta todo sin tocar nada.
- **Sync de edición (`app/services/inversion_sheet_sync.py`, `app/services/pedidos_sheet_sync.py`)**: al editar o borrar una Inversión o Compra Manual que vino del Sheet, se actualiza/vacía esa misma fila ahí — así no queda desactualizado ni se "resucita" un registro borrado en la próxima sincronización.

## Tests

No hay suite de tests automatizada todavía. La verificación manual usual es `python -m py_compile` sobre los archivos tocados y pruebas puntuales con `fastapi.testclient.TestClient` + `dependency_overrides` (ver el historial de commits para ejemplos).
