from dotenv import load_dotenv
load_dotenv()

import os
import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# Importar componentes locales
from app.core.firebase import db
from app.core.admin_init import initialize_admins
from app.core.limiter import limiter
from app.api.router import api_router  # Asegúrate de que esta ruta sea correcta

_is_production = os.environ.get("ENVIRONMENT", "development").strip().lower() == "production"

# Inicializar App
# En producción se deshabilitan /docs, /redoc y /openapi.json: no aportan valor a los
# usuarios finales y sí facilitan que un atacante mapee toda la superficie de la API.
app = FastAPI(
    title="Impresiones 3D API",
    description="Backend para la aplicación de Impresiones 3D",
    version="1.0.0",
    docs_url=None if _is_production else "/docs",
    redoc_url=None if _is_production else "/redoc",
    openapi_url=None if _is_production else "/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configurar CORS: orígenes permitidos vía env var (coma-separada) + previews de Vercel.
# allow_credentials=False: la app autentica con Bearer token (Authorization header), no
# con cookies, así que no necesita credenciales de CORS. Sin esto, combinar un origin_regex
# amplio (*.vercel.app, que cualquiera puede desplegar gratis) con allow_credentials=True
# era una superficie de confianza innecesariamente amplia.
_default_origins = "http://localhost:3000"
allowed_origins = [
    origin.strip()
    for origin in os.environ.get("ALLOWED_ORIGINS", _default_origins).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    if _is_production:
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    return response

# Registrar el Router Principal de la API (v1)
# Esto debería incluir automáticamente /quotes si está bien configurado en app/api/router.py
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {
        "message": "Bienvenido a la API de Impresiones 3D",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "firebase_connected": db is not None
    }

# --- Event Startup ---

@app.on_event("startup")
async def startup_event():
    print("[STARTUP] Iniciando aplicación...")
    try:
        initialize_admins()
        print("[STARTUP] Admins inicializados.")
    except Exception as e:
        print(f"[STARTUP ERROR] Fallo al inicializar admins: {e}")
        traceback.print_exc()

    # Imprimir rutas registradas en los logs de Vercel
    print("[STARTUP] Rutas registradas en el sistema:")
    for r in app.routes:
        if hasattr(r, 'path'):
            methods = getattr(r, 'methods', ['GET'])
            print(f"  -> {list(methods)} {r.path}")
    
    print("[STARTUP] Aplicación lista para recibir peticiones.")