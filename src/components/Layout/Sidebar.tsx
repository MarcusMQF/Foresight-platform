import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Home, 
  Settings, 
  User, 
  FileText, 
  Calendar, 
  Mail, 
  BarChart2, 
  HelpCircle,
  FileCheck} from 'lucide-react';
import { useWindowSize } from '../../hooks/useWindowSize';
import { useTeam } from '../../contexts/TeamContext';
import icon from '../../assets/images/icon.png';
import upgradeIcon from '../../assets/images/upgrade.png';
import '../../assets/fonts/black-bones.ttf';
import '../../assets/fonts/TypoSlab-Irregular.otf';
import '../../assets/fonts/Chill-Chrip-Free.otf';
import UpgradeDialog from '../UI/UpgradeDialog';
import TeamSelector from '../UI/TeamSelector';

type SidebarProps = {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
};

type NavItemProps = {
  icon: React.ReactNode;
  text: string;
  to: string;
  expanded: boolean;
};

const NavItem: React.FC<NavItemProps> = ({ 
  icon, 
  text,
  to,
  expanded
}) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`
        flex items-center py-2 px-2 my-1
        rounded-md cursor-pointer
        transition-colors duration-200 ease-in-out
        group
        ${isActive 
          ? 'bg-primary-600 text-white' 
          : 'text-gray-200 hover:bg-gray-700 hover:text-white'
        }
      `}
    >
      <div className="flex items-center justify-center w-6 h-6 flex-shrink-0">
        {icon}
      </div>
      <div className={`
        ml-3 whitespace-nowrap text-xs font-medium overflow-hidden transition-all duration-300
        ${expanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}
      `}>
        {text}
      </div>
    </Link>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ 
  expanded, 
  setExpanded
}) => {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  
  // Use team context instead of local state
  const { teams, currentTeam, setCurrentTeam, addTeam } = useTeam();
  
  const handleMouseEnter = () => {
    if (!isMobile) {
      setExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setExpanded(false);
    }
  };

  const handleUpgradeClick = () => {
    setIsUpgradeDialogOpen(true);
  };

  return (
    <>
      <aside 
        className={`
          fixed top-0 left-0 z-20 h-full
          bg-gray-800 shadow-xl
          transition-all duration-300 ease-in-out
          ${expanded ? 'w-56' : 'w-16'}
          ${isMobile && !expanded ? '-translate-x-full' : 'translate-x-0'}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative h-full flex flex-col">
          <div className="flex items-center h-16 px-3 border-b border-gray-700">
            <Link to="/" className="flex items-center pl-1">
              <img src={icon} alt="Logo" className="w-8 h-8 flex-shrink-0" />
              <div className={`
                ml-4 whitespace-nowrap overflow-hidden transition-all duration-300
                ${expanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}
              `}>
                <h1 className="font-bold text-2xl tracking-widest text-primary-500 font-chill-chirp">
                  FORESIGHT
                </h1>
              </div>
            </Link>
          </div>

          {/* Team Selector */}
          <div className="px-3 py-3 border-b border-gray-700">
            <TeamSelector
              expanded={expanded}
              currentTeam={currentTeam}
              teams={teams}
              onTeamChange={setCurrentTeam}
              onCreateTeam={addTeam}
            />
          </div>

          <nav className="flex-1 px-3 py-3 overflow-y-auto">
            <ul className="space-y-1">
              <NavItem icon={<Home size={16} />} text="Home" to="/" expanded={expanded} />
              <NavItem icon={<FileText size={16} />} text="Documents" to="/documents" expanded={expanded} />
              <NavItem icon={<Calendar size={16} />} text="Calendar" to="/calendar" expanded={expanded} />
              <NavItem icon={<Mail size={16} />} text="Messages" to="/messages" expanded={expanded} />
              <NavItem icon={<User size={16} />} text="Profile" to="/profile" expanded={expanded} />
              <NavItem icon={<BarChart2 size={16} />} text="Analytics" to="/analytics" expanded={expanded} />
              <NavItem icon={<FileCheck size={16} />} text="Resume Test" to="/test/resume-analysis" expanded={expanded} />
            </ul>

            <div className="mt-6 pt-3 border-t border-gray-700">
              <ul className="space-y-1">
                <NavItem icon={<Settings size={16} />} text="Settings" to="/settings" expanded={expanded} />
                <NavItem icon={<HelpCircle size={16} />} text="Help" to="/help" expanded={expanded} />
              </ul>
            </div>
          </nav>
          
          <div className={`
            px-3 mt-auto mb-10
            transition-opacity duration-300 ease-in-out
            ${expanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}
          `}>
            <div className="rounded-lg bg-gray-700 p-3 mx-auto w-[calc(100%-6px)]">
              <div className="flex items-center">
                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                  <img src={upgradeIcon} alt="Upgrade" className="w-5 h-5 object-contain" />
                </div>
                <div className={`
                  ml-2 transition-all duration-300 ease-in-out
                  ${expanded ? 'opacity-100 max-h-12' : 'opacity-0 max-h-0 overflow-hidden'}
                `}>
                  <p className="text-xs font-medium text-white">Pro Plan</p>
                  <p className="text-[10px] text-gray-300">Upgrade features</p>
                </div>
              </div>
              <button 
                onClick={handleUpgradeClick}
                className={`
                  mt-2 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium rounded-md transition-all duration-300
                  ${expanded ? 'opacity-100 w-full h-8' : 'opacity-0 h-0 w-0 overflow-hidden'}
                `}
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Upgrade Dialog */}
      <UpgradeDialog 
        isOpen={isUpgradeDialogOpen} 
        onClose={() => setIsUpgradeDialogOpen(false)} 
      />
    </>
  );
};

export default Sidebar;