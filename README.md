# RepliCars3D

App de cotización y gestión para un negocio de impresión 3D (réplicas de vehículos a escala): catálogo público, cotizador con subida de fotos y cálculo de precio, y un panel de administración para cotizaciones, usuarios, compras, inversiones y reportes.

## Estructura del repo

```
.
├── backend/     FastAPI (Python) — API, Firestore, autenticación, Google Sheets
├── frontend/    Next.js (App Router, TypeScript, Tailwind) — sitio público + panel admin
└── .github/     CI (lint/type-check en cada push)
```

Cada carpeta se despliega por separado en Vercel (dos proyectos apuntando al mismo repo, `Root Directory` distinto en cada uno).

## Stack

- **Backend**: FastAPI + Pydantic, Firebase Admin SDK (Auth + Firestore), Cloudinary (imágenes), Google Sheets API (sincronización de datos históricos), `slowapi` (rate limiting).
- **Frontend**: Next.js 16 (App Router) + React 19, TypeScript, Tailwind CSS 4, Firebase (cliente), Framer Motion, `three.js`/`@react-three/fiber` (visor 3D del hero), `jsPDF` (cotizaciones en PDF).
- **Base de datos**: Firestore (NoSQL). Reglas de seguridad en [`backend/firestore.rules`](backend/firestore.rules).

## Levantar el proyecto en local

### Backend

```bash
cd backend
python -m venv venv
./venv/Scripts/activate   # Windows; en Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # completar con credenciales reales
```

Además del `.env`, el backend necesita el archivo de credenciales de la cuenta de servicio de Firebase en `backend/app/core/firebase-credentials.json` (no se versiona) — o, para producción, la variable de entorno `FIREBASE_CREDENTIALS_JSON` con ese mismo JSON como string. Esa misma cuenta de servicio se reutiliza para la API de Google Sheets (no hace falta un archivo de credenciales aparte).

```bash
uvicorn app.main:app --reload --port 8000
```

Con `ENVIRONMENT` distinto de `production` (el default), `/docs` queda disponible en `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # completar con credenciales reales
npm run dev
```

Abre en `http://localhost:3000`. Por defecto apunta al backend en `http://localhost:8000/api/v1` (ver `NEXT_PUBLIC_API_URL`).

## Flujo de Git

Dos ramas de trabajo, `backend` y `frontend`, que se mergean a `main` — así un cambio que solo toca un lado no arrastra el diff del otro en el historial de esa rama. `main` es lo que se despliega. Antes de cada `git push` se confirma explícitamente.

## Documentación

- [`backend/README.md`](backend/README.md) — variables de entorno, estructura de `app/`, scripts de importación de datos.
- [`backend/firestore.rules`](backend/firestore.rules) — reglas de seguridad de Firestore (deben publicarse a mano en Firebase Console tras cualquier cambio; no hay CLI de Firebase configurada en este repo).
