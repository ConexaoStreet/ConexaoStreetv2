import { addToCart } from '../cart.js';
import { mountHackerLayer } from '../ui/hackerBg.js';

document.addEventListener('DOMContentLoaded', () => {
  try {
    const host = document.getElementById('heroHackerBg');
    const mascot = document.getElementById('heroMascot');
    if (host && mascot) mountHackerLayer(host, { anchor: mascot });
  } catch (e) { console.warn('[hackerBg]', e); }

  document.querySelectorAll('.salesGrid .productCard img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (src.includes('/vip.jpg')) img.src = './assets/img/product-vip.jpg';
    if (src.includes('/final.jpg')) img.src = './assets/img/product-final.jpg';
    if (src.includes('/lojista.jpg')) img.src = './assets/img/product-lojista.jpg';
    img.loading = 'lazy';
    img.decoding = 'async';
  });

  document.querySelectorAll('[data-add-cart], [data-product-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.addCart || btn.dataset.productId;
      const card = btn.closest('.productCard');
      const title = card?.querySelector('h3')?.textContent?.trim() || id;
      let price = Number(btn.dataset.price || 0);
      try {
        if (!price) {
          const mod = await import('../data/catalog.js');
          const cat = await mod.loadCatalog();
          const p = cat.find(x => String(x.id) === String(id));
          if (p) price = Number(p.price || 0);
        }
      } catch (e) { console.warn('[catalog]', e); }
      addToCart({ id, name: title, price, qty: 1 });
      btn.textContent = 'Adicionado ✓';
      setTimeout(() => btn.textContent = (btn.classList.contains('ghost') ? 'Carrinho' : '+ Carrinho'), 1200);
      window.dispatchEvent(new Event('cs:cart-changed'));
    });
  });
});
