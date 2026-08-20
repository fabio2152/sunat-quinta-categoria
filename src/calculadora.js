/**
 * calculadora.js — MOTOR DE CÁLCULO PURO.
 *
 * Reglas: cero acceso al DOM, cero efectos secundarios, todas las funciones puras.
 * Así el motor se puede ejecutar y testear con `node --test` (FASE 5).
 *
 * Implementa el procedimiento de retención mensual de quinta categoría en 5 PASOS:
 *   PASO 1 — Remuneración Bruta Anual proyectada (RBA)
 *   PASO 2 — Renta Neta Anual (RNA = RBA − 7 UIT)
 *   PASO 3 — Impuesto Anual Proyectado (IAP, tramos marginales)
 *   PASO 4 — Retención ordinaria del mes: (IAP − retenciones acumuladas) / divisor
 *   PASO 5 — Retención adicional por ingresos extraordinarios del propio mes
 *
 * Fuente: https://orientacion.sunat.gob.pe/3071-02-calculo-del-impuesto
 */

import {
  UIT as UIT_DEFAULT,
  DEDUCCION_FIJA_UIT,
  MESES,
  TRAMOS,
  DIVISORES,
  MESES_DEDUCIDOS,
  MESES_GRATIFICACION,
  INCLUIR_BONIFICACION_EXTRAORDINARIA,
  TASA_BONIFICACION_EXTRAORDINARIA,
} from './config.js';

/**
 * @typedef {Object} Adicional
 * @property {number} mes     Mes (1..12) en que el ingreso se pone a disposición.
 * @property {number} monto   Monto bruto del ingreso adicional.
 * @property {string} [concepto]
 */

/**
 * @typedef {Object} Entrada
 * @property {number} remuneracionMensual
 * @property {number} mesIngreso                 // 1..12
 * @property {Adicional[]} [adicionales]
 * @property {number} [remuneracionesPrevias]    // otro empleador, mismo ejercicio
 * @property {number} [retencionesPrevias]       // otro empleador, mismo ejercicio
 * @property {number} [uit]                      // default config.UIT
 * @property {boolean} [incluirBonificacionExtraordinaria]
 */

/**
 * @typedef {Object} FilaMes
 * @property {number} mes
 * @property {string} nombreMes
 * @property {boolean} laborado
 * @property {number} remuneracion
 * @property {number} gratificacion
 * @property {number} adicional
 * @property {number} ingresoBruto
 * @property {number} remuneracionBrutaAnual   // PASO 1
 * @property {number} rentaNetaAnual           // PASO 2
 * @property {number} impuestoAnualProyectado  // PASO 3
 * @property {number} retencionesAcumuladas
 * @property {number} divisor
 * @property {number} retencionOrdinaria       // PASO 4
 * @property {number} retencionAdicional       // PASO 5
 * @property {number} retencionTotal
 * @property {number} neto
 */

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/**
 * §2.4 Redondeo: se calcula internamente con precisión completa y se redondea a
 * 2 decimales solo al acumular y al mostrar.
 * @param {number} x
 * @returns {number}
 */
export function redondear2(x) {
  return Math.round(x * 100) / 100;
}

// ---------------------------------------------------------------------------
// PASO 3 — Impuesto anual por tramos marginales
// ---------------------------------------------------------------------------

/**
 * Aplica la escala progresiva acumulativa a la Renta Neta Anual.
 * Se recorre tramo por tramo aplicando la tasa solo a la porción que cae en él
 * (tramos marginales), nunca una tasa plana sobre el total.
 *
 * @param {number} rentaNeta  Renta Neta Anual en soles.
 * @param {number} [uit]      UIT vigente (por defecto la del ejercicio configurado).
 * @returns {number} Impuesto anual, sin redondear.
 */
export function calcularImpuestoAnual(rentaNeta, uit = UIT_DEFAULT) {
  if (!(rentaNeta > 0)) return 0;

  let impuesto = 0;
  let inferior = 0; // límite inferior del tramo, en soles

  for (const tramo of TRAMOS) {
    if (rentaNeta <= inferior) break;
    const superior = tramo.limiteUIT === Infinity ? Infinity : tramo.limiteUIT * uit;
    const baseDelTramo = Math.min(rentaNeta, superior) - inferior;
    impuesto += baseDelTramo * tramo.tasa;
    inferior = superior;
  }

  return impuesto;
}

