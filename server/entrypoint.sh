#!/bin/bash

# Run database migrations
/server/.venv/bin/alembic -c src/database/alembic.ini upgrade head

# Start the FastAPI application
/server/.venv/bin/uvicorn src.main:app --host 0.0.0.0 --port 8000
