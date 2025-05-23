import { X } from 'lucide-react';

interface CreateFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (folderName: string) => void;
}

export default function CreateFolderDialog({ isOpen, onClose, onSubmit }: CreateFolderDialogProps) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const folderName = formData.get('folderName') as string;
    if (folderName.trim()) {
      onSubmit(folderName.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/25 backdrop-blur-sm"
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-900">Create New Folder</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-50"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label 
              htmlFor="folderName" 
              className="block text-xs text-gray-700 mb-1.5"
            >
              Folder Name
            </label>
            <input
              type="text"
              id="folderName"
              name="folderName"
              autoFocus
              required
              className="w-full px-2 py-2 text-xs border rounded focus:outline-none focus:border-[#F04E23] focus:border transition-colors placeholder-gray-400"
              placeholder="Enter folder name"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 focus:outline-none focus:border-[#F04E23] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-[#F04E23] rounded hover:bg-[#d83e15] focus:outline-none focus:border-[#F04E23] transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 