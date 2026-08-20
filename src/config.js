/**
 * config.js — Parámetros normativos del ejercicio gravable.
 *
 * RNF-03: cambiar de ejercicio (UIT, tramos) NO debe requerir tocar la lógica del motor.
 * Fuente: https://orientacion.sunat.gob.pe/3071-02-calculo-del-impuesto
 *         UIT 2026 = S/ 5,500.00 (D.S. N° 301-2025-EF)
 */

/** Ejercicio gravable al que corresponden estos parámetros. */
export const EJERCICIO = 2026;

/** Unidad Impositiva Tributaria vigente (S/). */
export const UIT = 5500;

/** Deducción fija de quinta categoría, expresada en UIT (art. 46 LIR). */
export const DEDUCCION_FIJA_UIT = 7;

/** Nombres de los meses, índice 0 = enero. */
export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** Abreviaturas para la tabla mensual. */
export const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic',
];

/**
 * Tramos del impuesto a la renta de trabajo, progresivo acumulativo sobre la
 * Renta Neta Anual. `limiteUIT` es el límite SUPERIOR del tramo, en UIT.
 * Se aplican por tramos marginales, nunca como tasa plana.
 */
export const TRAMOS = [
  { limiteUIT: 5, tasa: 0.08 },   // hasta 5 UIT
  { limiteUIT: 20, tasa: 0.14 },  // más de 5 hasta 20 UIT
  { limiteUIT: 35, tasa: 0.17 },  // más de 20 hasta 35 UIT
  { limiteUIT: 45, tasa: 0.20 },  // más de 35 hasta 45 UIT
  { limiteUIT: Infinity, tasa: 0.30 }, // más de 45 UIT
];

/** Meses en que se percibe gratificación ordinaria (7 = julio, 12 = diciembre). */
export const MESES_GRATIFICACION = [7, 12];

/**
 * Bonificación extraordinaria de la Ley 30334 (9% de la gratificación).
 * Desactivada por defecto (supuesto 3). Si se activa, ese 9% se suma como
 * ingreso gravado del mes de la gratificación.
 */
export const INCLUIR_BONIFICACION_EXTRAORDINARIA = false;

/** Tasa de la bonificación extraordinaria (Ley 30334). */
export const TASA_BONIFICACION_EXTRAORDINARIA = 0.09;

/**
 * PASO 4 — Divisor de la retención ordinaria, por mes (índice 1..12).
 * Enero–Marzo: 12 · Abril: 9 · Mayo–Julio: 8 · Agosto: 5 · Set–Nov: 4 · Diciembre: 1.
 */
export const DIVISORES = {
  1: 12, 2: 12, 3: 12, 4: 9, 5: 8, 6: 8,
  7: 8, 8: 5, 9: 4, 10: 4, 11: 4, 12: 1,
};

/**
 * PASO 4 — Último mes cuyas retenciones se deducen del Impuesto Anual Proyectado.
 * 0 significa "no se deduce ninguna retención previa".
 */
export const MESES_DEDUCIDOS = {
  1: 0, 2: 0, 3: 0, 4: 3, 5: 4, 6: 4,
  7: 4, 8: 7, 9: 8, 10: 8, 11: 8, 12: 11,
};

/** URL de la fuente normativa usada para el procedimiento de cálculo. */
export const FUENTE_SUNAT = 'https://orientacion.sunat.gob.pe/3071-02-calculo-del-impuesto';
