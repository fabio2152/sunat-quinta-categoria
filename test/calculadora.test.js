/**
 * calculadora.test.js — FASE 5: PRUEBAS.
 * Runner nativo de Node: `node --test test/` (sin Jest ni Vitest).
 *
 * Contiene:
 *   · un test por cada uno de los 5 casos de prueba del docente,
 *   · tests unitarios de calcularImpuestoAnual (un valor por tramo y los bordes),
 *   · tests unitarios de divisorDelMes, mesesDeducidos y gratificacionDelMes,
 *   · tests de validación de entradas (RNF-05).
 *
 * Tolerancia de comparación: ±0.01.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  calcularEjercicio,
  calcularImpuestoAnual,
  divisorDelMes,
  mesesDeducidos,
  gratificacionDelMes,
  validarEntrada,
} from '../src/calculadora.js';
import { CASOS, buscarCaso } from '../src/casos.js';

const TOLERANCIA = 0.01;

/** Compara dos montos con tolerancia de ±0.01. */
function casiIgual(actual, esperado, mensaje) {
  assert.ok(
    Math.abs(actual - esperado) <= TOLERANCIA,
    `${mensaje}: se esperaba ${esperado} y se obtuvo ${actual}`,
  );
}

/**
 * Verifica la retención total mes a mes.
 * @param {ReturnType<typeof calcularEjercicio>} resultado
 * @param {(number|null)[]} esperados  12 valores; `null` = mes no laborado.
 */
function verificarMeses(resultado, esperados) {
  esperados.forEach((esperado, i) => {
    const fila = resultado.filas[i];
    if (esperado === null) {
      assert.equal(fila.laborado, false, `${fila.nombreMes} debería estar no laborado`);
      return;
    }
    assert.equal(fila.laborado, true, `${fila.nombreMes} debería estar laborado`);
    casiIgual(fila.retencionTotal, esperado, `Retención de ${fila.nombreMes}`);
  });
}

// ===========================================================================
// Casos de prueba del docente
// ===========================================================================

