export function openModal(title, html){
  const back = document.getElementById("modalBack");
  const box = document.getElementById("modalBox");
  const t = document.getElementById("modalTitle");
  const b = document.getElementById("modalBody");
  if(!back || !box || !t || !b) return;
  t.textContent = title || "Detalhes";
  b.innerHTML = html || "";
  back.classList.add("on");
  back.setAttribute("aria-hidden","false");
  document.documentElement.style.overflow="hidden";
}

export function closeModal(){
  const back = document.getElementById("modalBack");
  if(!back) return;
  back.classList.remove("on");
  back.setAttribute("aria-hidden","true");
  document.documentElement.style.overflow="";
}
