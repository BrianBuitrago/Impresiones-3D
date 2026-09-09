"""
Importa el historial de "Pedidos confirmados" (Google Sheets, filas 3-122)
como Compras Manuales (reports tipo='compra') en la app — de una sola vez.

⚠️ YA SE EJECUTÓ (2026-09-09): creó 101 reportes reales en Firestore a partir
de las 120 filas del Sheet. Volver a correrlo (sin filtrar duplicados)
crearía otros 101 reportes repetidos. Si hace falta correrlo de nuevo (ej.
otro negocio, u otro Sheet), revisar/ajustar primero.

SOLO LEE el Sheet, nunca escribe nada ahí. Corre con --dry-run primero para
revisar qué se va a crear antes de tocar Firestore.

Uso:
    python scripts/import_pedidos_confirmados.py --dry-run
    python scripts/import_pedidos_confirmados.py            # crea de verdad
"""
import argparse
import re
import sys
from datetime import datetime

sys.path.insert(0, ".")

from app.core.sheets import sheets_service
from app.core.firebase import db
from app.services.reports import calculate_totals

SPREADSHEET_ID = "1au2Q0zGxHlZo3wEpHEZeH7VCXayGE54zWTPPenUXtb4"
SHEET_NAME = "Pedidos confirmados"
FIRST_ROW = 3
LAST_ROW = 122

MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]


def parse_cop(value: str) -> float:
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


def fetch_filas():
    result = sheets_service.spreadsheets().values().get(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{SHEET_NAME}'!A{FIRST_ROW}:O{LAST_ROW}",
    ).execute()
    return result.get("values", [])


def fila_a_reporte(fila: list) -> dict | None:
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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Solo muestra qué se importaría, sin escribir nada.")
    args = parser.parse_args()

    filas = fetch_filas()
    print(f"Filas leídas del Sheet (rango {FIRST_ROW}-{LAST_ROW}): {len(filas)}\n")

    reportes = []
    ignoradas = 0
    for fila in filas:
        r = fila_a_reporte(fila)
        if r is None:
            ignoradas += 1
            continue
        reportes.append(r)

    print(f"Filas vacías/ignoradas: {ignoradas}")
    print(f"Reportes a crear: {len(reportes)}\n")

    for r in reportes[:5]:
        it = r["items"][0]
        print(f"  - [{r['pedidoId']}] {it['descripcion']} | cliente={it['clienteNombre']} | "
              f"total={it['valor']} | abono={r['abono']} | restante={r['restante']} | "
              f"recibido={r['totalRecibido']} | periodo={r['periodo']} | estado={r['estado']}")
    if len(reportes) > 5:
        print(f"  ... y {len(reportes) - 5} más.")

    if args.dry_run:
        print("\n[DRY RUN] No se escribió nada en Firestore.")
        return

    print("\nCreando reportes en Firestore...")
    creados = 0
    now = datetime.utcnow().isoformat()
    for r in reportes:
        r["creadoEn"] = now
        r["actualizadoEn"] = now
        db.collection("reports").document().set(r)
        creados += 1
    print(f"Listo. {creados} reportes creados como Compras Manuales (tipo='compra').")


if __name__ == "__main__":
    main()
