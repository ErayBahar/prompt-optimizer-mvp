import { useState } from 'react';
import { ArrowLeft, Heart, Trash2, X, Clock } from 'lucide-react';
import type { Project } from '../../services/projectService';
import { DeletePromptFromProjectDialog } from './DeletePromptFromProjectDialog';

interface HistoryItem {
  id: string;
  prompt: string;
  optimizedPrompt: string;
  timestamp: Date;
  tokenCount: number;
  latency: number;
  rating?: number;
  isFavorite?: boolean;
}

interface ProjectPromptViewProps {
  project: Project;
  prompts: HistoryItem[];
  onBack: () => void;
  onSelectPrompt: (prompt: HistoryItem) => void;
  onToggleFavorite: (promptId: string) => void;
  onRemoveFromProject: (promptId: string) => void;
  selectedPromptId?: string | null;
}

export function ProjectPromptView({ 
  project, 
  prompts, 
  onBack,
  onSelectPrompt,
  onToggleFavorite,
  onRemoveFromProject,
  selectedPromptId,
}: ProjectPromptViewProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingPromptId, setDeletingPromptId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleFavorite = (e: React.MouseEvent, promptId: string) => {
    e.stopPropagation();
    onToggleFavorite(promptId);
  };

  const handleRemoveClick = (e: React.MouseEvent, promptId: string) => {
    e.stopPropagation();
    setDeletingPromptId(promptId);
    setShowDeleteDialog(true);
  };

  const handleRemoveConfirm = async () => {
    if (deletingPromptId) {
      setIsDeleting(true);
      await onRemoveFromProject(deletingPromptId);
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeletingPromptId(null);
    }
  };

  const handleRemoveCancel = () => {
    setShowDeleteDialog(false);
    setDeletingPromptId(null);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Back to projects"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{project.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {prompts.length} prompt{prompts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Prompts List */}
      <div className="flex-1 overflow-y-auto p-4">
        {prompts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
              <Clock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">No prompts in this project yet.</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Add prompts from your history using the ⋮ menu.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                onClick={() => onSelectPrompt(prompt)}
                className={`group relative bg-white dark:bg-gray-800 border rounded-lg p-3 sm:p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedPromptId === prompt.id
                    ? 'border-blue-500 dark:border-blue-600 ring-2 ring-blue-100 dark:ring-blue-900/50 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {/* Metadata */}
                <div className="flex items-center gap-2 mb-2 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(prompt.timestamp).toLocaleDateString('en-US')} {new Date(prompt.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Prompt Preview */}
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-3">
                  {prompt.prompt}
                </p>

                {/* Rating Display */}
                {prompt.rating != null && (
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-xs ${star <= prompt.rating! ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={(e) => handleToggleFavorite(e, prompt.id)}
                    className={`p-1.5 rounded transition-colors sm:opacity-0 sm:group-hover:opacity-100 ${
                      prompt.isFavorite
                        ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 opacity-100'
                        : 'text-gray-400 dark:text-gray-500 hover:text-rose-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title={prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart className={`w-4 h-4 ${prompt.isFavorite ? 'fill-rose-500' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => handleRemoveClick(e, prompt.id)}
                    className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                    title="Remove from project"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Selection Indicator */}
                {selectedPromptId === prompt.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 dark:bg-blue-600 rounded-l-lg"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeletePromptFromProjectDialog
        open={showDeleteDialog}
        onConfirm={handleRemoveConfirm}
        onCancel={handleRemoveCancel}
        isDeleting={isDeleting}
      />
    </div>
  );
}