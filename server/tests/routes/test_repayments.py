import pytest
from datetime import date, timedelta
from decimal import Decimal

from src.database import models
from ..test_utils import (
    create_test_loan,
    create_test_payment_source,
    create_test_loan_repayment
)


class TestRepaymentsRoutes:
    """Tests for the repayments routes."""

    def test_get_loan_repayments(self, client, db_session):
        """Test getting all loan repayments."""
        # Create test data
        repayment = create_test_loan_repayment(db_session)
        
        # Make request
        response = client.get("/repayments/")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert data[0]["id"] == repayment.id
        assert data[0]["loan_id"] == repayment.loan_id
        assert data[0]["source_id"] == repayment.source_id
        assert float(data[0]["principal_amount"]) == float(repayment.principal_amount)
        assert float(data[0]["interest_amount"]) == float(repayment.interest_amount)

    def test_get_loan_repayments_with_filters(self, client, db_session):
        """Test getting loan repayments with filters."""
        # Create test data
        loan = create_test_loan(db_session)
        payment_source = create_test_payment_source(db_session, user_id=loan.user_id)
        
        # Create two repayments with different dates
        repayment1 = create_test_loan_repayment(
            db_session, 
            loan_id=loan.id, 
            source_id=payment_source.id
        )
        
        # Create a second repayment with a different date
        repayment2 = models.LoanRepayment(
            loan_id=loan.id,
            payment_date=date.today() - timedelta(days=30),  # Older date
            principal_amount=Decimal("10000"),
            interest_amount=Decimal("15000"),
            other_fees=Decimal("500"),
            penalties=Decimal("0"),
            source_id=payment_source.id,
            payment_mode="cheque",
            transaction_reference="TXN456789",
            notes="Older repayment"
        )
        db_session.add(repayment2)
        db_session.commit()
        
        # Test filter by loan_id
        response = client.get(f"/repayments/?loan_id={loan.id}")
        data = response.json()
        assert len(data) == 2
        
        # Test filter by source_id
        response = client.get(f"/repayments/?source_id={payment_source.id}")
        data = response.json()
        assert len(data) == 2
        
        # Test filter by date range
        from_date = (date.today() - timedelta(days=10)).isoformat()
        response = client.get(f"/repayments/?from_date={from_date}")
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == repayment1.id
        
        to_date = (date.today() - timedelta(days=20)).isoformat()
        response = client.get(f"/repayments/?to_date={to_date}")
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == repayment2.id

    def test_get_loan_repayment(self, client, db_session):
        """Test getting a specific loan repayment."""
        # Create test data
        repayment = create_test_loan_repayment(db_session)
        
        # Make request
        response = client.get(f"/repayments/{repayment.id}")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == repayment.id
        assert data["loan_id"] == repayment.loan_id
        assert data["source_id"] == repayment.source_id
        assert float(data["principal_amount"]) == float(repayment.principal_amount)
        assert float(data["interest_amount"]) == float(repayment.interest_amount)
        assert float(data["total_payment"]) == float(repayment.total_payment)

    def test_create_loan_repayment(self, client, db_session):
        """Test creating a loan repayment."""
        # Create test data
        loan = create_test_loan(db_session)
        payment_source = create_test_payment_source(db_session, user_id=loan.user_id)
        
        # Prepare request data
        repayment_data = {
            "loan_id": loan.id,
            "payment_date": str(date.today()),
            "principal_amount": 20000,
            "interest_amount": 25000,
            "other_fees": 2000,
            "penalties": 0,
            "source_id": payment_source.id,
            "payment_mode": "online",
            "transaction_reference": "TXN-NEW-123",
            "notes": "New test repayment"
        }
        
        # Make request
        response = client.post("/repayments/", json=repayment_data)
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert data["loan_id"] == repayment_data["loan_id"]
        assert data["source_id"] == repayment_data["source_id"]
        assert float(data["principal_amount"]) == repayment_data["principal_amount"]
        assert float(data["interest_amount"]) == repayment_data["interest_amount"]
        assert float(data["other_fees"]) == repayment_data["other_fees"]
        assert data["payment_mode"] == repayment_data["payment_mode"]
        assert data["transaction_reference"] == repayment_data["transaction_reference"]
        
        # Check total_payment calculation
        expected_total = (
            repayment_data["principal_amount"] + 
            repayment_data["interest_amount"] + 
            repayment_data["other_fees"] + 
            repayment_data["penalties"]
        )
        assert float(data["total_payment"]) == expected_total

    def test_update_loan_repayment(self, client, db_session):
        """Test updating a loan repayment."""
        # Create test data
        repayment = create_test_loan_repayment(db_session)
        
        # Prepare update data
        update_data = {
            "principal_amount": 25000,
            "interest_amount": 30000,
            "payment_mode": "cheque",
            "transaction_reference": "TXN-UPDATED-456"
        }
        
        # Make request
        response = client.put(f"/repayments/{repayment.id}", json=update_data)
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert float(data["principal_amount"]) == update_data["principal_amount"]
        assert float(data["interest_amount"]) == update_data["interest_amount"]
        assert data["payment_mode"] == update_data["payment_mode"]
        assert data["transaction_reference"] == update_data["transaction_reference"]
        
        # Original data should be preserved
        assert data["loan_id"] == repayment.loan_id
        assert data["source_id"] == repayment.source_id
        
        # Check total_payment recalculation
        expected_total = (
            update_data["principal_amount"] + 
            update_data["interest_amount"] + 
            float(repayment.other_fees) + 
            float(repayment.penalties)
        )
        assert float(data["total_payment"]) == expected_total

    def test_delete_loan_repayment(self, client, db_session):
        """Test deleting a loan repayment."""
        # Create test data
        repayment = create_test_loan_repayment(db_session)
        
        # Make request
        response = client.delete(f"/repayments/{repayment.id}")
        
        # Check response
        assert response.status_code == 200
        assert response.json()["message"] == "Loan repayment deleted successfully"
        
        # Verify repayment is deleted
        get_response = client.get(f"/repayments/{repayment.id}")
        assert get_response.status_code == 404


