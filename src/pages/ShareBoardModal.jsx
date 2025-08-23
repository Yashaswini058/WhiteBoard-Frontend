import React, { useState, useEffect } from 'react';
import { Share2, Users } from 'lucide-react';
import { userApi } from '../utils/api';

const ShareBoardModal = ({ show, board, user, onClose, onShare, onRemoveAccess }) => {
  const [email, setEmail] = useState('');
  const [sharing, setSharing] = useState(false);
  const [removing, setRemoving] = useState({});
  const [error, setError] = useState('');
  const [localSharedUsers, setLocalSharedUsers] = useState([]);

  useEffect(() => {
    if (board) {
      setLocalSharedUsers(board.shared || []);
    }
  }, [board]);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name) => {
    if (!name) return 'bg-gray-500';
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleShare = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    // Check if user is already shared with
    if (localSharedUsers.some(user => user.email === email.trim())) {
      setError('Board is already shared with this user');
      return;
    }

    try {
      setSharing(true);
      setError('');
      
      console.log('Calling shareBoard with:', board._id, email.trim());
      const response = await userApi.shareBoard(board._id, email.trim());
      console.log('Share response:', response);

      // Create new user object - adjust based on your API response
      const newUser = {
        email: email.trim(),
        name: response.user?.name || email.trim().split('@')[0],
        access: 'editor'
      };

      setLocalSharedUsers(prev => [...prev, newUser]);
      setEmail('');
      
      // Call parent callback
      if (onShare) {
        onShare(newUser);
      }
    } catch (err) {
      console.error('Share error:', err);
      setError(err.message || 'Failed to share board');
    } finally {
      setSharing(false);
    }
  };

  const handleRemoveAccess = async (userEmail) => {
    try {
      setRemoving(prev => ({ ...prev, [userEmail]: true }));

      await userApi.removeBoardAccess(board._id, userEmail);

      // Remove user from local state
      setLocalSharedUsers(prev => prev.filter(u => u.email !== userEmail));
      
      // Call parent callback
      if (onRemoveAccess) {
        onRemoveAccess(userEmail);
      }
    } catch (err) {
      setError(err.message || 'Failed to remove access');
    } finally {
      setRemoving(prev => ({ ...prev, [userEmail]: false }));
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    onClose();
  };

  if (!show || !board) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <Share2 size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Share - {board.title}</h3>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {/* Share Section */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Share with others</h4>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !sharing) {
                    handleShare();
                  }
                }}
              />
              <button
                onClick={handleShare}
                disabled={sharing || !email.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {sharing ? 'Sharing...' : 'Share'}
              </button>
            </div>
            {error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Owner */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Owner</h4>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-8 h-8 rounded-full ${getAvatarColor(user?.name || user?.email)} flex items-center justify-center text-white text-sm font-medium`}>
                  {getInitials(user?.name || user?.email)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'You'}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">Owner</span>
              </div>
            </div>

            {/* Shared Users */}
            {localSharedUsers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Shared with ({localSharedUsers.length})
                </h4>
                <div className="space-y-2">
                  {localSharedUsers.map((sharedUser, index) => (
                    <div key={sharedUser.email || index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div 
                        className={`w-8 h-8 rounded-full ${getAvatarColor(sharedUser.name || sharedUser.email)} flex items-center justify-center text-white text-sm font-medium`}
                        title={sharedUser.email}
                      >
                        {getInitials(sharedUser.name || sharedUser.email)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {sharedUser.name || sharedUser.email.split('@')[0]}
                        </p>
                        <p className="text-xs text-gray-500">{sharedUser.email}</p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full mr-2">
                        {sharedUser.access || 'Editor'}
                      </span>
                      <button
                        onClick={() => handleRemoveAccess(sharedUser.email)}
                        disabled={removing[sharedUser.email]}
                        className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Remove access"
                      >
                        {removing[sharedUser.email] ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {localSharedUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">This board is not shared with anyone yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t">
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareBoardModal;