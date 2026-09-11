# Implementación HU-30 y HU-31 — Sprint 4

**Fecha:** 06/09/2026  
**Sprint:** Sprint 4  
**Historias:** HU-30 (Consultar Facturas, AR-33) y HU-31 (Integrar Facturación con SIN, AR-34)  
**Contexto:** Se tomó como base la implementación ya funcional de HU-28/HU-29 (facturación con transacción atómica, código de correlativo con advisory lock, detalles corregidos). HU-30 y HU-31 se implementaron de punta a punta en backend y frontend.

---

## 1. Resumen de lo que se implementó

**HU-30 (Consultar facturas)** cubre la consulta individual y el listado con filtros avanzados, con aislamiento de datos por rol. El rol `PACIENTE` solo puede ver sus propias facturas; `ADMINISTRADOR` y `RECEPCIONISTA` acceden al historial global con filtros por estado, NIT, fecha y término de búsqueda.

**HU-31 (Integrar facturación con SIN)** implementa los algoritmos oficiales del Servicio de Impuestos Nacionales de Bolivia conforme a la Resolución Normativa de Directorio del SIN (RND 10-0016-07 / RND 10-0021-16): generación del Código de Control (Verhoeff + AllegedRC4 + Base64), cadena normativa para Código QR, leyendas fiscales obligatorias y flujo de anulación ante el SIN. También expone los metadatos fiscales en el endpoint de consulta por ID para que el frontend los renderice en el comprobante imprimible.

---

## 2. Archivos creados y modificados

### Backend

| Archivo | Operación | Descripción |
|---|---|---|
| `Back/src/utils/sinFacturacion.ts` | **Nuevo** | Algoritmos oficiales del SIN (ver sección 3) |
| `Back/src/services/SinIntegrationService.ts` | **Nuevo** | Servicio de integración fiscal (ver sección 4) |
| `Back/src/services/FacturaService.ts` | **Modificado** | Integración SIN + método `anularFactura` (ver sección 5) |
| `Back/src/controllers/FacturaController.ts` | **Modificado** | Endpoint `POST /:id/anular` |
| `Back/src/routes/factura.routes.ts` | **Modificado** | Ruta de anulación con permiso `FACTURA_GESTIONAR` |
| `Back/src/dtos/factura.dto.ts` | **Modificado** | Agregado `AnularFacturaDTO { motivo: string }` |
| `Back/src/scripts/test/test-hu30-hu31-facturacion-sin.ts` | **Nuevo** | Suite de pruebas integración (ver sección 7) |

### Frontend

| Archivo | Operación | Descripción |
|---|---|---|
| `Front/src/components/QRCodeDisplay.tsx` | **Nuevo** | Renderizador de QR SVG nativo sin dependencias |
| `Front/src/services/facturaService.ts` | **Modificado** | Tipos `DatosFiscalesSIN` + función `anularFactura()` |
| `Front/src/components/ModalVisorFactura.tsx` | **Modificado** | Comprobante fiscal con QR, Código de Control y modal de anulación |
| `Front/src/pages/Facturacion/FacturacionPage.tsx` | **Modificado** | Props `puedeAnular` y callback `onFacturaAnulada` al modal |

---

## 3. Algoritmos oficiales del SIN — `sinFacturacion.ts`

Esta es la pieza más delicada de la implementación. Bolivia utiliza un sistema de facturación electrónica propio (SFV - Sistema de Facturación Virtual) con algoritmos criptográficos específicos.

### 3.1 Algoritmo Verhoeff

Se usa para agregar dígitos de control a las cadenas numéricas antes de procesarlas. La implementación usa las tres tablas matriciales del algoritmo original de Jacobus Verhoeff (1969):

- **Tabla D (multiplicación en D₅)**: Grupo diedro de 10 elementos.
- **Tabla P (permutación)**: 8 filas de permutación cíclica.
- **Tabla INV (inversos)**: Para calcular el dígito verificador final.

El SIN requiere agregar **2 dígitos Verhoeff** a cada uno de los 5 parámetros (N° autorización, N° factura, NIT cliente, fecha, monto) y luego calcular **5 dígitos Verhoeff** de la suma total.

```
calcularDigitoVerhoeff(numStr: string): number
generarDigitosVerhoeff(numStr: string, cantidad: number): string
```

