from dotenv import load_dotenv
load_dotenv()

import os
import sys
import traceback
import datetime

from fastapi import FastAPI, HTTPException
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

# Configurar CORS (Abierto para pruebas, restringir en producción después)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite todo temporalmente para debug
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar el Router Principal de la API (v1)
# Esto debería incluir automáticamente /quotes si está bien configurado en app/api/router.py
app.include_router(api_router, prefix="/api/v1")

# --- Endpoints de Diagnóstico y Utilidad ---

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

@app.get("/internal/diag")
def internal_diag():
    """
    Endpoint crítico para debugging.
    Muestra todas las rutas registradas y el estado de los módulos.
    """
    routes_list = []
    for r in app.routes:
        if hasattr(r, 'path'):
            methods = getattr(r, 'methods', ['GET'])
            routes_list.append(f"{list(methods)} {r.path}")
    
    # Verificar importación del módulo quotes específicamente
    quotes_status = "No verificado"
    try:
        from app.api.endpoints import quotes
        quotes_status = "Importación exitosa"
    except ImportError as e:
        quotes_status = f"Error de importación: {str(e)}"
    except Exception as e:
        quotes_status = f"Error desconocido: {str(e)}"

    return {
        "registered_routes": routes_list,
        "quotes_module_status": quotes_status,
        "firebase_db_initialized": db is not None,
        "env_firebase_present": 'FIREBASE_CREDENTIALS_JSON' in os.environ,
        "python_version": sys.version
    }

@app.post("/test-db")
def test_database():
    if db is None:
        raise HTTPException(status_code=500, detail="Firebase no está inicializado")
        
    try:
        doc_ref = db.collection('tests').document()
        doc_ref.set({
            'mensaje': '¡Conexión exitosa desde FastAPI en Vercel!',
            'fecha': datetime.datetime.now().isoformat()
        })
        return {"status": "success", "message": "Dato guardado en Firebase", "id": doc_ref.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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