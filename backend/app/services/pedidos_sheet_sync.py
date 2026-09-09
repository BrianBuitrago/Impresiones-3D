"""
Al eliminar desde la app una Compra Manual que vino de una fila real de la
pestaña "Pedidos confirmados" del Sheet (pedidoId="SHEET-{item}"), hay que
vaciar esa fila ahí también — si no, la próxima vez que se use "Sincronizar
con Google Sheet" (app/services/sheet_reconciler.py) esa fila todavía
tendría contenido y el reconciliador la volvería a crear, "resucitando" un
registro que el admin ya había borrado.

A diferencia de Inversiones, acá la identidad de la fila es la columna ITEM
(no la posición física — ver sheet_reconciler.py), así que primero hay que
encontrar en qué fila real está ese ITEM antes de poder vaciarla.
"""
import logging

from app.core.sheets import sheets_service
from app.services.pedidos_import import SPREADSHEET_ID, SHEET_NAME, FIRST_ROW, fetch_filas_pedidos

logger = logging.getLogger(__name__)


def clear_pedido_row_en_sheet(pedido_id: str) -> None:
    """Nunca debe romper el borrado en la app si esto falla (el Sheet es
    secundario) — quien llama debe envolver esto en try/except."""
    if not pedido_id or not pedido_id.startswith("SHEET-") or sheets_service is None:
        return

    item_num = pedido_id[len("SHEET-"):].strip()
    if not item_num:
        return

    filas = fetch_filas_pedidos()
    for idx, fila in enumerate(filas, start=FIRST_ROW):
        if fila and str(fila[0]).strip() == item_num:
            sheets_service.spreadsheets().values().clear(
                spreadsheetId=SPREADSHEET_ID,
                range=f"'{SHEET_NAME}'!A{idx}:O{idx}",
                body={},
            ).execute()
            return

    # No se encontró la fila (ya la habían vaciado a mano, o el ITEM cambió) — no hay nada que limpiar.
