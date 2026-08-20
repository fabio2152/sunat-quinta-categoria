# FASE 5 — Pruebas

**Entregable de la fase:** la suite de pruebas y la evidencia de su ejecución.

Runner: **`node --test`** (nativo de Node, sin Jest ni Vitest).
Archivo: `test/calculadora.test.js`. Tolerancia de comparación: **±0.01**.

```bash
npm test
```

## 5.1 Matriz de casos de prueba del docente

### Caso 1 — Remuneración baja, no supera 7 UIT

`remuneración = 1,000` · `adicionales = 0` · `mes de ingreso = 1`

RBA = 12,000 + 2,000 (gratificaciones) = **14,000** ≤ 38,500 → Impuesto anual = **0**

| Mes | Retención |
|---|---|
| Ene – Dic | 0.00 |

**Total retenido: S/ 0.00** ✔

### Caso 2 — Retención pareja todo el año

`remuneración = 5,000` · `adicionales = 0` · `mes de ingreso = 1`

RBA = 60,000 + 10,000 = **70,000** · RNA = 31,500 ·
IAP = (27,500 × 8%) + (4,000 × 14%) = 2,200 + 560 = **2,760.00**

| Mes | Retención |
|---|---|
| Ene – Dic | 230.00 |

**Total retenido: S/ 2,760.00** ✔

### Caso 3 — Ingreso adicional en junio (PASO 5)

`remuneración = 5,000` · `adicional = 10,000 en junio` · `mes de ingreso = 1`

- Ene–Jun: IAP = 2,760.00 (el adicional de junio aún no entra en la proyección).
- Junio, PASO 5: RBA' = 80,000 → RNA' = 41,500 → IAP' = 4,160.00 →
  retención adicional = 4,160.00 − 2,760.00 = **1,400.00**.
- Jul–Dic: el adicional ya percibido entra en la proyección → IAP = **4,160.00**.

| Mes | Ordinaria | Adicional | Total |
|---|---|---|---|
| Ene | 230.00 | — | 230.00 |
| Feb | 230.00 | — | 230.00 |
| Mar | 230.00 | — | 230.00 |
| Abr | 230.00 | — | 230.00 |
| May | 230.00 | — | 230.00 |
| Jun | 230.00 | 1,400.00 | **1,630.00** |
| Jul | 405.00 | — | 405.00 |
| Ago | 195.00 | — | 195.00 |
| Set | 195.00 | — | 195.00 |
| Oct | 195.00 | — | 195.00 |
| Nov | 195.00 | — | 195.00 |
| Dic | 195.00 | — | 195.00 |

**Total retenido: S/ 4,160.00** = impuesto anual del ejercicio ✔

Asserts intermedios incluidos en el test:
Julio → (4,160 − 920)/8 = 405.00 · Agosto → (4,160 − 3,185)/5 = 195.00 ·
Diciembre → 4,160 − 3,965 = 195.00.

### Caso 4 — Ingresa en setiembre

`remuneración = 5,000` · `adicionales = 0` · `mes de ingreso = 9`

RBA = 5,000 × 4 (set–dic) + gratificación de Navidad proporcional (5,000 × 4/6 = 3,333.33)
= **23,333.33** ≤ 38,500 → IAP = **0**

| Mes | Retención |
|---|---|
| Ene – Ago | no laborado (—) |
| Set – Dic | 0.00 |

**Total retenido: S/ 0.00** ✔

### Caso 5 — Ingresa en julio, adicional en noviembre

`remuneración = 5,000` · `adicional = 10,000 en noviembre` · `mes de ingreso = 7`

- Gratificación de julio = 0 (no laboró el semestre ene–jun); gratificación de diciembre = 5,000.
- RBA (jul–oct) = 30,000 + 5,000 = **35,000** ≤ 38,500 → IAP = **0** → sin retención.
- Noviembre, PASO 5: RBA' = 45,000 → RNA' = 6,500 → IAP' = 6,500 × 8% = **520.00** →
  retención adicional = **520.00**.
- Diciembre: RBA = 45,000 → IAP = 520.00 − retenciones ene–nov (520.00) = **0.00**.

| Mes | Ordinaria | Adicional | Total |
|---|---|---|---|
| Ene – Jun | no laborado | — | — |
| Jul | 0.00 | — | 0.00 |
| Ago | 0.00 | — | 0.00 |
| Set | 0.00 | — | 0.00 |
| Oct | 0.00 | — | 0.00 |
| Nov | 0.00 | 520.00 | **520.00** |
| Dic | 0.00 | — | 0.00 |

**Total retenido: S/ 520.00** ✔

## 5.2 Tests unitarios

### `calcularImpuestoAnual` (un valor por tramo y los bordes)

| Entrada (Renta Neta Anual) | Esperado | Qué verifica |
|---|---|---|
| 0 | 0.00 | Sin renta gravable |
| −1,000 | 0.00 | Renta negativa se trata como 0 |
| 10,000 | 800.00 | Tramo 1 parcial (8%) |
| 27,500 | 2,200.00 | **Borde del tramo 1** |
| 110,000 | 13,750.00 | **Borde del tramo 2** (2,200 + 82,500 × 14%) |
| 192,500 | 27,775.00 | Borde del tramo 3 (13,750 + 82,500 × 17%) |
| 247,500 | 38,775.00 | Borde del tramo 4 (27,775 + 55,000 × 20%) |
| 347,500 | 68,775.00 | Tramo 5 (38,775 + 100,000 × 30%) |
| 25,000 con UIT 5,000 | 2,000.00 | La UIT es parametrizable (RNF-03) |

