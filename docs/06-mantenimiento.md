# FASE 6 — Mantenimiento y despliegue

**Entregable de la fase:** el sitio publicado, la integración continua y el análisis de
mantenibilidad del sistema.

## 6.1 Integración continua

`.github/workflows/ci.yml` ejecuta en cada `push` y `pull_request` sobre `main`:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
- run: node --test test/calculadora.test.js
```

Sin `npm install`: el proyecto tiene **cero dependencias**, así que la CI es el runner de Node y
nada más. Cualquier cambio que rompa uno de los 5 casos del docente falla el build.

## 6.2 Despliegue en GitHub Pages

1. Repositorio público `sunat-quinta-categoria`.
2. **Settings → Pages → Source: Deploy from a branch → Branch `main` / `(root)` → Save**.
3. El sitio queda en `https://<usuario>.github.io/sunat-quinta-categoria/`.

No hay build step: GitHub Pages sirve `index.html` y los módulos ES tal cual. Dos condiciones
para que esto funcione:

- **Todas las rutas deben ser relativas** (`./src/…`, `./assets/…`), porque el sitio vive en el
  subdirectorio `/sunat-quinta-categoria/` y no en la raíz del dominio.
- **Un archivo `.nojekyll` en la raíz.** Sin él, Pages pasa el repositorio por Jekyll, que
  intenta interpretar los `.md` de `docs/` como plantillas Liquid y falla con las llaves dobles
  de los ejemplos de código. `.nojekyll` desactiva ese pipeline y publica los archivos literales.

## 6.3 Escenario 1 — Cambia la UIT o los tramos el próximo ejercicio

Este es el requisito que **sí sabemos que va a cambiar**: la UIT se actualiza por decreto
supremo cada año. El diseño lo anticipó con RNF-03, y el costo de mantenimiento es mínimo:

| Cambio | Archivos a tocar | Esfuerzo |
|---|---|---|
| Nueva UIT (p. ej. S/ 5,700 para 2027) | `src/config.js`: `UIT` y `EJERCICIO` | 2 líneas |
| Nuevos tramos o tasas | `src/config.js`: arreglo `TRAMOS` | 1 arreglo |
| Nuevos divisores del PASO 4 | `src/config.js`: `DIVISORES`, `MESES_DEDUCIDOS` | 2 objetos |

El motor **no cambia**: no contiene una sola constante tributaria literal, y `calcularImpuestoAnual`
recibe la UIT como parámetro (hay un test que lo comprueba con UIT = 5,000). El encabezado de la
UI lee `EJERCICIO`, `UIT` y la deducción fija de `config.js`, así que se actualiza solo.

Lo que **sí** habría que rehacer son los valores esperados de los tests: están calculados con
UIT 5,500. Es el precio correcto: los tests son la especificación ejecutable del ejercicio 2026,
y un ejercicio nuevo necesita sus propios casos.

## 6.4 Escenario 2 — Un requisito nuevo después de cerrar el diseño

Supongamos que el docente agrega: *"descontar los aportes a la AFP/ONP antes de calcular la
base gravable"* (hoy es el supuesto 5, explícitamente fuera de alcance).

### Costo en cascada

| Fase a reabrir | Trabajo |
|---|---|
| **1 · Requisitos** | Nuevo RF-12 (tipo de sistema previsional y tasa), nuevo RNF sobre validación de la tasa. |
| **2 · Análisis** | ¿La base de quinta categoría es bruta o neta de aportes? Investigar la norma; el supuesto 5 se invierte. |
| **3 · Diseño** | Cambia el contrato de `Entrada` (campos `sistemaPrevisional`, `tasaAporte`) y el de `FilaMes` (columna de aportes). Cambia el diseño de la tabla de RF-08 y del detalle de RF-09. |
| **4 · Implementación** | El PASO 1 cambia, y con él todos los pasos que dependen de él. La UI necesita un campo más y una columna más. |
| **5 · Pruebas** | **Los 5 casos del docente quedan obsoletos**: todos sus valores esperados cambian. Hay que recalcularlos a mano contra la norma. |
| **6 · Mantenimiento** | Rehacer `docs/01`…`docs/05`, el README y la matriz de pruebas. |

