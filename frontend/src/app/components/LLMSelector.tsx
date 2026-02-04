import { ChevronDown, Save, Check, Lock, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import openaiLogo from '@/assets/441c41f91e0233a4989ac7fed1dc24f6c2d3814f.png';
import qwenLogo from '@/assets/d63e25562d02aa970705aef93f4a865f21c4894f.png';
import metaLogo from '@/assets/cd5de54c49f92db7f8d0d0a509d8a048638711b4.png';
import primeIntellectLogo from '@/assets/a8c6bc6498b5d16ba89c808aa8610f7a5e759934.png';
import zaiLogo from '@/assets/f10d0abe1d54ba63333a4572e2cdf962ad1fcb74.png';
import nousResearchLogo from '@/assets/8120c824d3e2314523aad32b65131d8e5d2abff5.png';
import googleLogo from '@/assets/e6371700b1acb7092b4a8588a13bc04d596c24a7.png';

interface LLMSelectorProps {
  selectedLLM: string;
  onChange: (llm: string) => void;
  disabled?: boolean;
  readOnly?: boolean; // Proje görüntüleme modunda read-only
  userPlan?: 'free' | 'pro' | 'enterprise'; // TC-97: Plan-based locking
  quotaRemaining?: number; // TC-98: Remaining quota
  onQuotaExceeded?: () => void; // TC-98: Callback when quota exceeded
}

// Model categories for TC-90
type ModelCategory = 'advanced' | 'basic' | 'experimental';

interface LLMModel {
  id: string;
  name: string;
  logo: string;
  category: ModelCategory;
  isLocked: boolean; // TC-92, TC-97, TC-104
  requiredPlan?: 'pro' | 'enterprise';
  badge?: 'free' | 'locked' | 'new' | 'beta';
}

// Backend'den gelecek - şimdilik mock
const mockLLMs: LLMModel[] = [
  { id: 'openai/gpt-oss-120b', name: 'OpenAI / GPT-OSS-120B', logo: openaiLogo, category: 'advanced', isLocked: false, badge: 'free' },
  { id: 'Qwen/Qwen3-Coder-480B-A35B-Instruct', name: 'Qwen / Qwen3 Coder 480B A35B Instruct', logo: qwenLogo, category: 'advanced', isLocked: false, badge: 'free' },
  { id: 'openai/gpt-oss-20b', name: 'OpenAI / GPT-OSS-20B', logo: openaiLogo, category: 'basic', isLocked: false, badge: 'free' },
  { id: 'NousResearch/Hermes-4-70B', name: 'NousResearch / Hermes 4 70B', logo: nousResearchLogo, category: 'basic', isLocked: false, badge: 'free' },
  { id: 'zai-org/GLM-4.5-Air', name: 'Zai-org / GLM 4.5 Air', logo: zaiLogo, category: 'basic', isLocked: false, badge: 'free' },
  { id: 'PrimeIntellect/INTELLECT-3', name: 'PrimeIntellect / INTELLECT-3', logo: primeIntellectLogo, category: 'experimental', isLocked: false, badge: 'beta' },
  { id: 'Qwen/Qwen3-Next-80B-A3B-Thinking', name: 'Qwen / Qwen3 Next 80B A3B Thinking', logo: qwenLogo, category: 'advanced', isLocked: false, badge: 'new' },
  { id: 'Qwen/Qwen3-235B-A22B-Instruct-2507', name: 'Qwen / Qwen3 235B A22B Instruct 2507', logo: qwenLogo, category: 'advanced', isLocked: false, badge: 'free' },
  { id: 'Qwen/Qwen3-32B-fast', name: 'Qwen / Qwen3 32B Fast', logo: qwenLogo, category: 'basic', isLocked: false, badge: 'free' },
  { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Meta-Llama / Llama 3.3 70B Instruct', logo: metaLogo, category: 'advanced', isLocked: false, badge: 'free' },
  { id: 'google/gemma-3-27b-it', name: 'Google / Gemma 3 27B IT', logo: googleLogo, category: 'basic', isLocked: false, badge: 'free' },
];

// Category display names for TC-90
const categoryLabels: Record<ModelCategory, string> = {
  advanced: 'Advanced',
  basic: 'Basic',
  experimental: 'Experimental',
};

// Category order for display
const categoryOrder: ModelCategory[] = ['advanced', 'basic', 'experimental'];

// Default LLM
export const DEFAULT_LLM = 'openai/gpt-oss-120b';

// LocalStorage key for default LLM
const DEFAULT_LLM_KEY = 'llm_default';

// Analytics helper - TC-103
const trackModelEvent = (eventName: string, payload: Record<string, unknown>) => {
  // In production, this would integrate with analytics service
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    console.log('[Analytics]', eventName, payload);
  }
};

export function LLMSelector({ 
  selectedLLM, 
  onChange, 
  disabled = false, 
  readOnly = false,
  userPlan = 'free',
  quotaRemaining,
  onQuotaExceeded,
}: LLMSelectorProps) {
  const [hasDefaultLLM, setHasDefaultLLM] = useState(false);
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<LLMModel[]>(mockLLMs);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [previousModel, setPreviousModel] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // TC-94: Load saved default on mount
  useEffect(() => {
    const savedDefault = localStorage.getItem(DEFAULT_LLM_KEY);
    if (savedDefault) {
      setHasDefaultLLM(true);
      // TC-94: Restore selection on refresh if global preference
      if (!selectedLLM || selectedLLM === DEFAULT_LLM) {
        const savedModel = models.find(m => m.id === savedDefault);
        if (savedModel && !savedModel.isLocked) {
          onChange(savedDefault);
        }
      }
    }
  }, []);

  // TC-97: Update lock status based on user plan
  useEffect(() => {
    setModels(prevModels => 
      prevModels.map(model => {
        if (model.requiredPlan) {
          const planHierarchy = { free: 0, pro: 1, enterprise: 2 };
          const userLevel = planHierarchy[userPlan] || 0;
          const requiredLevel = planHierarchy[model.requiredPlan] || 0;
          return {
            ...model,
            isLocked: userLevel < requiredLevel,
            badge: userLevel < requiredLevel ? 'locked' : model.badge,
          };
        }
        return model;
      })
    );
  }, [userPlan]);

  // TC-96: Check if selected model still exists after list update
  useEffect(() => {
    if (selectedLLM && models.length > 0) {
      const currentModel = models.find(m => m.id === selectedLLM);
      if (!currentModel) {
        const fallbackModel = models.find(m => !m.isLocked);
        if (fallbackModel) {
          onChange(fallbackModel.id);
          toast.warning('Your previously selected model is no longer available. We\'ve switched to a similar model.');
        }
      } else if (currentModel.isLocked) {
        const fallbackModel = models.find(m => !m.isLocked);
        if (fallbackModel) {
          onChange(fallbackModel.id);
          toast.warning('Your selected model is now locked. We\'ve switched to an available model.');
        }
      }
    }
  }, [models, selectedLLM, onChange]);

  // Flatten models for keyboard navigation
  const flattenedModels = categoryOrder.flatMap(category => 
    models.filter(m => m.category === category)
  );

  // TC-101: Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
        trackModelEvent('model_picker_opened', { trigger: 'keyboard' });
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => {
          const next = prev < flattenedModels.length - 1 ? prev + 1 : 0;
          itemRefs.current[next]?.scrollIntoView({ block: 'nearest' });
          return next;
        });
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => {
          const next = prev > 0 ? prev - 1 : flattenedModels.length - 1;
          itemRefs.current[next]?.scrollIntoView({ block: 'nearest' });
          return next;
        });
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < flattenedModels.length) {
          const model = flattenedModels[focusedIndex];
          if (!model.isLocked) {
            handleSelect(model.id);
          } else {
            toast.error('This model requires a plan upgrade to use.');
          }
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;
      case 'Tab':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        itemRefs.current[0]?.scrollIntoView({ block: 'nearest' });
        break;
      case 'End':
        event.preventDefault();
        const lastIndex = flattenedModels.length - 1;
        setFocusedIndex(lastIndex);
        itemRefs.current[lastIndex]?.scrollIntoView({ block: 'nearest' });
        break;
    }
  }, [isOpen, focusedIndex, flattenedModels]);

  // Focus management for dropdown items
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex, isOpen]);

  const handleSaveAsDefault = () => {
    if (!selectedLLM) {
      toast.error('Please select an LLM model first.');
      return;
    }

    localStorage.setItem(DEFAULT_LLM_KEY, selectedLLM);
    setHasDefaultLLM(true);
    setShowSavedConfirmation(true);
    
    const selectedModel = mockLLMs.find(llm => llm.id === selectedLLM);
    toast.success(`${selectedModel?.name || 'LLM'} saved as default. This will be applied to all future prompts.`);

    // Hide confirmation after 3 seconds
    setTimeout(() => {
      setShowSavedConfirmation(false);
    }, 3000);
  };

  const selectedModel = models.find(llm => llm.id === selectedLLM);

  // TC-92, TC-100, TC-104: Handle model selection
  const handleSelect = async (llmId: string) => {
    const model = models.find(m => m.id === llmId);
    
    // TC-104: Backend authorization check for locked models
    if (model?.isLocked) {
      toast.error('This model is locked. Please upgrade your plan to access it.');
      trackModelEvent('model_selection_blocked', {
        model_id: llmId,
        user_plan: userPlan,
        reason: 'locked',
      });
      return;
    }

    // TC-98: Check quota before selection
    if (quotaRemaining !== undefined && quotaRemaining <= 0) {
      toast.error('You have reached your usage limit. Please try again later or upgrade your plan.');
      onQuotaExceeded?.();
      return;
    }

    // Store previous model for potential rollback (TC-100)
    setPreviousModel(selectedLLM);

    try {
      // TC-103: Track analytics event
      trackModelEvent('model_selected', {
        model_id: llmId,
        user_plan: userPlan,
        previous_model_id: selectedLLM,
      });

      onChange(llmId);
      setIsOpen(false);
      setFocusedIndex(-1);
      buttonRef.current?.focus();
    } catch (error) {
      // TC-100: Rollback on error
      if (previousModel) {
        onChange(previousModel);
        toast.error('Failed to select model. Please try again.');
      }
    }
  };

  const handleToggleDropdown = () => {
    if (disabled || readOnly) return;
    
    const newState = !isOpen;
    setIsOpen(newState);
    
    if (newState) {
      // TC-103: Track picker opened event
      trackModelEvent('model_picker_opened', { trigger: 'click' });
      
      // Set initial focus to selected item or first item
      const selectedIndex = flattenedModels.findIndex(m => m.id === selectedLLM);
      setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    } else {
      setFocusedIndex(-1);
    }
  };

  // TC-99: Retry loading models
  const handleRetryLoad = async () => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      // In production, this would fetch from API
      await new Promise(resolve => setTimeout(resolve, 500));
      setModels(mockLLMs);
    } catch (error) {
      setLoadError('Failed to load models. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const currentRef = dropdownRef.current;
    const handleClickOutside = (event: MouseEvent) => {
      if (currentRef && !currentRef.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // TC-89: Calculate dropdown position to prevent overflow
  const getDropdownPosition = (): React.CSSProperties => {
    if (!buttonRef.current) return {};
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    const dropdownHeight = Math.min(320, models.length * 48 + 60);
    
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      return { bottom: '100%', top: 'auto', marginBottom: '0.5rem' };
    }
    
    return { top: '100%', bottom: 'auto', marginTop: '0.5rem' };
  };

  // Get badge styling
  const getBadgeStyle = (badge?: string) => {
    switch (badge) {
      case 'free':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'locked':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400';
      case 'new':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'beta':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  // Render model item
  const renderModelItem = (llm: LLMModel, index: number) => {
    const isSelected = selectedLLM === llm.id;
    const isFocused = focusedIndex === index;
    
    return (
      <button
        key={llm.id}
        ref={el => { itemRefs.current[index] = el; }}
        type="button"
        role="option"
        id={`llm-option-${index}`}
        aria-selected={isSelected}
        aria-disabled={llm.isLocked}
        onClick={() => handleSelect(llm.id)}
        onMouseEnter={() => setFocusedIndex(index)}
        className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 text-left text-sm sm:text-base transition-colors flex items-center gap-2 ${
          llm.isLocked 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600'
        } ${
          isSelected 
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
            : 'text-gray-900 dark:text-gray-100'
        } ${
          isFocused && !isSelected
            ? 'bg-gray-50 dark:bg-gray-650 ring-2 ring-inset ring-blue-500'
            : ''
        }`}
        tabIndex={isFocused ? 0 : -1}
      >
        {/* TC-91: Selection indicator */}
        <span className="w-5 flex-shrink-0">
          {isSelected && (
            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          )}
        </span>
        
        {llm.logo && (
          <img 
            src={llm.logo} 
            alt=""
            aria-hidden="true"
            className="w-4 h-4 sm:w-5 sm:h-5 object-contain flex-shrink-0"
          />
        )}
        
        <span className="truncate flex-1">{llm.name}</span>
        
        {/* TC-90: Badges */}
        {llm.badge && (
          <span 
            className={`px-1.5 py-0.5 text-xs font-medium rounded ${getBadgeStyle(llm.badge)}`}
            aria-label={llm.badge === 'locked' ? 'Locked model' : llm.badge}
          >
            {llm.badge === 'locked' ? (
              <Lock className="w-3 h-3" aria-hidden="true" />
            ) : (
              llm.badge.charAt(0).toUpperCase() + llm.badge.slice(1)
            )}
          </span>
        )}
        
        {/* TC-97: Lock icon for locked models */}
        {llm.isLocked && llm.badge !== 'locked' && (
          <Lock 
            className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" 
            aria-label="Locked - upgrade required"
          />
        )}
      </button>
    );
  };

  // Group models by category
  const groupedModels = categoryOrder.reduce((acc, category) => {
    acc[category] = models.filter(m => m.category === category);
    return acc;
  }, {} as Record<ModelCategory, LLMModel[]>);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4 transition-colors">
      <div className="flex items-center justify-between">
        {/* TC-102: Accessible label */}
        <label 
          id="llm-selector-label"
          className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Select LLM Model
        </label>
        {!readOnly && selectedLLM && (
          <button
            onClick={handleSaveAsDefault}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              showSavedConfirmation
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Save as default LLM for future prompts"
          >
            {showSavedConfirmation ? (
              <>
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Save Default</span>
              </>
            )}
          </button>
        )}
      </div>
      
      <div className="relative" ref={dropdownRef}>
        {/* TC-88: Model selector button with proper accessibility */}
        <button
          ref={buttonRef}
          type="button"
          role="combobox"
          aria-labelledby="llm-selector-label"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls="llm-listbox"
          aria-activedescendant={focusedIndex >= 0 ? `llm-option-${focusedIndex}` : undefined}
          onClick={handleToggleDropdown}
          onKeyDown={handleKeyDown}
          disabled={disabled || readOnly}
          className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 pr-9 sm:pr-10 text-sm sm:text-base border rounded-lg bg-white dark:bg-gray-700 text-left transition-all ${
            disabled || readOnly
              ? 'opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-600' 
              : selectedLLM 
                ? 'border-gray-300 dark:border-gray-600 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none'
                : 'border-red-300 dark:border-red-700 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none'
          }`}
        >
          {selectedModel ? (
            <div className="flex items-center gap-2">
              {selectedModel.logo && (
                <img 
                  src={selectedModel.logo} 
                  alt=""
                  aria-hidden="true"
                  className="w-4 h-4 sm:w-5 sm:h-5 object-contain"
                />
              )}
              <span className="text-gray-900 dark:text-gray-100">{selectedModel.name}</span>
            </div>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">Select a model...</span>
          )}
        </button>
        
        <ChevronDown 
          className={`absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 pointer-events-none transition-transform ${
            disabled || readOnly ? 'opacity-50' : ''
          } ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />

        {/* TC-89: Dropdown Menu with overflow management */}
        {isOpen && !disabled && !readOnly && (
          <div 
            id="llm-listbox"
            ref={listRef}
            role="listbox"
            aria-labelledby="llm-selector-label"
            className="absolute z-50 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-y-auto"
            style={getDropdownPosition()}
          >
            {/* TC-99: Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center p-4 gap-2 text-gray-500 dark:text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Loading models...</span>
              </div>
            )}
            
            {/* TC-99: Error state */}
            {loadError && !isLoading && (
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 mb-2">
                  <AlertCircle className="w-4 h-4" aria-hidden="true" />
                  <span className="text-sm">{loadError}</span>
                </div>
                <button
                  onClick={handleRetryLoad}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  Retry
                </button>
              </div>
            )}
            
            {/* Model list grouped by category - TC-90 */}
            {!isLoading && !loadError && (
              <>
                {categoryOrder.map((category) => {
                  const categoryModels = groupedModels[category];
                  if (!categoryModels || categoryModels.length === 0) return null;
                  
                  const startIndex = flattenedModels.findIndex(m => m.id === categoryModels[0].id);
                  
                  return (
                    <div key={category} className="py-1">
                      {/* TC-90: Category header */}
                      <div 
                        className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 sticky top-0"
                        role="presentation"
                      >
                        {categoryLabels[category]}
                      </div>
                      
                      {categoryModels.map((llm, idx) => 
                        renderModelItem(llm, startIndex + idx)
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
      
      {/* TC-98: Quota warning */}
      {quotaRemaining !== undefined && quotaRemaining <= 5 && quotaRemaining > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" aria-hidden="true" />
          You have {quotaRemaining} request{quotaRemaining !== 1 ? 's' : ''} remaining today.
        </p>
      )}
      
      {quotaRemaining !== undefined && quotaRemaining <= 0 && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" aria-hidden="true" />
          Daily limit reached. Resets at midnight or upgrade for unlimited access.
        </p>
      )}
    </div>
  );
}