from pydantic import BaseModel, EmailStr, Field, root_validator, validator
from typing import List, Optional

class ClienteInfo(BaseModel):
    uid: Optional[str] = Field(None, description="UID del cliente en Firebase (si está registrado)")
    nombre: str = Field(..., min_length=2, max_length=120, description="Nombre del cliente")
    telefono: str = Field(..., min_length=7, max_length=30, description="Telefono de contacto")
    email: EmailStr = Field(..., description="Correo electronico")

class ProductoItem(BaseModel):
    idProducto: Optional[str] = Field("", max_length=80)
    descripcionLineal: Optional[str] = Field("", max_length=700)
    nombre: str = Field(..., min_length=2, max_length=120, description="Nombre de la pieza o diseño")
    tamanoHorizontal: float = Field(..., gt=0, le=10000, description="Tamaño horizontal en mm")
    tamanoVertical: float = Field(..., gt=0, le=10000, description="Tamaño vertical en mm")
    unidades: int = Field(..., ge=1, le=1000, description="Unidades requeridas")
    accesorios: Optional[str] = Field("", max_length=500, description="Accesorios requeridos opcionales")
    personalizacion: List[str] = Field(default_factory=list, description="Tipos de personalización seleccionados")
    personalizacionOtraText: Optional[str] = Field("", max_length=300, description="Detalle si se seleccionó 'Otra'")
    empaque: str = Field(..., description="Tipo de empaque")
    empaqueOtraText: Optional[str] = Field("", max_length=300, description="Detalle si se seleccionó 'Otra'")
    imagenUrl: Optional[str] = Field("", max_length=1000, description="URL de la imagen de referencia")

    tiempoHoras: Optional[float] = 0.0
    tiempoMinutos: Optional[float] = 0.0
    pesoGramos: Optional[float] = 0.0
    costoDisenoUnitario: Optional[float] = 0.0
    costoAccesoriosUnitario: Optional[float] = 0.0
    duracionImpresionUnidad: Optional[float] = 0.0
    filamentoUsadoUnidad: Optional[float] = 0.0
    valorEmpaqueUnitario: Optional[float] = 0.0
    valorPersonalizacionUnitario: Optional[float] = 0.0
    porcentajeGanancia: Optional[float] = 30.0
    precioKwhHora: Optional[float] = 950.0
    precioKwhMinuto: Optional[float] = 15.8
    precioFilamentoKg: Optional[float] = 87000.0
    precioFilamentoGramo: Optional[float] = 87.0
    costoFabricacionUnitario: Optional[float] = 0.0
    precioUnitario: Optional[float] = 0.0
    precioConGananciaUnitario: Optional[float] = 0.0
    precioTotalUnitario: Optional[float] = 0.0
    subtotalFabricacionTotal: Optional[float] = 0.0
    gananciaTotal: Optional[float] = 0.0
    precioTotal: Optional[float] = 0.0
    Precio_Unitario: Optional[float] = 0.0
    Valor_Ganancia_Total: Optional[float] = 0.0
    Precio_Total: Optional[float] = 0.0
    Subtotal_Fabricacion_Total: Optional[float] = 0.0
    subtotalEnergia: Optional[float] = 0.0
    subtotalMaterial: Optional[float] = 0.0
    precioLinealTotal: Optional[float] = 0.0

    @root_validator(pre=True)
    def normalize_product_aliases(cls, values):
        if not isinstance(values, dict):
            return values
        aliases = {
            "ID_Producto": "idProducto",
            "Descripcion_Lineal": "descripcionLineal",
            "Tiempo_Horas": "tiempoHoras",
            "Tiempo_Minutos": "tiempoMinutos",
            "Peso_Gramos": "pesoGramos",
            "Cantidad_Piezas": "unidades",
            "Costo_Diseno": "costoDisenoUnitario",
            "Costo_Diseño": "costoDisenoUnitario",
            "costoDiseno": "costoDisenoUnitario",
            "Costo_Accesorios": "costoAccesoriosUnitario",
            "costoAccesorios": "costoAccesoriosUnitario",
            "Costo_Personalizado": "valorPersonalizacionUnitario",
            "costoPersonalizado": "valorPersonalizacionUnitario",
            "Costo_Empaque": "valorEmpaqueUnitario",
            "costoEmpaque": "valorEmpaqueUnitario",
            "Subtotal_Energia": "subtotalEnergia",
            "Subtotal_Material": "subtotalMaterial",
            "Subtotal_Fabricacion": "subtotalFabricacionTotal",
            "Precio_Unitario_Con_Ganancia": "precioConGananciaUnitario",
            "Precio_Lineal_Total": "precioLinealTotal",
        }
        for source, target in aliases.items():
            if source in values and target not in values:
                values[target] = values[source]
        return values

    @validator("idProducto", "descripcionLineal", "nombre", "accesorios", "personalizacionOtraText", "empaqueOtraText", "imagenUrl", pre=True, always=True)
    def strip_text(cls, value):
        if value is None:
            return ""
        return value.strip() if isinstance(value, str) else value

    @validator("personalizacion")
    def validate_personalizacion(cls, value):
        allowed = {"cosmeticos", "pintura base", "otra"}
        clean = []
        for item in value:
            normalized = item.strip().lower()
            if normalized not in allowed:
                raise ValueError("Personalizacion no permitida.")
            if normalized not in clean:
                clean.append(normalized)
        return clean

    @validator("personalizacionOtraText", always=True)
    def validate_personalizacion_otra(cls, value, values):
        if "otra" in values.get("personalizacion", []) and not value:
            raise ValueError("Debes describir la personalizacion marcada como otra.")
        return value

    @validator("empaque")
    def validate_empaque(cls, value):
        normalized = value.strip().lower()
        allowed = {"ninguno", "bolsa", "caja", "otra"}
        if normalized not in allowed:
            raise ValueError("Tipo de empaque no permitido.")
        return normalized

    @validator("empaqueOtraText", always=True)
    def validate_empaque_otro(cls, value, values):
        if values.get("empaque") == "otra" and not value:
            raise ValueError("Debes describir el empaque marcado como otro.")
        return value

    @validator(
        "duracionImpresionUnidad", "filamentoUsadoUnidad", "valorEmpaqueUnitario",
        "valorPersonalizacionUnitario", "tiempoHoras", "tiempoMinutos", "pesoGramos",
        "costoDisenoUnitario", "costoAccesoriosUnitario", "precioKwhHora", "precioKwhMinuto",
        "precioFilamentoKg", "precioFilamentoGramo", "costoFabricacionUnitario",
        "precioUnitario", "precioConGananciaUnitario", "precioTotalUnitario",
        "subtotalFabricacionTotal", "gananciaTotal", "precioTotal",
        "Precio_Unitario", "Valor_Ganancia_Total", "Precio_Total", "Subtotal_Fabricacion_Total",
        "subtotalEnergia", "subtotalMaterial", "precioLinealTotal",
        always=True,
    )
    def validate_non_negative_number(cls, value):
        if value is None:
            return 0.0
        if value < 0:
            raise ValueError("Los valores numericos de calculo no pueden ser negativos.")
        return value

    @validator("porcentajeGanancia", always=True)
    def validate_porcentaje_ganancia(cls, value):
        if value is None:
            return 30.0
        if value < 0 or value > 1000:
            raise ValueError("El porcentaje de ganancia debe estar entre 0 y 1000.")
        return value

    class Config:
        extra = "allow"