Es decir: **un requisito, seis fases reabiertas**. Y el trabajo más caro no es el código —el
motor está bien encapsulado, serían unas 20 líneas— sino **recalcular los oráculos de prueba y
rehacer la documentación de todas las fases anteriores**. En cascada, el costo del cambio crece
con la distancia entre la fase donde el requisito debió aparecer y la fase en la que aparece.

### Costo en un enfoque iterativo

En Scrum o XP, el mismo cambio sería una historia de usuario en el siguiente sprint:
se estima, entra al backlog, se implementa, se prueba y se documenta *en su propia iteración*.
La documentación no se reabre porque **no está congelada por fases**: vive junto al código. Los
casos de prueba tampoco quedan obsoletos en bloque, porque se habrían construido incrementalmente
en lugar de todos al final.

### Qué mitigó el daño aquí, aun estando en cascada

Tres decisiones de la FASE 3 reducirían el golpe:

1. **El motor está aislado de la UI.** El cambio no se propaga a la presentación más que en una
   columna nueva; no hay lógica tributaria duplicada en `ui.js`.
2. **`config.js` centraliza los parámetros.** La tasa de aporte sería una constante más.
3. **`casos.js` es la única fuente de los casos de prueba**, compartida por la UI y los tests.
   Recalcular los oráculos se hace en un archivo, no en dos.

La conclusión práctica: la cascada no se vuelve barata, pero un buen diseño modular **limita el
radio del daño** cuando el cambio inevitablemente llega.

## 6.5 Registro de supuestos asumidos

Los ocho supuestos vigentes están en [`02-analisis.md` §7](02-analisis.md). Cada uno es un punto
donde el sistema podría necesitar mantenimiento si el docente o la norma los contradicen.
Los tres más sensibles:

| Supuesto | Riesgo si cambia |
|---|---|
| 3 · Bonificación extraordinaria del 9% desactivada | **Bajo**: es una bandera en `config.js`; el motor ya la contempla. |
| 5 · No se descuentan aportes previsionales | **Alto**: es el escenario de §6.4. |
| 6 · Empleador anterior modelado con dos números agregados | **Medio**: si se pide el detalle mensual, cambia el contrato de `Entrada` y el PASO 4. |

## 6.6 Deuda técnica conocida

- **`ui.js` no tiene pruebas automatizadas.** Se verificó manualmente en el navegador. Testearla
  exigiría un DOM simulado, y eso rompería la restricción de cero dependencias. La mitigación es
  que `ui.js` no contiene lógica de negocio: solo formatea lo que el motor devuelve.
- **La matriz de casos está duplicada** entre `src/casos.js` (datos) y `docs/05-pruebas.md`
  (documento del laboratorio). El documento puede quedar desactualizado respecto al código; el
  código es la fuente de verdad.
- **Los valores esperados de los tests están escritos a mano** para UIT 5,500. Un cambio de
  ejercicio los invalida en bloque (§6.3).

## Limitación de la cascada evidenciada en esta fase

La cascada trata el mantenimiento como una **fase final**, cuando en realidad es el 80% de la
vida del software. Este proyecto lo hace evidente de la forma más literal posible: el sistema
calcula un impuesto cuyo parámetro central, la UIT, **cambia por decreto todos los años**. El
software nace sabiendo que su especificación caducará en diciembre.

Un modelo que asume "requisitos estables, capturados una vez al inicio" es estructuralmente
inadecuado para un dominio así. Lo que salvó al proyecto no fue seguir la cascada, sino haber
metido en la FASE 3 una decisión de diseño (RNF-03, parametrización total) que **anticipa el
cambio en lugar de negarlo** — es decir, aplicar una idea del pensamiento iterativo dentro de un
proceso secuencial.
