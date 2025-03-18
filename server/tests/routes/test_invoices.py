import pytest
from datetime import date, timedelta
from decimal import Decimal

from ..test_utils import (
    create_test_purchase,
    create_test_invoice,
    create_test_payment
)


class TestInvoicesRoutes:
    """Tests for the invoices routes."""

    def test_get_invoices(self, client, db_session):
        """Test getting all invoices."""
        # Create test data
        invoice = create_test_invoice(db_session)
        
        # Make request
        response = client.get("/invoices/")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert data[0]["id"] == invoice.id
        assert data[0]["purchase_id"] == invoice.purchase_id
        assert data[0]["invoice_number"] == invoice.invoice_number
        assert data[0]["invoice_date"] == invoice.invoice_date.isoformat()
        assert float(data[0]["amount"]) == float(invoice.amount)
        assert data[0]["status"] == invoice.status
        assert data[0]["milestone"] == invoice.milestone

    def test_get_invoices_with_filters(self, client, db_session):
        """Test getting invoices with filters."""
        # Create test data
        purchase = create_test_purchase(db_session)
        
        # Create two invoices with different statuses and milestones
        invoice1 = create_test_invoice(db_session, purchase_id=purchase.id)
        
        invoice2 = create_test_invoice(db_session, purchase_id=purchase.id)
        invoice2.invoice_number = "INV-002"
        invoice2.status = "paid"
        invoice2.milestone = "Possession"
        invoice2.invoice_date = date.today() - timedelta(days=30)  # Older date
        db_session.commit()
        
        # Test filter by purchase_id
        response = client.get(f"/invoices/?purchase_id={purchase.id}")
        data = response.json()
        assert len(data) == 2
        
        # Test filter by status
        response = client.get("/invoices/?status=paid")
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == invoice2.id
        
        # Test filter by milestone
        response = client.get("/invoices/?milestone=Booking")
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == invoice1.id
        
        # Test filter by date range
        from_date = (date.today() - timedelta(days=20)).isoformat()
        response = client.get(f"/invoices/?from_date={from_date}")
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == invoice1.id
        
        to_date = (date.today() - timedelta(days=20)).isoformat()
        response = client.get(f"/invoices/?to_date={to_date}")
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == invoice2.id

    def test_get_invoice(self, client, db_session):
        """Test getting a specific invoice."""
        # Create test data
        invoice = create_test_invoice(db_session)
        
        # Make request
        response = client.get(f"/invoices/{invoice.id}")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == invoice.id
        assert data["purchase_id"] == invoice.purchase_id
        assert data["invoice_number"] == invoice.invoice_number
        assert data["invoice_date"] == invoice.invoice_date.isoformat()
        assert data["due_date"] == invoice.due_date.isoformat()
        assert float(data["amount"]) == float(invoice.amount)
        assert data["status"] == invoice.status
        assert data["milestone"] == invoice.milestone
        assert data["description"] == invoice.description
        assert float(data["paid_amount"]) == float(invoice.paid_amount)

    def test_create_invoice(self, client, db_session):
        """Test creating an invoice."""
        # Create test data
        purchase = create_test_purchase(db_session)
        
        # Prepare request data
        invoice_data = {
            "purchase_id": purchase.id,
            "invoice_number": "INV-NEW-001",
            "invoice_date": str(date.today()),
            "due_date": str(date.today() + timedelta(days=30)),
            "amount": 300000,
            "status": "pending",
            "milestone": "Construction",
            "description": "Payment for construction milestone"
        }
        
        # Make request
        response = client.post("/invoices/", json=invoice_data)
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert data["purchase_id"] == invoice_data["purchase_id"]
        assert data["invoice_number"] == invoice_data["invoice_number"]
        assert data["invoice_date"] == invoice_data["invoice_date"]
        assert data["due_date"] == invoice_data["due_date"]
        assert float(data["amount"]) == invoice_data["amount"]
        assert data["status"] == invoice_data["status"]
        assert data["milestone"] == invoice_data["milestone"]
        assert data["description"] == invoice_data["description"]
        assert float(data["paid_amount"]) == 0  # Default value

    def test_update_invoice(self, client, db_session):
        """Test updating an invoice."""
        # Create test data
        invoice = create_test_invoice(db_session)
        
        # Prepare update data
        update_data = {
            "amount": 600000,
            "status": "partially_paid",
            "milestone": "Updated Milestone",
            "description": "Updated description"
        }
        
        # Make request
        response = client.put(f"/invoices/{invoice.id}", json=update_data)
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert float(data["amount"]) == update_data["amount"]
        assert data["status"] == update_data["status"]
        assert data["milestone"] == update_data["milestone"]
        assert data["description"] == update_data["description"]
        
        # Original data should be preserved
        assert data["purchase_id"] == invoice.purchase_id
        assert data["invoice_number"] == invoice.invoice_number
        assert data["invoice_date"] == invoice.invoice_date.isoformat()

    def test_delete_invoice(self, client, db_session):
        """Test deleting an invoice."""
        # Create test data
        invoice = create_test_invoice(db_session)
        
        # Make request
        response = client.delete(f"/invoices/{invoice.id}")
        
        # Check response
        assert response.status_code == 200
        assert response.json()["message"] == "Invoice deleted successfully"
        
        # Verify invoice is deleted
        get_response = client.get(f"/invoices/{invoice.id}")
        assert get_response.status_code == 404


