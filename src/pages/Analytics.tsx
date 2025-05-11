import React from 'react';
import { BarChart2, TrendingUp, Users, DollarSign, Download, Calendar, Filter, ChevronDown } from 'lucide-react';
import DashboardCard from '../components/Dashboard/DashboardCard';

const Analytics: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Analytics</h1>
          <p className="text-gray-500">Track and analyze your business performance.</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors duration-200 flex items-center shadow-sm">
            <Calendar size={14} className="mr-1.5" />
            <span>Last 30 Days</span>
            <ChevronDown size={14} className="ml-1.5" />
          </button>
          <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors duration-200 flex items-center shadow-sm">
            <Filter size={14} className="mr-1.5" />
            <span>Filters</span>
          </button>
          <button className="px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded-md hover:bg-primary-600 transition-colors duration-200 flex items-center shadow-sm">
            <Download size={14} className="mr-1.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Revenue"
          value="$48,294"
          subtitle="12% increase"
          icon={<DollarSign size={18} />}
          color="primary"
          trend={{ value: 12, isUp: true }}
        />
        <DashboardCard
          title="Active Users"
          value="2,854"
          subtitle="8% increase"
          icon={<Users size={18} />}
          color="secondary"
          trend={{ value: 8, isUp: true }}
        />
        <DashboardCard
          title="Conversion Rate"
          value="3.2%"
          subtitle="1.2% increase"
          icon={<TrendingUp size={18} />}
          color="tertiary"
          trend={{ value: 1.2, isUp: true }}
        />
        <DashboardCard
          title="Avg. Session"
          value="4m 32s"
          subtitle="12s decrease"
          icon={<BarChart2 size={18} />}
          color="primary"
          trend={{ value: 12, isUp: false }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-gray-800 text-lg">Revenue Overview</h2>
            <div className="flex items-center text-xs font-medium bg-green-50 text-green-600 px-2 py-1.5 rounded-lg border border-green-100">
              <TrendingUp size={14} className="mr-1" />
              12.5% increase
            </div>
          </div>
          
          <div className="h-72 flex items-end">
            {/* Mock chart bars */}
            {[35, 50, 30, 80, 35, 45, 65].map((height, index) => (
              <div 
                key={index} 
                className="flex-1 mx-1 group relative"
              >
                <div className="h-full flex items-end">
                  <div 
                    className="bg-primary-500 hover:bg-primary-600 rounded-t-md w-full 
                    transition-all duration-300 shadow-sm origin-bottom hover:scale-x-110 group-hover:opacity-90"
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 
                  group-hover:opacity-100 group-hover:mb-3 transition-all duration-200 bg-gray-900 text-white 
                  text-xs px-2 py-1 rounded pointer-events-none z-10 shadow-lg">
                  ${Math.floor(height * 120)}
                </div>
                <div className="text-xs text-center mt-2 text-gray-500 font-medium">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Activity Chart */}
        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-gray-800 text-lg">User Activity</h2>
            <div className="flex items-center text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1.5 rounded-lg border border-blue-100">
              <Users size={14} className="mr-1" />
              854 active now
            </div>
          </div>
          
          <div className="h-72 flex items-end">
            {/* Mock line chart */}
            <div className="w-full h-full relative">
              <div className="absolute inset-0 flex items-end">
                <div className="w-full bg-gradient-to-t from-primary-50 to-transparent rounded-lg" style={{ height: '85%' }}></div>
              </div>
              <div className="absolute inset-0">
                <svg className="w-full h-full">
                  <path
                    d="M0 216 C 100 180, 200 252, 300 144 C 400 36, 500 180, 600 108"
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-lg">Recent Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { event: 'Login', user: 'John Smith', location: 'San Francisco, CA', time: '2 min ago', status: 'success' },
                { event: 'Purchase', user: 'Sarah Wilson', location: 'New York, NY', time: '5 min ago', status: 'success' },
                { event: 'Login Failed', user: 'Mike Johnson', location: 'London, UK', time: '10 min ago', status: 'error' },
                { event: 'Signup', user: 'Emma Davis', location: 'Toronto, CA', time: '15 min ago', status: 'success' },
              ].map((activity, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{activity.event}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{activity.user}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{activity.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{activity.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${activity.status === 'success' 
                        ? 'bg-green-50 text-green-600' 
                        : 'bg-red-50 text-red-600'
                      }`}>
                      {activity.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 