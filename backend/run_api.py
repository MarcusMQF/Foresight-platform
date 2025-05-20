import uvicorn

# Required dependencies:
# pip install fastapi uvicorn python-multipart pdf2text python-docx spacy scikit-learn
# python -m spacy download en_core_web_md

if __name__ == "__main__":
    print("Starting Resume ATS Analyzer API server...")
    print("Access the API docs at: http://localhost:8000/docs")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 