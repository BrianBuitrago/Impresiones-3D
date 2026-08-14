from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.core.firebase import db, firebase_auth
from app.models.quote import QuoteCreate, QuoteUpdate, QuoteResponse, SubEstadoUpdate, strip_monetary_fields
from app.api.deps import RoleChecker, get_firebase_uid
from app.utils.firestore import serialize_doc
from app.services.pricing import round_money, calculate_product, get_precios_globales
from datetime import datetime
from typing import List, Optional

router = APIRouter()

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

    precio_kwh_hora, precio_filamento_kg = get_precios_globales(db)

    productos_dict = []
    for idx, prod in enumerate(quote_in.productos):
        calculado = calculate_product(prod, precio_kwh_hora, precio_filamento_kg)
        if not calculado.get("idProducto"):
            calculado["idProducto"] = f"PROD-{idx + 1:03d}"
            calculado["ID_Producto"] = calculado["idProducto"]
        if not calculado.get("descripcionLineal"):
            calculado["descripcionLineal"] = calculado.get("nombre", "")
            calculado["Descripcion_Lineal"] = calculado["descripcionLineal"]
        productos_dict.append(calculado)

    subtotal_fabricacion = round_money(sum(p["subtotalFabricacionTotal"] for p in productos_dict))
    valor_ganancia = round_money(sum(p["gananciaTotal"] for p in productos_dict))
    precio_total = round_money(sum(p["precioTotal"] for p in productos_dict))
    fecha = datetime.utcnow().isoformat()
    cantidad_total_piezas = sum(p.get("unidades", 0) for p in productos_dict)
    notas_cotizacion = (quote_in.notasCotizacion or "").strip()

    quote_doc = {
        "cliente": cliente_data,
        "productos": productos_dict,
        "estado": "pendiente",
        "creadoEn": fecha,
        "actualizadoEn": None,
        "precioKwhHora": precio_kwh_hora,
        "precioFilamentoKg": precio_filamento_kg,
        "porcentajeGanancia": 30.0,
        "subtotalFabricacionTotal": subtotal_fabricacion,
        "valorGananciaTotal": valor_ganancia,
        "precioTotal": precio_total,
        "precioTotalCotizacion": precio_total,
        "cantidadTotalPiezas": cantidad_total_piezas,
        "notasCotizacion": notas_cotizacion,
        "Fecha": fecha,
        "ID_Cliente": cliente_data.get("uid"),
        "Porcentaje_Ganancia": 30.0,
        "Subtotal_Fabricacion_Total": subtotal_fabricacion,
        "Valor_Ganancia_Total": valor_ganancia,
        "Precio_Total": precio_total,
        "Cantidad_Total_Piezas": cantidad_total_piezas,
        "Notas_Cotizacion": notas_cotizacion,
        "Precio_Total_Cotizacion": precio_total
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
    estado: str | None = None,
    fecha_desde: str | None = None,
    fecha_hasta: str | None = None,
    current_user: dict = Depends(RoleChecker(["administrador", "colaborador"]))
):
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Servicio de base de datos no disponible.")
    try:
        query = db.collection("quotes")
        if estado:
            query = query.where("estado", "==", estado.strip().lower())
        query = query.order_by("creadoEn", direction="DESCENDING")
        docs = query.stream()
        quotes_list = []
        is_colaborador = current_user.get("rol") == "colaborador"
        for doc in docs:
            q_data = doc.to_dict()
            q_data["id"] = doc.id
            serialized = serialize_doc(q_data)
            fecha_val = serialized.get("Fecha") or serialized.get("creadoEn") or ""
            if fecha_desde and fecha_val < fecha_desde:
                continue
            if fecha_hasta and fecha_val > fecha_hasta:
                continue
            if is_colaborador:
                serialized = strip_monetary_fields(serialized)
            quotes_list.append(serialized)
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
    if user_role == "colaborador":
        q_data = strip_monetary_fields(q_data)
    return q_data


@router.put("/{quote_id}", response_model=QuoteResponse)
def update_quote(
    quote_id: str,
    quote_up: QuoteUpdate,
    current_user: dict = Depends(RoleChecker(["administrador"]))
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
        if quote_up.subEstado is not None:
            update_data["subEstado"] = quote_up.subEstado
        quote_ref.update(update_data)
        final_doc = quote_ref.get().to_dict()
        final_doc["id"] = quote_id
        serialize_doc(final_doc)  # ← FIX
        return final_doc
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Error al actualizar la cotización: {str(e)}")


@router.patch("/{quote_id}/subestado", response_model=QuoteResponse)
def update_quote_subestado(
    quote_id: str,
    payload: SubEstadoUpdate,
    current_user: dict = Depends(RoleChecker(["administrador", "colaborador"]))
):
    """Actualiza únicamente el sub-estado de producción/entrega, sin tocar
    productos ni precios — es lo único que un colaborador puede modificar
    de una cotización, y no necesita ver ni reenviar datos de precio para usarlo."""
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Servicio de base de datos no disponible.")
    quote_ref = db.collection("quotes").document(quote_id)
    if not quote_ref.get().exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="La cotización solicitada no existe.")
    try:
        quote_ref.update({
            "subEstado": payload.subEstado,
            "actualizadoEn": datetime.utcnow().isoformat(),
        })
        final_doc = quote_ref.get().to_dict()
        final_doc["id"] = quote_id
        serialize_doc(final_doc)
        if current_user.get("rol") == "colaborador":
            final_doc = strip_monetary_fields(final_doc)
        return final_doc
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Error al actualizar el sub-estado: {str(e)}")
