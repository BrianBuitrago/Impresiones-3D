import logging
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import RoleChecker
from app.services.sheet_reconciler import (
    reconciliar_pedidos_confirmados,
    reconciliar_inversiones,
    SincronizacionAbortada,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post('/pedidos-confirmados')
def sync_pedidos_confirmados(current_user: dict = Depends(RoleChecker(['administrador']))):
    """Trae al panel (Compras Manuales) las filas nuevas que se hayan
    agregado a la pestaña 'Pedidos confirmados' del Sheet, y elimina las que
    se hayan borrado ahí. No toca filas que ya existen en ambos lados."""
    try:
        return reconciliar_pedidos_confirmados()
    except SincronizacionAbortada as e:
        # No es un error de red/permisos: el reconciliador detectó un borrado
        # sospechosamente grande y abortó sin tocar nada. Se le muestra el
        # motivo real al admin (no un 500 genérico) para que sepa que no pasó
        # nada malo, pero que hay que revisar el Sheet antes de reintentar.
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        logger.error('Fallo al sincronizar Pedidos confirmados: %s', e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                             detail='No se pudo sincronizar con el Sheet.')


@router.post('/inversiones')
def sync_inversiones(current_user: dict = Depends(RoleChecker(['administrador']))):
    """Trae al panel (Inversiones) las filas nuevas que se hayan agregado a
    la pestaña 'Inversiónes' del Sheet, y elimina las que se hayan vaciado
    ahí. No toca filas que ya existen en ambos lados."""
    try:
        return reconciliar_inversiones()
    except SincronizacionAbortada as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        logger.error('Fallo al sincronizar Inversiones: %s', e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                             detail='No se pudo sincronizar con el Sheet.')
