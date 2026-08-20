/**
 * ui.js — Capa de presentación: lee el formulario, invoca el motor y pinta resultados.
 *
 * Toda la lógica tributaria vive en `calculadora.js`; aquí solo hay DOM.
 * Sin localStorage y sin llamadas de red (RNF-01).
 */

import { calcularEjercicio } from './calculadora.js';
import { formatearSoles, formatearPorcentaje, aNumero } from './formato.js';
import { CASOS, buscarCaso } from './casos.js';
import {
  EJERCICIO, UIT, DEDUCCION_FIJA_UIT, MESES, MESES_CORTOS, TRAMOS, FUENTE_SUNAT,
} from './config.js';

// ---------------------------------------------------------------------------
// Referencias al DOM
// ---------------------------------------------------------------------------

const $ = (id) => document.getElementById(id);

const formulario = $('formulario');
const inputRemuneracion = $('remuneracion');
const selectMesIngreso = $('mes-ingreso');
const inputRemuneracionesPrevias = $('remuneraciones-previas');
const inputRetencionesPrevias = $('retenciones-previas');
const listaAdicionales = $('lista-adicionales');
const btnAgregarAdicional = $('btn-agregar-adicional');
const selectorCasos = $('selector-casos');
const mensajeError = $('mensaje-error');
const cuerpoTabla = $('cuerpo-tabla');
const pieTabla = $('pie-tabla');
const detalle = $('detalle');
const detalleTitulo = $('detalle-titulo');
const detallePasos = $('detalle-pasos');

/** Último resultado calculado, para el detalle didáctico (RF-09). */
let ultimoResultado = null;

// ---------------------------------------------------------------------------
// Inicialización
// ---------------------------------------------------------------------------

function inicializar() {
  $('ejercicio').textContent = String(EJERCICIO);
  $('uit-vigente').textContent = formatearSoles(UIT);
  $('deduccion-fija').textContent = formatearSoles(DEDUCCION_FIJA_UIT * UIT);
  $('fuente-sunat').href = FUENTE_SUNAT;

  // Meses de ingreso.
  selectMesIngreso.innerHTML = MESES
    .map((nombre, i) => `<option value="${i + 1}">${nombre}</option>`)
    .join('');
  selectMesIngreso.value = '1';

  // Casos de prueba del docente (RF-10).
  selectorCasos.innerHTML = ['<option value="">— Selecciona un caso —</option>']
    .concat(CASOS.map((caso) => `<option value="${caso.id}">${caso.nombre}</option>`))
    .join('');

  agregarFilaAdicional();

  btnAgregarAdicional.addEventListener('click', () => agregarFilaAdicional());
  selectorCasos.addEventListener('change', alSeleccionarCaso);
  formulario.addEventListener('submit', alCalcular);
  $('btn-limpiar').addEventListener('click', alLimpiar);

  calcular(); // primer render con los valores por defecto
}

// ---------------------------------------------------------------------------
// Lista dinámica de ingresos adicionales (RF-03)
// ---------------------------------------------------------------------------

/**
 * Agrega una fila al listado de ingresos adicionales.
 * @param {{mes?:number, monto?:number, concepto?:string}} [valores]
 */
function agregarFilaAdicional(valores = {}) {
  const fila = document.createElement('div');
  fila.className = 'adicional';

  const indice = listaAdicionales.children.length + 1;
  const idMes = `adicional-mes-${indice}-${Date.now()}`;
  const idMonto = `adicional-monto-${indice}-${Date.now()}`;
  const idConcepto = `adicional-concepto-${indice}-${Date.now()}`;

  fila.innerHTML = `
    <div class="campo campo--compacto">
      <label for="${idConcepto}">Concepto</label>
      <input type="text" id="${idConcepto}" class="adicional__concepto"
             placeholder="Utilidades, bono…" value="${valores.concepto ?? ''}">
    </div>
    <div class="campo campo--compacto">
      <label for="${idMes}">Mes</label>
      <select id="${idMes}" class="adicional__mes">
        ${MESES.map((nombre, i) => `<option value="${i + 1}">${nombre}</option>`).join('')}
      </select>
    </div>
    <div class="campo campo--compacto">
      <label for="${idMonto}">Monto (S/)</label>
      <input type="number" id="${idMonto}" class="adicional__monto" min="0" step="0.01"
             inputmode="decimal" value="${valores.monto ?? ''}">
    </div>
    <button type="button" class="btn btn--icono adicional__quitar"
            aria-label="Eliminar este ingreso adicional">×</button>
  `;

  fila.querySelector('.adicional__mes').value = String(valores.mes ?? 1);
  fila.querySelector('.adicional__quitar').addEventListener('click', () => fila.remove());

  listaAdicionales.appendChild(fila);
}

