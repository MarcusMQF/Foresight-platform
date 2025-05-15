import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Team } from '../components/UI/TeamSelector';

interface TeamContextType {
  teams: Team[];
  currentTeam: Team | null;
  setCurrentTeam: (team: Team) => void;
  addTeam: (teamName: string) => void;
  removeTeam: (teamId: string) => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};

interface TeamProviderProps {
  children: ReactNode;
}

export const TeamProvider: React.FC<TeamProviderProps> = ({ children }) => {
  // Initialize with a default team
  const [teams, setTeams] = useState<Team[]>(() => {
    const savedTeams = localStorage.getItem('teams');
    return savedTeams 
      ? JSON.parse(savedTeams) 
      : [{ id: '1', name: 'Personal Workspace', avatarColor: 'bg-yellow-500 text-black' }];
  });
  
  const [currentTeam, setCurrentTeam] = useState<Team | null>(() => {
    const savedCurrentTeam = localStorage.getItem('currentTeam');
    return savedCurrentTeam 
      ? JSON.parse(savedCurrentTeam) 
      : teams[0] || null;
  });

  // Save to localStorage when teams or currentTeam changes
  useEffect(() => {
    localStorage.setItem('teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    if (currentTeam) {
      localStorage.setItem('currentTeam', JSON.stringify(currentTeam));
    }
  }, [currentTeam]);

  const getRandomColor = () => {
    const colors = [
      'bg-blue-500 text-white', 'bg-green-500 text-white', 'bg-purple-500 text-white', 
      'bg-pink-500 text-white', 'bg-indigo-500 text-white'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const addTeam = (teamName: string) => {
    const newTeam: Team = {
      id: Date.now().toString(),
      name: teamName,
      avatarColor: getRandomColor(),
    };
    
    setTeams(prevTeams => [...prevTeams, newTeam]);
    setCurrentTeam(newTeam);
  };

  const removeTeam = (teamId: string) => {
    // Don't allow removing the last team
    if (teams.length <= 1) return;
    
    setTeams(prevTeams => {
      const newTeams = prevTeams.filter(team => team.id !== teamId);
      
      // If we're removing the current team, switch to the first available
      if (currentTeam && currentTeam.id === teamId) {
        setCurrentTeam(newTeams[0]);
      }
      
      return newTeams;
    });
  };

  const value = {
    teams,
    currentTeam,
    setCurrentTeam,
    addTeam,
    removeTeam,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};

export default TeamContext; 