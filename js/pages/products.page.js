import { loadCatalog } from "../data/catalog.js";
import { wireRipples } from "../ui/ripple.js";
import { applySavedTheme, toggleTheme } from "../ui/theme.js";
import { addToCart, cartCount } from "../cart.js";

function $(id){ return document.getElementById(id); }

function money(v){
  const n = Number(v||0);
  return n.toLocaleString("pt-BR",{ style:"currency", currency:"BRL" });
}

async function main(){
  applySavedTheme();
  wireRipples(document);
  const themeBtn = $("themeBtn");
  if(themeBtn) themeBtn.addEventListener("click", (e)=>{ e.preventDefault(); toggleTheme(); });

  const grid = $("productList");
  const q = $("q");
  const cat = await loadCatalog();

  function render(list){
    grid.innerHTML = list.map(p => `
      <div class="pCard">
        <img class="pImg" src="${p.image}" alt="">
        <div class="pBody">
          <h3>${escapeHtml(p.name)}</h3>
          <p>${escapeHtml(p.description||"")}</p>
          <div class="pPrice">
            <span class="priceTag">${money(p.price)}</span>
            <button class="btn" data-cart="${p.id}">+ Carrinho</button>
            <a class="btn primary" href="./checkout.html?id=${encodeURIComponent(p.id)}">Comprar</a>
          </div>
        </div>
      </div>
    `).join("");
  }

  render(cat);

  if(grid){
    grid.addEventListener("click", (e)=>{
      const b = e.target.closest("[data-cart]");
      if(!b) return;
      const id = b.dataset.cart;
      const p = cat.find(x => String(x.id) === String(id));
      if(!p) return;
      addToCart({ id:p.id, name:p.name, price:Number(p.price||0), image:p.image||"" });
      updateCartBadge();
    });
  }
  function updateCartBadge(){
    const el = $("cartCount"); if(el) el.textContent = String(cartCount());
  }
  updateCartBadge();
  window.addEventListener("cs:cart", updateCartBadge);

  if(q){
    q.addEventListener("input", ()=>{
      const k = norm(q.value);
      const filtered = !k ? cat : cat.filter(p => norm(p.name+" "+p.description).includes(k));
      render(filtered);
    });
  }
}

function norm(s){
  return String(s||"").normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase().trim();
}
function escapeHtml(s){
  return String(s||"").replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
}

document.addEventListener("DOMContentLoaded", main);
