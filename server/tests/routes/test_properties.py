import pytest
from datetime import date, timedelta
from decimal import Decimal

from ..test_utils import (
    create_test_property,
    create_test_purchase
)


class TestPropertiesRoutes:
    """Tests for the properties routes."""

    def test_get_properties(self, client, db_session):
        """Test getting all properties."""
        # Create test data
        property = create_test_property(db_session)
        
        # Make request
        response = client.get("/properties/")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert data[0]["id"] == property.id
        assert data[0]["name"] == property.name
        assert data[0]["address"] == property.address
        assert data[0]["property_type"] == property.property_type
        assert float(data[0]["area"]) == float(property.area)
        assert float(data[0]["current_price"]) == float(property.current_price)

    def test_get_properties_with_filters(self, client, db_session):
        """Test getting properties with filters."""
        # Create test data - properties with different types and prices
        property1 = create_test_property(db_session, name="Property A", 
                                         property_type="apartment", 
                                         current_price=5000000)
        
        property2 = create_test_property(db_session, name="Property B",
                                         property_type="villa",
                                         current_price=10000000)
        
        # Test filter by property_type
        response = client.get("/properties/?property_type=apartment")
        data = response.json()
        assert len(data) >= 1
        assert any(p["id"] == property1.id for p in data)
        assert not any(p["id"] == property2.id for p in data)
        
        # Test filter by name (partial match)
        response = client.get("/properties/?name=Property B")
        data = response.json()
        assert len(data) >= 1
        assert any(p["id"] == property2.id for p in data)
        assert not any(p["id"] == property1.id for p in data)
        
        # Test filter by price range
        min_price = 7000000
        response = client.get(f"/properties/?min_price={min_price}")
        data = response.json()
        assert len(data) >= 1
        assert any(p["id"] == property2.id for p in data)
        assert not any(p["id"] == property1.id for p in data)
        
        max_price = 7000000
        response = client.get(f"/properties/?max_price={max_price}")
        data = response.json()
        assert len(data) >= 1
        assert any(p["id"] == property1.id for p in data)
        assert not any(p["id"] == property2.id for p in data)

    def test_get_property(self, client, db_session):
        """Test getting a specific property."""
        # Create test data
        property = create_test_property(db_session)
        
        # Make request
        response = client.get(f"/properties/{property.id}")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == property.id
        assert data["name"] == property.name
        assert data["address"] == property.address
        assert data["property_type"] == property.property_type
        assert float(data["area"]) == float(property.area)
        assert float(data["current_price"]) == float(property.current_price)
        assert data["description"] == property.description
        assert data["status"] == property.status
        assert data["developer"] == property.developer
        assert float(data["super_area"]) == float(property.super_area)
        assert float(data["carpet_area"]) == float(property.carpet_area)

    def test_create_property(self, client, db_session):
        """Test creating a property."""
        # Prepare request data
        property_data = {
            "name": "Test Property",
            "address": "123 Test Street, Test City",
            "property_type": "apartment",
            "area": 1200,
            "carpet_area": 1000,
            "super_area": 1100,
            "current_price": 6000000,
            "description": "A beautiful test property",
            "status": "available",
            "developer": "Test Developer"
        }
        
        # Make request
        response = client.post("/properties/", json=property_data)
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == property_data["name"]
        assert data["address"] == property_data["address"]
        assert data["property_type"] == property_data["property_type"]
        assert float(data["area"]) == property_data["area"]
        assert float(data["carpet_area"]) == property_data["carpet_area"]
        assert float(data["super_area"]) == property_data["super_area"]
        assert float(data["current_price"]) == property_data["current_price"]
        assert data["description"] == property_data["description"]
        assert data["status"] == property_data["status"]
        assert data["developer"] == property_data["developer"]

    def test_create_property_with_computed_fields(self, client, db_session):
        """Test creating a property with computed fields."""
        # Prepare request data with only area (carpet_area and super_area will be computed)
        property_data = {
            "name": "Test Property with Computed Fields",
            "address": "456 Test Avenue, Test City",
            "property_type": "apartment",
            "area": 1000,
            "current_price": 5000000,
            "description": "A property with computed fields",
            "status": "available",
            "developer": "Test Developer"
        }
        
        # Make request
        response = client.post("/properties/", json=property_data)
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        
        # Check that carpet_area and super_area were computed correctly
        assert float(data["carpet_area"]) == property_data["area"] * 0.85  # Default computation
        assert float(data["super_area"]) == property_data["area"] * 1.15  # Default computation

    def test_update_property(self, client, db_session):
        """Test updating a property."""
        # Create test data
        property = create_test_property(db_session)
        
        # Prepare update data
        update_data = {
            "name": "Updated Property Name",
            "current_price": 7500000,
            "status": "sold",
            "description": "Updated description"
        }
        
        # Make request
        response = client.put(f"/properties/{property.id}", json=update_data)
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert float(data["current_price"]) == update_data["current_price"]
        assert data["status"] == update_data["status"]
        assert data["description"] == update_data["description"]
        
        # Original data should be preserved
        assert data["address"] == property.address
        assert data["property_type"] == property.property_type
        assert float(data["area"]) == float(property.area)
        assert float(data["carpet_area"]) == float(property.carpet_area)
        assert float(data["super_area"]) == float(property.super_area)
        assert data["developer"] == property.developer

    def test_delete_property(self, client, db_session):
        """Test deleting a property."""
        # Create test data
        property = create_test_property(db_session)
        
        # Make request
        response = client.delete(f"/properties/{property.id}")
        
        # Check response
        assert response.status_code == 200
        assert response.json()["message"] == "Property deleted successfully"
        
        # Verify property is deleted
        get_response = client.get(f"/properties/{property.id}")
        assert get_response.status_code == 404

    def test_property_with_purchases(self, client, db_session):
        """Test that a property with associated purchases can't be deleted."""
        # Create test data
        property = create_test_property(db_session)
        
        # Create a purchase for this property
        purchase = create_test_purchase(db_session, property_id=property.id)
        
        # Try to delete the property
        response = client.delete(f"/properties/{property.id}")
        
        # Check response - should fail with 400 Bad Request
        assert response.status_code == 400
        assert "Cannot delete property" in response.json()["detail"]
        
        # Verify property still exists
        get_response = client.get(f"/properties/{property.id}")
        assert get_response.status_code == 200


