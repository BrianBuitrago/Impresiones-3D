from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict

class ProductoDetalle(BaseModel):
    nombre: Optional[str] = Field("", description="Nombre del producto/pieza")
    descripcion: Optional[str] = Field("", description="Descripción detallada")
    pesoGramos: Optional[float] = Field(0.0, ge=0, description="Peso en gramos")
    tiempoHoras: Optional[float] = Field(0.0, ge=0, description="Horas de trabajo")
    tiempoMinutos: Optional[float] = Field(0.0, ge=0, description="Minutos de trabajo")
    filamentoUsado: Optional[float] = Field(0.0, ge=0, description="Filamento en gramos")
    costoDiseno: Optional[float] = Field(0.0, ge=0, description="Costo diseño unitario")
    costoAccesorios: Optional[float] = Field(0.0, ge=0, description="Costo accesorios unitario")
    costoEmpaque: Optional[float] = Field(0.0, ge=0, description="Costo empaque unitario")
    costoPersonalizacion: Optional[float] = Field(0.0, ge=0, description="Costo personalización unitario")
    valorUnitario: Optional[float] = Field(0.0, ge=0, description="Valor unitario")
    tamanoHorizontal: Optional[float] = Field(0.0, ge=0, description="Tamaño horizontal mm")
    tamanoVertical: Optional[float] = Field(0.0, ge=0, description="Tamaño vertical mm")

class ReportItem(BaseModel):
    quote_id: str = Field("", description="ID de cotización relacionada (vacío si es manual)")
    producto_id: str = Field("", description="ID del producto en cotización")
    categoria: str = Field(..., min_length=1, description="Categoría: cajas, pintura, etc")
    descripcion: str = Field(..., min_length=1, description="Descripción de lo realizado")
    actividad: str = Field("", description="Qué hizo el colaborador")
    cantidad: int = Field(..., ge=1, description="Cantidad de piezas")
    valor: float = Field(..., ge=0, description="Valor del ítem")
    notas: Optional[str] = Field("", description="Notas adicionales")
    clienteNombre: Optional[str] = Field(None, description="Nombre del cliente (compra manual)")
    clienteTelefono: Optional[str] = Field(None, description="Teléfono del cliente (compra manual)")
    origen: Optional[str] = Field("manual", description="Origen: web o manual")
    productoDetalle: Optional[ProductoDetalle] = Field(None, description="Detalles del producto")

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
