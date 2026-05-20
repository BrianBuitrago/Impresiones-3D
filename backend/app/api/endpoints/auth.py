from fastapi import APIRouter, Depends, HTTPException, status
from app.core.firebase import db, firebase_auth
from app.models.user import UserCreate, UserResponse, UserRoleUpdate, GoogleSyncRequest
from app.api.deps import get_current_user, RoleChecker, get_firebase_uid
from datetime import datetime

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate):
    """
    Registra un usuario nuevo en Firebase Auth y crea su documento de perfil
    adicional en Firestore con el rol 'cliente' por defecto.
    """
    if db is None or firebase_auth is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicios de Firebase no están disponibles."
        )

    try:
        # 1. Crear el usuario en Firebase Auth
        user_record = firebase_auth.create_user(
            email=user_in.email,
            password=user_in.password,
            display_name=user_in.nombre
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al registrar usuario en Firebase Auth: {str(e)}"
        )

    try:
        # 2. Guardar datos adicionales de perfil en Firestore
        user_profile = {
            "nombre": user_in.nombre,
            "cedula": user_in.cedula,
            "edad": user_in.edad,
            "fecha_nacimiento": user_in.fecha_nacimiento,
            "telefono": user_in.telefono,
            "email": user_in.email,
            "rol": "cliente",  # Rol por defecto para registros públicos
            "creado_en": datetime.utcnow().isoformat()
        }
        
        db.collection("users").document(user_record.uid).set(user_profile)
        
        user_profile["uid"] = user_record.uid
        return user_profile
        
    except Exception as e:
        # En caso de error al guardar en Firestore, intentamos revertir la creación en Auth
        try:
            firebase_auth.delete_user(user_record.uid)
        except Exception:
            pass
            
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear el perfil de usuario en la base de datos: {str(e)}"
        )

@router.post("/sync-google", response_model=UserResponse)
def sync_google_user(request: GoogleSyncRequest):
    """
    Sincroniza un usuario tras autenticarse con Google en el frontend.
    Verifica el Token de ID. Si el usuario no existe en Firestore, crea su
    perfil con el rol 'cliente' por defecto.
    """
    if db is None or firebase_auth is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicios de Firebase no están disponibles."
        )

    try:
        # 1. Verificar el token de ID enviado por el frontend
        decoded_token = firebase_auth.verify_id_token(request.id_token)
        uid = decoded_token.get("uid")
        email = decoded_token.get("email")
        nombre_google = decoded_token.get("name", "Usuario Google")
        
        if not uid or not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token de Google inválido o incompleto."
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Autenticación de Google fallida: {str(e)}"
        )

    # 2. Verificar si ya existe en Firestore
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    if user_doc.exists:
        # El usuario ya existe, retornamos su perfil
        user_profile = user_doc.to_dict()
        user_profile["uid"] = uid
        return user_profile
    else:
        # 3. Es un usuario nuevo que ingresó con Google, creamos su perfil
        # Los datos específicos como cédula o teléfono los completará después
        user_profile = {
            "nombre": request.nombre or nombre_google,
            "cedula": request.cedula or "",
            "edad": request.edad or 0,
            "fecha_nacimiento": request.fecha_nacimiento or "",
            "telefono": request.telefono or "",
            "email": email,
            "rol": "cliente",  # Siempre cliente por defecto
            "creado_en": datetime.utcnow().isoformat()
        }
        
        try:
            user_ref.set(user_profile)
            user_profile["uid"] = uid
            return user_profile
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al crear el perfil de usuario de Google en la base de datos: {str(e)}"
            )

@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: dict = Depends(get_current_user)):
    """
    Retorna el perfil del usuario autenticado actual.
    """
    return current_user

@router.put("/me", response_model=UserResponse)
def update_my_profile(
    updated_fields: dict, 
    uid: str = Depends(get_firebase_uid),
    current_user: dict = Depends(get_current_user)
):
    """
    Permite al usuario autenticado actualizar sus datos personales (excepto rol e email).
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
        
    # Impedimos modificar rol e email por seguridad
    for key in ["rol", "email", "uid", "creado_en"]:
        if key in updated_fields:
            del updated_fields[key]
            
    # Validamos que al menos venga un campo a actualizar
    if not updated_fields:
        raise HTTPException(status_code=400, detail="No se enviaron campos válidos para actualizar.")
        
    try:
        user_ref = db.collection("users").document(uid)
        user_ref.update(updated_fields)
        
        # Obtener el perfil actualizado
        updated_doc = user_ref.get().to_dict()
        updated_doc["uid"] = uid
        return updated_doc
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar el perfil: {str(e)}"
        )

@router.put("/users/{target_uid}/role", response_model=UserResponse)
def update_user_role(
    target_uid: str,
    role_update: UserRoleUpdate,
    admin_user: dict = Depends(RoleChecker(["administrador"]))
):
    """
    Permite únicamente a un Administrador cambiar el rol de cualquier usuario.
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")

    user_ref = db.collection("users").document(target_uid)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario objetivo no existe."
        )
        
    try:
        # Actualizar rol en Firestore
        user_ref.update({"rol": role_update.rol})
        
        # Retornar el perfil con el rol cambiado
        updated_user = user_doc.to_dict()
        updated_user["uid"] = target_uid
        updated_user["rol"] = role_update.rol
        return updated_user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar el rol de usuario: {str(e)}"
        )
