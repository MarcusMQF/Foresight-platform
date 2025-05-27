# AI-Powered Talent Acquisition System (TalentAI) - User Flow and Implementation

## User Flow

### 1. Initial File Upload and Folder Management
- **Starting Point**: HR lands on the "Documents" page (first image), showing existing folders (e.g., "test," "hello") and a "New Folder" button.
- **Action**: HR clicks "New Folder" to create a folder (e.g., "Job Role: Data Analyst").
- **Input**: During folder creation, HR is prompted to enter the job/position requirements (e.g., "Skills: Python, SQL; Experience: 2+ years"). This embeds the job description at the folder level, streamlining the process.
- **Upload**: HR clicks "Upload Files" (second image) to add resumes to the folder. The UI lists uploaded files with "NAME," "SIZE," "DATE," and "ACTIONS."
- **Validation**: The system checks for duplicates or invalid files (e.g., non-PDFs) and alerts HR if issues are detected.

### 2. Selecting a File and Navigating to Candidate Profile
- **Action**: HR clicks a specific file (e.g., "52618188.pdf") from the file list in the "test" folder.
- **Navigation**: The UI transitions to a Candidate Profile Page with a two-column layout:
  - **Left Side**: File Preview (using React-PDF to display the resume).
  - **Right Side**: ATS Analysis (strengths, weaknesses, match score based on the folder’s job requirements).
- **Loading**: The system fetches the resume from Supabase Storage and triggers FastAPI to perform ATS analysis using the pre-submitted job requirements.

### 3. ATS Analysis Display
- **Content**:
  - **Match Score**: Percentage match (e.g., 85%) based on skills and experience.
  - **Strengths**: Highlighted skills aligning with requirements (e.g., "Proficient in Python").
  - **Weaknesses**: Identified gaps (e.g., "Lacks SQL experience").
  - **Authenticity Flag**: Spam detection result (e.g., "Valid" or "Flagged for review").
- **Interaction**: HR can add notes or mark the candidate for further review.

### 4. Navigating to Filter Potential Applicants
- **Action**: From the "Documents" or "Candidates" tab, HR clicks a "Filter Applicants" button.
- **Page**: A new page loads with a filter interface:
  - **Filters**: Match score (>80%), skills (e.g., Python), authenticity (valid only).
  - **Folder Selection**: Dropdown to choose a specific folder (e.g., "Job Role: Data Analyst").
- **Result**: A table lists filtered resumes with options to view individual profiles or export the list.
- **Flow Back**: HR can return to the folder view or candidate profile as needed.

### Optimal Job Description Flow
- **Embedded in Folder Creation**: Prompting HR to input job requirements when creating a folder (as in Step 1) is better than a separate step. This ties the job context directly to the folder, ensuring ATS analysis is relevant to each job role. Alternatively, HR could edit requirements later via a folder settings menu, but this adds complexity for a hackathon MVP.

---

## Implementation Steps

### Set Up a FastAPI Backend
- Create a new FastAPI application that will handle file processing.
- Set up endpoints for batch file analysis.

### Implement File Processing Pipeline
- Use OCR for document parsing (PDF/DOCX → text).
- Use spaCy for NLP preprocessing and entity extraction.
- Use an LLM for semantic matching and scoring.

### Integrate with Your Frontend
- Modify your ATS checker dialog to handle folder selection.
- Add a batch processing view to display all analyzed files.

### Frontend Components
- Updated `ATSCheckerDialog.tsx` to support multiple file analysis.
- Added a batch mode to compare multiple resumes against job descriptions.
- Implemented file selection for folder analysis.
- Added visualization for comparing multiple resumes.

### Backend API
- Created a FastAPI server that processes resumes using NLP.
- Implemented text extraction from PDF and DOCX files.
- Keyword extraction and analysis using spaCy.
- Semantic similarity calculation between resumes and job descriptions.
- Generation of tailored recommendations for ATS optimization.

### Integration
- Resume analysis service to connect frontend and backend.
- Support for both single file and batch processing.

### How the System Works
#### Single Resume Analysis
- User uploads a resume and provides a job description.
- API extracts text from the resume using OCR (for PDFs) or direct extraction (for DOCXs).
- NLP model (spaCy) extracts keywords from both the resume and job description.
- System calculates semantic similarity and identifies matched/missing keywords.
- User receives a score, keyword analysis, and personalized recommendations.

#### Batch Processing
- User selects multiple files or uploads a folder of resumes.
- Each resume is processed against the same job description.
- System ranks the resumes based on their matching scores.
- User can view detailed analysis for each resume or see the top match.

