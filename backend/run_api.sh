#!/bin/bash
# Script to start the FastAPI backend server for resume analysis

echo "Starting Resume Analysis API Server..."
echo "This server handles PDF text extraction and resume analysis"
echo "Access the API at http://localhost:8001"
echo "API documentation at http://localhost:8001/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo "----------------------------------------------"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
fi

# Install dependencies if needed
if [ "$1" == "--install" ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
fi

# Run the server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload 