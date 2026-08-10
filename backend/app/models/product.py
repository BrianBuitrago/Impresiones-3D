from pydantic import BaseModel, Field
from typing import Optional


class ProductCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200, description="Nombre del producto")
    descripcion: str = Field("", max_length=2000, description="Descripción del producto")
    material: str = Field("", max_length=100, description="Material de impresión")
    imagenUrl: str = Field("", max_length=2000, description="URL de la imagen del producto")
    categoria: str = Field("", max_length=100, description="Categoría del producto")
    destacado: bool = Field(False, description="Si aparece destacado en el catálogo")
    orden: int = Field(0, ge=0, description="Orden de aparición en el catálogo")
    activo: bool = Field(True, description="Si el producto está visible en el catálogo")


class ProductUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=200)
    descripcion: Optional[str] = Field(None, max_length=2000)
    material: Optional[str] = Field(None, max_length=100)
    imagenUrl: Optional[str] = Field(None, max_length=2000)
    categoria: Optional[str] = Field(None, max_length=100)
    destacado: Optional[bool] = None
    orden: Optional[int] = Field(None, ge=0)
    activo: Optional[bool] = None