### 3.2 Algoritmo AllegedRC4 (ARC4)

Cifrado de flujo derivado de RC4, utilizado por el SIN para ofuscar la cadena de control antes de convertirla a hexadecimal. Se llama "Alleged" porque RC4 es una marca registrada de RSA Security y esta implementación fue filtrada públicamente.

Proceso: inicialización del estado S-Box de 256 bytes con la clave de dosificación → Key Scheduling Algorithm (KSA) → Pseudo-Random Generation Algorithm (PRGA) → XOR con cada byte del mensaje → resultado en hexadecimal de 2 dígitos en mayúsculas por byte.

```
allegedRC4(mensaje: string, clave: string): string  // → HEX en mayúsculas
```

### 3.3 Base64 numérico del SIN

**No es el Base64 estándar (RFC 4648).** El SIN usa su propio diccionario de 64 caracteres:

```
0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz./
```

Convierte un número entero grande a representación en esta base, dividiendo repetidamente entre 64 y leyendo los restos en orden inverso.

### 3.4 Generación del Código de Control (paso a paso)

El `generarCodigoControl()` recibe: número de autorización, número de factura (solo dígitos), NIT del cliente, fecha de emisión (YYYYMMDD) y monto total redondeado a entero. El proceso completo es:

1. Agregar 2 dígitos Verhoeff a cada uno de los 5 parámetros.
2. Sumar los 5 valores extendidos y calcular 5 dígitos Verhoeff de esa suma → `digitos5`.
3. Usar cada uno de los 5 dígitos (+1) como longitud para extraer 5 subcadenas de la llave de dosificación → `sub1..sub5`.
4. Concatenar: `numAut + sub1 + numFac + sub2 + nitCliente + sub3 + fecha + sub4 + monto + sub5`.
5. Cifrar la concatenación con ARC4 usando `llaveDosificacion + digitos5` como clave → `cadenaCifrada`.
6. Calcular suma total ASCII y 5 sumas parciales (ASCII de cadenaCifrada[i] agrupado en 5 buckets por `i % 5`).
7. Para cada bucket: `suma_total × suma_parcial_i / digito_i` → sumar los 5 resultados → `totalAjustado`.
8. Convertir `totalAjustado` a Base64 SIN → `base64Texto`.
9. Cifrar `base64Texto` con ARC4 usando la misma clave → resultado en HEX.
10. Formatear los pares hexadecimales separados por guiones: `XX-XX-XX-XX`.

### 3.5 Cadena QR normativa

El formato oficial del SIN para el Código QR es de 12 campos separados por `|`:

```
NIT_EMISOR|NUM_FACTURA|NUM_AUTORIZACION|FECHA(DD/MM/YYYY)|TOTAL|BASE_CF|CODIGO_CONTROL|NIT_CLIENTE|ICE|VENTAS_TASA_CERO|NO_SUJETO_CF|DESCUENTO
```

`generarCadenaQR()` construye esta cadena con los valores de la factura. El frontend la pasa al componente `QRCodeDisplay` para renderizarla visualmente.

---

## 4. SinIntegrationService.ts

Capa de servicio que abstrae la configuración fiscal y las operaciones con el SIN:

- **`getConfig()`**: Devuelve los datos del emisor (NIT, razón social, N° autorización, llave de dosificación, leyendas). Se configura vía variables de entorno (`SIN_NIT_EMISOR`, `SIN_NUMERO_AUTORIZACION`, `SIN_LLAVE_DOSIFICACION`) con valores por defecto para desarrollo.
- **`generarDatosFiscales()`**: Punto de entrada principal. Recibe número de factura, NIT cliente, fecha y total → llama a `generarCodigoControl()` y `generarCadenaQR()` → devuelve el objeto completo con todos los metadatos fiscales.
- **`validarFacturaConSIN()`**: Re-genera el Código de Control con los parámetros dados y compara con el código almacenado. Útil para verificar autenticidad de un comprobante.
- **`anularFacturaEnSIN()`**: Registra la anulación ante el SIN. En esta implementación se simula la comunicación (el SIAT real requiere webservices con certificado digital), pero el flujo está diseñado para sustituirse por la llamada HTTP real sin cambiar la interfaz.

