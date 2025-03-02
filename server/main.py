
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, date
from decimal import Decimal
import jwt
import os
import shutil
from pathlib import Path
from jose import JWTError, jwt
from passlib.context import CryptContext

from server import models, schemas
from server.database import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Initialize construction statuses
from server.init_construction_status import init_construction_statuses
init_construction_statuses()

app = FastAPI()

# Security
SECRET_KEY = os.getenv("SESSION_SECRET", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

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

@app.post("/api/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@app.get("/api/user", response_model=schemas.User)
def get_current_user_route(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.post("/api/logout")
def logout():
    # In a stateless JWT system, the client just needs to delete the token
    return {"message": "Successfully logged out"}

# Construction Status routes
@app.get("/api/construction-statuses", response_model=List[schemas.ConstructionStatus])
def get_construction_statuses(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    statuses = db.query(models.ConstructionStatus).all()
    return statuses

@app.get("/api/construction-statuses/{status_id}", response_model=schemas.ConstructionStatus)
def get_construction_status(status_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    status = db.query(models.ConstructionStatus).filter(models.ConstructionStatus.id == status_id).first()
    if status is None:
        raise HTTPException(status_code=404, detail="Construction status not found")
    return status

# Property routes
@app.get("/api/properties", response_model=List[schemas.Property])
def get_properties(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    properties = db.query(models.Property).all()
    return properties

@app.get("/api/properties/{property_id}", response_model=schemas.Property)
def get_property(property_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return property

@app.post("/api/properties", response_model=schemas.Property)
def create_property(property: schemas.PropertyCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
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
def update_property(property_id: int, property: schemas.PropertyCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
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
def delete_property(property_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
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
def get_purchases(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    purchases = db.query(models.Purchase).filter(models.Purchase.user_id == current_user.id).all()
    return purchases

@app.get("/api/purchases/{purchase_id}", response_model=schemas.Purchase)
def get_purchase(purchase_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
    if purchase is None:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return purchase

@app.post("/api/purchases", response_model=schemas.Purchase)
def create_purchase(purchase: schemas.PurchaseCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_purchase = models.Purchase(**purchase.model_dump(), user_id=current_user.id)
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
def get_loans(purchase_id: Optional[int] = None, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(models.Loan)
    if purchase_id:
        query = query.filter(models.Loan.purchase_id == purchase_id)
    loans = query.all()
    return loans

@app.post("/api/loans", response_model=schemas.Loan)
def create_loan(loan: schemas.LoanCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
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
def get_payments(purchase_id: Optional[int] = None, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(models.Payment)
    if purchase_id:
        query = query.filter(models.Payment.purchase_id == purchase_id)
    payments = query.all()
    return payments

@app.post("/api/payments", response_model=schemas.Payment)
def create_payment(payment: schemas.PaymentCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_payment = models.Payment(**payment.model_dump(), user_id=current_user.id)
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
    current_user: models.User = Depends(get_current_user),
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
    current_user: models.User = Depends(get_current_user),
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
