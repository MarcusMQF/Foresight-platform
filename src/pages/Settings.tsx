import React, { useState } from 'react';
import { Bell, Lock, Globe, Moon, Sun, User, CreditCard, Shield, Save, Check } from 'lucide-react';
import { useUser } from '../context/UserContext';

const Settings: React.FC = () => {
  const { userName, setUserName, userRole } = useUser();
  const [formData, setFormData] = useState({
    fullName: userName,
    email: 'marcus.mah@example.com',
    phone: '+1 (555) 123-4567'
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    setSaveStatus('saving');
    setUserName(formData.fullName);
    // Simulate API call
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 800);
  };

  // Custom toggle switch component
  const Toggle = ({ defaultChecked = false }: { defaultChecked?: boolean }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" defaultChecked={defaultChecked} />
      <div className="w-9 h-5 bg-gray-200 rounded-full peer 
                    peer-checked:bg-primary-500 
                    after:content-[''] after:absolute after:top-0.5 after:left-0.5 
                    after:bg-white after:rounded-full after:h-4 after:w-4 
                    after:transition-all after:border-gray-300 
                    peer-checked:after:translate-x-4 peer-checked:after:border-white"></div>
    </label>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Settings</h1>
          <p className="text-gray-500">Manage your account settings and preferences.</p>
        </div>
      </div>

      {/* Settings Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-md border border-gray-200 shadow-card">
            <nav className="py-1">
              {[
                { icon: <User size={16} />, label: 'Account', active: true },
                { icon: <Bell size={16} />, label: 'Notifications' },
                { icon: <Lock size={16} />, label: 'Privacy & Security' },
                { icon: <Globe size={16} />, label: 'Language & Region' },
                { icon: <CreditCard size={16} />, label: 'Billing' },
                { icon: <Shield size={16} />, label: 'Security' },
              ].map((item, index) => (
                <button
                  key={index}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-2.5 text-xs
                    transition-colors duration-200 border-l-2
                    ${item.active 
                      ? 'bg-primary-50 text-primary-600 border-l-primary-500' 
                      : 'text-gray-600 hover:bg-gray-50 border-l-transparent'
                    }
                  `}
                >
                  <span className={`${item.active ? 'text-primary-500' : 'text-gray-400'}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Account Settings */}
          <div className="bg-white rounded-md border border-gray-200 shadow-card p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4">Account Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-md border border-gray-200 shadow-card p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4">Preferences</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <h3 className="text-xs font-medium text-gray-800">Dark Mode</h3>
                  <p className="text-xs text-gray-500">Enable dark mode for the interface</p>
                </div>
                <button className="p-1.5 bg-gray-100 rounded text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors duration-200">
                  <Moon size={14} />
                </button>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <h3 className="text-xs font-medium text-gray-800">Email Notifications</h3>
                  <p className="text-xs text-gray-500">Receive email notifications for important updates</p>
                </div>
                <Toggle defaultChecked />
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <h3 className="text-xs font-medium text-gray-800">Two-Factor Authentication</h3>
                  <p className="text-xs text-gray-500">Enable 2FA for added security on your account</p>
                </div>
                <Toggle />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="text-xs font-medium text-gray-800">Browser Notifications</h3>
                  <p className="text-xs text-gray-500">Receive notifications in your browser</p>
                </div>
                <Toggle defaultChecked />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button 
              onClick={handleSave}
              disabled={saveStatus === 'saving' || saveStatus === 'saved'}
              className={`
                px-3 py-1.5 text-white text-xs font-medium rounded hover:bg-primary-600 
                transition-colors duration-200 flex items-center shadow-button
                ${saveStatus === 'saved' ? 'bg-green-500' : 'bg-primary-500'}
                ${(saveStatus === 'saving' || saveStatus === 'saved') ? 'opacity-80 cursor-not-allowed' : ''}
              `}
            >
              {saveStatus === 'idle' && (
                <>
                  <Save size={14} className="mr-1" />
                  Save Changes
                </>
              )}
              {saveStatus === 'saving' && (
                <>
                  <span className="mr-1 animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                  Saving...
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check size={14} className="mr-1" />
                  Saved
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 