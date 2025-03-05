from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from src import models, schemas
from src.database import engine, get_db
from src.init_construction_status import init_construction_status
from fastapi import Query
from sqlalchemy import func
from fastapi import APIRouter

# Create a router instance
router = APIRouter(prefix="/api/repayments", tags=["repayments"])

# Updated Loan Repayment endpoints with new route structure
@router.post("/", response_model=schemas.LoanRepayment)
def create_loan_repayment(repayment: schemas.LoanRepaymentCreate, db: Session = Depends(get_db)) -> schemas.LoanRepayment:
    print(repayment.model_dump())
    try:
        # Check if loan exists (required)
        loan = db.query(models.Loan).filter(models.Loan.id == repayment.loan_id).first()
        if loan is None:
            raise HTTPException(status_code=404, detail="Loan not found")
        
        # Check if payment source exists
        payment_source = db.query(models.PaymentSource).filter(models.PaymentSource.id == repayment.source_id).first()
        if payment_source is None:
            raise HTTPException(status_code=404, detail="Payment source not found")
        
        # Check if principal amount is less than or equal to total disbursed amount
        if repayment.principal_amount > loan.total_disbursed_amount:
            raise HTTPException(status_code=400, detail="Payment exceeds total disbursed amount")
        
        # Create loan repayment
        db_repayment = models.LoanRepayment(**repayment.dict())
        db.add(db_repayment)
        db.commit()
        db.refresh(db_repayment)
        return db_repayment
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[schemas.LoanRepayment])
def get_loan_repayments(
    loan_id: Optional[int] = None,
    source_id: Optional[int] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db)
) -> List[schemas.LoanRepayment]:
    try:
        query = db.query(models.LoanRepayment)
        
        # Apply filters if provided
        if loan_id:
            query = query.filter(models.LoanRepayment.loan_id == loan_id)
        if source_id:
            query = query.filter(models.LoanRepayment.source_id == source_id)
        if from_date:
            query = query.filter(models.LoanRepayment.payment_date >= from_date)
        if to_date:
            query = query.filter(models.LoanRepayment.payment_date <= to_date)
        
        # Order by payment date (newest first)
        query = query.order_by(models.LoanRepayment.payment_date.desc())
        
        repayments = query.all()
        return repayments
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{repayment_id}", response_model=schemas.LoanRepayment)
def get_loan_repayment(repayment_id: int, db: Session = Depends(get_db)) -> schemas.LoanRepayment:
    try:
        repayment = db.query(models.LoanRepayment).filter(models.LoanRepayment.id == repayment_id).first()
        if repayment is None:
            raise HTTPException(status_code=404, detail="Loan repayment not found")
        return repayment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{repayment_id}", response_model=schemas.LoanRepayment)
def update_loan_repayment(repayment_id: int, repayment: schemas.LoanRepaymentUpdate, db: Session = Depends(get_db)) -> schemas.LoanRepayment:
    x = schemas.LoanRepaymentUpdate(**repayment.model_dump())
    print(x)
    print(repayment.model_dump(exclude_unset=True))
    try:
        print(x.total_payment)
    except Exception as e:
        print(str(e))
    try:
        # Check if repayment exists
        db_repayment = db.query(models.LoanRepayment).filter(models.LoanRepayment.id == repayment_id).first()
        if db_repayment is None:
            raise HTTPException(status_code=404, detail="Loan repayment not found")
        
        # Check if the loan associated with the repayment exists
        loan = db.query(models.Loan).filter(models.Loan.id == db_repayment.loan_id).first()
        if loan is None:
            raise HTTPException(status_code=404, detail="Loan not found")
        
        # Validate that the updated principal amount does not exceed the total disbursed amount
        if repayment.principal_amount is not None and repayment.principal_amount > loan.total_disbursed_amount:
            raise HTTPException(status_code=400, detail="Updated principal amount exceeds total disbursed amount")
        
        # Update repayment fields
        for key, value in repayment.dict(exclude_unset=True).items():
            setattr(db_repayment, key, value)
        
        db.commit()
        db.refresh(db_repayment)
        return db_repayment
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{repayment_id}")
def delete_loan_repayment(repayment_id: int, db: Session = Depends(get_db)):
    try:
        # Check if repayment exists
        repayment = db.query(models.LoanRepayment).filter(models.LoanRepayment.id == repayment_id).first()
        if repayment is None:
            raise HTTPException(status_code=404, detail="Loan repayment not found")
        
        # Delete the repayment
        db.delete(repayment)
        db.commit()
        return {"message": "Loan repayment deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
