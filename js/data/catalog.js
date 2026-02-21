export async function loadCatalog(){
  const res = await fetch("./products.json", { cache:"no-store" });
  if(!res.ok) return [];
  const arr = await res.json();
  return Array.isArray(arr) ? arr : [];
}

export function findProduct(catalog, id){
  const k = String(id||"").toLowerCase();
  return catalog.find(p => String(p.id||"").toLowerCase() === k) || null;
}
