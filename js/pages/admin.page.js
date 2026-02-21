import { listOrders, markOrderPaid, approveOrder } from '../api.js';

const moneyBRL = (v) => Number(v||0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m] || m));
const statusOf = (o) => String(o.payment_status || o.order_status || o.status || 'PENDENTE');
const amountOf = (o) => (typeof o.amount === 'number' ? o.amount : (typeof o.amount_cents === 'number' ? o.amount_cents/100 : Number(o.amount || 0)));

async function render(){
  const tbodyPay = document.querySelector('#payTable tbody');
  const tbodyAp = document.querySelector('#approvalTable tbody');
  if(!tbodyPay || !tbodyAp) return;
  let rows = [];
  try{ rows = await listOrders(); }catch(e){ console.error(e); alert(`Erro.\n${e?.message || e}`); return; }

  tbodyPay.innerHTML = '';
  tbodyAp.innerHTML = '';

  rows.forEach((o) => {
    const id = o.id;
    const status = statusOf(o);
    const date = String(o.created_at || '').slice(0,10);
    const email = o.buyer_email || o.email || '—';
    const plan = o.product_name || o.product_id || o.plan || '—';
    const val = amountOf(o);

    const tr1 = document.createElement('tr');
    tr1.innerHTML = `<td>${esc(email)}</td><td>${esc(status)}</td><td>${esc(moneyBRL(val || 0))}</td><td>${esc(o.provider_ref || o.comprovante_url || '–')}</td><td><button class="btn ghost" data-pay="${esc(id)}">Marcar pago</button></td>`;
    tbodyPay.appendChild(tr1);

    const tr2 = document.createElement('tr');
    tr2.innerHTML = `<td>${esc(plan)}</td><td>${esc(email)}</td><td>${esc(status)}</td><td>${esc(date)}</td><td><button class="btn primary" data-ap="${esc(id)}">Aprovar</button></td>`;
    tbodyAp.appendChild(tr2);
  });

  tbodyPay.querySelectorAll('[data-pay]').forEach((btn) => btn.addEventListener('click', async () => {
    btn.disabled = true; try{ await markOrderPaid(btn.dataset.pay); await render(); } catch(e){ console.error(e); alert(`Erro.\n${e?.message || e}`); btn.disabled = false; }
  }));
  tbodyAp.querySelectorAll('[data-ap]').forEach((btn) => btn.addEventListener('click', async () => {
    btn.disabled = true; try{ await approveOrder(btn.dataset.ap); await render(); } catch(e){ console.error(e); alert(`Erro.\n${e?.message || e}`); btn.disabled = false; }
  }));
}

document.addEventListener('DOMContentLoaded', render);
