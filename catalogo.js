'use strict';
// Los productos se editan en la pestaña Catalogo de la hoja madre.
window.LA_NANCY_CATALOG_READY = fetch('/api/catalogo', {
  cache: 'no-store', headers: {Accept:'application/json'},
  signal: AbortSignal.timeout(20000)
}).then(async response => {
  if (!response.ok) throw new Error('No pudimos cargar el menú.');
  const data = await response.json();
  if (data.schemaVersion !== 1 || data.currency !== 'CLP' || !Array.isArray(data.products)) {
    throw new Error('No pudimos cargar el menú.');
  }
  window.LA_NANCY_CATALOG = data;
  return data;
});