---

## 5. Cambios en FacturaService.ts

### 5.1 `emitir()` — integración del Código de Control real

El código anterior generaba un pseudocódigo de control artesanal:
```typescript
// Antes (HU-29):
const codigoControl = `CC-${numeroFactura}-${timestamp.slice(-6)}`;
```

Ahora se usa el algoritmo oficial del SIN:
```typescript
// Ahora (HU-31):
const datosFiscales = SinIntegrationService.generarDatosFiscales({
  numeroFactura,
  nitCliente,
  fechaEmision,
  total: totalNumerico,
  descuento: montoDescuento,
});
// datosFiscales.codigoControl → "43-D2-5B-72-4D" (real SIN)
```

La fecha de emisión ahora se fija **dentro de la transacción** (no antes de abrirla), lo cual es correcto porque el Código de Control depende de la fecha y debe coincidir con el momento de registro en la base.

### 5.2 `obtenerPorId()` — enriquecimiento con metadatos fiscales (HU-30/HU-31)

La respuesta de `GET /api/facturas/:id` ahora incluye `datosFiscalesSIN`:

```json
{
  "idFactura": 5,
  "numeroFactura": "FAC-2026-00005",
  "codigoControl": "43-D2-5B-72-4D",
  "datosFiscalesSIN": {
    "nitEmisor": "1029384756",
    "razonSocialEmisor": "CENTRO MÉDICO MEDICALSYS S.R.L.",
    "numeroAutorizacion": "493029100234",
    "cadenaQR": "1029384756|5|493029100234|06/09/2026|285.75|285.75|43-D2-5B-72-4D|87654321|0.00|0.00|0.00|15.00",
    "leyendaLey": "ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS...",
    "leyendaSector": "Documento emitido según normativa del SIN - Sector Salud",
    "casaMatriz": "Av. Principal Médica #450, Edificio Salud",
    "municipio": "Santa Cruz, Bolivia"
  }
}
```

### 5.3 `anularFactura()` — nuevo método (HU-31)

Valida:
- El rol no es `PACIENTE` (pacientes no pueden anular).
- El motivo tiene al menos 3 caracteres.
- La factura existe y no está ya anulada.

Ejecuta en una sola transacción:
1. Comunica la anulación al SIN vía `SinIntegrationService.anularFacturaEnSIN()`.
2. Cambia `factura.estado = "ANULADA"` en la base.
3. Revierta los `AtencionServicio` vinculados a la factura de vuelta a `"PENDIENTE"`, liberando esos servicios para ser facturados de nuevo si corresponde.

---

## 6. Frontend

### 6.1 QRCodeDisplay.tsx

Componente React que genera un QR en SVG puro sin ninguna dependencia npm adicional. La implementación usa un generador simplificado basado en la estructura de QR versión 4-14:

- Agrega los 3 patrones de posición (finders) en las esquinas.
- Agrega separadores y patrones de temporización (timing).
- Rellena los módulos de datos en orden zigzag estándar con aplicación de máscara `(row + col) % 2 === 0`.
- Renderiza como `<rect>` dentro de un `<svg>` con dimensiones configurables.

Es adecuado para representación visual del QR en el comprobante imprimible. Para escaneo productivo con apps de cámara se recomienda reemplazarlo por `qrcode.react` u otra librería certificada.

### 6.2 ModalVisorFactura.tsx

Se rediseñó para cumplir con el formato de comprobante oficial del SIN:

- **Header**: Razón social emisora, casa matriz, municipio, NIT emisor, N° autorización, N° factura marcado como "ORIGINAL".
- **Metadata del cliente**: Fecha/hora de emisión, razón social, NIT/CI, paciente vinculado.
- **Tabla de servicios**: Sin cambios de estructura.
- **Totales**: Subtotal, descuentos, total, importe base crédito fiscal.
- **Footer fiscal**:
  - Código QR normativo (componente `QRCodeDisplay` con la `cadenaQR` del SIN).
  - Código de Control formateado en `monospace`.
  - Fecha límite de emisión.
  - Leyenda de ley (texto legal obligatorio).
  - Leyenda de sector.