describe('Casos de prueba del docente', () => {
  test('Caso 1 — remuneración baja, no supera 7 UIT: sin retención', () => {
    const resultado = calcularEjercicio(buscarCaso('caso-1').entrada);

    casiIgual(resultado.filas[11].remuneracionBrutaAnual, 14000, 'RBA de diciembre');
    casiIgual(resultado.filas[11].impuestoAnualProyectado, 0, 'Impuesto anual');
    verificarMeses(resultado, Array(12).fill(0));
    casiIgual(resultado.totales.retencion, 0, 'Total retenido');
  });

  test('Caso 2 — retención pareja de S/ 230.00 todo el año', () => {
    const resultado = calcularEjercicio(buscarCaso('caso-2').entrada);

    casiIgual(resultado.filas[0].remuneracionBrutaAnual, 70000, 'RBA de enero');
    casiIgual(resultado.filas[0].rentaNetaAnual, 31500, 'RNA de enero');
    casiIgual(resultado.filas[0].impuestoAnualProyectado, 2760, 'IAP de enero');
    verificarMeses(resultado, Array(12).fill(230));
    casiIgual(resultado.totales.retencion, 2760, 'Total retenido');
  });

  test('Caso 3 — ingreso adicional de S/ 10,000 en junio (PASO 5)', () => {
    const resultado = calcularEjercicio(buscarCaso('caso-3').entrada);

    verificarMeses(resultado, [
      230, 230, 230, 230, 230, 1630, 405, 195, 195, 195, 195, 195,
    ]);

    const junio = resultado.filas[5];
    casiIgual(junio.impuestoAnualProyectado, 2760, 'IAP de junio (sin el adicional)');
    casiIgual(junio.paso5.remuneracionBrutaAnual, 80000, "RBA' de junio");
    casiIgual(junio.paso5.rentaNetaAnual, 41500, "RNA' de junio");
    casiIgual(junio.paso5.impuestoAnualProyectado, 4160, "IAP' de junio");
    casiIgual(junio.retencionAdicional, 1400, 'Retención adicional de junio');

    // Verificaciones intermedias exigidas por la spec.
    const julio = resultado.filas[6];
    casiIgual(julio.impuestoAnualProyectado, 4160, 'IAP de julio (adicional ya percibido)');
    casiIgual(julio.retencionesAcumuladas, 920, 'Retenciones ene–abr deducidas en julio');
    casiIgual(julio.retencionOrdinaria, 405, 'Julio → (4160 − 920) / 8');

    const agosto = resultado.filas[7];
    casiIgual(agosto.retencionesAcumuladas, 3185, 'Retenciones ene–jul deducidas en agosto');
    casiIgual(agosto.retencionOrdinaria, 195, 'Agosto → (4160 − 3185) / 5');

    const diciembre = resultado.filas[11];
    casiIgual(diciembre.retencionesAcumuladas, 3965, 'Retenciones ene–nov deducidas en diciembre');
    casiIgual(diciembre.retencionOrdinaria, 195, 'Diciembre → 4160 − 3965');

    // El total retenido debe igualar el impuesto anual del ejercicio.
    casiIgual(resultado.totales.retencion, 4160, 'Total retenido');
    casiIgual(
      resultado.totales.retencion,
      diciembre.impuestoAnualProyectado,
      'Total retenido = impuesto anual del ejercicio',
    );
  });

  test('Caso 4 — ingresa en setiembre: sin retención', () => {
    const resultado = calcularEjercicio(buscarCaso('caso-4').entrada);

    verificarMeses(resultado, [
      null, null, null, null, null, null, null, null, 0, 0, 0, 0,
    ]);
    casiIgual(resultado.filas[8].remuneracionBrutaAnual, 23333.33, 'RBA de setiembre');
    casiIgual(resultado.filas[11].gratificacion, 3333.33, 'Gratificación de Navidad (4/6)');
    casiIgual(resultado.filas[8].impuestoAnualProyectado, 0, 'IAP');
    casiIgual(resultado.totales.retencion, 0, 'Total retenido');
  });

  test('Caso 5 — ingresa en julio, adicional en noviembre', () => {
    const resultado = calcularEjercicio(buscarCaso('caso-5').entrada);

    verificarMeses(resultado, [
      null, null, null, null, null, null, 0, 0, 0, 0, 520, 0,
    ]);

    const julio = resultado.filas[6];
    casiIgual(julio.gratificacion, 0, 'Gratificación de julio (no laboró ene–jun)');
    casiIgual(julio.remuneracionBrutaAnual, 35000, 'RBA de julio');
    casiIgual(julio.impuestoAnualProyectado, 0, 'IAP de julio');

    const noviembre = resultado.filas[10];
    casiIgual(noviembre.paso5.remuneracionBrutaAnual, 45000, "RBA' de noviembre");
    casiIgual(noviembre.paso5.rentaNetaAnual, 6500, "RNA' de noviembre");
    casiIgual(noviembre.paso5.impuestoAnualProyectado, 520, "IAP' de noviembre");
    casiIgual(noviembre.retencionAdicional, 520, 'Retención adicional de noviembre');

    const diciembre = resultado.filas[11];
    casiIgual(diciembre.gratificacion, 5000, 'Gratificación de Navidad (6/6)');
    casiIgual(diciembre.impuestoAnualProyectado, 520, 'IAP de diciembre');
    casiIgual(diciembre.retencionTotal, 0, 'Retención de diciembre');

    casiIgual(resultado.totales.retencion, 520, 'Total retenido');
  });

  test('Los 5 casos coinciden con el total esperado declarado en casos.js', () => {
    for (const caso of CASOS) {
      const resultado = calcularEjercicio(caso.entrada);
      casiIgual(resultado.totales.retencion, caso.totalEsperado, `Total de ${caso.nombre}`);
    }
  });
});

// ===========================================================================
// Unitarios — PASO 3: calcularImpuestoAnual
// ===========================================================================

