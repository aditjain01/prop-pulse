from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from src import schemas
from src.database import get_db, models
from fastapi import APIRouter
import logging
from sqlalchemy import func
from decimal import Decimal

# Create a router instance
router = APIRouter(prefix="/repayments", tags=["repayments"])
logger = logging.getLogger(__name__)



# Updated Loan Repayment endpoints with new route structure
@router.post("", response_model=schemas.LoanRepaymentOld, include_in_schema=False)
@router.post("/", response_model=schemas.LoanRepaymentOld)
def create_loan_repayment(
    repayment: schemas.LoanRepaymentCreate, db: Session = Depends(get_db)
) -> schemas.LoanRepaymentOld:
    """
    Create a new loan repayment.
    """
    logger.info(f"Creating new loan repayment for loan_id: {repayment.loan_id}")
    logger.debug(repayment.model_dump())
    try:
        # Check if loan exists (required)
        loan = db.query(models.Loan).filter(models.Loan.id == repayment.loan_id).first()
        if loan is None:
            logger.warning(f"Loan not found for ID: {repayment.loan_id}")
            raise HTTPException(status_code=404, detail="Loan not found")

        # Check if payment source exists
        payment_source = (
            db.query(models.PaymentSource)
            .filter(models.PaymentSource.id == repayment.source_id)
            .first()
        )
        if payment_source is None:
            logger.warning(f"Payment source not found for ID: {repayment.source_id}")
            raise HTTPException(status_code=404, detail="Payment source not found")

        # Calculate total disbursed amount for the loan
        total_disbursed = (
            db.query(func.sum(models.Payment.amount))
            .join(models.PaymentSource, models.Payment.source_id == models.PaymentSource.id)
            .filter(models.PaymentSource.loan_id == loan.id)
            .scalar() or Decimal("0")
        )

        # Check if principal amount is less than or equal to total disbursed amount
        if repayment.principal_amount > total_disbursed:
            logger.warning(f"Principal amount {repayment.principal_amount} exceeds total disbursed amount {total_disbursed}")
            raise HTTPException(
                status_code=400, detail="Payment exceeds total disbursed amount"
            )

        # Create loan repayment
        db_repayment = models.LoanRepayment(**repayment.dict())
        db.add(db_repayment)
        db.commit()
        db.refresh(db_repayment)
        logger.info(f"Successfully created loan repayment with ID: {db_repayment.id}")
        return db_repayment
    except HTTPException:
        logger.error("HTTP exception occurred during loan repayment creation")
        raise
    except Exception as e:
        logger.error(f"Error creating loan repayment: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{repayment_id}", response_model=schemas.LoanRepaymentOld, include_in_schema=False)
@router.put("/{repayment_id}/", response_model=schemas.LoanRepaymentOld)
def update_loan_repayment(
    repayment_id: int,
    repayment: schemas.LoanRepaymentUpdate,
    db: Session = Depends(get_db),
) -> schemas.LoanRepaymentOld:
    """
    Update an existing loan repayment by ID.
    """
    logger.info(f"Updating loan repayment with ID: {repayment_id}")
    logger.debug(f"Update data: {repayment.model_dump(exclude_unset=True)}")
    try:
        # Check if repayment exists
        db_repayment = (
            db.query(models.LoanRepayment)
            .filter(models.LoanRepayment.id == repayment_id)
            .first()
        )
        if db_repayment is None:
            logger.warning(f"Loan repayment not found for ID: {repayment_id}")
            raise HTTPException(status_code=404, detail="Loan repayment not found")

        # Check if the loan associated with the repayment exists
        loan = (
            db.query(models.Loan).filter(models.Loan.id == db_repayment.loan_id).first()
        )
        if loan is None:
            logger.warning(f"Loan not found for ID: {db_repayment.loan_id}")
            raise HTTPException(status_code=404, detail="Loan not found")

        # Calculate total disbursed amount for the loan
        total_disbursed = (
            db.query(func.sum(models.Payment.amount))
            .join(models.PaymentSource, models.Payment.source_id == models.PaymentSource.id)
            .filter(models.PaymentSource.loan_id == loan.id)
            .scalar() or Decimal("0")
        )

        # Validate that the updated principal amount does not exceed the total disbursed amount
        if (
            repayment.principal_amount is not None
            and repayment.principal_amount > total_disbursed
        ):
            logger.warning(f"Updated principal amount {repayment.principal_amount} exceeds total disbursed amount {total_disbursed}")
            raise HTTPException(
                status_code=400,
                detail="Updated principal amount exceeds total disbursed amount",
            )

        # Update repayment attributes
        for key, value in repayment.dict(exclude_unset=True).items():
            setattr(db_repayment, key, value)

        db.commit()
        db.refresh(db_repayment)
        logger.info(f"Successfully updated loan repayment with ID: {repayment_id}")
        return db_repayment
    except HTTPException:
        logger.error(f"HTTP exception occurred during loan repayment update for ID: {repayment_id}")
        raise
    except Exception as e:
        logger.error(f"Error updating loan repayment with ID {repayment_id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{repayment_id}", include_in_schema=False)
