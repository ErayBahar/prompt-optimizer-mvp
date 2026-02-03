import { requestJson } from './apiClient';

// API Response Types
export interface WordMapping {
  text: string;
  category: 'TASK' | 'ROLE' | 'STYLE' | 'OUTPUT' | 'RULES';
}

export interface OptimizeResponse {
  optimizedPrompt: string;
  tokenCount?: number;
  latency?: number;
  originalScore?: number;
  optimizedScore?: number;
  wordMappings?: WordMapping[];
  originalWordMappings?: WordMapping[];
  promptId?: string;
}

export interface OptimizeRequest {
  prompt: string;
  userId: string;
  selectedLLM?: string;
  scoreWeights: Record<string, number>;
}

export interface TokenCountRequest {
  prompt: string;
  selectedLLM?: string;
}

export interface TokenCountResponse {
  token_count: number;
}

export interface ApiError {
  type: 'network' | 'timeout' | 'server' | 'schema' | 'rate-limit' | 'empty-response';
  message: string;
  statusCode?: number;
}

const REQUEST_TIMEOUT = 45000; // 45 saniye

interface BackendOptimizeResponse {
  status?: string;
  promptID?: string;
  optimizedPrompt?: string;
  optimizedPromptID?: string;
  finalTokenSize?: number;
  initialTokenSize?: number;
  parseLatencyMs?: number;
  optimizeLatencyMs?: number;
  totalLatencyMs?: number;
  originalScore?: number;
  optimizedScore?: number;
}

// Network kontrolü
export function checkNetworkConnection(): boolean {
  return navigator.onLine;
}

// Response validation
export function validateOptimizeResponse(data: any): { valid: boolean; error?: string; errorType?: 'schema' | 'empty-response' } {
  if (!data) {
    return { valid: false, error: 'Response is empty', errorType: 'schema' };
  }

  if (typeof data.optimizedPrompt !== 'string') {
    return { valid: false, error: 'Missing or invalid optimizedPrompt field', errorType: 'schema' };
  }

  // TC-26: Check if optimized_prompt is empty or only whitespace
  if (data.optimizedPrompt.trim().length === 0) {
    return { valid: false, error: 'optimizedPrompt is empty or whitespace only', errorType: 'empty-response' };
  }

  return { valid: true };
}

// Timeout helper with AbortController
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject({
        type: 'timeout',
        message: 'The AI is currently busy. Please try again shortly.',
      } as ApiError);
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

// Mock API call - Backend entegrasyonu yapıldığında güncellenecek
export async function optimizePrompt(
  request: OptimizeRequest
): Promise<{ optimizedPrompt: string; tokenCount: number; latency: number; originalScore: number; optimizedScore: number; wordMappings?: WordMapping[]; originalWordMappings?: WordMapping[]; tokenWarning?: boolean; promptId?: string }> {
  const { prompt, selectedLLM, scoreWeights, userId } = request;

  // Network kontrolü
  if (!checkNetworkConnection()) {
    throw {
      type: 'network',
      message: 'No internet connection. Please try again when you\'re connected.',
    } as ApiError;
  }

  try {
    const payload = {
      userID: userId,
      inputPrompt: prompt,
      weights: scoreWeights,
      ai_model: selectedLLM,
    };

    const response = await withTimeout(
      requestJson<BackendOptimizeResponse>('/optimize', {
        method: 'POST',
        body: JSON.stringify(payload),
      }).then((data) => ({
        optimizedPrompt: data.optimizedPrompt ?? '',
        tokenCount: data.finalTokenSize ?? data.initialTokenSize ?? 0,
        latency: data.totalLatencyMs ?? data.optimizeLatencyMs ?? data.parseLatencyMs ?? 0,
        originalScore: data.originalScore ?? 0,
        optimizedScore: data.optimizedScore ?? 0,
        wordMappings: undefined,
        originalWordMappings: undefined,
        promptId: data.promptID,
      })),
      REQUEST_TIMEOUT
    );

    const validation = validateOptimizeResponse(response);
    if (!validation.valid) {
      console.error('Validation failed:', validation.error);
      
      // TC-26: Empty response için özel hata mesajı
      if (validation.errorType === 'empty-response') {
        throw {
          type: 'empty-response',
          message: 'Optimization failed to generate a valid result. Please try again.',
        } as ApiError;
      }
      
      // Diğer schema hataları için genel mesaj
      throw {
        type: 'schema',
        message: 'An unexpected response was received from the server. Please try again.',
      } as ApiError;
    }

    // Token bilgisi kontrolü
    const tokenWarning = response.tokenCount === undefined || response.tokenCount === null;
    if (tokenWarning) {
      console.warn('Token information is missing from response');
    }

    return {
      optimizedPrompt: response.optimizedPrompt,
      tokenCount: response.tokenCount ?? 0,
      latency: response.latency ?? 0,
      originalScore: response.originalScore ?? 0,
      optimizedScore: response.optimizedScore ?? 0,
      wordMappings: response.wordMappings,
      originalWordMappings: response.originalWordMappings,
      tokenWarning,
      promptId: response.promptId,
    };
  } catch (error) {
    // Eğer hata zaten ApiError formatındaysa, direkt throw et
    if ((error as ApiError).type) {
      throw error;
    }

    // Diğer hatalar için genel server error
    console.error('Unexpected error during optimization:', error);
    throw {
      type: 'server',
      message: 'We ran into an error. Please try again.',
    } as ApiError;
  }
}

// Rate limit kontrolü için helper
export class RateLimiter {
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private readonly maxRequestsPerMinute: number = 10;
  private readonly cooldownPeriod: number = 10000; // 10 saniye

  canMakeRequest(): { allowed: boolean; cooldownMs?: number } {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    // 10 saniye içinde 10'dan fazla istek kontrolü
    if (this.requestCount >= this.maxRequestsPerMinute && timeSinceLastRequest < 60000) {
      const remainingCooldown = this.cooldownPeriod - timeSinceLastRequest;
      return {
        allowed: false,
        cooldownMs: Math.max(0, remainingCooldown),
      };
    }

    // 1 dakika geçtiyse sayacı sıfırla
    if (timeSinceLastRequest >= 60000) {
      this.requestCount = 0;
    }

    return { allowed: true };
  }

  recordRequest(): void {
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  reset(): void {
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }
}

// Token counting fallback (backend does not expose a dedicated endpoint)
export async function countTokens(
  request: TokenCountRequest
): Promise<number> {
  const { prompt, selectedLLM } = request;

  // Boş prompt kontrolü
  if (!prompt || prompt.trim().length === 0) {
    return 0;
  }

  // Network kontrolü
  if (!checkNetworkConnection()) {
    // Network yoksa fallback estimation kullan
    return Math.ceil(prompt.length / 4);
  }

  try {
    // Basit bir hesaplama (her LLM farklı tokenizer kullanabilir)
    let tokenCount: number;

    if (selectedLLM === 'gpt-4' || selectedLLM === 'gpt-3.5-turbo') {
      tokenCount = Math.ceil(prompt.length / 4);
    } else if (selectedLLM === 'claude-3') {
      tokenCount = Math.ceil(prompt.length / 3.8);
    } else {
      tokenCount = Math.ceil(prompt.length / 4);
    }

    return tokenCount;
  } catch (error) {
    // Hata durumunda fallback estimation kullan
    console.warn('Token counting failed, using estimation:', error);
    return Math.ceil(prompt.length / 4);
  }
}