/** Lee las filas de ingresos adicionales, ignorando las vacías o en cero. */
function leerAdicionales() {
  return Array.from(listaAdicionales.querySelectorAll('.adicional'))
    .map((fila) => ({
      mes: Number(fila.querySelector('.adicional__mes').value),
      monto: aNumero(fila.querySelector('.adicional__monto').value, 0),
      concepto: fila.querySelector('.adicional__concepto').value.trim() || 'Ingreso adicional',
    }))
    .filter((adicional) => adicional.monto > 0 || Number.isNaN(adicional.monto));
}

// ---------------------------------------------------------------------------
// Lectura del formulario y cálculo
// ---------------------------------------------------------------------------

/** @returns {import('./calculadora.js').Entrada} */
function leerFormulario() {
  return {
    remuneracionMensual: aNumero(inputRemuneracion.value, 0),
    mesIngreso: Number(selectMesIngreso.value),
    adicionales: leerAdicionales(),
    remuneracionesPrevias: aNumero(inputRemuneracionesPrevias.value, 0),
    retencionesPrevias: aNumero(inputRetencionesPrevias.value, 0),
  };
}

function alCalcular(evento) {
  evento.preventDefault();
  calcular();
}

function calcular() {
  ocultarError();
  ocultarDetalle();

  try {
    const entrada = leerFormulario();
    ultimoResultado = calcularEjercicio(entrada);
    renderizar(ultimoResultado);
  } catch (error) {
    ultimoResultado = null;
    mostrarError(error instanceof Error ? error.message : 'Error inesperado al calcular.');
    limpiarResultados();
  }
}

function alLimpiar() {
  // El reset del formulario ocurre después de este handler; se difiere el repintado.
  setTimeout(() => {
    listaAdicionales.innerHTML = '';
    agregarFilaAdicional();
    selectorCasos.value = '';
    ocultarError();
    ocultarDetalle();
    calcular();
  }, 0);
}

function alSeleccionarCaso() {
  const caso = buscarCaso(selectorCasos.value);
  if (!caso) return;

  const { entrada } = caso;
  inputRemuneracion.value = String(entrada.remuneracionMensual);
  selectMesIngreso.value = String(entrada.mesIngreso);
  inputRemuneracionesPrevias.value = String(entrada.remuneracionesPrevias ?? 0);
  inputRetencionesPrevias.value = String(entrada.retencionesPrevias ?? 0);

  listaAdicionales.innerHTML = '';
  const adicionales = entrada.adicionales ?? [];
  if (adicionales.length === 0) agregarFilaAdicional();
  else adicionales.forEach((adicional) => agregarFilaAdicional(adicional));

  calcular();
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function renderizar(resultado) {
  const { resumen, totales } = resultado;

  $('res-rba').textContent = formatearSoles(resumen.remuneracionBrutaAnual);
  $('res-rna').textContent = formatearSoles(resumen.rentaNetaAnual);
  $('res-iap').textContent = formatearSoles(resumen.impuestoAnualProyectado);
  $('res-retenido').textContent = formatearSoles(resumen.totalRetenido);
  $('res-neto').textContent = formatearSoles(resumen.netoAnual);
  $('res-saldo').textContent = resumen.saldoAFavor > 0
    ? `Incluye saldo a favor del trabajador: ${formatearSoles(resumen.saldoAFavor)}`
    : 'Suma de las retenciones del año';

  cuerpoTabla.innerHTML = '';
  for (const fila of resultado.filas) {
    cuerpoTabla.appendChild(construirFila(fila));
  }

  pieTabla.innerHTML = `
    <tr>
      <th scope="row">Totales</th>
      <td colspan="3"></td>
      <td>${formatearSoles(totales.ingresoBruto)}</td>
      <td>${formatearSoles(totales.retencion)}</td>
      <td>${formatearSoles(totales.neto)}</td>
    </tr>
  `;
}

/** Construye la fila `<tr>` de un mes. */
function construirFila(fila) {
  const tr = document.createElement('tr');

  if (!fila.laborado) {
    tr.className = 'fila--no-laborada';
    tr.innerHTML = `
      <th scope="row">${MESES_CORTOS[fila.mes - 1]}</th>
      <td colspan="6">— no laborado —</td>
    `;
    return tr;
  }

  tr.className = 'fila--laborada';
  tr.tabIndex = 0;
  tr.setAttribute('role', 'button');
  tr.setAttribute('aria-label', `Ver el detalle del cálculo de ${fila.nombreMes}`);
  tr.innerHTML = `
    <th scope="row">${MESES_CORTOS[fila.mes - 1]}</th>
    <td>${formatearSoles(fila.remuneracion)}</td>
    <td>${fila.gratificacion > 0 ? formatearSoles(fila.gratificacion) : '—'}</td>
    <td>${fila.adicional > 0 ? formatearSoles(fila.adicional) : '—'}</td>
    <td>${formatearSoles(fila.ingresoBruto)}</td>
    <td class="${fila.retencionTotal < 0 ? 'monto--favor' : ''}">${formatearSoles(fila.retencionTotal)}</td>
    <td><strong>${formatearSoles(fila.neto)}</strong></td>
  `;

  const abrir = () => mostrarDetalle(fila);
  tr.addEventListener('click', abrir);
  tr.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      abrir();
    }
  });

  return tr;
}

