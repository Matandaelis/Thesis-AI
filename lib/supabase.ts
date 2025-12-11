import { createClient } from '@supabase/supabase-js';

// Fallback to provided credentials if environment variables are missing to prevent runtime errors
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iyougiigvvdnbdfcexkz.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5b3VnaWlndnZkbmJkZmNleGt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTI0MjQsImV4cCI6MjA4MDk4ODQyNH0.VED3NUp1dcPYhQbRSthtKyj0pGnIb9fbp89wBJymFUw";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Please check lib/supabase.ts");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);