class QuoteCreate(BaseModel):
    productos: List[ProductoItem] = Field(..., min_items=1, max_items=5, description="Lista de productos a cotizar")
    cliente: Optional[ClienteInfo] = Field(None, description="Datos de contacto si es invitado")
    notasCotizacion: Optional[str] = Field("", max_length=1000)
    precioTotalCotizacion: Optional[float] = None
    subtotalFabricacionTotal: Optional[float] = None
    valorGananciaTotal: Optional[float] = None
    porcentajeGanancia: Optional[float] = None
    cantidadTotalPiezas: Optional[int] = None
    Fecha: Optional[str] = None
    ID_Cliente: Optional[str] = None
    Porcentaje_Ganancia: Optional[float] = None
    Valor_Ganancia_Total: Optional[float] = None
    Precio_Total_Cotizacion: Optional[float] = None
    Subtotal_Fabricacion_Total: Optional[float] = None
    Cantidad_Total_Piezas: Optional[int] = None
    Notas_Cotizacion: Optional[str] = None

    @root_validator(pre=True)
    def normalize_quote_create_aliases(cls, values):
        if isinstance(values, dict):
            aliases = {
                "Notas_Cotizacion": "notasCotizacion",
                "Precio_Total_Cotizacion": "precioTotalCotizacion",
                "Subtotal_Fabricacion_Total": "subtotalFabricacionTotal",
                "Valor_Ganancia_Total": "valorGananciaTotal",
                "Porcentaje_Ganancia": "porcentajeGanancia",
                "Cantidad_Total_Piezas": "cantidadTotalPiezas",
                "ID_Cliente": "ID_Cliente",
                "Fecha": "Fecha",
            }
            for source, target in aliases.items():
                if source in values and target not in values:
                    values[target] = values[source]
        return values