describe('calcularImpuestoAnual (tramos marginales, UIT 5,500)', () => {
  test('renta neta 0 → 0', () => {
    casiIgual(calcularImpuestoAnual(0), 0, 'IAP de 0');
  });

  test('renta neta negativa → 0', () => {
    casiIgual(calcularImpuestoAnual(-1000), 0, 'IAP de una renta negativa');
  });

  test('borde del tramo 1: 27,500 → 2,200.00', () => {
    casiIgual(calcularImpuestoAnual(27500), 2200, 'Tramo 1 completo (8%)');
  });

  test('dentro del tramo 1: 10,000 → 800.00', () => {
    casiIgual(calcularImpuestoAnual(10000), 800, 'Tramo 1 parcial');
  });

  test('borde del tramo 2: 110,000 → 13,750.00', () => {
    casiIgual(calcularImpuestoAnual(110000), 2200 + 82500 * 0.14, 'Tramos 1 + 2');
  });

  test('borde del tramo 3: 192,500 → 27,775.00', () => {
    casiIgual(calcularImpuestoAnual(192500), 13750 + 82500 * 0.17, 'Tramos 1 a 3');
  });

  test('borde del tramo 4: 247,500 → 38,775.00', () => {
    casiIgual(calcularImpuestoAnual(247500), 27775 + 55000 * 0.20, 'Tramos 1 a 4');
  });

  test('tramo 5: 347,500 → 68,775.00', () => {
    casiIgual(calcularImpuestoAnual(347500), 38775 + 100000 * 0.30, 'Tramos 1 a 5');
  });

  test('la UIT es parametrizable (RNF-03)', () => {
    // Con UIT = 5,000 el primer tramo llega hasta 25,000.
    casiIgual(calcularImpuestoAnual(25000, 5000), 2000, 'Tramo 1 con UIT 5,000');
  });
});

// ===========================================================================
// Unitarios — PASO 4: divisorDelMes y mesesDeducidos
// ===========================================================================

describe('divisorDelMes', () => {
  test('tabla completa de divisores', () => {
    const esperados = [12, 12, 12, 9, 8, 8, 8, 5, 4, 4, 4, 1];
    esperados.forEach((esperado, i) => {
      assert.equal(divisorDelMes(i + 1), esperado, `Divisor del mes ${i + 1}`);
    });
  });

  test('valores exigidos por la spec', () => {
    assert.equal(divisorDelMes(4), 9);
    assert.equal(divisorDelMes(8), 5);
    assert.equal(divisorDelMes(12), 1);
  });

  test('mes inválido lanza RangeError', () => {
    assert.throws(() => divisorDelMes(0), RangeError);
    assert.throws(() => divisorDelMes(13), RangeError);
  });
});

describe('mesesDeducidos', () => {
  test('tabla completa de meses deducidos', () => {
    const esperados = [0, 0, 0, 3, 4, 4, 4, 7, 8, 8, 8, 11];
    esperados.forEach((esperado, i) => {
      assert.equal(mesesDeducidos(i + 1), esperado, `Meses deducidos del mes ${i + 1}`);
    });
  });
});

// ===========================================================================
// Unitarios — gratificaciones ordinarias
// ===========================================================================

describe('gratificacionDelMes', () => {
  test('meses sin gratificación devuelven 0', () => {
    for (const mes of [1, 2, 3, 4, 5, 6, 8, 9, 10, 11]) {
      casiIgual(gratificacionDelMes(mes, 5000, 1), 0, `Gratificación del mes ${mes}`);
    }
  });

  test('ingreso en enero → julio 6/6 y diciembre 6/6', () => {
    casiIgual(gratificacionDelMes(7, 5000, 1), 5000, 'Grati de julio');
    casiIgual(gratificacionDelMes(12, 5000, 1), 5000, 'Grati de diciembre');
  });

  test('ingreso en setiembre → julio 0 y diciembre 4/6', () => {
    casiIgual(gratificacionDelMes(7, 5000, 9), 0, 'Grati de julio');
    casiIgual(gratificacionDelMes(12, 5000, 9), 3333.33, 'Grati de diciembre');
  });

  test('ingreso en julio → julio 0 y diciembre 6/6', () => {
    casiIgual(gratificacionDelMes(7, 5000, 7), 0, 'Grati de julio');
    casiIgual(gratificacionDelMes(12, 5000, 7), 5000, 'Grati de diciembre');
  });

  test('ingreso en abril → julio 3/6', () => {
    casiIgual(gratificacionDelMes(7, 5000, 4), 2500, 'Grati de julio');
  });
});

// ===========================================================================
// Empleador anterior (RF-04) y diciembre negativo
// ===========================================================================

