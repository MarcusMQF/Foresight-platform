import React, { useState } from 'react';

type TeamDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreateTeam: (teamName: string) => void;
};

const TeamDialog: React.FC<TeamDialogProps> = ({ 
  isOpen, 
  onClose,
  onCreateTeam 
}) => {
  const [teamName, setTeamName] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      onCreateTeam(teamName.trim());
      setTeamName('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md mx-2 md:mx-0 p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create a New Team</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-1">
              Team Name
            </label>
            <input
              type="text"
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter team name"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-md transition-colors duration-200"
            >
              Create Team
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamDialog; 