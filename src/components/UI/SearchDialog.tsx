import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const SearchDialog: React.FC<SearchDialogProps> = ({ isOpen, onClose, initialQuery = '' }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = React.useState(initialQuery);
  
  // Focus the input when the dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      // Initialize the search query when opening the dialog
      if (initialQuery) {
        setSearchQuery(initialQuery);
      }
    }
  }, [isOpen, initialQuery]);

  // Handle escape key to close dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex flex-col items-center pt-16">
      <div className="w-full max-w-2xl px-4">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
          {/* Search input */}
          <div className="flex items-center px-4 py-3 border-b border-gray-200">
            <Search size={18} className="text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full px-3 py-1.5 bg-transparent border-none text-gray-800 text-sm"
              style={{ outline: 'none', boxShadow: 'none' }}
              autoFocus
            />
            <div className="flex items-center">
              <kbd className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded border border-gray-200">Esc</kbd>
              <button 
                onClick={handleClose}
                className="ml-2 p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          
          {/* Search results */}
          <div className="py-4 px-2 max-h-[70vh] overflow-y-auto">
            {searchQuery ? (
              <div className="space-y-2">
                <div className="px-3 py-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                  <h3 className="text-gray-800 text-sm font-medium">Search result item</h3>
                  <p className="text-gray-500 text-xs mt-1">Description of the search result with matching content</p>
                </div>
                <div className="px-3 py-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                  <h3 className="text-gray-800 text-sm font-medium">Another search result</h3>
                  <p className="text-gray-500 text-xs mt-1">More details about this particular search result</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">Type to start searching</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchDialog; 