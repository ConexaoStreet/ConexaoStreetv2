import { getSessionUser, supa } from '../supabaseClient.js';
import { listOrders } from '../api.js';
import { CONFIG } from '../config.js';
import { isAdmin } from '../rbac.js';
import { initTheme, applyGoldMode } from '../ui/theme.js';

const $ = (id) => document.getElementById(id);

function esc(v){ return String(v ?? '').replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function money(v){ return (Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }

function setHeaderIcons(){
  const themeBtn = $('themeBtn') || $('btnTheme');
  const menuBtn = $('btnMenu');
  const userLink = document.querySelector('a.iconBtn[href*="member.html"], a.iconbtn[href*="member.html"]');
  if(themeBtn && !themeBtn.dataset.iconFixed){ themeBtn.textContent = '☾'; themeBtn.dataset.iconFixed='1'; }
  if(menuBtn && !menuBtn.dataset.iconFixed){
    menuBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>';
    menuBtn.dataset.iconFixed='1';
  }
  if(userLink && !userLink.dataset.iconFixed){
    userLink.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/></svg>';
    userLink.dataset.iconFixed='1';
  }
  const whatsappFab = document.getElementById('fabBtn');
  if(whatsappFab && !whatsappFab.dataset.fixed){
    whatsappFab.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor"><path d="M19.11 17.53c-.27-.14-1.61-.79-1.86-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.17-1.35-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.42.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.44-.46-.61-.47h-.52c-.18 0-.48.07-.73.34-.25.27-.95.93-.95 2.26 0 1.33.97 2.61 1.11 2.79.14.18 1.9 2.9 4.6 4.07.64.28 1.14.45 1.53.58.64.2 1.22.17 1.68.1.51-.08 1.61-.66 1.84-1.3.23-.64.23-1.18.16-1.3-.07-.11-.25-.18-.52-.32z"/><path d="M26.67 5.33A13.21 13.21 0 0016.02 0C8.75 0 2.86 5.9 2.86 13.17c0 2.32.61 4.58 1.77 6.57L2 30.67l11.19-2.94a13.14 13.14 0 006.29 1.6h.01c7.27 0 13.17-5.9 13.17-13.17 0-3.52-1.37-6.83-3.99-9.83zM16.02 27.1h-.01a10.9 10.9 0 01-5.56-1.52l-.4-.24-6.64 1.74 1.77-6.47-.26-.42a10.86 10.86 0 01-1.66-5.82c0-6.02 4.9-10.92 10.92-10.92 2.91 0 5.64 1.13 7.7 3.2 2.05 2.06 3.18 4.79 3.18 7.7 0 6.02-4.9 10.92-10.92 10.92z"/></svg>';
    whatsappFab.dataset.fixed='1';
  }
}

function wireLocalUI(){
  const fab = $('fabBtn'); const fabMenu = $('fabMenu');
  const supp = $('fabSupport'); const grp = $('fabGroup');
  if(supp) supp.href = CONFIG.WHATSAPP_WA + '?text=' + encodeURIComponent('Oi Conexão Street! Preciso de suporte.');
  if(grp) grp.href = CONFIG.GROUP_LINK;
  if(fab && fabMenu && !fab.dataset.wired){
    fab.dataset.wired='1';
    fab.addEventListener('click',(e)=>{ e.preventDefault(); fabMenu.classList.toggle('on'); });
    document.addEventListener('click',(e)=>{ if(e.target===fab || fab.contains(e.target) || fabMenu.contains(e.target)) return; fabMenu.classList.remove('on'); });
  }
  const btnMenu = $('btnMenu'), overlay = $('menuOverlay'), closeBtn = $('menuClose');
  const openMenu = ()=>{ overlay?.classList.add('on'); overlay?.setAttribute('aria-hidden','false'); document.documentElement.style.overflow='hidden'; };
  const closeMenu = ()=>{ overlay?.classList.remove('on'); overlay?.setAttribute('aria-hidden','true'); document.documentElement.style.overflow=''; };
  if(btnMenu && overlay && !btnMenu.dataset.wired){
    btnMenu.dataset.wired='1';
    btnMenu.addEventListener('click',(e)=>{ e.preventDefault(); openMenu(); });
    overlay.addEventListener('click',(e)=>{ if(e.target===overlay) closeMenu(); });
    closeBtn?.addEventListener('click', closeMenu);
    document.addEventListener('keydown',(e)=>{ if(e.key==='Escape') closeMenu(); });
  }
}

function renderLoginBox(){
  const mount = $('memberMount'); if(!mount) return;
  mount.innerHTML = `
    <section class="card" style="margin-top:14px;">
      <b>Entrar para acessar sua área</b>
      <div class="p">Faça login para ver seus pedidos aprovados, histórico e links liberados.</div>
      <div class="ctaRow" style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
        <a class="btn" href="./products.html">Ver planos</a>
        <a class="btn primary" href="./checkout.html">Ir para checkout</a>
      </div>
    </section>`;
}

function renderMember(user, orders, approved){
  const mount = $('memberMount'); if(!mount) return;
  const mine = (orders||[]).filter(o => (o.user_id && user?.id && o.user_id===user.id) || (o.buyer_email && user?.email && String(o.buyer_email).toLowerCase()===String(user.email).toLowerCase()));
  const latest = mine.slice(0,10);
  const approvedRows = (approved||[]).filter(a => a && (a.approved===true || a.approved===1 || a.status==='approved'));

  const accessHtml = approvedRows.length ? approvedRows.map(a => `
    <div class="card" style="margin-top:12px;">
      <b>${esc(a.product_name || a.product_id || 'Acesso liberado')}</b>
      <div class="p">Aprovado ${a.approved_at ? new Date(a.approved_at).toLocaleString('pt-BR') : ''}</div>
      <div class="pillRow" style="margin-top:10px;">
        <span class="pill">✅ Liberado</span>
        ${a.order_id ? `<span class="pill">Pedido ${esc(String(a.order_id).slice(0,8))}</span>` : ''}
      </div>
    </div>`).join('') : `
    <div class="card" style="margin-top:12px;">
      <b>Nenhum acesso liberado ainda</b>
      <div class="p">Quando seu pagamento for aprovado, seus acessos aparecerão aqui.</div>
      <div class="ctaRow" style="margin-top:12px;"><a class="btn primary" href="./products.html">Ver planos</a></div>
    </div>`;

  const ordersHtml = latest.length ? latest.map(o => `
    <tr>
      <td>${esc(o.product_name || o.product_id || '-')}</td>
      <td>${money(o.amount)}</td>
      <td>${esc(o.payment_status || o.status || '-')}</td>
      <td>${esc(o.order_status || '-')}</td>
      <td>${o.created_at ? new Date(o.created_at).toLocaleDateString('pt-BR') : '-'}</td>
    </tr>`).join('') : `<tr><td colspan="5" class="muted">Nenhum pedido encontrado.</td></tr>`;

  mount.innerHTML = `
    <section class="card" style="margin-top:14px;">
      <b>Olá, ${esc(user?.email || 'membro')}</b>
      <div class="p">Essa é sua área de membro. Aqui ficam somente seus acessos e histórico. (Sem catálogo de produtos aqui.)</div>
      <div class="pillRow" style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
        <span class="pill">Pedidos: ${latest.length}</span>
        <span class="pill">Acessos liberados: ${approvedRows.length}</span>
      </div>
    </section>

    <section class="sep" style="margin-top:18px;"><span class="l"></span><span class="t">ACESSOS LIBERADOS</span><span class="l"></span></section>
    ${accessHtml}

    <section class="sep" style="margin-top:18px;"><span class="l"></span><span class="t">SEUS PEDIDOS</span><span class="l"></span></section>
    <section class="card" style="margin-top:12px; overflow:auto;">
      <table class="table">
        <thead><tr><th>Plano</th><th>Valor</th><th>Pagamento</th><th>Pedido</th><th>Data</th></tr></thead>
        <tbody>${ordersHtml}</tbody>
      </table>
      <div class="ctaRow" style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
        <a class="btn" href="./cart.html">Ver carrinho</a>
        <a class="btn primary" href="./products.html">Comprar outro acesso</a>
      </div>
    </section>`;
}

async function listApprovalsForUser(user){
  try{
    const mod = await import('../supabaseClient.js');
    const sb = mod.supa ? mod.supa() : (mod.supabase || supa());
    const keys = [user?.id, user?.email].filter(Boolean).map(String);
    if(!keys.length) return [];
    let out=[];
    for(const k of keys){
      const { data } = await sb.from('cs_approvals').select('*').eq('user_key', k);
      if(Array.isArray(data)) out.push(...data);
    }
    const seen = new Set();
    return out.filter(x => { const k = x.order_id || JSON.stringify(x); if(seen.has(k)) return false; seen.add(k); return true; });
  }catch(e){
    console.warn('approvals load fail', e);
    return [];
  }
}

async function boot(){
  try{
    initTheme();
    wireLocalUI();
    setHeaderIcons();

    const user = await getSessionUser();
    const adminBox = $('adminBox');
    if(adminBox && user) adminBox.style.display = (await isAdmin(user.id)) ? 'block' : 'none';

    if(!user){ renderLoginBox(); return; }

    const [orders, approvals] = await Promise.all([
      listOrders().catch(e => { console.warn(e); return []; }),
      listApprovalsForUser(user)
    ]);

    const isVipApproved = approvals.some(a => String(a.product_id||a.product_name||'').toLowerCase().includes('vip'));
    if (typeof applyGoldMode === 'function') applyGoldMode(Boolean(isVipApproved || (await isAdmin(user.id))));
    setHeaderIcons();
    renderMember(user, orders, approvals);
  }catch(err){
    console.error('member boot error', err);
    const mount = $('memberMount');
    if(mount){
      mount.innerHTML = `<section class="card" style="margin-top:14px;"><b>Erro ao carregar a área do membro</b><div class="p">${esc(err?.message || err)}</div><div class="ctaRow" style="margin-top:12px;"><a class="btn" href="./products.html">Ver planos</a></div></section>`;
    }
  }
}

document.addEventListener('DOMContentLoaded', boot);
