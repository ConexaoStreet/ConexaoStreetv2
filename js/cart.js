const KEY = 'cs_cart_v1';
const LEGACY_KEY = 'cs_cart';

export function getCart(){
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
export function saveCart(items){
  const data = JSON.stringify(items || []);
  localStorage.setItem(KEY, data);
  try { localStorage.setItem(LEGACY_KEY, data); } catch {}
  window.dispatchEvent(new CustomEvent('cs:cart'));
  window.dispatchEvent(new CustomEvent('cs:cart-changed'));
}
export function cartCount(){
  return getCart().reduce((n,i)=> n + Number(i.qty || 1), 0);
}
export function addToCart(item){
  const cart = getCart();
  const id = String(item.id || '');
  const idx = cart.findIndex(x => String(x.id) === id);
  if (idx >= 0) cart[idx].qty = Number(cart[idx].qty || 1) + 1;
  else cart.push({ ...item, qty: 1 });
  saveCart(cart);
}
export function setCartQty(id, qty){
  qty = Math.max(1, Number(qty || 1));
  saveCart(getCart().map(i => String(i.id)===String(id) ? ({...i, qty}) : i));
}
export function removeFromCart(id){
  saveCart(getCart().filter(i => String(i.id)!==String(id)));
}
export function clearCart(){ saveCart([]); }


// Compat alias (legacy header)
export function getCount(){ return cartCount(); }
