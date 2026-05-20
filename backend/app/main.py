from dotenv import load_dotenv
load_dotenv()

import os
print(f"==================================================")
print(f"CORREOS ADMIN PERMITIDOS: {os.environ.get('ALLOWED_ADMIN_EMAILS')}")
print(f"==================================================")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.core.firebase import db
import datetime

from app.api.router import api_router
from app.core.admin_init import initialize_admins

app = FastAPI(
    title="Impresiones 3D API",
    description="Backend para la aplicación de Impresiones 3D",
    version="1.0.0"
)

# Configurar CORS para permitir peticiones del frontend en desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, esto debería ser la URL de Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rutas principales de la API
app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
def startup_event():
    initialize_admins()


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
