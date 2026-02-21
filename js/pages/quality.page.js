import { applySavedTheme, toggleTheme } from "../ui/theme.js";
import { wireRipples } from "../ui/ripple.js";
import { listQuality } from "../api.js";

function $(id){ return document.getElementById(id); }

async function main(){
  applySavedTheme();
  wireRipples(document);
  const themeBtn = $("themeBtn");
  if(themeBtn) themeBtn.addEventListener("click", (e)=>{ e.preventDefault(); toggleTheme(); });

  const wrap = $("list");
  const posts = await listQuality({ limit: 24 });
  wrap.innerHTML = posts.map(p => `
    <div class="pCard">
      <div class="pBody">
        <div class="pillRow">
          <span class="pill">${p.media_type==="video"?"Vídeo":"Foto"}</span>
          ${p.featured?`<span class="pill">Destaque</span>`:""}
        </div>
        <h3 style="margin-top:10px;">${esc(p.title||"Post")}</h3>
        <p>${esc((p.description||"").slice(0,120))}</p>
        <div class="pPrice" style="margin-top:12px;">
          <a class="btn primary" href="./quality-gallery.html">Ver mais</a>
        </div>
      </div>
    </div>
  `).join("") || `<div class="card"><b>Em breve</b><div class="p">Sem posts publicados ainda.</div></div>`;
}

function esc(s){ return String(s||"").replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c])); }

document.addEventListener("DOMContentLoaded", main);
