// Delete Board Modal Component
const DeleteBoardModal = ({ show, board, onClose, onConfirm, loading }) => {
  if (!show || !board) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Board</h3>
          
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete "<strong>{board.title}</strong>"? This action cannot be undone.
          </p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Deleting...' : 'Delete Board'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteBoardModal;