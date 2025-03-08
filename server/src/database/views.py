from sqlalchemy import Column, Integer, String, Numeric, Date

from .base import Base


class LoanRepaymentDetails(Base):
    __tablename__ = "loan_repayment_details"
    __table_args__ = {"extend_existing": True}  # Prevent recreation

    user_id = Column(Integer, primary_key=True)
    loan_name = Column(String)
    loan_sanctioned_amount = Column(Numeric)
    loan_disbursed_amount = Column(Numeric)
    loan_outstanding_amount = Column(Numeric)
    payment_date = Column(Date)
    principal_amount = Column(Numeric)
    interest_amount = Column(Numeric)
    other_fees = Column(Numeric)
    penalties = Column(Numeric)
    amount = Column(Numeric)
    total_principal_paid = Column(Numeric)
    total_paid = Column(Numeric)
    principal_balance = Column(Numeric)


class PurchaseSummary(Base):
    __tablename__ = "purchase_summary"
    __table_args__ = {"extend_existing": True}  # Prevent recreation

    user_id = Column(Integer, primary_key=True)
    name = Column(String)
    total_paid_amount = Column(Numeric)
    total_invoice_amount = Column(Numeric)
    total_receipt_amount = Column(Numeric)
    last_payment_date = Column(Date)
    property_cost = Column(Numeric)
    total_cost = Column(Numeric)
    total_sale_cost = Column(Numeric)
    purchase_date = Column(Date)
    registration_date = Column(Date)
    possession_date = Column(Date)
    balance = Column(Numeric)


class AcquisitionCostDetails(Base):
    __tablename__ = "acquisition_cost_details"
    __table_args__ = {"extend_existing": True}  # Prevent recreation

    user_id = Column(Integer, primary_key=True)
    purchase_id = Column(Integer, primary_key=True)
    payment_date = Column(Date)
    principal = Column(Numeric)
    interest = Column(Numeric)
    others = Column(Numeric)
    payment = Column(Numeric)
    source = Column(String)
    mode = Column(String)
    reference = Column(String)
    type = Column(String)  # 'Loan Repayment' or 'Direct Payment'


class AcquisitionCostSummary(Base):
    __tablename__ = "acquisition_cost_summary"
    __table_args__ = {"extend_existing": True}  # Prevent recreation

    user_id = Column(Integer, primary_key=True)  # user_id as a primary key
    purchase_id = Column(Integer, primary_key=True)  # purchase_id as a primary key
    property_name = Column(String)

    total_loan_principal = Column(Numeric)  # Renamed to total_loan_principal
    total_loan_interest = Column(Numeric)  # Renamed to total_loan_interest
    total_loan_others = Column(Numeric)  # Renamed to total_loan_others
    total_loan_payment = Column(Numeric)

    total_builder_principal = Column(Numeric)  # Added for builder principal
    total_builder_payment = Column(Numeric)  # Added for builder payment

    total_principal_payment = Column(Numeric)  # Added for total principal payment
    total_sale_cost = Column(Numeric)
    remaining_balance = Column(Numeric)


class LoanRepaymentSummary(Base):
    __tablename__ = "loan_repayment_summary"
    __table_args__ = {"extend_existing": True}  # Prevent recreation

    user_id = Column(Integer, primary_key=True)
    loan_id = Column(Integer, primary_key=True)
    loan_name = Column(String)
    property_name = Column(String)
    loan_sanctioned_amount = Column(Numeric)
    loan_disbursed_amount = Column(Numeric)
    total_principal_paid = Column(Numeric)
    total_interest_paid = Column(Numeric)
    total_other_fees = Column(Numeric)
    total_penalties = Column(Numeric)
    total_amount_paid = Column(Numeric)
    total_payments = Column(Integer)
    last_repayment_date = Column(Date)
    principal_balance = Column(Numeric)
