from fastapi import APIRouter
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from src import models, schemas
from src.database import engine, get_db

# Create a router instance
router = APIRouter(prefix="/api/payments", tags=["payments"])

# Create a new payment
@router.post("/", response_model=schemas.Payment)
def create_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db)) -> schemas.Payment:
    try:
        # Check if purchase exists
        purchase = db.query(models.Purchase).filter(models.Purchase.id == payment.purchase_id).first()
        if purchase is None:
            raise HTTPException(status_code=404, detail="Purchase not found")
        
        # Check if payment amount is not greater than the purchase's total_sale_cost
        if payment.amount > purchase.total_sale_cost:
            raise HTTPException(status_code=400, detail="Payment amount exceeds total sale cost of the purchase")
        
        # Check if payment source exists - updated to use source_id
        payment_source = db.query(models.PaymentSource).filter(models.PaymentSource.id == payment.source_id).first()
        if payment_source is None:
            raise HTTPException(status_code=404, detail="Payment source not found")
        
        # Check if the payment source's source_type is "loan" and update the loan's total disbursed amount
        if payment_source.source_type == "loan":
            loan = db.query(models.Loan).filter(models.Loan.id == payment_source.loan_id).first()
            if loan:
                loan.total_disbursed_amount += payment.amount  # Update the disbursed amount
            else:
                raise HTTPException(status_code=404, detail="Loan not found")
        
        # Create payment with user_id defaulted to 1
        db_payment = models.Payment(**payment.dict(), user_id=1)  # Default user_id to 1
        db.add(db_payment)
        db.commit()
        db.refresh(db_payment)
        return db_payment
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Get all payments with optional filters
@router.get("/", response_model=List[schemas.Payment])
def get_payments(
    purchase_id: Optional[int] = None,
    payment_source_id: Optional[int] = None,
    milestone: Optional[str] = None,
    payment_mode: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db)
) -> List[schemas.Payment]:
    try:
        query = db.query(models.Payment)
        
        # Apply filters if provided
        if purchase_id:
            query = query.filter(models.Payment.purchase_id == purchase_id)
        if payment_source_id:
            query = query.filter(models.Payment.payment_source_id == payment_source_id)
        if milestone:
            query = query.filter(models.Payment.milestone == milestone)
        if payment_mode:
            query = query.filter(models.Payment.payment_mode == payment_mode)
        if from_date:
            query = query.filter(models.Payment.payment_date >= from_date)
        if to_date:
            query = query.filter(models.Payment.payment_date <= to_date)
        
        # Order by payment date (newest first)
        query = query.order_by(models.Payment.payment_date.desc())
        
        payments = query.all()
        return payments
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get a specific payment by ID
@router.get("/{payment_id}", response_model=schemas.Payment)
def get_payment(payment_id: int, db: Session = Depends(get_db)) -> schemas.Payment:
    try:
        payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
        if payment is None:
            raise HTTPException(status_code=404, detail="Payment not found")
        return payment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Update a payment
@router.put("/{payment_id}", response_model=schemas.Payment)
def update_payment(payment_id: int, payment: schemas.PaymentUpdate, db: Session = Depends(get_db)) -> schemas.Payment:
    try:
        # Check if payment exists
        db_payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
        if db_payment is None:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # # Check if user owns this payment
        # if db_payment.user_id != current_user.id:
        #     raise HTTPException(status_code=403, detail="Not authorized to update this payment")
        
        # Update payment fields
        for key, value in payment.dict(exclude_unset=True).items():
            setattr(db_payment, key, value)
        
        db.commit()
        db.refresh(db_payment)
        return db_payment
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Delete Payment
@router.delete("/{payment_id}")
def delete_payment(payment_id: int, db: Session = Depends(get_db)):
    try:
        # Check if payment exists
        payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
        if payment is None:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Delete the payment
        db.delete(payment)
        db.commit()
        return {"message": "Payment deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
