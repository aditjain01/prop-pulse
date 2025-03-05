from fastapi import APIRouter
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from server.src import models, schemas
from server.src.database import engine, get_db
from server.src.init_construction_status import init_construction_status
from fastapi import Query
from sqlalchemy import func

# Create a router instance
router = APIRouter(prefix="/api/purchases", tags=["purchases"])

# Purchase routes
@router.post("/", response_model=schemas.Purchase)
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
    
@router.get("/", response_model=List[schemas.Purchase])
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

@router.get("/{purchase_id}", response_model=schemas.Purchase)
def get_purchase(purchase_id: int, db: Session = Depends(get_db)) -> schemas.Purchase:
    try:
        db_purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
        if db_purchase is None:
            raise HTTPException(status_code=404, detail="Purchase not found")
        return db_purchase
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{purchase_id}", response_model=schemas.Purchase)
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

@router.delete("/{purchase_id}")
def delete_purchase(purchase_id: int, db: Session = Depends(get_db)):
    try:
        # Check if purchase exists
        purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
        if purchase is None:
            raise HTTPException(status_code=404, detail="Purchase not found")
        
        # Delete the purchase
        db.delete(purchase)
        db.commit()
        return {"message": "Purchase deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
