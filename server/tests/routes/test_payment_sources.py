import pytest
from datetime import date

from ..test_utils import (
    create_test_payment_source,
    create_test_payment
)


class TestPaymentSourcesRoutes:
    """Tests for the payment sources routes."""

    def test_get_payment_sources(self, client, db_session):
        """Test getting all payment sources."""
        # Create test data
        payment_source = create_test_payment_source(db_session)
        
        # Make request
        response = client.get("/payment-sources/")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert data[0]["id"] == payment_source.id
        assert data[0]["name"] == payment_source.name
        assert data[0]["type"] == payment_source.type
        assert data[0]["account_number"] == payment_source.account_number
        assert data[0]["bank_name"] == payment_source.bank_name
        assert data[0]["is_active"] == payment_source.is_active

    def test_get_payment_source(self, client, db_session):
        """Test getting a specific payment source."""
        # Create test data
        payment_source = create_test_payment_source(db_session)
        
        # Make request
        response = client.get(f"/payment-sources/{payment_source.id}")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == payment_source.id
        assert data["name"] == payment_source.name
        assert data["type"] == payment_source.type
        assert data["account_number"] == payment_source.account_number
        assert data["bank_name"] == payment_source.bank_name
        assert data["branch"] == payment_source.branch
        assert data["ifsc_code"] == payment_source.ifsc_code
        assert data["description"] == payment_source.description
        assert data["is_active"] == payment_source.is_active

    def test_create_payment_source(self, client, db_session):
        """Test creating a payment source."""
        # Prepare request data
        payment_source_data = {
            "name": "New Test Account",
            "type": "bank_account",
            "account_number": "9876543210",
            "bank_name": "Test Bank",
            "branch": "Test Branch",
            "ifsc_code": "TEST0001234",
            "description": "Test payment source for unit tests",
            "is_active": True
        }
        
        # Make request
        response = client.post("/payment-sources/", json=payment_source_data)
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == payment_source_data["name"]
        assert data["type"] == payment_source_data["type"]
        assert data["account_number"] == payment_source_data["account_number"]
        assert data["bank_name"] == payment_source_data["bank_name"]
        assert data["branch"] == payment_source_data["branch"]
        assert data["ifsc_code"] == payment_source_data["ifsc_code"]
        assert data["description"] == payment_source_data["description"]
        assert data["is_active"] == payment_source_data["is_active"]

    def test_update_payment_source(self, client, db_session):
        """Test updating a payment source."""
        # Create test data
        payment_source = create_test_payment_source(db_session)
        
        # Prepare update data
        update_data = {
            "name": "Updated Test Account",
            "bank_name": "Updated Bank",
            "description": "Updated description",
            "is_active": False
        }
        
        # Make request
        response = client.put(f"/payment-sources/{payment_source.id}", json=update_data)
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["bank_name"] == update_data["bank_name"]
        assert data["description"] == update_data["description"]
        assert data["is_active"] == update_data["is_active"]
        
        # Original data should be preserved
        assert data["type"] == payment_source.type
        assert data["account_number"] == payment_source.account_number
        assert data["branch"] == payment_source.branch
        assert data["ifsc_code"] == payment_source.ifsc_code

    def test_delete_payment_source(self, client, db_session):
        """Test deleting a payment source."""
        # Create test data
        payment_source = create_test_payment_source(db_session)
        
        # Make request
        response = client.delete(f"/payment-sources/{payment_source.id}")
        
        # Check response
        assert response.status_code == 200
        assert response.json()["message"] == "Payment source deleted successfully"
        
        # Verify payment source is deleted
        get_response = client.get(f"/payment-sources/{payment_source.id}")
        assert get_response.status_code == 404

    def test_payment_source_with_payments(self, client, db_session):
        """Test that a payment source with associated payments can't be deleted."""
        # Create test data
        payment_source = create_test_payment_source(db_session)
        
        # Create a payment using this payment source
        payment = create_test_payment(db_session, source_id=payment_source.id)
        
        # Try to delete the payment source
        response = client.delete(f"/payment-sources/{payment_source.id}")
        
        # Check response - should fail with 400 Bad Request
        assert response.status_code == 400
        assert "Cannot delete payment source" in response.json()["detail"]
        
        # Verify payment source still exists
        get_response = client.get(f"/payment-sources/{payment_source.id}")
        assert get_response.status_code == 200


