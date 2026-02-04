import { useState, useEffect, useRef } from 'react';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { PromptHistory } from './components/PromptHistory';
import { ProjectList } from './components/ProjectList';
import { ProjectPromptView } from './components/ProjectPromptView';
import { PromptInput } from './components/PromptInput';
import { LLMSelector } from './components/LLMSelector';
import { ScoreSettings } from './components/ScoreSettings';
import { OptimizeButton } from './components/OptimizeButton';
import { ResultDisplay } from './components/ResultDisplay';
import { SessionExpiredDialog } from './components/SessionExpiredDialog';
import { ErrorDisplay } from './components/ErrorDisplay';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import { HelpButton } from './components/HelpButton';
import { Toaster } from './components/ui/sonner';
import { logout, verifyTokenWithBackend, type AuthUser } from '../services/authService';
import { auth } from '../services/firebaseClient';
import { onAuthStateChanged, getIdToken } from 'firebase/auth';
import { saveFeedback } from '../services/feedbackService';
import { optimizePrompt, RateLimiter, type ApiError, type WordMapping } from '../services/apiService';
import { deletePromptFromHistory, fetchPromptHistory } from '../services/historyService';
import { toggleFavorite, getFavorites } from '../services/favoritesService';
import { 
  getProjects, 
  createProject, 
  renameProject, 
  deleteProject,
  addPromptToProject,
  removePromptFromProject,
  setCurrentUserId,
  clearProjectsCache,
  type Project 
} from '../services/projectService';
import { toast } from 'sonner';
import { LogOut, AlertTriangle, List, Folder as FolderIcon, ChevronLeft, ChevronRight, Moon, Sun, X } from 'lucide-react';
import { DEFAULT_LLM } from './components/LLMSelector';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

// LocalStorage keys for defaults
const DEFAULT_LLM_KEY = 'llm_default';
const DEFAULT_WEIGHTS_KEY = 'scoreWeights_default';
const USER_ID_KEY = 'user_id';

const getOrCreateUserId = () => {
  const existingId = localStorage.getItem(USER_ID_KEY);
  if (existingId) return existingId;

  const newId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `user-${crypto.randomUUID()}`
    : `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  localStorage.setItem(USER_ID_KEY, newId);
  return newId;
};

interface HistoryItem {
  id: string;
  prompt: string;
  optimizedPrompt: string;
  timestamp: Date;
  tokenCount: number;
  latency: number;
  originalScore: number; // Backend tarafından hesaplanan orijinal prompt skoru
  optimizedScore: number; // Backend tarafından hesaplanan optimize edilmiş prompt skoru
  rating?: number;
  isFavorite?: boolean;
  llm?: string; // Optimize edilirken kullanılan LLM
  scoreWeights?: ScoreWeights; // Optimize edilirken kullanılan score weights
  wordMappings?: WordMapping[]; // Kelime kategorileri
  originalWordMappings?: WordMapping[]; // Orijinal prompt kelime kategorileri
}

interface ScoreWeights {
  task: number;
  role: number;
  style: number;
  output: number;
  rules: number;
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const [prompt, setPrompt] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [selectedLLM, setSelectedLLM] = useState(DEFAULT_LLM); // Default olarak GPT-OSS-120B seçili
  const [scoreWeights, setScoreWeights] = useState<ScoreWeights>({
    task: 2,
    role: 2,
    style: 2,
    output: 2,
    rules: 2,
  });
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const [latency, setLatency] = useState(0);
  const [originalScore, setOriginalScore] = useState(0); // Backend tarafından hesaplanan orijinal prompt skoru
  const [optimizedScore, setOptimizedScore] = useState(0); // Backend tarafından hesaplanan optimize edilmiş prompt skoru
  const [wordMappings, setWordMappings] = useState<WordMapping[] | undefined>(undefined); // Kelime kategorileri
  const [originalWordMappings, setOriginalWordMappings] = useState<WordMapping[] | undefined>(undefined); // Orijinal prompt kelime kategorileri
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [guestUsageCount, setGuestUsageCount] = useState(0);
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const [showGuestLimitReached, setShowGuestLimitReached] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
  const [error, setError] = useState<ApiError | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [tokenWarning, setTokenWarning] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);
  const [currentRating, setCurrentRating] = useState<number | undefined>(undefined);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [optimizationCount, setOptimizationCount] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [sidebarView, setSidebarView] = useState<'history' | 'projects'>('history');
  const [projectViewMode, setProjectViewMode] = useState<'list' | 'detail'>('list');
  const [selectedProjectPromptId, setSelectedProjectPromptId] = useState<string | null>(null);
  const [isViewingProjectPrompt, setIsViewingProjectPrompt] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Başlangıçta kapalı - mount'ta kontrol edilecek
  
  const rateLimiterRef = useRef(new RateLimiter());
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { theme, toggleTheme } = useTheme();

  const GUEST_LIMIT = 5;
  const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds (mock - production'da 1 hafta olabilir)

  // Mobilde başlangıçta sidebar kapalı olsun
  useEffect(() => {
    // Desktop'ta açık, mobilde kapalı
    setIsSidebarOpen(window.innerWidth >= 640);
  }, []);

  useEffect(() => {
    setUserId(getOrCreateUserId());
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUserId(null);
        clearProjectsCache();
        setProjects([]);
        return;
      }

      try {
        const idToken = await getIdToken(user, true);
        const backendUser = await verifyTokenWithBackend(idToken);
        setIsAuthenticated(true);
        setIsGuest(false);
        setUserId(backendUser.uid);
        setCurrentUserId(backendUser.uid); // Set user ID for project service
        localStorage.setItem(USER_ID_KEY, backendUser.uid);
        
        // Load projects immediately after setting currentUserId
        const loadedProjects = await getProjects();
        setProjects(loadedProjects);
      } catch (error) {
        setIsAuthenticated(false);
        setCurrentUserId(null);
        clearProjectsCache();
        setProjects([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load default LLM and score weights from localStorage
  const loadDefaultSettings = () => {
    // Load default LLM
    const defaultLLM = localStorage.getItem(DEFAULT_LLM_KEY);
    if (defaultLLM) {
      setSelectedLLM(defaultLLM);
    } else {
      // Eğer kayıtlı default yoksa, DEFAULT_LLM'i kullan
      setSelectedLLM(DEFAULT_LLM);
    }

    // Load default score weights
    const defaultWeights = localStorage.getItem(DEFAULT_WEIGHTS_KEY);
    if (defaultWeights) {
      try {
        const weights = JSON.parse(defaultWeights) as ScoreWeights;
        setScoreWeights(weights);
      } catch (error) {
        console.error('Failed to load default weights:', error);
        setScoreWeights({ task: 2, role: 2, style: 2, output: 2, rules: 2 });
      }
    } else {
      setScoreWeights({ task: 2, role: 2, style: 2, output: 2, rules: 2 });
    }
  };

  // Projects -> History geçişinde ana ekranı temizle
  useEffect(() => {
    if (sidebarView === 'history') {
      // Ana ekranı sıfırla (boş prompt input sayfası)
      setPrompt('');
      setOptimizedPrompt('');
      setTokenCount(0);
      setLatency(0);
      setCurrentPromptId(null);
      setCurrentRating(undefined);
      setIsViewingProjectPrompt(false);
      setSelectedProjectPromptId(null);
      setError(null);
      
      // Load default settings when switching to history
      loadDefaultSettings();
    }
  }, [sidebarView]);

  // Guest kullanım sayısını localStorage'dan yükle
  useEffect(() => {
    const savedGuestUsage = localStorage.getItem('guestUsageCount');
    if (savedGuestUsage) {
      setGuestUsageCount(parseInt(savedGuestUsage, 10));
    }

    // Last activity time'ı yükle
    const savedLastActivity = localStorage.getItem('lastActivityTime');
    if (savedLastActivity) {
      setLastActivityTime(parseInt(savedLastActivity, 10));
    }

    // Optimizasyon sayısını yükle
    const savedOptCount = localStorage.getItem('optimizationCount');
    if (savedOptCount) {
      setOptimizationCount(parseInt(savedOptCount, 10));
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    loadHistory();
    loadFavorites();
    // Projects are loaded in the auth callback after setCurrentUserId
  }, [userId]);

  // Last activity time'ı kaydet
  useEffect(() => {
    localStorage.setItem('lastActivityTime', lastActivityTime.toString());
  }, [lastActivityTime]);

  // History değiştiğinde localStorage'a kaydet
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('promptHistory', JSON.stringify(history));
    }
  }, [history]);

  // Projeler değiştiğinde localStorage'a kaydet
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('projects', JSON.stringify(projects));
    }
  }, [projects]);

  // Prompt validasyon kontrolü
  const isPromptValid = () => {
    const trimmedPrompt = prompt.trim();
    return trimmedPrompt.length >= 10 && trimmedPrompt.length <= 1000;
  };

  // Session expiry kontrolü
  const checkSessionExpiry = () => {
    if (isAuthenticated && !isGuest) {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastActivityTime;
      
      if (timeDiff > SESSION_TIMEOUT) {
        setShowSessionExpired(true);
        return true;
      }
    }
    return false;
  };

  // Guest limit kontrolü
  const checkGuestLimit = () => {
    if (isGuest && guestUsageCount >= GUEST_LIMIT) {
      setShowGuestLimitReached(true);
      toast.error("You've reached the guest usage limit. The website is free — just sign in to continue.");
      return true;
    }
    return false;
  };

  // Cooldown timer'ı başlat
  const startCooldown = (durationMs: number) => {
    const seconds = Math.ceil(durationMs / 1000);
    setCooldownSeconds(seconds);
    
    // Önceki timer varsa temizle
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }
    
    cooldownTimerRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  const loadHistory = async () => {
    if (!userId) return;

    try {
      const items = await fetchPromptHistory(userId, 50);
      const mappedHistory: HistoryItem[] = items.map((item) => ({
        id: item.id,
        prompt: item.prompt,
        optimizedPrompt: item.optimizedPrompt,
        timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
        tokenCount: item.tokenCount ?? 0,
        latency: item.latency ?? 0,
        originalScore: item.originalScore ?? 0,
        optimizedScore: item.optimizedScore ?? item.originalScore ?? 0,
        rating: item.rating,
        isFavorite: item.isFavorite,
        llm: item.llm,
        scoreWeights: item.scoreWeights,
      }));

      setHistory(mappedHistory);
      setFavoriteIds(new Set(mappedHistory.filter((item) => item.isFavorite).map((item) => item.id)));
    } catch (error) {
      const savedHistory = localStorage.getItem('promptHistory');
      if (savedHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory);
          const historyWithDates = parsedHistory.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          }));
          setHistory(historyWithDates);
        } catch (localError) {
          console.error('Failed to parse history from localStorage:', localError);
        }
      }
    }
  };

  // Favorileri yükle
  const loadFavorites = async () => {
    if (!userId) return;
    const result = await getFavorites(userId);
    if (result.success && result.favoriteIds) {
      setFavoriteIds(new Set(result.favoriteIds));
    }
  };

  // Projeleri yükle
  const loadProjects = async () => {
    const loadedProjects = await getProjects();
    setProjects(loadedProjects);
  };

  // Project handlers
  const handleCreateProject = async (name: string) => {
    const result = await createProject(name);
    if (result.success && result.project) {
      await loadProjects(); // Reload from cache which was already updated
      toast.success('Project created successfully.');
    } else {
      toast.error(result.error || 'Failed to create project.');
    }
  };

  const handleCreateProjectWithPrompt = async (promptId: string, name: string) => {
    const result = await createProject(name);
    if (result.success && result.project) {
      // Promptu projeye ekle
      const addResult = await addPromptToProject(result.project.id, promptId);
      if (addResult.success) {
        // Projeleri yeniden yükle
        await loadProjects();
        toast.success('Project created and prompt added successfully.');
      } else {
        toast.error(addResult.error || 'Project created but failed to add prompt.');
      }
    } else {
      toast.error(result.error || 'Failed to create project.');
    }
  };

  const handleRenameProject = async (projectId: string, newName: string) => {
    const result = await renameProject(projectId, newName);
    if (result.success) {
      await loadProjects();
      toast.success('Project name updated.');
    } else {
      toast.error(result.error || 'Failed to rename project.');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const result = await deleteProject(projectId);
    if (result.success) {
      await loadProjects();
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
        setSidebarView('history');
      }
      toast.success('Project deleted successfully.');
    } else {
      toast.error(result.error || 'Failed to delete project.');
    }
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setProjectViewMode('detail');
    setSelectedProjectPromptId(null);
  };

  const handleSelectProjectPrompt = (prompt: HistoryItem) => {
    setPrompt(prompt.prompt);
    setOptimizedPrompt(prompt.optimizedPrompt);
    setTokenCount(prompt.tokenCount);
    setLatency(prompt.latency);
    setOriginalScore(prompt.originalScore);
    setOptimizedScore(prompt.optimizedScore);
    setWordMappings(prompt.wordMappings);
    setOriginalWordMappings(prompt.originalWordMappings);
    setCurrentPromptId(prompt.id);
    setCurrentRating(prompt.rating);
    setSelectedProjectPromptId(prompt.id);
    setIsViewingProjectPrompt(true);
    
    // Promptun LLM ve score weights bilgilerini yükle
    if (prompt.llm) {
      setSelectedLLM(prompt.llm);
    }
    if (prompt.scoreWeights) {
      setScoreWeights(prompt.scoreWeights);
    }
  };

  const handleAddToProject = async (projectId: string) => {
    if (!currentPromptId) return;
    
    const result = await addPromptToProject(projectId, currentPromptId);
    if (result.success) {
      await loadProjects();
      toast.success('Added to project.');
    } else {
      toast.error(result.error || 'Failed to add to project.');
    }
  };

  const handleAddPromptToProject = async (promptId: string, projectId: string) => {
    const result = await addPromptToProject(projectId, promptId);
    if (result.success) {
      await loadProjects();
      toast.success('Added to project.');
    } else {
      toast.error(result.error || 'Failed to add to project.');
    }
  };

  const handleRemoveFromProject = async (promptId: string) => {
    if (!selectedProjectId) return;
    
    const result = await removePromptFromProject(selectedProjectId, promptId);
    if (result.success) {
      await loadProjects();
      toast.success('Removed from project.');
    } else {
      toast.error(result.error || 'Failed to remove from project.');
    }
  };

  const handleOptimize = async () => {
    if (!userId) {
      toast.error('User session not ready. Please try again.');
      return;
    }
    if (!prompt.trim()) return;

    // Session expiry kontrolü
    if (checkSessionExpiry()) {
      return;
    }

    // Guest limit kontrolü
    if (checkGuestLimit()) {
      return;
    }

    // Rate limit kontrolü
    const rateLimitCheck = rateLimiterRef.current.canMakeRequest();
    if (!rateLimitCheck.allowed) {
      const apiError: ApiError = {
        type: 'rate-limit',
        message: 'Too many attempts. Try again in 10 seconds.',
      };
      setError(apiError);
      toast.error(apiError.message);
      
      if (rateLimitCheck.cooldownMs) {
        startCooldown(rateLimitCheck.cooldownMs);
      }
      return;
    }

    // Rate limiter'a isteği kaydet
    rateLimiterRef.current.recordRequest();

    // Hata state'ini temizle
    setError(null);
    setTokenWarning(false);
    setIsOptimizing(true);
    setLastActivityTime(Date.now()); // Aktivite zamanını güncelle
    
    // Guest kullanım sayacını artır
    if (isGuest) {
      const newCount = guestUsageCount + 1;
      setGuestUsageCount(newCount);
      localStorage.setItem('guestUsageCount', newCount.toString());
    }

    const startTime = Date.now();
    
    try {
      const response = await optimizePrompt({
        prompt,
        userId,
        selectedLLM: selectedLLM || undefined,
        scoreWeights: scoreWeights,
      });

      const endTime = Date.now();
      const calculatedLatency = endTime - startTime;
      
      // Token warning kontrolü
      if (response.tokenWarning) {
        setTokenWarning(true);
        toast.warning('Token information is currently unavailable.');
      }

      setOptimizedPrompt(response.optimizedPrompt);
      setTokenCount(response.tokenCount);
      setLatency(calculatedLatency);
      setOriginalScore(response.originalScore); // Backend tarafından hesaplanan orijinal prompt skoru
      setOptimizedScore(response.optimizedScore); // Backend tarafından hesaplanan optimize edilmiş prompt skoru
      setWordMappings(response.wordMappings);
      setOriginalWordMappings(response.originalWordMappings);
      setError(null); // Başarılıysa hata state'ini temizle
      
      // Optimizasyon sayacını artır
      const newOptCount = optimizationCount + 1;
      setOptimizationCount(newOptCount);
      localStorage.setItem('optimizationCount', newOptCount.toString());

      const promptId = response.promptId || Date.now().toString();
      const newHistoryItem: HistoryItem = {
        id: promptId,
        prompt,
        optimizedPrompt: response.optimizedPrompt,
        timestamp: new Date(),
        tokenCount: response.tokenCount,
        latency: calculatedLatency,
        originalScore: response.originalScore, // Backend tarafından hesaplanan orijinal prompt skoru
        optimizedScore: response.optimizedScore, // Backend tarafından hesaplanan optimize edilmiş prompt skoru
        isFavorite: false,
        llm: selectedLLM || undefined,
        scoreWeights: scoreWeights,
        wordMappings: response.wordMappings,
        originalWordMappings: response.originalWordMappings,
      };
      
      setHistory([newHistoryItem, ...history]);
      setCurrentPromptId(promptId);
      setCurrentRating(undefined);
      setIsOptimizing(false);
      toast.success('Prompt optimized successfully!');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      setIsOptimizing(false);
      
      // Rate limit hatası için cooldown başlat
      if (apiError.type === 'rate-limit') {
        startCooldown(10000);
      }
      
      toast.error(apiError.message);
      
      // Development modunda console'a log
      if (import.meta.env.DEV) {
        console.error('Optimization error:', apiError);
      }
    }
  };

  const handleRetry = () => {
    setError(null);
    handleOptimize();
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setPrompt(item.prompt);
    setOptimizedPrompt(item.optimizedPrompt);
    setTokenCount(item.tokenCount);
    setLatency(item.latency);
    setOriginalScore(item.originalScore);
    setOptimizedScore(item.optimizedScore);
    setWordMappings(item.wordMappings);
    setOriginalWordMappings(item.originalWordMappings);
    setCurrentPromptId(item.id);
    setCurrentRating(item.rating);
    
    // Load the LLM and score weights used for this prompt
    if (item.llm) {
      setSelectedLLM(item.llm);
    } else {
      // If no LLM saved (old prompts), load default
      loadDefaultSettings();
    }
    
    if (item.scoreWeights) {
      setScoreWeights(item.scoreWeights);
    } else {
      // If no weights saved (old prompts), load default
      const defaultWeights = localStorage.getItem(DEFAULT_WEIGHTS_KEY);
      if (defaultWeights) {
        try {
          setScoreWeights(JSON.parse(defaultWeights));
        } catch (error) {
          setScoreWeights({ task: 2, role: 2, style: 2, output: 2, rules: 2 });
        }
      } else {
        setScoreWeights({ task: 2, role: 2, style: 2, output: 2, rules: 2 });
      }
    }
  };

  const handleToggleFavorite = async (id: string) => {
    const isFavorite = favoriteIds.has(id);
    
    // Optimistic update
    const newFavoriteIds = new Set(favoriteIds);
    if (isFavorite) {
      newFavoriteIds.delete(id);
    } else {
      newFavoriteIds.add(id);
    }
    setFavoriteIds(newFavoriteIds);

    // Update history item
    setHistory(prevHistory => 
      prevHistory.map(item => 
        item.id === id 
          ? { ...item, isFavorite: !isFavorite }
          : item
      )
    );

    try {
      const result = await toggleFavorite(id, isFavorite);
      
      if (!result.success) {
        // Rollback on error
        setFavoriteIds(favoriteIds);
        setHistory(prevHistory => 
          prevHistory.map(item => 
            item.id === id 
              ? { ...item, isFavorite: isFavorite }
              : item
          )
        );
        
        toast.error(result.error?.message || 'Couldn\'t update favorite. Please try again.');
      } else {
        toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
      }
    } catch (error) {
      // Rollback on error
      setFavoriteIds(favoriteIds);
      setHistory(prevHistory => 
        prevHistory.map(item => 
          item.id === id 
            ? { ...item, isFavorite: isFavorite }
            : item
        )
      );
      
      toast.error('Couldn\'t update favorite. Please try again.');
    }
  };

  const handleRate = async (rating: number) => {
    if (!optimizedPrompt || !prompt || !currentPromptId) {
      console.warn('No prompt or optimized prompt to rate');
      return;
    }

    // Update current rating state
    setCurrentRating(rating);

    // Update history item with rating
    if (currentPromptId) {
      setHistory(prevHistory => 
        prevHistory.map(item => 
          item.id === currentPromptId 
            ? { ...item, rating: rating }
            : item
        )
      );
      // localStorage'a kaydetme işlemi useEffect içinde otomatik yapılıyor
    }

    try {
      const feedbackId = await saveFeedback({
        promptId: currentPromptId,
        originalPrompt: prompt,
        optimizedPrompt: optimizedPrompt,
        rating: rating,
        selectedLLM: selectedLLM || undefined,
        scoreWeights: scoreWeights,
        tokenCount: tokenCount,
        latency: latency,
      });

      console.log('Feedback saved successfully with ID:', feedbackId);
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error('Failed to save feedback. Please try again.');
    }
  };

  const handleDeleteHistory = (id: string) => {
    setItemToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    const itemToDeleteData = history.find(item => item.id === itemToDelete);
    if (!itemToDeleteData) return;

    // Optimistic update - listeden hemen kaldır
    setHistory(history.filter(item => item.id !== itemToDelete));
    
    // Eğer silinen prompt şu anda görüntülenen prompt ise, optimize sayfasını tamamen temizle
    if (currentPromptId === itemToDelete) {
      setPrompt('');
      setOptimizedPrompt('');
      setTokenCount(0);
      setLatency(0);
      setCurrentPromptId(null);
      setCurrentRating(undefined);
      setError(null);
      setTokenWarning(false);
      // Score weights'i başlangıç değerine döndür
      setScoreWeights({
        task: 2,
        role: 2,
        style: 2,
        output: 2,
        rules: 2,
      });
    }
    
    // Optimizasyon sayacını azalt
    const newOptCount = Math.max(0, optimizationCount - 1);
    setOptimizationCount(newOptCount);
    localStorage.setItem('optimizationCount', newOptCount.toString());
    
    setIsDeleting(true);

    try {
      const result = await deletePromptFromHistory(itemToDelete);
      
      if (!result.success) {
        // Hata durumunda rollback - item'ı geri ekle
        setHistory(prevHistory => {
          // Item'ı doğru pozisyona ekle (timestamp'e göre sıralı)
          const newHistory = [...prevHistory, itemToDeleteData];
          return newHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        });
        
        // Eğer rollback yapıyorsak ve bu item şu anki item ise, geri yükle
        if (currentPromptId === itemToDelete) {
          setPrompt(itemToDeleteData.prompt);
          setOptimizedPrompt(itemToDeleteData.optimizedPrompt);
          setTokenCount(itemToDeleteData.tokenCount);
          setLatency(itemToDeleteData.latency);
          setCurrentPromptId(itemToDeleteData.id);
          setCurrentRating(itemToDeleteData.rating);
          // Score weights'i geri yükleme gerekmiyor çünkü zaten önceki değerlerde kalmış olacak
        }
        
        // Optimizasyon sayacını geri al
        setOptimizationCount(optimizationCount);
        localStorage.setItem('optimizationCount', optimizationCount.toString());
        
        toast.error(result.error?.message || 'Couldn\'t be deleted. Please try again.');
        
        if (import.meta.env.DEV) {
          console.error('Delete error:', result.error);
        }
      } else {
        toast.success('Prompt deleted successfully.');
      }
    } catch (error) {
      // Beklenmeyen hata - rollback yap
      setHistory(prevHistory => {
        const newHistory = [...prevHistory, itemToDeleteData];
        return newHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      });
      
      // Eğer rollback yapıyorsak ve bu item şu anki item ise, geri yükle
      if (currentPromptId === itemToDelete) {
        setPrompt(itemToDeleteData.prompt);
        setOptimizedPrompt(itemToDeleteData.optimizedPrompt);
        setTokenCount(itemToDeleteData.tokenCount);
        setLatency(itemToDeleteData.latency);
        setCurrentPromptId(itemToDeleteData.id);
        setCurrentRating(itemToDeleteData.rating);
      }
      
      // Optimizasyon sayacını geri al
      setOptimizationCount(optimizationCount);
      localStorage.setItem('optimizationCount', optimizationCount.toString());
      
      toast.error('Couldn\'t be deleted. Please try again.');
      
      if (import.meta.env.DEV) {
        console.error('Unexpected delete error:', error);
      }
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleNewPrompt = () => {
    setPrompt('');
    setOptimizedPrompt('');
    setTokenCount(0);
    setLatency(0);
    
    // Load default settings for new prompt
    loadDefaultSettings();
  };

  // TC-27, TC-28, TC-29, TC-30: Clear butonu - tüm state'leri resetle
  const handleClear = () => {
    // TC-28: Prompt'u temizle
    setPrompt('');
    
    // TC-30: Optimize sonuçlarını temizle
    setOptimizedPrompt('');
    setTokenCount(0);
    setLatency(0);
    
    // TC-30: Rating state'ini resetle
    setCurrentRating(undefined);
    setCurrentPromptId(null);
    
    // Error state'lerini temizle
    setError(null);
    setTokenWarning(false);
    
    // Load default settings when clearing
    loadDefaultSettings();
  };

  const handleLogOut = () => {
    setIsAuthenticated(false);
    setIsGuest(false);
    setUserId(getOrCreateUserId());
    logout().catch(() => undefined);
    toast.success('You have been logged out successfully!');
  };

  const handleLogin = (user: AuthUser) => {
    setIsAuthenticated(true);
    setIsGuest(false);
    setShowGuestLimitReached(false);
    setShowSessionExpired(false);
    setLastActivityTime(Date.now());
    setUserId(user.uid);
    localStorage.setItem(USER_ID_KEY, user.uid);
    toast.success('Welcome back!');
  };

  const handleContinueAsGuest = () => {
    setIsAuthenticated(true);
    setIsGuest(true);
    setShowGuestLimitReached(false);
    setUserId(getOrCreateUserId());
    const savedGuestUsage = localStorage.getItem('guestUsageCount');
    if (savedGuestUsage) {
      setGuestUsageCount(parseInt(savedGuestUsage, 10));
    }
    toast.success('Welcome! You have 5 free optimizations.');
  };

  const handleSessionExpiredLogin = () => {
    setShowSessionExpired(false);
    setIsAuthenticated(false);
    setIsGuest(false);
  };

  const handleLoginRedirect = () => {
    setIsAuthenticated(false);
    setIsGuest(false);
    setShowGuestLimitReached(false);
  };

  // Show login page if not authenticated
  if (!isAuthenticated || showGuestLimitReached) {
    return (
      <>
        <LandingPage 
          onLoginSuccess={handleLogin}
          onContinueAsGuest={handleContinueAsGuest}
        />
        <Toaster />
      </>
    );
  }

  return (
    <div className="size-full flex bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Mobile Overlay - sidebar açıkken */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sol Kenar Çubuğu - Tab-based View */}
      <div 
        className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 h-screen max-h-screen ${
          isSidebarOpen 
            ? 'fixed sm:relative z-50 sm:z-auto w-full sm:w-80' 
            : 'w-0 sm:w-0 overflow-hidden border-r-0'
        }`}
      >
        {/* Mobile Close Button - Sadece sidebar açıkken göster */}
        {isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-3 right-3 sm:hidden w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition z-10"
            title="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Tab Buttons */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              setSidebarView('history');
              setSelectedProjectId(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              sidebarView === 'history'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <List className="w-4 h-4" />
            <span>History</span>
          </button>
          <button
            onClick={() => setSidebarView('projects')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              sidebarView === 'projects'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <FolderIcon className="w-4 h-4" />
            <span>Projects</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {sidebarView === 'history' ? (
            <PromptHistory 
              history={history} 
              onSelectItem={handleHistorySelect} 
              onDeleteItem={handleDeleteHistory}
              onNewPrompt={handleNewPrompt}
              onToggleFavorite={handleToggleFavorite}
              favoriteIds={favoriteIds}
              selectedProjectId={selectedProjectId}
              projects={projects}
              onRemoveFromProject={handleRemoveFromProject}
              onAddToProject={handleAddPromptToProject}
              onCreateProject={handleCreateProjectWithPrompt}
              isOpen={isSidebarOpen}
              onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          ) : selectedProjectId ? (
            // Show ProjectPromptView when a project is selected
            <ProjectPromptView
              project={projects.find(p => p.id === selectedProjectId)!}
              prompts={history.filter(item => 
                projects.find(p => p.id === selectedProjectId)?.promptIds.includes(item.id)
              )}
              onBack={() => setSelectedProjectId(null)}
              onSelectPrompt={handleSelectProjectPrompt}
              onToggleFavorite={handleToggleFavorite}
              onRemoveFromProject={handleRemoveFromProject}
              selectedPromptId={selectedProjectPromptId}
            />
          ) : (
            // Show ProjectList when no project is selected
            <ProjectList
              projects={projects}
              onCreateProject={handleCreateProject}
              onRenameProject={handleRenameProject}
              onDeleteProject={handleDeleteProject}
              onSelectProject={handleSelectProject}
              selectedProjectId={selectedProjectId}
            />
          )}
        </div>
      </div>
      
      {/* Ana İçerik Alanı */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-auto relative">
        {/* Sidebar Toggle Button - Always visible */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-1 left-1 sm:top-1 sm:left-2 flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm z-10"
          title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Logout Button */}
        <button
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
          onClick={handleLogOut}
          title="Logout"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="absolute top-3 right-14 sm:top-4 sm:right-16 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
          )}
        </button>

        <div className="max-w-4xl mx-auto w-full space-y-4 sm:space-y-6">
          <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-8">
            Prompt Optimization Tool
          </h1>

          {/* Guest Usage Indicator */}
          {isGuest && (
            <div className="bg-blue-50 dark:bg-blue-900/20 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 dark:border-blue-700 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 transition-colors transition-colors">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 dark:bg-blue-400 rounded-full animate-pulse"></div>
                <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-200 dark:text-blue-200">
                  Guest Mode: {GUEST_LIMIT - guestUsageCount} optimization{GUEST_LIMIT - guestUsageCount !== 1 ? 's' : ''} remaining
                </p>
              </div>
              <button
                onClick={handleLoginRedirect}
                className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 dark:hover:text-blue-300 font-medium underline self-start sm:self-auto transition-colors transition-colors"
              >
                Sign in for unlimited use
              </button>
            </div>
          )}
          
          <PromptInput 
            value={prompt} 
            onChange={setPrompt} 
            onClear={handleClear}
            selectedLLM={selectedLLM}
            hasOptimizedResult={!!optimizedPrompt}
            showClearButton={!isViewingProjectPrompt}
            isDisabled={isOptimizing || !!optimizedPrompt || isViewingProjectPrompt}
          />
          
          <LLMSelector 
            selectedLLM={selectedLLM} 
            onChange={setSelectedLLM} 
            disabled={isOptimizing || !!optimizedPrompt}
            readOnly={isViewingProjectPrompt}
          />
          
          <ScoreSettings 
            weights={scoreWeights} 
            onChange={setScoreWeights} 
            disabled={isOptimizing || !!optimizedPrompt}
            readOnly={isViewingProjectPrompt}
          />
          
          {!isViewingProjectPrompt && (
            <OptimizeButton 
              onClick={handleOptimize} 
              isLoading={isOptimizing} 
              disabled={!isPromptValid() || !!optimizedPrompt || !selectedLLM} 
            />
          )}
          
          {/* Divider between optimize button and results */}
          {optimizedPrompt && !error && (
            <div className="border-t border-gray-200 my-6"></div>
          )}
          
          {/* Error Display */}
          {error && (
            <ErrorDisplay 
              type={error.type}
              message={error.message}
              onRetry={handleRetry}
              cooldownSeconds={cooldownSeconds > 0 ? cooldownSeconds : undefined}
            />
          )}

          {/* Token Warning */}
          {tokenWarning && optimizedPrompt && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-yellow-900 font-medium">
                  Token information is currently unavailable.
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  The optimization was successful, but token count data could not be retrieved. You can still use the optimized prompt.
                </p>
              </div>
            </div>
          )}
          
          {optimizedPrompt && !error && (
            <ResultDisplay
              originalPrompt={prompt}
              optimizedPrompt={optimizedPrompt}
              tokenCount={tokenCount}
              latency={latency}
              originalScore={originalScore}
              optimizedScore={optimizedScore}
              onRate={handleRate}
              tokenWarning={tokenWarning}
              promptId={currentPromptId || undefined}
              userRating={currentRating}
              wordMappings={wordMappings}
              originalWordMappings={originalWordMappings}
              onAddToProject={handleAddPromptToProject}
              onCreateProject={handleCreateProjectWithPrompt}
              projects={projects}
            />
          )}
        </div>
      </main>
      
      {/* Toast Notifications */}
      <Toaster />
      
      {/* Session Expired Dialog */}
      <SessionExpiredDialog 
        open={showSessionExpired}
        onLoginRedirect={handleSessionExpiredLogin}
      />
      
      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={isDeleting}
      />
      
      {/* Help Button */}
      <HelpButton />
    </div>
  );
}