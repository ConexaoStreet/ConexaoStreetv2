import { supabase } from './supabaseClient.js';

export async function isAdmin(userId){
  try{
    if(!userId) return false;
    const { data, error } = await supabase
      .from('cs_admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if(error) return false;
    return !!data;
  }catch{
    return false;
  }
}

export async function requireAdmin(){
  try{
    const { data } = await supabase.auth.getUser();
    const u = data?.user || null;
    if(!u) return false;
    return await isAdmin(u.id);
  }catch{
    return false;
  }
}
