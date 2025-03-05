from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from server.src import models, schemas
from server.src.database import engine, get_db
from server.src.init_construction_status import init_construction_status
from fastapi import Query
from sqlalchemy import func

from server.src.routes.properties import router as properties_router
from server.src.routes.purchases import router as purchases_router
from server.src.routes.loans import router as loans_router
from server.src.routes.repayments import router as repayments_router
from server.src.routes.payments import router as payments_router

app = FastAPI()

# Create database tables and initialize construction status on app startup
@app.on_event("startup")
def startup_db_client():
    print("Creating database tables...")
    models.Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
    init_construction_status()


# Mount the router to the main app
app.include_router(properties_router)
app.include_router(purchases_router)
app.include_router(loans_router)
app.include_router(payments_router)
app.include_router(repayments_router)


# # Error handling middleware
# @app.middleware("http")
# async def error_handling_middleware(request: Request, call_next):
#     try:
#         return await call_next(request)
#     except Exception as e:
#         return JSONResponse(
#             status_code=500,
#             content={"detail": f"Internal server error: {str(e)}"}
#         )

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Construction Status routes
@app.get("/api/construction-status", response_model=List[schemas.ConstructionStatus])
def get_construction_statuses(db: Session = Depends(get_db)) -> List[schemas.ConstructionStatus]:
    try:
        statuses = db.query(models.ConstructionStatus).all()
        return statuses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/construction-status/{status_id}", response_model=schemas.ConstructionStatus)
def get_construction_status(status_id: int, db: Session = Depends(get_db)) -> schemas.ConstructionStatus:
    try:
        status = db.query(models.ConstructionStatus).filter(models.ConstructionStatus.id == status_id).first()
        if status is None:
            raise HTTPException(status_code=404, detail="Construction status not found")
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/api/acquisition-cost/summary", response_model=List[schemas.AcquisitionCostSummary])
def get_acquisition_cost_summary(
    user_id: Optional[int] = None,
    purchase_id: Optional[int] = None,
    db: Session = Depends(get_db)
) -> List[schemas.AcquisitionCostSummary]:
    try:
        query = db.query(models.AcquisitionCostSummary)
        
        # Apply filters if provided
        if user_id:
            query = query.filter(models.AcquisitionCostSummary.user_id == user_id)
            
        if purchase_id:
            query = query.filter(models.AcquisitionCostSummary.purchase_id == purchase_id)
        
        results = query.all()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/acquisition-cost/details", response_model=List[schemas.AcquisitionCostDetails])
def get_acquisition_cost_details(
    user_id: Optional[int] = None,
    purchase_id: Optional[int] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db)
) -> List[schemas.AcquisitionCostDetails]:
    try:
        query = db.query(models.AcquisitionCostDetails)
        
        # Apply filters if provided
        if user_id:
            query = query.filter(models.AcquisitionCostDetails.user_id == user_id)
            
        if purchase_id:
            query = query.filter(models.AcquisitionCostDetails.purchase_id == purchase_id)
            
        if from_date:
            query = query.filter(models.AcquisitionCostDetails.payment_date >= from_date)
            
        if to_date:
            query = query.filter(models.AcquisitionCostDetails.payment_date <= to_date)
            
        if type:
            query = query.filter(models.AcquisitionCostDetails.type == type)
        
        # Order by payment date (newest first)
        query = query.order_by(models.AcquisitionCostDetails.payment_date.desc())
        
        results = query.all()
        # print(results, type(results))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/loan-repayment-details/summary", response_model=List[schemas.LoanRepaymentSummary])
