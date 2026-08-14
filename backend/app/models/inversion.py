from pydantic import BaseModel, Field, validator
from typing import Optional

TIPOS_INVERSION = {"insumo", "maquina"}


class InversionBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=150, description="Nombre del insumo o máquina")
    tipo: str = Field(..., description="Tipo de inversión: insumo o maquina")
    monto: float = Field(..., ge=0, description="Monto invertido")
    fecha: str = Field(..., min_length=1, description="Fecha de la inversión (YYYY-MM-DD)")
    notas: Optional[str] = Field("", max_length=500, description="Notas adicionales")

    @validator("nombre", pre=True)
    def strip_nombre(cls, value):
        return value.strip() if isinstance(value, str) else value

    @validator("tipo")
    def validate_tipo(cls, value):
        normalized = value.strip().lower()
        if normalized not in TIPOS_INVERSION:
            raise ValueError("Tipo de inversión no permitido.")
        return normalized

    @validator("fecha", pre=True)
    def strip_fecha(cls, value):
        return value.strip() if isinstance(value, str) else value


class InversionCreate(InversionBase):
    pass


class InversionUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=150)
    tipo: Optional[str] = None
    monto: Optional[float] = Field(None, ge=0)
    fecha: Optional[str] = Field(None, min_length=1)
    notas: Optional[str] = Field(None, max_length=500)

    @validator("tipo")
    def validate_tipo(cls, value):
        if value is None:
            return value
        normalized = value.strip().lower()
        if normalized not in TIPOS_INVERSION:
            raise ValueError("Tipo de inversión no permitido.")
        return normalized


class InversionResponse(InversionBase):
    id: str = Field(..., description="ID del documento en Firestore")
    creadoEn: Optional[str] = None
    actualizadoEn: Optional[str] = None

    class Config:
        extra = "allow"
