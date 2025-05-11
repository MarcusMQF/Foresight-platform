import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserContextType {
  userName: string;
  setUserName: (name: string) => void;
  userRole: string;
  setUserRole: (role: string) => void;
  profileImage: string | null;
  setProfileImage: (image: string | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userName, setUserName] = useState('Marcus Mah');
  const [userRole, setUserRole] = useState('Administrator');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  return (
    <UserContext.Provider value={{ 
      userName, 
      setUserName, 
      userRole, 
      setUserRole,
      profileImage,
      setProfileImage
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 