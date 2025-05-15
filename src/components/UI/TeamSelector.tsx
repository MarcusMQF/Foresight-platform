import React, { useState, useEffect } from 'react';
import { ChevronDown, Users, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
          className="w-full h-12 flex items-center px-2 py-2 relative rounded-md hover:bg-gray-100 transition-all duration-200 ease-in-out"
        >
          {/* Team Icon - Fixed position */}
          <div className={`w-8 h-8 flex items-center justify-center rounded-md ${getCurrentTeamColor()} font-semibold text-xs flex-shrink-0 absolute left-2`}>
            {currentTeam ? getInitials(currentTeam.name) : 'PW'}
          </div>
          
          {/* Team Name - Only visible when expanded */}
          {expanded && (
            <div className="ml-10 flex flex-1 items-center justify-between overflow-hidden">
              <span className="text-xs font-medium truncate max-w-[120px]">
                {currentTeam?.name || 'Personal Workspace'}
              </span>
              <ChevronDown size={14} className="transform transition flex-shrink-0 ml-1" style={{ marginLeft: '-2px' }} />
            </div>
          )}
        </button>

        {/* Dropdown */}
        {expanded && dropdownOpen && (
          <div className="absolute left-0 right-0 mt-1 bg-white shadow-lg rounded-md py-1 z-30 border border-gray-100">
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => handleTeamSelect(team)}
                className={`
                  w-full flex items-center px-3 py-2 text-left text-xs
                  ${currentTeam?.id === team.id ? 'bg-gray-100' : 'hover:bg-gray-50'}
                `}
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
            ))}
            
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={handleCreateTeam}
                className="w-full flex items-center px-3 py-2 text-left text-xs text-primary-500 hover:bg-gray-50"
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