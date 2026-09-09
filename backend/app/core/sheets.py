import os
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Reutiliza exactamente las mismas credenciales que ya usa Firebase Admin
# (FIREBASE_CREDENTIALS_JSON / firebase-credentials.json) — es la misma
# cuenta de servicio del proyecto (firebase-adminsdk-fbsvc@...), así que no
# hace falta un archivo/variable de entorno separada. Solo hay que:
#   1. Tener la API de Google Sheets habilitada en el proyecto de Google Cloud.
#   2. Compartir cada Google Sheet a sincronizar con ese client_email, con
#      permiso de Editor (si no, la API responde 403 aunque las credenciales
#      sean válidas).
SHEETS_SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

def init_sheets_service():
    try:
        cred_json_str = os.environ.get("FIREBASE_CREDENTIALS_JSON")
        if cred_json_str:
            cred_info = json.loads(cred_json_str)
            creds = service_account.Credentials.from_service_account_info(cred_info, scopes=SHEETS_SCOPES)
            print("Cargando credenciales de Google Sheets desde variable de entorno (compartidas con Firebase).")
        else:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            cred_path = os.path.join(current_dir, "firebase-credentials.json")
            if not os.path.exists(cred_path):
                print(f"ERROR: No se encontró el archivo de credenciales en {cred_path} ni la variable de entorno FIREBASE_CREDENTIALS_JSON. Google Sheets quedará deshabilitado.")
                return None
            creds = service_account.Credentials.from_service_account_file(cred_path, scopes=SHEETS_SCOPES)
            print("Cargando credenciales de Google Sheets desde archivo local (compartidas con Firebase).")

        service = build("sheets", "v4", credentials=creds)
        print("Google Sheets API inicializada correctamente.")
        return service
    except Exception as e:
        print(f"Error al inicializar Google Sheets: {e}")
        return None

# Instancia global para usar en otros archivos (mismo patrón que app/core/firebase.py)
sheets_service = init_sheets_service()
