from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Date, Numeric, ARRAY, Boolean, Computed
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    email = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    purchases = relationship("Purchase", back_populates="user")
    payments = relationship("Payment", back_populates="user")
    payment_sources = relationship("PaymentSource", back_populates="user")
    loans = relationship("Loan", back_populates="user")

class ConstructionStatus(Base):
    __tablename__ = "construction_status"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    
    # Relationships
    # properties = relationship("Property", back_populates="construction_status")

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    property_type = Column(String, nullable=False)

    carpet_area = Column(Numeric)
    exclusive_area = Column(Numeric)
    common_area = Column(Numeric)
    super_area = Column(Numeric, Computed("carpet_area + exclusive_area + common_area"), nullable=False)
    floor_number = Column(Integer)

    parking_details = Column(String)
    amenities = Column(ARRAY(String))

    initial_rate = Column(Numeric, nullable=False)
    current_rate = Column(Numeric, nullable=False)
    current_price = Column(Numeric, Computed("current_rate * super_area"), nullable=False)

    # status_id = Column(Integer, ForeignKey("construction_status.id"))
    developer = Column(String)
    rera_id = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    purchases = relationship("Purchase", back_populates="property")
    documents = relationship("Document", back_populates="property")
    # construction_status = relationship("ConstructionStatus", back_populates="properties")

class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    purchase_date = Column(Date, nullable=False)
    registration_date = Column(Date)
    possession_date = Column(Date)
    base_cost = Column(Numeric, nullable=False)
    other_charges = Column(Numeric)
    ifms = Column(Numeric)
    lease_rent = Column(Numeric)
    amc = Column(Numeric)
    gst = Column(Numeric)
    property_cost = Column(Numeric, nullable=False)
    total_cost = Column(Numeric, nullable=False)
    total_sale_cost = Column(Numeric, nullable=False)
    seller = Column(String)
    remarks = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    property = relationship("Property", back_populates="purchases")
    user = relationship("User", back_populates="purchases")
    payments = relationship("Payment", back_populates="purchase")
    documents = relationship("Document", back_populates="purchase")
    loans = relationship(
        "Loan",
        primaryjoin="Purchase.id == Loan.purchase_id",
        back_populates="purchase"
    )

class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=False)
    
    # Basic loan information
    name = Column(String, nullable=False)  # Descriptive name for the loan
    institution = Column(String, nullable=False)  # Bank or financial institution
    agent = Column(String)  # Loan agent or relationship manager
    
    # Dates
    sanction_date = Column(Date, nullable=False)
    
    # Financial details
    sanction_amount = Column(Numeric(precision=15, scale=2), nullable=False)
    total_disbursed_amount = Column(Numeric(precision=15, scale=2), default=0)
    processing_fee = Column(Numeric(precision=15, scale=2), default=0)
    other_charges = Column(Numeric(precision=15, scale=2), default=0)
    loan_sanction_charges = Column(Numeric(precision=15, scale=2), default=0)
    
    # Terms
    interest_rate = Column(Numeric(precision=5, scale=2), nullable=False)  # Annual interest rate
    tenure_months = Column(Integer, nullable=False)  # Loan tenure in months
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="loans")
    payment_sources = relationship("PaymentSource", back_populates="loan")
    purchase = relationship(
        "Purchase",
        primaryjoin="Loan.purchase_id == Purchase.id",
        back_populates="loans"
    )
    repayments = relationship("LoanRepayment", back_populates="loan")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    source_id = Column(Integer, ForeignKey("payment_sources.id"), nullable=False)
    
    # Basic payment details
    payment_date = Column(Date, nullable=False)
    amount = Column(Numeric, nullable=False)
    payment_mode = Column(String, nullable=False)  # cash, online, cheque, etc.
    transaction_reference = Column(String)  # Reference number, cheque number, etc.
    milestone = Column(String)  # What this payment is for (e.g., booking, possession)
    
    # Invoice details
    invoice_date = Column(Date)
    invoice_number = Column(String)
    invoice_amount = Column(Numeric)
    
    # Receipt details
    receipt_date = Column(Date)
    receipt_number = Column(String)
    receipt_amount = Column(Numeric)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    purchase = relationship("Purchase", back_populates="payments")
    user = relationship("User", back_populates="payments")
    payment_source = relationship("PaymentSource", back_populates="payments")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, nullable=False)  # property or purchase
    entity_id = Column(Integer, nullable=False)
    file_path = Column(String, nullable=False)
    document_vector = Column(String)
    doc_metadata = Column(JSON)  # Renamed from metadata to avoid conflict
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Add polymorphic relationships
    property_id = Column(Integer, ForeignKey("properties.id"))
    purchase_id = Column(Integer, ForeignKey("purchases.id"))

    # Relationships
    property = relationship("Property", back_populates="documents")
    purchase = relationship("Purchase", back_populates="documents")

