from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.core.firebase import db, firebase_auth
from app.models.quote import QuoteCreate, QuoteUpdate, QuoteResponse
from app.api.deps import RoleChecker, get_firebase_uid
from datetime import datetime
from typing import List, Optional

router = APIRouter()

DEFAULT_PRECIO_KWH_HORA = 950.0
DEFAULT_PRECIO_FILAMENTO_KG = 87000.0

CLIENT_PRODUCT_FIELDS = {
    "nombre",
    "tamanoHorizontal",
    "tamanoVertical",
    "unidades",
    "accesorios",
    "personalizacion",
    "personalizacionOtraText",
    "empaque",
    "empaqueOtraText",
    "imagenUrl",
}

def round_money(value: float) -> float:
    return round(float(value or 0), 2)

def clean_client_product(product) -> dict:
    data = product.dict()
    return {key: data.get(key) for key in CLIENT_PRODUCT_FIELDS}

def reset_product_costs(product_data: dict) -> dict:
    product_data.update({
        "duracionImpresionUnidad": 0.0,
        "filamentoUsadoUnidad": 0.0,
        "valorEmpaqueUnitario": 0.0,
        "valorPersonalizacionUnitario": 0.0,
        "porcentajeGanancia": 30.0,
        "precioKwhHora": DEFAULT_PRECIO_KWH_HORA,
        "precioKwhMinuto": round_money(DEFAULT_PRECIO_KWH_HORA / 60),
        "precioFilamentoKg": DEFAULT_PRECIO_FILAMENTO_KG,
        "precioFilamentoGramo": round_money(DEFAULT_PRECIO_FILAMENTO_KG / 1000),
        "costoFabricacionUnitario": 0.0,
        "precioUnitario": 0.0,
        "precioConGananciaUnitario": 0.0,
        "precioTotalUnitario": 0.0,
        "subtotalFabricacionTotal": 0.0,
        "gananciaTotal": 0.0,
        "precioTotal": 0.0,
        "Precio_Unitario": 0.0,
        "Valor_Ganancia_Total": 0.0,
        "Precio_Total": 0.0,
        "Subtotal_Fabricacion_Total": 0.0,
    })
    return product_data

def calculate_product(product, precio_kwh_hora: float, precio_filamento_kg: float) -> dict:
    data = product.dict()
    unidades = data["unidades"]
    duracion = data.get("duracionImpresionUnidad") or 0.0
    filamento = data.get("filamentoUsadoUnidad") or 0.0
    valor_empaque = data.get("valorEmpaqueUnitario") or 0.0
    valor_personalizacion = data.get("valorPersonalizacionUnitario") or 0.0
    porcentaje_ganancia = data.get("porcentajeGanancia") if data.get("porcentajeGanancia") is not None else 30.0

    precio_kwh_minuto = precio_kwh_hora / 60
    precio_filamento_gramo = precio_filamento_kg / 1000
    costo_energia_unitario = duracion * precio_kwh_minuto
    costo_filamento_unitario = filamento * precio_filamento_gramo
    costo_fabricacion_unitario = costo_energia_unitario + costo_filamento_unitario
    precio_unitario = costo_fabricacion_unitario * (1 + porcentaje_ganancia / 100)
    precio_total_unitario = precio_unitario + valor_empaque + valor_personalizacion
    subtotal_fabricacion_total = precio_unitario * unidades
    ganancia_total = (precio_unitario - costo_fabricacion_unitario) * unidades
    precio_total = precio_total_unitario * unidades

    data.update({
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
    })
    return data

def get_optional_uid(request: Request) -> Optional[str]:
    """
    Dependency que extrae y verifica el UID de Firebase de forma opcional.
    Si se provee la cabecera Authorization con un token válido, retorna el UID.
    Si la cabecera no se provee, retorna None (para clientes invitados).
    Si la cabecera es inválida o expiró, lanza error 401.
    """
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
    """
    Crea una nueva cotización.
    - Si el usuario está autenticado (uid provisto), sus datos de contacto se obtienen
      de forma segura de Firestore, evitando suplantación o filtración del perfil.
    - Si es invitado, se usan los datos de contacto proveídos en el body.
    - Todos los campos de precios y costos calculados son forzados a cero para evitar manipulación de precios.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de base de datos no disponible."
        )

    # 1. Resolver información del cliente de forma segura
    if uid:
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()
        if not user_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El perfil de usuario autenticado no existe en la base de datos."
            )
        user_data = user_doc.to_dict()
        cliente_data = {
            "uid": uid,
            "nombre": user_data.get("nombre", ""),
            "telefono": user_data.get("telefono", ""),
            "email": user_data.get("email", "")
        }
    else:
        # Validación obligatoria para invitados
        if not quote_in.cliente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Se requieren los datos de contacto del cliente para cotizaciones de invitados."
            )
        if not quote_in.cliente.nombre.strip() or not quote_in.cliente.telefono.strip() or not quote_in.cliente.email.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre, teléfono y correo son obligatorios para invitados."
            )
        cliente_data = {
            "uid": None,
            "nombre": quote_in.cliente.nombre.strip(),
            "telefono": quote_in.cliente.telefono.strip(),
            "email": quote_in.cliente.email.strip()
        }

    # 2. Formatear y purgar los productos. El backend descarta cualquier costo enviado por cliente.
    productos_dict = []
    for prod in quote_in.productos:
        productos_dict.append(reset_product_costs(clean_client_product(prod)))

    # 3. Documento base de la cotización
    quote_doc = {
        "cliente": cliente_data,
        "productos": productos_dict,
        "estado": "pendiente",
        "creadoEn": datetime.utcnow().isoformat(),
        "actualizadoEn": None,
        "precioKwhHora": DEFAULT_PRECIO_KWH_HORA,
        "precioFilamentoKg": DEFAULT_PRECIO_FILAMENTO_KG,
        "subtotalFabricacionTotal": 0.0,
        "valorGananciaTotal": 0.0,
        "precioTotalCotizacion": 0.0,
        "Subtotal_Fabricacion_Total": 0.0,
        "Valor_Ganancia_Total": 0.0,
        "Precio_Total_Cotizacion": 0.0
    }

    try:
        # Guardar documento en Firestore
        doc_ref = db.collection("quotes").document()
        doc_ref.set(quote_doc)
        
        quote_doc["id"] = doc_ref.id
        return quote_doc
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar la cotización en Firestore: {str(e)}"
        )

@router.get("", response_model=List[QuoteResponse])
def get_all_quotes(
    current_user: dict = Depends(RoleChecker(["administrador", "colaborador"]))
):
    """
    Retorna la lista de todas las cotizaciones de Firestore (orden descendente por fecha de creación).
    Acceso restringido únicamente a Administradores y Colaboradores.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de base de datos no disponible."
        )
    try:
        quotes_ref = db.collection("quotes").order_by("creadoEn", direction="DESCENDING")
        docs = quotes_ref.stream()
        
        quotes_list = []
        for doc in docs:
            q_data = doc.to_dict()
            q_data["id"] = doc.id
            quotes_list.append(q_data)
            
        return quotes_list
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener cotizaciones: {str(e)}"
        )

@router.get("/my", response_model=List[QuoteResponse])
def get_my_quotes(
    uid: str = Depends(get_firebase_uid)
):
    """
    Retorna la lista de cotizaciones que pertenecen al usuario autenticado.
    El UID es extraído directamente del token verificado de Firebase para evitar accesos indebidos.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de base de datos no disponible."
        )
    try:
        quotes_ref = db.collection("quotes").where("cliente.uid", "==", uid)
        docs = quotes_ref.stream()
        
        quotes_list = []
        for doc in docs:
            q_data = doc.to_dict()
            q_data["id"] = doc.id
            quotes_list.append(q_data)
            
        # Ordenar localmente
        quotes_list.sort(key=lambda x: x.get("creadoEn", ""), reverse=True)
        return quotes_list
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener tus cotizaciones: {str(e)}"
        )

@router.get("/{quote_id}", response_model=QuoteResponse)
def get_quote_by_id(
    quote_id: str,
    uid: str = Depends(get_firebase_uid)
):
    """
    Obtiene los detalles de una cotización específica.
    Permite acceso si:
    - El usuario autenticado es el propietario de la cotización (cliente.uid coincide con el token).
    - El usuario tiene rol de Administrador o Colaborador.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de base de datos no disponible."
        )
    
    quote_ref = db.collection("quotes").document(quote_id)
    quote_doc = quote_ref.get()
    
    if not quote_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La cotización no existe."
        )
        
    q_data = quote_doc.to_dict()
    q_data["id"] = quote_doc.id
    
    # Consultar rol de usuario
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no registrado en base de datos de Firestore."
        )
    user_role = user_doc.to_dict().get("rol", "cliente")
    
    is_owner = q_data.get("cliente", {}).get("uid") == uid
    is_staff = user_role in ["administrador", "colaborador"]
    
    if not is_owner and not is_staff:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos suficientes para ver los detalles de esta cotización."
        )
        
    return q_data

@router.put("/{quote_id}", response_model=QuoteResponse)
def update_quote(
    quote_id: str,
    quote_up: QuoteUpdate,
    current_user: dict = Depends(RoleChecker(["administrador", "colaborador"]))
):
    """
    Actualiza el estado y cálculos de una cotización.
    Restringido a Administradores y Colaboradores.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de base de datos no disponible."
        )

    quote_ref = db.collection("quotes").document(quote_id)
    quote_doc = quote_ref.get()
    
    if not quote_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La cotización solicitada no existe."
        )

    try:
        productos_dict = [
            calculate_product(p, quote_up.precioKwhHora, quote_up.precioFilamentoKg)
            for p in quote_up.productos
        ]
        subtotal_fabricacion = round_money(sum(p["subtotalFabricacionTotal"] for p in productos_dict))
        valor_ganancia = round_money(sum(p["gananciaTotal"] for p in productos_dict))
        precio_total = round_money(sum(p["precioTotal"] for p in productos_dict))
        
        update_data = {
            "productos": productos_dict,
            "estado": quote_up.estado,
            "precioKwhHora": round_money(quote_up.precioKwhHora),
            "precioFilamentoKg": round_money(quote_up.precioFilamentoKg),
            "subtotalFabricacionTotal": subtotal_fabricacion,
            "valorGananciaTotal": valor_ganancia,
            "precioTotalCotizacion": precio_total,
            # Mayúsculas por compatibilidad con el frontend
            "Subtotal_Fabricacion_Total": subtotal_fabricacion,
            "Valor_Ganancia_Total": valor_ganancia,
            "Precio_Total_Cotizacion": precio_total,
            "actualizadoEn": datetime.utcnow().isoformat()
        }
        
        quote_ref.update(update_data)
        
        final_doc = quote_ref.get().to_dict()
        final_doc["id"] = quote_id
        return final_doc
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar la cotización: {str(e)}"
        )
