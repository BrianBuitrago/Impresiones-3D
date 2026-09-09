"""
Migración única: para los reportes tipo='compra' importados desde el Sheet
(import_pedidos_confirmados.py), la rentabilidad quedó guardada como texto
libre dentro de "notas" (ej. "Rentabilidad (Sheet): $13.500") en vez de un
campo real. Este script la extrae y la escribe en el nuevo campo
item.rentabilidad, recalculando totalesPorCategoria/totalAPagar.

Uso:
    python scripts/backfill_rentabilidad.py --dry-run
    python scripts/backfill_rentabilidad.py
"""
import argparse
import re
import sys

sys.path.insert(0, ".")

from app.core.firebase import db
from app.services.reports import calculate_totals

PATRON = re.compile(r"Rentabilidad \(Sheet\):\s*\$?\s*([\d.,]+)")


def extraer_rentabilidad(notas: str) -> float:
    m = PATRON.search(notas or "")
    if not m:
        return 0.0
    digits = re.sub(r"[^\d]", "", m.group(1))
    return float(digits) if digits else 0.0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    docs = list(db.collection("reports").where("tipo", "==", "compra").stream())
    print(f"Reportes tipo=compra encontrados: {len(docs)}")

    actualizados = 0
    total_rentabilidad = 0.0
    for doc in docs:
        data = doc.to_dict()
        items = data.get("items", [])
        cambio = False
        for item in items:
            if item.get("rentabilidad"):
                continue  # ya migrado, no tocar
            r = extraer_rentabilidad(item.get("notas", ""))
            if r:
                item["rentabilidad"] = r
                total_rentabilidad += r
                cambio = True
        if cambio:
            actualizados += 1
            if not args.dry_run:
                totals = calculate_totals(items)
                doc.reference.update({
                    "items": items,
                    "totalesPorCategoria": totals["totalesPorCategoria"],
                    "totalAPagar": totals["totalAPagar"],
                })

    print(f"Reportes con rentabilidad extraída: {actualizados}")
    print(f"Suma total de rentabilidad migrada: {total_rentabilidad}")
    if args.dry_run:
        print("[DRY RUN] No se escribió nada.")
    else:
        print("Listo.")


if __name__ == "__main__":
    main()
