/**
 * Environment variable validation and access utilities.
 * Ensures all required env vars are set and provides type-safe access.
 */

interface EnvConfig {
  GEMINI_API_KEY?: string;
  OPENCITATIONS_API_KEY?: string;
}

// Safely get environment variables
const getEnv = (key: string): string | undefined => {
  if (typeof window === 'undefined') {
    // Server-side
    return process.env[key];
  } else {
    // Client-side - prefer vite variables
    return (import.meta as any)?.env?.[`VITE_${key}`] || 
           (window as any)?.[`__env__${key}`];
  }
};

export const env = {
  // Gemini API Key with fallback to legacy API_KEY
  GEMINI_API_KEY: getEnv('GEMINI_API_KEY') || 
                   getEnv('API_KEY') || 
                   getEnv('VITE_API_KEY'),
  
  // OpenCitations API Key with fallback to legacy OPENCITATIONS_TOKEN
  OPENCITATIONS_API_KEY: getEnv('OPENCITATIONS_API_KEY') || 
                         getEnv('OPENCITATIONS_TOKEN'),
} as const;

/**
 * Validate that all required environment variables are set.
 * Throws an error if GEMINI_API_KEY is missing.
 */
export const validateEnv = (): void => {
  if (!env.GEMINI_API_KEY) {
    throw new Error(
      'Missing required environment variable: GEMINI_API_KEY. ' +
      'Please set GEMINI_API_KEY in your .env.local file.'
    );
  }
};

/**
 * Check if a specific environment variable is set.
 */
export const hasEnv = (key: keyof typeof env): boolean => {
  return !!env[key];
};

/**
 * Get an environment variable, throwing an error if not set.
 */
export const getRequiredEnv = (key: keyof typeof env): string => {
  const value = env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Please set ${key} in your .env.local file.`
    );
  }
  return value;
};
