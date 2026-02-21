import { supabase } from './supabaseClient.js';

function mapOrderRow(r={}){
  return {
    id: r.id,
    created_at: r.created_at,
    buyer_name: r.buyer_name || '',
    buyer_email: r.buyer_email || '',
    buyer_phone: r.buyer_phone || '',
    product_id: r.product_id || '',
    product_name: r.product_name || '',
    amount: Number(r.amount ?? (r.amount_cents ? r.amount_cents/100 : 0)) || 0,
    amount_cents: Number(r.amount_cents ?? 0) || 0,
    currency: r.currency || 'BRL',
    payment_status: r.payment_status || r.status || 'PENDENTE',
    order_status: r.order_status || 'CRIADO',
    status: r.status || r.payment_status || 'PENDENTE',
    provider_ref: r.provider_ref || '',
    note: r.note || '',
    notes: r.notes || '',
    raw: r.raw || {},
    user_id: r.user_id || null,
    approved_at: r.approved_at || null,
    approved_by: r.approved_by || null,
  };
}

export async function listOrders(){
  const { data, error } = await supabase
    .from('cs_orders')
    .select('*')
    .order('created_at', { ascending:false });
  if(error) throw error;
  return (data || []).map(mapOrderRow);
}

export async function createOrder(payload){
  const clean = {
    buyer_name: payload?.buyer_name || null,
    buyer_email: payload?.buyer_email || null,
    buyer_phone: payload?.buyer_phone || null,
    product_id: payload?.product_id || null,
    product_name: payload?.product_name || null,
    amount: payload?.amount ?? null,
    amount_cents: payload?.amount_cents ?? null,
    currency: payload?.currency || 'BRL',
    payment_status: payload?.payment_status || 'PENDENTE',
    order_status: payload?.order_status || 'CRIADO',
    status: payload?.status || payload?.payment_status || 'PENDENTE',
    payment_provider: payload?.payment_provider || 'PIX',
    provider_ref: payload?.provider_ref || null,
    note: payload?.note || null,
    raw: payload?.raw || {},
    user_id: payload?.user_id || null,
  };
  const { data, error } = await supabase.from('cs_orders').insert(clean).select('*').single();
  if(error) throw error;
  return mapOrderRow(data);
}

export async function markOrderPaid(orderId, { provider_ref='', note='' } = {}){
  const patch = {
    payment_status: 'PAGO',
    status: 'paid',
    provider_ref: provider_ref || null,
    note: note || null,
    paid_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('cs_orders')
    .update(patch)
    .eq('id', orderId)
    .select('*')
    .single();
  if(error) throw error;
  return mapOrderRow(data);
}

export async function approveOrder(orderId, note=''){
  const { data: order, error: e1 } = await supabase
    .from('cs_orders')
    .select('*')
    .eq('id', orderId)
    .single();
  if(e1) throw e1;

  const userKey = order.user_id || order.buyer_email || order.buyer_phone || null;
  const up = {
    order_id: order.id,
    user_key: String(userKey || ''),
    approved: true,
    approved_at: new Date().toISOString(),
    note: note || null,
    product_id: order.product_id || null,
    product_name: order.product_name || null,
    buyer_email: order.buyer_email || null,
  };

  const { error: e2 } = await supabase.from('cs_approvals').upsert(up, { onConflict: 'order_id' });
  if(e2) throw e2;

  const { data, error: e3 } = await supabase
    .from('cs_orders')
    .update({ order_status:'APROVADO', approved_at: up.approved_at, note: note || order.note || null })
    .eq('id', orderId)
    .select('*')
    .single();
  if(e3) throw e3;
  return mapOrderRow(data);
}

export async function revokeApproval(orderId, note=''){
  const { error: e1 } = await supabase.from('cs_approvals').delete().eq('order_id', orderId);
  if(e1) throw e1;
  const { data, error: e2 } = await supabase
    .from('cs_orders')
    .update({ order_status:'PENDENTE_APROVACAO', note: note || null, approved_at: null })
    .eq('id', orderId)
    .select('*')
    .single();
  if(e2) throw e2;
  return mapOrderRow(data);
}

export async function listApprovalsByUserKey(userKey){
  if(!userKey) return [];
  const { data, error } = await supabase.from('cs_approvals').select('*').eq('user_key', String(userKey));
  if(error) throw error;
  return data || [];
}


// Compat aliases for legacy pages
export async function myApprovals(userKey){
  return await listApprovalsByUserKey(userKey);
}

export async function listQuality(opts = {}){
  const limit = Math.max(1, Number(opts.limit || 24));
  let q = supabase.from('cs_quality_posts').select('*').order('created_at', { ascending:false }).limit(limit);
  if (opts.type) q = q.eq('type', opts.type);
  const { data, error } = await q;
  if (error) {
    const msg = String(error.message || '').toLowerCase();
    if (msg.includes('relation') || String(error.code || '') === '42P01') return [];
    throw error;
  }
  return data || [];
}
