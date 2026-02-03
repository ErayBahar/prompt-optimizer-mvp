import { requestJson, buildUrl } from './apiClient';

// Favorites Service - Backend integration

export interface FavoriteError {
  type: 'server' | 'network';
  message: string;
  statusCode?: number;
}

// Favorileri toggle et
export async function toggleFavorite(
  promptId: string,
  isFavorite: boolean
): Promise<{ success: boolean; error?: FavoriteError }> {
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
    await requestJson(buildUrl(`/prompt/${promptId}/favorite`), {
      method: 'PUT',
      body: JSON.stringify({ isFavorite: !isFavorite }),
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'server',
        message: 'Couldn\'t update favorite. Please try again.',
      },
    };
  }
}

// Tüm favorileri getir
export async function getFavorites(userId: string, limit: number = 200): Promise<{
  success: boolean;
  favoriteIds?: string[];
  error?: FavoriteError;
}> {
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
    const response = await requestJson<{ history?: { id: string; isFavorite?: boolean }[] }>(
      buildUrl(`/history/${userId}`, { limit }),
      { method: 'GET' }
    );

    const favoriteIds = (response.history ?? [])
      .filter((item) => item.isFavorite)
      .map((item) => item.id);

    return { success: true, favoriteIds };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'server',
        message: 'Couldn\'t fetch favorites. Please try again.',
      },
    };
  }
}
