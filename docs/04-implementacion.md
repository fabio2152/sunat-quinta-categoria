# FASE 4 — Implementación

**Entregable de la fase:** el código funcionando, construido en el orden que el diseño dictó.

## 4.1 Orden de construcción efectivamente seguido

| # | Archivo | Qué resolvió |
|---|---|---|
| 1 | `src/config.js` | UIT, tramos, meses, divisores, meses deducidos, banderas. |
| 2 | `src/calculadora.js` | Motor puro con los PASOS 1–5 y las auxiliares del contrato. |
| 3 | `test/calculadora.test.js` | 37 tests: los 5 casos del docente + unitarios. Pasaron en verde. |
| 4 | `src/formato.js`, `src/casos.js` | Formateo en soles y los 5 casos como datos reutilizables. |
| 5 | `src/ui.js` | Lectura del formulario, lista dinámica, render, detalle didáctico. |
| 6 | `index.html` + `assets/css/styles.css` | Estructura semántica y estética sobria responsive. |
| 7 | `docs/` | Documentación de las 6 fases. |
| 8 | `README.md` | Portada del proyecto. |
| 9 | `.github/workflows/ci.yml` | CI con `node --test` en cada push. |

## 4.2 Reglas de código aplicadas

- **ES Modules en todos los archivos.** En el HTML:
  `<script type="module" src="./src/ui.js"></script>`.
- **Rutas relativas** (`./src/…`, `./assets/…`), porque GitHub Pages publica bajo el
  subdirectorio `/sunat-quinta-categoria/`.
- **Cero `localStorage` y cero llamadas de red** (RNF-01).
- **Comentarios que referencian los PASOS 1–5** en el cuerpo del motor, para que el código se
  pueda leer contra la norma línea por línea.
- **Nombres del dominio en español**: `remuneracionBrutaAnual`, `retencionOrdinaria`,
  `gratificacionDelMes`. El código habla el mismo idioma que la spec del docente.

## 4.3 Detalles de implementación que merecen mención

### Tramos marginales sin duplicar la tabla

`calcularImpuestoAnual` recorre `TRAMOS` acumulando el impuesto de la porción de renta que cae
en cada tramo. El último tramo usa `limiteUIT: Infinity`, lo que elimina el caso especial del
tramo abierto: no hay un `if` final distinto de los demás.

```js
for (const tramo of TRAMOS) {
  if (rentaNeta <= inferior) break;
  const superior = tramo.limiteUIT === Infinity ? Infinity : tramo.limiteUIT * uit;
  impuesto += (Math.min(rentaNeta, superior) - inferior) * tramo.tasa;
  inferior = superior;
}
```

### El PASO 4 necesita el historial, no solo el mes

La retención de agosto deduce lo retenido de enero a julio, incluidas las retenciones
*adicionales* del PASO 5. Se resolvió con un arreglo `retencionPorMes[1..12]` que el bucle va
llenando cronológicamente: cuando se calcula el mes `m`, los meses anteriores ya están escritos.
Por eso el bucle **no se puede paralelizar ni reordenar**; la dependencia temporal es parte de
la norma. El caso 3 lo demuestra: sin sumar los S/ 1,400.00 del PASO 5 de junio a las
retenciones acumuladas, agosto daría 475.00 en lugar de 195.00.

### El adicional del propio mes fuera del PASO 1

Es el supuesto 7 y el error más fácil de cometer. La implementación suma explícitamente solo
`adicionalPorMes[m]` con `m < mes`, y el adicional del mes en curso se usa **únicamente** dentro
del bloque del PASO 5.

### Diciembre como excepción controlada

Una sola línea concentra la excepción: `if (mes !== 12 && retencionOrdinaria < 0) → 0`. El signo
negativo de diciembre se propaga hasta `resumen.saldoAFavor` y se pinta en verde en la tabla.

### La UI no recalcula nada

`ui.js` solo formatea lo que el motor ya devolvió. El detalle didáctico de RF-09 lee
`fila.paso5` y los intermedios de la fila: no hay una segunda implementación de las reglas
tributarias en la capa de presentación, que es exactamente el riesgo que la separación buscaba
eliminar.

## 4.4 Verificación de la fase

```
$ npm test
ℹ tests 37
ℹ pass 37
ℹ fail 0
```

Los 5 casos del docente coinciden mes a mes con los valores esperados, y la UI, cargada en un
servidor estático local, reproduce los mismos números en la tabla mensual y en las tarjetas.

## Limitación de la cascada evidenciada en esta fase

La implementación **no encontró ningún error en el análisis**, y eso es a la vez el éxito y el
límite del método: funcionó porque el dominio era completamente especificable de antemano (una
norma tributaria publicada, con casos de prueba y resultados esperados dados). La cascada rinde
bien exactamente en ese escenario.

Donde sí apareció fricción fue en todo lo que la norma **no** especifica: el entorno de
ejecución. Dos ajustes reales, ninguno previsible desde el diseño:

1. **La invocación del runner.** `node --test test/` (la forma escrita en la spec) falla en
   Node 24 sobre Windows, donde el argumento se interpreta como patrón glob. El patrón explícito
   `node --test "test/**/*.test.js"` arregló el local pero **rompió la CI**, porque Node 20 no
   soporta globs en `--test`. La forma que funciona en todas las versiones y en todos los shells
   es nombrar el archivo: `node --test test/calculadora.test.js`.
2. **Jekyll en GitHub Pages.** El primer despliegue falló: Pages procesa los `.md` de `docs/`
   con Jekyll, y el bloque `{{mes:number, monto:number}}` del contrato de `Entrada` en
   `03-diseno.md` es sintaxis de plantilla Liquid inválida. Se resolvió con un archivo
   **`.nojekyll`** en la raíz, que desactiva el pipeline de Jekyll y publica los archivos tal
   cual — que es exactamente lo que un sitio estático de vanilla JS necesita.

Ambos son detalles menores, pero ilustran el punto: **el diseño no puede anticipar el entorno de
ejecución real**, y ese tipo de ajuste solo se descubre ejecutando. En cascada estricta, cada
corrección de este tipo obliga a retocar hacia atrás el documento de diseño y el de pruebas.
