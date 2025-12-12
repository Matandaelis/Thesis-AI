
import { createClient } from '@supabase/supabase-js';

// Helper to safely access environment variables across different build systems
const getEnv = (key: string) => {
  // 1. Try Vite's import.meta.env
  try {
    const meta = (import.meta as any);
    if (meta && meta.env && meta.env[key]) return meta.env[key];
  } catch (e) {}

  // 2. Try standard process.env
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  } catch (e) {}

  // 3. Try window.process.env (manual polyfill)
  try {
    if (typeof window !== 'undefined' && (window as any).process && (window as any).process.env && (window as any).process.env[key]) {
        return (window as any).process.env[key];
    }
  } catch (e) {}

  return '';
};

// Retrieve environment variables
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log("Supabase credentials missing. App will run in local-only mode.");
}

// Export null if credentials are missing to prevent invalid connection attempts
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
