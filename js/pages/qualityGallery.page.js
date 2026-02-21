import { applySavedTheme, toggleTheme } from "../ui/theme.js";
import { wireRipples } from "../ui/ripple.js";
import { listQuality } from "../api.js";
import { openModal, closeModal } from "../ui/modal.js";

function $(id){ return document.getElementById(id); }

async function main(){
  applySavedTheme();
  wireRipples(document);
  const themeBtn = $("themeBtn");
  if(themeBtn) themeBtn.addEventListener("click", (e)=>{ e.preventDefault(); toggleTheme(); });

  const filter = $("type");
  const grid = $("grid");

  async function load(){
    const t = filter.value || "";
    const items = await listQuality({ limit: 60, type: t || null });
    grid.innerHTML = items.map(x => tile(x)).join("") || `<div class="card"><b>Sem posts ainda</b><div class="p">Quando publicar, vai aparecer aqui.</div></div>`;
    grid.querySelectorAll("[data-open]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = btn.dataset.open;
        const item = items.find(i => String(i.id)===String(id));
        if(!item) return;
        const html = `<div class="p">${esc(item.description||"")}</div>`;
        openModal(item.title||"Detalhes", html);
      });
    });
  }

  filter.addEventListener("change", load);
  await load();

  const back = $("modalBack");
  const x = $("modalClose");
  if(back) back.addEventListener("click",(e)=>{ if(e.target===back) closeModal(); });
  if(x) x.addEventListener("click", closeModal);
  document.addEventListener("keydown",(e)=>{ if(e.key==="Escape") closeModal(); });
}

function tile(x){
  const type = x.media_type==="video" ? "Vídeo" : "Foto";
  return `
    <div class="pCard">
      <div class="pBody">
        <div class="pillRow">
          <span class="pill">${type}</span>
          ${x.featured?`<span class="pill">Destaque</span>`:""}
        </div>
        <h3 style="margin-top:10px;">${esc(x.title||"Post")}</h3>
        <p>${esc((x.description||"").slice(0,120))}</p>
        <div class="pPrice" style="margin-top:12px;">
          <button class="btn primary" data-open="${esc(x.id)}">Abrir</button>
        </div>
      </div>
    </div>
  `;
}
function esc(s){ return String(s||"").replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c])); }

document.addEventListener("DOMContentLoaded", main);
