import logging
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.firebase import db
from app.api.deps import RoleChecker, get_current_user
from app.models.report import ReportCreate, ReportResponse, ReportUpdate
from app.utils.firestore import serialize_doc
from app.services.reports import calculate_totals
from datetime import datetime
from typing import List

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post('', response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    report_in: ReportCreate,
    current_user: dict = Depends(RoleChecker(['administrador']))
):
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail='Servicio de base de datos no disponible.')
    try:
        created_at = datetime.utcnow().isoformat()
        report_data = report_in.dict()
        report_data.update({
            'creadoEn': created_at,
            'actualizadoEn': created_at,
            'totalesPorCategoria': calculate_totals(report_data['items'])['totalesPorCategoria'],
            'totalAPagar': calculate_totals(report_data['items'])['totalAPagar']
        })
        doc_ref = db.collection('reports').document()
        doc_ref.set(report_data)
        report_data['id'] = doc_ref.id
        return serialize_doc(report_data)
    except Exception as e:
        logger.error('Fallo al crear reporte: %s', e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail='No se pudo crear el reporte.')

@router.get('', response_model=List[ReportResponse])
def list_reports(
    periodo: str | None = None,
    colaboradorUid: str | None = None,
    estado: str | None = None,
    tipo: str | None = None,
    current_user: dict = Depends(RoleChecker(['administrador']))
):
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail='Servicio de base de datos no disponible.')
    try:
        query = db.collection('reports')
        if periodo:
            query = query.where('periodo', '==', periodo.strip())
        if colaboradorUid:
            query = query.where('colaboradorUid', '==', colaboradorUid.strip())
        if estado:
            query = query.where('estado', '==', estado.strip().lower())
        if tipo:
            query = query.where('tipo', '==', tipo.strip().lower())
        # Límite defensivo, no paginación real: las comparativas de Reportes necesitan
        # el set completo, así que se deja muy por encima del volumen actual.
        docs = query.order_by('creadoEn', direction='DESCENDING').limit(2000).stream()
        reports = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            reports.append(serialize_doc(data))
        return reports
    except Exception as e:
        logger.error('Fallo al listar reportes: %s', e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail='No se pudieron listar los reportes.')

@router.get('/{report_id}', response_model=ReportResponse)
def get_report(report_id: str, current_user: dict = Depends(RoleChecker(['administrador', 'colaborador']))):
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail='Servicio de base de datos no disponible.')
    report_ref = db.collection('reports').document(report_id)
    report_doc = report_ref.get()
    if not report_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Reporte no encontrado.')
    data = report_doc.to_dict()
    data['id'] = report_doc.id
    return serialize_doc(data)

@router.put('/{report_id}', response_model=ReportResponse)
def update_report(
    report_id: str,
    report_update: ReportUpdate,
    current_user: dict = Depends(RoleChecker(['administrador']))
):
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail='Servicio de base de datos no disponible.')
    report_ref = db.collection('reports').document(report_id)
    if not report_ref.get().exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Reporte no encontrado.')

    update_data = report_update.dict(exclude_none=True)
    if 'items' in update_data:
        totals = calculate_totals(update_data['items'])
        update_data['totalesPorCategoria'] = totals['totalesPorCategoria']
        update_data['totalAPagar'] = totals['totalAPagar']
    update_data['actualizadoEn'] = datetime.utcnow().isoformat()

    try:
        report_ref.update(update_data)
        updated = report_ref.get().to_dict()
        updated['id'] = report_id
        return serialize_doc(updated)
    except Exception as e:
        logger.error('Fallo al actualizar reporte %s: %s', report_id, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail='No se pudo actualizar el reporte.')

@router.delete('/{report_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    report_id: str,
    current_user: dict = Depends(RoleChecker(['administrador']))
):
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail='Servicio de base de datos no disponible.')
    report_ref = db.collection('reports').document(report_id)
    if not report_ref.get().exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Reporte no encontrado.')
    try:
        report_ref.delete()
    except Exception as e:
        logger.error('Fallo al eliminar reporte %s: %s', report_id, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail='No se pudo eliminar el reporte.')
