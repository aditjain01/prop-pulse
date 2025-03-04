from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from server import models, schemas
from server.database import engine, get_db
from server.init_construction_status import init_construction_status
from fastapi import Query
from sqlalchemy import func

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Initialize construction status table
init_construction_status()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# User routes
@app.post("/api/users", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)) -> schemas.User:
    try:
        # Check if user already exists
        db_user = db.query(models.User).filter(models.User.username == user.username).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Username already exists")

        # Create new user
        db_user = models.User(**user.dict())
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/users/{user_id}", response_model=schemas.User)
def get_user(user_id: int, db: Session = Depends(get_db)) -> schemas.User:
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


# Property routes
@app.post("/api/properties", response_model=schemas.Property)
def create_property(property: schemas.PropertyCreate, db: Session = Depends(get_db)) -> schemas.Property:
    try:
        db_property = models.Property(**property.dict())
        db.add(db_property)
        db.commit()
        db.refresh(db_property)
        return db_property
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/properties/{property_id}", response_model=schemas.Property)
def update_property(property_id: int, property_update: schemas.PropertyCreate, db: Session = Depends(get_db)) -> schemas.Property:
    try:
        # Get the existing property
        db_property = db.query(models.Property).filter(models.Property.id == property_id).first()
        if not db_property:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Update property attributes
        property_data = property_update.dict(exclude_unset=True)
        for key, value in property_data.items():
            setattr(db_property, key, value)
        
        # Save changes
        db.commit()
        db.refresh(db_property)
        return db_property
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/properties", response_model=List[schemas.Property])
def get_properties(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)) -> List[schemas.Property]:
    try:
        properties = db.query(models.Property).offset(skip).limit(limit).all()
        return properties
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/properties/{property_id}", response_model=schemas.Property)
def get_property(property_id: int, db: Session = Depends(get_db)) -> schemas.Property:
    try:
        db_property = db.query(models.Property).filter(models.Property.id == property_id).first()
        if db_property is None:
            raise HTTPException(status_code=404, detail="Property not found")
        return db_property
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/properties/{property_id}", response_model=schemas.Property)
def update_property(property_id: int, property_update: schemas.PropertyCreate, db: Session = Depends(get_db)) -> schemas.Property:
    try:
        # Get the existing property
        db_property = db.query(models.Property).filter(models.Property.id == property_id).first()
        if not db_property:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Update property attributes
        property_data = property_update.dict(exclude_unset=True)
        for key, value in property_data.items():
            setattr(db_property, key, value)
        
        # Save changes
        db.commit()
        db.refresh(db_property)
        return db_property
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/properties/{property_id}")
def delete_property(property_id: int, db: Session = Depends(get_db)):
    try:
        # Check if property exists
        property = db.query(models.Property).filter(models.Property.id == property_id).first()
        if property is None:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Check if property has associated purchases
        purchases = db.query(models.Purchase).filter(models.Purchase.property_id == property_id).all()
        if purchases:
            raise HTTPException(status_code=400, detail="Cannot delete property with associated purchases")
        
        # Delete the property
        db.delete(property)
        db.commit()
        return {"message": "Property deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# Purchase routes
@app.post("/api/purchases/", response_model=schemas.Purchase)
def create_purchase(purchase: schemas.PurchaseCreate, db: Session = Depends(get_db)) -> schemas.Purchase:
    try:
        print(purchase.dict())
        db_property = models.Purchase(**purchase.dict())
        db.add(db_property)
        db.commit()
        db.refresh(db_property)
        return db_property
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
@app.get("/api/purchases/", response_model=List[schemas.Purchase])
def get_purchases(property_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)) -> List[schemas.Purchase]:
    try:
        query = db.query(models.Purchase)
        
        # Filter by property_id if provided
        if property_id:
            query = query.filter(models.Purchase.property_id == property_id)
            
        purchases = query.offset(skip).limit(limit).all()
        return purchases
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/purchases/{purchase_id}", response_model=schemas.Purchase)
def get_purchase(purchase_id: int, db: Session = Depends(get_db)) -> schemas.Purchase:
    try:
        db_purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
        if db_purchase is None:
            raise HTTPException(status_code=404, detail="Purchase not found")
        return db_purchase
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/purchases/{purchase_id}", response_model=schemas.Purchase)
def update_purchase(purchase_id: int, purchase_update: schemas.PurchaseCreate, db: Session = Depends(get_db)) -> schemas.Purchase:
    try:
        # Get the existing property
        db_property = db.query(models.Property).filter(models.Property.id == purchase_id).first()
        if not db_property:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Update property attributes
        property_data = purchase_update.dict(exclude_unset=True)
        for key, value in property_data.items():
            setattr(db_property, key, value)
        
        # Save changes
        db.commit()
        db.refresh(db_property)
        return db_property
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/properties/{property_id}")
def delete_property(property_id: int, db: Session = Depends(get_db)):
    try:
        # Check if property exists
        property = db.query(models.Property).filter(models.Property.id == property_id).first()
        if property is None:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Check if property has associated purchases
        purchases = db.query(models.Purchase).filter(models.Purchase.property_id == property_id).all()
        if purchases:
            raise HTTPException(status_code=400, detail="Cannot delete property with associated purchases")
        
        # Delete the property
        db.delete(property)
        db.commit()
        return {"message": "Property deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# Construction Status routes
@app.get("/api/construction-status", response_model=List[schemas.ConstructionStatus])
def get_construction_statuses(db: Session = Depends(get_db)) -> List[schemas.ConstructionStatus]:
    try:
        statuses = db.query(models.ConstructionStatus).all()
        return statuses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/construction-status/{status_id}", response_model=schemas.ConstructionStatus)
def get_construction_status(status_id: int, db: Session = Depends(get_db)) -> schemas.ConstructionStatus:
    try:
        status = db.query(models.ConstructionStatus).filter(models.ConstructionStatus.id == status_id).first()
        if status is None:
            raise HTTPException(status_code=404, detail="Construction status not found")
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Payment Source routes
@app.post("/api/payment-sources", response_model=schemas.PaymentSource)
def create_payment_source(payment_source: schemas.PaymentSourceCreate, db: Session = Depends(get_db)) -> schemas.PaymentSource:
    try:
        db_payment_source = models.PaymentSource(**payment_source.dict(), user_id=1)  # Replace with actual user ID
        db.add(db_payment_source)
        db.commit()
        db.refresh(db_payment_source)
        return db_payment_source
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/payment-sources", response_model=List[schemas.PaymentSource])
def get_payment_sources(db: Session = Depends(get_db)) -> List[schemas.PaymentSource]:
    try:
        payment_sources = db.query(models.PaymentSource).filter(models.PaymentSource.user_id == 1).all()  # Replace with actual user ID
        return payment_sources
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/payment-sources/{source_id}", response_model=schemas.PaymentSource)
def get_payment_source(source_id: int, db: Session = Depends(get_db)) -> schemas.PaymentSource:
    try:
        payment_source = db.query(models.PaymentSource).filter(models.PaymentSource.id == source_id).first()
        if payment_source is None:
            raise HTTPException(status_code=404, detail="Payment source not found")
        return payment_source
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/payment-sources/{source_id}", response_model=schemas.PaymentSource)
def update_payment_source(source_id: int, payment_source: schemas.PaymentSourceUpdate, db: Session = Depends(get_db)) -> schemas.PaymentSource:
    try:
        db_payment_source = db.query(models.PaymentSource).filter(models.PaymentSource.id == source_id).first()
        if db_payment_source is None:
            raise HTTPException(status_code=404, detail="Payment source not found")
        
        # Update payment source fields
        for key, value in payment_source.dict(exclude_unset=True).items():
            setattr(db_payment_source, key, value)
        
        db.commit()
        db.refresh(db_payment_source)
        return db_payment_source
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/payment-sources/{payment_source_id}")
def delete_payment_source(payment_source_id: int, db: Session = Depends(get_db)):
    try:
        # Check if payment source exists
        payment_source = db.query(models.PaymentSource).filter(models.PaymentSource.id == payment_source_id).first()
        if payment_source is None:
            raise HTTPException(status_code=404, detail="Payment source not found")
        
        # Check if payment source is used in payments
        payments = db.query(models.Payment).filter(models.Payment.source_id == payment_source_id).all()
        if payments:
            raise HTTPException(
                status_code=400, 
                detail="Cannot delete payment source that is used in payments"
            )
        
        # Delete the payment source
        db.delete(payment_source)
        db.commit()
        return {"message": "Payment source deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# Loan routes
@app.post("/api/loans", response_model=schemas.Loan)
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
@app.get("/api/loans", response_model=List[schemas.Loan])
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

@app.get("/api/loans/{loan_id}", response_model=schemas.Loan)
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

@app.put("/api/loans/{loan_id}", response_model=schemas.Loan)
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
@app.delete("/api/loans/{loan_id}")
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


# Create a new payment
@app.post("/api/payments", response_model=schemas.Payment)
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
@app.get("/api/payments", response_model=List[schemas.Payment])
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
@app.get("/api/payments/{payment_id}", response_model=schemas.Payment)
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
@app.put("/api/payments/{payment_id}", response_model=schemas.Payment)
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
@app.delete("/api/payments/{payment_id}")
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


# Updated Loan Repayment endpoints with new route structure
@app.post("/api/repayments", response_model=schemas.LoanRepayment)
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

@app.get("/api/repayments", response_model=List[schemas.LoanRepayment])
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

@app.get("/api/repayments/{repayment_id}", response_model=schemas.LoanRepayment)
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

@app.put("/api/repayments/{repayment_id}", response_model=schemas.LoanRepayment)
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

@app.delete("/api/repayments/{repayment_id}")
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

@app.get("/api/acquisition-cost/summary", response_model=List[schemas.AcquisitionCostSummary])
def get_acquisition_cost_summary(
    user_id: Optional[int] = None,
    purchase_id: Optional[int] = None,
    db: Session = Depends(get_db)
) -> List[schemas.AcquisitionCostSummary]:
    try:
        query = db.query(models.AcquisitionCostSummary)
        
        # Apply filters if provided
        if user_id:
            query = query.filter(models.AcquisitionCostSummary.user_id == user_id)
            
        if purchase_id:
            query = query.filter(models.AcquisitionCostSummary.purchase_id == purchase_id)
        
        results = query.all()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/acquisition-cost/details", response_model=List[schemas.AcquisitionCostDetails])
def get_acquisition_cost_details(
    user_id: Optional[int] = None,
    purchase_id: Optional[int] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db)
) -> List[schemas.AcquisitionCostDetails]:
    try:
        query = db.query(models.AcquisitionCostDetails)
        
        # Apply filters if provided
        if user_id:
            query = query.filter(models.AcquisitionCostDetails.user_id == user_id)
            
        if purchase_id:
            query = query.filter(models.AcquisitionCostDetails.purchase_id == purchase_id)
            
        if from_date:
            query = query.filter(models.AcquisitionCostDetails.payment_date >= from_date)
            
        if to_date:
            query = query.filter(models.AcquisitionCostDetails.payment_date <= to_date)
            
        if type:
            query = query.filter(models.AcquisitionCostDetails.type == type)
        
        # Order by payment date (newest first)
        query = query.order_by(models.AcquisitionCostDetails.payment_date.desc())
        
        results = query.all()
        # print(results, type(results))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/loan-repayment-details/summary", response_model=List[schemas.LoanRepaymentSummary])
def get_loan_repayment_summary(
    user_id: int,
    loan_name: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db)
) -> List[schemas.LoanRepaymentSummary]:
    try:
        # Use the loan_repayment_details view directly
        query = db.query(
            models.LoanRepaymentDetails.loan_name,
            func.sum(models.LoanRepaymentDetails.principal_amount).label("total_principal_paid"),
            func.sum(models.LoanRepaymentDetails.interest_amount).label("total_interest_paid"),
            func.sum(models.LoanRepaymentDetails.other_fees).label("total_other_fees_paid"),
            func.sum(models.LoanRepaymentDetails.amount).label("total_paid"),
            func.min(models.LoanRepaymentDetails.principal_balance).label("remaining_principal_balance")
        ).filter(models.LoanRepaymentDetails.user_id == user_id)

        # Apply filters if provided
        if loan_name:
            query = query.filter(models.LoanRepaymentDetails.loan_name == loan_name)
            
        if from_date:
            query = query.filter(models.LoanRepaymentDetails.payment_date >= from_date)
        if to_date:
            query = query.filter(models.LoanRepaymentDetails.payment_date <= to_date)

        # Group by loan name
        query = query.group_by(models.LoanRepaymentDetails.loan_name)

        results = query.all()
        print(results)
        
        # Convert results to dictionaries
        formatted_results = []
        for result in results:
            formatted_results.append({
                "loan_name": result.loan_name,
                "total_principal_paid": result.total_principal_paid,
                "total_interest_paid": result.total_interest_paid,
                "total_other_fees_paid": result.total_other_fees_paid,
                "total_paid": result.total_paid,
                "remaining_principal_balance": result.remaining_principal_balance
            })
            
        return formatted_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/loans/summary/", response_model=List[schemas.LoanSummary])