### `divisorDelMes` y `mesesDeducidos`

| Función | Valores |
|---|---|
| `divisorDelMes(1..12)` | 12, 12, 12, **9**, 8, 8, 8, **5**, 4, 4, 4, **1** |
| `mesesDeducidos(1..12)` | 0, 0, 0, 3, 4, 4, 4, 7, 8, 8, 8, 11 |
| `divisorDelMes(0)` y `(13)` | lanzan `RangeError` |

### `gratificacionDelMes`

| Llamada | Esperado |
|---|---|
| `gratificacionDelMes(1..6, 8..11, 5000, 1)` | 0 (meses sin gratificación) |
| `gratificacionDelMes(7, 5000, 1)` | 5,000.00 (6/6) |
| `gratificacionDelMes(7, 5000, 4)` | 2,500.00 (3/6) |
| `gratificacionDelMes(7, 5000, 7)` | 0 |
| `gratificacionDelMes(7, 5000, 9)` | **0** |
| `gratificacionDelMes(12, 5000, 7)` | 5,000.00 (6/6) |
| `gratificacionDelMes(12, 5000, 9)` | **3,333.33** (4/6) |

### Empleador anterior (RF-04) y diciembre negativo

| Escenario | Esperado |
|---|---|
| `retencionesPrevias = 1,200`, enero | (2,760 − 1,200)/12 = **130.00** |
| `remuneracionesPrevias = 10,000`, enero | RBA = **80,000** |
| `retencionesPrevias = 5,000` | Noviembre ≥ 0 · Diciembre < 0 · saldo a favor **2,240.00** |

### Validación de entradas (RNF-05)

| Entrada inválida | Resultado |
|---|---|
| `remuneracionMensual = −1` | lanza `Error` |
| `mesIngreso = 0` o `13` | lanza `Error` |
| adicional con `monto = −100` | lanza `Error` |
| adicional en mes 3 con `mesIngreso = 6` | lanza `Error` |
| `retencionesPrevias = −5` | lanza `Error` |

### Invariantes generales

| Invariante | Se verifica en los 5 casos |
|---|---|
| El resultado tiene siempre 12 filas | ✔ |
| `neto = ingresoBruto − retencionTotal` en cada mes | ✔ |
| `total retenido = IAP de diciembre` (regularización anual) | ✔ |
| El motor no muta la entrada recibida (pureza) | ✔ |

## 5.3 Evidencia de ejecución

```
$ npm test

> sunat-quinta-categoria@1.0.0 test
> node --test test/calculadora.test.js

▶ Casos de prueba del docente
  ✔ Caso 1 — remuneración baja, no supera 7 UIT: sin retención
  ✔ Caso 2 — retención pareja de S/ 230.00 todo el año
  ✔ Caso 3 — ingreso adicional de S/ 10,000 en junio (PASO 5)
  ✔ Caso 4 — ingresa en setiembre: sin retención
  ✔ Caso 5 — ingresa en julio, adicional en noviembre
  ✔ Los 5 casos coinciden con el total esperado declarado en casos.js
✔ Casos de prueba del docente
✔ calcularImpuestoAnual (tramos marginales, UIT 5,500)
✔ divisorDelMes
✔ mesesDeducidos
✔ gratificacionDelMes
✔ Empleador anterior y regularización de diciembre
✔ validarEntrada (RNF-05)
✔ Invariantes del motor

ℹ tests 37
ℹ suites 8
ℹ pass 37
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Además, la interfaz se verificó en un servidor estático local cargando cada caso desde el
`<select>` de casos de prueba: la tabla mensual, las tarjetas resumen y el detalle didáctico
reproducen los mismos valores que el motor (por ejemplo, en el caso 3 el detalle de junio muestra
RBA' = S/ 80,000.00, RNA' = S/ 41,500.00, IAP' = S/ 4,160.00 y retención adicional S/ 1,400.00),
sin errores en la consola del navegador.

## Limitación de la cascada evidenciada en esta fase

Las pruebas **no descubrieron ningún defecto**: el motor pasó los 5 casos en la primera
ejecución. Esto suena a buena noticia, pero es la limitación más honesta del método en este
laboratorio: los casos de prueba venían dados **con sus resultados esperados** desde la spec, es
decir, las pruebas se escribieron contra la misma fuente que el análisis. Una fase de pruebas al
final del ciclo solo puede validar lo que las fases previas ya entendieron; **no puede descubrir
un requisito que nadie enunció**.

Ejemplo concreto: ninguno de los 5 casos del docente cubre la retención negativa de diciembre
(supuesto 8), que es una regla real de la norma. Hubo que **inventar** un escenario adicional
(`retencionesPrevias = 5,000`) para probarla. En un ciclo iterativo, ese hueco de cobertura se
habría detectado en la primera iteración, con el motor a medio hacer y el costo de corregirlo
casi nulo; en cascada apareció cuando el diseño y la implementación ya estaban cerrados.
