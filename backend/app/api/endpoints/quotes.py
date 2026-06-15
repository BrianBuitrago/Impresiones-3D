from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.core.firebase import db, firebase_auth
from app.models.quote import QuoteCreate, QuoteUpdate, QuoteResponse
from app.api.deps import RoleChecker, get_firebase_uid
from datetime import datetime
from typing import Any, List, Optional

router = APIRouter()

DEFAULT_PRECIO_KWH_HORA = 950.0
DEFAULT_PRECIO_FILAMENTO_KG = 87000.0

CLIENT_PRODUCT_FIELDS = {
    "idProducto", "descripcionLineal", "nombre", "tamanoHorizontal", "tamanoVertical", "unidades",
    "accesorios", "personalizacion", "personalizacionOtraText", "personalizacionComentarios",
    "empaque", "empaqueOtraText", "imagenUrl",
    "tiempoHoras", "tiempoMinutos", "pesoGramos",
    "costoDiseno", "costoAccesorios", "costoPersonalizado", "costoEmpaque",
    "costoDisenoUnitario", "costoAccesoriosUnitario", "valorEmpaqueUnitario", "valorPersonalizacionUnitario",
    "duracionImpresionUnidad", "filamentoUsadoUnidad", "precioKwhHora", "precioFilamentoKg",
    "precioKwhMinuto", "precioFilamentoGramo", "costoFabricacionUnitario", "precioUnitario",
    "precioConGananciaUnitario", "precioTotalUnitario", "subtotalFabricacionTotal", "gananciaTotal",
    "precioTotal", "Precio_Unitario", "Valor_Ganancia_Total", "Precio_Total", "Subtotal_Fabricacion_Total",
    "subtotalEnergia", "subtotalMaterial", "precioLinealTotal",
    "ID_Producto", "Descripcion_Lineal", "Tiempo_Horas", "Tiempo_Minutos", "Peso_Gramos",
    "Cantidad_Piezas", "Costo_Diseño", "Costo_Accesorios", "Costo_Personalizado", "Costo_Empaque",
    "Subtotal_Energia", "Subtotal_Material", "Subtotal_Fabricacion", "Precio_Unitario_Con_Ganancia", "Precio_Lineal_Total",
}

def round_money(value: float) -> float:
    return round(float(value or 0), 2)

def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default

# ─── FIX: convierte DatetimeWithNanoseconds a str antes de pasar a Pydantic ───
def serialize_doc(data: dict) -> dict:
    """Normaliza fechas de Firestore (DatetimeWithNanoseconds → ISO string)."""
    for key, value in data.items():
        if hasattr(value, "isoformat"):
            data[key] = value.isoformat()
    return data
# ──────────────────────────────────────────────────────────────────────────────

def clean_client_product(product) -> dict:
    data = product.dict()
    return {key: data.get(key) for key in CLIENT_PRODUCT_FIELDS}

