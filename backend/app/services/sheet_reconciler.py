"""
Sincronización Sheet -> App bajo demanda (disparada por un botón del panel,
nunca automática/periódica): compara el Google Sheet histórico contra lo que
ya existe en Firestore y crea lo que se agregó al Sheet, elimina lo que se
borró del Sheet. Nunca sobreescribe campos de un registro que ya existe en
ambos lados (eso ya lo cubre, para Inversiones, el sync de edición en
app/services/inversion_sheet_sync.py; Pedidos confirmados no tiene edición
que se sincronice hacia el Sheet).

Identidad de cada fila:
- Pedidos confirmados: la columna ITEM del Sheet (pedidoId="SHEET-{item}"),
  estable aunque se inserten/borren filas en otro punto de la tabla.
- Inversiones: la posición física de la fila (sheetRow), porque esa pestaña
  no tiene una columna de identidad propia. Por eso, para borrar un registro
  de Inversiones desde el Sheet hay que VACIAR el contenido de la fila (no
  eliminarla con clic derecho), o se corren las filas de abajo y se detectan
  como si fueran registros distintos.
"""
import logging
from datetime import datetime

from app.core.firebase import db
from app.services.pedidos_import import FIRST_ROW as PED_FIRST_ROW, fetch_filas_pedidos, fila_a_reporte
from app.services.inversiones_import import FIRST_ROW as INV_FIRST_ROW, fetch_filas_inversiones, fila_a_inversion

logger = logging.getLogger(__name__)


def reconciliar_pedidos_confirmados(dry_run: bool = False) -> dict:
    filas = fetch_filas_pedidos()

    vistos_en_sheet = {}
    for fila in filas:
        reporte = fila_a_reporte(fila)
        if reporte and reporte.get("pedidoId"):
            vistos_en_sheet[reporte["pedidoId"]] = reporte

    existentes = {}
    for doc in db.collection("reports").where("tipo", "==", "compra").stream():
        data = doc.to_dict()
        pid = data.get("pedidoId", "")
        if pid.startswith("SHEET-"):
            existentes[pid] = doc.id

    a_crear = [r for pid, r in vistos_en_sheet.items() if pid not in existentes]
    a_eliminar = [(pid, doc_id) for pid, doc_id in existentes.items() if pid not in vistos_en_sheet]

    resultado = {
        "creados": len(a_crear),
        "eliminados": len(a_eliminar),
        "sin_cambios": len(existentes) - len(a_eliminar),
        "detalle_creados": [pid for pid, _ in vistos_en_sheet.items() if pid not in existentes],
        "detalle_eliminados": [pid for pid, _ in a_eliminar],
    }

    if dry_run:
        return resultado

    now = datetime.utcnow().isoformat()
    for r in a_crear:
        r["creadoEn"] = now
        r["actualizadoEn"] = now
        db.collection("reports").document().set(r)

    for _, doc_id in a_eliminar:
        db.collection("reports").document(doc_id).delete()

    return resultado


def reconciliar_inversiones(dry_run: bool = False) -> dict:
    filas = fetch_filas_inversiones()
    hoy = datetime.utcnow().strftime("%Y-%m-%d")

    vistos_en_sheet = {}
    for idx, fila in enumerate(filas, start=INV_FIRST_ROW):
        inv = fila_a_inversion(fila, idx, hoy)
        if inv:
            vistos_en_sheet[idx] = inv

    existentes = {}
    for doc in db.collection("inversiones").stream():
        data = doc.to_dict()
        row = data.get("sheetRow")
        if row:
            existentes[row] = doc.id

    a_crear = [inv for row, inv in vistos_en_sheet.items() if row not in existentes]
    a_eliminar = [(row, doc_id) for row, doc_id in existentes.items() if row not in vistos_en_sheet]

    resultado = {
        "creados": len(a_crear),
        "eliminados": len(a_eliminar),
        "sin_cambios": len(existentes) - len(a_eliminar),
        "detalle_creados": [inv["elemento"] for inv in a_crear],
        "detalle_eliminados": [row for row, _ in a_eliminar],
    }

    if dry_run:
        return resultado

    now = datetime.utcnow().isoformat()
    for inv in a_crear:
        inv["creadoEn"] = now
        inv["actualizadoEn"] = now
        db.collection("inversiones").document().set(inv)

    for _, doc_id in a_eliminar:
        db.collection("inversiones").document(doc_id).delete()

    return resultado
