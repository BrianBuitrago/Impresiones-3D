from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.core.firebase import db
from app.api.deps import get_current_user
from app.models.product import ProductCreate, ProductUpdate

router = APIRouter()

@router.get("")
def list_products(destacado: Optional[bool] = Query(None)):
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    query = db.collection("products")
    if destacado is not None:
        query = query.where("destacado", "==", destacado)
    docs = query.stream()
    results = []
    for d in docs:
        item = d.to_dict() or {}
        item["id"] = d.id
        results.append(item)
    return results

@router.post("", status_code=status.HTTP_201_CREATED)
def create_product(data: ProductCreate, current_user: dict = Depends(get_current_user)):
    role = current_user.get("rol", "")
    if role not in ("administrador", "colaborador"):
        raise HTTPException(status_code=403, detail="No tienes permisos")
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    ref = db.collection("products").add(data.dict())
    return {"id": ref[1].id}

@router.put("/{product_id}")
def update_product(product_id: str, data: ProductUpdate, current_user: dict = Depends(get_current_user)):
    role = current_user.get("rol", "")
    if role not in ("administrador", "colaborador"):
        raise HTTPException(status_code=403, detail="No tienes permisos")
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    doc_ref = db.collection("products").document(product_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    updated_fields = data.dict(exclude_unset=True)
    if not updated_fields:
        raise HTTPException(status_code=400, detail="No se enviaron campos válidos para actualizar.")
    doc_ref.update(updated_fields)
    return {"id": product_id}

@router.delete("/{product_id}")
def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    role = current_user.get("rol", "")
    if role not in ("administrador", "colaborador"):
        raise HTTPException(status_code=403, detail="No tienes permisos")
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    doc_ref = db.collection("products").document(product_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    doc_ref.delete()
    return {"message": "ok"}
