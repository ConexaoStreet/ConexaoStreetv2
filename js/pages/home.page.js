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
    if (src.includes('/lojista.jpg')) img.src = './assets/img/product-lojistas.jpg';
    img.loading = 'lazy';
    img.decoding = 'async';
  });

  document.querySelectorAll('[data-add-cart]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.addCart;
      const card = btn.closest('.productCard');
      const title = card?.querySelector('h3')?.textContent?.trim() || id;
      addToCart({ id, name:title, price:0, qty:1 });
      btn.textContent = 'Adicionado ✓';
      setTimeout(() => btn.textContent = 'Carrinho', 1200);
    });
  });
});
