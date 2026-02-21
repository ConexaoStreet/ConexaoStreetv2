import { supa, getSession, getUser } from "./supabaseClient.js";
import { toast } from "./ui/toast.js";

const AFTER = "csv2_after_login";

export async function ensureProfile(){
  const user = await getUser();
  if(!user) return null;

  const payload = {
    user_id: user.id,
    email: user.email || null,
    display_name: (user.user_metadata && (user.user_metadata.name || user.user_metadata.full_name)) || null
  };
  await supa().from("cs_profiles").upsert(payload, { onConflict: "user_id" });
  return user;
}

export async function signInWithEmail(email){
  const { error } = await supa().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.href }
  });
  if(error) throw error;
}

export async function signOut(){
  await supa().auth.signOut();
}

export async function requireLogin(redirectTo){
  const sess = await getSession();
  if(sess) return true;
  localStorage.setItem(AFTER, redirectTo || window.location.href);
  toast("Você precisa entrar primeiro.", "Entre com seu e-mail para continuar.");
  return false;
}

export function postLoginRedirect(){
  const url = localStorage.getItem(AFTER);
  if(url){
    localStorage.removeItem(AFTER);
    window.location.href = url;
  }
}
