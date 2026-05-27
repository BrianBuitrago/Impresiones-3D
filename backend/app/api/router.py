from fastapi import APIRouter
from app.api.endpoints import auth, quotes

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación y Roles"])
api_router.include_router(quotes.router, prefix="/quotes", tags=["Cotizaciones"])
