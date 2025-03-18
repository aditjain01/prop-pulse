from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from src import schemas
from src.database import get_db, models
from fastapi import APIRouter

# Create a router instance
router = APIRouter(prefix="/properties", tags=["properties"])
# V2 routes for frontend-aligned endpoints
router_dev = APIRouter(prefix="/v2/properties", tags=["properties"])


# Property routes
@router.post("", response_model=schemas.PropertyOld, include_in_schema=False)
@router.post("/", response_model=schemas.PropertyOld)
def create_property(
    property: schemas.PropertyCreate, db: Session = Depends(get_db)
) -> schemas.PropertyOld:
    """
    Create a new property in the database.
    """
    try:
        db_property = models.Property(**property.dict())
        db.add(db_property)
        db.commit()
        db.refresh(db_property)
        return db_property
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=List[schemas.PropertyPublic], include_in_schema=False)
@router.get("/", response_model=List[schemas.PropertyPublic])
def get_properties(
    developer: str = None,
    db: Session = Depends(get_db),
) -> List[schemas.PropertyPublic]:
    """
    Get a list of properties with minimal information needed for the frontend.
    Optimized for frontend listing views with filtering by developer.
    """
    try:
        query = db.query(models.Property)
        
        # Apply filter by developer if provided
        if developer:
            query = query.filter(models.Property.developer == developer)
            
        properties = query.all()
        return properties
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{property_id}", response_model=schemas.Property, include_in_schema=False)
@router.get("/{property_id}", response_model=schemas.Property)
def get_property(
    property_id: int, 
    db: Session = Depends(get_db)
) -> schemas.Property:
    """
    Get a detailed view of a single property.
    Optimized for frontend detail views.
    """
    try:
        db_property = (
            db.query(models.Property).filter(models.Property.id == property_id).first()
        )
        if db_property is None:
            raise HTTPException(status_code=404, detail="Property not found")
        return db_property
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router_dev.get("", response_model=List[schemas.PropertyOld], include_in_schema=False)
@router_dev.get("/", response_model=List[schemas.PropertyOld])
def get_properties_old(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
) -> List[schemas.PropertyOld]:
    """
    Get a list of properties with pagination support.
    """
    try:
        properties = db.query(models.Property).offset(skip).limit(limit).all()
        return properties
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router_dev.get("/{property_id}", response_model=schemas.PropertyOld, include_in_schema=False)
@router_dev.get("/{property_id}/", response_model=schemas.PropertyOld)
def get_property_old(property_id: int, db: Session = Depends(get_db)) -> schemas.PropertyOld:
    """
    Get a detailed view of a single property using the old schema.
    """
    try:
        db_property = (
            db.query(models.Property).filter(models.Property.id == property_id).first()
        )
        if db_property is None:
            raise HTTPException(status_code=404, detail="Property not found")
        return db_property
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{property_id}", response_model=schemas.PropertyOld, include_in_schema=False)
@router.put("/{property_id}/", response_model=schemas.PropertyOld)
def update_property(
    property_id: int,
    property_update: schemas.PropertyUpdate,
    db: Session = Depends(get_db),
) -> schemas.PropertyOld:
    """
    Update an existing property with new data.
    """
    try:
        # Get the existing property
        db_property = (
            db.query(models.Property).filter(models.Property.id == property_id).first()
        )
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


@router.delete("/{property_id}", include_in_schema=False)
@router.delete("/{property_id}/")
def delete_property(property_id: int, db: Session = Depends(get_db)):
    """
    Delete a property from the database.
    """
    try:
        # Check if property exists
        property = (
            db.query(models.Property).filter(models.Property.id == property_id).first()
        )
        if property is None:
            raise HTTPException(status_code=404, detail="Property not found")

        # Check if property has associated purchases
        purchases = (
            db.query(models.Purchase)
            .filter(models.Purchase.property_id == property_id)
            .all()
        )
        if purchases:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete property with associated purchases",
            )

        # Delete the property
        db.delete(property)
        db.commit()
        return {"message": "Property deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
