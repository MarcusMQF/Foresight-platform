import React from 'react';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const Calendar: React.FC = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  // Mock events data
  const events = [
    { title: 'Team Meeting', time: '09:00 AM', type: 'work' },
    { title: 'Project Review', time: '11:30 AM', type: 'work' },
    { title: 'Lunch with Client', time: '01:00 PM', type: 'meeting' },
    { title: 'Design Workshop', time: '03:00 PM', type: 'workshop' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Calendar</h1>
          <p className="text-gray-500">Schedule and manage your events and meetings.</p>
        </div>
        
        <button className="px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded-md hover:bg-primary-600 transition-colors duration-200 flex items-center shadow-sm">
          <Plus size={14} className="mr-1.5" />
          <span>New Event</span>
        </button>
      </div>

      {/* Calendar Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {/* Calendar Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon size={20} className="text-primary-500" />
              <h2 className="text-lg font-bold text-gray-800">{currentMonth} {currentYear}</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors duration-200">
                <ChevronLeft size={20} />
              </button>
              <button className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors duration-200">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          {/* Days Header */}
          <div className="grid grid-cols-7 gap-2">
            {days.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, index) => (
              <div
                key={index}
                className={`
                  aspect-square p-2 rounded-lg border border-gray-100
                  ${index === 14 ? 'bg-primary-50 border-primary-100' : 'hover:bg-gray-50'}
                  cursor-pointer transition-colors duration-200
                `}
              >
                <span className={`
                  text-sm font-medium
                  ${index === 14 ? 'text-primary-600' : 'text-gray-700'}
                `}>
                  {index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Events */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Today's Events</h3>
        <div className="space-y-3">
          {events.map((event, index) => (
            <div key={index} className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <div className={`
                w-2 h-2 rounded-full mr-3
                ${event.type === 'work' ? 'bg-primary-500' : 
                  event.type === 'meeting' ? 'bg-yellow-500' : 'bg-green-500'}
              `} />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-800">{event.title}</h4>
                <p className="text-xs text-gray-500">{event.time}</p>
              </div>
              <button className="text-xs text-primary-500 hover:text-primary-600 font-medium">
                View
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar; 