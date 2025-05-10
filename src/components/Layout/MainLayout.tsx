import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

type MainLayoutProps = {
  children: React.ReactNode;
};

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        expanded={sidebarExpanded}
        setExpanded={setSidebarExpanded}
      />

      {/* Main content */}
      <div className={`
        flex-1 flex flex-col
        transition-all duration-300 ease-in-out-soft
        ${sidebarExpanded ? 'md:ml-56' : 'md:ml-16'}
        bg-gradient-to-br from-gray-50 to-gray-100
      `}>
        <Topbar />
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;