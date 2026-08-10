from typing import List


def calculate_totals(items: List[dict]) -> dict:
    totals = {}
    total = 0.0
    for item in items:
        categoria = item.get('categoria', 'sin_categoria')
        valor = float(item.get('valor', 0) or 0)
        totals[categoria] = round(totals.get(categoria, 0) + valor, 2)
        total += valor
    return {
        'totalesPorCategoria': totals,
        'totalAPagar': round(total, 2)
    }
