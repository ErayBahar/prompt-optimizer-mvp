import { useState } from 'react';
import { Folder, Plus, Trash2, Edit2, X, Search } from 'lucide-react';
import type { Project } from '@/services/projectService';

interface ProjectListProps {
  projects: Project[];
  onCreateProject: (name: string) => void;
  onRenameProject: (projectId: string, newName: string) => void;
  onDeleteProject: (projectId: string) => void;
  onSelectProject: (projectId: string) => void;
  selectedProjectId: string | null;
}

export function ProjectList({
  projects,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onSelectProject,
  selectedProjectId,
}: ProjectListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Filter projects based on search query (case-insensitive)
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateClick = () => {
    setProjectName('');
    setError('');
    setShowCreateModal(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!projectName.trim()) {
      setError('Project name cannot be empty.');
      return;
    }
    
    if (projectName.length > 60) {
      setError('Project name is too long.');
      return;
    }
    
    onCreateProject(projectName);
    setShowCreateModal(false);
    setProjectName('');
  };

  const handleRenameClick = (project: Project) => {
    setEditingProjectId(project.id);
    setProjectName(project.name);
    setError('');
    setShowRenameModal(true);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!projectName.trim()) {
      setError('Project name cannot be empty.');
      return;
    }
    
    if (projectName.length > 60) {
      setError('Project name is too long.');
      return;
    }
    
    if (editingProjectId) {
      onRenameProject(editingProjectId, projectName);
      setShowRenameModal(false);
      setProjectName('');
      setEditingProjectId(null);
    }
  };

  const handleDeleteClick = (projectId: string) => {
    setDeletingProjectId(projectId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingProjectId) {
      onDeleteProject(deletingProjectId);
      setShowDeleteModal(false);
      setDeletingProjectId(null);
    }
  };

  // Empty state
  if (projects.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4 transition-colors">
            <Folder className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No projects yet
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            You don't have any projects yet. Create one to start organizing your prompts.
          </p>
          <button
            onClick={handleCreateClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <CreateProjectModal
            projectName={projectName}
            setProjectName={setProjectName}
            error={error}
            onSubmit={handleCreateSubmit}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </div>
    );
  }

  // Project list
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 transition-colors">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
              Projects
            </h2>
          </div>
          <button
            onClick={handleCreateClick}
            className="p-1.5 sm:p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            title="New Project"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Search Box - Always visible */}
        <div className="relative">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 sm:pl-9 pr-8 sm:pr-9 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto">
        {filteredProjects.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No projects found matching "{searchQuery}"
            </p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              className={`flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                selectedProjectId === project.id ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/20' : ''
              }`}
              onClick={() => onSelectProject(project.id)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Folder className={`w-5 h-5 flex-shrink-0 ${selectedProjectId === project.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-medium truncate ${selectedProjectId === project.id ? 'text-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'}`}>
                    {project.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {project.promptIds.length} {project.promptIds.length === 1 ? 'prompt' : 'prompts'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenameClick(project);
                  }}
                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                  title="Rename project"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(project.id);
                  }}
                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                  title="Delete project"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateProjectModal
          projectName={projectName}
          setProjectName={setProjectName}
          error={error}
          onSubmit={handleCreateSubmit}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showRenameModal && (
        <RenameProjectModal
          projectName={projectName}
          setProjectName={setProjectName}
          error={error}
          onSubmit={handleRenameSubmit}
          onClose={() => setShowRenameModal(false)}
        />
      )}

      {showDeleteModal && (
        <DeleteProjectModal
          onConfirm={handleDeleteConfirm}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}

// Create Project Modal
function CreateProjectModal({
  projectName,
  setProjectName,
  error,
  onSubmit,
  onClose,
}: {
  projectName: string;
  setProjectName: (name: string) => void;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full transition-colors">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create Project</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Name
            </label>
            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              maxLength={60}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
              }`}
              placeholder="e.g., Marketing Emails"
              autoFocus
            />
            {error && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{projectName.length}/60 characters</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Rename Project Modal
function RenameProjectModal({
  projectName,
  setProjectName,
  error,
  onSubmit,
  onClose,
}: {
  projectName: string;
  setProjectName: (name: string) => void;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full transition-colors">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Rename Project</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="renameProjectName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Name
            </label>
            <input
              id="renameProjectName"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              maxLength={60}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
              }`}
              autoFocus
            />
            {error && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{projectName.length}/60 characters</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Project Modal
function DeleteProjectModal({
  onConfirm,
  onClose,
}: {
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full transition-colors">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Project</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Delete this project? Prompts will not be deleted.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}