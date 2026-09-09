import logging
from app.core.sheets import sheets_service

logger = logging.getLogger(__name__)

SPREADSHEET_ID = "1au2Q0zGxHlZo3wEpHEZeH7VCXayGE54zWTPPenUXtb4"
SHEET_NAME = "Inversiónes"

TIPO_LABELS = {"insumo": "Insumo", "maquina": "Máquina"}


def sync_inversion_a_sheet(inversion: dict) -> None:
    """
    Si la inversión viene de una fila real del Sheet (campo "sheetRow", puesto
    al importar), actualiza esa fila con los valores actuales al editarla
    desde la app. Si no tiene sheetRow (se creó directo en /admin/inversiones,
    sin pasar por el Sheet), no hace nada — no hay fila que actualizar.

    Nunca debe romper el guardado en la app si esto falla (el Sheet es
    secundario) — quien llama debe envolver esto en try/except.
    """
    sheet_row = inversion.get("sheetRow")
    if not sheet_row or sheets_service is None:
        return

    cantidad = inversion.get("cantidad", 0) or 0
    costo_unitario = inversion.get("costo", 0) or 0
    costo_total = round(cantidad * costo_unitario, 2)
    tipo = inversion.get("tipo", "")

    fila = [
        inversion.get("elemento", ""),
        inversion.get("proveedor", ""),
        cantidad,
        costo_total,  # número crudo: el formato de moneda ya existe en la celda del Sheet
        TIPO_LABELS.get(tipo, tipo),
        inversion.get("fecha", ""),
    ]

    sheets_service.spreadsheets().values().update(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{SHEET_NAME}'!A{sheet_row}:F{sheet_row}",
        valueInputOption="USER_ENTERED",
        body={"values": [fila]},
    ).execute()


def clear_inversion_row_en_sheet(sheet_row: int) -> None:
    """
    Al eliminar desde la app una inversión que vino de una fila real del
    Sheet, hay que vaciar esa fila ahí también — si no, la próxima vez que
    se use "Sincronizar con Google Sheet" (app/services/sheet_reconciler.py)
    esa fila todavía tendría contenido y el reconciliador la volvería a
    crear, "resucitando" un registro que el admin ya había borrado.

    Nunca debe romper el borrado en la app si esto falla (el Sheet es
    secundario) — quien llama debe envolver esto en try/except.
    """
    if not sheet_row or sheets_service is None:
        return

    sheets_service.spreadsheets().values().clear(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{SHEET_NAME}'!A{sheet_row}:F{sheet_row}",
        body={},
    ).execute()
