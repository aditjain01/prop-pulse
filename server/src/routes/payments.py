from fastapi import APIRouter
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from src import schemas
from src.database import get_db, models
import logging

# Create a router instance
router = APIRouter(prefix="/payments", tags=["payments"])
logger = logging.getLogger(__name__)

# Create a new payment
@router.post("", response_model=schemas.PaymentOld, include_in_schema=False, description="Create a new payment")
@router.post("/", response_model=schemas.PaymentOld, description="Create a new payment")
def create_payment(
    payment: schemas.PaymentCreate, db: Session = Depends(get_db)
) -> schemas.PaymentOld:
    try:
        logger.info(f"Creating new payment for invoice_id={payment.invoice_id}, amount={payment.amount}")
        if payment.amount <= 0:
            logger.warning(f"Invalid payment amount: {payment.amount}")
            raise HTTPException(status_code=400, detail="Payment amount must be greater than 0")
        
        # Check if invoice exists
        invoice = (
            db.query(models.Invoice)
            .filter(models.Invoice.id == payment.invoice_id)
            .first()
        )
        if invoice is None:
            logger.warning(f"Invoice not found: invoice_id={payment.invoice_id}")
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        invoice_payments = (
            db.query(models.Payment)
            .filter(models.Payment.invoice_id == payment.invoice_id)
            .all()
        )
        invoice_balance = invoice.amount - sum(p.amount for p in invoice_payments)
        logger.debug(f"Invoice balance: {invoice_balance}, payment amount: {payment.amount}")
        if payment.amount > invoice_balance:
            logger.warning(f"Payment amount {payment.amount} exceeds invoice balance {invoice_balance}")
            raise HTTPException(
                status_code=400,
                detail="Payment amount exceeds invoice's balance amount",
            )

        payment_source = (
            db.query(models.PaymentSource)
            .filter(models.PaymentSource.id == payment.source_id)
            .first()
        )
        if payment_source is None:
            logger.warning(f"Payment source not found: source_id={payment.source_id}")
            raise HTTPException(status_code=404, detail="Payment source not found")

        # Check if the payment source's source_type is "loan" and update the loan's total disbursed amount
        if payment_source.source_type == "loan":
            logger.debug(f"Payment source is a loan: loan_id={payment_source.loan_id}")
            loan = (
                db.query(models.Loan)
                .filter(models.Loan.id == payment_source.loan_id)
                .first()
            )
            if not loan:
                logger.warning(f"Loan not found: loan_id={payment_source.loan_id}")
                raise HTTPException(status_code=404, detail="Loan not found")
            # TODO: Revalidate this logic and push it 
            # loan_payments = (
            #     db.query(models.Payment)
            #     .filter(models.Payment.source_id == payment_source.id)
            #     .all()
            # )
            # total_disbursed_amount = sum(p.amount for p in loan_payments)
            # if total_disbursed_amount + payment.amount > loan.sanction_amount:
            #     raise HTTPException(status_code=400, detail="This payment will exceed the loan's sanction amount")

            
        # Create payment with user_id defaulted to 1
        db_payment = models.Payment(**payment.model_dump(), user_id=1)
        db.add(db_payment)
        
        db.commit()
        db.refresh(db_payment)
        logger.info(f"Payment created successfully: payment_id={db_payment.id}")
        return db_payment
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in create_payment: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Update a payment
@router.put("/{payment_id}", response_model=schemas.PaymentOld, include_in_schema=False, description="Update a payment")
@router.put("/{payment_id}/", response_model=schemas.PaymentOld, description="Update a payment")
def update_payment(
    payment_id: int, payment: schemas.PaymentUpdate, db: Session = Depends(get_db)
) -> schemas.PaymentOld:
    try:
        logger.info(f"Updating payment: payment_id={payment_id}")
        # Check if payment exists
        db_payment = (
            db.query(models.Payment).filter(models.Payment.id == payment_id).first()
        )
        if db_payment is None:
            logger.warning(f"Payment not found: payment_id={payment_id}")
            raise HTTPException(status_code=404, detail="Payment not found")

        # # Check if user owns this payment
        # if db_payment.user_id != current_user.id:
        #     raise HTTPException(status_code=403, detail="Not authorized to update this payment")
        # Check if invoice exists
        invoice = (
            db.query(models.Invoice)
            .filter(models.Invoice.id == db_payment.invoice_id)
            .first()
        )
        if invoice is None:
            logger.warning(f"Invoice not found: invoice_id={db_payment.invoice_id}")
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Get all payments for this invoice except the current one being updated
        invoice_payments = (
            db.query(models.Payment)
            .filter(models.Payment.invoice_id == db_payment.invoice_id)
            .filter(models.Payment.id != payment_id)
            .all()
        )
        
        # Check if the updated payment amount would exceed the invoice balance
        invoice_balance = invoice.amount - sum(p.amount for p in invoice_payments)
        logger.debug(f"Invoice balance (excluding current payment): {invoice_balance}")
        if payment.amount and payment.amount > invoice_balance:
            logger.warning(f"Updated payment amount {payment.amount} exceeds invoice balance {invoice_balance}")
            raise HTTPException(
                status_code=400,
                detail="Payment amount exceeds invoice's balance amount",
            )
        
        if payment.amount and payment.amount <= 0:
            logger.warning(f"Invalid payment amount: {payment.amount}")
            raise HTTPException(status_code=400, detail="Payment amount must be greater than 0")

        # If payment source is being updated, check if it exists
        if payment.source_id:
            logger.debug(f"Updating payment source to: source_id={payment.source_id}")
            payment_source = (
                db.query(models.PaymentSource)
                .filter(models.PaymentSource.id == payment.source_id)
                .first()
            )
            if payment_source is None:
                logger.warning(f"Payment source not found: source_id={payment.source_id}")
                raise HTTPException(status_code=404, detail="Payment source not found")
            
            # Check if the payment source's source_type is "loan" and validate against loan's disbursed amount
            if payment_source.source_type == "loan":
                logger.debug(f"New payment source is a loan: loan_id={payment_source.loan_id}")
                loan = (
                    db.query(models.Loan)
                    .filter(models.Loan.id == payment_source.loan_id)
                    .first()
                )
                if loan:
                    loan_payments = (
                        db.query(models.Payment)
                        .filter(models.Payment.source_id == payment_source.id)
                        .filter(models.Payment.id != payment_id)
                        .all()
                    )
                    loan_balance = loan.total_disbursed_amount - sum(p.amount for p in loan_payments)
                    logger.debug(f"Loan balance: {loan_balance}, payment amount: {payment.amount}")
                    if payment.amount and payment.amount > loan_balance:
                        logger.warning(f"Payment amount {payment.amount} exceeds loan balance {loan_balance}")
                        raise HTTPException(
                            status_code=400, 
                            detail="Payment amount exceeds loan's disbursed amount"
                        )
                else:
                    logger.warning(f"Loan not found: loan_id={payment_source.loan_id}")
                    raise HTTPException(status_code=404, detail="Loan not found")

        # Update payment fields
        update_data = payment.dict(exclude_unset=True)
        logger.debug(f"Updating payment with data: {update_data}")
        for key, value in update_data.items():
            setattr(db_payment, key, value)

        db.commit()
        db.refresh(db_payment)
        logger.info(f"Payment updated successfully: payment_id={db_payment.id}")
        return db_payment
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in update_payment: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# Delete Payment
@router.delete("/{payment_id}", include_in_schema=False, description="Delete a payment")
@router.delete("/{payment_id}/", description="Delete a payment")
def delete_payment(payment_id: int, db: Session = Depends(get_db)):
    try:
        logger.info(f"Deleting payment: payment_id={payment_id}")
        # Check if payment exists
        payment = (
            db.query(models.Payment).filter(models.Payment.id == payment_id).first()
        )
        if payment is None:
            logger.warning(f"Payment not found: payment_id={payment_id}")
            raise HTTPException(status_code=404, detail="Payment not found")

        # Delete the payment
        db.delete(payment)
        db.commit()
        logger.info(f"Payment deleted successfully: payment_id={payment_id}")
        return {"message": "Payment deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_payment: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=List[schemas.PaymentPublic], include_in_schema=False, description="Get a list of payments with property and invoice information")
@router.get("/", response_model=List[schemas.PaymentPublic], description="Get a list of payments with property and invoice information")
def get_payments(
    purchase_id: Optional[int] = None,
    invoice_id: Optional[int] = None,
    source_id: Optional[int] = None,
    payment_mode: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    db: Session = Depends(get_db),
) -> List[schemas.PaymentPublic]:
    """
    Get a list of payments with property and invoice information.
    Optimized for frontend listing views with enhanced filtering.
    """
    try:
        logger.info("Fetching payments with filters")
        logger.debug(f"Filters: purchase_id={purchase_id}, invoice_id={invoice_id}, source_id={source_id}, "
                    f"payment_mode={payment_mode}, from_date={from_date}, to_date={to_date}, "
                    f"min_amount={min_amount}, max_amount={max_amount}")
        
        # Start with a query that joins Payment with Invoice, Purchase, Property, and PaymentSource
        query = (
            db.query(
                models.Payment,
                models.Property.name.label("property_name"),
                models.Invoice.invoice_number.label("invoice_number"),
                models.PaymentSource.name.label("source_name")
            )
            .join(models.Invoice, models.Payment.invoice_id == models.Invoice.id)
            .join(models.Purchase, models.Invoice.purchase_id == models.Purchase.id)
            .join(models.Property, models.Purchase.property_id == models.Property.id)
            .join(models.PaymentSource, models.Payment.source_id == models.PaymentSource.id)
        )

        # Apply filters if provided
        if purchase_id:
            query = query.filter(models.Purchase.id == purchase_id)
            
        if invoice_id:
            query = query.filter(models.Payment.invoice_id == invoice_id)
            
        if source_id:
            query = query.filter(models.Payment.source_id == source_id)
            
        if payment_mode:
            query = query.filter(models.Payment.payment_mode == payment_mode)
            
        if from_date:
            query = query.filter(models.Payment.payment_date >= from_date)
            
        if to_date:
            query = query.filter(models.Payment.payment_date <= to_date)
            
        if min_amount:
            query = query.filter(models.Payment.amount >= min_amount)
            
        if max_amount:
            query = query.filter(models.Payment.amount <= max_amount)

        # Order by payment date (newest first)
        query = query.order_by(models.Payment.payment_date.desc())

        results = query.all()
        logger.info(f"Found {len(results)} payments matching the criteria")
        
        # Convert the results to the expected schema format
        payments = []
        for payment, property_name, invoice_number, source_name in results:
            payment_dict = {
                "id": payment.id,
                "payment_date": payment.payment_date,
                "amount": payment.amount,
                "source_name": source_name,
                "payment_mode": payment.payment_mode,
                "property_name": property_name,
                "invoice_number": invoice_number,
            }
            payments.append(payment_dict)
            
        return payments
    except Exception as e:
        logger.error(f"Error in get_payments: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{payment_id}", response_model=schemas.Payment, include_in_schema=False, description="Get a detailed view of a single payment with property and invoice information")
@router.get("/{payment_id}", response_model=schemas.Payment, description="Get a detailed view of a single payment with property and invoice information")
def get_payment(payment_id: int, db: Session = Depends(get_db)) -> schemas.Payment:
    """
    Get a detailed view of a single payment with property and invoice information.
    Optimized for frontend detail views.
    """
    try:
        logger.info(f"Fetching payment details: payment_id={payment_id}")
        # Query with joins to Invoice, Purchase, Property, and PaymentSource
        result = (
            db.query(
                models.Payment,
                models.Property.name.label("property_name"),
                models.Invoice.invoice_number.label("invoice_number"),
                models.PaymentSource.name.label("source_name")
            )
            .join(models.Invoice, models.Payment.invoice_id == models.Invoice.id)
            .join(models.Purchase, models.Invoice.purchase_id == models.Purchase.id)
            .join(models.Property, models.Purchase.property_id == models.Property.id)
            .join(models.PaymentSource, models.Payment.source_id == models.PaymentSource.id)
            .filter(models.Payment.id == payment_id)
            .first()
        )
        
        if result is None:
            logger.warning(f"Payment not found: payment_id={payment_id}")
            raise HTTPException(status_code=404, detail="Payment not found")
            
        payment, property_name, invoice_number, source_name = result
        logger.debug(f"Found payment: id={payment.id}, invoice={invoice_number}, property={property_name}")
        
        # Convert to the expected schema format
        payment_dict = {
            "id": payment.id,
            "payment_date": payment.payment_date,
            "amount": payment.amount,
            "source_name": source_name,
            "payment_mode": payment.payment_mode,
            "property_name": property_name,
            "invoice_number": invoice_number,
            "transaction_reference": payment.transaction_reference,
            "receipt_date": payment.receipt_date,
            "receipt_number": payment.receipt_number,
            "notes": payment.notes,
        }
            
        return payment_dict
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_payment: {e}")
        raise HTTPException(status_code=500, detail=str(e))
