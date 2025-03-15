import pytest
from datetime import date, timedelta
from decimal import Decimal

from ..test_utils import (
    create_test_user,
    create_test_property,
    create_test_purchase,
    create_test_invoice
)


class TestPurchasesRoutes:
    """Tests for the purchases routes."""

    def test_get_purchases(self, client, db_session):
        """Test getting all purchases."""
        # Create test data
        purchase = create_test_purchase(db_session)
        
        # Make request
        response = client.get("/purchases/")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert data[0]["id"] == purchase.id
        assert data[0]["property_id"] == purchase.property_id
        assert data[0]["buyer_name"] == purchase.buyer_name
        assert data[0]["purchase_date"] == purchase.purchase_date.isoformat()
        assert float(data[0]["purchase_price"]) == float(purchase.purchase_price)
        assert float(data[0]["property_cost"]) == float(purchase.property_cost)
        assert float(data[0]["total_cost"]) == float(purchase.total_cost)

    def test_get_purchases_with_filters(self, client, db_session):
        """Test getting purchases with filters."""
        # Create test data
        property = create_test_property(db_session)
        
        # Create two purchases with different dates and developers
        purchase1 = create_test_purchase(db_session, property_id=property.id, 
                                         buyer_name="Developer A", 
                                         purchase_date=date.today())
        
        purchase2 = create_test_purchase(db_session, property_id=property.id,
                                         buyer_name="Developer B",
                                         purchase_date=date.today() - timedelta(days=30))
        
        # Test filter by property_id
        response = client.get(f"/purchases/?property_id={property.id}")
        data = response.json()
        assert len(data) == 2
        
        # Test filter by buyer_name
        response = client.get("/purchases/?buyer_name=Developer A")
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == purchase1.id
        
        # Test filter by date range
        from_date = (date.today() - timedelta(days=20)).isoformat()
        response = client.get(f"/purchases/?from_date={from_date}")
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == purchase1.id
        
        to_date = (date.today() - timedelta(days=20)).isoformat()
        response = client.get(f"/purchases/?to_date={to_date}")
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == purchase2.id

    def test_get_purchase(self, client, db_session):
        """Test getting a specific purchase."""
        # Create test data
        purchase = create_test_purchase(db_session)
        
        # Make request
        response = client.get(f"/purchases/{purchase.id}")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == purchase.id
        assert data["property_id"] == purchase.property_id
        assert data["buyer_name"] == purchase.buyer_name
        assert data["purchase_date"] == purchase.purchase_date.isoformat()
        assert float(data["purchase_price"]) == float(purchase.purchase_price)
        assert float(data["property_cost"]) == float(purchase.property_cost)
        assert float(data["total_cost"]) == float(purchase.total_cost)
        assert float(data["additional_costs"]) == float(purchase.additional_costs)
        assert data["status"] == purchase.status
        assert data["notes"] == purchase.notes

    def test_create_purchase(self, client, db_session):
        """Test creating a purchase."""
        # Create test data
        property = create_test_property(db_session)
        
        # Prepare request data
        purchase_data = {
            "property_id": property.id,
            "buyer_name": "Test Buyer",
            "purchase_date": str(date.today()),
            "purchase_price": 5000000,
            "additional_costs": 200000,
            "status": "pending",
            "notes": "Test purchase notes"
        }
        
        # Make request
        response = client.post("/purchases/", json=purchase_data)
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert data["property_id"] == purchase_data["property_id"]
        assert data["buyer_name"] == purchase_data["buyer_name"]
        assert data["purchase_date"] == purchase_data["purchase_date"]
        assert float(data["purchase_price"]) == purchase_data["purchase_price"]
        assert float(data["additional_costs"]) == purchase_data["additional_costs"]
        assert data["status"] == purchase_data["status"]
        assert data["notes"] == purchase_data["notes"]
        
        # Check computed fields
        assert float(data["property_cost"]) == float(property.current_price)
        assert float(data["total_cost"]) == float(property.current_price) + purchase_data["additional_costs"]
        assert float(data["total_sale_cost"]) == purchase_data["purchase_price"] - (float(property.current_price) + purchase_data["additional_costs"])

    def test_update_purchase(self, client, db_session):
        """Test updating a purchase."""
        # Create test data
        purchase = create_test_purchase(db_session)
        
        # Prepare update data
        update_data = {
            "purchase_price": 6000000,
            "additional_costs": 300000,
            "status": "completed",
            "notes": "Updated purchase notes"
        }
        
        # Make request
        response = client.put(f"/purchases/{purchase.id}", json=update_data)
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert float(data["purchase_price"]) == update_data["purchase_price"]
        assert float(data["additional_costs"]) == update_data["additional_costs"]
        assert data["status"] == update_data["status"]
        assert data["notes"] == update_data["notes"]
        
        # Original data should be preserved
        assert data["property_id"] == purchase.property_id
        assert data["buyer_name"] == purchase.buyer_name
        assert data["purchase_date"] == purchase.purchase_date.isoformat()
        
        # Computed fields should be updated
        assert float(data["total_cost"]) == float(purchase.property_cost) + update_data["additional_costs"]
        assert float(data["total_sale_cost"]) == update_data["purchase_price"] - (float(purchase.property_cost) + update_data["additional_costs"])

    def test_delete_purchase(self, client, db_session):
        """Test deleting a purchase."""
        # Create test data
        purchase = create_test_purchase(db_session)
        
        # Make request
        response = client.delete(f"/purchases/{purchase.id}")
        
        # Check response
        assert response.status_code == 200
        assert response.json()["message"] == "Purchase deleted successfully"
        
        # Verify purchase is deleted
        get_response = client.get(f"/purchases/{purchase.id}")
        assert get_response.status_code == 404

    def test_purchase_with_invoices(self, client, db_session):
        """Test that a purchase with associated invoices can't be deleted."""
        # Create test data
        purchase = create_test_purchase(db_session)
        
        # Create an invoice for this purchase
        invoice = create_test_invoice(db_session, purchase_id=purchase.id)
        
        # Try to delete the purchase
        response = client.delete(f"/purchases/{purchase.id}")
        
        # Check response - should fail with 400 Bad Request
        assert response.status_code == 400
        assert "Cannot delete purchase" in response.json()["detail"]
        
        # Verify purchase still exists
        get_response = client.get(f"/purchases/{purchase.id}")
        assert get_response.status_code == 200


