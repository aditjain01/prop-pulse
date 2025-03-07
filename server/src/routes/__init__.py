from .loans import router as loans_router
from .payment_sources import router as payment_sources_router
from .repayments import router as repayments_router
from .properties import router as properties_router
from .payments import router as payments_router
from .users import router as users_router
from .purchases import router as purchases_router
# from .documents import router as documents_router

__all__ = [
    "loans_router", 
    "payment_sources_router", 
    "repayments_router", 
    "properties_router", 
    "payments_router", 
    "users_router", 
    "payment_sources_router",
    "purchases_router"
]