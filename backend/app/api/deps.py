from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.firebase import db, firebase_auth
from typing import List

security = HTTPBearer()

def get_firebase_uid(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Verifica el token de Firebase enviado en la cabecera Authorization: Bearer <token>
    y retorna el UID del usuario autenticado.
    """
    token = credentials.credentials
    try:
        # Verificar el ID Token con el SDK de Admin de Firebase
        decoded_token = firebase_auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        if not uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: UID no encontrado en el token."
            )
        return uid
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido o expirado: {str(e)}"
        )

def get_current_user(uid: str = Depends(get_firebase_uid)) -> dict:
    """
    Obtiene el documento del usuario desde la colección 'users' en Firestore.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de base de datos no inicializado."
        )
    
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El perfil de usuario no existe en la base de datos."
        )
        
    user_data = user_doc.to_dict()
    user_data["uid"] = uid
    return user_data

class RoleChecker:
    """
    Clase para validar que el usuario actual posea uno de los roles permitidos.
    """
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("rol", "cliente")
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos suficientes para realizar esta acción."
            )
        return current_user
