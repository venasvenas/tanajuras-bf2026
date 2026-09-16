/**
 * BF2026 CRM — Cloudflare Worker
 * Accepts POST {nome, whatsapp, fonte, utm_campaign} and stores in D1 bf2026-leads.
 * Table: leads (id, ts, nome, whatsapp, fonte, utm_campaign, created_at)
 * Created: 2026-09-16 (VIS-3452)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const nome = (body.nome || body.name || '').toString().trim().slice(0, 200);
    const whatsapp = (body.whatsapp || '').toString().replace(/\D/g, '').slice(0, 20);
    const fonte = (body.fonte || 'lp-bf-2026').toString().slice(0, 100);
    const utm_campaign = (body.utm_campaign || '').toString().slice(0, 100);
    const ts = new Date().toISOString();

    if (!nome || !whatsapp) {
      return new Response(JSON.stringify({ error: 'nome and whatsapp required' }), {
        status: 422,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    try {
      await env.DB.prepare(
        'INSERT INTO leads (ts, nome, whatsapp, fonte, utm_campaign) VALUES (?, ?, ?, ?, ?)'
      ).bind(ts, nome, whatsapp, fonte, utm_campaign).run();

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('D1 insert error:', err);
      return new Response(JSON.stringify({ error: 'Storage error' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
  },
};
