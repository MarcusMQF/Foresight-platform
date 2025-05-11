import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import DashboardContent from './components/Dashboard/DashboardContent';
import Documents from './pages/Documents';
import FolderView from './pages/FolderView';
import Calendar from './pages/Calendar';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Help from './pages/Help';
import { UserProvider } from './context/UserContext';

function App() {
  return (
    <UserProvider>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<DashboardContent />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/documents/:folderId" element={<FolderView />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </Router>
    </UserProvider>
  );
}

export default App;