class TestInvoicesV2Routes:
    """Tests for the invoices v2 routes."""

    def test_get_invoices_v2(self, client, db_session):
        """Test getting all invoices with v2 endpoint."""
        # Create test data
        invoice = create_test_invoice(db_session)
        
        # Make request
        response = client.get("/invoices/")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check that the response includes the essential fields
        assert data[0]["id"] == invoice.id
        assert data[0]["purchase_id"] == invoice.purchase_id
        assert "property_name" in data[0]  # From Invoice -> Purchase -> Property relationship
        assert data[0]["invoice_number"] == invoice.invoice_number
        assert data[0]["invoice_date"] == invoice.invoice_date.isoformat()
        assert data[0]["due_date"] == invoice.due_date.isoformat()
        assert float(data[0]["amount"]) == float(invoice.amount)
        assert data[0]["status"] == invoice.status
        assert data[0]["milestone"] == invoice.milestone
        assert float(data[0]["paid_amount"]) == float(invoice.paid_amount)

    def test_get_invoices_v2_with_filters(self, client, db_session):
        """Test getting invoices with filters using v2 endpoint."""
        # Create test data
        purchase = create_test_purchase(db_session)
        
        # Create two invoices with different statuses and milestones
        invoice1 = create_test_invoice(db_session, purchase_id=purchase.id)
        
        invoice2 = create_test_invoice(db_session, purchase_id=purchase.id)
        invoice2.invoice_number = "INV-002"
        invoice2.status = "paid"
        invoice2.milestone = "Possession"
        invoice2.invoice_date = date.today() - timedelta(days=30)  # Older date
        db_session.commit()
        
        # Test filter by purchase_id
        response = client.get(f"/invoices/?purchase_id={purchase.id}")
        data = response.json()
        assert len(data) == 2
        
        # Test filter by status
        response = client.get("/invoices/?status=paid")
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == invoice2.id
        
        # Test filter by milestone
        response = client.get("/invoices/?milestone=Booking")
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == invoice1.id
        
        # Test filter by date range
        from_date = (date.today() - timedelta(days=20)).isoformat()
        response = client.get(f"/invoices/?from_date={from_date}")
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == invoice1.id
        
        to_date = (date.today() - timedelta(days=20)).isoformat()
        response = client.get(f"/invoices/?to_date={to_date}")
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == invoice2.id

    def test_get_invoice_v2(self, client, db_session):
        """Test getting a specific invoice with v2 endpoint."""
        # Create test data
        invoice = create_test_invoice(db_session)
        
        # Make a payment against the invoice to test paid_amount calculation
        payment = create_test_payment(db_session, invoice_id=invoice.id)
        
        # Make request
        response = client.get(f"/invoices/{invoice.id}")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        
        # Check that the response includes all the essential fields
        assert data["id"] == invoice.id
        assert data["purchase_id"] == invoice.purchase_id
        assert "property_name" in data
        assert data["invoice_number"] == invoice.invoice_number
        assert data["invoice_date"] == invoice.invoice_date.isoformat()
        assert data["due_date"] == invoice.due_date.isoformat()
        assert float(data["amount"]) == float(invoice.amount)
        assert data["status"] == invoice.status
        assert data["milestone"] == invoice.milestone
        assert data["description"] == invoice.description
        
        # Check that paid_amount reflects the payment
        assert float(data["paid_amount"]) >= float(payment.amount) 