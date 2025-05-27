import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '../../contexts/TeamContext';

export type Team = {
  id: string;
  name: string;
  avatarColor?: string;
};

type TeamSelectorProps = {
  expanded: boolean;
  currentTeam: Team | null;
  teams: Team[];
  onTeamChange: (team: Team) => void;
  onCreateTeam: (teamName: string) => void;
};

const TeamSelector: React.FC<TeamSelectorProps> = ({
  expanded,
  currentTeam,
  teams,
  onTeamChange,
  onCreateTeam,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { removeTeam } = useTeam();

  // Close dropdown when sidebar collapses
  useEffect(() => {
    if (!expanded) {
      setDropdownOpen(false);
    }
  }, [expanded]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const toggleDropdown = () => {
    if (expanded) {
      setDropdownOpen(!dropdownOpen);
    }
  };

  const handleTeamSelect = (team: Team) => {
    onTeamChange(team);
    setDropdownOpen(false);
  };

  const handleDeleteTeam = (e: React.MouseEvent, teamId: string) => {
    e.stopPropagation(); // Prevent team selection when clicking delete
    if (window.confirm('Are you sure you want to delete this team?')) {
      removeTeam(teamId);
    }
  };

  // Generate a random color for new teams
  const generateRandomColor = () => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleCreateTeam = () => {
    setDropdownOpen(false);
    navigate('/create-team');
  };

  // Get the current team color, with special handling for Personal Workspace
  const getCurrentTeamColor = () => {
    if (!currentTeam) return 'bg-yellow-500 text-black';
    
    // If it's Personal Workspace (id is '1'), always use yellow
    if (currentTeam.id === '1') return 'bg-yellow-500 text-black';
    
    // Otherwise use the team's color or default
    return currentTeam.avatarColor || 'bg-primary-500 text-white';
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={toggleDropdown}
          className="w-full flex items-center rounded-md transition-colors duration-200 ease-in-out py-2"
        >
          {/* Team Icon - Fixed position regardless of sidebar state */}
          <div className={`w-8 h-8 flex items-center justify-center rounded-md ${getCurrentTeamColor()} font-semibold text-xs flex-shrink-0 ml-1`}>
            {currentTeam ? getInitials(currentTeam.name) : 'PW'}
          </div>
          
          {/* Team Name - Only visible when expanded */}
          <div className={`
            ml-3 flex items-center justify-between overflow-hidden transition-all duration-300
            ${expanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}
          `}>
            <span className="text-xs font-medium text-gray-200 truncate max-w-[120px]">
              {currentTeam?.name || 'Personal Workspace'}
            </span>
            <ChevronDown size={14} className="text-gray-400 transform transition flex-shrink-0 ml-1" />
          </div>
        </button>

        {/* Dropdown */}
        {expanded && dropdownOpen && (
          <div className="absolute left-0 right-0 mt-1 bg-gray-700 shadow-lg rounded-md py-1 z-30 border border-gray-600">
            {teams.map(team => (
              <div
                key={team.id}
                className={`
                  w-full flex items-center justify-between px-3 py-2 text-left text-xs
                  ${currentTeam?.id === team.id ? 'bg-gray-600' : 'hover:bg-gray-600'}
                  text-gray-200 group
                `}
              >
                <button
                  onClick={() => handleTeamSelect(team)}
                  className="flex items-center flex-grow"
                >
                  <div className={`
                    w-6 h-6 flex items-center justify-center flex-shrink-0 rounded-md 
                    ${team.id === '1' ? 'bg-yellow-500 text-black' : team.avatarColor || 'bg-primary-500 text-white'}
                    text-[10px] font-semibold
                  `}>
                    {getInitials(team.name)}
                  </div>
                  <span className="ml-2 truncate max-w-[120px]">{team.name}</span>
                </button>
                
                {/* Don't show delete icon for Personal Workspace */}
                {team.id !== '1' && (
                  <button 
                    onClick={(e) => handleDeleteTeam(e, team.id)}
                    className="ml-2 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            
            <div className="border-t border-gray-600 mt-1 pt-1">
              <button
                onClick={handleCreateTeam}
                className="w-full flex items-center px-3 py-2 text-left text-xs text-primary-400"
              >
                <Plus size={14} className="flex-shrink-0" />
                <span className="ml-2">Create New Team</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TeamSelector; 