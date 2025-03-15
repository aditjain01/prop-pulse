import pytest
from datetime import date, timedelta
from decimal import Decimal

from ..test_utils import (
    create_test_user,
    create_test_property,
    create_test_purchase,
    create_test_loan
)


class TestLoansRoutes:
    """Tests for the loans routes."""

    def test_get_loans(self, client, db_session):
        """Test getting all loans."""
        # Create test data
        loan = create_test_loan(db_session)
        
        # Make request
        response = client.get("/loans/")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert data[0]["id"] == loan.id
        assert data[0]["name"] == loan.name
        assert data[0]["institution"] == loan.institution

    def test_get_loan(self, client, db_session):
        """Test getting a specific loan."""
        # Create test data
        loan = create_test_loan(db_session)
        
        # Make request
        response = client.get(f"/loans/{loan.id}")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == loan.id
        assert data["name"] == loan.name
        assert data["institution"] == loan.institution
        assert data["purchase_id"] == loan.purchase_id

    def test_create_loan(self, client, db_session):
        """Test creating a loan."""
        # Create test data
        purchase = create_test_purchase(db_session)
        
        # Prepare request data
        loan_data = {
            "purchase_id": purchase.id,
            "name": "New Test Loan",
            "institution": "New Test Bank",
            "agent": "New Test Agent",
            "sanction_date": str(date.today()),
            "sanction_amount": 3000000,
            "interest_rate": 8.5,
            "tenure_months": 180,
            "is_active": True
        }
        
        # Make request
        response = client.post("/loans/", json=loan_data)
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == loan_data["name"]
        assert data["institution"] == loan_data["institution"]
        assert data["purchase_id"] == purchase.id
        
        # Verify a payment source was created for the loan
        payment_sources_response = client.get("/payment-sources/")
        payment_sources = payment_sources_response.json()
        assert any(ps["loan_id"] == data["id"] for ps in payment_sources)

    def test_update_loan(self, client, db_session):
        """Test updating a loan."""
        # Create test data
        loan = create_test_loan(db_session)
        
        # Prepare update data
        update_data = {
            "name": "Updated Loan Name",
            "institution": "Updated Bank",
            "is_active": False
        }
        
        # Make request
        response = client.put(f"/loans/{loan.id}", json=update_data)
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["institution"] == update_data["institution"]
        assert data["is_active"] == update_data["is_active"]
        
        # Original data should be preserved
        assert data["purchase_id"] == loan.purchase_id
        assert data["sanction_amount"] == float(loan.sanction_amount)

    def test_delete_loan(self, client, db_session):
        """Test deleting a loan."""
        # Create test data
        loan = create_test_loan(db_session)
        
        # Make request
        response = client.delete(f"/loans/{loan.id}")
        
        # Check response
        assert response.status_code == 200
        assert response.json()["message"] == "Loan deleted successfully"
        
        # Verify loan is deleted
        get_response = client.get(f"/loans/{loan.id}")
        assert get_response.status_code == 404


class TestLoansV2Routes:
    """Tests for the loans v2 routes."""

    def test_get_loans_v2(self, client, db_session):
        """Test getting all loans with v2 endpoint."""
        # Create test data
        loan = create_test_loan(db_session)
        
        # Make request
        response = client.get("/v2/loans/")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert data[0]["id"] == loan.id
        assert data[0]["name"] == loan.name
        assert data[0]["institution"] == loan.institution
        assert data[0]["total_disbursed_amount"] == float(loan.total_disbursed_amount)
        assert data[0]["sanction_amount"] == float(loan.sanction_amount)
        assert data[0]["is_active"] == loan.is_active

    def test_get_loans_v2_with_filters(self, client, db_session):
        """Test getting loans with filters using v2 endpoint."""
        # Create test data
        loan1 = create_test_loan(db_session)
        
        # Create another loan with different values
        purchase2 = create_test_purchase(db_session)
        loan2 = create_test_loan(
            db_session, 
            purchase_id=purchase2.id,
            user_id=purchase2.user_id
        )
        
        # Update loan2 to have different values
        loan2.sanction_amount = Decimal("2000000")
        loan2.is_active = False
        db_session.commit()
        
        # Test filter by purchase_id
        response = client.get(f"/v2/loans/?purchase_id={loan1.purchase_id}")
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == loan1.id
        
        # Test filter by is_active
        response = client.get("/v2/loans/?is_active=false")
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == loan2.id
        assert data[0]["is_active"] == False
        
        # Test filter by amount range
        response = client.get("/v2/loans/?from_amount=3000000")
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == loan1.id
        
        response = client.get("/v2/loans/?to_amount=2500000")
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == loan2.id

    def test_get_loan_v2(self, client, db_session):
        """Test getting a specific loan with v2 endpoint."""
        # Create test data
        loan = create_test_loan(db_session)
        
        # Make request
        response = client.get(f"/v2/loans/{loan.id}")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == loan.id
        assert data["name"] == loan.name
        assert data["institution"] == loan.institution
        assert data["property_name"] is not None  # Should include property name
        assert data["processing_fee"] == float(loan.processing_fee)
        assert data["other_charges"] == float(loan.other_charges)
        assert data["loan_sanction_charges"] == float(loan.loan_sanction_charges)
        assert data["interest_rate"] == float(loan.interest_rate)
        assert data["tenure_months"] == loan.tenure_months 