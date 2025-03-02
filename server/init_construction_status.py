
from server.database import engine, get_db
from sqlalchemy.orm import Session
from server.models import ConstructionStatus, Base

def init_construction_statuses():
    db = next(get_db())
    
    # Check if construction statuses already exist
    existing = db.query(ConstructionStatus).first()
    if existing:
        print("Construction statuses already initialized")
        return
    
    # Create initial construction statuses
    statuses = [
        ConstructionStatus(name="Pre-Development", description="Land acquired, development planning phase"),
        ConstructionStatus(name="RERA Approved", description="Project approved by Real Estate Regulatory Authority"),
        ConstructionStatus(name="Under Construction", description="Construction has begun but not completed"),
        ConstructionStatus(name="Super Structure Ready", description="Main building structure completed"),
        ConstructionStatus(name="Interiors Phase", description="Internal fittings and finishes being done"),
        ConstructionStatus(name="Ready to Move", description="Construction completed and ready for possession"),
        ConstructionStatus(name="Partially Occupied", description="Some units are already occupied"),
        ConstructionStatus(name="Fully Occupied", description="All units are occupied")
    ]
    
    try:
        for status in statuses:
            db.add(status)
        db.commit()
        print("Construction statuses initialized successfully")
    except Exception as e:
        db.rollback()
        print(f"Error initializing construction statuses: {e}")

if __name__ == "__main__":
    init_construction_statuses()
