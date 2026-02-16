/**
 * Application Constants
 * Environment variables aur configuration values
 */

// API Configuration
// NOTE: Points to Oscar Web Backend (https://oscar.samyarth.org)
export const API_CONFIG = {
  // Backend base URL - Oscar web deployment
  BASE_URL: 'https://oscar.samyarth.org/api/deepseek',

  // API Endpoints (format and title generation)
  FORMAT_ENDPOINT: 'https://oscar.samyarth.org/api/deepseek/format',
  TITLE_ENDPOINT: 'https://oscar.samyarth.org/api/deepseek/title',

  // Timeout configuration (in milliseconds)
  REQUEST_TIMEOUT_MS: 30000,

  // Retry configuration
  MAX_RETRIES: 2,
  INITIAL_RETRY_DELAY_MS: 1000,
} as const;

// UI Constants
export const UI_STRINGS = {
  APP_TITLE: 'Oscar',
  UNTITLED_NOTE: 'Untitled Note',
  RECORDING_TITLE: 'Record Your Voice',
  PROCESSING_TITLE: 'Processing Your Speech',
  FORMATTING_SUBTITLE: 'DeepSeek is organizing your thoughts',
  ERROR_TITLE: 'Formatting Failed',
  SAVE_NOTE: 'Save Note',
  RECORD_AGAIN: 'Record Again',
  FORMAT_WITH_AI: 'Format with AI',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NO_TEXT_PROVIDED_FOR_FORMATTING: 'No text provided for formatting',
  NO_TEXT_PROVIDED_FOR_TITLE: 'No text provided for title generation',
  FORMATTING_CANCELLED: 'Formatting was cancelled',
  EMPTY_RESPONSE_FROM_FORMATTING: 'Empty response from formatting service',
  EMPTY_RESPONSE_FROM_TITLE: 'Empty response from title generation service',
  DEEPSEEK_API_ERROR: 'DeepSeek API error',
  DEEPSEEK_REQUEST_FAILED: 'Failed to communicate with DeepSeek',
  SERVER_MISSING_API_KEY: 'Server missing API key configuration',
  INVALID_JSON_BODY: 'Invalid JSON body',
  RAW_TEXT_REQUIRED: 'Raw text is required for formatting',
  TEXT_REQUIRED: 'Text is required for title generation',
  INVALID_DEEPSEEK_RESPONSE: 'Invalid response from DeepSeek',
  REQUEST_TIMEOUT: 'Request timed out. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  VOCABULARY_LOAD_FAILED: 'Failed to load vocabulary',
  VOCABULARY_ADD_FAILED: 'Failed to add vocabulary entry',
  VOCABULARY_UPDATE_FAILED: 'Failed to update vocabulary entry',
  VOCABULARY_DELETE_FAILED: 'Failed to delete vocabulary entry',
  VOCABULARY_LIMIT_REACHED: 'Vocabulary limit reached',
  TERM_REQUIRED: 'Term is required',
  DUPLICATE_TERM: 'This term already exists',
  
  // Subscription/Usage limits
  RECORDINGS_LIMIT_REACHED: 'You have reached your monthly recording limit. Upgrade to Pro for unlimited recordings.',
  NOTES_LIMIT_REACHED: 'You have reached your notes limit. Upgrade to Pro for unlimited notes.',
} as const;

// Processing Steps (for UI display)
export const PROCESSING_STEPS = [
  { title: 'Transcribing Audio' },
  { title: 'Formatting Text' },
  { title: 'Generating Title' },
] as const;

// Title generation configuration
export const TITLE_CONFIG = {
  MAX_LENGTH: 60,
  MIN_LENGTH: 10,
} as const;

// Subscription/Plan Configuration
export const SUBSCRIPTION_CONFIG = {
  // Recordings - monthly limit
  FREE_MAX_RECORDINGS: 5,
  PRO_MAX_RECORDINGS: null, 
  
  // Notes - total limit
  FREE_MAX_NOTES: 10,
  PRO_MAX_NOTES: null,
  
  // Vocabulary entries
  FREE_MAX_VOCABULARY: 5,
  PRO_MAX_VOCABULARY: 50,
} as const;
