from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from src import schemas
from src.database import get_db, models

router = APIRouter(prefix="/api/payment-sources", tags=["payment-sources"])


# Payment Source routes
@router.post("/", response_model=schemas.PaymentSource)
def create_payment_source(
    payment_source: schemas.PaymentSourceCreate, db: Session = Depends(get_db)
) -> schemas.PaymentSource:
    try:
        db_payment_source = models.PaymentSource(
            **payment_source.dict(), user_id=1
        )  # Replace with actual user ID
        db.add(db_payment_source)
        db.commit()
        db.refresh(db_payment_source)
        return db_payment_source
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[schemas.PaymentSource])
def get_payment_sources(db: Session = Depends(get_db)) -> List[schemas.PaymentSource]:
    try:
        payment_sources = (
            db.query(models.PaymentSource)
            .filter(models.PaymentSource.user_id == 1)
            .all()
        )  # Replace with actual user ID
        return payment_sources
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{source_id}", response_model=schemas.PaymentSource)
def get_payment_source(
    source_id: int, db: Session = Depends(get_db)
) -> schemas.PaymentSource:
    try:
        payment_source = (
            db.query(models.PaymentSource)
            .filter(models.PaymentSource.id == source_id)
            .first()
        )
        if payment_source is None:
            raise HTTPException(status_code=404, detail="Payment source not found")
        return payment_source
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{source_id}", response_model=schemas.PaymentSource)
def update_payment_source(
    source_id: int,
    payment_source: schemas.PaymentSourceUpdate,
    db: Session = Depends(get_db),
) -> schemas.PaymentSource:
    try:
        db_payment_source = (
            db.query(models.PaymentSource)
            .filter(models.PaymentSource.id == source_id)
            .first()
        )
        if db_payment_source is None:
            raise HTTPException(status_code=404, detail="Payment source not found")

        # Update payment source fields
        for key, value in payment_source.dict(exclude_unset=True).items():
            setattr(db_payment_source, key, value)

        db.commit()
        db.refresh(db_payment_source)
        return db_payment_source
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{payment_source_id}")
def delete_payment_source(payment_source_id: int, db: Session = Depends(get_db)):
    try:
        # Check if payment source exists
        payment_source = (
            db.query(models.PaymentSource)
            .filter(models.PaymentSource.id == payment_source_id)
            .first()
        )
        if payment_source is None:
            raise HTTPException(status_code=404, detail="Payment source not found")

        # Check if payment source is used in payments
        payments = (
            db.query(models.Payment)
            .filter(models.Payment.source_id == payment_source_id)
            .all()
        )
        if payments:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete payment source that is used in payments",
            )

        # Delete the payment source
        db.delete(payment_source)
        db.commit()
        return {"message": "Payment source deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
