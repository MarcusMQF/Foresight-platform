import React, { useEffect, useRef } from 'react';
import DashboardCard from './DashboardCard';
import { 
  Users, 
  FileText, 
  Briefcase,
  BarChart, 
  TrendingUp, 
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  BookOpen,
  Code,
  GraduationCap
} from 'lucide-react';

const DashboardContent: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Animation effect when navigating to this page
  useEffect(() => {
    const elements = document.querySelectorAll('.animate-in');
    
    // Apply staggered animation to each element
    elements.forEach((element, index) => {
      setTimeout(() => {
        if (element instanceof HTMLElement) {
          element.style.opacity = '1';
          element.style.transform = 'translateY(0)';
        }
      }, 100 * index);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 animate-in" 
           style={{ opacity: 0, transform: 'translateY(20px)', transition: 'all 0.5s ease-out' }}>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Talent Acquisition Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here's your candidate pipeline overview.</p>
        </div>
        
        <div className="flex items-center justify-end space-x-2">
          <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition-colors duration-200 flex items-center shadow-sm">
            <span>Export</span>
            <ExternalLink size={14} className="ml-1.5" />
          </button>
          <button className="px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded hover:bg-primary-600 transition-colors duration-200 flex items-center shadow-sm">
            <span>Generate Report</span>
            <ChevronRight size={14} className="ml-1" />
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="animate-in" style={{ opacity: 0, transform: 'translateY(20px)', transition: 'all 0.5s ease-out' }}>
          <DashboardCard
            title="Total Applicants"
            value="2,845"
            subtitle="This month"
            icon={<Users size={18} />}
            color="primary"
            trend={{ value: 12, isUp: true }}
          />
        </div>
        <div className="animate-in" style={{ opacity: 0, transform: 'translateY(20px)', transition: 'all 0.5s ease-out' }}>
          <DashboardCard
            title="Screened Resumes"
            value="1,683"
            subtitle="59% completion rate"
            icon={<FileText size={18} />}
            color="secondary"
            trend={{ value: 8, isUp: true }}
          />
        </div>
        <div className="animate-in" style={{ opacity: 0, transform: 'translateY(20px)', transition: 'all 0.5s ease-out' }}>
          <DashboardCard
            title="Interviews"
            value="342"
            subtitle="Last 30 days"
            icon={<Briefcase size={18} />}
            color="tertiary"
            trend={{ value: 4, isUp: true }}
          />
        </div>
        <div className="animate-in" style={{ opacity: 0, transform: 'translateY(20px)', transition: 'all 0.5s ease-out' }}>
          <DashboardCard
            title="Time-to-Hire"
            value="18.5 days"
            subtitle="2.3 days decrease"
            icon={<BarChart size={18} />}
            color="primary"
            trend={{ value: 12, isUp: false }}
          />
        </div>
      </div>
      
      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded shadow-card border border-gray-100 animate-in relative pb-16"
             style={{ opacity: 0, transform: 'translateY(20px)', transition: 'all 0.5s ease-out' }}
             ref={chartRef}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-gray-800 text-lg">Application Trends</h2>
            <div className="flex items-center text-xs font-medium bg-green-50 text-green-600 px-2 py-1.5 rounded border border-green-100">
              <TrendingUp size={14} className="mr-1" />
              11.2% increase
            </div>
          </div>
          
          <div className="h-80 relative pt-6 pb-8">
            {/* Line chart with data points */}
            <div className="absolute inset-0 pt-6 pb-8">
              {/* Line path with animated drawing */}
              <svg className="w-full h-full" viewBox="0 0 1100 300" preserveAspectRatio="none">
                {/* Background grid lines - horizontal */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <line 
                    key={`h-${i}`}
                    x1="0" 
                    y1={60 + i * 45} 
                    x2="1100" 
                    y2={60 + i * 45} 
                    stroke="#E5E7EB" 
                    strokeWidth="1" 
                    strokeDasharray="5,5"
                  />
                ))}
                
                {/* Background grid lines - vertical */}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <line 
                    key={`v-${i}`}
                    x1={100 + i * 100} 
                    y1="40" 
                    x2={100 + i * 100} 
                    y2="260" 
                    stroke="#E5E7EB" 
                    strokeWidth="1" 
                    strokeDasharray="5,5"
                    opacity="0.5"
                  />
                ))}
                
                {/* Area under the line */}
                <path 
                  d="M50,240 L140,210 L230,190 L320,210 L410,195 L500,205 L590,190 L680,150 L770,170 L860,135 L950,145 L1040,90 V260 H50 Z"
                  fill="url(#gradient)"
                  opacity="0.2"
                />
                
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#F85525" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#F85525" stopOpacity="0.1" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                
                {/* Main trend line */}
                <path 
                  d="M50,240 L140,210 L230,190 L320,210 L410,195 L500,205 L590,190 L680,150 L770,170 L860,135 L950,145 L1040,90"
                  fill="none" 
                  stroke="#F85525"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                />
                
                {/* Data points */}
                {[
                  {x: 50, y: 240, month: 'Jan', value: 45}, 
                  {x: 140, y: 210, month: 'Feb', value: 58}, 
                  {x: 230, y: 190, month: 'Mar', value: 65}, 
                  {x: 320, y: 210, month: 'Apr', value: 55},
                  {x: 410, y: 195, month: 'May', value: 62}, 
                  {x: 500, y: 205, month: 'Jun', value: 59}, 
                  {x: 590, y: 190, month: 'Jul', value: 68}, 
                  {x: 680, y: 150, month: 'Aug', value: 81},
                  {x: 770, y: 170, month: 'Sep', value: 76}, 
                  {x: 860, y: 135, month: 'Oct', value: 85}, 
                  {x: 950, y: 145, month: 'Nov', value: 79}, 
                  {x: 1040, y: 90, month: 'Dec', value: 98}
                ].map((point, i) => (
                  <g key={i} className="cursor-pointer group">
                    {/* Pulsing background effect for highlight */}
                    <circle 
                      cx={point.x} 
                      cy={point.y} 
                      r="10" 
                      fill="#F85525"
                      opacity="0"
                      className="group-hover:opacity-20 group-hover:animate-pulse-subtle"
                    />
                    {/* Outer circle (white border with shadow) */}
                    <circle 
                      cx={point.x} 
                      cy={point.y} 
                      r="8" 
                      fill="white"
                      stroke="#F85525"
                      strokeWidth="1"
                      className="shadow-sm transition-all duration-300 group-hover:r-9"
                    />
                    {/* Inner circle (orange fill) */}
                    <circle 
                      cx={point.x} 
                      cy={point.y} 
                      r="5" 
                      fill="#F85525"
                      className="transition-all duration-300 group-hover:r-6"
                    />
                    
                    {/* Enhanced tooltip */}
                    <g 
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      transform={`translate(${point.x - 55}, ${point.y - 80})`}
                    >
                      <rect
                        x="0"
                        y="0"
                        width="110"
                        height="60"
                        rx="6"
                        fill="#1F2937"
                        className="drop-shadow-lg"
                      />
                      <polygon 
                        points="50,60 55,70 60,60" 
                        fill="#1F2937" 
                      />
                      <text
                        x="55"
                        y="20"
                        fontFamily="sans-serif"
                        fontSize="14"
                        fontWeight="bold"
                        fill="white"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >{point.month}</text>
                      <text
                        x="55"
                        y="40"
                        fontFamily="sans-serif"
                        fontSize="12"
                        fill="#F85525"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontWeight="bold"
                      >{point.value} applicants</text>
                    </g>
                  </g>
                ))}
                
                {/* Y-axis labels */}
                <text x="25" y="60" fontSize="10" fill="#6B7280" textAnchor="end">100</text>
                <text x="25" y="105" fontSize="10" fill="#6B7280" textAnchor="end">80</text>
                <text x="25" y="150" fontSize="10" fill="#6B7280" textAnchor="end">60</text>
                <text x="25" y="195" fontSize="10" fill="#6B7280" textAnchor="end">40</text>
                <text x="25" y="240" fontSize="10" fill="#6B7280" textAnchor="end">20</text>
              </svg>
            </div>
            
            {/* X-axis labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-10">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                <div key={i} className="text-xs text-gray-500 font-medium">{month}</div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded shadow-card border border-gray-100 animate-in relative pb-16"
             style={{ opacity: 0, transform: 'translateY(20px)', transition: 'all 0.5s ease-out' }}>
          <h2 className="font-bold text-gray-800 text-lg mb-6">Top Skills in Demand</h2>
          
          <div className="space-y-5">
            {[
              { name: 'Data Analysis', count: 253, percentage: 85 },
              { name: 'Machine Learning', count: 186, percentage: 65 },
              { name: 'UX/UI Design', count: 143, percentage: 40 },
              { name: 'Cloud Architecture', count: 89, percentage: 25 }
            ].map((skill, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-800">{skill.name}</span>
                  <span className="text-gray-500 font-medium">{skill.count} candidates</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded overflow-hidden">
                  <div 
                    className="h-full rounded bg-gradient-to-r from-primary-500 to-secondary-500"
                    style={{ width: `${skill.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          <button className="absolute bottom-6 left-6 right-6 py-2 bg-gray-50 hover:bg-gray-100 text-gray-800 text-xs font-medium rounded
            transition-colors duration-200 flex items-center justify-center border border-gray-200">
            <span>View all skills</span>
            <ArrowUpRight size={14} className="ml-1" />
          </button>
        </div>
      </div>
      
      {/* Recent Activity + Candidate by Department */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded shadow-card border border-gray-100 animate-in"
             style={{ opacity: 0, transform: 'translateY(20px)', transition: 'all 0.5s ease-out' }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-gray-800 text-lg">Recent Candidate Activity</h2>
            <button className="text-primary-500 hover:text-primary-600 text-sm font-medium">View all</button>
          </div>
          
          <div className="space-y-4">
            {[
              { type: 'screening', candidate: 'Alex Morgan', action: 'passed AI screening', time: '2 hours ago', status: 'success' },
              { type: 'interview', candidate: 'Jamie Wilson', action: 'scheduled technical interview', time: '4 hours ago', status: 'pending' },
              { type: 'application', candidate: 'Taylor Reed', action: 'submitted application', time: '6 hours ago', status: 'success' },
              { type: 'rejection', candidate: 'Casey Davis', action: 'was rejected', time: '12 hours ago', status: 'error' }
            ].map((activity, index) => (
              <div key={index} className="flex items-start p-3 rounded hover:bg-gray-50 transition-colors duration-150">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0 relative
                  ${activity.status === 'success' ? 'bg-green-50 text-green-500' : 
                    activity.status === 'error' ? 'bg-red-50 text-red-500' : 
                    'bg-yellow-50 text-yellow-500'}
                `}>
                  <div className={`
                    absolute inset-0 rounded-full filter blur-sm opacity-50
                    ${activity.status === 'success' ? 'bg-green-200' : 
                      activity.status === 'error' ? 'bg-red-200' : 
                      'bg-yellow-200'}
                  `}></div>
                  <div className="relative z-10">
                    {activity.status === 'success' ? <CheckCircle2 size={20} /> : 
                     activity.status === 'error' ? <XCircle size={20} /> :
                     <Clock size={20} />}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-800">
                      <span className="font-semibold">{activity.candidate}</span> {activity.action}
                    </p>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.type === 'screening' ? 'Match score: 87%' : 
                     activity.type === 'interview' ? 'Scheduled for: Tomorrow, 2:00 PM' : 
                     activity.type === 'application' ? 'Position: Senior Data Scientist' :
                     'Reason: Skills mismatch'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded shadow-card border border-gray-100 animate-in relative pb-16"
             style={{ opacity: 0, transform: 'translateY(20px)', transition: 'all 0.5s ease-out' }}>
          <h2 className="font-bold text-gray-800 text-lg mb-6">Candidates by Department</h2>
          
          <div className="space-y-5">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full bg-primary-300 filter blur-sm opacity-50"></div>
                <Code size={16} className="text-primary-600 relative z-10" />
              </div>
              <div className="ml-3 flex-1">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-800">Engineering</span>
                  <span className="text-xs font-medium text-gray-600">42%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                  <div className="h-full rounded-full bg-primary-500" style={{ width: '42%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full bg-secondary-300 filter blur-sm opacity-50"></div>
                <BookOpen size={16} className="text-secondary-600 relative z-10" />
              </div>
              <div className="ml-3 flex-1">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-800">Marketing</span>
                  <span className="text-xs font-medium text-gray-600">27%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                  <div className="h-full rounded-full bg-secondary-500" style={{ width: '27%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-tertiary-100 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full bg-tertiary-300 filter blur-sm opacity-50"></div>
                <Star size={16} className="text-tertiary-600 relative z-10" />
              </div>
              <div className="ml-3 flex-1">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-800">Design</span>
                  <span className="text-xs font-medium text-gray-600">18%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                  <div className="h-full rounded-full bg-tertiary-500" style={{ width: '18%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full bg-gray-300 filter blur-sm opacity-50"></div>
                <GraduationCap size={16} className="text-gray-600 relative z-10" />
              </div>
              <div className="ml-3 flex-1">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-800">Education</span>
                  <span className="text-xs font-medium text-gray-600">13%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                  <div className="h-full rounded-full bg-gray-500" style={{ width: '13%' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <button className="absolute bottom-6 left-6 right-6 py-2 bg-gray-50 hover:bg-gray-100 text-gray-800 text-xs font-medium rounded
            transition-colors duration-200 flex items-center justify-center border border-gray-200">
            <span>View all departments</span>
            <ArrowUpRight size={14} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;