import os
import firebase_admin
from firebase_admin import credentials, firestore, storage, auth

def init_firebase():
    try:
        # Inicializar Firebase Admin si no se ha inicializado aún
        if not firebase_admin._apps:
            # 1. Intentar cargar las credenciales desde una variable de entorno en formato JSON (para Vercel/Producción)
            cred_json_str = os.environ.get("FIREBASE_CREDENTIALS_JSON")
            if cred_json_str:
                import json
                try:
                    cred_info = json.loads(cred_json_str)
                    cred = credentials.Certificate(cred_info)
                    print("Cargando credenciales de Firebase desde variable de entorno.")
                except Exception as ex:
                    print(f"Error al parsear FIREBASE_CREDENTIALS_JSON: {ex}")
                    return None
            else:
                # 2. Si no existe la variable de entorno, buscar el archivo local (desarrollo local)
                current_dir = os.path.dirname(os.path.abspath(__file__))
                cred_path = os.path.join(current_dir, "firebase-credentials.json")
                if not os.path.exists(cred_path):
                    print(f"ERROR: No se encontró el archivo de credenciales en {cred_path} ni la variable de entorno FIREBASE_CREDENTIALS_JSON.")
                    return None
                cred = credentials.Certificate(cred_path)
                print("Cargando credenciales de Firebase desde archivo local.")
            
            # Inicializamos la app
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
