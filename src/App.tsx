import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MainLayout from './components/Layout/MainLayout';
import DashboardContent from './components/Dashboard/DashboardContent';
import Documents from './pages/Documents';
import Calendar from './pages/Calendar';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Help from './pages/Help';
import CreateTeam from './pages/CreateTeam';
import ResumeAnalysisResults from './pages/ResumeAnalysisResults';
import ResumeDetails from './pages/ResumeDetails';
import ResumeAnalysisTest from './pages/test/ResumeAnalysisTest';
import ScoreVisualizationDemo from './pages/ScoreVisualizationDemo';
import { UserProvider } from './context/UserContext';
import { TeamProvider } from './contexts/TeamContext';
import { initDocumentsStorage } from './lib/supabaseInit';
import { setupAnonymousContext } from './lib/supabase';

function App() {
  const [initializationComplete, setInitializationComplete] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Set up anonymous context to help with RLS policies
        try {
          await setupAnonymousContext();
        } catch (authError) {
          console.warn('Failed to set up anonymous context, but continuing:', authError);
        }
        
        // Initialize document storage
        try {
          const storageInitialized = await initDocumentsStorage();
          if (!storageInitialized) {
            console.warn('Document storage initialization failed, but continuing...');
            // The app should still work despite this error
          }
        } catch (storageError) {
          console.error('Error initializing storage:', storageError);
          // Continue anyway - the app should still work for core functionality
        }
        
        setInitializationComplete(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        
        // Only show error message to user if it's a critical error
        // For RLS policy errors, we can continue without showing the user
        if (error instanceof Error && 
            !(error.message.includes('policy') || 
              error.message.includes('permission'))) {
          setInitError('Failed to initialize app resources. Some features may not work properly.');
        }
        
        // Still mark initialization as complete to let the app load
        setInitializationComplete(true);
      }
    };

    initializeApp();
  }, []);

  // Show loading or error state while initializing
  if (!initializationComplete) {
    return <div className="w-full h-screen flex items-center justify-center">Initializing application...</div>;
  }

  return (
    <UserProvider>
      <TeamProvider>
        <Router>
          {initError && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 fixed top-0 left-0 right-0 z-50" role="alert">
              <p>{initError}</p>
            </div>
          )}
          <Routes>
            <Route path="/create-team" element={<CreateTeam />} />
            <Route element={<MainLayout />}>
              <Route path="/" element={<DashboardContent />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/documents/:folderId" element={<Documents />} />
              <Route path="/resume-analysis-results" element={<ResumeAnalysisResults />} />
              <Route path="/resume-details/:resultId" element={<ResumeDetails />} />
              <Route path="/test/resume-analysis" element={<ResumeAnalysisTest />} />
              <Route path="/score-visualization" element={<ScoreVisualizationDemo />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/help" element={<Help />} />
              <Route path="/folder/:folderId/analysis-results" element={<ResumeAnalysisResults />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </TeamProvider>
    </UserProvider>
  );
}

export default App;