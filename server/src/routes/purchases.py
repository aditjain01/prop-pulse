from fastapi import APIRouter
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from src import schemas
from src.database import get_db, models

# Create a router instance
router = APIRouter(prefix="/purchases", tags=["purchases"])


# Purchase routes
@router.post("", response_model=schemas.Purchase, include_in_schema=False)
@router.post("/", response_model=schemas.Purchase)
def create_purchase(
    purchase: schemas.PurchaseCreate, db: Session = Depends(get_db)
) -> schemas.Purchase:
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


@router.get("", response_model=List[schemas.Purchase], include_in_schema=False)
@router.get("/", response_model=List[schemas.Purchase])
def get_purchases(
    property_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> List[schemas.Purchase]:
    try:
        query = db.query(models.Purchase)

        # Filter by property_id if provided
        if property_id:
            query = query.filter(models.Purchase.property_id == property_id)

        purchases = query.offset(skip).limit(limit).all()
        return purchases
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{purchase_id}", response_model=schemas.Purchase, include_in_schema=False)
@router.get("/{purchase_id}/", response_model=schemas.Purchase)
def get_purchase(purchase_id: int, db: Session = Depends(get_db)) -> schemas.Purchase:
    try:
        db_purchase = (
            db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
        )
        if db_purchase is None:
            raise HTTPException(status_code=404, detail="Purchase not found")
        return db_purchase
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{purchase_id}", response_model=schemas.Purchase, include_in_schema=False)
@router.put("/{purchase_id}/", response_model=schemas.Purchase)
def update_purchase(
    purchase_id: int,
    purchase_update: schemas.PurchaseCreate,
    db: Session = Depends(get_db),
) -> schemas.Purchase:
    try:
        # Get the existing property
        db_purchase = (
            db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
        )
        if not db_purchase:
            raise HTTPException(status_code=404, detail="Purchase not found")

        # Update property attributes
        purchase_data = purchase_update.dict(exclude_unset=True)
        for key, value in purchase_data.items():
            setattr(db_purchase, key, value)

        # Save changes
        db.commit()
        db.refresh(db_purchase)
        return db_purchase
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{purchase_id}", include_in_schema=False)
@router.delete("/{purchase_id}/")
def delete_purchase(purchase_id: int, db: Session = Depends(get_db)):
    try:
        # Check if purchase exists
        purchase = (
            db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
        )
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