describe('Empleador anterior y regularización de diciembre', () => {
  test('las retenciones del empleador anterior se deducen del IAP', () => {
    const sinPrevias = calcularEjercicio({ remuneracionMensual: 5000, mesIngreso: 1 });
    const conPrevias = calcularEjercicio({
      remuneracionMensual: 5000,
      mesIngreso: 1,
      retencionesPrevias: 1200,
    });
    // Enero no deduce retenciones previas de meses (divisor 12) pero sí las del
    // empleador anterior: (2760 − 1200) / 12 = 130.
    casiIgual(sinPrevias.filas[0].retencionOrdinaria, 230, 'Enero sin retenciones previas');
    casiIgual(conPrevias.filas[0].retencionOrdinaria, 130, 'Enero con retenciones previas');
  });

  test('las remuneraciones del empleador anterior aumentan la RBA', () => {
    const resultado = calcularEjercicio({
      remuneracionMensual: 5000,
      mesIngreso: 1,
      remuneracionesPrevias: 10000,
    });
    casiIgual(resultado.filas[0].remuneracionBrutaAnual, 80000, 'RBA de enero');
  });

  test('diciembre admite retención negativa (saldo a favor del trabajador)', () => {
    // Retenciones previas exageradas: en diciembre debe salir saldo a favor.
    const resultado = calcularEjercicio({
      remuneracionMensual: 5000,
      mesIngreso: 1,
      retencionesPrevias: 5000,
    });
    assert.ok(resultado.filas[10].retencionTotal >= 0, 'Noviembre no puede ser negativo');
    assert.ok(resultado.filas[11].retencionTotal < 0, 'Diciembre debe ser negativo');
    casiIgual(resultado.resumen.saldoAFavor, 2240, 'Saldo a favor (5000 − 2760)');
  });
});

// ===========================================================================
// Validación de entradas (RNF-05)
// ===========================================================================

describe('validarEntrada (RNF-05)', () => {
  const base = { remuneracionMensual: 5000, mesIngreso: 1 };

  test('acepta una entrada mínima válida', () => {
    assert.doesNotThrow(() => validarEntrada(base));
  });

  test('rechaza remuneración negativa', () => {
    assert.throws(() => validarEntrada({ ...base, remuneracionMensual: -1 }), /remuneración/i);
  });

  test('rechaza mes de ingreso fuera de [1,12]', () => {
    assert.throws(() => validarEntrada({ ...base, mesIngreso: 0 }), /mes de ingreso/i);
    assert.throws(() => validarEntrada({ ...base, mesIngreso: 13 }), /mes de ingreso/i);
  });

  test('rechaza monto adicional negativo', () => {
    assert.throws(
      () => validarEntrada({ ...base, adicionales: [{ mes: 5, monto: -100 }] }),
      /monto/i,
    );
  });

  test('rechaza un adicional anterior al mes de ingreso', () => {
    assert.throws(
      () => validarEntrada({ ...base, mesIngreso: 6, adicionales: [{ mes: 3, monto: 100 }] }),
      /anterior al mes de ingreso/i,
    );
  });

  test('rechaza retenciones previas negativas', () => {
    assert.throws(() => validarEntrada({ ...base, retencionesPrevias: -5 }), /retenciones/i);
  });
});

// ===========================================================================
// Invariantes generales del motor
// ===========================================================================

describe('Invariantes del motor', () => {
  test('siempre devuelve 12 filas, una por mes', () => {
    for (const caso of CASOS) {
      const resultado = calcularEjercicio(caso.entrada);
      assert.equal(resultado.filas.length, 12, `Filas de ${caso.nombre}`);
    }
  });

  test('el neto del mes es el ingreso bruto menos la retención total', () => {
    for (const caso of CASOS) {
      const resultado = calcularEjercicio(caso.entrada);
      for (const fila of resultado.filas) {
        casiIgual(
          fila.neto,
          fila.ingresoBruto - fila.retencionTotal,
          `Neto de ${fila.nombreMes} en ${caso.nombre}`,
        );
      }
    }
  });

  test('el total retenido iguala el impuesto anual proyectado de diciembre', () => {
    for (const caso of CASOS) {
      const resultado = calcularEjercicio(caso.entrada);
      casiIgual(
        resultado.totales.retencion,
        resultado.filas[11].impuestoAnualProyectado,
        `Regularización anual de ${caso.nombre}`,
      );
    }
  });

  test('el motor no muta la entrada recibida', () => {
    const entrada = {
      remuneracionMensual: 5000,
      mesIngreso: 1,
      adicionales: [{ mes: 6, monto: 10000 }],
    };
    const copia = structuredClone(entrada);
    calcularEjercicio(entrada);
    assert.deepEqual(entrada, copia, 'La entrada debe permanecer intacta');
  });
});
