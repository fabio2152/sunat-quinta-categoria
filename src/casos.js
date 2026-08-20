/**
 * casos.js — Los 5 casos de prueba del docente (RF-10).
 *
 * Se usan tanto desde la UI (botón / `<select>` que rellena el formulario) como
 * desde `test/calculadora.test.js`, para que no haya dos fuentes de verdad.
 */

/** @type {{id:string, nombre:string, descripcion:string, entrada:import('./calculadora.js').Entrada, totalEsperado:number}[]} */
export const CASOS = [
  {
    id: 'caso-1',
    nombre: 'Caso 1 — Remuneración baja, no supera 7 UIT',
    descripcion: 'S/ 1,000 mensuales desde enero. RBA = 14,000 ≤ 38,500 → impuesto anual 0.',
    entrada: {
      remuneracionMensual: 1000,
      mesIngreso: 1,
      adicionales: [],
      remuneracionesPrevias: 0,
      retencionesPrevias: 0,
    },
    totalEsperado: 0,
  },
  {
    id: 'caso-2',
    nombre: 'Caso 2 — Retención pareja todo el año',
    descripcion: 'S/ 5,000 mensuales desde enero. IAP = 2,760.00 → S/ 230.00 cada mes.',
    entrada: {
      remuneracionMensual: 5000,
      mesIngreso: 1,
      adicionales: [],
      remuneracionesPrevias: 0,
      retencionesPrevias: 0,
    },
    totalEsperado: 2760,
  },
  {
    id: 'caso-3',
    nombre: 'Caso 3 — Ingreso adicional en junio (PASO 5)',
    descripcion: 'S/ 5,000 mensuales desde enero + bono de S/ 10,000 en junio.',
    entrada: {
      remuneracionMensual: 5000,
      mesIngreso: 1,
      adicionales: [{ mes: 6, monto: 10000, concepto: 'Bonificación extraordinaria' }],
      remuneracionesPrevias: 0,
      retencionesPrevias: 0,
    },
    totalEsperado: 4160,
  },
  {
    id: 'caso-4',
    nombre: 'Caso 4 — Ingresa en setiembre',
    descripcion: 'S/ 5,000 mensuales desde setiembre. RBA = 23,333.33 ≤ 38,500 → IAP 0.',
    entrada: {
      remuneracionMensual: 5000,
      mesIngreso: 9,
      adicionales: [],
      remuneracionesPrevias: 0,
      retencionesPrevias: 0,
    },
    totalEsperado: 0,
  },
  {
    id: 'caso-5',
    nombre: 'Caso 5 — Ingresa en julio, adicional en noviembre',
    descripcion: 'S/ 5,000 mensuales desde julio + utilidades de S/ 10,000 en noviembre.',
    entrada: {
      remuneracionMensual: 5000,
      mesIngreso: 7,
      adicionales: [{ mes: 11, monto: 10000, concepto: 'Utilidades' }],
      remuneracionesPrevias: 0,
      retencionesPrevias: 0,
    },
    totalEsperado: 520,
  },
];

/**
 * Busca un caso por su id.
 * @param {string} id
 * @returns {(typeof CASOS)[number] | undefined}
 */
export function buscarCaso(id) {
  return CASOS.find((caso) => caso.id === id);
}