def reset_product_costs(product_data: dict, index: int = 0) -> dict:
    def safe_value(key: str, fallback: Any = 0.0) -> float:
        return safe_float(product_data.get(key, fallback) or fallback)

    product_data["idProducto"] = product_data.get("idProducto") or f"PROD-{index + 1:03d}"
    product_data["descripcionLineal"] = product_data.get("descripcionLineal") or product_data.get("nombre", "")
    product_data.update({
        "tiempoHoras": safe_value("tiempoHoras"),
        "tiempoMinutos": safe_value("tiempoMinutos"),
        "pesoGramos": safe_value("pesoGramos"),
        "costoDisenoUnitario": safe_value("costoDisenoUnitario", product_data.get("costoDiseno") or 0.0),
        "costoAccesoriosUnitario": safe_value("costoAccesoriosUnitario", product_data.get("costoAccesorios") or 0.0),
        "duracionImpresionUnidad": safe_value("duracionImpresionUnidad"),
        "filamentoUsadoUnidad": safe_value("filamentoUsadoUnidad"),
        "valorEmpaqueUnitario": safe_value("valorEmpaqueUnitario", product_data.get("costoEmpaque") or 0.0),
        "valorPersonalizacionUnitario": safe_value("valorPersonalizacionUnitario", product_data.get("costoPersonalizado") or 0.0),
        "porcentajeGanancia": safe_value("porcentajeGanancia", 30.0) or 30.0,
        "precioKwhHora": safe_value("precioKwhHora", DEFAULT_PRECIO_KWH_HORA),
        "precioKwhMinuto": round_money(safe_value("precioKwhHora", DEFAULT_PRECIO_KWH_HORA) / 60),
        "precioFilamentoKg": safe_value("precioFilamentoKg", DEFAULT_PRECIO_FILAMENTO_KG),
        "precioFilamentoGramo": round_money(safe_value("precioFilamentoKg", DEFAULT_PRECIO_FILAMENTO_KG) / 1000),
        "costoFabricacionUnitario": safe_value("costoFabricacionUnitario"),
        "precioUnitario": safe_value("precioUnitario"),
        "precioConGananciaUnitario": safe_value("precioConGananciaUnitario"),
        "precioTotalUnitario": safe_value("precioTotalUnitario"),
        "subtotalFabricacionTotal": safe_value("subtotalFabricacionTotal"),
        "gananciaTotal": safe_value("gananciaTotal"),
        "precioTotal": safe_value("precioTotal"),
        "Precio_Unitario": safe_value("Precio_Unitario"),
        "Valor_Ganancia_Total": safe_value("Valor_Ganancia_Total"),
        "Precio_Total": safe_value("Precio_Total"),
        "Subtotal_Fabricacion_Total": safe_value("Subtotal_Fabricacion_Total"),
        "subtotalEnergia": safe_value("subtotalEnergia"),
        "subtotalMaterial": safe_value("subtotalMaterial"),
        "precioLinealTotal": safe_value("precioLinealTotal"),
        "ID_Producto": product_data["idProducto"],
        "Descripcion_Lineal": product_data["descripcionLineal"],
        "Tiempo_Horas": safe_value("Tiempo_Horas", product_data.get("tiempoHoras") or 0.0),
        "Tiempo_Minutos": safe_value("Tiempo_Minutos", product_data.get("tiempoMinutos") or 0.0),
        "Peso_Gramos": safe_value("Peso_Gramos", product_data.get("pesoGramos") or 0.0),
        "Cantidad_Piezas": int(product_data.get("unidades", 0)),
        "Costo_Diseño": safe_value("Costo_Diseño", product_data.get("costoDiseno") or 0.0),
        "Costo_Accesorios": safe_value("Costo_Accesorios", product_data.get("costoAccesorios") or 0.0),
        "Costo_Personalizado": safe_value("Costo_Personalizado", product_data.get("costoPersonalizado") or 0.0),
        "Costo_Empaque": safe_value("Costo_Empaque", product_data.get("costoEmpaque") or 0.0),
        "Subtotal_Energia": safe_value("Subtotal_Energia"),
        "Subtotal_Material": safe_value("Subtotal_Material"),
        "Subtotal_Fabricacion": safe_value("Subtotal_Fabricacion"),
        "Precio_Unitario_Con_Ganancia": safe_value("Precio_Unitario_Con_Ganancia"),
        "Precio_Lineal_Total": safe_value("Precio_Lineal_Total"),
    })
    return product_data

