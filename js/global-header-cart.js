import { getCount } from "./cart.js";
import { getUser } from "./auth.js";
import { isAdmin } from "./rbac.js";

function ensureCartBtn(){
  const right = document.querySelector('.head-actions');
  if(!right) return;
  let btn = document.getElementById('globalCartBtn');
  if(!btn){
    btn = document.createElement('a');
    btn.id = 'globalCartBtn';
    btn.className = 'iconBtn';
    btn.href = './cart.html';
    btn.setAttribute('aria-label','Carrinho');
    btn.innerHTML = '<span class="material-symbols-rounded">shopping_cart</span><span class="cartBadge" id="globalCartBadge">0</span>';
    right.appendChild(btn);
  }
  const badge = btn.querySelector('#globalCartBadge');
  if(badge){
    const c = getCount();
    badge.textContent = String(c);
    badge.hidden = c <= 0;
  }
}

export async function enhanceHeader(){
  ensureCartBtn();
  window.addEventListener('storage', (e)=>{ if(!e.key || e.key==='cs_cart') ensureCartBtn(); });
  window.addEventListener('cs:cart-changed', ensureCartBtn);

  const menuAdmin = document.getElementById('miAdmin');
  const menuAdminP = document.getElementById('miAdminP');
  const headerAdmin = document.getElementById('headerAdminBtn');
  try{
    const u = await getUser();
    const adm = !!(u && await isAdmin(u.id));
    [menuAdmin, menuAdminP, headerAdmin].forEach(n=>{ if(n) n.style.display = adm ? '' : 'none'; });
  }catch{
    [menuAdmin, menuAdminP, headerAdmin].forEach(n=>{ if(n) n.style.display = 'none'; });
  }

  const fab = document.getElementById('fabBtn');
  if(fab){
    const href = fab.getAttribute('href') || fab.dataset.href || '';
    const wa = href.includes('wa.me') ? href : 'https://wa.me/5583999999999';
    fab.setAttribute('href', wa);
    fab.setAttribute('target','_blank');
    fab.setAttribute('rel','noopener');
    fab.style.pointerEvents = 'auto';
    fab.addEventListener('click', (e)=>{ e.stopPropagation(); }, {passive:true});
  }
}


export function wireHeaderInteractions(){
  const btnMenu = document.getElementById('btnMenu');
  const menu = document.getElementById('sideMenu');
  const btnClose = document.getElementById('menuClose');
  const backdrop = document.getElementById('menuBackdrop');
  const fabBtn = document.getElementById('fabBtn');
  const fabMenu = document.getElementById('fabMenu');
  const fabSupport = document.getElementById('fabSupport');
  const fabGroup = document.getElementById('fabGroup');
  const btnTheme = document.getElementById('btnTheme');

  const open = ()=>{ menu?.classList.add('open'); backdrop?.classList.add('show'); document.body.classList.add('menu-open'); };
  const close = ()=>{ menu?.classList.remove('open'); backdrop?.classList.remove('show'); document.body.classList.remove('menu-open'); };

  if (btnMenu && !btnMenu.dataset.bound){ btnMenu.dataset.bound='1'; btnMenu.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); (menu?.classList.contains('open') ? close() : open()); }); }
  if (btnClose && !btnClose.dataset.bound){ btnClose.dataset.bound='1'; btnClose.addEventListener('click', (e)=>{ e.preventDefault(); close(); }); }
  if (backdrop && !backdrop.dataset.bound){ backdrop.dataset.bound='1'; backdrop.addEventListener('click', close); }

  if (btnTheme && !btnTheme.dataset.bound){ btnTheme.dataset.bound='1'; btnTheme.addEventListener('click', async (e)=>{ e.preventDefault(); try{ const m = await import('./ui/theme.js'); (m.cycleTheme || m.initTheme)?.(); }catch(err){ console.warn('[theme]', err); } }); }

  if (fabSupport && !fabSupport.getAttribute('href')) fabSupport.setAttribute('href', 'https://wa.me/5583996596364');
  if (fabGroup && !fabGroup.getAttribute('href')) fabGroup.setAttribute('href', 'https://chat.whatsapp.com/');
  if (fabBtn && fabMenu && !fabBtn.dataset.bound){ fabBtn.dataset.bound='1'; fabBtn.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); fabMenu.classList.toggle('on'); fabMenu.setAttribute('aria-hidden', fabMenu.classList.contains('on') ? 'false':'true'); }); }
  if (fabBtn && fabMenu && !document.body.dataset.fabOutside){ document.body.dataset.fabOutside='1'; document.addEventListener('click', (e)=>{ if(fabBtn.contains(e.target) || fabMenu.contains(e.target)) return; fabMenu.classList.remove('on'); fabMenu.setAttribute('aria-hidden','true'); }); }
}
function userIconSvg(){
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/></svg>';
}
function menuIconSvg(){
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>';
}
function cartIconSvg(){
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1"/><circle cx="20" cy="20" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';
}

