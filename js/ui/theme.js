const KEY = 'cs_theme';
const THEMES = ['dark','light','gold'];
const ICON = { dark:'☾', light:'☀', gold:'★' };

export function applyTheme(theme){
  const safe = THEMES.includes(theme) ? theme : 'dark';
  document.documentElement.setAttribute('data-theme', safe);
  try { localStorage.setItem(KEY, safe); } catch {}
  const btn = document.getElementById('btnTheme');
  if(btn){ btn.textContent = ICON[safe]; btn.setAttribute('aria-label', `Tema: ${safe}`); }
  return safe;
}
export function initTheme(){ let t='dark'; try{ t = localStorage.getItem(KEY) || 'dark'; }catch{} return applyTheme(t); }
export function cycleTheme(){ const cur = document.documentElement.getAttribute('data-theme') || 'dark'; const i = THEMES.indexOf(cur); return applyTheme(THEMES[(i+1)%THEMES.length]); }