class TestPaymentSourcesV2Routes:
    """Tests for the payment sources v2 routes."""

    def test_get_payment_sources_v2(self, client, db_session):
        """Test getting all payment sources with v2 endpoint."""
        # Create test data
        payment_source = create_test_payment_source(db_session)
        
        # Create a payment using this payment source
        payment = create_test_payment(db_session, source_id=payment_source.id)
        
        # Make request
        response = client.get("/v2/payment-sources/")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check that the response includes the essential fields
        assert data[0]["id"] == payment_source.id
        assert data[0]["name"] == payment_source.name
        assert data[0]["type"] == payment_source.type
        assert data[0]["account_number"] == payment_source.account_number
        assert data[0]["bank_name"] == payment_source.bank_name
        assert data[0]["is_active"] == payment_source.is_active
        
        # Check for enhanced fields in v2
        assert "total_payments" in data[0]
        assert data[0]["total_payments"] >= 1  # We created at least one payment
        assert "last_payment_date" in data[0]

    def test_get_payment_sources_v2_with_filters(self, client, db_session):
        """Test getting payment sources with filters using v2 endpoint."""
        # Create test data - one active and one inactive payment source
        active_source = create_test_payment_source(db_session, name="Active Source", is_active=True)
        inactive_source = create_test_payment_source(db_session, name="Inactive Source", is_active=False)
        
        # Test filter by is_active
        response = client.get("/v2/payment-sources/?is_active=true")
        data = response.json()
        active_sources = [s for s in data if s["is_active"] is True]
        inactive_sources = [s for s in data if s["is_active"] is False]
        assert len(active_sources) >= 1
        assert len(inactive_sources) == 0
        
        # Test filter by type
        response = client.get(f"/v2/payment-sources/?type={active_source.type}")
        data = response.json()
        assert len(data) >= 1
        assert all(s["type"] == active_source.type for s in data)
        
        # Test filter by name (partial match)
        response = client.get("/v2/payment-sources/?name=Active")
        data = response.json()
        assert len(data) >= 1
        assert any(s["id"] == active_source.id for s in data)
        assert not any(s["id"] == inactive_source.id for s in data)

    def test_get_payment_source_v2(self, client, db_session):
        """Test getting a specific payment source with v2 endpoint."""
        # Create test data
        payment_source = create_test_payment_source(db_session)
        
        # Create multiple payments using this payment source
        payment1 = create_test_payment(db_session, source_id=payment_source.id, amount=10000)
        payment2 = create_test_payment(db_session, source_id=payment_source.id, amount=20000)
        
        # Make request
        response = client.get(f"/v2/payment-sources/{payment_source.id}")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        
        # Check that the response includes all the essential fields
        assert data["id"] == payment_source.id
        assert data["name"] == payment_source.name
        assert data["type"] == payment_source.type
        assert data["account_number"] == payment_source.account_number
        assert data["bank_name"] == payment_source.bank_name
        assert data["branch"] == payment_source.branch
        assert data["ifsc_code"] == payment_source.ifsc_code
        assert data["description"] == payment_source.description
        assert data["is_active"] == payment_source.is_active
        
        # Check for enhanced fields in v2
        assert "total_payments" in data
        assert data["total_payments"] >= 2  # We created at least two payments
        assert "last_payment_date" in data
        assert "total_amount" in data
        assert float(data["total_amount"]) >= 30000  # Sum of payment1 and payment2
        
        # Check for recent payments list
        assert "recent_payments" in data
        assert isinstance(data["recent_payments"], list)
        assert len(data["recent_payments"]) >= 2 