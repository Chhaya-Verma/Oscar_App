import { supabase } from '@/lib/supabase/client';

export type FeedbackReason =
  | 'too_short'
  | 'missed_key_info'
  | 'incorrect_grammar'
  | 'wrong_tone'
  | 'poor_formatting'
  | 'other'
  | (string & {});

/**
 * Feedback Service
 * Handles AI formatting quality feedback storage and retrieval
 */

/**
 * Submit feedback for a note's AI formatting
 */
export async function submitFeedback(
  noteId: string,
  helpful: boolean,
  reasons?: FeedbackReason[]
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('notes')
      .update({
        feedback_helpful: helpful,
        feedback_reasons: reasons || null,
        feedback_timestamp: new Date().toISOString(),
      })
      .eq('id', noteId);

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error('Failed to submit feedback:', error);
    return { success: false, error };
  }
}

/**
 * Get feedback statistics for prompt optimization
 * Returns aggregated feedback data
 */
export async function getFeedbackStats(): Promise<{
  data: {
    total: number;
    helpful: number;
    notHelpful: number;
    helpfulPercentage: number;
    reasonBreakdown: Record<string, number>;
  } | null;
  error: Error | null;
}> {
  try {
    // Get all notes with feedback
    const { data: notes, error } = await supabase
      .from('notes')
      .select('feedback_helpful, feedback_reasons')
      .not('feedback_helpful', 'is', null);

    if (error) {
      throw error;
    }

    // Calculate statistics
    const total = notes?.length || 0;
    const helpful =
      notes?.filter((n) => n.feedback_helpful === true).length || 0;
    const notHelpful =
      notes?.filter((n) => n.feedback_helpful === false).length || 0;
    const helpfulPercentage = total > 0 ? (helpful / total) * 100 : 0;

    // Breakdown reasons for negative feedback
    const reasonBreakdown: Record<string, number> = {};
    notes?.forEach((note) => {
      if (note.feedback_helpful === false && note.feedback_reasons) {
        note.feedback_reasons.forEach((reason: string) => {
          reasonBreakdown[reason] = (reasonBreakdown[reason] || 0) + 1;
        });
      }
    });

    return {
      data: {
        total,
        helpful,
        notHelpful,
        helpfulPercentage,
        reasonBreakdown,
      },
      error: null,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error('Failed to fetch feedback stats:', error);
    return { data: null, error };
  }
}

/**
 * Get recent negative feedback with full context
 * Useful for prompt refinement
 */
export async function getRecentNegativeFeedback(limit: number = 20): Promise<{
  data: Array<{
    id: string;
    title: string;
    raw_text: string;
    original_formatted_text: string;
    feedback_reasons: FeedbackReason[];
    feedback_timestamp: string;
  }> | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select(
        'id, title, raw_text, original_formatted_text, feedback_reasons, feedback_timestamp'
      )
      .eq('feedback_helpful', false)
      .not('feedback_reasons', 'is', null)
      .order('feedback_timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error('Failed to fetch negative feedback:', error);
    return { data: null, error };
  }
}
