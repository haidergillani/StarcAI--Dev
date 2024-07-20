# Starc Backend Setup Guide

This README provides the instructions necessary to get the backend service up and running.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following installed:
- Python 3.x
- pip (Python package manager)

### Installing

A step by step series of examples that tell you how to get a development environment running.

1. First, clone the repository and switch to the `starc-backend` directory:
   ```
   cd starc-backend
   ```

2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   source venv/bin/activate
   ```

3. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

4. Start the backend service:
   ```
   python app.py
   ```

### Running the Tests

To run the automated tests for this system, use the following command:
```
python -m unittest discover tests
```

This will discover and run all the tests in the `tests` directory.



# Starc Backend Repository Structure

## Python Files Overview

- `.env.example`: A sample `.env` file to store environment variables.
- `api_schema.md`: A Markdown file describing the schema of API endpoints, making it easier for frontend engineers to understand the API.
- `app.py`: Python script to create and run an instance of the application.
- `requirements.txt`: Lists all the dependencies of the application.

## api_project Directory

- `routes`:
  - `auth_routes.py`: Contains user registration, login, and logout functionalities.
  - `documents.py`: Handles creation, updating, deletion, and downloading of documents; accesses their scores, and supports PDF format as well.
  - `rewrites.py`: Provides suggestions, and options to delete or accept suggestions separately or together.
  - `search.py`: Enables querying and searching documents for a user.
- `Starc.png`: A diagram representing the database schema of the application.
- `__init__.py`: Initializes the app, database, JWT authentication, and loads blueprints.
- `models.py`: Defines the database models.
- `processing.py`: Handles external requests to text scoring and rewriting logic hosted on Google Cloud.
- `schema.md`: A Markdown file describing the database schema.

## tests Directory

- `tests_auth`: Tests for authentication routes.
- `tests_docs`: Tests for document-related routes.
- `tests_rewrites.py`: Tests for the rewriting functionality.
- `tests_search.py`: Tests for the document search functionality.