- **Marca de agua ANULADA**: Si la factura está en estado `ANULADA`, se superpone un texto en diagonal semitransparente.
- **Modal de anulación**: Para roles con `puedeAnular=true` (Administrador/Recepcionista), aparece un botón "Anular Factura" que abre un diálogo de confirmación con campo de motivo. Al confirmar, llama a `POST /api/facturas/:id/anular` y actualiza la factura en el historial via el callback `onFacturaAnulada`.

---

## 7. Suite de pruebas — `test-hu30-hu31-facturacion-sin.ts`

Ejecutar con:
```bash
cd Back && npx ts-node-dev --transpile-only src/scripts/test/test-hu30-hu31-facturacion-sin.ts
```

Resultado del último run: **7/7 pruebas pasadas — exit code 0**.

| # | Prueba | Resultado |
|---|---|---|
| 1 | Verhoeff `'12345'` → dígito `1`; ARC4 → hexadecimal válido; Código de Control → `43-D2-5B-72-4D` | ✅ |
| 2 | Validación de NIT boliviano: acepta numérico, acepta `0`, rechaza alfanumérico | ✅ |
| 3 | Emisión de factura con Código de Control SIN real y `codigoControl` en formato `XX-XX-...-XX` | ✅ |
| 4 | Consulta por ID incluye `datosFiscalesSIN.cadenaQR` y `datosFiscalesSIN.numeroAutorizacion` | ✅ |
| 5 | Filtros avanzados: por paciente, por NIT, por búsqueda de texto, por estado | ✅ |
| 6 | IDOR bloqueado: rol `PACIENTE` recibe `HTTP 403` al consultar factura de otro paciente | ✅ |
| 7 | Anulación: estado pasa a `ANULADA` + bloqueo de re-anulación con `HTTP 400` | ✅ |

Typecheck limpio en ambos proyectos:
```bash
cd Back && npm run typecheck   # exit 0
cd Front && npx tsc -b         # exit 0
```

---

## 8. Decisiones de diseño y tradeoffs

### Llave de dosificación en variable de entorno

La llave (`SIN_LLAVE_DOSIFICACION`) está en `.env` y no en el código. En producción debe reemplazarse con la llave real entregada por el SIN en el proceso de dosificación oficial. La llave por defecto es solo para desarrollo/testing.

### Anulación al SIN como stub

`SinIntegrationService.anularFacturaEnSIN()` actualmente simula la comunicación. El SIN de Bolivia expone webservices SOAP (SIAT) que requieren certificado digital y credenciales de habilitación. El stub devuelve el código `SIN-ANULACION-OK-908` para que el flujo completo sea testeable sin depender de infraestructura externa. Para producción se sustituye solo el interior de ese método sin cambiar la interfaz.

### QRCodeDisplay sin dependencias

Se eligió implementar el QR en SVG nativo para no agregar dependencias al Frontend, ya que el proyecto usa un setup deliberadamente minimalista (Vite + React + lucide-react solamente). El componente es adecuado para la representación visual en el comprobante; si en el futuro se necesita escaneo con cámara, se puede reemplazar por `qrcode.react` instalando la dependencia.

### Reversión de AtencionServicio al anular

Al anular una factura, los `AtencionServicio` que esa factura había cerrado (estado `FACTURADO`) vuelven a `PENDIENTE`. Esto permite que la clínica pueda volver a facturar esos servicios en un nuevo comprobante tras corregir el error que motivó la anulación. Es el comportamiento esperado según el ciclo de vida de la factura en Bolivia.

---

## 9. Endpoints disponibles

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| `GET` | `/api/facturas` | `FACTURA_VER` | Listado con filtros (`idPaciente`, `estado`, `nitCliente`, `fechaInicio`, `fechaFin`, `busqueda`) |
| `GET` | `/api/facturas/:id` | `FACTURA_VER` | Detalle de factura + `datosFiscalesSIN` (QR, leyendas, N° autorización) |
| `POST` | `/api/facturas` | `FACTURA_CREAR` | Emisión (incluye Código de Control SIN real) |
| `POST` | `/api/facturas/:id/anular` | `FACTURA_GESTIONAR` | Anulación ante el SIN + liberación de servicios |
| `GET` | `/api/facturas/pacientes/:idPaciente/pendientes` | `FACTURA_CREAR` | Servicios pendientes de un paciente |
