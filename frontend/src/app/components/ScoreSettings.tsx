import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Save, Check, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from './ui/hover-card';

interface ScoreWeights {
  task: number;
  role: number;
  style: number;
  output: number;
  rules: number;
}

interface ScoreSettingsProps {
  weights: ScoreWeights;
  onChange: (weights: ScoreWeights) => void;
  disabled?: boolean;
  readOnly?: boolean; // Proje görüntüleme modunda read-only
}

const scoreLabels = {
  task: 'TASK',
  role: 'ROLE',
  style: 'STYLE',
  output: 'OUTPUT',
  rules: 'RULES',
};

// Descriptions for each scoring aspect
const scoreDescriptions: Record<keyof ScoreWeights, { title: string; description: string; example: string }> = {
  task: {
    title: 'TASK',
    description: 'How clearly and accurately the prompt defines the task to be performed.',
    example: 'e.g. "Write a summary of the following article"',
  },
  role: {
    title: 'ROLE',
    description: 'How clearly the role or perspective of the model is defined.',
    example: 'e.g. "You are a senior product manager"',
  },
  style: {
    title: 'STYLE',
    description: 'How consistent and appropriate the tone, language, and writing style are.',
    example: 'e.g. formal, technical, concise',
  },
  output: {
    title: 'OUTPUT',
    description: 'How clearly the expected output format and structure are specified.',
    example: 'e.g. list, table, step-by-step response',
  },
  rules: {
    title: 'RULES',
    description: 'How well constraints, limitations, and special instructions are defined.',
    example: 'e.g. "Do not use Markdown", "Keep the response short"',
  },
};

// Discrete importance levels
type ImportanceLevel = 'low' | 'medium' | 'high';

const importanceValues: Record<ImportanceLevel, number> = {
  low: 1.0,      // Low importance
  medium: 2.0,   // Medium importance
  high: 3.0,     // High importance
};

// LocalStorage key for default weights
const DEFAULT_WEIGHTS_KEY = 'scoreWeights_default';

