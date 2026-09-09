"""
Lógica de parseo compartida para la pestaña "Inversiónes" del Google Sheet
histórico, usada tanto por el script de importación única
(scripts/import_inversiones.py) como por el reconciliador automático
(app/services/sheet_reconciler.py).

SOLO LEE el Sheet, nunca escribe nada ahí (el sync de escritura hacia el
Sheet vive aparte, en app/services/inversion_sheet_sync.py, y solo se
dispara al editar una inversión desde la app).
"""
import re

from app.core.sheets import sheets_service

SPREADSHEET_ID = "1au2Q0zGxHlZo3wEpHEZeH7VCXayGE54zWTPPenUXtb4"
SHEET_NAME = "Inversiónes"
FIRST_ROW = 2
LAST_ROW = 101

MAQUINA_KEYWORDS = ["impresora", "bambulab", "herramienta", "motor tool", "secadora", "cel corporativo"]


def parse_cop(value) -> float:
    digits = re.sub(r"[^\d]", "", str(value or ""))
    return float(digits) if digits else 0.0


def clasificar_tipo(elemento: str) -> str:
    el = elemento.lower()
    return "maquina" if any(k in el for k in MAQUINA_KEYWORDS) else "insumo"


def fetch_filas_inversiones() -> list:
    """Lee el rango acotado A{FIRST_ROW}:D{LAST_ROW} (columnas E/F —tipo y
    fecha— son solo destino de escritura desde la app, no se leen de vuelta
    acá para no pisar clasificaciones que el usuario ya corrigió)."""
    result = sheets_service.spreadsheets().values().get(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{SHEET_NAME}'!A{FIRST_ROW}:D{LAST_ROW}",
    ).execute()
    return result.get("values", [])


def fila_a_inversion(fila: list, fila_num: int, hoy: str) -> dict | None:
    """Convierte una fila cruda del Sheet en un documento listo para
    `inversiones`. Devuelve None si la fila está vacía. La identidad acá SÍ
    es la posición física (sheetRow=fila_num) porque el Sheet no tiene una
    columna de identidad estable como el ITEM de Pedidos confirmados — por
    eso, para borrar un registro desde el Sheet, hay que vaciar el contenido
    de la fila (no eliminarla), así no se corren las filas de abajo.
    """
    fila = list(fila) + [""] * (4 - len(fila))
    elemento, proveedor, cantidad_raw, costo_raw = fila

    if not str(elemento).strip():
        return None

    cantidad = parse_cop(cantidad_raw) or 1
    costo_total_linea = parse_cop(costo_raw)
    costo_unitario = round(costo_total_linea / cantidad, 2) if cantidad else costo_total_linea

    return {
        "elemento": str(elemento).strip(),
        "tipo": clasificar_tipo(elemento),
        "proveedor": str(proveedor).strip(),
        "cantidad": cantidad,
        "costo": costo_unitario,
        "valorUnitario": 0.0,
        "fecha": hoy,
        "observaciones": f"Importado desde Google Sheets, pestaña '{SHEET_NAME}', fila {fila_num}.",
        "total": round(cantidad * costo_unitario, 2),
        "sheetRow": fila_num,
    }
