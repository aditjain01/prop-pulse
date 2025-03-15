from datetime import date, datetime, timedelta
from decimal import Decimal
from src.database import models


def create_test_user(db):
    """Create a test user in the database."""
    user = models.User(
        username="testuser",
        password="password",
        email="test@example.com"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_test_property(db):
    """Create a test property in the database."""
    property = models.Property(
        name="Test Property",
        address="123 Test Street",
        property_type="Apartment",
        carpet_area=1000,
        exclusive_area=200,
        common_area=100,
        floor_number=5,
        parking_details="2 covered",
        amenities=["Pool", "Gym"],
        initial_rate=Decimal("5000"),
        current_rate=Decimal("5500"),
        developer="Test Developer",
        rera_id="TEST123456"
    )
    db.add(property)
    db.commit()
    db.refresh(property)
    return property


def create_test_purchase(db, property_id=None, user_id=None):
    """Create a test purchase in the database."""
    if not property_id:
        property = create_test_property(db)
        property_id = property.id
    
    if not user_id:
        user = create_test_user(db)
        user_id = user.id
    
    purchase = models.Purchase(
        property_id=property_id,
        user_id=user_id,
        base_cost=Decimal("5000000"),
        other_charges=Decimal("200000"),
        ifms=Decimal("50000"),
        lease_rent=Decimal("20000"),
        amc=Decimal("10000"),
        gst=Decimal("250000"),
        purchase_date=date.today() - timedelta(days=30),
        registration_date=date.today() - timedelta(days=15),
        possession_date=date.today() + timedelta(days=30),
        seller="Test Seller"
    )
    db.add(purchase)
    db.commit()
    db.refresh(purchase)
    return purchase


def create_test_loan(db, purchase_id=None, user_id=None):
    """Create a test loan in the database."""
    if not purchase_id:
        purchase = create_test_purchase(db)
        purchase_id = purchase.id
        user_id = purchase.user_id
    
    loan = models.Loan(
        purchase_id=purchase_id,
        user_id=user_id,
        name="Test Loan",
        institution="Test Bank",
        agent="Test Agent",
        sanction_date=date.today() - timedelta(days=20),
        sanction_amount=Decimal("4000000"),
        total_disbursed_amount=Decimal("3500000"),
        processing_fee=Decimal("40000"),
        other_charges=Decimal("10000"),
        loan_sanction_charges=Decimal("5000"),
        interest_rate=Decimal("7.5"),
        tenure_months=240,
        is_active=True
    )
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return loan


def create_test_payment_source(db, user_id=None, loan_id=None):
    """Create a test payment source in the database."""
    if not user_id:
        user = create_test_user(db)
        user_id = user.id
    
    payment_source = models.PaymentSource(
        user_id=user_id,
        name="Test Payment Source",
        source_type="bank_account",
        description="Test description",
        is_active=True,
        bank_name="Test Bank",
        account_number="XXXX1234",
        ifsc_code="TEST1234",
        branch="Test Branch",
        loan_id=loan_id
    )
    db.add(payment_source)
    db.commit()
    db.refresh(payment_source)
    return payment_source


def create_test_invoice(db, purchase_id=None):
    """Create a test invoice in the database."""
    if not purchase_id:
        purchase = create_test_purchase(db)
        purchase_id = purchase.id
    
    invoice = models.Invoice(
        purchase_id=purchase_id,
        invoice_number="INV-001",
        invoice_date=date.today() - timedelta(days=10),
        due_date=date.today() + timedelta(days=20),
        amount=Decimal("500000"),
        status="pending",
        milestone="Booking",
        description="Booking amount for the property"
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


def create_test_payment(db, invoice_id=None, source_id=None, user_id=None):
    """Create a test payment in the database."""
    if not invoice_id:
        invoice = create_test_invoice(db)
        invoice_id = invoice.id
    
    if not user_id:
        user = create_test_user(db)
        user_id = user.id
    
    if not source_id:
        payment_source = create_test_payment_source(db, user_id=user_id)
        source_id = payment_source.id
    
    payment = models.Payment(
        invoice_id=invoice_id,
        user_id=user_id,
        source_id=source_id,
        payment_date=date.today() - timedelta(days=5),
        amount=Decimal("250000"),
        payment_mode="online",
        transaction_reference="TXN123456",
        receipt_date=date.today() - timedelta(days=4),
        receipt_number="REC-001",
        notes="Test payment"
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def create_test_loan_repayment(db, loan_id=None, source_id=None):
    """Create a test loan repayment in the database."""
    if not loan_id:
        loan = create_test_loan(db)
        loan_id = loan.id
        user_id = loan.user_id
    else:
        loan = db.query(models.Loan).filter(models.Loan.id == loan_id).first()
        user_id = loan.user_id
    
    if not source_id:
        payment_source = create_test_payment_source(db, user_id=user_id)
        source_id = payment_source.id
    
    repayment = models.LoanRepayment(
        loan_id=loan_id,
        payment_date=date.today() - timedelta(days=5),
        principal_amount=Decimal("15000"),
        interest_amount=Decimal("20000"),
        other_fees=Decimal("1000"),
        penalties=Decimal("0"),
        source_id=source_id,
        payment_mode="online",
        transaction_reference="TXN789012",
        notes="Test loan repayment"
    )
    db.add(repayment)
    db.commit()
    db.refresh(repayment)
    return repayment 