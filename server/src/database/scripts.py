from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from .models import ConstructionStatus, User
from .base import SQLALCHEMY_DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_construction_status():
    db = SessionLocal()

    # Create construction status options
    statuses = [
        "Pre-Development",
        "RERA Approved",
        "Under Construction",
        "Super Structure Ready",
        "Interiors",
        "Ready to Move",
        "Completed",
    ]

    # Check if there are already entries in the construction_status table
    existing_count = db.query(ConstructionStatus).count()

    if existing_count == 0:
        for status in statuses:
            db_status = ConstructionStatus(name=status)
            db.add(db_status)
        db.commit()
        print("Construction status table initialized successfully.")
    else:
        print("Construction status table already has data, skipping initialization.")

    db.close()


def init_example_user():
    db = SessionLocal()

    # Check if example user already exists
    existing_user = db.query(User).filter(User.id == 1).first()

    if not existing_user:
        # Create example user
        example_user = User(
            username="example_user",
            password="securepassword123",  # In production, this should be hashed
            email="example@example.com",
        )
        db.add(example_user)
        db.commit()
        print("Example user created successfully.")
    else:
        print("Example user already exists, skipping creation.")

    db.close()


def init_views():
    db = SessionLocal()

    try:
        # Create acquisition_cost_details view
        db.execute(
            text("""
        CREATE OR REPLACE VIEW acquisition_cost_details AS
        --- These are payments from me (to either Builder or Bank)
        SELECT 
            l.user_id, 
            l.purchase_id,
            r.payment_date, 
            r.principal_amount as principal,
            r.interest_amount as interest,
            r.total_payment - (r.principal_amount + r.interest_amount) as others,
            r.total_payment AS payment, 
            s.name AS source, 
            r.payment_mode AS mode, 
            r.transaction_reference AS reference,
            'Loan Repayment' AS type
        FROM loan_repayments AS r
        JOIN loans AS l ON r.loan_id = l.id
        JOIN payment_sources AS s ON r.source_id = s.id
        ---Loan Payments against Property to Bank
        UNION ALL
        -- Direct Payments (only) to Developer
        SELECT 
            p.user_id, 
            p.purchase_id,
            p.created_at AS payment_date, 
            p.amount as principal,
            0 as interest,
            0 as others,
            p.amount as payment, 
            s.name AS source, 
            p.payment_mode AS mode, 
            p.transaction_reference AS reference,
            'Direct Payment' AS type
        FROM payments AS p
        JOIN payment_sources AS s ON p.source_id = s.id
        WHERE s.source_type <> 'loan';
        """)
        )

        # Create acquisition_cost_summary view
        db.execute(
            text("""
        CREATE OR REPLACE VIEW acquisition_cost_summary AS
        WITH combined AS (
            SELECT 
                l.purchase_id,
                r.payment_date,
                r.principal_amount AS loan_principal,
                r.interest_amount AS loan_interest,
                r.total_payment - (r.principal_amount + r.interest_amount) AS loan_others,
                r.total_payment AS loan_payment,
                0 as builder_principal,
                0 as builder_payment
            FROM loan_repayments AS r
            JOIN loans AS l ON r.loan_id = l.id
            UNION ALL
            SELECT 
                p.purchase_id,
                p.created_at AS payment_date,
                0 as loan_principal,
                0 as loan_interest,
                0 as loan_others,
                0 as loan_payment,
                p.amount AS builder_principal,
                p.amount AS builder_payment
            FROM payments AS p
            JOIN payment_sources AS s ON p.source_id = s.id
            WHERE s.source_type <> 'loan'
        )
        SELECT 
            pu.id as purchase_id,
            pu.user_id as user_id,
            pr.name AS property_name,
            SUM(combined.loan_principal) AS total_loan_principal,
            SUM(combined.loan_interest) AS total_loan_interest,
            SUM(combined.loan_others) AS total_loan_others,
            SUM(combined.loan_payment) AS total_loan_payment,
            SUM(combined.builder_principal) AS total_builder_principal,
            SUM(combined.builder_payment) AS total_builder_payment,
            SUM(combined.loan_principal) + SUM(combined.builder_principal) AS total_principal_payment,
            SUM(combined.builder_payment) + SUM(combined.loan_payment) AS total_payment,
            pu.total_sale_cost as total_sale_cost,
            pu.total_sale_cost - SUM(combined.builder_principal) - SUM(combined.loan_principal) AS remaining_balance
        FROM purchases AS pu
        LEFT JOIN combined ON combined.purchase_id = pu.id
        LEFT JOIN properties AS pr ON pu.property_id = pr.id
        GROUP BY pu.id, pu.user_id, pr.name;
        """)
        )

        # Create purchase_payment_details view
        db.execute(
            text("""
        CREATE OR REPLACE VIEW purchase_payment_details AS
        --- These are payments to the Builder (from any source)
        SELECT
            pu.user_id,
            pr.name,
            p.amount AS paid_amount,
            p.invoice_amount AS invoice_amount,
            p.receipt_amount AS receipt_amount,
            p.payment_date,
            pu.total_sale_cost,
            SUM(pu.total_sale_cost) OVER (PARTITION BY pu.user_id ORDER BY p.payment_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) - SUM(p.amount) OVER (PARTITION BY pu.user_id ORDER BY p.payment_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS balance
        FROM
            payments AS p
            JOIN purchases AS pu ON p.purchase_id = pu.id
            JOIN properties AS pr ON pu.property_id = pr.id
        ORDER BY
            pu.user_id,
            pr.name,
            p.payment_date;
        """)
        )

        # Create purchase_summary view
        db.execute(
            text("""
        CREATE OR REPLACE VIEW purchase_summary AS
        SELECT
            pu.user_id,
            pr.name,
            sum(p.amount) as total_paid_amount,
            sum(p.invoice_amount) as total_invoice_amount,
            sum(p.receipt_amount) as total_receipt_amount,
            max(p.payment_date) as last_payment_date,
            pu.property_cost,
            pu.total_cost,
            pu.total_sale_cost,
            pu.purchase_date,
            pu.registration_date,
            pu.possession_date,
            pu.total_sale_cost - sum(p.amount) as balance
        FROM
            purchases as pu
            JOIN payments as p on p.purchase_id = pu.id
            JOIN properties as pr on pu.property_id = pr.id
        GROUP BY
            pu.user_id,
            pu.id,
            pr.name;
        """)
        )

        # Create loan_repayment_details view
        db.execute(
            text("""
        CREATE OR REPLACE VIEW loan_repayment_details AS
        SELECT
            l.user_id,
            l.name AS loan_name,
            l.sanction_amount AS loan_sanctioned_amount,
            l.total_disbursed_amount AS loan_disbursed_amount,
            l.sanction_amount - l.total_disbursed_amount AS loan_outstanding_amount,
            r.payment_date,
            r.principal_amount AS principal_amount,
            r.interest_amount AS interest_amount,
            r.other_fees AS other_fees,
            r.penalties AS penalties,
            r.total_payment AS amount,
            SUM(r.principal_amount) OVER (PARTITION BY l.user_id, l.id ORDER BY r.payment_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS total_principal_paid,
            SUM(r.total_payment) OVER (PARTITION BY l.user_id, l.id ORDER BY r.payment_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS total_paid,
            l.total_disbursed_amount - SUM(r.principal_amount) OVER (PARTITION BY l.user_id, l.id ORDER BY r.payment_date) AS principal_balance
        FROM
            loan_repayments AS r
        JOIN loans AS l ON r.loan_id = l.id
        ORDER BY
            l.user_id,
            l.id,
            r.payment_date;
        """)
        )

        # Create loan_repayment_summary view
        db.execute(
            text("""
        CREATE OR REPLACE VIEW loan_repayment_summary AS
        SELECT
            l.user_id,
            l.id AS loan_id,
            l.name AS loan_name,
            pr.name AS property_name,
            l.sanction_amount AS loan_sanctioned_amount,
            l.total_disbursed_amount AS loan_disbursed_amount,
            SUM(r.principal_amount) AS total_principal_paid,
            SUM(r.interest_amount) AS total_interest_paid,
            SUM(r.other_fees) AS total_other_fees,
            SUM(r.penalties) AS total_penalties,
            SUM(r.total_payment) AS total_amount_paid,
            COUNT(r.id) AS total_payments,
            MAX(r.payment_date) AS last_repayment_date, 
            l.total_disbursed_amount - SUM(r.principal_amount) AS principal_balance
        FROM
            loan_repayments AS r
        JOIN loans AS l ON r.loan_id = l.id
        JOIN purchases AS p ON l.purchase_id = p.id
        JOIN properties AS pr ON p.property_id = pr.id
        GROUP BY
            l.user_id, l.id, l.name, pr.name;
        """)
        )

        db.commit()
        print("Database views created successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error creating views: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    init_construction_status()
    init_example_user()
