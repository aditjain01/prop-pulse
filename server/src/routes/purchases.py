from fastapi import APIRouter
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from src import schemas
from src.database import get_db, models
import logging

# Create a router instance
router = APIRouter(prefix="/purchases", tags=["purchases"])
logger = logging.getLogger(__name__)


# Purchase routes
@router.post("", response_model=schemas.PurchaseOld, include_in_schema=False)
@router.post("/", response_model=schemas.PurchaseOld)
def create_purchase(
    purchase: schemas.PurchaseCreate, db: Session = Depends(get_db)
) -> schemas.PurchaseOld:
    """
    Create a new purchase.
    """
    try:
        logger.info(f"Creating new purchase for property_id={purchase.property_id}")
        db_property = models.Purchase(**purchase.dict())
        db.add(db_property)
        db.commit()
        db.refresh(db_property)
        logger.info(f"Purchase created successfully: purchase_id={db_property.id}")
        return db_property
    except Exception as e:
        logger.error(f"Error in create_purchase: {e}")
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{purchase_id}", response_model=schemas.PurchaseOld, include_in_schema=False)
@router.put("/{purchase_id}/", response_model=schemas.PurchaseOld)
def update_purchase(
    purchase_id: int,
    purchase_update: schemas.PurchaseUpdate,
    db: Session = Depends(get_db),
) -> schemas.PurchaseOld:
    """
    Update an existing purchase by purchase_id.
    """
    try:
        logger.info(f"Updating purchase: purchase_id={purchase_id}")
        # Get the existing property
        db_purchase = (
            db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
        )
        if not db_purchase:
            logger.warning(f"Purchase not found: purchase_id={purchase_id}")
            raise HTTPException(status_code=404, detail="Purchase not found")

        # Update property attributes
        purchase_data = purchase_update.dict(exclude_unset=True)
        logger.debug(f"Updating purchase with data: {purchase_data}")
        for key, value in purchase_data.items():
            setattr(db_purchase, key, value)

        # Save changes
        db.commit()
        db.refresh(db_purchase)
        logger.info(f"Purchase updated successfully: purchase_id={db_purchase.id}")
        return db_purchase
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in update_purchase: {e}")
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{purchase_id}", include_in_schema=False)
@router.delete("/{purchase_id}/")
def delete_purchase(purchase_id: int, db: Session = Depends(get_db)):
    """
    Delete a purchase by purchase_id.
    """
    try:
        logger.info(f"Deleting purchase: purchase_id={purchase_id}")
        # Check if purchase exists
        purchase = (
            db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
        )
        if purchase is None:
            logger.warning(f"Purchase not found: purchase_id={purchase_id}")
            raise HTTPException(status_code=404, detail="Purchase not found")

        # Delete the purchase
        db.delete(purchase)
        db.commit()
        logger.info(f"Purchase deleted successfully: purchase_id={purchase_id}")
        return {"message": "Purchase deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_purchase: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# V2 routes for frontend-aligned endpoints
@router.get("", response_model=List[schemas.PurchasePublic], include_in_schema=False)
@router.get("/", response_model=List[schemas.PurchasePublic])
def get_purchases(
    property_id: Optional[int] = None,
    developer: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    db: Session = Depends(get_db),
) -> List[schemas.PurchasePublic]:
    """
    Get a list of purchases with property information and enhanced filtering.
    Optimized for frontend listing views.
    """
    try:
        logger.info("Fetching purchases with filters")
        logger.debug(f"Filters: property_id={property_id}, developer={developer}, "
                    f"from_date={from_date}, to_date={to_date}, "
                    f"min_amount={min_amount}, max_amount={max_amount}")
        
        # Start with a query that joins Purchase with Property
        query = (
            db.query(
                models.Purchase,
                models.Property.name.label("property_name")
            )
            .join(models.Property, models.Purchase.property_id == models.Property.id)
        )

        if property_id:
            query = query.filter(models.Purchase.property_id == property_id)

        # Apply filters if provided
        if developer:
            query = query.filter(models.Property.developer == developer)
            
        if from_date:
            query = query.filter(models.Purchase.purchase_date >= from_date)
            
        if to_date:
            query = query.filter(models.Purchase.purchase_date <= to_date)
            
        if min_amount:
            query = query.filter(models.Purchase.total_sale_cost >= min_amount)
            
        if max_amount:
            query = query.filter(models.Purchase.total_sale_cost <= max_amount)

        # Execute query
        results = query.all()
        logger.info(f"Found {len(results)} purchases matching the criteria")
        
        # Convert the results to the expected schema format
        purchases = [
            {
                "id": purchase.id,
                "property_name": property_name,
                "purchase_date": purchase.purchase_date,
                "carpet_area": purchase.carpet_area,
                "super_area": purchase.super_area,
                "total_sale_cost": purchase.total_sale_cost,
            } for purchase, property_name in results
        ]
            
        return purchases
    except Exception as e:
        logger.error(f"Error in get_purchases: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{purchase_id}", response_model=schemas.Purchase, include_in_schema=False)
@router.get("/{purchase_id}", response_model=schemas.Purchase)
def get_purchase(purchase_id: int, db: Session = Depends(get_db)) -> schemas.Purchase:
    """
    Get a detailed view of a single purchase with property information.
    Optimized for frontend detail views.
    """
    try:
        logger.info(f"Fetching purchase details: purchase_id={purchase_id}")
        # Query with join to Property
        result = (
            db.query(
                models.Purchase,
                models.Property.name.label("property_name")
            )
            .join(models.Property, models.Purchase.property_id == models.Property.id)
            .filter(models.Purchase.id == purchase_id)
            .first()
        )
        
        if result is None:
            logger.warning(f"Purchase not found: purchase_id={purchase_id}")
            raise HTTPException(status_code=404, detail="Purchase not found")
            
        purchase, property_name = result
        logger.debug(f"Found purchase: id={purchase.id}, property={property_name}")
        
        # Convert to the expected schema format
        return {
            "id": purchase.id,
            "property_name": property_name,
            "purchase_date": purchase.purchase_date,
            "registration_date": purchase.registration_date,
            "possession_date": purchase.possession_date,
            
            # Area fields moved from Property to Purchase
            "carpet_area": purchase.carpet_area,
            "exclusive_area": purchase.exclusive_area,
            "common_area": purchase.common_area,
            "floor_number": purchase.floor_number,
            "super_area": purchase.super_area,
            
            # Rate fields moved from Property to Purchase
            "purchase_rate": purchase.purchase_rate,
            "current_rate": purchase.current_rate,
            
            "base_cost": purchase.base_cost,
            "other_charges": purchase.other_charges,
            "ifms": purchase.ifms,
            "lease_rent": purchase.lease_rent,
            "amc": purchase.amc,
            "gst": purchase.gst,
            "property_cost": purchase.property_cost,
            "total_cost": purchase.total_cost,
            "total_sale_cost": purchase.total_sale_cost,
            "seller": purchase.seller,
            "remarks": purchase.remarks,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_purchase: {e}")
        raise HTTPException(status_code=500, detail=str(e))
