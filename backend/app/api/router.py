from fastapi import APIRouter
import sys

api_router = APIRouter()

# Importar auth siempre
try:
    from app.api.endpoints import auth
    api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación y Roles"])
except Exception as e:
    print(f"ERROR: No se pudo registrar router de auth: {e}", file=sys.stderr)

# Importar quotes de forma segura
try:
    from app.api.endpoints import quotes
    api_router.include_router(quotes.router, prefix="/quotes", tags=["Cotizaciones"])
except Exception as e:
    print(f"ERROR: No se pudo registrar router de quotes: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()

# Importar reportes de forma segura
try:
    from app.api.endpoints import reports
    api_router.include_router(reports.router, prefix="/reports", tags=["Reportes"])
except Exception as e:
    print(f"ERROR: No se pudo registrar router de reports: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
