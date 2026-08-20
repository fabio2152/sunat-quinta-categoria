# FASE 2 — Análisis: reglas de negocio

**Entregable de la fase:** el modelo de las reglas tributarias, el registro de supuestos y la
traducción de la norma a estructuras de datos.

Fuente normativa única: <https://orientacion.sunat.gob.pe/3071-02-calculo-del-impuesto>
UIT 2026 = S/ 5,500.00 (D.S. N° 301-2025-EF).

## 2.1 Constantes

```js
UIT = 5500;                 // Ejercicio 2026
DEDUCCION_FIJA = 7 * UIT;   // S/ 38,500.00
```

### Tramos del impuesto (progresivo acumulativo, sobre la Renta Neta Anual)

| Tramo | Rango en UIT | Rango 2026 (S/) | Tasa |
|---|---|---|---|
| 1 | Hasta 5 UIT | 0 – 27,500 | 8% |
| 2 | Más de 5 hasta 20 UIT | 27,500 – 110,000 | 14% |
| 3 | Más de 20 hasta 35 UIT | 110,000 – 192,500 | 17% |
| 4 | Más de 35 hasta 45 UIT | 192,500 – 247,500 | 20% |
| 5 | Más de 45 UIT | 247,500 a más | 30% |

Se modela como arreglo `TRAMOS = [{limiteUIT, tasa}]` y se aplica **por tramos marginales**: cada
tasa grava solo la porción de renta que cae en su tramo. Nunca una tasa plana sobre el total.

## 2.2 Gratificaciones ordinarias

- Dos al año: Fiestas Patrias (julio) y Navidad (diciembre).
- Monto = remuneración mensual × (meses completos laborados del semestre / 6).
  - Semestre de julio = enero–junio. Semestre de diciembre = julio–diciembre.
  - Si el trabajador ingresa en el mes `M`, los meses se cuentan desde `M`.

| Mes de ingreso | Grati. julio | Grati. diciembre |
|---|---|---|
| Enero | 6/6 = remuneración completa | 6/6 |
| Julio | 0 | 6/6 |
| Setiembre | 0 | 4/6 |

La **bonificación extraordinaria de la Ley 30334** (9% de la gratificación) está detrás de la
bandera `INCLUIR_BONIFICACION_EXTRAORDINARIA` en `src/config.js`, con valor **`false`** por
defecto. Si se pone en `true`, ese 9% se suma como ingreso gravado del mes de la gratificación
y entra en la proyección anual.

## 2.3 Procedimiento de cálculo, mes a mes (PASOS SUNAT)

Para cada mes `m` desde el mes de ingreso hasta diciembre, en orden cronológico:

**PASO 1 — Remuneración Bruta Anual proyectada (RBA)**

```
RBA(m) =  remuneración × (meses que faltan para terminar el año, incluido m)
        + gratificaciones ordinarias del ejercicio (percibidas y por percibir)
        + remuneraciones ordinarias ya percibidas en meses anteriores del ejercicio
        + ingresos adicionales puestos a disposición en meses ANTERIORES a m
        + remuneraciones del empleador anterior
```

El ingreso adicional **del propio mes `m` no entra aquí**: se trata en el PASO 5.

**PASO 2 — Renta Neta Anual:** `RNA(m) = max(0, RBA(m) − 7 UIT)`.

**PASO 3 — Impuesto Anual Proyectado:** `IAP(m) = aplicarTramos(RNA(m))`.

**PASO 4 — Retención ordinaria del mes**

| Mes | Se le deducen las retenciones de | Divisor |
|---|---|---|
| Enero, Febrero, Marzo | — | 12 |
| Abril | Enero a Marzo | 9 |
| Mayo, Junio, Julio | Enero a Abril | 8 |
| Agosto | Enero a Julio | 5 |
| Setiembre, Octubre, Noviembre | Enero a Agosto | 4 |
| Diciembre | Enero a Noviembre | 1 (regularización) |

```
retencionOrdinaria(m) = (IAP(m) − retencionesAcumuladas) / divisor(m)
```

`retencionesAcumuladas` incluye retenciones ordinarias **y adicionales** ya efectuadas, más las
del empleador anterior. Si el resultado es negativo se trunca a 0 en enero–noviembre; en
**diciembre se permite negativo** y se rotula como *saldo a favor del trabajador*.

**PASO 5 — Retención adicional** (solo si en el mes `m` hay un ingreso adicional)

```
RBA' = RBA(m) + adicionalDelMes(m)
RNA' = max(0, RBA' − 7 UIT)
IAP' = aplicarTramos(RNA')
retencionAdicional(m) = max(0, IAP' − IAP(m))
```

**Total del mes**

```
retencionTotal(m) = retencionOrdinaria(m) + retencionAdicional(m)
netoDelMes(m)     = ingresoBrutoDelMes(m) − retencionTotal(m)
ingresoBrutoDelMes(m) = remuneración + gratificaciónDelMes(m) + adicionalDelMes(m)
```

## 2.4 Redondeo

Se calcula internamente con precisión completa (`Number`) y se redondea a 2 decimales
**solo al acumular y al mostrar**, con `Math.round(x * 100) / 100`.
La justificación está en [`03-diseno.md`](03-diseno.md).

## 7. Supuestos asumidos

1. **UIT 2026 = S/ 5,500** (D.S. N° 301-2025-EF). Configurable en `src/config.js` y como
   parámetro opcional `uit` de la entrada del motor.
2. Las gratificaciones ordinarias son **dos** y se calculan proporcionalmente (1/6 por mes
   completo laborado del semestre).
3. La **bonificación extraordinaria del 9%** (Ley 30334) está **desactivada** por defecto,
   mediante bandera de configuración.
4. La **deducción adicional de hasta 3 UIT** no se aplica en la retención mensual: la usa el
   trabajador en su renta anual.
5. **No se descuentan aportes previsionales** (AFP/ONP) ni EsSalud: la base de quinta categoría
   es la remuneración bruta.
6. **Un solo empleador vigente**; el empleador anterior se modela solo con dos campos agregados
   (remuneraciones y retenciones previas), no con su detalle mensual.
7. El **ingreso adicional del propio mes nunca entra al PASO 1**; solo al PASO 5.
8. Las **retenciones negativas se truncan a 0**, salvo en diciembre (regularización → saldo a
   favor del trabajador).

## Limitación de la cascada evidenciada en esta fase

El análisis dejó **ocho supuestos** anotados, no cero. Cada uno es una decisión tomada sin poder
validarla con el usuario dentro de la fase, porque la cascada solo permite volver atrás pagando
el costo de reabrir la fase anterior. El supuesto 6 es el más incómodo: modelar el empleador
anterior con dos números agregados es suficiente para el laboratorio, pero si el docente pidiera
el detalle mensual del empleador previo, cambiaría el contrato de `Entrada`, el motor, la UI y
los tests a la vez. Un enfoque iterativo habría validado ese supuesto con un prototipo antes de
comprometer el diseño; la cascada obliga a apostar y documentar la apuesta.
