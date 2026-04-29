import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vuvrshwfzvjutexhodtg.supabase.co";
const supabaseAnonKey = "sb_publishable_qIJfOyFHTzFrXRk5_gEB4g_5pCJsQMe";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