### Key Features
- Semantic matching using NLP (spaCy's word vectors).
- Keyword extraction to identify skills and qualifications.
- Smart recommendation generation based on missing keywords.
- Beautiful UI with sorting, filtering, and detailed views.
- Support for multiple file formats (PDF, DOCX).

---

## Requested Flow Breakdown
Here’s the flow you described, interpreted for TalentAI:

### ATS Checker for Multiple Files
- HR uploads multiple resumes (PDFs or DOCXs) at once.
- The system validates these files for ATS compatibility (e.g., checks formatting issues).

### Enter Job Description
- HR inputs a job description (e.g., "Skills: Python, SQL; Experience: 2+ years") to define the criteria for matching.

### OCR Extraction for PDFs / Direct Extraction for DOCXs
- For PDFs, the system uses OCR to extract text.
- For DOCXs, the system directly extracts text without OCR.
- Extracted text is converted into a structured format (e.g., skills, experience).

### NLP Analysis for Keyword Matching
- The system uses NLP to analyze extracted keywords from resumes and compares them to the job description.
- A matching score is computed for each resume (e.g., 85% match based on skills and experience).

### Display Results in a Table
- A table lists the files, sorted by matching score (highest to lowest).
- Each row includes a preview option and an analysis report.
- When HR clicks a file, a two-column page opens:
  - **Left**: File preview (using React-PDF).
  - **Right**: Analysis report (match score, strengths, weaknesses).

### Additional Requirements
- **Process Multiple Files Simultaneously**: The system must handle multiple files at once, likely in batches.
- **Processing Progress Bar**: A progress bar shows the current step (e.g., "Uploading," "Extracting Text," "Analyzing").

---

## Feasibility and Workability
Yes, this flow is workable for a hackathon MVP, with a few considerations:

### Multiple File Processing
- Supabase Storage and FastAPI can handle multiple files, but processing them simultaneously requires careful design. For a hackathon, we can process files sequentially (or in small batches) to avoid overwhelming the backend. True parallelism (e.g., using worker queues) is overkill for a demo but can be simulated with a progress bar.
- **Limitation**: OCR for PDFs can be slow. For the MVP, we’ll use a lightweight text extraction library (e.g., `pdf2txt` for PDFs) instead of full OCR, as OCR libraries like Tesseract are resource-intensive.

### Progress Bar
- A progress bar can be implemented on the frontend using React state updates. We’ll track steps like "Uploading," "Extracting," and "Analyzing" and update the UI accordingly.

### Performance
- Processing 50 files (a typical demo size) should take under 5 minutes, aligning with your previous requirement. Sequential processing ensures reliability for a hackathon demo.

---

## Updated Architecture
This flow builds on the previous architecture but adjusts for batch processing and progress tracking.

### Components
- **Frontend**: TSX (React + TypeScript), Tailwind CSS, React-PDF.
- **Backend**:
  - **Supabase**: PostgreSQL for data storage, Storage for files, Authentication for HR access.
  - **FastAPI**: Handles text extraction and NLP analysis.
- **Text Extraction**:
  - PDFs: `pdf2txt` (via Python library `pdf2txt.py`) for text extraction.
  - DOCXs: `python-docx` for direct text extraction.
- **NLP/AI**:
  - SpaCy for keyword extraction.
  - Scikit-learn for TF-IDF and cosine similarity to compute match scores.
- **Progress Tracking**: Frontend state management to update the progress bar.

### Workflow
1. **Upload**:
   - HR uploads multiple files to Supabase Storage.
   - Frontend updates progress bar to "Uploading".
2. **Job Description**:
   - HR enters the job description in a form.
   - Saved to Supabase `jobs` table.
3. **Text Extraction**:
   - FastAPI processes each file (PDFs via `pdf2txt`, DOCXs via `python-docx`).
   - Frontend updates progress bar to "Extracting Text".
4. **NLP Analysis**:
   - SpaCy extracts keywords from resumes.
   - Scikit-learn computes match scores against the job description.
   - Frontend updates progress bar to "Analyzing".
5. **Display**:
   - Results are stored in Supabase `candidates` table.
   - Frontend displays a table of files with match scores.
   - Clicking a file navigates to a two-column page (preview + analysis).

---

## User Flow with Progress Bar

### Step 1: Upload Files and Enter Job Description
- **UI**: A form with a file input for multiple files and a textarea for the job description.
- **Progress Bar**: Starts at "Uploading" (0% complete).
- **Action**: HR selects files, enters the job description, and clicks "Process".

### Step 2: Processing Files
- **Backend**:
  - Files are uploaded to Supabase Storage.
  - FastAPI processes each file sequentially:
    - Extract text (PDFs: `pdf2txt`, DOCXs: `python-docx`).
    - Extract keywords with SpaCy.
    - Compute match scores with Scikit-learn.
- **Progress Bar**:
  - Updates to "Extracting Text" (33% complete) during text extraction.
  - Updates to "Analyzing" (66% complete) during NLP analysis.
  - Finishes at "Complete" (100%) when all files are processed.

### Step 3: Display Results
- **UI**: A table lists files with columns: Name, Match Score, Actions.
- **Action**: HR clicks a file to view the preview and analysis report.

### Step 4: Candidate Profile Page
- **UI**: Two-column layout:
  - **Left**: File preview (React-PDF).
  - **Right**: Analysis report (match score, strengths, weaknesses).
- **Action**: HR can return to the table to view other files.