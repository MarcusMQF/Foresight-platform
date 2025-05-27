import React, { useState } from 'react';
import resumeAnalysisService from '../../services/resume-analysis.service';
import PdfExtractionWarning from '../../components/PdfExtractionWarning';
import { validateWeights } from '../../utils/weights-validator';
import { AspectWeights } from '../../services/resume-analysis.service';

const ResumeAnalysisTest: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<{file: File, extractionResult?: any, analysisResult?: any}[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [weights, setWeights] = useState<AspectWeights>({
    skills: 2.0,
    experience: 1.5,
    achievements: 1.0,
    education: 0.8,
    culturalFit: 0.7
  });
  const [progress, setProgress] = useState<{current: number, total: number} | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileArray = Array.from(e.target.files);
      setFiles(fileArray);
      setResults([]);
      setError(null);
    }
  };

  const handleJobDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJobDescription(e.target.value);
  };

  const handleWeightChange = (aspect: keyof AspectWeights, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setWeights(prev => ({
        ...prev,
        [aspect]: numValue
      }));
    }
  };

  const testExtraction = async () => {
    if (files.length === 0) {
      setError('Please select at least one PDF file');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setProgress({ current: 0, total: files.length });

    try {
      const newResults = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress({ current: i + 1, total: files.length });
        
        try {
          const result = await resumeAnalysisService.testPdfExtraction(file);
          newResults.push({ file, extractionResult: result });
        } catch (err) {
          console.error(`Error testing extraction for ${file.name}:`, err);
          newResults.push({ 
            file, 
            extractionResult: { 
              success: false, 
              error: `Failed to extract text from ${file.name}` 
            } 
          });
        }
      }
      
      setResults(newResults);
    } catch (err) {
      console.error('Error in batch extraction:', err);
      setError('An error occurred during batch extraction');
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  const analyzeResumes = async () => {
    if (files.length === 0) {
      setError('Please select at least one PDF file');
      return;
    }

    if (!jobDescription) {
      setError('Please enter a job description');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setProgress({ current: 0, total: files.length });

    try {
      const newResults = [];
      const validatedWeights = validateWeights(weights);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress({ current: i + 1, total: files.length });
        
        try {
          const result = await resumeAnalysisService.analyzeResume(
            file,
            jobDescription,
            'test_folder',
            'test_user',
            '',
            validatedWeights,
            false
          );
          
          // Also get extraction result for complete information
          const extractionResult = await resumeAnalysisService.testPdfExtraction(file);
          
          newResults.push({ 
            file, 
            extractionResult,
            analysisResult: result 
          });
        } catch (err) {
          console.error(`Error analyzing ${file.name}:`, err);
          newResults.push({ 
            file, 
            analysisResult: { 
              error: { 
                message: `Failed to analyze ${file.name}` 
              } 
            } 
          });
        }
      }
      
      setResults(newResults);
    } catch (err) {
      console.error('Error in batch analysis:', err);
      setError('An error occurred during batch analysis');
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setResults(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Resume Analysis Test</h1>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">1. Select PDF Resume(s)</h2>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="block w-full mb-2"
          multiple
        />
        {files.length > 0 && (
          <div className="mt-2">
            <h3 className="text-sm font-medium mb-1">Selected files ({files.length}):</h3>
            <ul className="text-sm text-gray-700 max-h-40 overflow-y-auto">
              {files.map((file, index) => (
                <li key={index} className="flex justify-between items-center py-1">
                  <span>{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
                  <button 
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">2. Enter Job Description</h2>
        <textarea
          value={jobDescription}
          onChange={handleJobDescriptionChange}
          className="w-full p-2 border rounded"
          rows={5}
          placeholder="Enter job description here..."
        />
      </div>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">3. Customize Weights (Optional)</h2>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(weights).map(([aspect, value]) => (
            <div key={aspect} className="flex items-center">
              <label className="mr-2 w-24">{aspect}:</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={value}
                onChange={(e) => handleWeightChange(aspect as keyof AspectWeights, e.target.value)}
                className="border rounded p-1 w-20"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={testExtraction}
          disabled={isLoading || files.length === 0}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          {isLoading ? 'Testing...' : 'Test Extraction'}
        </button>
        <button
          onClick={analyzeResumes}
          disabled={isLoading || files.length === 0 || !jobDescription}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Resumes'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {isLoading && progress && (
        <div className="mb-6">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Processing files...</span>
            <span className="text-sm font-medium">{progress.current} of {progress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-6">
          {results.map((result, index) => (
            <div key={index} className="bg-white border rounded-lg p-4 shadow">
              <h2 className="text-xl font-bold mb-2">
                Results for {result.file.name}
              </h2>
              
              {result.extractionResult && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Extraction Results</h3>
                  
                  {result.extractionResult.success ? (
                    <>
                      <PdfExtractionWarning
                        extractionStatus={result.extractionResult.metadata?.extraction_status || 'success'}
                        extractionMethod={result.extractionResult.metadata?.extraction_method}
                        textLength={result.extractionResult.text_length}
                        filename={result.extractionResult.filename}
                        fileSize={result.file?.size}
                      />
                      
                      <div className="mt-4">
                        <h4 className="font-semibold">Text Sample:</h4>
                        <div className="bg-gray-50 p-3 rounded border mt-2 whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {result.extractionResult.text_sample}
                        </div>
                      </div>
                    </>
                  ) : (
                    <PdfExtractionWarning
                      extractionStatus="failed"
                      filename={result.file?.name}
                      fileSize={result.file?.size}
                    />
                  )}
                </div>
              )}

              {result.analysisResult && !result.analysisResult.error && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Analysis Results</h3>
                  
                  {result.analysisResult.metadata && (
                    <PdfExtractionWarning
                      extractionStatus={result.analysisResult.metadata.extraction_status || 'success'}
                      extractionMethod={result.analysisResult.metadata.extraction_method}
                      textLength={result.analysisResult.metadata.text_length}
                      filename={result.analysisResult.filename}
                      fileSize={result.file?.size}
                    />
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <h4 className="font-semibold mb-2">Score: {result.analysisResult.score}</h4>
                      
                      {result.analysisResult.aspectScores && (
                        <div className="mb-4">
                          <h5 className="font-medium text-sm">Aspect Scores:</h5>
                          <ul className="list-disc pl-5">
                            {Object.entries(result.analysisResult.aspectScores).map(([aspect, score]) => (
                              <li key={aspect}>
                                {aspect}: {String(score)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {result.analysisResult.matchedKeywords && result.analysisResult.matchedKeywords.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-sm">Matched Keywords:</h5>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.analysisResult.matchedKeywords.map((keyword: string, i: number) => (
                              <span key={i} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      {result.analysisResult.missingKeywords && result.analysisResult.missingKeywords.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-sm">Missing Keywords:</h5>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.analysisResult.missingKeywords.map((keyword: string, i: number) => (
                              <span key={i} className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {result.analysisResult.recommendations && result.analysisResult.recommendations.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm">Recommendations:</h5>
                          <ul className="list-disc pl-5 mt-1">
                            {result.analysisResult.recommendations.map((recommendation: string, i: number) => (
                              <li key={i} className="text-sm">
                                {recommendation}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {result.analysisResult.candidateInfo && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-semibold mb-2">Candidate Information</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <p><strong>Name:</strong> {result.analysisResult.candidateInfo.name || 'N/A'}</p>
                          <p><strong>Email:</strong> {result.analysisResult.candidateInfo.email || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {result.analysisResult && result.analysisResult.error && (
                <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded">
                  {result.analysisResult.error.message || 'Analysis failed'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResumeAnalysisTest; 