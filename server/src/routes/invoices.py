from fastapi import APIRouter
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from src import schemas
from src.database import get_db, models

# Create a router instance
router = APIRouter(prefix="/invoices", tags=["invoices"])


# Create a new invoice
@router.post("/", response_model=schemas.Invoice)
def create_invoice(
    invoice: schemas.InvoiceCreate, db: Session = Depends(get_db)
) -> schemas.Invoice:
    try:
        # Check if purchase exists
        purchase = (
            db.query(models.Purchase)
            .filter(models.Purchase.id == invoice.purchase_id)
            .first()
        )
        if purchase is None:
            raise HTTPException(status_code=404, detail="Purchase not found")
        
        invoices = (
            db.query(models.Invoice)
            .filter(models.Invoice.purchase_id == invoice.purchase_id)
            .all()
        )

        # Check if invoice amount is not greater than the purchase's balance
        if invoice.amount > purchase.total_sale_cost - sum(i.amount for i in invoices):
            raise HTTPException(
                status_code=400,
                detail="Invoice amount exceeds balance of purchase cost",
            )
        if invoice.invoice_number in [i.invoice_number for i in invoices]:
            raise HTTPException(
                status_code=400,
                detail="Invoice number already exists",
            )

        # Create invoice
        db_invoice = models.Invoice(**invoice.dict())
        db.add(db_invoice)
        db.commit()
        db.refresh(db_invoice)
        return db_invoice
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# Get all invoices with optional filters
@router.get("/", response_model=List[schemas.Invoice])
def get_invoices(
    purchase_id: Optional[int] = None,
    status: Optional[str] = None,
    milestone: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db),
) -> List[schemas.Invoice]:
    try:
        query = db.query(models.Invoice)

        # Apply filters if provided
        if purchase_id:
            query = query.filter(models.Invoice.purchase_id == purchase_id)
        if status:
            query = query.filter(models.Invoice.status == status)
        if milestone:
            query = query.filter(models.Invoice.milestone == milestone)
        if from_date:
            query = query.filter(models.Invoice.invoice_date >= from_date)
        if to_date:
            query = query.filter(models.Invoice.invoice_date <= to_date)

        # Order by invoice date (newest first)
        query = query.order_by(models.Invoice.invoice_date.desc())

        invoices = query.all()
        return invoices
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get a specific invoice by ID
@router.get("/{invoice_id}", response_model=schemas.Invoice)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)) -> schemas.Invoice:
    try:
        invoice = (
            db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
        )
        if invoice is None:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return invoice
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Update an invoice
@router.put("/{invoice_id}", response_model=schemas.Invoice)
def update_invoice(
    invoice_id: int, invoice: schemas.InvoiceUpdate, db: Session = Depends(get_db)
) -> schemas.Invoice:
    try:
        # Check if invoice exists
        db_invoice = (
            db.query(models.Invoice)
            .filter(models.Invoice.id == invoice_id).first()
        )
        if db_invoice is None:
            raise HTTPException(status_code=404, detail="Invoice not found")
                # Check if invoice amount is not greater than the purchase's balance
        
        purchase = db.query(models.Purchase).filter(models.Purchase.id == db_invoice.purchase_id).first()
        invoices = db.query(models.Invoice).filter(models.Invoice.purchase_id == db_invoice.purchase_id).all()

        if invoice.amount > purchase.total_sale_cost - sum(i.amount for i in invoices):
            raise HTTPException(
                status_code=400,
                detail="Invoice amount exceeds balance of purchase cost",
            )
        # Update invoice fields
        for key, value in invoice.dict(exclude_unset=True).items():
            setattr(db_invoice, key, value)

        db.commit()
        db.refresh(db_invoice)
        return db_invoice
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# Delete Invoice
@router.delete("/{invoice_id}")
def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    try:
        # Check if invoice exists
        invoice = (
            db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
        )
        if invoice is None:
            raise HTTPException(status_code=404, detail="Invoice not found")

        # Check if there are any payments linked to this invoice
        payments = (
            db.query(models.Payment)
            .filter(models.Payment.invoice_id == invoice_id)
            .first()
        )
        if payments:
            raise HTTPException(
                status_code=400, 
                detail="Cannot delete invoice with linked payments. Delete the payments first."
            )

        # Delete the invoice
        db.delete(invoice)
        db.commit()
        return {"message": "Invoice deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) 