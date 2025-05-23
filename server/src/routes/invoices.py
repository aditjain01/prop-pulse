from fastapi import APIRouter
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from src import schemas
from src.database import get_db, models
from sqlalchemy import func

# Create a router instance
router = APIRouter(prefix="/invoices", tags=["invoices"])

# Create a new invoice
@router.post("/", response_model=schemas.InvoiceOld, description="Create a new invoice")
def create_invoice(
    invoice: schemas.InvoiceCreate, db: Session = Depends(get_db)
) -> schemas.InvoiceOld:
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

# Update an invoice
@router.put("/{invoice_id}", response_model=schemas.InvoiceOld, description="Update an existing invoice")
def update_invoice(
    invoice_id: int, invoice: schemas.InvoiceUpdate, db: Session = Depends(get_db)
) -> schemas.InvoiceOld:
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
@router.delete("/{invoice_id}", description="Delete an invoice by ID")
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

@router.get("", response_model=List[schemas.InvoicePublic], include_in_schema=False)
@router.get("/", response_model=List[schemas.InvoicePublic])
def get_invoices(
    purchase_id: Optional[int] = None,
    status: Optional[str] = None,
    milestone: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db),
) -> List[schemas.InvoicePublic]:
    try:
        # Start with a query that joins Invoice with Purchase, Property and Payments
        query = (
            db.query(
                models.Invoice,
                models.Property.name.label("property_name"),
                func.coalesce(func.sum(models.Payment.amount), 0).label("paid_amount")
            )
            .join(models.Purchase, models.Invoice.purchase_id == models.Purchase.id)
            .join(models.Property, models.Purchase.property_id == models.Property.id)
            .outerjoin(models.Payment, models.Invoice.id == models.Payment.invoice_id)
            .group_by(models.Invoice.id, models.Property.name)
        )

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

        results = query.all()
        
        # Convert the results to the expected schema format
        invoices = []
        for invoice, property_name, paid_amount in results:
            invoice_dict = {
                "id": invoice.id,
                "purchase_id": invoice.purchase_id,
                "invoice_number": invoice.invoice_number,
                "invoice_date": invoice.invoice_date,
                "due_date": invoice.due_date,
                "amount": invoice.amount,
                "status": invoice.status,
                "milestone": invoice.milestone,
                "description": invoice.description,
                "created_at": invoice.created_at,
                "updated_at": invoice.updated_at,
                "paid_amount": paid_amount,
                "property_name": property_name,
            }
            invoices.append(invoice_dict)
            
        return invoices
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{invoice_id}", response_model=schemas.Invoice, include_in_schema=False)
@router.get("/{invoice_id}", response_model=schemas.Invoice)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)) -> schemas.Invoice:
    try:
        # Query that joins Invoice with Purchase, Property and calculates paid_amount
        result = (
            db.query(
                models.Invoice,
                models.Property.name.label("property_name"),
                func.coalesce(func.sum(models.Payment.amount), 0).label("paid_amount")
            )
            .join(models.Purchase, models.Invoice.purchase_id == models.Purchase.id)
            .join(models.Property, models.Purchase.property_id == models.Property.id)
            .outerjoin(models.Payment, models.Invoice.id == models.Payment.invoice_id)
            .filter(models.Invoice.id == invoice_id)
            .group_by(models.Invoice.id, models.Property.name)
            .first()
        )
        
        if result is None:
            raise HTTPException(status_code=404, detail="Invoice not found")
            
        invoice, property_name, paid_amount = result
        
        # Convert to the expected schema format
        invoice_dict = {
            "id": invoice.id,
            "purchase_id": invoice.purchase_id,
            "invoice_number": invoice.invoice_number,
            "invoice_date": invoice.invoice_date,
            "due_date": invoice.due_date,
            "amount": invoice.amount,
            "status": invoice.status,
            "milestone": invoice.milestone,
            "description": invoice.description,
            "created_at": invoice.created_at,
            "updated_at": invoice.updated_at,
            "paid_amount": paid_amount,
            "property_name": property_name,
        }
            
        return invoice_dict
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 
