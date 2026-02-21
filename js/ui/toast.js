const WRAP_ID = "toastWrap";

function ensureWrap(){
  let w = document.getElementById(WRAP_ID);
  if(w) return w;
  w = document.createElement("div");
  w.id = WRAP_ID;
  w.className = "toastWrap";
  document.body.appendChild(w);
  return w;
}

export function toast(title, body="", ms=3800){
  const w = ensureWrap();
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<b>${escapeHtml(title)}</b>${body?`<small>${escapeHtml(body)}</small>`:""}`;
  w.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateY(-6px)"; }, ms-250);
  setTimeout(() => { el.remove(); }, ms);
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
}
