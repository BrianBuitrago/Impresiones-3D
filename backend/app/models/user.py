from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    nombre: str = Field(..., description="Nombre completo del usuario")
    cedula: str = Field(..., description="Cédula de identidad")
    edad: int = Field(..., ge=0, description="Edad del usuario")
    fecha_nacimiento: str = Field(..., description="Fecha de nacimiento en formato YYYY-MM-DD")
    telefono: str = Field(..., description="Número telefónico de contacto")
    email: EmailStr = Field(..., description="Correo electrónico del usuario")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Contraseña del usuario (mínimo 6 caracteres)")
    confirm_password: str = Field(..., min_length=6, description="Confirmación de la contraseña")

    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'password' in values and v != values['password']:
            raise ValueError('Las contraseñas no coinciden')
        return v

class UserResponse(UserBase):
    uid: str = Field(..., description="ID único de Firebase Auth")
    rol: str = Field("cliente", description="Rol del usuario en el sistema (administrador, colaborador, cliente)")
    creado_en: Optional[str] = None

class UserRoleUpdate(BaseModel):
    rol: str = Field(..., description="Nuevo rol (administrador, colaborador, cliente)")

    @validator('rol')
    def validate_rol(cls, v):
        allowed_roles = {"administrador", "colaborador", "cliente"}
        if v not in allowed_roles:
            raise ValueError(f"El rol debe ser uno de los siguientes: {', '.join(allowed_roles)}")
        return v

class GoogleSyncRequest(BaseModel):
    id_token: str = Field(..., description="Token de ID de Firebase retornado tras Google Sign-In")
    nombre: Optional[str] = None
    cedula: Optional[str] = None
    edad: Optional[int] = None
    fecha_nacimiento: Optional[str] = None
    telefono: Optional[str] = None
