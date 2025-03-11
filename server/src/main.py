from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from src import schemas, routes
from src.database import (
    get_db,
    models,
    views,
    init_construction_status,
    init_views,
    init_db,
    init_example_user,
)
from sqlalchemy import func

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    # allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create database tables and initialize construction status on app startup
@app.on_event("startup")
def startup_db_client():
    init_db()
    init_views()
    init_construction_status()
    init_example_user()


# Mount the router to the main app
app.include_router(routes.properties_router)
app.include_router(routes.purchases_router)
app.include_router(routes.loans_router)
app.include_router(routes.payments_router)
app.include_router(routes.repayments_router)
app.include_router(routes.payment_sources_router)


# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}


# Construction Status routes
@app.get("/construction-status", response_model=List[schemas.ConstructionStatus], include_in_schema=False)
@app.get("/construction-status/", response_model=List[schemas.ConstructionStatus])
def get_construction_statuses(
    db: Session = Depends(get_db),
) -> List[schemas.ConstructionStatus]:
    try:
        statuses = db.query(models.ConstructionStatus).all()
        return statuses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/construction-status/{status_id}", response_model=schemas.ConstructionStatus, include_in_schema=False)
@app.get("/construction-status/{status_id}/", response_model=schemas.ConstructionStatus)
def get_construction_status(
    status_id: int, db: Session = Depends(get_db)
) -> schemas.ConstructionStatus:
    try:
        status = (
            db.query(models.ConstructionStatus)
            .filter(models.ConstructionStatus.id == status_id)
            .first()
        )
        if status is None:
            raise HTTPException(status_code=404, detail="Construction status not found")
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/acquisition-cost/summary", response_model=List[schemas.AcquisitionCostSummary], include_in_schema=False)
@app.get("/acquisition-cost/summary/", response_model=List[schemas.AcquisitionCostSummary])
def get_acquisition_cost_summary(
    user_id: Optional[int] = None,
    purchase_id: Optional[int] = None,
    db: Session = Depends(get_db),
) -> List[schemas.AcquisitionCostSummary]:
    try:
        query = db.query(views.AcquisitionCostSummary)

        # Apply filters if provided
        if user_id:
            query = query.filter(views.AcquisitionCostSummary.user_id == user_id)

        if purchase_id:
            query = query.filter(
                views.AcquisitionCostSummary.purchase_id == purchase_id
            )

        results = query.all()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/acquisition-cost/details", response_model=List[schemas.AcquisitionCostDetails], include_in_schema=False)
@app.get("/acquisition-cost/details/", response_model=List[schemas.AcquisitionCostDetails])
def get_acquisition_cost_details(
    user_id: Optional[int] = None,
    purchase_id: Optional[int] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db),
) -> List[schemas.AcquisitionCostDetails]:
    try:
        query = db.query(views.AcquisitionCostDetails)

        # Apply filters if provided
        if user_id:
            query = query.filter(views.AcquisitionCostDetails.user_id == user_id)

        if purchase_id:
            query = query.filter(
                views.AcquisitionCostDetails.purchase_id == purchase_id
            )

        if from_date:
            query = query.filter(views.AcquisitionCostDetails.payment_date >= from_date)

        if to_date:
            query = query.filter(views.AcquisitionCostDetails.payment_date <= to_date)

        if type:
            query = query.filter(views.AcquisitionCostDetails.type == type)

        # Order by payment date (newest first)
        query = query.order_by(views.AcquisitionCostDetails.payment_date.desc())

        results = query.all()
        # print(results, type(results))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/loan-repayment-details/summary", response_model=List[schemas.LoanRepaymentSummary], include_in_schema=False)
