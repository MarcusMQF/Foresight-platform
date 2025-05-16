import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Search, User, Calendar, ChevronDown, Menu, LogOut, Settings, HelpCircle, User2, Sparkles } from 'lucide-react';
import UpgradeDialog from '../UI/UpgradeDialog';
import SearchDialog from '../UI/SearchDialog';
import { useUser } from '../../context/UserContext';

const Topbar: React.FC = () => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { userName, userRole, profileImage } = useUser();
  const initials = userName.split(' ').map(n => n[0]).join('');
  
  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  }).format(currentDate);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileRef]);
  
  const handleUpgradeClick = () => {
    setIsUpgradeDialogOpen(true);
  };

  const handleSearchClick = () => {
    setIsSearchDialogOpen(true);
  };
  
  const handleSearchClose = () => {
    setIsSearchDialogOpen(false);
    setSearchQuery('');
  };
  
  // Update search query handler
  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
  };
  
  return (
    <>
      <header className="bg-white border-b border-gray-100 h-16 flex items-center justify-between px-4 md:px-6 shadow-sm">
        <div className="flex items-center">
          <button 
            className="md:hidden p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none mr-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu size={20} />
          </button>
          
          <div className="hidden md:flex items-center space-x-2 text-gray-500 mr-9">
            <Calendar size={16} />
            <span className="text-xs font-medium">{formattedDate}</span>
          </div>
          
          <div 
            className={`
              flex items-center px-3 py-2 rounded-md border cursor-pointer
              transition-all duration-200 ease-in-out
              ${isSearchFocused 
                ? 'bg-white border-primary-200 shadow-sm' 
                : 'bg-gray-100 border-transparent'
              }
            `}
            onClick={handleSearchClick}
          >
            <Search 
              size={16} 
              className={`
                transition-colors duration-200
                ${isSearchFocused ? 'text-primary-500' : 'text-gray-400'}
              `} 
            />
            <input
              type="text"
              placeholder="Search..."
              className="ml-2 bg-transparent border-none outline-none text-xs font-medium text-gray-600 w-40 md:w-56 cursor-pointer"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                setIsSearchFocused(true);
                handleSearchClick();
              }}
              onBlur={() => setIsSearchFocused(false)}
              readOnly
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4 pr-4 md:pr-6">
          <button className="relative p-2 rounded-full text-gray-500 hover:text-primary-500 focus:outline-none transition-colors duration-200">
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full ring-2 ring-white"></span>
          </button>
          
          <div ref={profileRef} className="relative">
            <div 
              className={`
                flex items-center cursor-pointer rounded-lg px-2 py-1.5 transition-colors duration-200
                ${isProfileOpen ? 'bg-gray-100' : 'bg-gray-50 hover:bg-gray-100'}
              `}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div className="w-7 h-7 rounded-full bg-tertiary-500 flex items-center justify-center text-primary-600 font-bold shadow-sm overflow-hidden">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={16} />
                )}
              </div>
              <div className="ml-2 hidden md:block">
                <p className="text-xs font-medium text-gray-800">{userName}</p>
                <p className="text-[10px] text-gray-500">{userRole}</p>
              </div>
              <ChevronDown 
                size={14} 
                className={`
                  ml-2.5 hidden md:block transition-transform duration-200
                  ${isProfileOpen ? 'text-gray-600 transform rotate-180' : 'text-gray-400'}
                `} 
              />
            </div>
            
            {/* Dropdown menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-md border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-tertiary-500 flex items-center justify-center text-primary-600 font-bold shadow-sm overflow-hidden mr-2">
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt={userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm">{initials}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-800">{userName}</p>
                    <p className="text-[10px] text-gray-500">{userRole}</p>
                  </div>
                </div>
                
                <ul>
                  <li>
                    <Link 
                      to="/profile" 
                      className="flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User2 size={14} className="mr-2 text-gray-500" />
                      <span>My Profile</span>
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-gray-50">
                      <Settings size={14} className="mr-2 text-gray-500" />
                      <span>Account Settings</span>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-gray-50">
                      <HelpCircle size={14} className="mr-2 text-gray-500" />
                      <span>Help Center</span>
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="flex items-center px-4 py-2 text-xs text-primary-600 hover:bg-gray-50"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsProfileOpen(false);
                        handleUpgradeClick();
                      }}
                    >
                      <Sparkles size={14} className="mr-2 text-primary-500" />
                      <span>Upgrade to Premium</span>
                    </a>
                  </li>
                  <li className="border-t border-gray-100 mt-1">
                    <a href="#" className="flex items-center px-4 py-2 text-xs text-red-600 hover:bg-gray-50">
                      <LogOut size={14} className="mr-2" />
                      <span>Sign Out</span>
                    </a>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search Dialog */}
      <SearchDialog
        isOpen={isSearchDialogOpen}
        onClose={handleSearchClose}
        initialQuery={searchQuery}
      />

      {/* Upgrade Dialog */}
      <UpgradeDialog 
        isOpen={isUpgradeDialogOpen} 
        onClose={() => setIsUpgradeDialogOpen(false)} 
      />
    </>
  );
};

export default Topbar;