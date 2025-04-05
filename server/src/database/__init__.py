import click
from .base import engine, get_db
from .scripts import init_construction_status, init_example_user, init_views
# from .views import *
from .models import *


def init():
    """Initialize the database with tables and example data"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
    print("Initializing example data...")
    init_example_user()
    init_construction_status()
    # init_views()
    print("Example data initialized successfully!")


@click.group()
def cli():
    """Database management commands for PropertyTrackPro"""
    pass

@cli.command(name="init")
def initialise():
    """Initialize the database with tables and example data"""
    init()

__all__ = [
    "engine",
    "get_db",
    "models",
    "init",
]
