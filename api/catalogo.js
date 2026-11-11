'use strict';
// Public catalogue only. No client-controlled upstream URL or private sheet access.
const CATALOG_URL = 'https://script.google.com/macros/s/AKfycbz69itknRSxj3X-uCuDj1CIao8bqM9GpSgLMPvpXl3CHVPPDBdy0fdkzX9E7gJiDWfeDQ/exec?action=catalogo';

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({error: 'Método no permitido.'});
  }
  try {
    const upstream = await fetch(CATALOG_URL, {
      redirect: 'follow', signal: AbortSignal.timeout(15000),
      headers: {Accept: 'application/json'}
    });
    if (!upstream.ok) throw new Error('Catalogue unavailable');
    const data = await upstream.json();
    if (data.schemaVersion !== 1 || data.currency !== 'CLP' || !Array.isArray(data.products)) throw new Error('Invalid catalogue');
    const ids = new Set(), skus = new Set();
    const products = data.products.map(p => {
      if (!p || !/^[a-z0-9][a-z0-9-]*$/.test(p.id) || !/^[A-Z0-9_]+$/.test(p.sku) ||
          ids.has(p.id) || skus.has(p.sku) || typeof p.name !== 'string' || !p.name.trim() ||
          !Number.isSafeInteger(p.price) || p.price <= 0 || typeof p.active !== 'boolean' ||
          typeof p.category !== 'string' || !p.category || typeof p.unit !== 'string' || !p.unit ||
          typeof p.description !== 'string' || !Number.isFinite(p.order) ||
          !Number.isSafeInteger(p.unitsPerSale) || p.unitsPerSale < 1) throw new Error('Invalid product');
      ids.add(p.id); skus.add(p.sku);
      return {id:p.id, sku:p.sku, name:p.name, price:p.price, active:p.active,
        category:p.category, unit:p.unit, description:p.description, order:p.order, unitsPerSale:p.unitsPerSale};
    });
    // Every page reload reads Sheets; never serve old prices after an upstream error.
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).json({schemaVersion:1, currency:'CLP', products});
  } catch (_) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({error:'No pudimos cargar el menú. Reintenta o consulta por WhatsApp.'});
  }
};
