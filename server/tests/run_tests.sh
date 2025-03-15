#!/bin/bash

# Change to the server directory
cd "$(dirname "$0")/.."

# Install test dependencies if needed
uv add -r tests/requirements-test.txt --group tests

# Run tests with verbose output
pytest -v tests/

# Run with coverage if --coverage flag is provided
if [[ "$*" == *--coverage* ]]; then
    echo "Running tests with coverage..."
    pytest --cov=src --cov-report=term tests/
fi

# Generate HTML coverage report if --html-coverage flag is provided
if [[ "$*" == *--html-coverage* ]]; then
    echo "Generating HTML coverage report..."
    pytest --cov=src --cov-report=html tests/
    echo "HTML coverage report generated in htmlcov/ directory"
fi 