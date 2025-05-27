import React, { useRef } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Edit2, Camera } from 'lucide-react';
import { useUser } from '../context/UserContext';

const Profile: React.FC = () => {
  const { userName, userRole, profileImage, setProfileImage } = useUser();
  const initials = userName.split(' ').map(n => n[0]).join('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfileImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Profile</h1>
          <p className="text-gray-500">Manage your personal information and preferences.</p>
        </div>
      </div>

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-md border border-gray-200 shadow-card p-5">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-primary-600">{initials}</span>
                )}
              </div>
              <button 
                onClick={handleUploadClick}
                className="absolute bottom-0 right-0 p-1 bg-white rounded-full border border-gray-200 text-gray-600 hover:text-gray-800 transition-colors duration-200 shadow-sm"
              >
                <Camera size={12} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            <h2 className="mt-3 text-base font-bold text-gray-800">{userName}</h2>
            <p className="text-xs text-gray-500">{userRole}</p>
            <button className="mt-3 px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded hover:bg-primary-600 transition-colors duration-200 flex items-center shadow-button">
              <Edit2 size={12} className="mr-1" />
              Edit Profile
            </button>
          </div>

          <div className="mt-5 pt-5 border-t border-gray-200">
            <div className="space-y-3">
              <div className="flex items-center text-xs">
                <Mail size={14} className="text-gray-400 mr-2.5" />
                <span className="text-gray-600">marcus.mah@example.com</span>
              </div>
              <div className="flex items-center text-xs">
                <Phone size={14} className="text-gray-400 mr-2.5" />
                <span className="text-gray-600">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center text-xs">
                <MapPin size={14} className="text-gray-400 mr-2.5" />
                <span className="text-gray-600">San Francisco, CA</span>
              </div>
              <div className="flex items-center text-xs">
                <Briefcase size={14} className="text-gray-400 mr-2.5" />
                <span className="text-gray-600">Foresight Inc.</span>
              </div>
              <div className="flex items-center text-xs">
                <Calendar size={14} className="text-gray-400 mr-2.5" />
                <span className="text-gray-600">Joined March 2023</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Section */}
          <div className="bg-white rounded-md border border-gray-200 shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-800">About</h3>
              <button className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors duration-200">
                <Edit2 size={14} />
              </button>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Experienced Product Manager with a passion for creating user-centric solutions. 
              Skilled in agile methodologies, team leadership, and strategic planning. 
              Always looking for ways to innovate and improve product experiences.
            </p>
          </div>

          {/* Experience Section */}
          <div className="bg-white rounded-md border border-gray-200 shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-800">Experience</h3>
              <button className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors duration-200">
                <Edit2 size={14} />
              </button>
            </div>
            <div className="space-y-4">
              {[
                {
                  role: 'Senior Product Manager',
                  company: 'Foresight Inc.',
                  period: '2023 - Present',
                  description: 'Leading product strategy and development for enterprise solutions.'
                },
                {
                  role: 'Product Manager',
                  company: 'Tech Solutions Ltd.',
                  period: '2020 - 2023',
                  description: 'Managed the complete product lifecycle of mobile applications.'
                },
                {
                  role: 'Associate Product Manager',
                  company: 'Digital Innovations Co.',
                  period: '2018 - 2020',
                  description: 'Assisted in product development and user research initiatives.'
                }
              ].map((experience, index) => (
                <div key={index} className="border-l-2 border-primary-500 pl-3 py-1">
                  <h4 className="text-xs font-medium text-gray-800">{experience.role}</h4>
                  <p className="text-xs text-gray-500">{experience.company} • {experience.period}</p>
                  <p className="mt-0.5 text-xs text-gray-600">{experience.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Skills Section */}
          <div className="bg-white rounded-md border border-gray-200 shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-800">Skills</h3>
              <button className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors duration-200">
                <Edit2 size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                'Product Strategy',
                'Agile Methodology',
                'User Research',
                'Data Analysis',
                'Team Leadership',
                'Strategic Planning',
                'UX Design',
                'Project Management',
                'Market Analysis',
                'Stakeholder Management'
              ].map((skill, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-primary-50 text-primary-600 text-xs font-medium rounded border border-primary-100"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 