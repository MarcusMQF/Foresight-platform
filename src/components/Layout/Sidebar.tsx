import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Home, 
  Settings, 
  User, 
  FileText, 
  Calendar, 
  Mail, 
  BarChart2, 
  HelpCircle
} from 'lucide-react';
import { useWindowSize } from '../../hooks/useWindowSize';
import icon from '../../assets/images/icon.png';
import upgradeIcon from '../../assets/images/upgrade.png';
import '../../assets/fonts/black-bones.ttf';
import UpgradeDialog from '../UI/UpgradeDialog';
import { preloadAnimation } from '../UI/LottieAnimation';
import upgradeAnimationUrl from '../../assets/animations/upgradeAnimation';

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
        relative flex items-center py-2 px-2 my-0.5
        mx-2
        rounded-md cursor-pointer
        transition-all duration-200 ease-in-out
        group
        ${isActive 
          ? 'bg-primary-500 text-white' 
          : 'text-gray-700 hover:bg-primary-50 hover:text-primary-500'
        }
      `}
    >
      <div className={`
        flex items-center justify-center w-6
        transition-colors duration-200
        ${!isActive && 'group-hover:text-primary-500'}
      `}>
        {icon}
      </div>
      <span className={`
        absolute left-[2.75rem] whitespace-nowrap
        text-xs font-medium
        transition-all duration-300 ease-in-out
        ${expanded ? 'opacity-100 visible translate-x-0' : 'opacity-0 invisible -translate-x-2'}
        ${!isActive && 'group-hover:text-primary-500'}
      `}>
        {text}
      </span>
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
  
  // Preload the animation when sidebar mounts
  useEffect(() => {
    preloadAnimation(upgradeAnimationUrl);
  }, []);

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
          bg-white shadow-md
          transition-all duration-300 ease-in-out
          ${expanded ? 'w-56' : 'w-16'}
          ${isMobile && !expanded ? '-translate-x-full' : 'translate-x-0'}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative h-full flex flex-col">
          <div className="flex items-center p-4 h-16 border-b border-gray-100">
            <Link to="/" className="flex items-center">
              <img src={icon} alt="Logo" className="w-8 h-8" />
              <h1 className={`
                absolute left-[4rem]
                font-bold text-xl tracking-wider text-primary-500 font-foresight
                transition-all duration-300 ease-in-out
                ${expanded ? 'opacity-100 visible translate-x-0' : 'opacity-0 invisible -translate-x-2'}
              `}>
                FORESIGHT
              </h1>
            </Link>
          </div>

          <nav className="flex-1 px-2 py-3 overflow-y-auto">
            <ul>
              <NavItem icon={<Home size={16} />} text="Home" to="/" expanded={expanded} />
              <NavItem icon={<FileText size={16} />} text="Documents" to="/documents" expanded={expanded} />
              <NavItem icon={<Calendar size={16} />} text="Calendar" to="/calendar" expanded={expanded} />
              <NavItem icon={<Mail size={16} />} text="Messages" to="/messages" expanded={expanded} />
              <NavItem icon={<User size={16} />} text="Profile" to="/profile" expanded={expanded} />
              <NavItem icon={<BarChart2 size={16} />} text="Analytics" to="/analytics" expanded={expanded} />
            </ul>

            <div className="mt-6 pt-3 border-t border-gray-100">
              <ul>
                <NavItem icon={<Settings size={16} />} text="Settings" to="/settings" expanded={expanded} />
                <NavItem icon={<HelpCircle size={16} />} text="Help" to="/help" expanded={expanded} />
              </ul>
            </div>
          </nav>
          
          <div className="relative px-2 mt-auto mb-4">
            <div className={`
              absolute bottom-0 left-0 right-0
              rounded-lg overflow-hidden
              transition-all duration-300 ease-in-out
              ${expanded 
                ? 'opacity-100 h-[100px] p-3' 
                : 'opacity-0 h-0 p-0'
              }
            `}>
              <div className="flex items-center">
                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                  <img src={upgradeIcon} alt="Upgrade" className="w-full h-full object-contain" />
                </div>
                <div className="ml-2 whitespace-nowrap">
                  <p className="text-xs font-medium text-gray-800">Pro Plan</p>
                  <p className="text-[10px] text-gray-500">Upgrade features</p>
                </div>
              </div>
              <button 
                onClick={handleUpgradeClick}
                className="mt-2 w-full py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium rounded-md transition-colors duration-200"
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