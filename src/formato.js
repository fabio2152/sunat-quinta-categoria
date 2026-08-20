/**
 * formato.js — Formateo de montos para la vista (RF-11).
 * Puro: no toca el DOM.
 */

const FORMATO_SOLES = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const FORMATO_PORCENTAJE = new Intl.NumberFormat('es-PE', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Formatea un monto en soles: `S/ 1,234.56`. Los negativos salen como `-S/ 1,234.56`.
 * @param {number} monto
 * @returns {string}
 */
export function formatearSoles(monto) {
  if (!Number.isFinite(monto)) return '—';
  const signo = monto < 0 ? '-' : '';
  return `${signo}S/ ${FORMATO_SOLES.format(Math.abs(monto))}`;
}

/**
 * Formatea una tasa expresada como fracción: `0.14` → `14%`.
 * @param {number} tasa
 * @returns {string}
 */
export function formatearPorcentaje(tasa) {
  if (!Number.isFinite(tasa)) return '—';
  return FORMATO_PORCENTAJE.format(tasa);
}

/**
 * Convierte el valor de un `<input type="number">` a número, tolerando vacío.
 * @param {string} valor
 * @param {number} [porDefecto]
 * @returns {number}
 */
export function aNumero(valor, porDefecto = 0) {
  if (valor === null || valor === undefined || String(valor).trim() === '') return porDefecto;
  const n = Number(valor);
  return Number.isFinite(n) ? n : NaN;
}
