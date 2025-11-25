// src/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xzfyxpierlbchxlfrkow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Znl4cGllcmxiY2h4bGZya293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTIxNzMsImV4cCI6MjA3OTY2ODE3M30.65um-xx7NINnvDuQC796qGzNM_chmk8hs7sH0-N6UKI';
export const supabase = createClient(supabaseUrl, supabaseKey);