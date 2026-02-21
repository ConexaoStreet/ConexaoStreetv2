import { applySavedTheme, toggleTheme } from "../ui/theme.js";
import { wireRipples } from "../ui/ripple.js";
import { toast } from "../ui/toast.js";
import { getUser, supa } from "../supabaseClient.js";
import { ensureProfile, signInWithEmail } from "../auth.js";

function $(id){ return document.getElementById(id); }

async function main(){
  applySavedTheme();
  wireRipples(document);
  const themeBtn = $("themeBtn");
  if(themeBtn) themeBtn.addEventListener("click", (e)=>{ e.preventDefault(); toggleTheme(); });

  const user = await getUser();
  if(!user){
    $("loggedOut").classList.remove("hidden");
    $("loginBtn").addEventListener("click", async ()=>{
      const v = String($("email").value||"").trim();
      if(!v || !v.includes("@")){ toast("E-mail inválido."); return; }
      try{ await signInWithEmail(v); toast("Link enviado ✅","Confirme no e-mail."); }catch(e){ toast("Erro", e.message||""); }
    });
    return;
  }
  try{ await ensureProfile(); }catch{}
  $("loggedOut").classList.add("hidden");
  $("loggedIn").classList.remove("hidden");
  $("meEmail").textContent = user.email || "";

  // load profile
  const { data } = await supa().from("cs_profiles").select("*").eq("user_id", user.id).maybeSingle();
  $("name").value = (data && data.display_name) ? data.display_name : "";

  $("saveBtn").addEventListener("click", async ()=>{
    const name = String($("name").value||"").trim() || null;
    const { error } = await supa().from("cs_profiles").update({ display_name: name }).eq("user_id", user.id);
    if(error) toast("Erro", error.message);
    else toast("Salvo ✅", "Perfil atualizado.");
  });

  const file = $("avatar");
  $("uploadBtn").addEventListener("click", async ()=>{
    const f = file.files && file.files[0];
    if(!f){ toast("Escolha um avatar."); return; }
    try{
      const path = `avatars/${user.id}/${Date.now()}_${f.name}`.replace(/\s+/g,"_");
      
// bucket check (mensagem amigável)
try{
  const { data: buckets, error: bErr } = await supa().storage.listBuckets();
  if(bErr) throw bErr;
  const ok = (buckets||[]).some(b=>b && b.name==="avatars");
  if(!ok){ toast("Bucket avatars não existe.", "Crie o bucket \"avatars\" no Storage."); return; }
}catch{}

const { error: upErr } = await supa().storage.from("avatars").upload(path, f, { upsert:true });
      if(upErr) throw upErr;
      const { error: uErr } = await supa().from("cs_profiles").update({ avatar_path: path }).eq("user_id", user.id);
      if(uErr) throw uErr;
      toast("Avatar atualizado ✅");
    }catch(e){
      toast("Falha no upload.", e.message||"");
    }
  });
}

document.addEventListener("DOMContentLoaded", main);