def get_loan_summary(
    user_id: Optional[int] = None,
    loan_id: Optional[int] = None,
    db: Session = Depends(get_db)
) -> List[schemas.LoanSummary]:
    try:
        print(user_id, loan_id)
        query = db.query(models.LoanRepaymentSummary)
        
        # Apply filters if provided
        if user_id:
            query = query.filter(models.LoanRepaymentSummary.user_id == user_id)
            
        if loan_id is not None:  # Ensure loan_id is checked for None
            query = query.filter(models.LoanRepaymentSummary.loan_id == loan_id)
        
        # Get loan details to enrich the summary
        results = query.all()
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/loans/summary/enhanced", response_model=List[Dict])
def get_enhanced_loan_summary(
    user_id: Optional[int] = None,
    loan_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    try:
        # Join the loan_repayment_summary view with the loans table to get more details
        query = db.query(
            models.LoanRepaymentSummary.loan_id,
            models.LoanRepaymentSummary.user_id,
            models.LoanRepaymentSummary.total_principal_paid,
            models.LoanRepaymentSummary.total_interest_paid,
            models.LoanRepaymentSummary.total_other_fees,
            models.LoanRepaymentSummary.total_penalties,
            models.LoanRepaymentSummary.total_amount_paid,
            models.LoanRepaymentSummary.total_payments,
            models.LoanRepaymentSummary.last_repayment_date,
            models.LoanRepaymentSummary.principal_balance,
            models.Loan.name.label("loan_name"),
            models.Loan.institution,
            models.Loan.sanction_amount,
            models.Loan.total_disbursed_amount,
            models.Loan.interest_rate,
            models.Loan.tenure_months,
            models.Loan.is_active,
            models.Loan.purchase_id
        ).join(
            models.Loan,
            models.LoanRepaymentSummary.loan_id == models.Loan.id
        )
        
        # Apply filters if provided
        if user_id:
            query = query.filter(models.LoanRepaymentSummary.user_id == user_id)
            
        if loan_id:
            query = query.filter(models.LoanRepaymentSummary.loan_id == loan_id)
        
        results = query.all()
        
        # Convert results to dictionaries
        formatted_results = []
        for result in results:
            formatted_results.append({
                "loan_id": result.loan_id,
                "user_id": result.user_id,
                "loan_name": result.loan_name,
                "institution": result.institution,
                "purchase_id": result.purchase_id,
                "sanction_amount": result.sanction_amount,
                "total_disbursed_amount": result.total_disbursed_amount,
                "interest_rate": result.interest_rate,
                "tenure_months": result.tenure_months,
                "is_active": result.is_active,
                "total_principal_paid": result.total_principal_paid,
                "total_interest_paid": result.total_interest_paid,
                "total_other_fees": result.total_other_fees,
                "total_penalties": result.total_penalties,
                "total_amount_paid": result.total_amount_paid,
                "total_payments": result.total_payments,
                "last_repayment_date": result.last_repayment_date,
                "principal_balance": result.principal_balance,
                "completion_percentage": round(float(result.total_principal_paid / result.total_disbursed_amount * 100), 2) if result.total_disbursed_amount else 0
            })
            
        return formatted_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)