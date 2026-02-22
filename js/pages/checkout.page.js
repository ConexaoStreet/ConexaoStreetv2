import { loadCatalog, getProductById } from '../data/catalog.js';
import { createOrder } from '../api.js';
import { getCart, clearCart } from '../cart.js';
import { getUser, supabase } from '../supabaseClient.js';
import { CONFIG } from '../config.js';

const $ = (id) => document.getElementById(id);
const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value ?? '';
}

function setValue(id, value) {
  const el = $(id);
  if (el) el.value = value ?? '';
}

function ok(msg) {
  const el = $('checkoutMsg');
  if (el) {
    el.textContent = msg;
    el.className = 'ok';
  } else {
    alert(msg);
  }
}

function err(msg) {
  const el = $('checkoutMsg');
  if (el) {
    el.textContent = msg;
    el.className = 'err';
  } else {
    alert(msg);
  }
}

function getCfg(...keys) {
  for (const k of keys) {
    if (CONFIG && CONFIG[k] != null && CONFIG[k] !== '') return CONFIG[k];
  }
  return '';
}

function fillPixAndLinks(product) {
  // Chaves compatíveis com versões diferentes do config.js
  const pixKey =
    getCfg('PIX_KEY', 'PIX_COPY_PASTE', 'PAYMENT_PIX_KEY', 'PAY_PIX_KEY') ||
    '';
  const pixReceiver =
    getCfg('PIX_RECEIVER', 'PAYMENT_PIX_RECEIVER', 'RECEBEDOR_PIX') || '';
  const pixBank =
    getCfg('PIX_BANK', 'PAYMENT_PIX_BANK', 'BANCO_PIX') || '';

  setText('pixKey', pixKey);
  setText('pixReceiver', pixReceiver);
  setText('pixBank', pixBank);

  const waBtn = $('waBtn');
  const groupBtn = $('groupBtn');

  const waBase =
    getCfg('WHATSAPP_WA', 'WHATSAPP_LINK', 'SUPPORT_WHATSAPP', 'WA_LINK') || '';
  const groupLink = getCfg('GROUP_LINK', 'WHATSAPP_GROUP', 'GROUP_WHATSAPP') || '';

  if (waBtn && waBase) {
    const productName = product?.name || 'plano';
    const productPrice = brl(product?.price || 0);
    const txt = `Oi! Comprei/estou finalizando o plano "${productName}" (${productPrice}). Vou enviar o comprovante.`;
    waBtn.href = `${waBase}${String(waBase).includes('?') ? '&' : '?'}text=${encodeURIComponent(txt)}`;
    waBtn.setAttribute('target', '_blank');
    waBtn.setAttribute('rel', 'noopener noreferrer');
  }

  if (groupBtn && groupLink) {
    groupBtn.href = groupLink;
    groupBtn.setAttribute('target', '_blank');
    groupBtn.setAttribute('rel', 'noopener noreferrer');
  }
}

function resolveCheckoutEls() {
  return {
    // Layout antigo
    coTitle: $('coTitle'),
    coPrice: $('coPrice'),
    checkoutForm: $('checkoutForm'),

    // Layout novo
    pName: $('pName'),
    pDesc: $('pDesc'),
    pPrice: $('pPrice'),
    email: $('email'),
    name: $('name'),
    phone: $('phone'),
    proof: $('proof'),
    notes: $('notes'),
    loginBtn: $('loginBtn'),
    buyBtn: $('buyBtn'),
  };
}

function applyProductInfo({ cartMode, cartRows, product, products, els }) {
  const totalItems = cartRows.reduce((s, r) => s + Math.max(1, Number(r.qty || 1)), 0);

  const totalCart = cartRows.reduce((s, r) => {
    const p = products.find((x) => String(x.id) === String(r.id));
    return s + Number(p?.price || 0) * Math.max(1, Number(r.qty || 1));
  }, 0);

  const title = cartMode
    ? `Checkout (${totalItems} itens)`
    : (product?.name || 'Plano');

  const priceText = cartMode && cartRows.length
    ? brl(totalCart)
    : brl(product?.price || 0);

  // Layout antigo
  if (els.coTitle) els.coTitle.textContent = title;
  if (els.coPrice) els.coPrice.textContent = priceText;

  // Layout novo
  if (els.pName) els.pName.textContent = cartMode ? 'Carrinho' : (product?.name || 'Plano');
  if (els.pDesc) {
    if (cartMode && cartRows.length) {
      els.pDesc.textContent = `${totalItems} item(ns) no carrinho. Pagamento via Pix. Liberação após aprovação.`;
    } else {
      els.pDesc.textContent = product?.description || product?.desc || 'Pagamento via Pix. Liberação após aprovação.';
    }
  }
  if (els.pPrice) els.pPrice.textContent = priceText;
}

async function sendMagicLink(email) {
  if (!email) throw new Error('Informe seu e-mail');

  if (!supabase || !supabase.auth) {
    throw new Error('Supabase não inicializado');
  }

  // Redireciona para member (ajuste se seu fluxo usa outra rota)
  const redirectTo = new URL('./member.html', window.location.href).toString();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo }
  });

  if (error) throw error;
  ok('Link de login enviado para seu e-mail.');
}

