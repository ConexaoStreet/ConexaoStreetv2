import { CONFIG } from "./config.js";

let _client = null;

export function supa(){
  if(_client) return _client;
  if(!window.supabase) throw new Error("Supabase SDK não carregou.");
  _client = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  return _client;
}

export async function getSession(){
  const { data, error } = await supa().auth.getSession();
  if(error) throw error;
  return data.session || null;
}

export async function getUser(){
  const { data, error } = await supa().auth.getUser();
  if(error) return null;
  return data.user || null;
}