export function ScoreSettings({ weights, onChange, disabled = false, readOnly = false }: ScoreSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempWeights, setTempWeights] = useState(weights);
  const [hasDefaultWeights, setHasDefaultWeights] = useState(false);
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false);

  // Check if there are default weights saved
  useEffect(() => {
    const savedDefault = localStorage.getItem(DEFAULT_WEIGHTS_KEY);
    if (savedDefault) {
      setHasDefaultWeights(true);
    }
  }, []);

  useEffect(() => {
    setTempWeights(weights);
  }, [weights]);

  const handleImportanceChange = (key: keyof ScoreWeights, level: ImportanceLevel) => {
    if (disabled || readOnly) return;
    
    const value = importanceValues[level];
    const newWeights = { ...tempWeights, [key]: value };
    setTempWeights(newWeights);
    onChange(newWeights);
  };

  // Get current importance level for a parameter
  const getCurrentLevel = (value: number): ImportanceLevel => {
    if (Math.abs(value - importanceValues.low) < 0.01) return 'low';
    if (Math.abs(value - importanceValues.high) < 0.01) return 'high';
    return 'medium';
  };

  // Auto-balance: Set all to mean (2.0 each)
  const handleAutoBalance = () => {
    if (disabled || readOnly) return;
    
    const balancedWeights = {
      task: importanceValues.medium,
      role: importanceValues.medium,
      style: importanceValues.medium,
      output: importanceValues.medium,
      rules: importanceValues.medium,
    };
    
    setTempWeights(balancedWeights);
    onChange(balancedWeights);
  };

  // Save current weights as default
  const handleSaveDefault = () => {
    if (disabled || readOnly) return;
    
    localStorage.setItem(DEFAULT_WEIGHTS_KEY, JSON.stringify(tempWeights));
    setHasDefaultWeights(true);
    setShowSavedConfirmation(true);
    toast.success('Score weights saved as default. This will be applied to all future prompts.');
    
    // Hide confirmation after 3 seconds
    setTimeout(() => {
      setShowSavedConfirmation(false);
    }, 3000);
  };

  // Load default weights
  const handleLoadDefault = () => {
    if (disabled || readOnly) return;
    
    const savedDefault = localStorage.getItem(DEFAULT_WEIGHTS_KEY);
    if (savedDefault) {
      try {
        const defaultWeights = JSON.parse(savedDefault) as ScoreWeights;
        setTempWeights(defaultWeights);
        onChange(defaultWeights);
      } catch (error) {
        console.error('Failed to load default weights:', error);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4 transition-colors transition-colors">
      <div className="flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 dark:text-gray-100">
          Score Weights (Optional)
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400 dark:text-gray-400" />
          )}
        </button>
      </div>

      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
              Select importance level for each criterion.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Save Default Button */}
              <button
                onClick={handleSaveDefault}
                disabled={disabled || readOnly}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  showSavedConfirmation
                    ? 'bg-green-100 dark:bg-green-900/30 dark:bg-green-900/30 text-green-700 dark:text-green-400 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 dark:bg-gray-700 text-gray-700 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 dark:hover:bg-gray-600'
                } ${disabled || readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Save current settings as default"
              >
                {showSavedConfirmation ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Default</span>
                  </>
                )}
              </button>

              {/* Reset All Button */}
              <button
                onClick={handleAutoBalance}
                disabled={disabled || readOnly}
                className="px-3 py-1.5 text-xs sm:text-sm bg-blue-100 dark:bg-blue-900/30 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                title="Reset all to Medium"
              >
                Reset All
              </button>
            </div>
          </div>

          {/* Importance Level Sliders (Discrete: Min, Mean, Max) - Compact */}
          <div className="space-y-3">
            {Object.entries(scoreLabels).map(([key, label]) => {
              const value = tempWeights[key as keyof ScoreWeights];
              const currentLevel = getCurrentLevel(value);
              const description = scoreDescriptions[key as keyof ScoreWeights];
              
              // Map importance level to slider position (0, 1, 2)
              const sliderPosition = currentLevel === 'low' ? 0 : currentLevel === 'medium' ? 1 : 2;
              
              return (
                <div key={key} className="flex items-center gap-3 sm:gap-4">
                  {/* Label with Info Hover */}
                  <div className="flex items-center gap-1 w-20 sm:w-24 flex-shrink-0">
                    <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                      {label}
                    </label>
                    <HoverCard openDelay={200} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                          aria-label={`Info about ${label}`}
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-72 p-3" side="right" align="start">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {description.title}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {description.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                            {description.example}
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  
                  {/* Compact Slider - Shorter max width */}
                  <div className="flex-1 relative min-w-0 max-w-[120px] sm:max-w-[150px]">
                    {/* Track with 3 markers */}
                    <div className="relative h-1.5 bg-gray-200 dark:bg-gray-700 dark:bg-gray-700 rounded-full">
                      {/* Progress fill */}
                      <div 
                        className="absolute h-full bg-blue-500 dark:bg-blue-400 dark:bg-blue-400 rounded-full transition-all duration-200"
                        style={{ width: `${(sliderPosition / 2) * 100}%` }}
                      />
                      
                      {/* Marker dots - smaller */}
                      <div className="absolute top-1/2 left-0 w-2 h-2 bg-white dark:bg-gray-800 dark:bg-gray-800 border-2 border-gray-400 dark:border-gray-500 dark:border-gray-500 rounded-full -translate-y-1/2" />
                      <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white dark:bg-gray-800 dark:bg-gray-800 border-2 border-gray-400 dark:border-gray-500 dark:border-gray-500 rounded-full -translate-x-1/2 -translate-y-1/2" />
                      <div className="absolute top-1/2 right-0 w-2 h-2 bg-white dark:bg-gray-800 dark:bg-gray-800 border-2 border-gray-400 dark:border-gray-500 dark:border-gray-500 rounded-full -translate-y-1/2" />
                    </div>
                    
                    {/* Slider input (invisible but functional) */}
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="1"
                      value={sliderPosition}
                      onChange={(e) => {
                        const pos = parseInt(e.target.value);
                        const level: ImportanceLevel = pos === 0 ? 'low' : pos === 1 ? 'medium' : 'high';
                        handleImportanceChange(key as keyof ScoreWeights, level);
                      }}
                      disabled={disabled || readOnly}
                      className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                  </div>
                  
                  {/* Current level indicator - compact */}
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 dark:text-blue-400 w-12 sm:w-14 flex-shrink-0 text-right">
                    {currentLevel === 'low' ? 'Low' : currentLevel === 'medium' ? 'Medium' : 'High'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend aligned under slider markers */}
          <div className="flex items-center gap-3 sm:gap-4 mt-2">
            {/* Empty space for label alignment (matches label + info icon width) */}
            <div className="w-20 sm:w-24 flex-shrink-0"></div>
            
            {/* Legend aligned with slider */}
            <div className="flex-1 relative min-w-0 max-w-[120px] sm:max-w-[150px]">
              <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 font-medium">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>
            
            {/* Empty space for level indicator alignment */}
            <div className="w-12 sm:w-14 flex-shrink-0"></div>
          </div>
        </div>
      </div>
    </div>
  );
}