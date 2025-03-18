from fastapi import APIRouter
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from src import schemas
from src.database import get_db, models
from src.routes.payment_sources import create_payment_source

# Create a router instance
router = APIRouter(prefix="/loans", tags=["loans"])

# V2 routes for frontend-aligned endpoints
router_dev = APIRouter(prefix="/v2/loans", tags=["loans"])


# Loan routes
@router.post("", response_model=schemas.LoanOld, include_in_schema=False)
@router.post("/", response_model=schemas.LoanOld)
def create_loan(
    loan: schemas.LoanCreate, db: Session = Depends(get_db)
) -> schemas.LoanOld:
    """
    Create a new loan and automatically create a payment source for it.
    """
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
            user_id=loan.user_id,
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


@router_dev.get("", response_model=schemas.LoanOld, include_in_schema=False)
@router_dev.get("/", response_model=List[schemas.LoanOld])
def get_loans_old(
    purchase_id: Optional[int] = None, db: Session = Depends(get_db)
) -> List[schemas.LoanOld]:
    """
    Get a list of loans for a specific user, with an optional filter by purchase ID.
    """
    try:
        query = db.query(models.Loan).filter(
            models.Loan.user_id == 1
        )  # Replace with actual user ID

        # Apply purchase_id filter if provided
        if purchase_id:
            # Check if purchase exists
            purchase = (
                db.query(models.Purchase)
                .filter(models.Purchase.id == purchase_id)
                .first()
            )
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

@router_dev.get("/{loan_id}", response_model=schemas.LoanOld, include_in_schema=False)
@router_dev.get("/{loan_id}/", response_model=schemas.LoanOld)
def get_loan_old(loan_id: int, db: Session = Depends(get_db)) -> schemas.LoanOld:
    """
    Get detailed information about a specific loan.
    """
    try:
        loan = db.query(models.Loan).filter(models.Loan.id == loan_id).first()
        if loan is None:
            raise HTTPException(status_code=404, detail="Loan not found")
        return loan
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{loan_id}", response_model=schemas.LoanOld, include_in_schema=False)
@router.put("/{loan_id}/", response_model=schemas.LoanOld)
def update_loan(
    loan_id: int, loan_update: schemas.LoanCreate, db: Session = Depends(get_db)
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
                .filter(models.Payment.payment_source_id == payment_source.id)
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
    Optimized for frontend listing views with enhanced filtering.
    """
    try:
        query = db.query(models.Loan).filter(
            models.Loan.user_id == 1
        )  # Replace with actual user ID

        # Apply filters if provided
        if purchase_id:
            query = query.filter(models.Loan.purchase_id == purchase_id)
            
        if is_active is not None:
            query = query.filter(models.Loan.is_active == is_active)
            
        if from_amount:
            query = query.filter(models.Loan.sanction_amount >= from_amount)
            
        if to_amount:
            query = query.filter(models.Loan.sanction_amount <= to_amount)

        loans = query.all()
        return loans
    except HTTPException:
        raise
    except Exception as e:
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
        
        if result is None:
            raise HTTPException(status_code=404, detail="Loan not found")
            
        loan, property_name = result
        
        # Convert to the expected schema format
        loan_dict = {
            "id": loan.id,
            "name": loan.name,
            "institution": loan.institution,
            "total_disbursed_amount": loan.total_disbursed_amount,
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
