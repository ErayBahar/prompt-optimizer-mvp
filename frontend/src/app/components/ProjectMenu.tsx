import { useState, useRef, useEffect } from 'react';
import { MoreVertical, FolderPlus, Plus } from 'lucide-react';
import type { Project } from '../../services/projectService';

interface ProjectMenuProps {
  promptId: string;
  projects: Project[];
  onAddToProject: (promptId: string, projectId: string) => void;
  onCreateProject: (promptId: string, projectName: string) => void;
}

export function ProjectMenu({ promptId, projects, onAddToProject, onCreateProject }: ProjectMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
        setNewProjectName('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    setShowCreateForm(false);
    setNewProjectName('');
  };

  const handleAddToProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    onAddToProject(promptId, projectId);
    setIsOpen(false);
  };

  const handleShowCreateForm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCreateForm(true);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (newProjectName.trim().length > 0 && newProjectName.trim().length <= 60) {
      onCreateProject(promptId, newProjectName.trim());
      setNewProjectName('');
      setShowCreateForm(false);
      setIsOpen(false);
    }
  };

  const handleCancelCreate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCreateForm(false);
    setNewProjectName('');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleToggleMenu}
        className={`p-1 rounded transition-colors relative group/menu ${
          isOpen ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
        }`}
        title="Add to project"
      >
        <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="absolute bottom-full right-0 mb-1 px-2 py-1 text-[10px] font-medium text-white bg-gray-900 rounded whitespace-nowrap opacity-0 group-hover/menu:opacity-100 transition-opacity pointer-events-none z-10">
          Add to project
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
          <div className="p-2">
            {/* Create New Project Form */}
            {showCreateForm ? (
              <form onSubmit={handleCreateProject} className="p-2 space-y-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                  maxLength={60}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={newProjectName.trim().length === 0 || newProjectName.trim().length > 60}
                    className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create & Add
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelCreate}
                    className="flex-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="text-xs font-medium text-gray-500 px-2 py-1">Add to project</p>
                
                {/* Create New Project Button */}
                <button
                  onClick={handleShowCreateForm}
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-blue-50 transition-colors text-blue-600 font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 flex-shrink-0" />
                  <span>Create New Project</span>
                </button>

                {/* Project List */}
                {projects.length > 0 && (
                  <div className="mt-1 pt-1 border-t border-gray-100">
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={(e) => handleAddToProject(e, project.id)}
                        className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors text-gray-700"
                      >
                        <div className="flex items-center gap-2">
                          <FolderPlus className="w-4 h-4 flex-shrink-0 text-gray-400" />
                          <span className="truncate">{project.name}</span>
                          {project.promptIds.length > 0 && (
                            <span className="ml-auto text-xs text-gray-400">({project.promptIds.length})</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* No Projects Message */}
                {projects.length === 0 && (
                  <p className="text-xs text-gray-400 px-3 py-2 text-center">
                    No projects yet. Create one!
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}