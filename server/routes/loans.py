from fastapi import APIRouter
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from server import models, schemas
from server.database import engine, get_db
from server.init_construction_status import init_construction_status
from fastapi import Query
from sqlalchemy import func
# Create a router instance
router = APIRouter(prefix="/api/loans", tags=["loans"])

# Loan routes
@router.post("/", response_model=schemas.Loan)
def create_loan(loan: schemas.LoanCreate, db: Session = Depends(get_db)) -> schemas.Loan:
    try:
        # Create the loan
        db_loan = models.Loan(**loan.dict())
        db.add(db_loan)
        db.flush()  # Flush to get the loan ID without committing
        
        # Automatically create a payment source for this loan using the existing function
        payment_source_data = schemas.PaymentSourceCreate(
            name=f"Loan: {loan.name}",
            source_type="loan",
            description=f"Auto-created for loan from {loan.institution}",
            is_active=True,
            loan_id=db_loan.id,
            lender=loan.institution,
            user_id=loan.user_id
        )
        
        # Use the existing function to create the payment source
        create_payment_source(payment_source_data, db)
        
        # Commit the loan transaction
        db.commit()
        db.refresh(db_loan)
        return db_loan
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# Get all loans with optional filtering
@router.get("/", response_model=List[schemas.Loan])
def get_loans(purchase_id: Optional[int] = None, db: Session = Depends(get_db)) -> List[schemas.Loan]:
    try:
        query = db.query(models.Loan).filter(models.Loan.user_id == 1)  # Replace with actual user ID
        
        # Apply purchase_id filter if provided
        if purchase_id:
            # Check if purchase exists
            purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
            if purchase is None:
                raise HTTPException(status_code=404, detail="Purchase not found")
            
            query = query.filter(models.Loan.purchase_id == purchase_id)
        
        loans = query.all()
        return loans
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# # Get loans by purchase ID (keeping for backward compatibility)
# @app.get("/api/purchases/{purchase_id}/loans", response_model=List[schemas.Loan])
# def get_loans_by_purchase(purchase_id: int, db: Session = Depends(get_db)):
#     return get_loans(purchase_id=purchase_id, db=db)

@router.get("/{loan_id}", response_model=schemas.Loan)
def get_loan(loan_id: int, db: Session = Depends(get_db)) -> schemas.Loan:
    try:
        loan = db.query(models.Loan).filter(models.Loan.id == loan_id).first()
        if loan is None:
            raise HTTPException(status_code=404, detail="Loan not found")
        return loan
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{loan_id}", response_model=schemas.Loan)
def update_loan(loan_id: int, loan_update: schemas.LoanCreate, db: Session = Depends(get_db)) -> schemas.Loan:
    try:
        db_loan = db.query(models.Loan).filter(models.Loan.id == loan_id).first()
        if db_loan is None:
            raise HTTPException(status_code=404, detail="Loan not found")
        
        # Update loan attributes
        for key, value in loan_update.dict().items():
            setattr(db_loan, key, value)
        
        # Also update the associated payment source
        payment_source = db.query(models.PaymentSource).filter(
            models.PaymentSource.loan_id == loan_id,
            models.PaymentSource.source_type == "loan"
        ).first()
        
        if payment_source:
            payment_source.name = f"Loan: {loan_update.name}"
            payment_source.lender = loan_update.institution
            payment_source.is_active = loan_update.is_active
        
        db.commit()
        db.refresh(db_loan)
        return db_loan
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# Delete Loan
@router.delete("/{loan_id}")
def delete_loan(loan_id: int, db: Session = Depends(get_db)):
    try:
        # Check if loan exists
        loan = db.query(models.Loan).filter(models.Loan.id == loan_id).first()
        if loan is None:
            raise HTTPException(status_code=404, detail="Loan not found")
        
        # Check if loan has associated payment sources
        payment_sources = db.query(models.PaymentSource).filter(models.PaymentSource.loan_id == loan_id).all()
        
        # Delete associated payment sources first
        for payment_source in payment_sources:
            # Check if payment source has associated payments
            payments = db.query(models.Payment).filter(models.Payment.payment_source_id == payment_source.id).all()
            if payments:
                raise HTTPException(status_code=400, detail="Cannot delete loan with payment sources that have associated payments")
            
            db.delete(payment_source)
        
        # Delete the loan
        db.delete(loan)
        db.commit()
        return {"message": "Loan deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

