from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from src import schemas
from src.database import get_db, models
from fastapi import APIRouter
import logging

# Create a router instance
router = APIRouter(prefix="/properties", tags=["properties"])
logger = logging.getLogger(__name__)

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
        logger.info(f"Creating new property: name={property.name}, developer={property.developer}")
        db_property = models.Property(**property.dict())
        db.add(db_property)
        db.commit()
        db.refresh(db_property)
        logger.info(f"Property created successfully: property_id={db_property.id}")
        return db_property
    except Exception as e:
        logger.error(f"Error in create_property: {e}")
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
        logger.info("Fetching properties with filters")
        logger.debug(f"Filters: developer={developer}")
        
        query = db.query(models.Property)
        
        # Apply filter by developer if provided
        if developer:
            query = query.filter(models.Property.developer == developer)
            
        properties = query.all()
        logger.info(f"Found {len(properties)} properties matching the criteria")
        return properties
    except Exception as e:
        logger.error(f"Error in get_properties: {e}")
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
        logger.info(f"Fetching property details: property_id={property_id}")
        db_property = (
            db.query(models.Property).filter(models.Property.id == property_id).first()
        )
        if db_property is None:
            logger.warning(f"Property not found: property_id={property_id}")
            raise HTTPException(status_code=404, detail="Property not found")
        logger.debug(f"Found property: id={db_property.id}, name={db_property.name}")
        return db_property
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_property: {e}")
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
        logger.info(f"Updating property: property_id={property_id}")
        # Get the existing property
        db_property = (
            db.query(models.Property).filter(models.Property.id == property_id).first()
        )
        if not db_property:
            logger.warning(f"Property not found: property_id={property_id}")
            raise HTTPException(status_code=404, detail="Property not found")

        # Update property attributes
        property_data = property_update.dict(exclude_unset=True)
        logger.debug(f"Updating property with data: {property_data}")
        for key, value in property_data.items():
            setattr(db_property, key, value)

        # Save changes
        db.commit()
        db.refresh(db_property)
        logger.info(f"Property updated successfully: property_id={db_property.id}")
        return db_property
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in update_property: {e}")
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{property_id}", include_in_schema=False)
@router.delete("/{property_id}/")
def delete_property(property_id: int, db: Session = Depends(get_db)):
    """
    Delete a property from the database.
    """
    try:
        logger.info(f"Deleting property: property_id={property_id}")
        # Check if property exists
        property = (
            db.query(models.Property).filter(models.Property.id == property_id).first()
        )
        if property is None:
            logger.warning(f"Property not found: property_id={property_id}")
            raise HTTPException(status_code=404, detail="Property not found")

        # Check if property has associated purchases
        purchases = (
            db.query(models.Purchase)
            .filter(models.Purchase.property_id == property_id)
            .all()
        )
        if purchases:
            logger.warning(f"Cannot delete property with associated purchases: property_id={property_id}")
            raise HTTPException(
                status_code=400,
                detail="Cannot delete property with associated purchases",
            )

        # Delete the property
        db.delete(property)
        db.commit()
        logger.info(f"Property deleted successfully: property_id={property_id}")
        return {"message": "Property deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_property: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
