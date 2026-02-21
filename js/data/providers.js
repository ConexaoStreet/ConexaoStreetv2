const MAP = {
  vip: "data/providers_vip.json",
  lojista: "data/providers_lojista.json",
  final: "data/providers_final.json"
};

export async function loadProviders(kind){
  const path = MAP[String(kind||"").toLowerCase()];
  if(!path) return [];
  const res = await fetch("./"+path, { cache:"no-store" });
  if(!res.ok) return [];
  const arr = await res.json();
  return Array.isArray(arr) ? arr : [];
}

export function norm(s){
  return String(s||"").normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase().trim();
}

export function filterProviders(items, q){
  const k = norm(q);
  if(!k) return items;
  return items.filter(x => {
    const hay = norm((x.name||"")+" "+(x.category||"")+" "+(x.notes||""));
    return hay.includes(k);
  });
}
