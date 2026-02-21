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
    $("loggedIn").classList.add("hidden");
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

  const { data, error } = await supa().from("cs_notifications").select("*").eq("user_id", user.id).order("created_at", { ascending:false }).limit(60);
  if(error){ toast("Erro", error.message); return; }

  const wrap = $("list");
  wrap.innerHTML = (data||[]).map(n => `
    <div class="card">
      <b>${esc(n.title||"Notificação")}</b>
      <div class="p">${esc(n.body||"")}</div>
      ${n.link?`<div class="ctaRow" style="margin-top:12px;"><a class="btn primary" href="${esc(n.link)}">Abrir</a></div>`:""}
      <div class="note">${esc((n.created_at||"").replace("T"," ").slice(0,16))}</div>
    </div>
  `).join("") || `<div class="card"><b>Nenhuma notificação</b><div class="p">Quando seu pedido for aprovado, aparece aqui.</div></div>`;
}

function esc(s){ return String(s||"").replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c])); }

document.addEventListener("DOMContentLoaded", main);
