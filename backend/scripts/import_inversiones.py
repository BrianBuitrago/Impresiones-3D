"""
Importa el historial de "Inversiónes" (Google Sheets, filas 2-27, las únicas
con datos reales hoy) como documentos en la colección `inversiones`.

⚠️ YA SE EJECUTÓ (2026-09-09): creó 26 inversiones reales. Volver a correrlo
(sin filtrar duplicados) crearía otras 26 repetidas. Para traer filas nuevas
que se agreguen después al Sheet, o reflejar filas borradas (vaciadas), usar
en cambio el botón "Sincronizar con Google Sheet" del panel (ver
app/services/sheet_reconciler.py), que sí evita duplicados.

SOLO LEE el Sheet, nunca escribe nada ahí. Corre con --dry-run primero.

Notas de mapeo (ver app/services/inversiones_import.py para el detalle):
- COSTO en el Sheet es el valor TOTAL de la línea (verificado: sumando esa
  columna tal cual da $15.943.400, la cifra real esperada). El modelo del
  backend espera "costo" POR UNIDAD (total = cantidad × costo, calculado en
  servidor), así que acá se guarda costo = COSTO_sheet / CANTIDAD.
- El Sheet no tenía columna de tipo (insumo/máquina) al momento de importar:
  se clasifica por palabras clave en el nombre del elemento (impresora,
  bambulab, herramienta, motor tool, secadora, cel corporativo -> máquina;
  el resto -> insumo). Se puede corregir cualquier registro después desde
  /admin/inversiones (la corrección se sincroniza sola de vuelta al Sheet).
- El Sheet no tiene columna de fecha real de compra: se usa la fecha de hoy
  (día de la importación) para los 26 registros. Si se conocen las fechas
  reales de compra, se pueden editar una por una después desde el panel.

Uso:
    python scripts/import_inversiones.py --dry-run
    python scripts/import_inversiones.py
"""
import argparse
import sys
from datetime import datetime

sys.path.insert(0, ".")

from app.core.firebase import db
from app.services.inversiones_import import FIRST_ROW, LAST_ROW, fetch_filas_inversiones, fila_a_inversion


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    hoy = datetime.utcnow().strftime("%Y-%m-%d")
    filas = fetch_filas_inversiones()
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
