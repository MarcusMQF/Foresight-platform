import { X } from 'lucide-react';

interface RenameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newName: string) => void;
  currentName: string;
}

export default function RenameDialog({ isOpen, onClose, onSubmit, currentName }: RenameDialogProps) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newName = formData.get('newName') as string;
    if (newName.trim() && newName.trim() !== currentName) {
      onSubmit(newName.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
      
      <div className="relative bg-white rounded shadow-xl w-full max-w-xs mx-4">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-900">Rename Folder</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3">
          <div className="mb-3">
            <label 
              htmlFor="newName" 
              className="block text-xs text-gray-700 mb-1"
            >
              New Name
            </label>
            <input
              type="text"
              id="newName"
              name="newName"
              defaultValue={currentName}
              autoFocus
              required
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none placeholder-gray-400"
              style={{ boxShadow: 'none' }}
              onFocus={(e) => e.target.style.border = '1px solid #F04E23'}
              onBlur={(e) => e.target.style.border = '1px solid #e5e7eb'}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium text-white bg-[#F04E23] rounded hover:bg-[#d83e15] focus:outline-none focus:ring-1 focus:ring-[#F04E23] transition-colors"
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 