class TestRepaymentsV2Routes:
    """Tests for the repayments v2 routes."""

    def test_get_loan_repayments_v2(self, client, db_session):
        """Test getting all loan repayments with v2 endpoint."""
        # Create test data
        repayment = create_test_loan_repayment(db_session)
        
        # Make request
        response = client.get("/v2/repayments/")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check that the response includes the enhanced fields
        assert "loan_name" in data[0]
        assert "source_name" in data[0]
        assert "property_name" in data[0]
        assert "loan_institution" in data[0]
        assert "total_payment" in data[0]
        assert "payment_date" in data[0]
        assert "payment_mode" in data[0]

    def test_get_loan_repayments_v2_with_filters(self, client, db_session):
        """Test getting loan repayments with filters using v2 endpoint."""
        # Create test data
        loan = create_test_loan(db_session)
        payment_source = create_test_payment_source(db_session, user_id=loan.user_id)
        
        # Create two repayments with different amounts
        repayment1 = create_test_loan_repayment(
            db_session, 
            loan_id=loan.id, 
            source_id=payment_source.id
        )
        
        # Create a second loan and repayment
        loan2 = create_test_loan(db_session)
        repayment2 = create_test_loan_repayment(db_session, loan_id=loan2.id)
        
        # Test filter by loan_id
        response = client.get(f"/v2/repayments/?loan_id={loan.id}")
        data = response.json()
        assert len(data) == 1
        assert data[0]["loan_name"] == "Test Loan"  # From test_utils
        
        # Test filter by source_id
        response = client.get(f"/v2/repayments/?source_id={payment_source.id}")
        data = response.json()
        assert len(data) == 1
        
        # Test filter by amount range
        min_amount = float(repayment1.total_payment) - 1
        response = client.get(f"/v2/repayments/?min_amount={min_amount}")
        data = response.json()
        assert len(data) >= 1
        
        # Very high amount should return no results
        response = client.get("/v2/repayments/?min_amount=10000000")
        data = response.json()
        assert len(data) == 0

    def test_get_loan_repayment_v2(self, client, db_session):
        """Test getting a specific loan repayment with v2 endpoint."""
        # Create test data
        repayment = create_test_loan_repayment(db_session)
        
        # Make request
        response = client.get(f"/v2/repayments/{repayment.id}")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        
        # Check that the response includes all the enhanced fields
        assert data["id"] == repayment.id
        assert "loan_name" in data
        assert "loan_institution" in data
        assert "property_name" in data
        assert "purchase_id" in data
        assert "source_name" in data
        assert float(data["total_payment"]) == float(repayment.total_payment)
        assert float(data["principal_amount"]) == float(repayment.principal_amount)
        assert float(data["interest_amount"]) == float(repayment.interest_amount)
        assert float(data["other_fees"]) == float(repayment.other_fees)
        assert float(data["penalties"]) == float(repayment.penalties)
        assert data["payment_mode"] == repayment.payment_mode
        assert data["transaction_reference"] == repayment.transaction_reference
        assert data["notes"] == repayment.notes 