def calculate_product(product, precio_kwh_hora: float, precio_filamento_kg: float) -> dict:
    data = product.dict()
    unidades = data["unidades"]
    tiempo_horas = data.get("tiempoHoras") or 0.0
    tiempo_minutos = data.get("tiempoMinutos") or 0.0
    duracion = data.get("duracionImpresionUnidad") or (tiempo_horas * 60) + tiempo_minutos
    if not tiempo_horas and duracion:
        tiempo_horas = int(duracion // 60)
        tiempo_minutos = duracion % 60
    filamento = data.get("pesoGramos") or data.get("filamentoUsadoUnidad") or 0.0
    valor_empaque = data.get("valorEmpaqueUnitario") or data.get("costoEmpaque") or 0.0
    valor_personalizacion = data.get("valorPersonalizacionUnitario") or data.get("costoPersonalizado") or 0.0
    costo_diseno = data.get("costoDisenoUnitario") or data.get("costoDiseno") or 0.0
    costo_accesorios = data.get("costoAccesoriosUnitario") or data.get("costoAccesorios") or 0.0
    porcentaje_ganancia = data.get("porcentajeGanancia") if data.get("porcentajeGanancia") is not None else 30.0

    precio_kwh_minuto = precio_kwh_hora / 60
    precio_filamento_gramo = precio_filamento_kg / 1000
    costo_energia_unitario = duracion * precio_kwh_minuto
    costo_filamento_unitario = filamento * precio_filamento_gramo
    costo_fabricacion_unitario = costo_energia_unitario + costo_filamento_unitario + costo_diseno + costo_accesorios
    precio_unitario = costo_fabricacion_unitario * (1 + porcentaje_ganancia / 100)
    precio_total_unitario = precio_unitario + valor_empaque + valor_personalizacion
    subtotal_energia = costo_energia_unitario * unidades
    subtotal_material = costo_filamento_unitario * unidades
    subtotal_fabricacion_total = costo_fabricacion_unitario * unidades
    ganancia_total = (precio_unitario - costo_fabricacion_unitario) * unidades
    precio_total = precio_total_unitario * unidades

    data.update({
        "idProducto": data.get("idProducto") or data.get("ID_Producto", ""),
        "descripcionLineal": data.get("descripcionLineal") or data.get("Descripcion_Lineal", data.get("nombre", "")),
        "tiempoHoras": round_money(tiempo_horas),
        "tiempoMinutos": round_money(tiempo_minutos),
        "pesoGramos": round_money(filamento),
        "costoDisenoUnitario": round_money(costo_diseno),
        "costoAccesoriosUnitario": round_money(costo_accesorios),
        "duracionImpresionUnidad": round_money(duracion),
        "filamentoUsadoUnidad": round_money(filamento),
        "valorEmpaqueUnitario": round_money(valor_empaque),
        "valorPersonalizacionUnitario": round_money(valor_personalizacion),
        "porcentajeGanancia": round_money(porcentaje_ganancia),
        "precioKwhHora": round_money(precio_kwh_hora),
        "precioKwhMinuto": round_money(precio_kwh_minuto),
        "precioFilamentoKg": round_money(precio_filamento_kg),
        "precioFilamentoGramo": round_money(precio_filamento_gramo),
        "costoFabricacionUnitario": round_money(costo_fabricacion_unitario),
        "precioUnitario": round_money(precio_unitario),
        "precioConGananciaUnitario": round_money(precio_unitario),
        "precioTotalUnitario": round_money(precio_total_unitario),
        "subtotalFabricacionTotal": round_money(subtotal_fabricacion_total),
        "gananciaTotal": round_money(ganancia_total),
        "precioTotal": round_money(precio_total),
        "Precio_Unitario": round_money(precio_unitario),
        "Valor_Ganancia_Total": round_money(ganancia_total),
        "Precio_Total": round_money(precio_total),
        "Subtotal_Fabricacion_Total": round_money(subtotal_fabricacion_total),
        "subtotalEnergia": round_money(subtotal_energia),
        "subtotalMaterial": round_money(subtotal_material),
        "precioLinealTotal": round_money(precio_total),
        "ID_Producto": data.get("idProducto") or data.get("ID_Producto", ""),
        "Descripcion_Lineal": data.get("descripcionLineal") or data.get("Descripcion_Lineal", data.get("nombre", "")),
        "Tiempo_Horas": round_money(tiempo_horas),
        "Tiempo_Minutos": round_money(tiempo_minutos),
        "Peso_Gramos": round_money(filamento),
        "Cantidad_Piezas": unidades,
        "Costo_Diseño": round_money(costo_diseno),
        "Costo_Accesorios": round_money(costo_accesorios),
        "Costo_Personalizado": round_money(valor_personalizacion),
        "Costo_Empaque": round_money(valor_empaque),
        "Subtotal_Energia": round_money(subtotal_energia),
        "Subtotal_Material": round_money(subtotal_material),
        "Subtotal_Fabricacion": round_money(subtotal_fabricacion_total),
        "Precio_Unitario_Con_Ganancia": round_money(precio_unitario),
        "Precio_Lineal_Total": round_money(precio_total),
    })
    return data

def get_optional_uid(request: Request) -> Optional[str]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    if firebase_auth is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de autenticacion no disponible."
        )
    token = auth_header.split(" ")[1]
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token.get("uid")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token de autenticación inválido o vencido: {str(e)}"
        )


