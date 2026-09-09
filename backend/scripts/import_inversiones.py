"""
Importa el historial de "Inversiónes" (Google Sheets, filas 2-27, las únicas
con datos reales hoy) como documentos en la colección `inversiones`.

SOLO LEE el Sheet, nunca escribe nada ahí. Corre con --dry-run primero.

Notas de mapeo:
- COSTO en el Sheet es el valor TOTAL de la línea (verificado: sumando esa
  columna tal cual da $15.943.400, la cifra real esperada). El modelo del
  backend espera "costo" POR UNIDAD (total = cantidad × costo, calculado en
  servidor), así que acá se guarda costo = COSTO_sheet / CANTIDAD.
- El Sheet no tiene columna de tipo (insumo/máquina): se clasifica por
  palabras clave en el nombre del elemento (impresora, bambulab, herramienta,
  motor tool, secadora, cel corporativo -> máquina; el resto -> insumo).
  Se puede corregir cualquier registro después desde /admin/inversiones.
- El Sheet no tiene columna de fecha: se usa la fecha de hoy (día de la
  importación) para los 26 registros. Si se conocen las fechas reales de
  compra, se pueden editar una por una después desde el panel.

Uso:
    python scripts/import_inversiones.py --dry-run
    python scripts/import_inversiones.py
"""
import argparse
import re
import sys
from datetime import datetime

sys.path.insert(0, ".")

from app.core.sheets import sheets_service
from app.core.firebase import db

SPREADSHEET_ID = "1au2Q0zGxHlZo3wEpHEZeH7VCXayGE54zWTPPenUXtb4"
SHEET_NAME = "Inversiónes"
FIRST_ROW = 2
LAST_ROW = 101

MAQUINA_KEYWORDS = ["impresora", "bambulab", "herramienta", "motor tool", "secadora", "cel corporativo"]


def parse_cop(value: str) -> float:
    digits = re.sub(r"[^\d]", "", str(value or ""))
    return float(digits) if digits else 0.0


def clasificar_tipo(elemento: str) -> str:
    el = elemento.lower()
    return "maquina" if any(k in el for k in MAQUINA_KEYWORDS) else "insumo"


def fetch_filas():
    result = sheets_service.spreadsheets().values().get(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{SHEET_NAME}'!A{FIRST_ROW}:D{LAST_ROW}",
    ).execute()
    return result.get("values", [])


def fila_a_inversion(fila: list, fila_num: int, hoy: str) -> dict | None:
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
        # Fila real del Sheet: al editar esta inversión desde /admin/inversiones,
        # esa misma fila se actualiza automáticamente (ver inversion_sheet_sync.py).
        "sheetRow": fila_num,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    hoy = datetime.utcnow().strftime("%Y-%m-%d")
    filas = fetch_filas()
    print(f"Filas leídas del Sheet (rango {FIRST_ROW}-{LAST_ROW}): {len(filas)}\n")

    inversiones = []
    ignoradas = 0
    for idx, fila in enumerate(filas, start=FIRST_ROW):
        inv = fila_a_inversion(fila, idx, hoy)
        if inv is None:
            ignoradas += 1
            continue
        inversiones.append(inv)

    print(f"Filas vacías/ignoradas: {ignoradas}")
    print(f"Inversiones a crear: {len(inversiones)}")
    print(f"Suma total (debería dar $15.943.400): {sum(i['total'] for i in inversiones)}\n")

    for inv in inversiones:
        print(f"  - [{inv['tipo']:>7}] {inv['elemento']} | proveedor={inv['proveedor']} | "
              f"cant={inv['cantidad']} | costo/u={inv['costo']} | total={inv['total']}")

    if args.dry_run:
        print("\n[DRY RUN] No se escribió nada en Firestore.")
        return

    print("\nCreando inversiones en Firestore...")
    now = datetime.utcnow().isoformat()
    creadas = 0
    for inv in inversiones:
        inv["creadoEn"] = now
        inv["actualizadoEn"] = now
        db.collection("inversiones").document().set(inv)
        creadas += 1
    print(f"Listo. {creadas} inversiones creadas.")


if __name__ == "__main__":
    main()
