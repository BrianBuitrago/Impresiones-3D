from pydantic import BaseModel, Field, validator
from typing import Optional

TIPOS_INVERSION = {"insumo", "maquina"}


class InversionBase(BaseModel):
    elemento: str = Field(..., min_length=2, max_length=150, description="Nombre del insumo o máquina")
    tipo: str = Field(..., description="Tipo de inversión: insumo o maquina")
    proveedor: Optional[str] = Field("", max_length=150, description="Proveedor")
    cantidad: float = Field(..., gt=0, description="Cantidad comprada")
    costo: float = Field(..., ge=0, description="Costo por unidad")
    valorUnitario: Optional[float] = Field(0.0, ge=0, description="Valor unitario de referencia (no interviene en el total)")
    fecha: str = Field(..., min_length=1, description="Fecha de la inversión (YYYY-MM-DD)")
    observaciones: Optional[str] = Field("", max_length=500, description="Observaciones")

    @validator("elemento", pre=True)
    def strip_elemento(cls, value):
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
    elemento: Optional[str] = Field(None, min_length=2, max_length=150)
    tipo: Optional[str] = None
    proveedor: Optional[str] = Field(None, max_length=150)
    cantidad: Optional[float] = Field(None, gt=0)
    costo: Optional[float] = Field(None, ge=0)
    valorUnitario: Optional[float] = Field(None, ge=0)
    fecha: Optional[str] = Field(None, min_length=1)
    observaciones: Optional[str] = Field(None, max_length=500)

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
    total: float = Field(0.0, description="Cantidad × Costo, calculado en servidor")
    creadoEn: Optional[str] = None
    actualizadoEn: Optional[str] = None

    class Config:
        extra = "allow"
