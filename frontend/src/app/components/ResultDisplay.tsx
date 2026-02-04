import { useState, useRef, useEffect } from 'react';
import { Copy, Check, Clock, Award, Plus, FolderPlus } from 'lucide-react';
import { RatingFeedback } from '@/app/components/RatingFeedback';
import { ProjectMenu } from '@/app/components/ProjectMenu';
import type { Project } from '@/services/projectService';

interface WordMapping {
  text: string;
  category: 'TASK' | 'ROLE' | 'STYLE' | 'OUTPUT' | 'RULES';
}

interface ResultDisplayProps {
  originalPrompt: string;
  optimizedPrompt: string;
  tokenCount: number;
  latency: number;
  originalScore: number | null; // Backend tarafından hesaplanan orijinal prompt skoru (null ise henüz hesaplanmamış)
  optimizedScore: number | null; // Backend tarafından hesaplanan optimize edilmiş prompt skoru (null ise henüz hesaplanmamış)
  onRate?: (rating: number) => void;
  tokenWarning?: boolean;
  promptId?: string;
  userRating?: number;
  wordMappings?: WordMapping[]; // Kelime kategorileri (optimize edilmiş prompt için)
  originalWordMappings?: WordMapping[]; // Kelime kategorileri (orijinal prompt için)
  onAddToProject?: (promptId: string, projectId: string) => void; // Add to project callback
  onCreateProject?: (promptId: string, projectName: string) => void; // Create project callback
  projects?: Array<Project>; // Available projects
}

