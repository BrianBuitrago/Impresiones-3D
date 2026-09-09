"""
Importa el historial de "Pedidos confirmados" (Google Sheets, filas 3-122)
como Compras Manuales (reports tipo='compra') en la app — de una sola vez.

⚠️ YA SE EJECUTÓ (2026-09-09): creó 101 reportes reales en Firestore a partir
de las 120 filas del Sheet. Volver a correrlo (sin filtrar duplicados)
crearía otros 101 reportes repetidos. Para traer filas nuevas que se agreguen
después al Sheet, o reflejar filas borradas, usar en cambio el botón
"Sincronizar con Google Sheet" del panel (ver app/services/sheet_reconciler.py),
que sí evita duplicados.

SOLO LEE el Sheet, nunca escribe nada ahí. Corre con --dry-run primero para
revisar qué se va a crear antes de tocar Firestore.

Uso:
    python scripts/import_pedidos_confirmados.py --dry-run
    python scripts/import_pedidos_confirmados.py            # crea de verdad
"""
import argparse
import sys
from datetime import datetime

sys.path.insert(0, ".")

from app.core.firebase import db
from app.services.pedidos_import import FIRST_ROW, LAST_ROW, fetch_filas_pedidos, fila_a_reporte


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Solo muestra qué se importaría, sin escribir nada.")
    args = parser.parse_args()

    filas = fetch_filas_pedidos()
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
