# FASE 1 — Requisitos

**Entregable de la fase:** este documento (catálogo de requisitos funcionales y no funcionales,
con el alcance explícitamente delimitado).

## 1.1 Requisitos funcionales

| ID | Requisito | Dónde se implementa |
|---|---|---|
| RF-01 | El usuario ingresa la remuneración mensual bruta. | `index.html` (`#remuneracion`), `src/ui.js` |
| RF-02 | El usuario ingresa el mes de ingreso (1–12); solo se proyecta de ese mes a diciembre. | `src/calculadora.js` (bucle mensual), `src/ui.js` |
| RF-03 | Registro de ingresos adicionales (mes + monto), lista dinámica agregar/eliminar. | `src/ui.js` (`agregarFilaAdicional`) |
| RF-04 | Remuneraciones y retenciones del empleador anterior (por defecto 0). | `src/calculadora.js` (`remuneracionesPrevias`, `retencionesPrevias`) |
| RF-05 | Cálculo de la Remuneración Bruta Anual proyectada por mes. | PASO 1 en `calcularEjercicio()` |
| RF-06 | Cálculo del Impuesto Anual Proyectado por mes. | PASO 3, `calcularImpuestoAnual()` |
| RF-07 | Retención de cada mes (ordinaria + adicional). | PASOS 4 y 5 |
| RF-08 | Tabla mensual con ingreso ordinario, gratificación, adicional, bruto, retención y neto. | `src/ui.js` (`construirFila`) |
| RF-09 | Detalle del cálculo de un mes (los 5 pasos SUNAT). | `src/ui.js` (`mostrarDetalle`) |
| RF-10 | Carga de los 5 casos de prueba del docente. | `src/casos.js` + `<select>` de casos |
| RF-11 | Montos en soles con 2 decimales y separador de miles. | `src/formato.js` (`formatearSoles`) |

## 1.2 Requisitos no funcionales

| ID | Requisito | Cómo se satisface |
|---|---|---|
| RNF-01 | Aplicación 100% cliente, sin backend. | HTML + ES Modules servidos estáticamente por GitHub Pages. |
| RNF-02 | Responsive (usable en móvil). | CSS Grid con `minmax`, media queries a 900px y 520px, tabla con scroll horizontal. |
| RNF-03 | UIT, tramos y meses parametrizados. | Todo en `src/config.js`; el motor no contiene ninguna constante literal. |
| RNF-04 | Código comentado en español, funciones puras en el motor. | `src/calculadora.js` comenta los PASOS 1–5 y no toca el DOM. |
| RNF-05 | Validación de entradas. | `validarEntrada()` con mensajes en español; 6 tests la cubren. |
| RNF-06 | Accesibilidad básica. | `<label for>` en todos los campos, `role="button"` + `tabIndex` en filas, `:focus-visible` visible, contraste ≥ 4.5:1, `role="alert"` en errores. |

## 1.3 Fuera de alcance (decisión explícita de esta fase)

- **Deducción adicional de hasta 3 UIT**: la aplica el propio trabajador en su declaración
  anual, no el empleador en la retención mensual.
- Rentas de cuarta categoría, renta de fuente extranjera.
- Descuentos de AFP/ONP/EsSalud: la base de quinta categoría es la remuneración bruta.
- Persistencia de datos, autenticación, multi-trabajador.

## Limitación de la cascada evidenciada en esta fase

La cascada obliga a **congelar el alcance antes de escribir una línea de código**. Aquí eso
funcionó porque la spec del docente era completa y normativa: las reglas venían de SUNAT, no de
un stakeholder que aún estaba decidiendo. En un proyecto real, la parte más frágil es la que no
se puede leer en una norma —por ejemplo, *cómo* quiere el usuario ver el detalle didáctico
(RF-09)—: eso solo se descubre mostrando una versión funcionando, y la cascada no lo permite
hasta la FASE 4. El riesgo se asumió consciente: si RF-09 hubiera estado mal entendido, el
error habría quedado latente durante tres fases antes de hacerse visible.