class QuoteUpdate(BaseModel):
    productos: List[ProductoItem] = Field(..., min_items=1, max_items=5, description="Lista de productos con cálculos actualizados")
    estado: str = Field(..., description="Estado de la cotización (pendiente, cotizado, aceptado, rechazado)")
    precioKwhHora: float = Field(..., ge=0, le=1000000, description="Precio global de energía por Kw/h")
    precioFilamentoKg: float = Field(..., ge=0, le=10000000, description="Precio global de filamento por Kg")
    subtotalFabricacionTotal: float = Field(0.0, ge=0, description="Subtotal de fabricación de todos los productos")
    valorGananciaTotal: float = Field(0.0, ge=0, description="Ganancia total acumulada")
    precioTotalCotizacion: float = Field(0.0, ge=0, description="Precio total final de la cotización")
    porcentajeGanancia: Optional[float] = Field(30.0, ge=0, le=1000)
    notasCotizacion: Optional[str] = Field("", max_length=1000)

    @root_validator(pre=True)
    def normalize_quote_update_aliases(cls, values):
        if not isinstance(values, dict):
            return values
        aliases = {
            "Porcentaje_Ganancia": "porcentajeGanancia",
            "Notas_Cotizacion": "notasCotizacion",
            "Subtotal_Fabricacion_Total": "subtotalFabricacionTotal",
            "Valor_Ganancia_Total": "valorGananciaTotal",
            "Precio_Total_Cotizacion": "precioTotalCotizacion",
        }
        for source, target in aliases.items():
            if source in values and target not in values:
                values[target] = values[source]
        return values

    @validator("estado")
    def validate_estado(cls, value):
        normalized = value.strip().lower()
        allowed = {"pendiente", "cotizado", "aceptado", "rechazado"}
        if normalized not in allowed:
            raise ValueError("Estado de cotizacion no permitido.")
        return normalized

    class Config:
        extra = "allow"


# ─── FIX: QuoteResponse acepta DatetimeWithNanoseconds de Firestore ───────────
class QuoteResponse(BaseModel):
    id: str = Field(..., description="ID del documento en Firestore")
    cliente: ClienteInfo
    productos: List[ProductoItem]
    estado: str = Field("pendiente", description="Estado de la cotización")
    creadoEn: Optional[str] = None        # ← era `str`, ahora Optional[str]
    actualizadoEn: Optional[str] = None
    precioKwhHora: Optional[float] = None
    precioFilamentoKg: Optional[float] = None
    porcentajeGanancia: Optional[float] = None
    subtotalFabricacionTotal: Optional[float] = None
    valorGananciaTotal: Optional[float] = None
    precioTotal: Optional[float] = None
    precioTotalCotizacion: Optional[float] = None
    cantidadTotalPiezas: Optional[int] = None
    notasCotizacion: Optional[str] = None
    Subtotal_Fabricacion_Total: Optional[float] = None
    Valor_Ganancia_Total: Optional[float] = None
    Precio_Total: Optional[float] = None
    Precio_Total_Cotizacion: Optional[float] = None
    Fecha: Optional[str] = None
    ID_Cliente: Optional[str] = None
    Porcentaje_Ganancia: Optional[float] = None
    Cantidad_Total_Piezas: Optional[int] = None
    Notas_Cotizacion: Optional[str] = None

    @validator("creadoEn", "actualizadoEn", pre=True, always=True)
    def parse_datetime_field(cls, v):
        """Convierte DatetimeWithNanoseconds de Firestore a string ISO 8601."""
        if v is None:
            return None
        if hasattr(v, "isoformat"):   # DatetimeWithNanoseconds y datetime estándar
            return v.isoformat()
        return str(v)

    class Config:
        extra = "allow"
