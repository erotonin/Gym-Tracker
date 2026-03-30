import { createClient } from '@supabase/supabase-js';

// We get settings from localStorage or environment variables
let supabaseUrl = localStorage.getItem('supabaseUrl') || import.meta.env.VITE_SUPABASE_URL || '';
let supabaseAnonKey = localStorage.getItem('supabaseKey') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error("Failed to initialize Supabase client", error);
  }
}

export const reinitSupabase = (url, key) => {
  localStorage.setItem('supabaseUrl', url);
  localStorage.setItem('supabaseKey', key);
  try {
    supabase = createClient(url, key);
    return true;
  } catch (error) {
    console.error("Failed to initialize Supabase client", error);
    return false;
  }
};
