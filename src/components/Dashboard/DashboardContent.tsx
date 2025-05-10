import React from 'react';
import DashboardCard from './DashboardCard';
import { 
  Users, 
  ShoppingCart, 
  CreditCard, 
  BarChart, 
  TrendingUp, 
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

const DashboardContent: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Dashboard Overview</h1>
          <p className="text-gray-500">Welcome back! Here's what's happening with your business today.</p>
        </div>
        
        <div className="flex items-center justify-end space-x-2">
          <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors duration-200 flex items-center shadow-sm">
            <span>Export</span>
            <ExternalLink size={14} className="ml-1.5" />
          </button>
          <button className="px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded-md hover:bg-primary-600 transition-colors duration-200 flex items-center shadow-sm">
            <span>Create Report</span>
            <ChevronRight size={14} className="ml-1" />
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Users"
          value="4,209"
          subtitle="Active accounts"
          icon={<Users size={18} />}
          color="primary"
          trend={{ value: 12, isUp: true }}
        />
        <DashboardCard
          title="Sales"
          value="$24,389"
          subtitle="Last 30 days"
          icon={<ShoppingCart size={18} />}
          color="secondary"
          trend={{ value: 8, isUp: true }}
        />
        <DashboardCard
          title="Orders"
          value="1,849"
          subtitle="Processed"
          icon={<CreditCard size={18} />}
          color="tertiary"
          trend={{ value: 4, isUp: true }}
        />
        <DashboardCard
          title="Revenue"
          value="$18,290"
          subtitle="Monthly recurring"
          icon={<BarChart size={18} />}
          color="primary"
          trend={{ value: 2, isUp: false }}
        />
      </div>
      
      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-card border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-gray-800 text-lg">Revenue Growth</h2>
            <div className="flex items-center text-xs font-medium bg-green-50 text-green-600 px-2 py-1.5 rounded-lg border border-green-100">
              <TrendingUp size={14} className="mr-1" />
              8.5% increase
            </div>
          </div>
          
          <div className="h-72 flex items-end">
            {/* Mock chart bars */}
            {[35, 50, 30, 80, 35, 45, 65, 40, 50, 75, 60, 40].map((height, index) => (
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
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
          <h2 className="font-bold text-gray-800 text-lg mb-6">Popular Products</h2>
          
          <div className="space-y-5">
            {[
              { name: 'Product A', sales: 1253, percentage: 85 },
              { name: 'Product B', sales: 876, percentage: 65 },
              { name: 'Product C', sales: 543, percentage: 40 },
              { name: 'Product D', sales: 389, percentage: 25 }
            ].map((product, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-800">{product.name}</span>
                  <span className="text-gray-500 font-medium">{product.sales} sales</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
                    style={{ width: `${product.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          <button className="mt-6 w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-800 text-xs font-medium rounded-md
            transition-colors duration-200 flex items-center justify-center border border-gray-200">
            <span>View all products</span>
            <ArrowUpRight size={14} className="ml-1" />
          </button>
        </div>
      </div>
      
      {/* Recent Activity Section */}
      <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-gray-800 text-lg">Recent Activity</h2>
          <button className="text-primary-500 hover:text-primary-600 text-sm font-medium">View all</button>
        </div>
        
        <div className="space-y-4">
          {[
            { type: 'order', user: 'John Smith', action: 'placed a new order', time: '2 hours ago', status: 'success' },
            { type: 'user', user: 'Emma Wilson', action: 'created a new account', time: '4 hours ago', status: 'success' },
            { type: 'payment', user: 'James Brown', action: 'made a payment', time: '6 hours ago', status: 'success' },
            { type: 'order', user: 'Sarah Davis', action: 'cancelled order #1242', time: '12 hours ago', status: 'error' }
          ].map((activity, index) => (
            <div key={index} className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0
                ${activity.status === 'success' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}
              `}>
                {activity.status === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-800">
                    <span className="font-semibold">{activity.user}</span> {activity.action}
                  </p>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {activity.type === 'order' ? 'Order processed successfully' : 
                   activity.type === 'user' ? 'New user registered' : 
                   'Payment confirmed'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;