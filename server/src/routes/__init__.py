from .loans import router as loans_router, router_dev as loans_v2_router
from .payment_sources import router as payment_sources_router, router_dev as payment_sources_v2_router
from .repayments import router as repayments_router, router_dev as repayments_v2_router
from .properties import router as properties_router, router_dev as properties_v2_router
from .payments import router as payments_router, router_dev as payments_v2_router
from .users import router as users_router
from .purchases import router as purchases_router, router_dev as purchases_v2_router
from .invoices import router as invoices_router, router_dev as invoices_v2_router
# from .documents import router as documents_router

__all__ = [
    "loans_router",
    "payment_sources_router",
    "repayments_router",
    "properties_router",
    "payments_router",
    "users_router",
    "purchases_router",
    "invoices_router",
]
