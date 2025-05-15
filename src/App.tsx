import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import { UserProvider } from './context/UserContext';
import { TeamProvider } from './contexts/TeamContext';

function App() {
  return (
    <UserProvider>
      <TeamProvider>
        <Router>
          <Routes>
            <Route path="/create-team" element={<CreateTeam />} />
            <Route element={<MainLayout />}>
              <Route path="/" element={<DashboardContent />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/documents/:folderId" element={<Documents />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/help" element={<Help />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </TeamProvider>
    </UserProvider>
  );
}

export default App;