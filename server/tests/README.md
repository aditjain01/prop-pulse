# PropertyTrackPro Tests

This directory contains unit tests for the PropertyTrackPro backend API.

## Test Structure

- `conftest.py`: Contains pytest fixtures for setting up the test environment
- `test_utils.py`: Contains utility functions for creating test data
- `routes/`: Contains tests for API routes
  - `test_loans.py`: Tests for loan routes
  - `test_repayments.py`: Tests for loan repayment routes
  - `test_payments.py`: Tests for payment routes
  - (Additional test files for other routes)

## Running Tests

To run all tests:

```bash
cd server
pytest -v
```

To run tests for a specific module:

```bash
cd server
pytest -v tests/routes/test_loans.py
```

To run a specific test:

```bash
cd server
pytest -v tests/routes/test_loans.py::TestLoansRoutes::test_get_loans
```

## Test Database

The tests use an in-memory SQLite database that is created and destroyed for each test function. This ensures that tests are isolated from each other and from the production database.

## Adding New Tests

When adding new tests:

1. Create a new test file in the appropriate directory
2. Import the necessary fixtures and utility functions
3. Create test classes and methods following the existing patterns
4. Use the utility functions in `test_utils.py` to create test data

## Test Coverage

To generate a test coverage report:

```bash
cd server
pytest --cov=src tests/
```

For a more detailed HTML report:

```bash
cd server
pytest --cov=src --cov-report=html tests/
```

This will create a `htmlcov` directory with an HTML report of the test coverage. 