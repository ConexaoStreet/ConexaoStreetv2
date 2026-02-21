const KEY = 'cs_cart_v1';

export function getCart(){
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
export function saveCart(items){
  localStorage.setItem(KEY, JSON.stringify(items || []));
  window.dispatchEvent(new CustomEvent('cs:cart')); 
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
