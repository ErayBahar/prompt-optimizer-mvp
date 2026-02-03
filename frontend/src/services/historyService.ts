import { requestJson, buildUrl } from './apiClient';

// History Service - Backend integration

export interface BackendHistoryItem {
  id: string;
  prompt: string;
  optimizedPrompt: string;
  timestamp?: string;
  tokenCount?: number;
  latency?: number;
  originalScore?: number;
  optimizedScore?: number;
  rating?: number;
  isFavorite?: boolean;
  llm?: string;
  scoreWeights?: Record<string, number>;
  wordMappings?: any[];
  originalWordMappings?: any[];
}

interface HistoryResponse {
  status?: string;
  history?: BackendHistoryItem[];
}

export interface DeleteError {
  type: 'server' | 'network';
  message: string;
  statusCode?: number;
}

export async function fetchPromptHistory(
  userId: string,
  limit: number = 50
): Promise<BackendHistoryItem[]> {
  const response = await requestJson<HistoryResponse>(buildUrl(`/history/${userId}`, { limit }), {
    method: 'GET',
  });

  return response.history ?? [];
}

export async function deletePromptFromHistory(
  promptId: string
): Promise<{ success: boolean; error?: DeleteError }> {
  if (!navigator.onLine) {
    return {
      success: false,
      error: {
        type: 'network',
        message: 'No internet connection. Please try again when you\'re connected.',
      },
    };
  }

  try {
    await requestJson(buildUrl(`/prompt/${promptId}`), {
      method: 'DELETE',
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'server',
        message: 'Couldn\'t be deleted. Please try again.',
      },
    };
  }
}

// Batch delete - gelecekte kullanılabilir
export async function deleteMultiplePrompts(
  promptIds: string[]
): Promise<{ success: boolean; failedIds?: string[]; error?: DeleteError }> {
  if (!navigator.onLine) {
    return {
      success: false,
      error: {
        type: 'network',
        message: 'No internet connection. Please try again when you\'re connected.',
      },
    };
  }

  try {
    await Promise.all(
      promptIds.map((promptId) =>
        requestJson(buildUrl(`/prompt/${promptId}`), {
          method: 'DELETE',
        })
      )
    );

    return { success: true };
  } catch (error) {
    return {
      success: false,
      failedIds: promptIds,
      error: {
        type: 'server',
        message: 'Couldn\'t be deleted. Please try again.',
      },
    };
  }
}