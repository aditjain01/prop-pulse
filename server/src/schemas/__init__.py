# This file makes the schemas directory a Python package
from .loans import Loan, LoanCreate, LoanUpdate, LoanPublic, Loan, LoanOld
from .payment_sources import PaymentSource, PaymentSourceCreate, PaymentSourceUpdate, PaymentSourcePublic
from .repayments import LoanRepayment, LoanRepaymentCreate, LoanRepaymentUpdate, LoanRepaymentPublic, LoanRepayment, LoanRepaymentOld
from .properties import Property, PropertyCreate, PropertyUpdate, PropertyPublic, Property, PropertyOld
from .payments import Payment, PaymentCreate, PaymentUpdate, PaymentPublic, Payment, PaymentOld
from .invoices import Invoice, InvoiceCreate, InvoiceUpdate, InvoicePublic, Invoice, InvoiceOld
from .users import User, UserCreate
from .documents import Document, DocumentCreate
from .dashboard import (
    LoanRepaymentSummary,
    AcquisitionCostSummary,
    AcquisitionCostDetails,
    LoanSummary,
)
from .construction_status import ConstructionStatus
from .purchases import Purchase, PurchaseCreate, PurchaseUpdate, PurchasePublic, Purchase, PurchaseOld

__all__ = [
    # Original schemas
    "User",
    "UserCreate",
    "Property",
    "PropertyCreate",
    "PropertyUpdate",
    "ConstructionStatus",
    "Purchase",
    "PurchaseCreate",
    "PurchaseUpdate",
    "PaymentSource",
    "PaymentSourceCreate",
    "PaymentSourceUpdate",
    "Payment",
    "PaymentCreate",
    "PaymentUpdate",
    "Invoice",
    "InvoiceCreate",
    "InvoiceUpdate",
    "Loan",
    "LoanCreate",
    "LoanUpdate",
    "LoanRepayment",
    "LoanRepaymentCreate",
    "LoanRepaymentUpdate",
    "Document",
    "DocumentCreate",
    "LoanRepaymentSummary",
    "AcquisitionCostSummary",
    "AcquisitionCostDetails",
    "LoanSummary",
    
    # V2 schemas
    "PropertyPublic",
    "Property",
    "PurchasePublic",
    "Purchase",
    "PaymentSourcePublic",
    "LoanPublic",
    "Loan",
    "InvoicePublic",
    "Invoice",
    "PaymentPublic",
    "Payment",
    "LoanRepaymentPublic",
    "LoanRepayment",
    "InvoiceSummary",

    "PurchaseOld",
    "PropertyOld",
    "LoanOld",
    "PaymentOld",
    "InvoiceOld",
]