// ---------------------------------------------------------------------------
// PASO 4 — Divisor y meses deducidos
// ---------------------------------------------------------------------------

/**
 * Divisor de la retención ordinaria del mes.
 * Ene–Mar: 12 · Abr: 9 · May–Jul: 8 · Ago: 5 · Set–Nov: 4 · Dic: 1.
 * @param {number} mes 1..12
 * @returns {number}
 */
export function divisorDelMes(mes) {
  const divisor = DIVISORES[mes];
  if (divisor === undefined) throw new RangeError(`Mes inválido: ${mes}`);
  return divisor;
}

/**
 * Último mes cuyas retenciones ya efectuadas se deducen del IAP del mes dado.
 * Devuelve 0 cuando no se deduce ninguna (enero–marzo).
 * @param {number} mes 1..12
 * @returns {number}
 */
export function mesesDeducidos(mes) {
  const hasta = MESES_DEDUCIDOS[mes];
  if (hasta === undefined) throw new RangeError(`Mes inválido: ${mes}`);
  return hasta;
}

// ---------------------------------------------------------------------------
// Gratificaciones ordinarias (§2.2)
// ---------------------------------------------------------------------------

/**
 * Gratificación ordinaria del mes: Fiestas Patrias (julio) y Navidad (diciembre).
 * Monto = remuneración × (meses completos laborados del semestre / 6).
 * Semestre de julio = enero–junio · Semestre de diciembre = julio–diciembre.
 *
 * @param {number} mes            Mes evaluado (1..12).
 * @param {number} remuneracion   Remuneración mensual bruta.
 * @param {number} mesIngreso     Mes de ingreso al trabajo (1..12).
 * @returns {number} Gratificación del mes (0 si el mes no es de gratificación).
 */
export function gratificacionDelMes(mes, remuneracion, mesIngreso) {
  if (!MESES_GRATIFICACION.includes(mes)) return 0;

  // Semestre al que corresponde la gratificación.
  const inicioSemestre = mes === 7 ? 1 : 7;
  const finSemestre = mes === 7 ? 6 : 12;

  // Meses del semestre efectivamente laborados: se cuentan desde el mes de ingreso.
  const desde = Math.max(inicioSemestre, mesIngreso);
  const mesesLaborados = Math.max(0, finSemestre - desde + 1);

  return remuneracion * (mesesLaborados / 6);
}

// ---------------------------------------------------------------------------
// Validación de entradas (RNF-05)
// ---------------------------------------------------------------------------

/**
 * Valida la entrada del motor. Lanza `Error` con mensaje en español si es inválida.
 * @param {Entrada} entrada
 */
