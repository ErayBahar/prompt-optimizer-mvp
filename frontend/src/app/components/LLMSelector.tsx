import { ChevronDown, Save, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
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
}

// Backend'den gelecek - şimdilik mock
const mockLLMs = [
  { id: 'openai/gpt-oss-120b', name: 'OpenAI / GPT-OSS-120B', logo: openaiLogo },
  { id: 'Qwen/Qwen3-Coder-480B-A35B-Instruct', name: 'Qwen / Qwen3 Coder 480B A35B Instruct', logo: qwenLogo },
  { id: 'openai/gpt-oss-20b', name: 'OpenAI / GPT-OSS-20B', logo: openaiLogo },
  { id: 'NousResearch/Hermes-4-70B', name: 'NousResearch / Hermes 4 70B', logo: nousResearchLogo },
  { id: 'zai-org/GLM-4.5-Air', name: 'Zai-org / GLM 4.5 Air', logo: zaiLogo },
  { id: 'PrimeIntellect/INTELLECT-3', name: 'PrimeIntellect / INTELLECT-3', logo: primeIntellectLogo },
  { id: 'Qwen/Qwen3-Next-80B-A3B-Thinking', name: 'Qwen / Qwen3 Next 80B A3B Thinking', logo: qwenLogo },
  { id: 'Qwen/Qwen3-235B-A22B-Instruct-2507', name: 'Qwen / Qwen3 235B A22B Instruct 2507', logo: qwenLogo },
  { id: 'Qwen/Qwen3-32B-fast', name: 'Qwen / Qwen3 32B Fast', logo: qwenLogo },
  { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Meta-Llama / Llama 3.3 70B Instruct', logo: metaLogo },
  { id: 'google/gemma-3-27b-it', name: 'Google / Gemma 3 27B IT', logo: googleLogo },
];

// Default LLM
export const DEFAULT_LLM = 'openai/gpt-oss-120b';

// LocalStorage key for default LLM
const DEFAULT_LLM_KEY = 'llm_default';

export function LLMSelector({ selectedLLM, onChange, disabled = false, readOnly = false }: LLMSelectorProps) {
  const [hasDefaultLLM, setHasDefaultLLM] = useState(false);
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if there's a default LLM saved
  useEffect(() => {
    const savedDefault = localStorage.getItem(DEFAULT_LLM_KEY);
    if (savedDefault) {
      setHasDefaultLLM(true);
    }
  }, []);

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

  const selectedModel = mockLLMs.find(llm => llm.id === selectedLLM);

  const handleSelect = (llmId: string) => {
    onChange(llmId);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const currentRef = dropdownRef.current;
    const handleClickOutside = (event: MouseEvent) => {
      if (currentRef && !currentRef.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4 transition-colors">
      <div className="flex items-center justify-between">
        <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
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
        )}
      </div>
      
      <div className="relative" ref={dropdownRef}>
        {/* Selected Value Display */}
        <button
          type="button"
          onClick={() => !disabled && !readOnly && setIsOpen(!isOpen)}
          disabled={disabled || readOnly}
          className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 pr-9 sm:pr-10 text-sm sm:text-base border rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left transition-all ${
            disabled || readOnly
              ? 'opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-600' 
              : selectedLLM 
                ? 'border-gray-300 dark:border-gray-600 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500'
                : 'border-red-300 dark:border-red-700 cursor-pointer'
          }`}
        >
          {selectedModel ? (
            <div className="flex items-center gap-2">
              {selectedModel.logo && (
                <img 
                  src={selectedModel.logo} 
                  alt={selectedModel.name}
                  className="w-4 h-4 sm:w-5 sm:h-5 object-contain"
                />
              )}
              <span className="text-gray-900 dark:text-gray-100">{selectedModel.name}</span>
            </div>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">Select a model...</span>
          )}
        </button>
        
        <ChevronDown className={`absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 pointer-events-none transition-opacity ${
          disabled || readOnly ? 'opacity-50' : ''
        }`} />

        {/* Dropdown Menu */}
        {isOpen && !disabled && !readOnly && (
          <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {mockLLMs.map((llm) => (
              <button
                key={llm.id}
                type="button"
                onClick={() => handleSelect(llm.id)}
                className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 text-left text-sm sm:text-base hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 ${
                  selectedLLM === llm.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {llm.logo && (
                  <img 
                    src={llm.logo} 
                    alt={llm.name}
                    className="w-4 h-4 sm:w-5 sm:h-5 object-contain flex-shrink-0"
                  />
                )}
                <span className="truncate">{llm.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}