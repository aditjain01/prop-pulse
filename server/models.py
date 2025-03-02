from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Date, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

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

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    address = Column(String, nullable=False)
    property_type = Column(String, nullable=False)
    carpet_area = Column(Numeric)
    super_area = Column(Numeric)
    builder_area = Column(Numeric)
    floor_number = Column(Integer)
    parking_details = Column(String)
    amenities = Column(JSON)
    initial_rate = Column(Numeric, nullable=False)
    current_price = Column(Numeric, nullable=False)
    status = Column(String, nullable=False, default='available')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    purchases = relationship("Purchase", back_populates="property")
    documents = relationship("Document", back_populates="property")

class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    purchase_date = Column(Date, nullable=False)
    registration_date = Column(Date)
    possession_date = Column(Date)
    final_purchase_price = Column(Numeric, nullable=False)
    cost_breakdown = Column(JSON, nullable=False)
    seller_info = Column(String)
    remarks = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    property = relationship("Property", back_populates="purchases")
    user = relationship("User", back_populates="purchases")
    loans = relationship("Loan", back_populates="purchase")
    payments = relationship("Payment", back_populates="purchase")
    documents = relationship("Document", back_populates="purchase")

class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=False)
    bank_name = Column(String, nullable=False)
    disbursement_date = Column(Date, nullable=False)
    interest_rate = Column(Numeric, nullable=False)
    loan_amount = Column(Numeric, nullable=False)
    emi_amount = Column(Numeric, nullable=False)
    tenure_months = Column(Integer, nullable=False)
    prepayment_charges = Column(Numeric)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    purchase = relationship("Purchase", back_populates="loans")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    payment_date = Column(Date, nullable=False)
    amount = Column(Numeric, nullable=False)
    source = Column(String, nullable=False)  # Direct or Loan
    payment_mode = Column(String, nullable=False)  # cash/check/online
    transaction_reference = Column(String)
    milestone = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    purchase = relationship("Purchase", back_populates="payments")
    user = relationship("User", back_populates="payments")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, nullable=False)  # property or purchase
    entity_id = Column(Integer, nullable=False)
    file_path = Column(String, nullable=False)
    document_vector = Column(String)
    metadata = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Add polymorphic relationships
    property_id = Column(Integer, ForeignKey("properties.id"))
    purchase_id = Column(Integer, ForeignKey("purchases.id"))

    # Relationships
    property = relationship("Property", back_populates="documents")
    purchase = relationship("Purchase", back_populates="documents")