export function validarEntrada(entrada) {
  if (entrada === null || typeof entrada !== 'object') {
    throw new Error('La entrada debe ser un objeto.');
  }

  const { remuneracionMensual, mesIngreso } = entrada;

  if (!Number.isFinite(remuneracionMensual) || remuneracionMensual < 0) {
    throw new Error('La remuneración mensual debe ser un número mayor o igual a 0.');
  }
  if (!Number.isInteger(mesIngreso) || mesIngreso < 1 || mesIngreso > 12) {
    throw new Error('El mes de ingreso debe ser un entero entre 1 y 12.');
  }

  const previas = entrada.remuneracionesPrevias ?? 0;
  const retenciones = entrada.retencionesPrevias ?? 0;
  if (!Number.isFinite(previas) || previas < 0) {
    throw new Error('Las remuneraciones del empleador anterior deben ser mayores o iguales a 0.');
  }
  if (!Number.isFinite(retenciones) || retenciones < 0) {
    throw new Error('Las retenciones del empleador anterior deben ser mayores o iguales a 0.');
  }

  const uit = entrada.uit ?? UIT_DEFAULT;
  if (!Number.isFinite(uit) || uit <= 0) {
    throw new Error('La UIT debe ser un número mayor a 0.');
  }

  const adicionales = entrada.adicionales ?? [];
  if (!Array.isArray(adicionales)) {
    throw new Error('Los ingresos adicionales deben ser una lista.');
  }
  for (const [i, adicional] of adicionales.entries()) {
    const fila = i + 1;
    if (adicional === null || typeof adicional !== 'object') {
      throw new Error(`Ingreso adicional ${fila}: formato inválido.`);
    }
    if (!Number.isInteger(adicional.mes) || adicional.mes < 1 || adicional.mes > 12) {
      throw new Error(`Ingreso adicional ${fila}: el mes debe ser un entero entre 1 y 12.`);
    }
    if (!Number.isFinite(adicional.monto) || adicional.monto < 0) {
      throw new Error(`Ingreso adicional ${fila}: el monto debe ser mayor o igual a 0.`);
    }
    if (adicional.mes < mesIngreso) {
      throw new Error(
        `Ingreso adicional ${fila}: el mes (${MESES[adicional.mes - 1]}) no puede ser `
        + `anterior al mes de ingreso (${MESES[mesIngreso - 1]}).`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Motor principal
// ---------------------------------------------------------------------------

/**
 * Calcula la retención mensual de quinta categoría para todo el ejercicio.
 *
 * @param {Entrada} entrada
 * @returns {{filas: FilaMes[], totales: {ingresoBruto:number, retencion:number, neto:number}, uit:number}}
 */
export function calcularEjercicio(entrada) {
  validarEntrada(entrada);

  const remuneracion = entrada.remuneracionMensual;
  const mesIngreso = entrada.mesIngreso;
  const adicionales = entrada.adicionales ?? [];
  const remuneracionesPrevias = entrada.remuneracionesPrevias ?? 0;
  const retencionesPrevias = entrada.retencionesPrevias ?? 0;
  const uit = entrada.uit ?? UIT_DEFAULT;
  const conBonificacion = entrada.incluirBonificacionExtraordinaria
    ?? INCLUIR_BONIFICACION_EXTRAORDINARIA;
  const deduccionFija = DEDUCCION_FIJA_UIT * uit;

  // Monto adicional puesto a disposición en cada mes (índice 1..12).
  const adicionalPorMes = Array.from({ length: 13 }, () => 0);
  for (const adicional of adicionales) adicionalPorMes[adicional.mes] += adicional.monto;

  // Gratificación de cada mes (más bonificación extraordinaria si está activa).
  const gratificacionPorMes = Array.from({ length: 13 }, (_, mes) => {
    if (mes === 0) return 0;
    const grati = gratificacionDelMes(mes, remuneracion, mesIngreso);
    return conBonificacion ? grati * (1 + TASA_BONIFICACION_EXTRAORDINARIA) : grati;
  });

  // PASO 1 — gratificaciones de todo el ejercicio: percibidas y por percibir.
  const gratificacionesDelEjercicio = gratificacionPorMes.reduce((a, b) => a + b, 0);

  // Retención efectuada en cada mes (ordinaria + adicional), insumo del PASO 4.
  const retencionPorMes = Array.from({ length: 13 }, () => 0);

  /** @type {FilaMes[]} */
  const filas = [];

  for (let mes = 1; mes <= 12; mes++) {
    const laborado = mes >= mesIngreso;

    if (!laborado) {
      // Los meses anteriores al ingreso no generan remuneración ni retención.
      filas.push(filaVacia(mes));
      continue;
    }

    const gratificacion = gratificacionPorMes[mes];
    const adicionalDelMes = adicionalPorMes[mes];

    // ---------------------------------------------------------------------
    // PASO 1 — Remuneración Bruta Anual proyectada.
    // El ingreso adicional del PROPIO mes NO entra aquí: se trata en el PASO 5.
    // ---------------------------------------------------------------------
    const mesesPorPercibir = 12 - mes + 1;      // remuneraciones de mes..diciembre
    const mesesYaPercibidos = mes - mesIngreso;  // remuneraciones de mesIngreso..mes-1
    let adicionalesAnteriores = 0;
    for (let m = 1; m < mes; m++) adicionalesAnteriores += adicionalPorMes[m];

    const rba = remuneracion * mesesPorPercibir
      + remuneracion * mesesYaPercibidos
      + gratificacionesDelEjercicio
      + adicionalesAnteriores
      + remuneracionesPrevias;

    // PASO 2 — Renta Neta Anual.
    const rna = Math.max(0, rba - deduccionFija);

    // PASO 3 — Impuesto Anual Proyectado.
    const iap = calcularImpuestoAnual(rna, uit);

    // ---------------------------------------------------------------------
    // PASO 4 — Retención ordinaria del mes.
    // Se deducen las retenciones ya efectuadas hasta el mes que indica la tabla,
    // incluidas las del empleador anterior (RF-04).
    // ---------------------------------------------------------------------
    const hasta = mesesDeducidos(mes);
    let acumuladas = retencionesPrevias;
    for (let m = 1; m <= hasta; m++) acumuladas += retencionPorMes[m];

    const divisor = divisorDelMes(mes);
    let retencionOrdinaria = (iap - acumuladas) / divisor;
    // Negativos se truncan a 0, salvo en diciembre (regularización → saldo a favor).
    if (mes !== 12 && retencionOrdinaria < 0) retencionOrdinaria = 0;
    retencionOrdinaria = redondear2(retencionOrdinaria);

    // ---------------------------------------------------------------------
    // PASO 5 — Retención adicional, solo si en el mes hay un ingreso adicional.
    // ---------------------------------------------------------------------
    let retencionAdicional = 0;
    let paso5 = null;
    if (adicionalDelMes > 0) {
      const rbaPrima = rba + adicionalDelMes;
      const rnaPrima = Math.max(0, rbaPrima - deduccionFija);
      const iapPrima = calcularImpuestoAnual(rnaPrima, uit);
      retencionAdicional = redondear2(Math.max(0, iapPrima - iap));
      // Detalle didáctico del PASO 5 (RF-09).
      paso5 = {
        remuneracionBrutaAnual: redondear2(rbaPrima),
        rentaNetaAnual: redondear2(rnaPrima),
        impuestoAnualProyectado: redondear2(iapPrima),
      };
    }

    const retencionTotal = redondear2(retencionOrdinaria + retencionAdicional);
    retencionPorMes[mes] = retencionTotal;

    const ingresoBruto = redondear2(remuneracion + gratificacion + adicionalDelMes);

    filas.push({
      mes,
      nombreMes: MESES[mes - 1],
      laborado: true,
      remuneracion: redondear2(remuneracion),
      gratificacion: redondear2(gratificacion),
      adicional: redondear2(adicionalDelMes),
      ingresoBruto,
      remuneracionBrutaAnual: redondear2(rba),
      rentaNetaAnual: redondear2(rna),
      impuestoAnualProyectado: redondear2(iap),
      retencionesAcumuladas: redondear2(acumuladas),
      divisor,
      retencionOrdinaria,
      retencionAdicional,
      retencionTotal,
      neto: redondear2(ingresoBruto - retencionTotal),
      paso5,
    });
  }

  const totales = filas.reduce(
    (acc, fila) => ({
      ingresoBruto: redondear2(acc.ingresoBruto + fila.ingresoBruto),
      retencion: redondear2(acc.retencion + fila.retencionTotal),
      neto: redondear2(acc.neto + fila.neto),
    }),
    { ingresoBruto: 0, retencion: 0, neto: 0 },
  );

  // Resumen anual: se toma la proyección de diciembre, la definitiva del ejercicio.
  const diciembre = filas[11];

  return {
    filas,
    totales,
    uit,
    deduccionFija: redondear2(deduccionFija),
    resumen: {
      remuneracionBrutaAnual: diciembre.remuneracionBrutaAnual,
      rentaNetaAnual: diciembre.rentaNetaAnual,
      impuestoAnualProyectado: diciembre.impuestoAnualProyectado,
      totalRetenido: totales.retencion,
      netoAnual: totales.neto,
      saldoAFavor: diciembre.retencionTotal < 0 ? redondear2(-diciembre.retencionTotal) : 0,
    },
  };
}

/** Fila de un mes no laborado: se muestra atenuada con "—" en la UI. */
function filaVacia(mes) {
  return {
    mes,
    nombreMes: MESES[mes - 1],
    laborado: false,
    remuneracion: 0,
    gratificacion: 0,
    adicional: 0,
    ingresoBruto: 0,
    remuneracionBrutaAnual: 0,
    rentaNetaAnual: 0,
    impuestoAnualProyectado: 0,
    retencionesAcumuladas: 0,
    divisor: divisorDelMes(mes),
    retencionOrdinaria: 0,
    retencionAdicional: 0,
    retencionTotal: 0,
    neto: 0,
    paso5: null,
  };
}
