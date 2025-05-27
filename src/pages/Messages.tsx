import React from 'react';
import { Search, Edit, Star, Trash2, MoreVertical, ChevronRight } from 'lucide-react';

const Messages: React.FC = () => {
  // Mock messages data
  const messages = [
    {
      id: 1,
      sender: 'John Smith',
      subject: 'Project Update Meeting',
      preview: 'Hi team, I wanted to share some updates regarding the project timeline...',
      time: '10:30 AM',
      unread: true,
      starred: true,
    },
    {
      id: 2,
      sender: 'Sarah Wilson',
      subject: 'Design Review Feedback',
      preview: 'Thanks for sharing the latest designs. I have a few suggestions...',
      time: '9:15 AM',
      unread: true,
      starred: false,
    },
    {
      id: 3,
      sender: 'Mike Johnson',
      subject: 'Client Meeting Notes',
      preview: 'Here are the key points from our meeting with the client yesterday...',
      time: 'Yesterday',
      unread: false,
      starred: false,
    },
    {
      id: 4,
      sender: 'Emma Davis',
      subject: 'New Feature Request',
      preview: 'The client has requested a new feature for the dashboard...',
      time: 'Yesterday',
      unread: false,
      starred: true,
    },
    {
      id: 5,
      sender: 'Alex Brown',
      subject: 'Weekly Team Sync',
      preview: 'Just a reminder about our weekly team sync meeting tomorrow...',
      time: '2 days ago',
      unread: false,
      starred: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Messages</h1>
          <p className="text-gray-500">Stay connected with your team and clients.</p>
        </div>
        
        <button className="px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded hover:bg-primary-600 transition-colors duration-200 flex items-center shadow-button">
          <Edit size={12} className="mr-1" />
          <span>Compose</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search messages..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-primary-500 transition-colors duration-200"
        />
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-md border border-gray-200 shadow-card divide-y divide-gray-200">
        {messages.map((message) => (
          <div 
            key={message.id}
            className={`
              p-3 hover:bg-gray-50 transition-colors duration-200 cursor-pointer
              ${message.unread ? 'bg-primary-50' : ''}
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-600">
                    {message.sender.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className={`text-xs font-medium ${message.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                      {message.sender}
                    </h3>
                    <span className="text-xs text-gray-500">{message.time}</span>
                  </div>
                  <h4 className={`text-xs ${message.unread ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                    {message.subject}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">
                    {message.preview}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1 ml-3">
                <button className={`p-1 rounded transition-colors duration-200 ${
                  message.starred ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 hover:text-gray-600'
                }`}>
                  <Star size={14} />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors duration-200">
                  <Trash2 size={14} />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors duration-200">
                  <MoreVertical size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Messages; 