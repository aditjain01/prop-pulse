import pytest
from datetime import date, timedelta
from decimal import Decimal

from ..test_utils import (
    create_test_user,
    create_test_payment_source,
    create_test_invoice,
    create_test_payment
)


class TestPaymentsRoutes:
    """Tests for the payments routes."""

    def test_get_payments(self, client, db_session):
        """Test getting all payments."""
        # Create test data
        payment = create_test_payment(db_session)
        
        # Make request
        response = client.get("/payments/")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert data[0]["id"] == payment.id
        assert data[0]["invoice_id"] == payment.invoice_id
        assert data[0]["source_id"] == payment.source_id
        assert float(data[0]["amount"]) == float(payment.amount)
        assert data[0]["payment_mode"] == payment.payment_mode

    def test_get_payment(self, client, db_session):
        """Test getting a specific payment."""
        # Create test data
        payment = create_test_payment(db_session)
        
        # Make request
        response = client.get(f"/payments/{payment.id}")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == payment.id
        assert data["invoice_id"] == payment.invoice_id
        assert data["source_id"] == payment.source_id
        assert float(data["amount"]) == float(payment.amount)
        assert data["payment_mode"] == payment.payment_mode
        assert data["transaction_reference"] == payment.transaction_reference
        assert data["receipt_number"] == payment.receipt_number

    def test_create_payment(self, client, db_session):
        """Test creating a payment."""
        # Create test data
        user = create_test_user(db_session)
        payment_source = create_test_payment_source(db_session, user_id=user.id)
        invoice = create_test_invoice(db_session)
        
        # Prepare request data
        payment_data = {
            "invoice_id": invoice.id,
            "payment_date": str(date.today()),
            "amount": 100000,
            "source_id": payment_source.id,
            "payment_mode": "online",
            "transaction_reference": "TXN-NEW-123",
            "receipt_date": str(date.today()),
            "receipt_number": "REC-NEW-123",
            "notes": "New test payment"
        }
        
        # Make request
        response = client.post("/payments/", json=payment_data)
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert data["invoice_id"] == payment_data["invoice_id"]
        assert data["source_id"] == payment_data["source_id"]
        assert float(data["amount"]) == payment_data["amount"]
        assert data["payment_mode"] == payment_data["payment_mode"]
        assert data["transaction_reference"] == payment_data["transaction_reference"]
        assert data["receipt_number"] == payment_data["receipt_number"]

    def test_update_payment(self, client, db_session):
        """Test updating a payment."""
        # Create test data
        payment = create_test_payment(db_session)
        
        # Prepare update data
        update_data = {
            "amount": 150000,
            "payment_mode": "cheque",
            "transaction_reference": "TXN-UPDATED-456",
            "receipt_number": "REC-UPDATED-456"
        }
        
        # Make request
        response = client.put(f"/payments/{payment.id}", json=update_data)
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert float(data["amount"]) == update_data["amount"]
        assert data["payment_mode"] == update_data["payment_mode"]
        assert data["transaction_reference"] == update_data["transaction_reference"]
        assert data["receipt_number"] == update_data["receipt_number"]
        
        # Original data should be preserved
        assert data["invoice_id"] == payment.invoice_id
        assert data["source_id"] == payment.source_id

    def test_delete_payment(self, client, db_session):
        """Test deleting a payment."""
        # Create test data
        payment = create_test_payment(db_session)
        
        # Make request
        response = client.delete(f"/payments/{payment.id}")
        
        # Check response
        assert response.status_code == 200
        assert response.json()["message"] == "Payment deleted successfully"
        
        # Verify payment is deleted
        get_response = client.get(f"/payments/{payment.id}")
        assert get_response.status_code == 404


class TestPaymentsV2Routes:
    """Tests for the payments v2 routes."""

    def test_get_payments_v2(self, client, db_session):
        """Test getting all payments with v2 endpoint."""
        # Create test data
        payment = create_test_payment(db_session)
        
        # Make request
        response = client.get("/payments/")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check that the response includes the enhanced fields
        assert "property_name" in data[0]
        assert "invoice_number" in data[0]
        assert "source_name" in data[0]
        assert "payment_date" in data[0]
        assert "amount" in data[0]
        assert "payment_mode" in data[0]

    def test_get_payment_v2(self, client, db_session):
        """Test getting a specific payment with v2 endpoint."""
        # Create test data
        payment = create_test_payment(db_session)
        
        # Make request
        response = client.get(f"/payments/{payment.id}")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        
        # Check that the response includes all the enhanced fields
        assert data["id"] == payment.id
        assert "property_name" in data
        assert "invoice_number" in data
        assert "source_name" in data
        assert float(data["amount"]) == float(payment.amount)
        assert data["payment_mode"] == payment.payment_mode
        assert data["transaction_reference"] == payment.transaction_reference
        assert data["receipt_date"] is not None
        assert data["receipt_number"] == payment.receipt_number
        assert data["notes"] == payment.notes 