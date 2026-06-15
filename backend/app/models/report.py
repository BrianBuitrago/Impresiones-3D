from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict

class ReportItem(BaseModel):
    quote_id: str = Field(..., description="ID de la cotización relacionada")
    producto_id: str = Field(..., description="ID del producto dentro de la cotización")
    categoria: str = Field(..., min_length=1, description="Categoría del producto, por ejemplo cajas o pintura")
    descripcion: str = Field(..., min_length=1, description="Descripción breve de lo realizado")
    actividad: str = Field(..., min_length=1, description="Qué hizo el colaborador")
    cantidad: int = Field(..., ge=1, description="Cantidad de piezas involucradas")
    valor: float = Field(..., ge=0, description="Valor asociado a este ítem")
    notas: Optional[str] = Field("", description="Notas adicionales opcionales")

    @validator('categoria', 'descripcion', 'actividad', pre=True)
    def strip_text(cls, v):
        return v.strip() if isinstance(v, str) else v


class ReportBase(BaseModel):
    colaboradorUid: str = Field(..., description="UID del colaborador responsable")
    colaboradorNombre: str = Field(..., min_length=2, max_length=120, description="Nombre del colaborador")
    periodo: str = Field(..., min_length=4, max_length=20, description="Periodo del reporte, ej. Enero/26")
    categorias: List[str] = Field(default_factory=list, description="Categorías asignadas al colaborador")
    items: List[ReportItem] = Field(..., min_items=1, description="Lista de ítems del reporte")
    notas: Optional[str] = Field("", max_length=1000, description="Notas generales del reporte")
    estado: Optional[str] = Field("abierto", description="Estado del reporte")

    @validator('periodo')
    def validate_periodo(cls, value):
        normalized = value.strip()
        if '/' not in normalized:
            raise ValueError('El periodo debe usar formato MM/AA, por ejemplo Enero/26')
        return normalized

    @validator('categorias', each_item=True, pre=True)
    def validate_categoria(cls, value):
        return value.strip().lower() if isinstance(value, str) else value


class ReportCreate(ReportBase):
    pass


class ReportUpdate(BaseModel):
    items: Optional[List[ReportItem]] = Field(None, description="Lista de ítems actualizada")
    notas: Optional[str] = Field(None, max_length=1000)
    estado: Optional[str] = Field(None, description="Estado del reporte")
    categorias: Optional[List[str]] = Field(None, description="Categorías asignadas al colaborador")

    @validator('categorias', each_item=True, pre=True)
    def validate_categoria(cls, value):
        return value.strip().lower() if isinstance(value, str) else value


class ReportResponse(ReportBase):
    id: str = Field(..., description="ID del reporte en Firestore")
    creadoEn: Optional[str] = None
    actualizadoEn: Optional[str] = None
    totalesPorCategoria: Dict[str, float] = Field(default_factory=dict)
    totalAPagar: float = Field(0.0)

    class Config:
        extra = 'allow'
