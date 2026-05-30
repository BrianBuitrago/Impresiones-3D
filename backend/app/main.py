from dotenv import load_dotenv
load_dotenv()

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.core.firebase import db
import datetime

from app.api.router import api_router
from app.core.admin_init import initialize_admins
import os
import sys
import traceback

app = FastAPI(
    title="Impresiones 3D API",
    description="Backend para la aplicación de Impresiones 3D",
    version="1.0.0"
)

def get_allowed_origins():
    origins = os.environ.get("CORS_ALLOWED_ORIGINS", "")
    parsed = [origin.strip() for origin in origins.split(",") if origin.strip()]
    return parsed or [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

# Configurar CORS para permitir peticiones del frontend en desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rutas principales de la API
app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
def startup_event():
    initialize_admins()
    # Diagnostic info for deployment logs
    try:
        print("[startup] Listing registered routes:")
        for r in app.routes:
            try:
                path = getattr(r, 'path', None)
                if path:
                    print(f"[route] {path}")
            except Exception:
                print(f"[route] <uninspectable route> {r}")
        firebase_present = 'FIREBASE_CREDENTIALS_JSON' in os.environ
        print(f"[startup] FIREBASE_CREDENTIALS_JSON present: {firebase_present}")
        print(f"[startup] db initialized: {db is not None}")
    except Exception as e:
        print("[startup] Error printing diagnostic info:", e, file=sys.stderr)
        traceback.print_exc()


@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API de Impresiones 3D"}

@app.get("/health")
def health_check():
    return {"status": "ok", "firebase_connected": db is not None}

@app.post("/test-db")
def test_database():
    if db is None:
        raise HTTPException(status_code=500, detail="Firebase no está inicializado")
        
    try:
        # Intenta guardar un dato de prueba en la colección 'tests'
        doc_ref = db.collection('tests').document()
        doc_ref.set({
            'mensaje': '¡Conexión exitosa desde FastAPI!',
            'fecha': datetime.datetime.now().isoformat()
        })
        return {"status": "success", "message": "Dato guardado en Firebase exitosamente", "id": doc_ref.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
