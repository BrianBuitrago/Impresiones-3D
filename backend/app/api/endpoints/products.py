from fastapi import APIRouter, Depends, HTTPException, status
from app.core.firebase import db
from app.api.deps import RoleChecker

router = APIRouter()

@router.post("/products", status_code=status.HTTP_201_CREATED)
def create_product(data: dict, admin: dict = Depends(RoleChecker(["administrador", "colaborador"]))):
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    data.pop("id", None)
    _, doc_ref = db.collection("products").add(data)
    new_doc = doc_ref.get()
    result = new_doc.to_dict() or {}
    result["id"] = doc_ref.id
    return result

@router.put("/products/{product_id}")
def update_product(product_id: str, data: dict, admin: dict = Depends(RoleChecker(["administrador", "colaborador"]))):
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    doc_ref = db.collection("products").document(product_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    data.pop("id", None)
    doc_ref.update(data)
    updated = doc_ref.get().to_dict() or {}
    updated["id"] = product_id
    return updated

@router.delete("/products/{product_id}")
def delete_product(product_id: str, admin: dict = Depends(RoleChecker(["administrador", "colaborador"]))):
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    doc_ref = db.collection("products").document(product_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    doc_ref.delete()
    return {"message": "producto eliminado"}
