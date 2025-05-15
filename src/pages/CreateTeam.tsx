import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Flag, AlertCircle, Loader } from 'lucide-react';
import { useTeam } from '../contexts/TeamContext';
import LottieAnimation from '../components/UI/LottieAnimation';
import { TEAM_CREATION_ANIMATION } from '../utils/animationPreloader';

const CreateTeam: React.FC = () => {
  const [step, setStep] = useState(1);
  const [teamName, setTeamName] = useState('');
  const [emails, setEmails] = useState<string[]>(['', '', '']);
  const [errors, setErrors] = useState<{
    teamName?: string;
    email?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { addTeam } = useTeam();

  const validateTeamName = () => {
    if (!teamName.trim()) {
      setErrors(prev => ({ ...prev, teamName: 'Team name is required' }));
      return false;
    }
    
    if (teamName.length > 20) {
      setErrors(prev => ({ ...prev, teamName: 'Team name cannot exceed 20 characters' }));
      return false;
    }
    
    setErrors(prev => ({ ...prev, teamName: undefined }));
    return true;
  };

  const validateEmails = () => {
    const filledEmails = emails.filter(email => email.trim() !== '');
    
    for (const email of filledEmails) {
      // Check for @ symbol
      if (!email.includes('@')) {
        setErrors(prev => ({ ...prev, email: 'Email must contain @ symbol' }));
        return false;
      }
      
      // Check for uppercase characters
      if (/[A-Z]/.test(email)) {
        setErrors(prev => ({ ...prev, email: 'Email cannot contain uppercase letters' }));
        return false;
      }
      
      // Check for special characters
      if (/[/?<>\\|]/.test(email)) {
        setErrors(prev => ({ ...prev, email: 'Email cannot contain special characters like /?<>\\|' }));
        return false;
      }
      
      // Basic email format validation
      if (!/\S+@\S+\.\S+/.test(email)) {
        setErrors(prev => ({ ...prev, email: 'Invalid email format' }));
        return false;
      }
    }
    
    setErrors(prev => ({ ...prev, email: undefined }));
    return true;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (validateTeamName()) {
        setStep(2);
      }
    }
  };

  const handleSendInvites = async () => {
    setIsLoading(true);
    setErrors(prev => ({ ...prev, email: undefined }));
    
    // Check if at least one email is entered
    const filledEmails = emails.filter(email => email.trim() !== '');
    if (filledEmails.length === 0) {
      setErrors(prev => ({ ...prev, email: 'Please enter at least one email address' }));
      setIsLoading(false);
      return;
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (validateEmails()) {
      setStep(3);
    }
    
    setIsLoading(false);
  };

  const handleCreateTeam = () => {
    if (validateTeamName()) {
      addTeam(teamName);
      navigate('/');
    }
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
    
    // Clear error when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <div className="flex items-center mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-500 text-white">
                <Flag size={16} />
              </div>
              <h2 className="ml-3 text-base font-semibold">Name your team</h2>
            </div>
            <p className="text-xs text-gray-500 mb-6 ml-11">
              Give your team a name to get started. You can always change this later.
            </p>
            <div className="mb-6">
              <label htmlFor="teamName" className="block text-xs font-medium text-gray-700 mb-1">
                Team Name
              </label>
              <input
                type="text"
                id="teamName"
                value={teamName}
                onChange={(e) => {
                  setTeamName(e.target.value);
                  if (errors.teamName) {
                    setErrors(prev => ({ ...prev, teamName: undefined }));
                  }
                }}
                className={`w-full px-3 py-2 text-sm border ${errors.teamName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500`}
                placeholder="Enter team name"
                maxLength={20}
                required
              />
              {errors.teamName && (
                <p className="mt-1 text-xs text-red-500 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.teamName}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {teamName.length}/20 characters
              </p>
            </div>

            <div className="flex justify-between space-x-2 mt-8">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                disabled={!teamName.trim()}
                className={`px-3 py-1.5 text-xs font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 ${
                  !teamName.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Continue
              </button>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className="flex items-center mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-500 text-white">
                <Users size={16} />
              </div>
              <h2 className="ml-3 text-base font-semibold">Add team members</h2>
            </div>
            <p className="text-xs text-gray-500 mb-6 ml-11">
              Invite people to collaborate with you. Don't worry, you can add more team members later.
            </p>
            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Invite by email
              </label>
              <div className="space-y-2">
                {emails.map((email, index) => (
                  <input
                    key={index}
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    className={`w-full px-3 py-2 text-sm border ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500`}
                    placeholder={`team.member${index + 1}@example.com`}
                  />
                ))}
              </div>
              
              {errors.email && (
                <p className="mt-2 text-xs text-red-500 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between mt-8">
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Skip
                </button>
              </div>
              <button
                type="button"
                onClick={handleSendInvites}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 flex items-center"
              >
                {isLoading ? (
                  <>
                    <Loader size={12} className="animate-spin mr-1" />
                    Sending...
                  </>
                ) : (
                  'Send Invites'
                )}
              </button>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <div className="flex flex-col items-center mb-6">
              <LottieAnimation 
                animationUrl={TEAM_CREATION_ANIMATION} 
                width={260} 
                height={260} 
                className="mb-4"
              />
              <h2 className="text-base font-semibold">Finish setup</h2>
            </div>
            <p className="text-xs text-gray-500 text-center mb-4">
              You're all set! Click "Create Team" to finish setup.
            </p>

            <div className="flex justify-between space-x-2 mt-8">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCreateTeam}
                className="px-3 py-1.5 text-xs font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600"
              >
                Create Team
              </button>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white min-h-screen w-full flex flex-col p-6">
      <div className="max-w-md w-full mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="mb-3 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          <span className="ml-1 text-sm">Go back</span>
        </button>
      </div>
      
      <div className="flex-1 flex items-start justify-center mt-12 pt-12">
        <div className="max-w-md w-full">
          {/* Progress Bar */}
          <div className="mb-5">
            <div className="flex justify-between mb-1">
              <div className="text-xs font-medium text-primary-500">Step {step} of 3</div>
              <div className="text-xs font-medium text-gray-500">
                {step === 1 && 'Name your team'}
                {step === 2 && 'Add team members'}
                {step === 3 && 'Finish setup'}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-500 h-2 rounded-full transition-all duration-300 ease-in-out" 
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mb-5">
            {renderStepContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTeam; 