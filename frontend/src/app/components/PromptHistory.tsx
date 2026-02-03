import {
  History,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  BarChart3,
  Loader2,
  Search,
  Folder,
  FolderMinus,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { FileQuestion } from "lucide-react";
import type { Project } from "../../services/projectService";
import { ProjectMenu } from "./ProjectMenu";

interface HistoryItem {
  id: string;
  prompt: string;
  optimizedPrompt: string;
  timestamp: Date;
  tokenCount: number;
  latency: number;
  isFavorite?: boolean;
}

interface PromptHistoryProps {
  history: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onNewPrompt: () => void;
  onToggleFavorite: (id: string) => void;
  favoriteIds: Set<string>;
  selectedProjectId?: string | null;
  projects?: Project[];
  onRemoveFromProject?: (promptId: string) => void;
  onAddToProject?: (
    promptId: string,
    projectId: string,
  ) => void;
  onCreateProject?: (
    promptId: string,
    projectName: string,
  ) => void;
  isOpen?: boolean; // Sidebar açık/kapalı durumu
  onToggle?: () => void; // Toggle callback
}

export function PromptHistory({
  history,
  onSelectItem,
  onDeleteItem,
  onNewPrompt,
  onToggleFavorite,
  favoriteIds,
  selectedProjectId = null,
  projects = [],
  onRemoveFromProject,
  onAddToProject,
  onCreateProject,
  isOpen: externalIsOpen,
  onToggle,
}: PromptHistoryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    null,
  );
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isOpen =
    externalIsOpen !== undefined
      ? externalIsOpen
      : internalIsOpen;
  const [showFavoritesOnly, setShowFavoritesOnly] =
    useState(false);
  const [loadedCount, setLoadedCount] = useState(50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // TC-40: Search state
  const [debouncedSearchQuery, setDebouncedSearchQuery] =
    useState(""); // TC-41: Debounced search
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const ITEMS_PER_PAGE = 50;
  const MIN_SEARCH_LENGTH = 3; // TC-43: Minimum 3 karakter

  // TC-41, TC-47: Debounce search query (300ms delay for performance)
  useEffect(() => {
    const timer = setTimeout(() => {
      // TC-45: Trim whitespace before searching
      const trimmedQuery = searchQuery.trim();
      setDebouncedSearchQuery(trimmedQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // TC-44, TC-46: Reset loaded count and scroll position when search query changes
  useEffect(() => {
    setLoadedCount(50); // Reset pagination to initial state

    // TC-46: Scroll to top when search is active
    if (
      scrollContainerRef.current &&
      debouncedSearchQuery.length >= MIN_SEARCH_LENGTH
    ) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [debouncedSearchQuery]);

  // TC-41, TC-42, TC-43, TC-45: Search filter (case-insensitive, partial match)
  const searchFilteredHistory =
    debouncedSearchQuery.length >= MIN_SEARCH_LENGTH
      ? history.filter(
          (item) =>
            item.prompt
              .toLowerCase()
              .includes(debouncedSearchQuery.toLowerCase()) ||
            item.optimizedPrompt
              .toLowerCase()
              .includes(debouncedSearchQuery.toLowerCase()),
        )
      : history;

  // Project filter (TC-60: Search within a project)
  const projectFilteredHistory =
    selectedProjectId && projects.length > 0
      ? searchFilteredHistory.filter((item) => {
          const project = projects.find(
            (p) => p.id === selectedProjectId,
          );
          return project?.promptIds.includes(item.id);
        })
      : searchFilteredHistory;

  // Filter history based on search, project, then favorites toggle
  const filteredHistory = showFavoritesOnly
    ? projectFilteredHistory.filter((item) =>
        favoriteIds.has(item.id),
      )
    : projectFilteredHistory;

  // Get current project name for display
  const currentProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null;

  // Get visible items (infinite scroll)
  const visibleHistory = filteredHistory.slice(0, loadedCount);
  const hasMore = loadedCount < filteredHistory.length;

  const handleSelect = (item: HistoryItem) => {
    setSelectedId(item.id);
    onSelectItem(item);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteItem(id);
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const handleFavoriteToggle = (
    e: React.MouseEvent,
    id: string,
  ) => {
    e.stopPropagation();
    onToggleFavorite(id);
  };

  const handleNewPrompt = () => {
    setSelectedId(null);
    onNewPrompt();
  };

  const handleFilterChange = () => {
    setShowFavoritesOnly(!showFavoritesOnly);
    setLoadedCount(50); // Reset to initial load when filter changes
  };

  // Infinite scroll handler
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || isLoadingMore || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const scrollPercentage =
      (scrollTop + clientHeight) / scrollHeight;

    // Load more when scrolled to 80%
    if (scrollPercentage > 0.8) {
      setIsLoadingMore(true);

      // Simulate loading delay
      setTimeout(() => {
        setLoadedCount((prev) =>
          Math.min(
            prev + ITEMS_PER_PAGE,
            filteredHistory.length,
          ),
        );
        setIsLoadingMore(false);
      }, 500);
    }
  };

  // Attach scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () =>
        container.removeEventListener("scroll", handleScroll);
    }
  }, [isLoadingMore, hasMore, filteredHistory.length]);

  // Reset loaded count when history or filter changes
  useEffect(() => {
    setLoadedCount(50);
  }, [showFavoritesOnly, history.length]);

  return (
    <div className="relative flex h-full">
      {/* Sidebar */}
      <aside
        ref={scrollContainerRef}
        className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto transition-all duration-300 ${
          isOpen ? "w-64 sm:w-80" : "w-0"
        }`}
      >
        <div
          className={`${isOpen ? "opacity-100 p-3 sm:p-6" : "opacity-0 p-0"} transition-opacity duration-300`}
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                Prompt History
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleNewPrompt}
                className="p-1.5 sm:p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                title="New Prompt"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={handleFilterChange}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                  showFavoritesOnly
                    ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                    : "text-gray-400 dark:text-gray-500 hover:text-rose-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
                title="Show Favorites"
              >
                <Heart
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${showFavoritesOnly ? "fill-rose-500" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* TC-40: Search Box */}
          <div className="mb-4 sm:mb-6 relative">
            <div className="relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your prompts..."
                className="w-full pl-8 sm:pl-9 pr-8 sm:pr-9 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              {/* TC-43: Clear search button */}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {/* Search hint */}
            {searchQuery.length > 0 &&
              searchQuery.length < MIN_SEARCH_LENGTH && (
                <p className="mt-1.5 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                  Type at least {MIN_SEARCH_LENGTH} characters
                  to search
                </p>
              )}
          </div>

          {/* TC-43: Empty search result state */}
          {debouncedSearchQuery.length >= MIN_SEARCH_LENGTH &&
          filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <Search className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2">
                No prompts found
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-[200px]">
                No prompts found matching your search.
              </p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <FileQuestion className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2">
                {showFavoritesOnly
                  ? "No favorites yet"
                  : "No prompts yet"}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-[200px]">
                {showFavoritesOnly
                  ? "Click the heart icon on prompts to add them to your favorites."
                  : "You haven't saved any prompts yet. Optimize a prompt to get started."}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1.5 sm:space-y-2">
                {visibleHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left p-2 sm:p-3 rounded-lg border transition-colors relative group cursor-pointer ${
                      selectedId === item.id
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
                        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                    }`}
                  >
                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex gap-1">
                      {/* Project Menu */}
                      {onAddToProject && onCreateProject && (
                        <ProjectMenu
                          promptId={item.id}
                          projects={projects}
                          onAddToProject={(
                            promptId,
                            projectId,
                          ) =>
                            onAddToProject(promptId, projectId)
                          }
                          onCreateProject={(
                            promptId,
                            projectName,
                          ) =>
                            onCreateProject(
                              promptId,
                              projectName,
                            )
                          }
                        />
                      )}
                      <button
                        onClick={(e) =>
                          handleFavoriteToggle(e, item.id)
                        }
                        className={`p-1 rounded transition-colors relative group/favorite ${
                          favoriteIds.has(item.id)
                            ? "text-rose-500 hover:text-rose-600"
                            : "text-gray-300 dark:text-gray-600 hover:text-rose-500 opacity-0 group-hover:opacity-100"
                        }`}
                        title={
                          favoriteIds.has(item.id)
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                      >
                        <Heart
                          className={`w-3 h-3 sm:w-4 sm:h-4 ${favoriteIds.has(item.id) ? "fill-rose-500" : ""}`}
                        />
                        <span className="absolute bottom-full right-0 mb-1 px-2 py-1 text-[10px] font-medium text-white bg-gray-900 dark:bg-gray-700 rounded whitespace-nowrap opacity-0 group-hover/favorite:opacity-100 transition-opacity pointer-events-none z-10">
                          {favoriteIds.has(item.id)
                            ? "Remove from favorites"
                            : "Add to favorites"}
                        </span>
                      </button>
                      <button
                        onClick={(e) =>
                          handleDelete(e, item.id)
                        }
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors opacity-0 group-hover:opacity-100 relative group/delete"
                        title="Delete"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="absolute bottom-full right-0 mb-1 px-2 py-1 text-[10px] font-medium text-white bg-gray-900 dark:bg-gray-700 rounded whitespace-nowrap opacity-0 group-hover/delete:opacity-100 transition-opacity pointer-events-none z-10">
                          Delete
                        </span>
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-1 sm:mb-1.5 pr-14 sm:pr-16">
                      {item.prompt}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                      {item.timestamp.toLocaleDateString(
                        "en-US",
                      )}{" "}
                      {item.timestamp.toLocaleTimeString(
                        "en-US",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {/* Loading Indicator */}
              {isLoadingMore && (
                <div className="mt-4 flex items-center justify-center py-3">
                  <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    Loading more prompts...
                  </span>
                </div>
              )}

              {/* End of List Message */}
              {!hasMore &&
                filteredHistory.length > ITEMS_PER_PAGE && (
                  <div className="mt-4 text-center py-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      No more prompts to load
                    </p>
                  </div>
                )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}