@app.get("/loan-repayment-details/summary/", response_model=List[schemas.LoanRepaymentSummary])
def get_loan_repayment_summary(
    user_id: int,
    loan_name: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db),
) -> List[schemas.LoanRepaymentSummary]:
    try:
        # Use the loan_repayment_details view directly
        query = db.query(
            views.LoanRepaymentDetails.loan_name,
            func.sum(views.LoanRepaymentDetails.principal_amount).label(
                "total_principal_paid"
            ),
            func.sum(views.LoanRepaymentDetails.interest_amount).label(
                "total_interest_paid"
            ),
            func.sum(views.LoanRepaymentDetails.other_fees).label(
                "total_other_fees_paid"
            ),
            func.sum(views.LoanRepaymentDetails.amount).label("total_paid"),
            func.min(views.LoanRepaymentDetails.principal_balance).label(
                "remaining_principal_balance"
            ),
        ).filter(views.LoanRepaymentDetails.user_id == user_id)

        # Apply filters if provided
        if loan_name:
            query = query.filter(views.LoanRepaymentDetails.loan_name == loan_name)

        if from_date:
            query = query.filter(views.LoanRepaymentDetails.payment_date >= from_date)
        if to_date:
            query = query.filter(views.LoanRepaymentDetails.payment_date <= to_date)

        # Group by loan name
        query = query.group_by(views.LoanRepaymentDetails.loan_name)

        results = query.all()
        print(results)

        # Convert results to dictionaries
        formatted_results = []
        for result in results:
            formatted_results.append(
                {
                    "loan_name": result.loan_name,
                    "total_principal_paid": result.total_principal_paid,
                    "total_interest_paid": result.total_interest_paid,
                    "total_other_fees_paid": result.total_other_fees_paid,
                    "total_paid": result.total_paid,
                    "remaining_principal_balance": result.remaining_principal_balance,
                }
            )

        return formatted_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/loans/summary", response_model=List[schemas.LoanSummary], include_in_schema=False)
@app.get("/loans/summary/", response_model=List[schemas.LoanSummary])
def get_loan_summary(
    user_id: Optional[int] = None,
    loan_id: Optional[int] = None,
    db: Session = Depends(get_db),
) -> List[schemas.LoanSummary]:
    try:
        print(user_id, loan_id)
        query = db.query(views.LoanRepaymentSummary)

        # Apply filters if provided
        if user_id:
            query = query.filter(views.LoanRepaymentSummary.user_id == user_id)

        if loan_id is not None:  # Ensure loan_id is checked for None
            query = query.filter(views.LoanRepaymentSummary.loan_id == loan_id)

        # Get loan details to enrich the summary
        results = query.all()

        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/loans/summary/enhanced", response_model=List[Dict], include_in_schema=False)
@app.get("/loans/summary/enhanced/", response_model=List[Dict])
def get_enhanced_loan_summary(
    user_id: Optional[int] = None,
    loan_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    try:
        # Join the loan_repayment_summary view with the loans table to get more details
        query = db.query(
            views.LoanRepaymentSummary.loan_id,
            views.LoanRepaymentSummary.user_id,
            views.LoanRepaymentSummary.total_principal_paid,
            views.LoanRepaymentSummary.total_interest_paid,
            views.LoanRepaymentSummary.total_other_fees,
            views.LoanRepaymentSummary.total_penalties,
            views.LoanRepaymentSummary.total_amount_paid,
            views.LoanRepaymentSummary.total_payments,
            views.LoanRepaymentSummary.last_repayment_date,
            views.LoanRepaymentSummary.principal_balance,
            views.Loan.name.label("loan_name"),
            views.Loan.institution,
            views.Loan.sanction_amount,
            views.Loan.total_disbursed_amount,
            views.Loan.interest_rate,
            views.Loan.tenure_months,
            views.Loan.is_active,
            views.Loan.purchase_id,
        ).join(views.Loan, views.LoanRepaymentSummary.loan_id == views.Loan.id)

        # Apply filters if provided
        if user_id:
            query = query.filter(views.LoanRepaymentSummary.user_id == user_id)

        if loan_id:
            query = query.filter(views.LoanRepaymentSummary.loan_id == loan_id)

        results = query.all()

        # Convert results to dictionaries
        formatted_results = []
        for result in results:
            formatted_results.append(
                {
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
                    "completion_percentage": round(
                        float(
                            result.total_principal_paid
                            / result.total_disbursed_amount
                            * 100
                        ),
                        2,
                    )
                    if result.total_disbursed_amount
                    else 0,
                }
            )

        return formatted_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    print(f"Response: {response.status_code}")
    return response


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=5000)
