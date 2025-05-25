@echo off
echo Starting Resume Analysis API Server...
echo This server handles PDF text extraction and resume analysis
echo Access the API at http://localhost:8001
echo API documentation at http://localhost:8001/docs
echo.
echo Press Ctrl+C to stop the server
echo ----------------------------------------------

:: Activate virtual environment if it exists
if exist venv\Scripts\activate.bat (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
)

:: Install dependencies if needed
if "%1"=="--install" (
    echo Installing dependencies...
    pip install -r requirements.txt
)

:: Run the server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload 