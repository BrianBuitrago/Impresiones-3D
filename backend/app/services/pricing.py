DEFAULT_PRECIO_KWH_HORA = 900.0
DEFAULT_PRECIO_FILAMENTO_KG = 85000.0


def round_money(value: float) -> float:
    return round(float(value or 0), 2)


def get_precios_globales(db) -> tuple[float, float]:
    """Lee los precios base configurables (documento settings/precios) desde Firestore.

    Devuelve (precioKwhHora, precioFilamentoKg). Si el documento no existe todavía
    (nadie configuró precios desde el panel admin) o Firestore no está disponible,
    devuelve los valores por defecto como fallback.
    """
    if db is None:
        return DEFAULT_PRECIO_KWH_HORA, DEFAULT_PRECIO_FILAMENTO_KG
    try:
        doc = db.collection("settings").document("precios").get()
        if doc.exists:
            data = doc.to_dict() or {}
            precio_kwh_hora = float(data.get("precioKwhHora", DEFAULT_PRECIO_KWH_HORA))
            precio_filamento_kg = float(data.get("precioFilamentoKg", DEFAULT_PRECIO_FILAMENTO_KG))
            return precio_kwh_hora, precio_filamento_kg
    except Exception:
        pass
    return DEFAULT_PRECIO_KWH_HORA, DEFAULT_PRECIO_FILAMENTO_KG


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
    costo_procesado = data.get("costoProcesado") or 0.0
    horas_procesado = data.get("horasPostProcesado") or 0.0
    porcentaje_imprevistos = data.get("porcentajeImprevistos") or 0.0
    porcentaje_ganancia = data.get("porcentajeGanancia") if data.get("porcentajeGanancia") is not None else 30.0
    kw_h = data.get("kwH") or 0.0
    kw_min = data.get("kwMin") or 0.0

    precio_kwh_minuto = precio_kwh_hora / 60
    precio_filamento_gramo = precio_filamento_kg / 1000
    if kw_h > 0 or kw_min > 0:
        costo_energia_unitario = (kw_h * tiempo_horas + kw_min * tiempo_minutos / 60) * precio_kwh_hora
    else:
        costo_energia_unitario = duracion * precio_kwh_minuto
    costo_filamento_unitario = filamento * precio_filamento_gramo
    # El subtotal de fabricación incluye empaque y personalización (igual que la hoja de cálculo
    # original del negocio), para que imprevistos y ganancia se apliquen también sobre esos costos.
    costo_fabricacion_unitario = (
        costo_energia_unitario + costo_filamento_unitario + costo_diseno + costo_accesorios
        + costo_procesado + valor_empaque + valor_personalizacion
    )
    valor_imprevistos_unitario = costo_fabricacion_unitario * (porcentaje_imprevistos / 100)
    base_con_imprevistos = costo_fabricacion_unitario + valor_imprevistos_unitario
    ganancia_unitaria = base_con_imprevistos * (porcentaje_ganancia / 100)
    precio_unitario = costo_fabricacion_unitario + ganancia_unitaria
    precio_total_unitario = precio_unitario
    subtotal_energia = costo_energia_unitario * unidades
    subtotal_material = costo_filamento_unitario * unidades
    subtotal_fabricacion_total = costo_fabricacion_unitario * unidades
    ganancia_total = ganancia_unitaria * unidades
    precio_total = precio_total_unitario * unidades
    valor_imprevistos = round_money(valor_imprevistos_unitario)

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
        "horasPostProcesado": round_money(horas_procesado),
        "costoProcesado": round_money(costo_procesado),
        "porcentajeImprevistos": round_money(porcentaje_imprevistos),
        "kwH": round_money(kw_h),
        "kwMin": round_money(kw_min),
        "valorImprevistos": round_money(valor_imprevistos),
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
