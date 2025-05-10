import React, { useState, useEffect } from 'react';
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
  expanded: boolean;
  active?: boolean;
};

const NavItem: React.FC<NavItemProps> = ({ 
  icon, 
  text, 
  expanded,
  active = false
}) => {
  return (
    <li className={`
      relative flex items-center py-2 px-2 my-0.5
      mx-2
      rounded-md cursor-pointer
      transition-all duration-200 ease-in-out
      group
      ${active 
        ? 'bg-primary-500 text-white' 
        : 'text-gray-700 hover:bg-primary-50 hover:text-primary-500'
      }
    `}>
      <div className={`
        flex items-center justify-center w-6
        transition-colors duration-200
        ${!active && 'group-hover:text-primary-500'}
      `}>
        {icon}
      </div>
      <span className={`
        absolute left-[2.75rem] whitespace-nowrap
        text-xs font-medium
        transition-all duration-300 ease-in-out
        ${expanded ? 'opacity-100 visible translate-x-0' : 'opacity-0 invisible -translate-x-2'}
        ${!active && 'group-hover:text-primary-500'}
      `}>
        {text}
      </span>
    </li>
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
            <img src={icon} alt="Foresight Logo" className="w-8 h-8 object-contain" />
            <h1 className={`
              absolute left-[4rem]
              font-bold text-xl tracking-wider text-primary-500 font-foresight
              transition-all duration-300 ease-in-out
              ${expanded ? 'opacity-100 visible translate-x-0' : 'opacity-0 invisible -translate-x-2'}
            `}>
              FORESIGHT
            </h1>
          </div>

          <nav className="flex-1 px-2 py-3 overflow-y-auto">
            <ul>
              <NavItem icon={<Home size={16} />} text="Home" expanded={expanded} active />
              <NavItem icon={<FileText size={16} />} text="Documents" expanded={expanded} />
              <NavItem icon={<Calendar size={16} />} text="Calendar" expanded={expanded} />
              <NavItem icon={<Mail size={16} />} text="Messages" expanded={expanded} />
              <NavItem icon={<User size={16} />} text="Profile" expanded={expanded} />
              <NavItem icon={<BarChart2 size={16} />} text="Analytics" expanded={expanded} />
            </ul>

            <div className="mt-6 pt-3 border-t border-gray-100">
              <ul>
                <NavItem icon={<Settings size={16} />} text="Settings" expanded={expanded} />
                <NavItem icon={<HelpCircle size={16} />} text="Help" expanded={expanded} />
              </ul>
            </div>
          </nav>
          
          <div className="relative px-2 mt-auto mb-4">
            <div className={`
              absolute bottom-0 left-0 right-0
              bg-primary-50 rounded-lg overflow-hidden
              transition-all duration-300 ease-in-out
              ${expanded 
                ? 'opacity-100 h-[100px] p-3' 
                : 'opacity-0 h-0 p-0'
              }
            `}>
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white flex-shrink-0">
                  <User size={14} />
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