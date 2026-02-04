import { useState, useEffect, useRef } from 'react';
import { countTokens } from '@/services/apiService';
import { Eraser } from 'lucide-react';
import { validateAndSanitize, detectXss } from '@/utils/sanitize';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  selectedLLM?: string;
  hasOptimizedResult?: boolean; // ✅ Optimize sonucu var mı kontrolü
  showClearButton?: boolean; // ✅ Clear butonunu göster/gizle
  isDisabled?: boolean; // ✅ Disable input during optimization
}

export function PromptInput({ value, onChange, onClear, selectedLLM, hasOptimizedResult, showClearButton = true, isDisabled = false }: PromptInputProps) {
  const MAX_LENGTH = 1000;
  const [tokenCount, setTokenCount] = useState(0);
  const [isCountingTokens, setIsCountingTokens] = useState(false);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // TC-87: Security check for XSS/injection
    const xssCheck = detectXss(newValue);
    if (!xssCheck.isValid) {
      setSecurityWarning('Potentially unsafe content detected. Some characters may be sanitized.');
      // Allow input but show warning - will be sanitized on submit
    } else {
      setSecurityWarning(null);
    }
    
    // Karakter limitini aşmayı engelle
    if (newValue.length <= MAX_LENGTH) {
      onChange(newValue);
    }
  };

  // TC-27, TC-28: Clear button handler
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
  };

  // Token counting - debounce ile
  useEffect(() => {
    // Önceki timer'ı temizle
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Boş değer kontrolü
    if (!value || value.trim().length === 0) {
      setTokenCount(0);
      setIsCountingTokens(false);
      return;
    }

    // Debounce ile token counting başlat
    setIsCountingTokens(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const count = await countTokens({ prompt: value, selectedLLM });
        setTokenCount(count);
      } catch (error) {
        console.error('Token counting error:', error);
        // Fallback estimation
        setTokenCount(Math.ceil(value.length / 4));
      } finally {
        setIsCountingTokens(false);
      }
    }, 500); // 500ms debounce

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, selectedLLM]);

  const characterCount = value.length;
  const isNearLimit = characterCount >= 900;
  // Clear button her zaman görünür olmalı (optimize sonrası da kalmalı)
  const showClearButtonFinal = value.length > 0 && showClearButton;

  return (
    <div className="space-y-1.5 sm:space-y-2">
      <div className="flex justify-between items-center">
        <label htmlFor="prompt-input" className="block text-xs sm:text-sm font-medium text-gray-700">
          Prompt Input
        </label>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className={`text-xs sm:text-sm ${isNearLimit ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
            {characterCount}/{MAX_LENGTH} chars
          </span>
          <span className="text-xs sm:text-sm text-gray-500 min-w-[80px] text-right">
            {isCountingTokens ? (
              <span className="text-gray-400">counting...</span>
            ) : (
              <>{tokenCount} tokens</>
            )}
          </span>
          {/* TC-27: Clear button sadece içerik varsa göster */}
          {showClearButtonFinal && (
            <button
              onClick={handleClear}
              className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors relative group"
              aria-label="Clear all"
            >
              <Eraser className="w-4 h-4 sm:w-5 sm:h-5" />
              {/* Tooltip with arrow */}
              <span className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Clear all
                {/* Arrow pointing down */}
                <span className="absolute top-full right-2 -mt-1 border-4 border-transparent border-t-gray-900"></span>
              </span>
            </button>
          )}
        </div>
      </div>
      <textarea
        id="prompt-input"
        value={value}
        onChange={handleChange}
        maxLength={MAX_LENGTH}
        placeholder="Enter your prompt to optimize... (minimum 10 characters)"
        disabled={isDisabled}
        className={`w-full h-28 sm:h-32 px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border rounded-lg resize-none transition-all duration-300 ease-in-out ${
          isDisabled 
            ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed opacity-70 shadow-none' 
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      />
      
      {/* TC-87: Security warning for XSS/injection attempts */}
      {securityWarning && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {securityWarning}
        </p>
      )}
    </div>
  );
}