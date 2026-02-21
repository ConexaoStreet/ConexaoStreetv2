import { applySavedTheme, toggleTheme } from "../ui/theme.js";
import { wireRipples } from "../ui/ripple.js";
import { toast } from "../ui/toast.js";
import { getUser } from "../supabaseClient.js";
import { myApprovals } from "../api.js";
import { loadProviders, filterProviders } from "../data/providers.js";

function $(id){ return document.getElementById(id); }

async function main(){
  applySavedTheme();
  wireRipples(document);
  const themeBtn = $("themeBtn");
  if(themeBtn) themeBtn.addEventListener("click", (e)=>{ e.preventDefault(); toggleTheme(); });

  const user = await getUser();
  if(!user){
    toast("Você precisa entrar.", "Faça login para acessar.");
    setTimeout(()=> window.location.href = "./member.html", 650);
    return;
  }

  let approvals = [];
  try{ approvals = await myApprovals(user.id); }catch{}
  const ids = Array.from(new Set((approvals||[]).map(a => String(a.product_id||"").toLowerCase())));

  if(!ids.length){
    $("locked").classList.remove("hidden");
    $("content").classList.add("hidden");
    return;
  }

  $("locked").classList.add("hidden");
  $("content").classList.remove("hidden");

  // build tabs
  const tabs = $("tabs");
  const q = $("q");
  let current = ids[0];

  tabs.innerHTML = ids.map(id => `<button class="tabBtn ${id===current?"on":""}" data-id="${id}">${label(id)}</button>`).join("");
  tabs.querySelectorAll("button").forEach(b => b.addEventListener("click", async ()=>{
    current = b.dataset.id;
    tabs.querySelectorAll("button").forEach(x=>x.classList.toggle("on", x.dataset.id===current));
    await loadAndRender(current, q.value);
  }));

  q.addEventListener("input", ()=>loadAndRender(current, q.value));
  await loadAndRender(current, "");
}

function label(id){
  if(id==="vip") return "VIP";
  if(id==="lojista") return "Lojista";
  if(id==="final") return "Final";
  return id.toUpperCase();
}

async function loadAndRender(kind, query){
  const list = await loadProviders(kind);
  const filtered = filterProviders(list, query||"");
  const wrap = $("list");
  wrap.innerHTML = filtered.map(item => card(item)).join("") || `<div class="card"><b>Nenhum resultado</b><div class="p">Tente outra busca.</div></div>`;
  wrap.querySelectorAll("[data-wa]").forEach(a=>{
    a.addEventListener("click",(e)=>{
      // let anchor open
    });
  });
}

function card(x){
  const name = esc(x.name||"Fornecedor");
  const cat = esc(x.category||"");
  const notes = esc(x.notes||"");
  const wa = x.waid ? `https://wa.me/${encodeURIComponent(String(x.waid).replace(/\D/g,""))}` : (x.whatsapp ? x.whatsapp : "#");
  return `
    <div class="card">
      <b>${name}</b>
      ${cat?`<div class="p">${cat}</div>`:""}
      ${notes?`<div class="p">${notes}</div>`:""}
      <div class="ctaRow" style="margin-top:12px;">
        <a class="btn primary" data-wa="1" target="_blank" rel="noopener" href="${wa}">Abrir WhatsApp</a>
      </div>
    </div>
  `;
}

function esc(s){
  return String(s||"").replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
}

document.addEventListener("DOMContentLoaded", main);
