from fastapi import APIRouter
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from src import schemas
from src.database import get_db, models
from src.routes.payment_sources import create_payment_source
import logging
from decimal import Decimal

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
    logger.info(f"Creating new loan for purchase_id: {loan.purchase_id}")
    try:
        # Check if purchase exists
        purchase = (
            db.query(models.Purchase)
            .filter(models.Purchase.id == loan.purchase_id)
            .first()
        )
        if purchase is None:
            logger.warning(f"Purchase not found for ID: {loan.purchase_id}")
            raise HTTPException(status_code=404, detail="Purchase not found")

        # Get property name for the purchase
        property = (
            db.query(models.Property)
            .filter(models.Property.id == purchase.property_id)
            .first()
        )
        property_name = property.name if property else "Unknown Property"
        logger.debug(f"Associated property name: {property_name}")

        # Get total invoice amount for this purchase
        purchase_invoices = (
            db.query(models.Invoice)
            .filter(models.Invoice.purchase_id == loan.purchase_id)
            .all()
        )
        total_invoice_amount = sum(invoice.amount for invoice in purchase_invoices)
        logger.debug(f"Total invoice amount: {total_invoice_amount}")

        # Check if loan sanction amount exceeds purchase total cost
        if loan.sanction_amount > purchase.total_cost:
            logger.warning(f"Loan sanction amount ({loan.sanction_amount}) exceeds purchase total cost ({purchase.total_cost})")
            raise HTTPException(
                status_code=400,
                detail="Loan sanction amount cannot exceed purchase total cost"
            )

        # Create the loan
        db_loan = models.Loan(**loan.dict())
        db.add(db_loan)
        db.flush()  # Flush to get the loan ID without committing
        logger.debug(f"Created loan with ID: {db_loan.id}")

        # Automatically create a payment source for this loan using the existing function
        payment_source_data = schemas.PaymentSourceCreate(
            name=f"{property_name} Loan: {loan.institution}",
            source_type="loan",
            description=f"Auto-created loan '{loan.loan_number}' from {loan.institution}",
            is_active=True,
            loan_id=db_loan.id,
            lender=loan.institution,
            user_id=loan.user_id,
        )

        # Use the existing function to create the payment source
        create_payment_source(payment_source_data, db)
        logger.debug(f"Created payment source for loan ID: {db_loan.id}")

        # Commit the loan transaction
        db.commit()
        db.refresh(db_loan)
        logger.info(f"Successfully created loan with ID: {db_loan.id}")
        return db_loan
    except HTTPException:
        logger.error("HTTP exception occurred during loan creation")
        db.rollback()
        raise
    except Exception as e:
        logger.error(f"Error creating loan: {str(e)}")
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
    logger.info(f"Updating loan with ID: {loan_id}")
    try:
        db_loan = db.query(models.Loan).filter(models.Loan.id == loan_id).first()
        if db_loan is None:
            logger.warning(f"Loan not found for ID: {loan_id}")
            raise HTTPException(status_code=404, detail="Loan not found")

        # Update loan attributes
        for key, value in loan_update.dict().items():
            setattr(db_loan, key, value)
        logger.debug(f"Updated loan attributes for ID: {loan_id}")

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
            logger.debug(f"Found associated payment source ID: {payment_source.id}")
            # Get the purchase and property name if we need to update name or description
            if loan_update.institution is not None or loan_update.loan_number is not None:
                purchase = (
                    db.query(models.Purchase)
                    .join(models.Loan, models.Loan.purchase_id == models.Purchase.id)
                    .filter(models.Loan.id == loan_id)
                    .first()
                )
                
                # Get property name for the purchase
                property = (
                    db.query(models.Property)
                    .filter(models.Property.id == purchase.property_id)
                    .first()
                )
                property_name = property.name if property else "Unknown Property"
                logger.debug(f"Associated property name: {property_name}")
                
                # Only update name if institution is provided
                if loan_update.institution is not None:
                    payment_source.name = f"{property_name} Loan: {loan_update.institution}"
                    payment_source.lender = loan_update.institution
                    logger.debug(f"Updated payment source name to: {payment_source.name}")
                
                # Only update description if name is provided
                if loan_update.loan_number is not None:
                    payment_source.description = f"Auto-created loan '{loan_update.loan_number}' from {payment_source.lender}"
                    logger.debug(f"Updated payment source description")

            # Only update is_active if provided
            if loan_update.is_active is not None:
                payment_source.is_active = loan_update.is_active
                logger.debug(f"Updated payment source is_active to: {loan_update.is_active}")

        db.commit()
        db.refresh(db_loan)
        logger.info(f"Successfully updated loan with ID: {loan_id}")
        return db_loan
    except HTTPException:
        logger.error(f"HTTP exception occurred during loan update for ID: {loan_id}")
        raise
    except Exception as e:
        logger.error(f"Error updating loan with ID {loan_id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# Delete Loan
@router.delete("/{loan_id}", include_in_schema=False)
@router.delete("/{loan_id}/")
def delete_loan(loan_id: int, db: Session = Depends(get_db)):
    """
    Delete a loan and its associated payment sources, if they have no associated payments or repayments.
    """
    logger.info(f"Attempting to delete loan with ID: {loan_id}")
    try:
        # Check if loan exists
        loan = db.query(models.Loan).filter(models.Loan.id == loan_id).first()
        if loan is None:
            logger.warning(f"Loan not found for ID: {loan_id}")
            raise HTTPException(status_code=404, detail="Loan not found")

        # Check if loan has any repayments
        repayments = db.query(models.LoanRepayment).filter(models.LoanRepayment.loan_id == loan_id).all()
        if repayments:
            logger.warning(f"Cannot delete loan ID {loan_id}: found {len(repayments)} associated repayments")
            raise HTTPException(
                status_code=400,
                detail="Cannot delete loan that has associated repayments. Please delete all repayments first."
            )

        # Check if loan has associated payment sources
        payment_sources = (
            db.query(models.PaymentSource)
            .filter(models.PaymentSource.loan_id == loan_id)
            .all()
        )
        logger.debug(f"Found {len(payment_sources)} payment sources for loan ID: {loan_id}")

        # Delete associated payment sources first
        for payment_source in payment_sources:
            # Check if payment source has associated payments
            payments = (
                db.query(models.Payment)
                .filter(models.Payment.source_id == payment_source.id)
                .all()
            )
            if payments:
                logger.warning(f"Cannot delete loan ID {loan_id}: payment source ID {payment_source.id} has {len(payments)} associated payments")
                raise HTTPException(
                    status_code=400,
                    detail="Cannot delete loan with payment sources that have associated payments. Please delete all payments first."
                )

            logger.debug(f"Deleting payment source ID: {payment_source.id}")
            db.delete(payment_source)

        # Delete the loan
        logger.debug(f"Deleting loan ID: {loan_id}")
        db.delete(loan)
        db.commit()
        logger.info(f"Successfully deleted loan with ID: {loan_id}")
        return {"message": "Loan deleted successfully"}
    except HTTPException:
        logger.error(f"HTTP exception occurred during loan deletion for ID: {loan_id}")
        raise
    except Exception as e:
        logger.error(f"Error deleting loan with ID {loan_id}: {str(e)}")
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
    logger.info(f"Getting loans with filters: purchase_id={purchase_id}, is_active={is_active}, from_amount={from_amount}, to_amount={to_amount}")
    try:
        query = (
            db.query(
                models.Loan,
                func.coalesce(func.sum(models.Payment.amount), 0).label('total_disbursed_amount'),
                models.PaymentSource.name.label('name')
            )
            .outerjoin(models.PaymentSource, models.Loan.id == models.PaymentSource.loan_id)
            .outerjoin(models.Payment, models.PaymentSource.id == models.Payment.source_id)
            .group_by(models.Loan.id, models.PaymentSource.name)
        )

        # Apply filters if provided
        if purchase_id:
            query = query.filter(models.Loan.purchase_id == purchase_id)
            logger.debug(f"Filtering by purchase_id: {purchase_id}")
            
        if is_active is not None:
            query = query.filter(models.Loan.is_active == is_active)
            logger.debug(f"Filtering by is_active: {is_active}")
            
        if from_amount:
            query = query.filter(models.Loan.sanction_amount >= from_amount)
            logger.debug(f"Filtering by minimum amount: {from_amount}")
            
        if to_amount:
            query = query.filter(models.Loan.sanction_amount <= to_amount)
            logger.debug(f"Filtering by maximum amount: {to_amount}")

        # Execute the query
        results = query.all()
        logger.debug(f"Found {len(results)} loans matching criteria")
        
        # Convert to LoanPublic schema objects
        response = [
            {
                "id": loan.id,
                "loan_number": loan.loan_number,
                "institution": loan.institution,
                "sanction_amount": loan.sanction_amount,
                "total_disbursed_amount": total_disbursed,
                "is_active": loan.is_active,
                "name": name or f"{loan.institution} Loan"  # Fallback if no payment source
            }
            for loan, total_disbursed, name in results
        ]
        logger.debug(response)
        return response
    except HTTPException as e:
        logger.error(f"Error in get_loans: {e}") 
        raise
    except Exception as e:
        logger.error(f"Error in get_loans: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{loan_id}", response_model=schemas.Loan, include_in_schema=False)
@router.get("/{loan_id}/", response_model=schemas.Loan)
def get_loan(loan_id: int, db: Session = Depends(get_db)) -> schemas.Loan:
    """
    Get a detailed view of a single loan with property information.
    Optimized for frontend detail views.
    """
    logger.info(f"Getting detailed view of loan with ID: {loan_id}")
    try:
        # Query that joins Loan with Purchase and Property
        result = (
            db.query(
                models.Loan,
                models.Property.name.label("property_name"),
                models.PaymentSource.name.label("name")
            )
            .join(models.Purchase, models.Loan.purchase_id == models.Purchase.id)
            .join(models.Property, models.Purchase.property_id == models.Property.id)
            .outerjoin(models.PaymentSource, models.Loan.id == models.PaymentSource.loan_id)
            .filter(models.Loan.id == loan_id)
            .first()
        )
        
        if result is None:
            logger.warning(f"Loan not found for ID: {loan_id}")
            raise HTTPException(status_code=404, detail="Loan not found")
            
        loan, property_name, name = result
        logger.debug(f"Found loan with ID: {loan_id}, property: {property_name}")
        
        source = db.query(models.PaymentSource).filter(models.PaymentSource.loan_id == loan_id).first()
        payments = db.query(models.Payment).filter(models.Payment.source_id == source.id).all() if source else []
        logger.debug(f"Found {len(payments)} payments for loan ID: {loan_id}")
        
        # Convert to the expected schema format
        loan_dict = {
            "id": loan.id,
            "loan_number": loan.loan_number,
            "institution": loan.institution,
            "total_disbursed_amount": sum(payment.amount for payment in payments) if payments else 0,
            "sanction_amount": loan.sanction_amount,
            "property_name": property_name,
            "processing_fee": loan.processing_fee or 0,
            "other_charges": loan.other_charges or 0,
            "loan_sanction_charges": loan.loan_sanction_charges or 0,
            "interest_rate": loan.interest_rate,
            "tenure_months": loan.tenure_months,
            "is_active": loan.is_active,
            "name": name or f"{loan.institution} Loan"  # Fallback if no payment source
        }
        
        logger.info(f"Successfully retrieved loan details for ID: {loan_id}")
        return loan_dict
    except HTTPException:
        logger.error(f"HTTP exception occurred while getting loan ID: {loan_id}")
        raise
    except Exception as e:
        logger.error(f"Error getting loan with ID {loan_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
