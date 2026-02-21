export function mountHackerLayer(host){
  if(!host) return;
  host.innerHTML = '';
  host.style.position = 'absolute'; host.style.inset = '0'; host.style.pointerEvents = 'none';
  if(!document.getElementById('cs-rain-kf')){
    const st = document.createElement('style'); st.id = 'cs-rain-kf';
    st.textContent = '@keyframes csRainDrop{from{transform:translateY(-35%);opacity:.0}10%{opacity:.35}90%{opacity:.2}to{transform:translateY(35%);opacity:0}}';
    document.head.appendChild(st);
  }
  for(let i=0;i<26;i++){
    const s = document.createElement('span');
    Object.assign(s.style, {
      position:'absolute', left:`${Math.random()*100}%`, top:'-10%', width:'1px',
      height:`${60 + Math.random()*120}px`, opacity:String(0.12 + Math.random()*0.35),
      background:'linear-gradient(to bottom, transparent, rgba(124,58,237,.95), transparent)',
      filter:'blur(.1px)', animation:`csRainDrop ${4 + Math.random()*4}s linear ${-Math.random()*6}s infinite`
    });
    host.appendChild(s);
  }
}