class PaymentSource(Base):
    __tablename__ = "payment_sources"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)  # Descriptive name (e.g., "HDFC Savings", "Home Loan")
    source_type = Column(String, nullable=False)  # bank_account, loan, cash, credit_card, digital_wallet
    
    # Common fields
    description = Column(String)
    is_active = Column(Boolean, default=True)
    
    # Bank account specific
    bank_name = Column(String)
    account_number = Column(String)  # Stored masked or encrypted
    ifsc_code = Column(String)
    branch = Column(String)
    
    # Loan specific
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=True)
    lender = Column(String)  # Bank or individual name
    
    # Credit card specific
    card_number = Column(String)  # Stored masked
    card_expiry = Column(String)
    
    # Digital wallet specific
    wallet_provider = Column(String)
    wallet_identifier = Column(String)  # Email or phone linked
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="payment_sources")
    payments = relationship("Payment", back_populates="payment_source")
    loan = relationship("Loan", back_populates="payment_sources")
    loan_repayments = relationship("LoanRepayment", back_populates="payment_source")

class LoanRepayment(Base):
    __tablename__ = "loan_repayments"


    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=False)
    payment_date = Column(Date, nullable=False)
    principal_amount = Column(Numeric, nullable=False)
    interest_amount = Column(Numeric, nullable=False)
    other_fees = Column(Numeric, default=0)
    penalties = Column(Numeric, default=0)
    total_payment = Column(Numeric, Computed("principal_amount + interest_amount + other_fees + penalties"), nullable=False)
    source_id = Column(Integer, ForeignKey("payment_sources.id"), nullable=False)
    payment_mode = Column(String, nullable=False)  # cash, online, cheque, etc.
    transaction_reference = Column(String)
    notes = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    loan = relationship("Loan", back_populates="repayments")
    payment_source = relationship("PaymentSource", back_populates="loan_repayments")

class LoanRepaymentDetails(Base):
    __tablename__ = "loan_repayment_details"
    __table_args__ = {'extend_existing': True}  # Prevent recreation

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
    __table_args__ = {'extend_existing': True}  # Prevent recreation

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
    __table_args__ = {'extend_existing': True}  # Prevent recreation

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
    __table_args__ = {'extend_existing': True}  # Prevent recreation

    user_id = Column(Integer, primary_key=True)  # user_id as a primary key
    purchase_id = Column(Integer, primary_key=True)  # purchase_id as a primary key
    property_name = Column(String)
    
    total_loan_principal = Column(Numeric)  # Renamed to total_loan_principal
    total_loan_interest = Column(Numeric)    # Renamed to total_loan_interest
    total_loan_others = Column(Numeric)       # Renamed to total_loan_others
    total_loan_payment = Column(Numeric)

    total_builder_principal = Column(Numeric)  # Added for builder principal
    total_builder_payment = Column(Numeric)    # Added for builder payment

    total_principal_payment = Column(Numeric)   # Added for total principal payment
    total_sale_cost = Column(Numeric)
    remaining_balance = Column(Numeric)

class LoanRepaymentSummary(Base):
    __tablename__ = "loan_repayment_summary"
    __table_args__ = {'extend_existing': True}  # Prevent recreation

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
    