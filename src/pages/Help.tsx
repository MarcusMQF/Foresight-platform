import React from 'react';
import { Search, HelpCircle, Book, MessageCircle, Phone, Mail, ExternalLink, ChevronRight } from 'lucide-react';

const Help: React.FC = () => {
  // FAQ data
  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'To reset your password, click on the "Forgot Password" link on the login page and follow the instructions sent to your email.'
    },
    {
      question: 'How can I update my profile information?',
      answer: 'Go to Settings > Account and you can update your profile information including name, email, and phone number.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express) and PayPal for payments.'
    },
    {
      question: 'How do I export my data?',
      answer: 'You can export your data from the Analytics page by clicking the "Export" button in the top right corner.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Help Center</h1>
          <p className="text-gray-500">Find answers and get support when you need it.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-2xl mx-auto">
        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search for help articles..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-primary-500 transition-colors duration-200"
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { icon: <Book size={18} />, title: 'Documentation', description: 'Browse detailed guides and documentation' },
          { icon: <MessageCircle size={18} />, title: 'Community Forum', description: 'Connect with other users and share solutions' },
          { icon: <HelpCircle size={18} />, title: 'FAQs', description: 'Find answers to commonly asked questions' }
        ].map((item, index) => (
          <div key={index} className="bg-white p-4 rounded-md border border-gray-200 shadow-card hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-primary-50 rounded text-primary-500">
                {item.icon}
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-800">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            </div>
            <button className="mt-3 w-full py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium rounded transition-colors duration-200 flex items-center justify-center">
              Learn More
              <ChevronRight size={12} className="ml-1" />
            </button>
          </div>
        ))}
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-md border border-gray-200 shadow-card">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-800">Frequently Asked Questions</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {faqs.map((faq, index) => (
            <div key={index} className="p-4">
              <h3 className="text-xs font-medium text-gray-800 mb-1">{faq.question}</h3>
              <p className="text-xs text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200">
          <button className="w-full py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium rounded transition-colors duration-200 flex items-center justify-center">
            View All FAQs
            <ExternalLink size={12} className="ml-1" />
          </button>
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-white rounded-md border border-gray-200 shadow-card p-4">
        <h2 className="text-base font-bold text-gray-800 mb-3">Still Need Help?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 border border-gray-200 rounded">
            <div className="flex items-center space-x-2 mb-1.5">
              <Phone size={16} className="text-primary-500" />
              <h3 className="text-xs font-medium text-gray-800">Phone Support</h3>
            </div>
            <p className="text-xs text-gray-600 mb-2">Available Monday to Friday, 9AM to 6PM EST</p>
            <a href="tel:+1234567890" className="text-primary-500 text-xs font-medium hover:text-primary-600">
              +1 (234) 567-890
            </a>
          </div>
          <div className="p-3 border border-gray-200 rounded">
            <div className="flex items-center space-x-2 mb-1.5">
              <Mail size={16} className="text-primary-500" />
              <h3 className="text-xs font-medium text-gray-800">Email Support</h3>
            </div>
            <p className="text-xs text-gray-600 mb-2">We'll respond within 24-48 hours</p>
            <a href="mailto:support@example.com" className="text-primary-500 text-xs font-medium hover:text-primary-600">
              support@example.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help; 