@router.post("", response_model=QuoteResponse, status_code=status.HTTP_201_CREATED)
def create_quote(quote_in: QuoteCreate, uid: Optional[str] = Depends(get_optional_uid)):
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Servicio de base de datos no disponible.")
    if uid:
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()
        if not user_doc.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail="El perfil de usuario autenticado no existe en la base de datos.")
        user_data = user_doc.to_dict()
        cliente_data = {
            "uid": uid,
            "nombre": user_data.get("nombre", ""),
            "telefono": user_data.get("telefono", ""),
            "email": user_data.get("email", ""),
            "cedula": user_data.get("cedula", "")
        }
    else:
        if not quote_in.cliente:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Se requieren los datos de contacto del cliente para cotizaciones de invitados.")
        if not quote_in.cliente.nombre.strip() or not quote_in.cliente.telefono.strip() or not quote_in.cliente.email.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="El nombre, teléfono y correo son obligatorios para invitados.")
        cliente_data = {
            "uid": None,
            "nombre": quote_in.cliente.nombre.strip(),
            "telefono": quote_in.cliente.telefono.strip(),
            "email": quote_in.cliente.email.strip(),
            "cedula": (quote_in.cliente.cedula or "").strip()
        }

    productos_dict = [
        reset_product_costs(clean_client_product(prod), idx)
        for idx, prod in enumerate(quote_in.productos)
    ]
    fecha = datetime.utcnow().isoformat()
    cantidad_total_piezas = sum(p.get("unidades", 0) for p in productos_dict)
    notas_cotizacion = (quote_in.notasCotizacion or "").strip()

    quote_doc = {
        "cliente": cliente_data,
        "productos": productos_dict,
        "estado": "pendiente",
        "creadoEn": fecha,
        "actualizadoEn": None,
        "precioKwhHora": DEFAULT_PRECIO_KWH_HORA,
        "precioFilamentoKg": DEFAULT_PRECIO_FILAMENTO_KG,
        "porcentajeGanancia": 30.0,
        "subtotalFabricacionTotal": 0.0,
        "valorGananciaTotal": 0.0,
        "precioTotal": 0.0,
        "precioTotalCotizacion": 0.0,
        "cantidadTotalPiezas": cantidad_total_piezas,
        "notasCotizacion": notas_cotizacion,
        "Fecha": fecha,
        "ID_Cliente": cliente_data.get("uid"),
        "Porcentaje_Ganancia": 30.0,
        "Subtotal_Fabricacion_Total": 0.0,
        "Valor_Ganancia_Total": 0.0,
        "Precio_Total": 0.0,
        "Cantidad_Total_Piezas": cantidad_total_piezas,
        "Notas_Cotizacion": notas_cotizacion,
        "Precio_Total_Cotizacion": 0.0
    }

    try:
        doc_ref = db.collection("quotes").document()
        doc_ref.set(quote_doc)
        quote_doc["id"] = doc_ref.id
        return quote_doc
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Error al guardar la cotización en Firestore: {str(e)}")


@router.get("", response_model=List[QuoteResponse])
def get_all_quotes(
    current_user: dict = Depends(RoleChecker(["administrador", "colaborador"]))
):
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Servicio de base de datos no disponible.")
    try:
        quotes_ref = db.collection("quotes").order_by("creadoEn", direction="DESCENDING")
        docs = quotes_ref.stream()
        quotes_list = []
        for doc in docs:
            q_data = doc.to_dict()
            q_data["id"] = doc.id
            quotes_list.append(serialize_doc(q_data))  # ← FIX
        return quotes_list
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Error al obtener cotizaciones: {str(e)}")