// ---------------------------------------------------------------------------
// Detalle didáctico de los 5 PASOS (RF-09)
// ---------------------------------------------------------------------------

function mostrarDetalle(fila) {
  if (!ultimoResultado) return;

  detalleTitulo.textContent = `Detalle del cálculo — ${fila.nombreMes}`;

  const deduccion = ultimoResultado.deduccionFija;
  const pasos = [
    {
      titulo: 'PASO 1 · Remuneración Bruta Anual proyectada',
      cuerpo: `Remuneraciones del ejercicio + gratificaciones + ingresos adicionales de meses
               anteriores + rentas del empleador anterior =
               <strong>${formatearSoles(fila.remuneracionBrutaAnual)}</strong>.
               El ingreso adicional del propio mes no entra aquí.`,
    },
    {
      titulo: 'PASO 2 · Renta Neta Anual',
      cuerpo: `${formatearSoles(fila.remuneracionBrutaAnual)} − ${formatearSoles(deduccion)}
               (deducción fija de 7 UIT) =
               <strong>${formatearSoles(fila.rentaNetaAnual)}</strong>.`,
    },
    {
      titulo: 'PASO 3 · Impuesto Anual Proyectado',
      cuerpo: `Escala progresiva acumulativa sobre la Renta Neta Anual
               (${TRAMOS.map((t) => formatearPorcentaje(t.tasa)).join(' / ')}) =
               <strong>${formatearSoles(fila.impuestoAnualProyectado)}</strong>.`,
    },
    {
      titulo: 'PASO 4 · Retención ordinaria del mes',
      cuerpo: `(${formatearSoles(fila.impuestoAnualProyectado)} −
               ${formatearSoles(fila.retencionesAcumuladas)} de retenciones ya efectuadas)
               ÷ ${fila.divisor} =
               <strong>${formatearSoles(fila.retencionOrdinaria)}</strong>${
                 fila.mes === 12
                   ? ' (diciembre regulariza el ejercicio y admite saldo a favor)'
                   : ''}.`,
    },
    {
      titulo: 'PASO 5 · Retención adicional',
      cuerpo: fila.paso5
        ? `Con el ingreso adicional de ${formatearSoles(fila.adicional)}:
           RBA' = ${formatearSoles(fila.paso5.remuneracionBrutaAnual)} ·
           RNA' = ${formatearSoles(fila.paso5.rentaNetaAnual)} ·
           IAP' = ${formatearSoles(fila.paso5.impuestoAnualProyectado)}.
           Retención adicional = ${formatearSoles(fila.paso5.impuestoAnualProyectado)} −
           ${formatearSoles(fila.impuestoAnualProyectado)} =
           <strong>${formatearSoles(fila.retencionAdicional)}</strong>.`
        : 'No hubo ingresos adicionales en este mes: no aplica.',
    },
    {
      titulo: 'Total del mes',
      cuerpo: `Retención total = ${formatearSoles(fila.retencionOrdinaria)} +
               ${formatearSoles(fila.retencionAdicional)} =
               <strong>${formatearSoles(fila.retencionTotal)}</strong>.
               Neto a recibir = ${formatearSoles(fila.ingresoBruto)} −
               ${formatearSoles(fila.retencionTotal)} =
               <strong>${formatearSoles(fila.neto)}</strong>.`,
    },
  ];

  detallePasos.innerHTML = pasos
    .map((paso) => `<li><h4>${paso.titulo}</h4><p>${paso.cuerpo}</p></li>`)
    .join('');
  detalle.hidden = false;
  detalle.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function ocultarDetalle() {
  detalle.hidden = true;
  detallePasos.innerHTML = '';
}

// ---------------------------------------------------------------------------
// Errores y limpieza
// ---------------------------------------------------------------------------

function mostrarError(mensaje) {
  mensajeError.textContent = mensaje;
  mensajeError.hidden = false;
}

function ocultarError() {
  mensajeError.hidden = true;
  mensajeError.textContent = '';
}

function limpiarResultados() {
  for (const id of ['res-rba', 'res-rna', 'res-iap', 'res-retenido', 'res-neto']) {
    $(id).textContent = '—';
  }
  cuerpoTabla.innerHTML = '';
  pieTabla.innerHTML = '';
}

inicializar();
