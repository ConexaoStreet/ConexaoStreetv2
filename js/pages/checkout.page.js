import { loadCatalog, getProductById } from '../data/catalog.js';
import { createOrder } from '../api.js';
import { getCart, clearCart } from '../cart.js';
import { getUser } from '../supabaseClient.js';

const $ = (id)=>document.getElementById(id);
const brl = (v)=> Number(v||0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
const ok = (msg)=>{ const el=$('checkoutMsg'); if(el){ el.textContent = msg; el.className = 'ok'; } else alert(msg); };
const err = (msg)=>{ const el=$('checkoutMsg'); if(el){ el.textContent = msg; el.className = 'err'; } else alert(msg); };

(async function init(){
  try{
    const url = new URL(location.href);
    const cartMode = url.searchParams.get('cart') === '1';
    const id = url.searchParams.get('id') || 'vip';
    const products = await loadCatalog();
    const product = getProductById(id, products) || products[0] || null;
    const cartRows = cartMode ? getCart() : [];

    const heroTitle = $('coTitle');
    const heroPrice = $('coPrice');
    if (heroTitle) heroTitle.textContent = cartMode ? `Checkout (${cartRows.reduce((s,r)=>s+Math.max(1,Number(r.qty||1)),0)} itens)` : (product?.name || 'Checkout');
    if (heroPrice) {
      if (cartMode && cartRows.length) {
        const total = cartRows.reduce((s,r)=>{
          const p = products.find(x=>String(x.id)===String(r.id));
          return s + (Number(p?.price||0)*Math.max(1,Number(r.qty||1)));
        },0);
        heroPrice.textContent = brl(total);
      } else {
        heroPrice.textContent = brl(product?.price || 0);
      }
    }

    const form = $('checkoutForm');
    if(!form) return;

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const u = await getUser();
      if(!u){
        localStorage.setItem('cs_after_login', location.pathname + location.search);
        location.href = './member.html';
        return;
      }

      const fd = new FormData(form);
      const basePayload = {
        user_id: u.id,
        buyer_name: fd.get('buyer_name'),
        buyer_email: fd.get('buyer_email') || u.email || null,
        buyer_phone: fd.get('buyer_phone'),
        currency: 'BRL',
        payment_status: 'PENDENTE',
        order_status: 'CRIADO',
        provider: 'manual',
        notes: String(fd.get('notes') || '')
      };

      try {
        if (cartMode && cartRows.length) {
          const created=[];
          for (const row of cartRows){
            const p = products.find(x=>String(x.id)===String(row.id));
            if(!p) continue;
            const qty = Math.max(1, Number(row.qty||1));
            for (let i=0;i<qty;i++) created.push(await createOrder({ ...basePayload, product_id:p.id, product_name:p.name, amount:Number(p.price||0) }));
          }
          if(!created.length) throw new Error('Carrinho vazio');
          localStorage.setItem('cs_last_order_id', String(created[created.length-1].id));
          clearCart();
          window.dispatchEvent(new Event('cs:cart-changed'));
          ok(`${created.length} pedido(s) criados. Pagamento em análise.`);
        } else {
          if(!product) throw new Error('Plano não encontrado');
          const order = await createOrder({ ...basePayload, product_id:product.id, product_name:product.name, amount:Number(product.price||0) });
          localStorage.setItem('cs_last_order_id', String(order.id));
          ok(`Pedido #${String(order.id).slice(0,8)} criado. Pagamento em análise.`);
        }
        form.reset();
        setTimeout(()=> location.href = './member.html', 900);
      } catch(e){
        console.error(e);
        err(e?.message || 'Erro ao criar pedido');
      }
    });
  }catch(e){
    console.error('checkout init error', e);
    err(e?.message || 'Erro ao carregar checkout');
  }
})();
