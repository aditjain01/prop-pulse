from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from server import models, schemas
from server.database import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

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
        db_purchase = models.Purchase(**purchase.dict())
        db.add(db_purchase)
        db.commit()
        db.refresh(db_purchase)
        return db_purchase
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

@app.get("/api/purchases/{purchase_id}", response_model=schemas.Purchase)
def get_purchase(purchase_id: int, db: Session = Depends(get_db)):
    try:
        db_purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
        if db_purchase is None:
            raise HTTPException(status_code=404, detail="Purchase not found")
        return db_purchase
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)