class TestPropertiesV2Routes:
    """Tests for the properties v2 routes."""

    def test_get_properties_v2(self, client, db_session):
        """Test getting all properties with v2 endpoint."""
        # Create test data
        property = create_test_property(db_session)
        
        # Make request
        response = client.get("/properties/")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check that the response includes the essential fields
        assert data[0]["id"] == property.id
        assert data[0]["name"] == property.name
        assert data[0]["address"] == property.address
        assert data[0]["property_type"] == property.property_type
        assert float(data[0]["area"]) == float(property.area)
        assert float(data[0]["current_price"]) == float(property.current_price)
        assert data[0]["status"] == property.status
        assert data[0]["developer"] == property.developer
        
        # Check for enhanced fields in v2
        assert "purchase_status" in data[0]
        assert "purchase_count" in data[0]

    def test_get_properties_v2_with_filters(self, client, db_session):
        """Test getting properties with filters using v2 endpoint."""
        # Create test data - properties with different types, statuses, and developers
        property1 = create_test_property(db_session, name="Property A", 
                                         property_type="apartment", 
                                         status="available",
                                         developer="Developer A")
        
        property2 = create_test_property(db_session, name="Property B",
                                         property_type="villa",
                                         status="sold",
                                         developer="Developer B")
        
        # Test filter by property_type
        response = client.get("/properties/?property_type=apartment")
        data = response.json()
        assert len(data) >= 1
        assert any(p["id"] == property1.id for p in data)
        assert not any(p["id"] == property2.id for p in data)
        
        # Test filter by status
        response = client.get("/properties/?status=sold")
        data = response.json()
        assert len(data) >= 1
        assert any(p["id"] == property2.id for p in data)
        assert not any(p["id"] == property1.id for p in data)
        
        # Test filter by developer
        response = client.get("/properties/?developer=Developer A")
        data = response.json()
        assert len(data) >= 1
        assert any(p["id"] == property1.id for p in data)
        assert not any(p["id"] == property2.id for p in data)
        
        # Test filter by name (partial match)
        response = client.get("/properties/?name=Property B")
        data = response.json()
        assert len(data) >= 1
        assert any(p["id"] == property2.id for p in data)
        assert not any(p["id"] == property1.id for p in data)

    def test_get_property_v2(self, client, db_session):
        """Test getting a specific property with v2 endpoint."""
        # Create test data
        property = create_test_property(db_session)
        
        # Create a purchase for this property
        purchase = create_test_purchase(db_session, property_id=property.id)
        
        # Make request
        response = client.get(f"/properties/{property.id}")
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        
        # Check that the response includes all the essential fields
        assert data["id"] == property.id
        assert data["name"] == property.name
        assert data["address"] == property.address
        assert data["property_type"] == property.property_type
        assert float(data["area"]) == float(property.area)
        assert float(data["carpet_area"]) == float(property.carpet_area)
        assert float(data["super_area"]) == float(property.super_area)
        assert float(data["current_price"]) == float(property.current_price)
        assert data["description"] == property.description
        assert data["status"] == property.status
        assert data["developer"] == property.developer
        
        # Check for enhanced fields in v2
        assert "purchase_status" in data
        assert data["purchase_count"] >= 1  # We created at least one purchase
        
        # Check for purchases list
        assert "purchases" in data
        assert isinstance(data["purchases"], list)
        assert len(data["purchases"]) >= 1 