@router.get("/my", response_model=List[QuoteResponse])
def get_my_quotes(uid: str = Depends(get_firebase_uid)):
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Servicio de base de datos no disponible.")
    try:
        quotes_ref = db.collection("quotes").where("cliente.uid", "==", uid)
        docs = quotes_ref.stream()
        quotes_list = []
        for doc in docs:
            q_data = doc.to_dict()
            q_data["id"] = doc.id
            quotes_list.append(serialize_doc(q_data))  # ← FIX
        quotes_list.sort(key=lambda x: x.get("creadoEn", ""), reverse=True)
        return quotes_list
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Error al obtener tus cotizaciones: {str(e)}")


@router.get("/{quote_id}", response_model=QuoteResponse)
def get_quote_by_id(quote_id: str, uid: str = Depends(get_firebase_uid)):
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Servicio de base de datos no disponible.")
    quote_ref = db.collection("quotes").document(quote_id)
    quote_doc = quote_ref.get()
    if not quote_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="La cotización no existe.")
    q_data = quote_doc.to_dict()
    q_data["id"] = quote_doc.id
    serialize_doc(q_data)  # ← FIX

    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Usuario no registrado en base de datos de Firestore.")
    user_role = user_doc.to_dict().get("rol", "cliente")
    is_owner = q_data.get("cliente", {}).get("uid") == uid
    is_staff = user_role in ["administrador", "colaborador"]
    if not is_owner and not is_staff:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="No tienes permisos suficientes para ver los detalles de esta cotización.")
    return q_data


@router.put("/{quote_id}", response_model=QuoteResponse)
def update_quote(
    quote_id: str,
    quote_up: QuoteUpdate,
    current_user: dict = Depends(RoleChecker(["administrador", "colaborador"]))
):
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Servicio de base de datos no disponible.")
    quote_ref = db.collection("quotes").document(quote_id)
    quote_doc = quote_ref.get()
    if not quote_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="La cotización solicitada no existe.")
    try:
        productos_dict = [
            calculate_product(p, quote_up.precioKwhHora, quote_up.precioFilamentoKg)
            for p in quote_up.productos
        ]
        subtotal_fabricacion = round_money(sum(p["subtotalFabricacionTotal"] for p in productos_dict))
        valor_ganancia = round_money(sum(p["gananciaTotal"] for p in productos_dict))
        precio_total = round_money(sum(p["precioTotal"] for p in productos_dict))
        cantidad_total_piezas = sum(p.get("unidades", 0) for p in productos_dict)
        porcentaje_ganancia = quote_up.porcentajeGanancia if quote_up.porcentajeGanancia is not None else 30.0
        notas_cotizacion = (quote_up.notasCotizacion or "").strip()

        update_data = {
            "productos": productos_dict,
            "estado": quote_up.estado,
            "precioKwhHora": round_money(quote_up.precioKwhHora),
            "precioFilamentoKg": round_money(quote_up.precioFilamentoKg),
            "porcentajeGanancia": round_money(porcentaje_ganancia),
            "subtotalFabricacionTotal": subtotal_fabricacion,
            "valorGananciaTotal": valor_ganancia,
            "precioTotal": precio_total,
            "precioTotalCotizacion": precio_total,
            "cantidadTotalPiezas": cantidad_total_piezas,
            "notasCotizacion": notas_cotizacion,
            "Porcentaje_Ganancia": round_money(porcentaje_ganancia),
            "Subtotal_Fabricacion_Total": subtotal_fabricacion,
            "Valor_Ganancia_Total": valor_ganancia,
            "Precio_Total": precio_total,
            "Cantidad_Total_Piezas": cantidad_total_piezas,
            "Notas_Cotizacion": notas_cotizacion,
            "Precio_Total_Cotizacion": precio_total,
            "actualizadoEn": datetime.utcnow().isoformat()
        }
        quote_ref.update(update_data)
        final_doc = quote_ref.get().to_dict()
        final_doc["id"] = quote_id
        serialize_doc(final_doc)  # ← FIX
        return final_doc
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Error al actualizar la cotización: {str(e)}")