def get_loan_repayment_summary(
    user_id: int,
    loan_name: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db)
) -> List[schemas.LoanRepaymentSummary]:
    try:
        # Use the loan_repayment_details view directly
        query = db.query(
            models.LoanRepaymentDetails.loan_name,
            func.sum(models.LoanRepaymentDetails.principal_amount).label("total_principal_paid"),
            func.sum(models.LoanRepaymentDetails.interest_amount).label("total_interest_paid"),
            func.sum(models.LoanRepaymentDetails.other_fees).label("total_other_fees_paid"),
            func.sum(models.LoanRepaymentDetails.amount).label("total_paid"),
            func.min(models.LoanRepaymentDetails.principal_balance).label("remaining_principal_balance")
        ).filter(models.LoanRepaymentDetails.user_id == user_id)

        # Apply filters if provided
        if loan_name:
            query = query.filter(models.LoanRepaymentDetails.loan_name == loan_name)
            
        if from_date:
            query = query.filter(models.LoanRepaymentDetails.payment_date >= from_date)
        if to_date:
            query = query.filter(models.LoanRepaymentDetails.payment_date <= to_date)

        # Group by loan name
        query = query.group_by(models.LoanRepaymentDetails.loan_name)

        results = query.all()
        print(results)
        
        # Convert results to dictionaries
        formatted_results = []
        for result in results:
            formatted_results.append({
                "loan_name": result.loan_name,
                "total_principal_paid": result.total_principal_paid,
                "total_interest_paid": result.total_interest_paid,
                "total_other_fees_paid": result.total_other_fees_paid,
                "total_paid": result.total_paid,
                "remaining_principal_balance": result.remaining_principal_balance
            })
            
        return formatted_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/loans/summary/", response_model=List[schemas.LoanSummary])
def get_loan_summary(
    user_id: Optional[int] = None,
    loan_id: Optional[int] = None,
    db: Session = Depends(get_db)
) -> List[schemas.LoanSummary]:
    try:
        print(user_id, loan_id)
        query = db.query(models.LoanRepaymentSummary)
        
        # Apply filters if provided
        if user_id:
            query = query.filter(models.LoanRepaymentSummary.user_id == user_id)
            
        if loan_id is not None:  # Ensure loan_id is checked for None
            query = query.filter(models.LoanRepaymentSummary.loan_id == loan_id)
        
        # Get loan details to enrich the summary
        results = query.all()
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/loans/summary/enhanced", response_model=List[Dict])
def get_enhanced_loan_summary(
    user_id: Optional[int] = None,
    loan_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    try:
        # Join the loan_repayment_summary view with the loans table to get more details
        query = db.query(
            models.LoanRepaymentSummary.loan_id,
            models.LoanRepaymentSummary.user_id,
            models.LoanRepaymentSummary.total_principal_paid,
            models.LoanRepaymentSummary.total_interest_paid,
            models.LoanRepaymentSummary.total_other_fees,
            models.LoanRepaymentSummary.total_penalties,
            models.LoanRepaymentSummary.total_amount_paid,
            models.LoanRepaymentSummary.total_payments,
            models.LoanRepaymentSummary.last_repayment_date,
            models.LoanRepaymentSummary.principal_balance,
            models.Loan.name.label("loan_name"),
            models.Loan.institution,
            models.Loan.sanction_amount,
            models.Loan.total_disbursed_amount,
            models.Loan.interest_rate,
            models.Loan.tenure_months,
            models.Loan.is_active,
            models.Loan.purchase_id
        ).join(
            models.Loan,
            models.LoanRepaymentSummary.loan_id == models.Loan.id
        )
        
        # Apply filters if provided
        if user_id:
            query = query.filter(models.LoanRepaymentSummary.user_id == user_id)
            
        if loan_id:
            query = query.filter(models.LoanRepaymentSummary.loan_id == loan_id)
        
        results = query.all()
        
        # Convert results to dictionaries
        formatted_results = []
        for result in results:
            formatted_results.append({
                "loan_id": result.loan_id,
                "user_id": result.user_id,
                "loan_name": result.loan_name,
                "institution": result.institution,
                "purchase_id": result.purchase_id,
                "sanction_amount": result.sanction_amount,
                "total_disbursed_amount": result.total_disbursed_amount,
                "interest_rate": result.interest_rate,
                "tenure_months": result.tenure_months,
                "is_active": result.is_active,
                "total_principal_paid": result.total_principal_paid,
                "total_interest_paid": result.total_interest_paid,
                "total_other_fees": result.total_other_fees,
                "total_penalties": result.total_penalties,
                "total_amount_paid": result.total_amount_paid,
                "total_payments": result.total_payments,
                "last_repayment_date": result.last_repayment_date,
                "principal_balance": result.principal_balance,
                "completion_percentage": round(float(result.total_principal_paid / result.total_disbursed_amount * 100), 2) if result.total_disbursed_amount else 0
            })
            
        return formatted_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)