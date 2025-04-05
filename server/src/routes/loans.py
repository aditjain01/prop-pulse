from fastapi import APIRouter
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from src import schemas
from src.database import get_db, models
from src.routes.payment_sources import create_payment_source
import logging

# Create a router instance
router = APIRouter(prefix="/loans", tags=["loans"])     
logger = logging.getLogger(__name__)

# Loan routes
@router.post("", response_model=schemas.LoanOld, include_in_schema=False)
@router.post("/", response_model=schemas.LoanOld)
def create_loan(
    loan: schemas.LoanCreate, db: Session = Depends(get_db)
) -> schemas.LoanOld:
    """
    Create a new loan and automatically create a payment source for it.
    Validates that:
    1. The purchase exists
    2. The loan amount doesn't exceed total invoice amounts for the purchase
    3. The loan sanction amount doesn't exceed purchase total cost
    """
    try:
        # Check if purchase exists
        purchase = (
            db.query(models.Purchase)
            .filter(models.Purchase.id == loan.purchase_id)
            .first()
        )
        if purchase is None:
            raise HTTPException(status_code=404, detail="Purchase not found")

        # Get total invoice amount for this purchase
        purchase_invoices = (
            db.query(models.Invoice)
            .filter(models.Invoice.purchase_id == loan.purchase_id)
            .all()
        )
        total_invoice_amount = sum(invoice.amount for invoice in purchase_invoices)

        # Check if loan amount exceeds total invoice amount
        if loan.total_disbursed_amount > total_invoice_amount:
            raise HTTPException(
                status_code=400,
                detail="Loan disbursed amount cannot exceed total invoice amount for the purchase"
            )

        # Check if loan sanction amount exceeds purchase total cost
        if loan.sanction_amount > purchase.total_cost:
            raise HTTPException(
                status_code=400,
                detail="Loan sanction amount cannot exceed purchase total cost"
            )

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
            user_id=loan.user_id,
        )

        # Use the existing function to create the payment source
        create_payment_source(payment_source_data, db)

        # Commit the loan transaction
        db.commit()
        db.refresh(db_loan)
        return db_loan
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{loan_id}", response_model=schemas.LoanOld, include_in_schema=False)
@router.put("/{loan_id}/", response_model=schemas.LoanOld)
def update_loan(
    loan_id: int, loan_update: schemas.LoanUpdate, db: Session = Depends(get_db)
) -> schemas.LoanOld:
    """
    Update the details of an existing loan and its associated payment source.
    """
    try:
        db_loan = db.query(models.Loan).filter(models.Loan.id == loan_id).first()
        if db_loan is None:
            raise HTTPException(status_code=404, detail="Loan not found")

        # Update loan attributes
        for key, value in loan_update.dict().items():
            setattr(db_loan, key, value)

        # Also update the associated payment source
        payment_source = (
            db.query(models.PaymentSource)
            .filter(
                models.PaymentSource.loan_id == loan_id,
                models.PaymentSource.source_type == "loan",
            )
            .first()
        )

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
@router.delete("/{loan_id}", include_in_schema=False)
@router.delete("/{loan_id}/")
def delete_loan(loan_id: int, db: Session = Depends(get_db)):
    """
    Delete a loan and its associated payment sources, if they have no associated payments.
    """
    try:
        # Check if loan exists
        loan = db.query(models.Loan).filter(models.Loan.id == loan_id).first()
        if loan is None:
            raise HTTPException(status_code=404, detail="Loan not found")

        # Check if loan has associated payment sources
        payment_sources = (
            db.query(models.PaymentSource)
            .filter(models.PaymentSource.loan_id == loan_id)
            .all()
        )

        # Delete associated payment sources first
        for payment_source in payment_sources:
            # Check if payment source has associated payments
            payments = (
                db.query(models.Payment)
                .filter(models.Payment.source_id == payment_source.id)
                .all()
            )
            if payments:
                raise HTTPException(
                    status_code=400,
                    detail="Cannot delete loan with payment sources that have associated payments",
                )

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

@router.get("", response_model=List[schemas.LoanPublic], include_in_schema=False)
@router.get("/", response_model=List[schemas.LoanPublic])
def get_loans(
    purchase_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    from_amount: Optional[float] = None,
    to_amount: Optional[float] = None,
    db: Session = Depends(get_db),
) -> List[schemas.LoanPublic]:
    """
    Get a list of loans with essential information for the frontend.
    Optimized for frontend listing views with enhanced filtering using a single SQL query.
    """
    try:
        query = (
            db.query(
                models.Loan,
                func.coalesce(func.sum(models.Payment.amount), 0).label('total_disbursed_amount')
            )
            .outerjoin(models.PaymentSource, models.Loan.id == models.PaymentSource.loan_id)
            .outerjoin(models.Payment, models.PaymentSource.id == models.Payment.source_id)
            .group_by(models.Loan.id)
        )

        # Apply filters if provided
        if purchase_id:
            query = query.filter(models.Loan.purchase_id == purchase_id)
            
        if is_active is not None:
            query = query.filter(models.Loan.is_active == is_active)
            
        if from_amount:
            query = query.filter(models.Loan.sanction_amount >= from_amount)
            
        if to_amount:
            query = query.filter(models.Loan.sanction_amount <= to_amount)

        # Execute the query
        results = query.all()
        
        # Convert to LoanPublic schema objects
        return [
            {
                "id": loan.id,
                "name": loan.name,
                "institution": loan.institution,
                "sanction_amount": loan.sanction_amount,
                "total_disbursed_amount": total_disbursed,
                "is_active": loan.is_active,
            }
            for loan, total_disbursed in results
        ]
    except HTTPException as e:
        logger.error(f"Error in get_loans: {e}") 
        raise
    except Exception as e:
        logger.error(f"Error in get_loans: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{loan_id}", response_model=schemas.Loan, include_in_schema=False)
@router.get("/{loan_id}", response_model=schemas.Loan)
def get_loan(loan_id: int, db: Session = Depends(get_db)) -> schemas.Loan:
    """
    Get a detailed view of a single loan with property information.
    Optimized for frontend detail views.
    """
    try:
        # Query that joins Loan with Purchase and Property
        result = (
            db.query(
                models.Loan,
                models.Property.name.label("property_name")
            )
            .join(models.Purchase, models.Loan.purchase_id == models.Purchase.id)
            .join(models.Property, models.Purchase.property_id == models.Property.id)
            .filter(models.Loan.id == loan_id)
            .first()
        )
        source = db.query(models.PaymentSource).filter(models.PaymentSource.loan_id == loan_id).first()
        payments = db.query(models.Payment).filter(models.Payment.source_id == source.id).all()

        if result is None:
            raise HTTPException(status_code=404, detail="Loan not found")
            
        loan, property_name = result
        
        # Convert to the expected schema format
        loan_dict = {
            "id": loan.id,
            "name": loan.name,
            "institution": loan.institution,
            "total_disbursed_amount": sum(payment.amount for payment in payments) if payments else 0,
            "sanction_amount": loan.sanction_amount,
            "property_name": property_name,
            "processing_fee": loan.processing_fee,
            "other_charges": loan.other_charges,
            "loan_sanction_charges": loan.loan_sanction_charges,
            "interest_rate": loan.interest_rate,
            "tenure_months": loan.tenure_months,
            "is_active": loan.is_active,
        }
            
        return loan_dict
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
