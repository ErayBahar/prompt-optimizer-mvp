import { requestJson, buildUrl } from './apiClient';

// Feedback Service - Backend integration

// Old feedback interface (for backward compatibility)
export interface FeedbackData {
  promptId: string;
  rating: 'positive' | 'negative';
  comment?: string;
  timestamp: Date;
}

// New rating interface (for star ratings)
export interface RatingData {
  promptId: string;
  rating: number; // 1-5
  timestamp: Date;
}

// Extended feedback interface (used in App.tsx)
export interface ExtendedFeedbackData {
  promptId: string;
  originalPrompt: string;
  optimizedPrompt: string;
  rating: number;
  selectedLLM?: string;
  scoreWeights?: any;
  tokenCount: number;
  latency: number;
}

export interface SaveFeedbackResult {
  success: boolean;
  error?: {
    type: 'network' | 'server';
    message: string;
  };
}

// Mock rating save function (for star ratings)
export async function saveRating(
  ratingData: RatingData
): Promise<SaveFeedbackResult> {
  // Network kontrolü
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
    await requestJson(buildUrl('/feedback'), {
      method: 'POST',
      body: JSON.stringify({
        promptID: ratingData.promptId,
        rating: ratingData.rating,
      }),
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'server',
        message: 'Your feedback could not be saved. Please try again.',
      },
    };
  }
}

// Mock feedback save function (extended version for App.tsx)
export async function saveFeedback(
  feedback: ExtendedFeedbackData
): Promise<string> {
  // Network kontrolü
  if (!navigator.onLine) {
    throw new Error('No internet connection. Please try again when you\'re connected.');
  }

  if (!feedback.promptId) {
    throw new Error('Missing promptId for feedback submission.');
  }

  await requestJson(buildUrl('/feedback'), {
    method: 'POST',
    body: JSON.stringify({
      promptID: feedback.promptId,
      rating: feedback.rating,
    }),
  });

  return feedback.promptId;
}
