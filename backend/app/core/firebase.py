import os
import firebase_admin
from firebase_admin import credentials, firestore, storage, auth

def init_firebase():
    # Obtener la ruta absoluta del archivo JSON de credenciales
    # (Se asume que el JSON está en la misma carpeta que este archivo)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    cred_path = os.path.join(current_dir, "firebase-credentials.json")
    
    if not os.path.exists(cred_path):
        print(f"ADVERTENCIA: No se encontró el archivo de credenciales en {cred_path}")
        return None
        
    try:
        # Inicializar Firebase Admin si no se ha inicializado aún
        if not firebase_admin._apps:
            cred = credentials.Certificate(cred_path)
            
            # Inicializamos la app. El storageBucket se puede sacar del config del frontend
            # o pasarse como variable de entorno
            bucket_name = os.environ.get("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "impresiones-3d-c9884.firebasestorage.app")
            
            firebase_admin.initialize_app(cred, {
                'storageBucket': bucket_name
            })
            print("Firebase Admin inicializado correctamente.")
            
        return {
            "db": firestore.client(),
            "auth": auth,
            "storage": storage.bucket()
        }
    except Exception as e:
        print(f"Error al inicializar Firebase: {e}")
        return None

# Instancia global para usar en otros archivos
firebase_services = init_firebase()
if firebase_services:
    db = firebase_services["db"]
    firebase_auth = firebase_services["auth"]
    bucket = firebase_services["storage"]
else:
    db = None
    firebase_auth = None
    bucket = None