@router.delete("/{repayment_id}/")
def delete_loan_repayment(repayment_id: int, db: Session = Depends(get_db)):
    """
    Delete a loan repayment by ID.
    """
    logger.info(f"Attempting to delete loan repayment with ID: {repayment_id}")
    try:
        # Check if repayment exists
        repayment = (
            db.query(models.LoanRepayment)
            .filter(models.LoanRepayment.id == repayment_id)
            .first()
        )
        if repayment is None:
            logger.warning(f"Loan repayment not found for ID: {repayment_id}")
            raise HTTPException(status_code=404, detail="Loan repayment not found")

        # Delete the repayment
        logger.debug(f"Deleting loan repayment ID: {repayment_id}")
        db.delete(repayment)
        db.commit()
        logger.info(f"Successfully deleted loan repayment with ID: {repayment_id}")
        return {"message": "Loan repayment deleted successfully"}
    except HTTPException:
        logger.error(f"HTTP exception occurred during loan repayment deletion for ID: {repayment_id}")
        raise
    except Exception as e:
        logger.error(f"Error deleting loan repayment with ID {repayment_id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=List[schemas.LoanRepaymentPublic], include_in_schema=False)
@router.get("/", response_model=List[schemas.LoanRepaymentPublic])
def get_loan_repayments(
    loan_id: Optional[int] = None,
    source_id: Optional[int] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    db: Session = Depends(get_db),
) -> List[schemas.LoanRepaymentPublic]:
    """
    Get a list of loan repayments with enhanced information.
    Optimized for frontend listing views with improved filtering.
    """
    logger.info(f"Getting loan repayments with filters: loan_id={loan_id}, source_id={source_id}, from_date={from_date}, to_date={to_date}, min_amount={min_amount}, max_amount={max_amount}")
    try:
        # Start with a query that joins LoanRepayment with Loan, PaymentSource, Purchase, and Property
        query = (
            db.query(
                models.LoanRepayment,
                models.PaymentSource.name.label("loan_name"),
                models.PaymentSource.name.label("source_name"),
                models.Property.name.label("property_name"),
                models.Loan.institution.label("loan_institution")
            )
            .join(models.Loan, models.LoanRepayment.loan_id == models.Loan.id)
            .join(models.PaymentSource, models.LoanRepayment.source_id == models.PaymentSource.id)
            .join(models.Purchase, models.Loan.purchase_id == models.Purchase.id)
            .join(models.Property, models.Purchase.property_id == models.Property.id)
        )

        # Apply filters if provided
        if loan_id:
            query = query.filter(models.LoanRepayment.loan_id == loan_id)
            logger.debug(f"Filtering by loan_id: {loan_id}")
            
        if source_id:
            query = query.filter(models.LoanRepayment.source_id == source_id)
            logger.debug(f"Filtering by source_id: {source_id}")
            
        if from_date:
            query = query.filter(models.LoanRepayment.payment_date >= from_date)
            logger.debug(f"Filtering by from_date: {from_date}")
            
        if to_date:
            query = query.filter(models.LoanRepayment.payment_date <= to_date)
            logger.debug(f"Filtering by to_date: {to_date}")
            
        if min_amount:
            query = query.filter(models.LoanRepayment.total_payment >= min_amount)
            logger.debug(f"Filtering by min_amount: {min_amount}")
            
        if max_amount:
            query = query.filter(models.LoanRepayment.total_payment <= max_amount)
            logger.debug(f"Filtering by max_amount: {max_amount}")

        # Order by payment date (newest first)
        query = query.order_by(models.LoanRepayment.payment_date.desc())

        results = query.all()
        logger.debug(f"Found {len(results)} loan repayments matching criteria")
        
        # Convert the results to the expected schema format
        repayments = []
        for repayment, loan_name, source_name, property_name, loan_institution in results:
            repayment_dict = {
                "id": repayment.id,
                "loan_name": loan_name,
                "loan_institution": loan_institution,
                "property_name": property_name,
                "total_payment": repayment.total_payment,
                "source_name": source_name,
                "payment_date": repayment.payment_date,
                "payment_mode": repayment.payment_mode,
            }
            repayments.append(repayment_dict)
            
        logger.info(f"Successfully retrieved {len(repayments)} loan repayments")
        return repayments
    except Exception as e:
        logger.error(f"Error in get_loan_repayments: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{repayment_id}", response_model=schemas.LoanRepayment, include_in_schema=False)
@router.get("/{repayment_id}", response_model=schemas.LoanRepayment)
def get_loan_repayment(repayment_id: int, db: Session = Depends(get_db)) -> schemas.LoanRepayment:
    """
    Get a detailed view of a single loan repayment.
    Optimized for frontend detail views.
    """
    logger.info(f"Getting detailed view of loan repayment with ID: {repayment_id}")
    try:
        # Query with joins to Loan, PaymentSource, Purchase, and Property
        result = (
            db.query(
                models.LoanRepayment,
                models.PaymentSource.name.label("loan_name"),
                models.Loan.institution.label("loan_institution"),
                models.PaymentSource.name.label("source_name"),
                models.Property.name.label("property_name"),
                models.Purchase.id.label("purchase_id")
            )
            .join(models.Loan, models.LoanRepayment.loan_id == models.Loan.id)
            .join(models.PaymentSource, models.LoanRepayment.source_id == models.PaymentSource.id)
            .join(models.Purchase, models.Loan.purchase_id == models.Purchase.id)
            .join(models.Property, models.Purchase.property_id == models.Property.id)
            .filter(models.LoanRepayment.id == repayment_id)
            .first()
        )
        
        if result is None:
            logger.warning(f"Loan repayment not found for ID: {repayment_id}")
            raise HTTPException(status_code=404, detail="Loan repayment not found")
            
        repayment, loan_name, loan_institution, source_name, property_name, purchase_id = result
        logger.debug(f"Found loan repayment with ID: {repayment_id}, property: {property_name}")
        
        # Convert to the expected schema format
        repayment_dict = {
            "id": repayment.id,
            "loan_name": loan_name,
            "loan_institution": loan_institution,
            "property_name": property_name,
            "purchase_id": purchase_id,
            "total_payment": repayment.total_payment,
            "source_name": source_name,
            "payment_date": repayment.payment_date,
            "payment_mode": repayment.payment_mode,
            "principal_amount": repayment.principal_amount,
            "interest_amount": repayment.interest_amount,
            "other_fees": repayment.other_fees,
            "penalties": repayment.penalties,
            "transaction_reference": repayment.transaction_reference,
            "notes": repayment.notes,
        }
            
        logger.info(f"Successfully retrieved loan repayment details for ID: {repayment_id}")
        return repayment_dict
    except HTTPException:
        logger.error(f"HTTP exception occurred while getting loan repayment ID: {repayment_id}")
        raise
    except Exception as e:
        logger.error(f"Error getting loan repayment with ID {repayment_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
