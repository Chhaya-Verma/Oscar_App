import { useState, useRef, useEffect, useCallback } from 'react';
import { aiService } from '../services/ai.service';

interface TranslationResult {
  success: boolean;
  translatedText?: string;
  error?: string;
}

/**
 * Hook for translating text to different languages
 */
export function useAITranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const translateText = useCallback(
    async (
      text: string,
      targetLanguage: 'en' | 'hi'
    ): Promise<TranslationResult> => {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setIsTranslating(true);
      setTranslationError(null);

      try {
        const result = await aiService.translateText(
          text,
          targetLanguage,
          abortControllerRef.current.signal
        );
        if (!result.success) {
          setTranslationError(result.error || 'Failed to translate text');
        }
        return result;
      } catch (error: unknown) {
        const err = error as Error;
        const errorMsg = err?.message || 'Failed to translate text';
        setTranslationError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsTranslating(false);
      }
    },
    []
  );

  const cancelTranslation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsTranslating(false);
    }
  }, []);

  return { isTranslating, translationError, translateText, cancelTranslation };
}