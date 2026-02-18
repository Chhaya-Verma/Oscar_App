import { useState, useRef, useEffect, useCallback } from 'react';
import { aiService } from '../services/ai.service';

interface FormattingResult {
  success: boolean;
  formattedText?: string;
  error?: string;
  fallback?: boolean;
}

/**
 * Hook for formatting notes into Gmail-friendly email bodies
 */
export function useAIEmailFormatting() {
  const [isFormatting, setIsFormatting] = useState(false);
  const [formattingError, setFormattingError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const formatEmailText = useCallback(
    async (rawText: string, title?: string): Promise<FormattingResult> => {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setIsFormatting(true);
      setFormattingError(null);

      try {
        const result = await aiService.formatEmailText(
          rawText,
          title,
          abortControllerRef.current.signal
        );
        if (!result.success) {
          setFormattingError(result.error || 'Failed to format email');
        }
        return result;
      } catch (error: unknown) {
        const err = error as Error;
        const errorMsg = err?.message || 'Failed to format email';
        setFormattingError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsFormatting(false);
      }
    },
    []
  );

  const cancelFormatting = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsFormatting(false);
    }
  }, []);

  return { isFormatting, formattingError, formatEmailText, cancelFormatting };
}