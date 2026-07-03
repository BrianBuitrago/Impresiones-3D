from fastapi import APIRouter, Depends, HTTPException, status
from app.core.firebase import db
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/products", status_code=status.HTTP_201_CREATED)
def create_product(data: dict, current_user: dict = Depends(get_current_user)):
    role = current_user.get("rol", "")
    if role not in ("administrador", "colaborador"):
        raise HTTPException(status_code=403, detail="No tienes permisos")
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    data.pop("id", None)
    ref = db.collection("products").add(data)
    return {"id": ref[1].id}

@router.put("/products/{product_id}")
def update_product(product_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    role = current_user.get("rol", "")
    if role not in ("administrador", "colaborador"):
        raise HTTPException(status_code=403, detail="No tienes permisos")
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    doc_ref = db.collection("products").document(product_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    data.pop("id", None)
    doc_ref.update(data)
    return {"id": product_id}

@router.delete("/products/{product_id}")
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
