"""
Lógica de parseo compartida para la pestaña "Pedidos confirmados" del Google
Sheet histórico, usada tanto por el script de importación única
(scripts/import_pedidos_confirmados.py) como por el reconciliador automático
(app/services/sheet_reconciler.py). Vive acá para que ambos usen exactamente
la misma lógica ya verificada contra las cifras reales del negocio.

SOLO LEE el Sheet, nunca escribe nada ahí.
"""
import re
from datetime import datetime

from app.core.sheets import sheets_service
from app.services.reports import calculate_totals

SPREADSHEET_ID = "1au2Q0zGxHlZo3wEpHEZeH7VCXayGE54zWTPPenUXtb4"
SHEET_NAME = "Pedidos confirmados"
FIRST_ROW = 3
LAST_ROW = 122

MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]


def parse_cop(value) -> float:
    """" $45.000" -> 45000.0 (formato colombiano: '.' es separador de miles)."""
    if value is None:
        return 0.0
    digits = re.sub(r"[^\d]", "", str(value))
    return float(digits) if digits else 0.0


def parse_periodo(fecha_str: str) -> str:
    """Intenta 'DD/MM/AAAA' -> 'Mes/AA'. Si no se puede, cae a un bucket fijo."""
    fecha_str = (fecha_str or "").strip()
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"):
        try:
            d = datetime.strptime(fecha_str, fmt)
            return f"{MONTHS[d.month - 1]}/{str(d.year)[-2:]}"
        except ValueError:
            continue
    return "Histórico/00"


def fetch_filas_pedidos() -> list:
    """Lee el rango acotado A{FIRST_ROW}:O{LAST_ROW} — nunca abierto, hay otra
    tabla más abajo en la misma pestaña."""
    result = sheets_service.spreadsheets().values().get(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{SHEET_NAME}'!A{FIRST_ROW}:O{LAST_ROW}",
    ).execute()
    return result.get("values", [])


def fila_a_reporte(fila: list) -> dict | None:
    """Convierte una fila cruda del Sheet en un documento listo para
    `reports` (tipo='compra'). Devuelve None si la fila está vacía.
    La identidad estable de la fila es su columna ITEM (item_num), NO su
    posición física: se guarda como pedidoId="SHEET-{item_num}", por lo que
    sobrevive a que se inserten o borren filas en otro punto de la tabla.
    """
    fila = list(fila) + [""] * (15 - len(fila))
    item_num, fecha, pedido, longitud, destino, placa, cliente, estado, \
        valor_u, cant, total, abono, restante, recibido, rentabilidad = fila

    # Fila vacía (sin nombre de pedido/producto): se ignora.
    if not str(pedido).strip():
        return None

    cantidad = int(re.sub(r"[^\d]", "", str(cant)) or "1")
    valor_total = parse_cop(total) or (parse_cop(valor_u) * cantidad)

    notas_extra = []
    if str(longitud).strip():
        notas_extra.append(f"Longitud cotizada: {longitud}")
    if str(destino).strip():
        notas_extra.append(f"Destino: {destino}")
    if str(placa).strip():
        notas_extra.append(f"Placa: {placa}")

    item = {
        "quote_id": "",
        "producto_id": "",
        "categoria": "pedido",
        "descripcion": str(pedido).strip(),
        "actividad": f"Importado desde Google Sheets (fila Sheet #{item_num})",
        "cantidad": max(cantidad, 1),
        "valor": valor_total,
        "rentabilidad": parse_cop(rentabilidad),
        "notas": " | ".join(notas_extra),
        "clienteNombre": str(cliente).strip(),
        "clienteTelefono": "",
        "origen": "manual",
    }

    totals = calculate_totals([item])

    return {
        "colaboradorUid": "__sin_asignar__",
        "colaboradorNombre": "Sin Asignar",
        "periodo": parse_periodo(fecha),
        "categorias": [],
        "items": [item],
        "notas": f"Importado desde Google Sheets, pestaña '{SHEET_NAME}', fila Sheet #{item_num}.",
        "estado": str(estado).strip() or "abierto",
        "fechaConfirmacion": str(fecha).strip(),
        "pedidoId": f"SHEET-{item_num}" if str(item_num).strip() else "",
        "abono": parse_cop(abono),
        "restante": parse_cop(restante),
        "totalRecibido": parse_cop(recibido),
        "tipo": "compra",
        "totalesPorCategoria": totals["totalesPorCategoria"],
        "totalAPagar": totals["totalAPagar"],
    }
