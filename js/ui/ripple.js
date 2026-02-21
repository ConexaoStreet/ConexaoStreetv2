export function wireRipples(scope=document){
  scope.querySelectorAll(".btn").forEach(btn=>{
    if(btn.dataset.ripwired) return;
    btn.dataset.ripwired = "1";
    const rip = document.createElement("span");
    rip.className = "rip";
    btn.appendChild(rip);
    btn.addEventListener("click",(e)=>{
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left) + "px";
      const y = (e.clientY - r.top) + "px";
      btn.style.setProperty("--x", x);
      btn.style.setProperty("--y", y);
      btn.classList.remove("rippling");
      void btn.offsetWidth;
      btn.classList.add("rippling");
    }, { passive:true });
  });
}