class TestPurchasesV2Routes:
    """Tests for the purchases v2 routes."""

    def test_get_purchases_v2(self, client, db_session):
        """Test getting all purchases with v2 endpoint."""
        # Create test data
        purchase = create_test_purchase(db_session)
        
        # Make request
        response = client.get("/v2/purchases/")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check that the response includes the essential fields
        assert data[0]["id"] == purchase.id
        assert data[0]["property_id"] == purchase.property_id
        assert "property_name" in data[0]  # From Purchase -> Property relationship
        assert "property_address" in data[0]
        assert data[0]["buyer_name"] == purchase.buyer_name
        assert data[0]["purchase_date"] == purchase.purchase_date.isoformat()
        assert float(data[0]["purchase_price"]) == float(purchase.purchase_price)
        assert float(data[0]["property_cost"]) == float(purchase.property_cost)
        assert float(data[0]["total_cost"]) == float(purchase.total_cost)
        assert float(data[0]["total_sale_cost"]) == float(purchase.total_sale_cost)
        assert data[0]["status"] == purchase.status
        
        # Check for enhanced fields in v2
        assert "invoices_count" in data[0]
        assert "total_invoiced" in data[0]
        assert "total_paid" in data[0]

    def test_get_purchases_v2_with_filters(self, client, db_session):
        """Test getting purchases with filters using v2 endpoint."""
        # Create test data
        property = create_test_property(db_session)
        
        # Create two purchases with different dates and developers
        purchase1 = create_test_purchase(db_session, property_id=property.id, 
                                         buyer_name="Developer A", 
                                         purchase_date=date.today())
        
        purchase2 = create_test_purchase(db_session, property_id=property.id,
                                         buyer_name="Developer B",
                                         purchase_date=date.today() - timedelta(days=30))
        
        # Test filter by property_id
        response = client.get(f"/v2/purchases/?property_id={property.id}")
        data = response.json()
        assert len(data) == 2
        
        # Test filter by buyer_name
        response = client.get("/v2/purchases/?buyer_name=Developer A")
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == purchase1.id
        
        # Test filter by date range
        from_date = (date.today() - timedelta(days=20)).isoformat()
        response = client.get(f"/v2/purchases/?from_date={from_date}")
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == purchase1.id
        
        to_date = (date.today() - timedelta(days=20)).isoformat()
        response = client.get(f"/v2/purchases/?to_date={to_date}")
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == purchase2.id
        
        # Test filter by status
        response = client.get(f"/v2/purchases/?status={purchase1.status}")
        data = response.json()
        assert len(data) >= 1
        assert all(p["status"] == purchase1.status for p in data)

    def test_get_purchase_v2(self, client, db_session):
        """Test getting a specific purchase with v2 endpoint."""
        # Create test data
        purchase = create_test_purchase(db_session)
        
        # Create invoices for this purchase
        invoice1 = create_test_invoice(db_session, purchase_id=purchase.id, amount=100000)
        invoice2 = create_test_invoice(db_session, purchase_id=purchase.id, amount=200000)
        
        # Make request
        response = client.get(f"/v2/purchases/{purchase.id}")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        
        # Check that the response includes all the essential fields
        assert data["id"] == purchase.id
        assert data["property_id"] == purchase.property_id
        assert "property_name" in data
        assert "property_address" in data
        assert data["buyer_name"] == purchase.buyer_name
        assert data["purchase_date"] == purchase.purchase_date.isoformat()
        assert float(data["purchase_price"]) == float(purchase.purchase_price)
        assert float(data["property_cost"]) == float(purchase.property_cost)
        assert float(data["additional_costs"]) == float(purchase.additional_costs)
        assert float(data["total_cost"]) == float(purchase.total_cost)
        assert float(data["total_sale_cost"]) == float(purchase.total_sale_cost)
        assert data["status"] == purchase.status
        assert data["notes"] == purchase.notes
        
        # Check for enhanced fields in v2
        assert "invoices_count" in data
        assert data["invoices_count"] >= 2  # We created at least two invoices
        assert "total_invoiced" in data
        assert float(data["total_invoiced"]) >= 300000  # Sum of invoice1 and invoice2
        assert "total_paid" in data
        
        # Check for invoices list
        assert "invoices" in data
        assert isinstance(data["invoices"], list)
        assert len(data["invoices"]) >= 2 