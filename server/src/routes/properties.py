from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from server.src import models, schemas
from server.src.database import engine, get_db
from server.src.init_construction_status import init_construction_status
from fastapi import Query
from sqlalchemy import func
from fastapi import APIRouter

# Create a router instance
router = APIRouter(prefix="/api/properties", tags=["properties"])

# Property routes
@router.post("", response_model=schemas.Property)
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

@router.get("", response_model=List[schemas.Property])
def get_properties(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)) -> List[schemas.Property]:
    try:
        properties = db.query(models.Property).offset(skip).limit(limit).all()
        return properties
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{property_id}", response_model=schemas.Property)
def get_property(property_id: int, db: Session = Depends(get_db)) -> schemas.Property:
    try:
        db_property = db.query(models.Property).filter(models.Property.id == property_id).first()
        if db_property is None:
            raise HTTPException(status_code=404, detail="Property not found")
        return db_property
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{property_id}", response_model=schemas.Property)
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

@router.delete("/{property_id}")
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
