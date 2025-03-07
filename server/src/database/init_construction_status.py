
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import ConstructionStatus
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
        "Completed"
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

if __name__ == "__main__":
    init_construction_status()
