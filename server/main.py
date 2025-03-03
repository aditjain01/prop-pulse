from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from server import models, schemas
from server.database import engine, get_db
from server.init_construction_status import init_construction_status
from fastapi import Query

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
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
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
def get_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

# Property routes
@app.post("/api/properties", response_model=schemas.Property)
def create_property(property: schemas.PropertyCreate, db: Session = Depends(get_db)):
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
def update_property(property_id: int, property_update: schemas.PropertyCreate, db: Session = Depends(get_db)):
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
def get_properties(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        properties = db.query(models.Property).offset(skip).limit(limit).all()
        return properties
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/properties/{property_id}", response_model=schemas.Property)
def get_property(property_id: int, db: Session = Depends(get_db)):
    try:
        db_property = db.query(models.Property).filter(models.Property.id == property_id).first()
        if db_property is None:
            raise HTTPException(status_code=404, detail="Property not found")
        return db_property
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Purchase routes
@app.post("/api/purchases", response_model=schemas.Purchase)
def create_purchase(purchase: schemas.PurchaseCreate, db: Session = Depends(get_db)):
    try:
        db_property = models.Property(**purchase.dict())
        db.add(db_property)
        db.commit()
        db.refresh(db_property)
        return db_property
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/properties/{property_id}", response_model=schemas.Property)
def update_property(property_id: int, property_update: schemas.PropertyCreate, db: Session = Depends(get_db)):
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

@app.get("/api/purchases", response_model=List[schemas.Purchase])
def get_purchases(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        purchases = db.query(models.Purchase).offset(skip).limit(limit).all()
        return purchases
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/purchases/property/{property_id}", response_model=List[schemas.Purchase])
def get_purchases_for_property(property_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        purchases = db.query(models.Purchase).filter(models.Purchase.property_id == property_id).offset(skip).limit(limit).all()
        return purchases
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/purchases/{purchase_id}", response_model=schemas.Purchase)
def get_purchase(purchase_id: int, db: Session = Depends(get_db)):
    try:
        db_purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
        if db_purchase is None:
            raise HTTPException(status_code=404, detail="Purchase not found")
        return db_purchase
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get loans by purchase ID
@app.get("/api/purchases/{purchase_id}/loans", response_model=List[schemas.Loan])
def get_loans_by_purchase(purchase_id: int, db: Session = Depends(get_db)):
    try:
        # Check if purchase exists
        purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
        if purchase is None:
            raise HTTPException(status_code=404, detail="Purchase not found")
        
        # Get loans for this purchase
        loans = db.query(models.Loan).filter(models.Loan.purchase_id == purchase_id).all()
        return loans
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Construction Status routes
@app.get("/api/construction-status", response_model=List[schemas.ConstructionStatus])
def get_construction_statuses(db: Session = Depends(get_db)):
    try:
        statuses = db.query(models.ConstructionStatus).all()
        return statuses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/construction-status/{status_id}", response_model=schemas.ConstructionStatus)
def get_construction_status(status_id: int, db: Session = Depends(get_db)):
    try:
        status = db.query(models.ConstructionStatus).filter(models.ConstructionStatus.id == status_id).first()
        if status is None:
            raise HTTPException(status_code=404, detail="Construction status not found")
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Payment Source routes
@app.post("/api/payment-sources", response_model=schemas.PaymentSource)
def create_payment_source(payment_source: schemas.PaymentSourceCreate, db: Session = Depends(get_db)):
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
def get_payment_sources(db: Session = Depends(get_db)):
    try:
        payment_sources = db.query(models.PaymentSource).filter(models.PaymentSource.user_id == 1).all()  # Replace with actual user ID
        return payment_sources
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/payment-sources/{source_id}", response_model=schemas.PaymentSource)
def get_payment_source(source_id: int, db: Session = Depends(get_db)):
    try:
        payment_source = db.query(models.PaymentSource).filter(models.PaymentSource.id == source_id).first()
        if payment_source is None:
            raise HTTPException(status_code=404, detail="Payment source not found")
        return payment_source
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Loan routes
@app.post("/api/loans", response_model=schemas.Loan)
def create_loan(loan: schemas.LoanCreate, db: Session = Depends(get_db)):
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

@app.get("/api/loans", response_model=List[schemas.Loan])
def get_loans(db: Session = Depends(get_db)):
    try:
        loans = db.query(models.Loan).filter(models.Loan.user_id == 1).all()  # Replace with actual user ID
        return loans
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/loans/{loan_id}", response_model=schemas.Loan)
def get_loan(loan_id: int, db: Session = Depends(get_db)):
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
def update_loan(loan_id: int, loan_update: schemas.LoanCreate, db: Session = Depends(get_db)):
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

# Delete endpoints for all resources

# Delete Property
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

# Delete Purchase
@app.delete("/api/purchases/{purchase_id}")
def delete_purchase(purchase_id: int, db: Session = Depends(get_db)):
    try:
        # Check if purchase exists
        purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
        if purchase is None:
            raise HTTPException(status_code=404, detail="Purchase not found")
        
        # Check if purchase has associated payments
        payments = db.query(models.Payment).filter(models.Payment.purchase_id == purchase_id).all()
        if payments:
            raise HTTPException(status_code=400, detail="Cannot delete purchase with associated payments")
        
        # Check if purchase has associated loans
        loans = db.query(models.Loan).filter(models.Loan.purchase_id == purchase_id).all()
        if loans:
            raise HTTPException(status_code=400, detail="Cannot delete purchase with associated loans")
        
        # Delete the purchase
        db.delete(purchase)
        db.commit()
        return {"message": "Purchase deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
# Get loans by purchase ID
@app.get("/api/purchases/{purchase_id}/loans", response_model=List[schemas.Loan])
def get_loans_by_purchase(purchase_id: int, db: Session = Depends(get_db)):
    try:
        # Check if purchase exists
        purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
        if purchase is None:
            raise HTTPException(status_code=404, detail="Purchase not found")
        
        # Get loans for this purchase
        loans = db.query(models.Loan).filter(models.Loan.purchase_id == purchase_id).all()
        return loans
    except HTTPException:
        raise
    except Exception as e:
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

# Delete Payment Source
@app.delete("/api/payment-sources/{payment_source_id}")
def delete_payment_source(payment_source_id: int, db: Session = Depends(get_db)):
    try:
        # Check if payment source exists
        payment_source = db.query(models.PaymentSource).filter(models.PaymentSource.id == payment_source_id).first()
        if payment_source is None:
            raise HTTPException(status_code=404, detail="Payment source not found")
        
        # Check if payment source has associated payments
        payments = db.query(models.Payment).filter(models.Payment.payment_source_id == payment_source_id).all()
        if payments:
            raise HTTPException(status_code=400, detail="Cannot delete payment source with associated payments")
        
        # Delete the payment source
        db.delete(payment_source)
        db.commit()
        return {"message": "Payment source deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

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
):
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
def get_payment(payment_id: int, db: Session = Depends(get_db)):
    try:
        payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
        if payment is None:
            raise HTTPException(status_code=404, detail="Payment not found")
        return payment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Create a new payment
@app.post("/api/payments", response_model=schemas.Payment)
def create_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    try:
        # Validate purchase exists
        purchase = db.query(models.Purchase).filter(models.Purchase.id == payment.purchase_id).first()
        if purchase is None:
            raise HTTPException(status_code=404, detail="Purchase not found")
        
        # Validate payment source exists
        payment_source = db.query(models.PaymentSource).filter(models.PaymentSource.id == payment.payment_source_id).first()
        if payment_source is None:
            raise HTTPException(status_code=404, detail="Payment source not found")
        
        # Create payment
        db_payment = models.Payment(**payment.dict())
        db.add(db_payment)
        db.commit()
        db.refresh(db_payment)
        return db_payment
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Update a payment
@app.put("/api/payments/{payment_id}", response_model=schemas.Payment)
def update_payment(payment_id: int, payment: schemas.PaymentUpdate, db: Session = Depends(get_db)):
    try:
        # Check if payment exists
        db_payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
        if db_payment is None:
            raise HTTPException(status_code=404, detail="Payment not found")
        
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)