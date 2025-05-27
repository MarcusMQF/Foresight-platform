import React from 'react';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';

const Calendar: React.FC = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  const today = currentDate.getDate();

  // Mock events data
  const events = [
    { 
      title: 'Team Meeting', 
      time: '09:00 AM', 
      duration: '1 hour',
      location: 'Conference Room A',
      type: 'work' 
    },
    { 
      title: 'Project Review', 
      time: '11:30 AM', 
      duration: '1.5 hours',
      location: 'Virtual Meeting',
      type: 'work' 
    },
    { 
      title: 'Lunch with Client', 
      time: '01:00 PM', 
      duration: '1 hour',
      location: 'Bistro Downtown',
      type: 'meeting' 
    },
    { 
      title: 'Design Workshop', 
      time: '03:00 PM', 
      duration: '2 hours',
      location: 'Innovation Lab',
      type: 'workshop' 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Calendar</h1>
          <p className="text-gray-500">Schedule and manage your events and meetings.</p>
        </div>
        
        <button className="px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded hover:bg-primary-600 transition-colors duration-200 flex items-center shadow-button">
          <Plus size={14} className="mr-1" />
          <span>New Event</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-md border border-gray-200 shadow-card">
            {/* Calendar Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <CalendarIcon size={18} className="text-primary-500" />
                  <h2 className="text-base font-bold text-gray-800">{currentMonth} {currentYear}</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200">
                    <ChevronLeft size={16} />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              
              {/* Days Header */}
              <div className="grid grid-cols-7 gap-2">
                {days.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-1.5">
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, index) => {
                  const isToday = index + 1 === today;
                  const hasEvent = [10, 14, 18, 22].includes(index);
                  
                  return (
                    <div
                      key={index}
                      className={`
                        aspect-square p-1.5 border
                        ${isToday ? 'bg-primary-50 border-primary-300' : 
                          hasEvent ? 'border-gray-200 hover:border-primary-200' : 'border-gray-100 hover:bg-gray-50'}
                        cursor-pointer transition-colors duration-200
                      `}
                    >
                      <div className="h-full flex flex-col">
                        <span className={`
                          text-xs font-medium
                          ${isToday ? 'text-primary-600' : 'text-gray-700'}
                        `}>
                          {index + 1}
                        </span>
                        
                        {hasEvent && (
                          <div className="mt-auto flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1"></div>
                            {index === 14 && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1"></div>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Today's Events */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-md border border-gray-200 shadow-card h-full">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-800">Today's Events</h3>
              <p className="text-xs text-gray-500">{currentMonth} {today}, {currentYear}</p>
            </div>
            
            <div className="p-4">
              <div className="space-y-4">
                {events.map((event, index) => (
                  <div key={index} className="border-l-2 pl-3 py-2 hover:bg-gray-50 transition-colors duration-200"
                    style={{ 
                      borderColor: event.type === 'work' ? '#F85525' : 
                        event.type === 'meeting' ? '#FAA968' : '#4ADE80' 
                    }}
                  >
                    <h4 className="text-xs font-medium text-gray-800">{event.title}</h4>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <Clock size={10} className="mr-1" />
                      <span>{event.time} • {event.duration}</span>
                    </div>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <MapPin size={10} className="mr-1" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar; 