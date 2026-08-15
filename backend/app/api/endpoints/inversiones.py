import logging
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.firebase import db
from app.api.deps import RoleChecker
from app.models.inversion import InversionCreate, InversionResponse, InversionUpdate
from app.utils.firestore import serialize_doc
from datetime import datetime
from typing import List

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post('', response_model=InversionResponse, status_code=status.HTTP_201_CREATED)
def create_inversion(
    inversion_in: InversionCreate,
    current_user: dict = Depends(RoleChecker(['administrador']))
):
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail='Servicio de base de datos no disponible.')
    try:
        created_at = datetime.utcnow().isoformat()
        inversion_data = inversion_in.dict()
        inversion_data.update({
            'total': round(inversion_data['cantidad'] * inversion_data['costo'], 2),
            'creadoEn': created_at,
            'actualizadoEn': created_at,
        })
        doc_ref = db.collection('inversiones').document()
        doc_ref.set(inversion_data)
        inversion_data['id'] = doc_ref.id
        return serialize_doc(inversion_data)
    except Exception as e:
        logger.error('Fallo al crear inversión: %s', e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail='No se pudo crear la inversión.')


@router.get('', response_model=List[InversionResponse])
def list_inversiones(
    current_user: dict = Depends(RoleChecker(['administrador']))
):
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail='Servicio de base de datos no disponible.')
    try:
        docs = db.collection('inversiones').order_by('creadoEn', direction='DESCENDING').stream()
        inversiones = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            inversiones.append(serialize_doc(data))
        return inversiones
    except Exception as e:
        logger.error('Fallo al listar inversiones: %s', e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail='No se pudieron listar las inversiones.')


@router.get('/{inversion_id}', response_model=InversionResponse)
def get_inversion(inversion_id: str, current_user: dict = Depends(RoleChecker(['administrador', 'colaborador']))):
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail='Servicio de base de datos no disponible.')
    inversion_ref = db.collection('inversiones').document(inversion_id)
    inversion_doc = inversion_ref.get()
    if not inversion_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Inversión no encontrada.')
    data = inversion_doc.to_dict()
    data['id'] = inversion_doc.id
    return serialize_doc(data)


@router.put('/{inversion_id}', response_model=InversionResponse)
def update_inversion(
    inversion_id: str,
    inversion_update: InversionUpdate,
    current_user: dict = Depends(RoleChecker(['administrador']))
):
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail='Servicio de base de datos no disponible.')
    inversion_ref = db.collection('inversiones').document(inversion_id)
    current_doc = inversion_ref.get()
    if not current_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Inversión no encontrada.')
    current_data = current_doc.to_dict()

    update_data = inversion_update.dict(exclude_none=True)
    if 'cantidad' in update_data or 'costo' in update_data:
        cantidad = update_data.get('cantidad', current_data.get('cantidad', 0))
        costo = update_data.get('costo', current_data.get('costo', 0))
        update_data['total'] = round(cantidad * costo, 2)
    update_data['actualizadoEn'] = datetime.utcnow().isoformat()

    try:
        inversion_ref.update(update_data)
        updated = inversion_ref.get().to_dict()
        updated['id'] = inversion_id
        return serialize_doc(updated)
    except Exception as e:
        logger.error('Fallo al actualizar inversión %s: %s', inversion_id, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail='No se pudo actualizar la inversión.')


@router.delete('/{inversion_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_inversion(
    inversion_id: str,
    current_user: dict = Depends(RoleChecker(['administrador']))
):
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail='Servicio de base de datos no disponible.')
    inversion_ref = db.collection('inversiones').document(inversion_id)
    if not inversion_ref.get().exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Inversión no encontrada.')
    try:
        inversion_ref.delete()
    except Exception as e:
        logger.error('Fallo al eliminar inversión %s: %s', inversion_id, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail='No se pudo eliminar la inversión.')
