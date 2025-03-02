from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, date
from decimal import Decimal
from passlib.context import CryptContext
import os
import shutil
from pathlib import Path

from server import models, schemas
from server.database import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Security setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper functions for authentication
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# Auth routes
@app.post("/api/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_password = get_password_hash(user.password)
    db_user = models.User(username=user.username, password=hashed_password, email=user.email)

    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/login", response_model=schemas.Token)
def login(credentials: schemas.UserCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == credentials.username).first()
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    return {"user": user}


# Construction Status routes
@app.get("/api/construction-statuses", response_model=List[schemas.ConstructionStatus])
def get_construction_statuses( db: Session = Depends(get_db)):
    statuses = db.query(models.ConstructionStatus).all()
    return statuses

@app.get("/api/construction-statuses/{status_id}", response_model=schemas.ConstructionStatus)
def get_construction_status(status_id: int, db: Session = Depends(get_db)):
    status = db.query(models.ConstructionStatus).filter(models.ConstructionStatus.id == status_id).first()
    if status is None:
        raise HTTPException(status_code=404, detail="Construction status not found")
    return status

# Payment Sources routes
@app.post("/api/payment-sources", response_model=schemas.PaymentSource)
def create_payment_source(payment_source: schemas.PaymentSourceCreate, db: Session = Depends(get_db)):
    try:
        db_payment_source = models.PaymentSource(**payment_source.dict())
        db.add(db_payment_source)
        db.commit()
        db.refresh(db_payment_source)
        return db_payment_source
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/payment-sources", response_model=List[schemas.PaymentSource])
def get_payment_sources(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    payment_sources = db.query(models.PaymentSource).offset(skip).limit(limit).all()
    return payment_sources

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

@app.get("/api/properties", response_model=List[schemas.Property])
def get_properties(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    properties = db.query(models.Property).offset(skip).limit(limit).all()
    return properties

@app.get("/api/properties/{property_id}", response_model=schemas.Property)
def get_property(property_id: int, db: Session = Depends(get_db)):
    db_property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return db_property

# Purchase routes
@app.post("/api/purchases", response_model=schemas.Purchase)
def create_purchase(purchase: schemas.PurchaseCreate, db: Session = Depends(get_db)):
    try:
        # Verify property exists
        property = db.query(models.Property).filter(models.Property.id == purchase.property_id).first()
        if not property:
            raise HTTPException(status_code=404, detail="Property not found")

        db_purchase = models.Purchase(**purchase.dict())
        db.add(db_purchase)
        db.commit()
        db.refresh(db_purchase)
        return db_purchase
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/purchases/{purchase_id}", response_model=schemas.Purchase)
def get_purchase(purchase_id: int, db: Session = Depends(get_db)):
    purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
    if purchase is None:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return purchase

# Loan routes
@app.post("/api/loans", response_model=schemas.Loan)
def create_loan(loan: schemas.LoanCreate, db: Session = Depends(get_db)):
    try:
        # Verify purchase exists
        purchase = db.query(models.Purchase).filter(models.Purchase.id == loan.purchase_id).first()
        if not purchase:
            raise HTTPException(status_code=404, detail="Purchase not found")

        db_loan = models.Loan(**loan.dict())
        db.add(db_loan)
        db.commit()
        db.refresh(db_loan)
        return db_loan
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/loans/{loan_id}", response_model=schemas.Loan)
def get_loan(loan_id: int, db: Session = Depends(get_db)):
    loan = db.query(models.Loan).filter(models.Loan.id == loan_id).first()
    if loan is None:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan

# Payment routes
@app.post("/api/payments", response_model=schemas.Payment)
def create_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    try:
        # Verify purchase and payment source exist
        purchase = db.query(models.Purchase).filter(models.Purchase.id == payment.purchase_id).first()
        if not purchase:
            raise HTTPException(status_code=404, detail="Purchase not found")

        payment_source = db.query(models.PaymentSource).filter(models.PaymentSource.id == payment.payment_source_id).first()
        if not payment_source:
            raise HTTPException(status_code=404, detail="Payment source not found")

        db_payment = models.Payment(**payment.dict())
        db.add(db_payment)
        db.commit()
        db.refresh(db_payment)
        return db_payment
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# Loan Payment routes
@app.post("/api/loan-payments", response_model=schemas.LoanPayment)
def create_loan_payment(loan_payment: schemas.LoanPaymentCreate, db: Session = Depends(get_db)):
    try:
        # Verify loan and payment source exist
        loan = db.query(models.Loan).filter(models.Loan.id == loan_payment.loan_id).first()
        if not loan:
            raise HTTPException(status_code=404, detail="Loan not found")

        payment_source = db.query(models.PaymentSource).filter(models.PaymentSource.id == loan_payment.payment_source_id).first()
        if not payment_source:
            raise HTTPException(status_code=404, detail="Payment source not found")

        db_loan_payment = models.LoanPayment(**loan_payment.dict())
        db.add(db_loan_payment)
        db.commit()
        db.refresh(db_loan_payment)
        return db_loan_payment
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/loan-payments/{loan_id}", response_model=List[schemas.LoanPayment])
def get_loan_payments(loan_id: int, db: Session = Depends(get_db)):
    loan_payments = db.query(models.LoanPayment).filter(models.LoanPayment.loan_id == loan_id).all()
    return loan_payments

# Property routes
@app.get("/api/properties", response_model=List[schemas.Property])
def get_properties( db: Session = Depends(get_db)):
    properties = db.query(models.Property).all()
    return properties

@app.get("/api/properties/{property_id}", response_model=schemas.Property)
def get_property(property_id: int, db: Session = Depends(get_db)):
    property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return property

@app.post("/api/properties", response_model=schemas.Property)
def create_property(property: schemas.PropertyCreate, db: Session = Depends(get_db)):
    property_data = property.model_dump()
    
    # Calculate super_area if carpet_area, exclusive_area, and common_area are provided
    carpet_area = property_data.get('carpet_area') or 0
    exclusive_area = property_data.get('exclusive_area') or 0
    common_area = property_data.get('common_area') or 0
    
    property_data['super_area'] = carpet_area + exclusive_area + common_area
    
    db_property = models.Property(**property_data)
    try:
        db.add(db_property)
        db.commit()
        db.refresh(db_property)
        return db_property
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/properties/{property_id}", response_model=schemas.Property)
def update_property(property_id: int, property: schemas.PropertyCreate, db: Session = Depends(get_db)):
    db_property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    property_data = property.model_dump()
    
    # Calculate super_area if carpet_area, exclusive_area, and common_area are provided
    carpet_area = property_data.get('carpet_area') or 0
    exclusive_area = property_data.get('exclusive_area') or 0
    common_area = property_data.get('common_area') or 0
    
    property_data['super_area'] = carpet_area + exclusive_area + common_area
    
    # Update property fields
    for key, value in property_data.items():
        setattr(db_property, key, value)
    
    try:
        db.commit()
        db.refresh(db_property)
        return db_property
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/properties/{property_id}", status_code=204)
def delete_property(property_id: int, db: Session = Depends(get_db)):
    db_property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if db_property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    
    try:
        db.delete(db_property)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# Purchase routes
@app.get("/api/purchases", response_model=List[schemas.Purchase])
def get_purchases( db: Session = Depends(get_db)):
    purchases = db.query(models.Purchase).all()
    return purchases

@app.get("/api/purchases/{purchase_id}", response_model=schemas.Purchase)
def get_purchase(purchase_id: int, db: Session = Depends(get_db)):
    purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
    if purchase is None:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return purchase

@app.post("/api/purchases", response_model=schemas.Purchase)
def create_purchase(purchase: schemas.PurchaseCreate, db: Session = Depends(get_db)):
    db_purchase = models.Purchase(**purchase.model_dump())
    try:
        db.add(db_purchase)
        db.commit()
        db.refresh(db_purchase)
        return db_purchase
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# Loan routes
@app.get("/api/loans", response_model=List[schemas.Loan])
def get_loans(purchase_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Loan)
    if purchase_id:
        query = query.filter(models.Loan.purchase_id == purchase_id)
    loans = query.all()
    return loans

@app.post("/api/loans", response_model=schemas.Loan)
def create_loan(loan: schemas.LoanCreate, db: Session = Depends(get_db)):
    db_loan = models.Loan(**loan.model_dump())
    try:
        db.add(db_loan)
        db.commit()
        db.refresh(db_loan)
        return db_loan
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# Payment routes
@app.get("/api/payments", response_model=List[schemas.Payment])
def get_payments(purchase_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Payment)
    if purchase_id:
        query = query.filter(models.Payment.purchase_id == purchase_id)
    payments = query.all()
    return payments

@app.post("/api/payments", response_model=schemas.Payment)
def create_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    db_payment = models.Payment(**payment.model_dump())
    try:
        db.add(db_payment)
        db.commit()
        db.refresh(db_payment)
        return db_payment
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# Document routes
@app.post("/api/documents", response_model=schemas.Document)
async def create_document(
    entity_type: str = Form(...),
    entity_id: int = Form(...),
    metadata: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Create uploads directory if it doesn't exist
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)
    
    # Generate a unique file path
    file_name = f"{datetime.now().timestamp()}_{file.filename}"
    file_path = upload_dir / file_name
    
    # Save the file
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create document record
    document_data = {
        "entity_type": entity_type,
        "entity_id": entity_id,
        "file_path": str(file_path),
        "doc_metadata": {} if metadata is None else metadata
    }
    
    # Set proper foreign key based on entity type
    if entity_type == "property":
        document_data["property_id"] = entity_id
    elif entity_type == "purchase":
        document_data["purchase_id"] = entity_id
    
    db_document = models.Document(**document_data)
    
    try:
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        return db_document
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/documents/{entity_type}/{entity_id}", response_model=List[schemas.Document])
def get_documents(
    entity_type: str,
    entity_id: int,
    db: Session = Depends(get_db)
):
    documents = db.query(models.Document).filter(
        models.Document.entity_type == entity_type,
        models.Document.entity_id == entity_id
    ).all()
    return documents

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)