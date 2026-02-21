import { applySavedTheme, toggleTheme } from "../ui/theme.js";
import { wireRipples } from "../ui/ripple.js";
import { toast } from "../ui/toast.js";
import { getUser } from "../supabaseClient.js";
import { myApprovals, listOrders } from "../api.js";
import { loadProviders, filterProviders } from "../data/providers.js";
import { enhanceHeader } from "../global-header-cart.js";
import { isAdmin } from "../rbac.js";

function $(id){ return document.getElementById(id); }

async function main(){
  applySavedTheme();
  wireRipples(document);
  const themeBtn = $("themeBtn");
  if(themeBtn) themeBtn.addEventListener("click", (e)=>{ e.preventDefault(); toggleTheme(); });

  try{ await enhanceHeader(); }catch(e){ console.warn("[header]", e); }

  const user = await getUser();
  if(!user){
    toast("Você precisa entrar.", "Faça login para acessar.");
    setTimeout(()=> window.location.href = "./member.html", 650);
    return;
  }

  let approvals = [];
  try{ approvals = await myApprovals(user.id); }catch(e){ console.warn("[approvals]", e); }
  if((!approvals || !approvals.length)) {
    try{
      const orders = await listOrders();
      approvals = (orders||[]).filter(o => {
        const byUser = user?.id && o.user_id && String(o.user_id)===String(user.id);
        const byEmail = user?.email && o.buyer_email && String(o.buyer_email).toLowerCase()===String(user.email).toLowerCase();
        const paid = /aprov|paid|pago/i.test(String(o.payment_status||o.status||""));
        const approved = /aprov|liber/i.test(String(o.order_status||""));
        return (byUser || byEmail) && (paid || approved);
      }).map(o => ({ product_id:o.product_id, product_name:o.product_name, approved:true }));
    }catch(e){ console.warn("[orders fallback]", e); }
  }
  const ids = Array.from(new Set((approvals||[]).map(a => normalizeKind(a.product_id || a.product_name || "")).filter(Boolean)));

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

  if(!tabs || !q) return;
  tabs.innerHTML = ids.map(id => `<button class="tabBtn ${id===current?"on":""}" data-id="${id}">${label(id)}</button>`).join("");
  tabs.querySelectorAll("button").forEach(b => b.addEventListener("click", async ()=>{
    current = b.dataset.id;
    tabs.querySelectorAll("button").forEach(x=>x.classList.toggle("on", x.dataset.id===current));
    await loadAndRender(current, q.value);
  }));

  q.addEventListener("input", ()=>loadAndRender(current, q.value));
  await loadAndRender(current, "");
}

function normalizeKind(id){
  const v = String(id||"").toLowerCase();
  if(!v) return "";
  if(v.includes("vip")) return "vip";
  if(v.includes("loj")) return "lojista";
  if(v.includes("consum") || v.includes("final")) return "final";
  return v;
}

function label(id){
  if(id==="vip") return "VIP";
  if(id==="lojista") return "Lojista";
  if(id==="final") return "Final";
  return id.toUpperCase();
}

async function loadAndRender(kind, query){
  const list = await loadProviders(normalizeKind(kind) || kind);
  const filtered = filterProviders(list, query||"");
  const wrap = $("list");
  if(!wrap) return;
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

document.addEventListener("DOMContentLoaded", async ()=>{
  await main();
  try{
    const u = await getUser();
    const box = document.getElementById("adminBox");
    if(u && box) box.style.display = (await isAdmin(u.id)) ? "block" : "none";
  }catch(e){ console.warn("[adminBox]", e); }
});
