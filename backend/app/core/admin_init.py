import os
from app.core.firebase import db, firebase_auth
from datetime import datetime

def initialize_admins():
    """
    Verifica la existencia de 2 cuentas administradoras configuradas en las variables de entorno.
    Si no existen, las crea en Firebase Auth y guarda su perfil en Firestore con rol 'administrador'.
    """
    if db is None or firebase_auth is None:
        print("Firebase no está configurado. Omitiendo inicialización de administradores.")
        return

    admin_1_email = os.environ.get("ADMIN_1_EMAIL")
    admin_1_pass = os.environ.get("ADMIN_1_PASSWORD")
    admin_2_email = os.environ.get("ADMIN_2_EMAIL")
    admin_2_pass = os.environ.get("ADMIN_2_PASSWORD")

    if not all([admin_1_email, admin_1_pass, admin_2_email, admin_2_pass]):
        print("Admins iniciales no configurados completamente. Omitiendo creacion automatica.")
        return

    admins = [
        {"email": admin_1_email, "pass": admin_1_pass, "name": "Administrador Principal 1"},
        {"email": admin_2_email, "pass": admin_2_pass, "name": "Administrador Principal 2"}
    ]

    for admin in admins:
        try:
            # 1. Verificar si existe en Firebase Auth
            try:
                user_record = firebase_auth.get_user_by_email(admin["email"])
                uid = user_record.uid
                print(f"El usuario {admin['email']} ya existe en Firebase Auth.")
            except Exception:
                # Si no existe, crearlo
                user_record = firebase_auth.create_user(
                    email=admin["email"],
                    password=admin["pass"],
                    display_name=admin["name"]
                )
                uid = user_record.uid
                print(f"Usuario administrador {admin['email']} creado en Firebase Auth exitosamente.")

            # 2. Verificar y actualizar su perfil en Firestore
            user_ref = db.collection("users").document(uid)
            user_doc = user_ref.get()

            if not user_doc.exists:
                user_profile = {
                    "nombre": admin["name"],
                    "cedula": "0000000000",
                    "edad": 99,
                    "fecha_nacimiento": "1900-01-01",
                    "telefono": "000000000",
                    "email": admin["email"],
                    "rol": "administrador",
                    "creado_en": datetime.utcnow().isoformat()
                }
                user_ref.set(user_profile)
                print(f"Perfil del administrador {admin['email']} guardado en Firestore.")
            else:
                user_data = user_doc.to_dict()
                if user_data.get("rol") != "administrador":
                    user_ref.update({"rol": "administrador"})
                    print(f"Rol forzado a 'administrador' para {admin['email']} en Firestore.")
                    
        except Exception as e:
            print(f"Error al inicializar el administrador {admin['email']}: {str(e)}")
