import { API_CONFIG, UI_STRINGS, ERROR_MESSAGES } from '@/constants';
import { supabase } from '@/lib/supabase/client';

/**
 * Fetch with timeout and abort signal support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = API_CONFIG.REQUEST_TIMEOUT_MS,
  signal?: AbortSignal
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Listen to external abort signal
  if (signal?.aborted) {
    clearTimeout(timeoutId);
    throw new Error(ERROR_MESSAGES.FORMATTING_CANCELLED);
  }

  const handleExternalAbort = () => {
    controller.abort();
  };

  if (signal) {
    signal.addEventListener('abort', handleExternalAbort);
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', handleExternalAbort);
    }
    if (error instanceof Error && error.name === 'AbortError') {
      if (signal?.aborted) {
        throw new Error(ERROR_MESSAGES.FORMATTING_CANCELLED);
      }
      throw new Error(ERROR_MESSAGES.REQUEST_TIMEOUT);
    }
    throw error;
  } finally {
    if (signal) {
      signal.removeEventListener('abort', handleExternalAbort);
    }
  }
}

interface FormattingResult {
  success: boolean;
  formattedText?: string;
  error?: string;
  fallback?: boolean;
}

interface TitleGenerationResult {
  success: boolean;
  title?: string;
  error?: string;
}

const RETRY_CONFIG = {
  MAX_RETRIES: API_CONFIG.MAX_RETRIES,
  INITIAL_DELAY_MS: API_CONFIG.INITIAL_RETRY_DELAY_MS,
  TIMEOUT_MS: API_CONFIG.REQUEST_TIMEOUT_MS,
} as const;

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = RETRY_CONFIG.MAX_RETRIES,
  initialDelay: number = RETRY_CONFIG.INITIAL_DELAY_MS
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(
          `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export const aiService = {
  /**
   * Format raw transcript text using Oscar web backend
   * @param rawText - Raw transcript from speech recognition
   * @param signal - Optional AbortSignal for cancellation
   * @returns Formatted text result
   */
  async formatText(
    rawText: string,
    signal?: AbortSignal
  ): Promise<FormattingResult> {
    if (!rawText || !rawText.trim()) {
      return {
        success: false,
        error: ERROR_MESSAGES.NO_TEXT_PROVIDED_FOR_FORMATTING,
      };
    }

    // Check for cancellation early
    if (signal?.aborted) {
      return {
        success: false,
        error: ERROR_MESSAGES.FORMATTING_CANCELLED,
      };
    }

    try {
      return await retryWithBackoff(
        async () => {
          // Get auth token from Supabase
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;

          if (!token) {
            throw new Error('Unauthorized access');
          }

          const response = await fetchWithTimeout(
            API_CONFIG.FORMAT_ENDPOINT,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Auth-Token': token,
              },
              body: JSON.stringify({ rawText }),
            },
            API_CONFIG.REQUEST_TIMEOUT_MS,
            signal
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData?.error || `Formatting failed: ${response.status}`
            );
          }

          const data = await response.json();
          const formattedText = data?.formattedText?.trim();

          if (!formattedText) {
            throw new Error(ERROR_MESSAGES.EMPTY_RESPONSE_FROM_FORMATTING);
          }

          // Remove markdown code blocks if present
          const cleanedText = formattedText
            .replace(/^```[\w]*\n/, '')
            .replace(/\n```$/, '')
            .trim();

          return {
            success: true,
            formattedText: cleanedText,
          };
        },
        API_CONFIG.MAX_RETRIES,
        API_CONFIG.INITIAL_RETRY_DELAY_MS
      );
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Format text error:', error);

      // Don't retry fallback if cancelled
      if (err?.message === ERROR_MESSAGES.FORMATTING_CANCELLED) {
        return {
          success: false,
          error: ERROR_MESSAGES.FORMATTING_CANCELLED,
        };
      }

      return {
        success: false,
        error: err?.message || 'Failed to format text',
      };
    }
  },

  /**
   * Generate a concise title for the note using Oscar web backend
   * @param text - Formatted or raw text content
   * @param signal - Optional AbortSignal for cancellation
   * @returns Title generation result
   */
  async generateTitle(
    text: string,
    signal?: AbortSignal
  ): Promise<TitleGenerationResult> {
    const source = (text || '').trim();

    if (!source) {
      return {
        success: false,
        error: ERROR_MESSAGES.NO_TEXT_PROVIDED_FOR_TITLE,
      };
    }

    // Check for cancellation early
    if (signal?.aborted) {
      return this.generateFallbackTitle(source);
    }

    try {
      return await retryWithBackoff(
        async () => {
          // Get auth token from Supabase
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;

          if (!token) {
            throw new Error('Unauthorized access');
          }

          const response = await fetchWithTimeout(
            API_CONFIG.TITLE_ENDPOINT,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Auth-Token': token,
              },
              body: JSON.stringify({ text: source }),
            },
            API_CONFIG.REQUEST_TIMEOUT_MS,
            signal
          );

          if (!response.ok) {
            // Fall back to heuristic on error
            return this.generateFallbackTitle(source);
          }

          const data = await response.json();
          const title = data?.title?.trim();

          if (!title) {
            return this.generateFallbackTitle(source);
          }

          const sanitized = this.sanitizeTitle(title);

          return {
            success: true,
            title: sanitized,
          };
        },
        API_CONFIG.MAX_RETRIES,
        API_CONFIG.INITIAL_RETRY_DELAY_MS
      );
    } catch (error: unknown) {
      console.error('Title generation error:', error);
      return this.generateFallbackTitle(source);
    }
  },

  /**
   * Generate fallback title using heuristic approach
   * @param text - Text content
   * @returns Heuristic title
   */
  generateFallbackTitle(text: string): TitleGenerationResult {
    try {
      const cleaned = text.replace(/\s+/g, ' ').trim();
      const firstSentence = (cleaned.match(/[^.!?]+[.!?]?/) || [''])[0].trim();
      const truncated =
        firstSentence.length > 60
          ? firstSentence.slice(0, 57).trim() + '…'
          : firstSentence;

      const title = this.sanitizeTitle(
        truncated || cleaned.slice(0, 60)
      );

      return {
        success: true,
        title,
      };
    } catch {
      return {
        success: true,
        title: UI_STRINGS.UNTITLED_NOTE,
      };
    }
  },

  /**
   * Sanitize title by removing unwanted characters
   * @param title - Raw title
   * @returns Cleaned title
   */
  sanitizeTitle(title: string): string {
    return (title || '')
      .replace(/[\r\n]+/g, ' ')
      .replace(/^["'\s]+|["'\s]+$/g, '')
      .replace(/^```[\w]*\n/, '')
      .replace(/\n```$/, '')
      .trim();
  },
};