function buildPayloadFromNewLayout(u, productOrItem, fields) {
  return {
    user_id: u.id,
    buyer_name: fields.name || null,
    buyer_email: fields.email || u.email || null,
    buyer_phone: fields.phone || null,
    currency: 'BRL',
    payment_status: 'PENDENTE',
    order_status: 'CRIADO',
    provider: 'manual',
    note: String(fields.proof || ''),
    notes: String(fields.notes || ''),
    product_id: productOrItem.id,
    product_name: productOrItem.name,
    amount: Number(productOrItem.price || 0),
  };
}

async function createOrdersFlow({ cartMode, cartRows, product, products, fields }) {
  const u = await getUser();

  if (!u) {
    localStorage.setItem('cs_after_login', location.pathname + location.search);
    location.href = './member.html';
    return { redirected: true };
  }

  const baseFields = {
    email: fields.email || u.email || '',
    name: fields.name || '',
    phone: fields.phone || '',
    proof: fields.proof || '',
    notes: fields.notes || ''
  };

  if (cartMode && cartRows.length) {
    const created = [];

    for (const row of cartRows) {
      const p = products.find((x) => String(x.id) === String(row.id));
      if (!p) continue;

      const qty = Math.max(1, Number(row.qty || 1));
      for (let i = 0; i < qty; i++) {
        const payload = buildPayloadFromNewLayout(u, p, baseFields);
        const order = await createOrder(payload);
        created.push(order);
      }
    }

    if (!created.length) throw new Error('Carrinho vazio');

    localStorage.setItem('cs_last_order_id', String(created[created.length - 1]?.id || ''));
    clearCart();
    window.dispatchEvent(new Event('cs:cart-changed'));
    window.dispatchEvent(new Event('cs_cart_changed'));
    ok(`${created.length} pedido(s) criados. Pagamento em análise.`);
    return { redirected: false };
  }

  if (!product) throw new Error('Plano não encontrado');

  const order = await createOrder(buildPayloadFromNewLayout(u, product, baseFields));
  localStorage.setItem('cs_last_order_id', String(order?.id || ''));
  ok(`Pedido #${String(order?.id || '').slice(0, 8)} criado. Pagamento em análise.`);
  return { redirected: false };
}

(async function init() {
  try {
    const url = new URL(location.href);
    const cartMode = url.searchParams.get('cart') === '1';
    const id = url.searchParams.get('id') || 'vip';

    const products = await loadCatalog();
    const product = getProductById(id, products) || products[0] || null;
    const cartRows = cartMode ? (getCart() || []) : [];
    const els = resolveCheckoutEls();

    applyProductInfo({ cartMode, cartRows, product, products, els });
    fillPixAndLinks(product);

    // Pré-preenche e-mail se estiver logado
    try {
      const u = await getUser();
      if (u?.email) setValue('email', u.email);
    } catch (e) {
      console.warn('[checkout] getUser preload failed', e);
    }

    // ===== Login por link (layout novo)
    if (els.loginBtn) {
      els.loginBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = String(els.email?.value || '').trim();

        const oldTxt = els.loginBtn.textContent;
        try {
          els.loginBtn.disabled = true;
          els.loginBtn.textContent = 'Enviando...';
          await sendMagicLink(email);
        } catch (e2) {
          console.error(e2);
          err(e2?.message || 'Erro ao enviar link de login');
        } finally {
          els.loginBtn.disabled = false;
          els.loginBtn.textContent = oldTxt || 'Enviar link de login';
        }
      });
    }

    // ===== Layout antigo (form)
    if (els.checkoutForm) {
      els.checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fd = new FormData(els.checkoutForm);
        const fields = {
          email: String(fd.get('buyer_email') || ''),
          name: String(fd.get('buyer_name') || ''),
          phone: String(fd.get('buyer_phone') || ''),
          proof: String(fd.get('proof') || ''),
          notes: String(fd.get('notes') || '')
        };

        try {
          const result = await createOrdersFlow({ cartMode, cartRows, product, products, fields });
          if (result.redirected) return;
          els.checkoutForm.reset();
          setTimeout(() => { location.href = './member.html'; }, 900);
        } catch (ex) {
          console.error(ex);
          err(ex?.message || 'Erro ao criar pedido');
        }
      });
      return;
    }

    // ===== Layout novo (sem form, botões separados)
    if (els.buyBtn) {
      els.buyBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const fields = {
          email: String(els.email?.value || '').trim(),
          name: String(els.name?.value || '').trim(),
          phone: String(els.phone?.value || '').trim(),
          proof: String(els.proof?.value || '').trim(),
          notes: String(els.notes?.value || '').trim()
        };

        try {
          const oldTxt = els.buyBtn.textContent;
          els.buyBtn.disabled = true;
          els.buyBtn.textContent = 'Criando...';

          const result = await createOrdersFlow({ cartMode, cartRows, product, products, fields });
          if (result.redirected) return;

          // reset visual (layout novo)
          if (els.name) els.name.value = '';
          if (els.phone) els.phone.value = '';
          if (els.proof) els.proof.value = '';
          if (els.notes) els.notes.value = '';

          ok('Pedido criado. Pagamento em análise.');
          setTimeout(() => { location.href = './member.html'; }, 900);

          els.buyBtn.textContent = oldTxt || 'Criar pedido';
          els.buyBtn.disabled = false;
        } catch (ex) {
          console.error(ex);
          err(ex?.message || 'Erro ao criar pedido');
          if (els.buyBtn) {
            els.buyBtn.disabled = false;
            els.buyBtn.textContent = 'Criar pedido';
          }
        }
      });
    }

  } catch (e) {
    console.error('checkout init error', e);
    err(e?.message || 'Erro ao carregar checkout');
  }
})();
