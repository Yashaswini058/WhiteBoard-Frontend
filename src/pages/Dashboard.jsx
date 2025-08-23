import {userApi} from "../api"
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, User, Share2, Calendar, ChevronRight, Trash2, Settings, Users } from 'lucide-react';
import CreateBoardModal from "./CreateBoardModal";
import DeleteBoardModal from "./DeleteBoardModal";
import ShareBoardModal from "./ShareBoardModal";


function Dashboard() {
  const [user, setUser] = useState(null);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Fetch user data and boards
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        const response = await userApi.getBoards();
        setUser(userData);
        setBoards(response.boards || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const createBoard = async (title) => {
    if (!title.trim()) {
      setError('Board title is required');
      return;
    }

    try {
      setCreating(true);
      setError('');
      
      const response = await userApi.createBoard({ title: title.trim() });
      
      setBoards(prev => [...prev, response]);
      setShowCreateModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const deleteBoard = async () => {
    if (!selectedBoard) return;

    try {
      setDeleting(true);
      await userApi.deleteBoard(selectedBoard._id);
      
      setBoards(prev => prev.filter(board => board._id !== selectedBoard._id));
      setShowDeleteModal(false);
      setSelectedBoard(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = (newUser) => {
    // Update the board in the boards list
    setBoards(prev => prev.map(board => 
      board._id === selectedBoard._id 
        ? { ...board, sharedWith: [...(board.sharedWith || []), newUser] }
        : board
    ));
  };

  const handleRemoveAccess = (userEmail) => {
    // Update the board in the boards list
    setBoards(prev => prev.map(board => 
      board._id === selectedBoard._id 
        ? { ...board, sharedWith: (board.sharedWith || []).filter(u => u.email !== userEmail) }
        : board
    ));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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

  // Separate boards by ownership
  const ownedBoards = boards.filter(board => board.owner === user?.id || board.ownerId === user?.id);
  const sharedBoards = boards.filter(board => board.owner !== user?.id && board.ownerId !== user?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user?.name || user?.username || 'User'}!
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              New Board
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* My Boards Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <User size={20} className="text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">My Boards</h2>
            <span className="text-sm text-gray-500">({ownedBoards.length})</span>
          </div>
          
          {ownedBoards.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <User size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No boards yet</h3>
              <p className="text-gray-600 mb-4">Create your first board to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Board
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownedBoards.map((board) => (
                <div key={board._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow group relative">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 
                        className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer flex-1"
                        onClick={() => navigate(`/board/${board._id}`)}
                      >
                        {board.title}
                      </h3>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBoard(board);
                            setShowShareModal(true);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Share Board"
                        >
                          <Share2 size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBoard(board);
                            setShowDeleteModal(true);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete Board"
                        >
                          <Trash2 size={14} />
                        </button>
                        <ChevronRight 
                          size={16} 
                          className="text-gray-400 group-hover:text-blue-600 transition-colors cursor-pointer" 
                          onClick={() => navigate(`/board/${board._id}`)}
                        />
                      </div>
                    </div>

                    {/* Shared users avatars */}
                    {board.shared && board.shared.length > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex -space-x-2">
                          {board.shared.slice(0, 3).map((sharedUser, index) => (
                            <div
                              key={index}
                              className={`w-6 h-6 rounded-full ${getAvatarColor(sharedUser.email)} flex items-center justify-center text-white text-xs font-medium border-2 border-white`}
                              title={sharedUser.email}
                            >
                              {getInitials(sharedUser.email)}
                            </div>
                          ))}
                          {board.shared.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                              +{board.shared.length - 3}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          Shared with {board.shared.length} {board.shared.length === 1 ? 'person' : 'people'}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(board.createdAt)}
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full">Owner</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Shared Boards Section */}
        {sharedBoards.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Share2 size={20} className="text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Shared with Me</h2>
              <span className="text-sm text-gray-500">({sharedBoards.length})</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sharedBoards.map((board) => (
                <div key={board._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="p-6" onClick={() => navigate(`/board/${board._id}`)}>
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {board.title}
                      </h3>
                      <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>

                    {/* Owner info */}
                    {board.ownerInfo && (
                      <div className="flex items-center gap-2 mb-4">
                        <div
                          className={`w-6 h-6 rounded-full ${getAvatarColor(board.ownerInfo.name || board.ownerInfo.email)} flex items-center justify-center text-white text-xs font-medium`}
                          title={`Owner: ${board.ownerInfo.email || board.ownerInfo.name}`}
                        >
                          {getInitials(board.ownerInfo.name || board.ownerInfo.email)}
                        </div>
                        <span className="text-xs text-gray-500">
                          Owned by {board.ownerInfo.name || board.ownerInfo.email}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(board.createdAt)}
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full">Shared</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Modals */}
      <CreateBoardModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createBoard}
        loading={creating}
        error={error}
      />

      <DeleteBoardModal
        show={showDeleteModal}
        board={selectedBoard}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedBoard(null);
        }}
        onConfirm={deleteBoard}
        loading={deleting}
      />

      <ShareBoardModal
        show={showShareModal}
        board={selectedBoard}
        user={user}
        onClose={() => {
          setShowShareModal(false);
          setSelectedBoard(null);
        }}
        onShare={handleShare}
        onRemoveAccess={handleRemoveAccess}
      />
    </div>
  );
}

export default Dashboard;