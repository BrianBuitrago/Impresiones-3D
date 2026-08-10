from dotenv import load_dotenv
load_dotenv()

import os
import traceback

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importar componentes locales
from app.core.firebase import db
from app.core.admin_init import initialize_admins
from app.api.router import api_router  # Asegúrate de que esta ruta sea correcta

# Inicializar App
app = FastAPI(
    title="Impresiones 3D API",
    description="Backend para la aplicación de Impresiones 3D",
    version="1.0.0"
)

# Configurar CORS: orígenes permitidos vía env var (coma-separada) + previews de Vercel
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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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