export function ResultDisplay({ 
  originalPrompt, 
  optimizedPrompt, 
  tokenCount, 
  latency, 
  originalScore,
  optimizedScore,
  onRate, 
  tokenWarning, 
  promptId, 
  userRating,
  wordMappings,
  originalWordMappings,
  onAddToProject,
  onCreateProject,
  projects,
}: ResultDisplayProps) {
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedOptimized, setCopiedOptimized] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredOriginalCategory, setHoveredOriginalCategory] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to results when component mounts
  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, []);

  // Add to Project dropdown state
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const projectMenuRef = useRef<HTMLDivElement>(null);

  // Debug: Log the prompts to verify they are correct
  console.log('ResultDisplay - Before (originalPrompt):', originalPrompt);
  console.log('ResultDisplay - After (optimizedPrompt):', optimizedPrompt);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(event.target as Node)) {
        setIsProjectMenuOpen(false);
        setShowCreateForm(false);
        setNewProjectName('');
      }
    };

    if (isProjectMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProjectMenuOpen]);

  const handleCopy = async (text: string, type: 'original' | 'optimized') => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === 'original') {
        setCopiedOriginal(true);
        setTimeout(() => setCopiedOriginal(false), 2000);
      } else {
        setCopiedOptimized(true);
        setTimeout(() => setCopiedOptimized(false), 2000);
      }
    } catch (error) {
      // Fallback for browsers where clipboard API is blocked
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        if (type === 'original') {
          setCopiedOriginal(true);
          setTimeout(() => setCopiedOriginal(false), 2000);
        } else {
          setCopiedOptimized(true);
          setTimeout(() => setCopiedOptimized(false), 2000);
        }
      } catch (err) {
        console.error('Failed to copy text:', err);
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  // Calculate character and token counts for both prompts
  const originalCharCount = originalPrompt.length;
  const optimizedCharCount = optimizedPrompt.length;
  const originalTokens = Math.ceil(originalCharCount / 4);
  const optimizedTokens = tokenCount || Math.ceil(optimizedCharCount / 4);

  // Kategori renkleri
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'TASK':
        return 'bg-pink-100 text-pink-700 border-pink-300';
      case 'ROLE':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'STYLE':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'OUTPUT':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'RULES':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  // Render original prompt with word mappings (Before)
  const renderBeforePromptWithHighlights = () => {
    if (!originalWordMappings || originalWordMappings.length === 0) {
      // Eğer word mappings yoksa, direkt orijinal prompt'u göster
      return <span>{originalPrompt}</span>;
    }

    return (
      <span>
        {originalWordMappings.map((mapping, index) => (
          <span key={index}>
            <span
              className={`relative inline transition-all duration-200 cursor-help hover:bg-pink-200 hover:border-b-2 ${
                hoveredOriginalCategory === `${index}` ? 'bg-pink-200 border-b-2 border-pink-500' : ''
              }`}
              onMouseEnter={() => setHoveredOriginalCategory(`${index}`)}
              onMouseLeave={() => setHoveredOriginalCategory(null)}
            >
              {mapping.text}
              {hoveredOriginalCategory === `${index}` && (
                <span className={`absolute left-0 -top-8 px-2 py-1 rounded text-xs font-medium whitespace-nowrap shadow-lg z-10 border ${getCategoryColor(mapping.category)}`}>
                  {mapping.category}
                </span>
              )}
            </span>
            {index < originalWordMappings.length - 1 && ' '}
          </span>
        ))}
      </span>
    );
  };

  // Render optimized prompt with word mappings (After)
  const renderAfterPromptWithHighlights = () => {
    if (!wordMappings || wordMappings.length === 0) {
      return <span>{optimizedPrompt}</span>;
    }

    return (
      <span>
        {wordMappings.map((mapping, index) => (
          <span key={index}>
            <span
              className={`relative inline transition-all duration-200 cursor-help hover:bg-pink-200 hover:border-b-2 ${
                hoveredCategory === `${index}` ? 'bg-pink-200 border-b-2 border-pink-500' : ''
              }`}
              onMouseEnter={() => setHoveredCategory(`${index}`)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              {mapping.text}
              {hoveredCategory === `${index}` && (
                <span className={`absolute left-0 -top-8 px-2 py-1 rounded text-xs font-medium whitespace-nowrap shadow-lg z-10 border ${getCategoryColor(mapping.category)}`}>
                  {mapping.category}
                </span>
              )}
            </span>
            {index < wordMappings.length - 1 && ' '}
          </span>
        ))}
      </span>
    );
  };

  // Orijinal prompt'u düz metin olarak göster (highlight olmadan)
  const renderOriginalPrompt = () => {
    return <span>{originalPrompt}</span>;
  };

  // Project menu handlers
  const handleToggleProjectMenu = () => {
    setIsProjectMenuOpen(!isProjectMenuOpen);
    setShowCreateForm(false);
    setNewProjectName('');
  };

  const handleAddToProject = (projectId: string) => {
    if (onAddToProject && promptId) {
      onAddToProject(promptId, projectId);
      setIsProjectMenuOpen(false);
    }
  };

  const handleShowCreateForm = () => {
    setShowCreateForm(true);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newProjectName.trim().length > 0 && newProjectName.trim().length <= 60 && onCreateProject && promptId) {
      onCreateProject(promptId, newProjectName.trim());
      setNewProjectName('');
      setShowCreateForm(false);
      setIsProjectMenuOpen(false);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
    setNewProjectName('');
  };

  // Score Quality Indicator - TC-106, TC-107, TC-108
  const getScoreConfig = (score: number | null) => {
    if (score === null || score === undefined) {
      return null; // TC-105, TC-112: Score gösterilmemeli
    }

    if (score >= 0 && score <= 39) {
      // TC-106: Red (Needs Improvement)
      return {
        label: 'Needs Improvement',
        color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700',
        dotColor: 'bg-red-500',
      };
    } else if (score >= 40 && score <= 69) {
      // TC-107: Yellow (Good)
      return {
        label: 'Good',
        color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
        dotColor: 'bg-yellow-500',
      };
    } else if (score >= 70 && score <= 100) {
      // TC-108: Green (Excellent)
      return {
        label: 'Excellent',
        color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700',
        dotColor: 'bg-green-500',
      };
    }

    return null; // Invalid score
  };

  const originalScoreConfig = getScoreConfig(originalScore);
  const optimizedScoreConfig = getScoreConfig(optimizedScore);

  // Calculate improvement percentage - TC-111
  const calculateImprovement = () => {
    if (originalScore === null || optimizedScore === null) {
      return null;
    }
    
    // Special case: if original score is 0, we can't calculate percentage
    // but we can show that there's been improvement
    if (originalScore === 0) {
      if (optimizedScore > 0) {
        return 'NEW'; // Show "NEW" badge instead of percentage
      }
      return null;
    }
    
    return Math.round(((optimizedScore - originalScore) / originalScore) * 100);
  };

  const improvementPercentage = calculateImprovement();

  return (
    <div className="space-y-4 sm:space-y-6 mt-6 sm:mt-8" ref={resultRef}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">Results</h2>
        
        {/* Score, Token ve Latency Bilgileri */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* TC-111: Improvement badge - only show if both scores are available */}
          {improvementPercentage !== null && (
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg transition-colors">
              <Award className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs sm:text-sm font-medium text-amber-900 dark:text-amber-200">
                {improvementPercentage === 'NEW' 
                  ? 'New Score' 
                  : `${improvementPercentage > 0 ? '+' : ''}${improvementPercentage}% improvement`
                }
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg transition-colors">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs sm:text-sm font-medium text-purple-900 dark:text-purple-200">
              {latency}ms
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        {/* Before - Kullanıcının Girdiği Orijinal Prompt */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 space-y-2 sm:space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">Before</h3>
              
              {/* TC-110: Score display with format "72 / 100" */}
              {originalScoreConfig ? (
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${originalScoreConfig.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${originalScoreConfig.dotColor}`}></span>
                    {originalScoreConfig.label}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Score: {originalScore} / 100
                  </span>
                </div>
              ) : originalScore === null ? null : (
                /* TC-112: Fallback for invalid/unavailable score */
                <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                  Score information is currently unavailable
                </span>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>~{originalTokens} tokens</span>
              </div>
            </div>
            <button
              onClick={() => handleCopy(originalPrompt, 'original')}
              className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Copy"
            >
              {copiedOriginal ? (
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded p-3 sm:p-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words overflow-wrap-anywhere transition-colors">
            {renderBeforePromptWithHighlights()}
          </div>
        </div>

        {/* After - LLM'den Gelen Optimize Edilmiş Prompt */}
        <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-lg p-4 sm:p-6 space-y-2 sm:space-y-3 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm sm:text-base font-semibold text-green-900 dark:text-green-400">After</h3>
              
              {/* TC-110: Score display with format "72 / 100" */}
              {optimizedScoreConfig ? (
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${optimizedScoreConfig.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${optimizedScoreConfig.dotColor}`}></span>
                    {optimizedScoreConfig.label}
                  </span>
                  <span className="text-xs text-green-700 dark:text-green-400 font-medium">
                    Score: {optimizedScore} / 100
                  </span>
                </div>
              ) : optimizedScore === null ? null : (
                /* TC-112: Fallback for invalid/unavailable score */
                <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                  Score information is currently unavailable
                </span>
              )}

              <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
                <span>{tokenWarning ? '~' : ''}{optimizedTokens} tokens</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Copy Button */}
              <button
                onClick={() => handleCopy(optimizedPrompt, 'optimized')}
                className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-medium"
                title="Copy"
              >
                {copiedOptimized ? (
                  <>
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded p-3 sm:p-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words overflow-wrap-anywhere transition-colors">
            {renderAfterPromptWithHighlights()}
          </div>
        </div>
      </div>

      {/* Add to Project Section */}
      {onAddToProject && onCreateProject && promptId && projects && (
        <div className="relative">
          <button 
            onClick={handleToggleProjectMenu}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            <span className="text-lg">+</span>
            <span>Add this prompt to a project</span>
          </button>

          {/* Dropdown Menu */}
          {isProjectMenuOpen && (
            <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto transition-colors" ref={projectMenuRef}>
              <div className="p-2">
                {/* Create New Project Form */}
                {showCreateForm ? (
                  <form onSubmit={handleCreateProject} className="p-2 space-y-2">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Project name..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                      autoFocus
                      maxLength={60}
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
                        className="flex-1 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1">Add to project</p>
                    
                    {/* Create New Project Button */}
                    <button
                      onClick={handleShowCreateForm}
                      className="w-full text-left px-3 py-2 text-sm rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-blue-600 dark:text-blue-400 font-medium flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4 flex-shrink-0" />
                      <span>Create New Project</span>
                    </button>

                    {/* Project List */}
                    {projects.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-gray-100 dark:border-gray-700">
                        {projects.map((project) => (
                          <button
                            key={project.id}
                            onClick={() => handleAddToProject(project.id)}
                            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                          >
                            <div className="flex items-center gap-2">
                              <FolderPlus className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                              <span className="truncate">{project.name}</span>
                              {project.promptIds.length > 0 && (
                                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">({project.promptIds.length})</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* No Projects Message */}
                    {projects.length === 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 px-3 py-2 text-center">
                        No projects yet. Create one!
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Değerlendirme */}
      {onRate && promptId && (
        <div className="mt-4 sm:mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 transition-colors">
          <RatingFeedback 
            promptId={promptId} 
            userRating={userRating}
            onRatingSubmit={onRate}
          />
        </div>
      )}
    </div>
  );
}