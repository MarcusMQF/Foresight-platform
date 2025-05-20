from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import resume_analysis

app = FastAPI(title="Resume ATS Checker API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(resume_analysis.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Resume ATS Checker API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 