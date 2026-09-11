/**
 * Utilidades para la Integración de Facturación con el Servicio de Impuestos Nacionales (SIN) de Bolivia
 * Implementación de algoritmos oficiales:
 * 1. Algoritmo Verhoeff (Dígito verificador)
 * 2. Algoritmo AllegedRC4 (Cifrado de cadenas)
 * 3. Generación oficial de Código de Control (SFV - RND 10-0016-07 / RND 10-0021-16)
 * 4. Generación de Cadena de Código QR conforme a normativa del SIN
 */

// Tablas de multiplicación y permutación para el Algoritmo Verhoeff
const VERHOEFF_TABLE_D: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const VERHOEFF_TABLE_P: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

const VERHOEFF_TABLE_INV: number[] = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Calcula el dígito Verhoeff de una cadena numérica.
 */
export function calcularDigitoVerhoeff(numStr: string): number {
  let c = 0;
  const reversed = numStr.split("").reverse();
  for (let i = 0; i < reversed.length; i++) {
    const digit = parseInt(reversed[i], 10);
    if (isNaN(digit)) continue;
    c = VERHOEFF_TABLE_D[c][VERHOEFF_TABLE_P[(i + 1) % 8][digit]];
  }
  return VERHOEFF_TABLE_INV[c];
}

/**
 * Genera N dígitos Verhoeff consecutivos agregados al final de la cadena.
 */
export function generarDigitosVerhoeff(numStr: string, cantidad: number): string {
  let resultado = numStr;
  for (let i = 0; i < cantidad; i++) {
    const digito = calcularDigitoVerhoeff(resultado);
    resultado += digito.toString();
  }
  return resultado;
}

/**
 * Algoritmo AllegedRC4 (ARC4) para cifrado según especificación del SIN.
 * Retorna la cadena cifrada en formato hexadecimal de dos dígitos en mayúsculas.
 */
export function allegedRC4(mensaje: string, clave: string): string {
  const state: number[] = [];
  for (let i = 0; i < 256; i++) {
    state[i] = i;
  }

  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + state[i] + clave.charCodeAt(i % clave.length)) % 256;
    const temp = state[i];
    state[i] = state[j];
    state[j] = temp;
  }

  let i = 0;
  j = 0;
  let mensajeCifrado = "";

  for (let k = 0; k < mensaje.length; k++) {
    i = (i + 1) % 256;
    j = (j + state[i]) % 256;

    const temp = state[i];
    state[i] = state[j];
    state[j] = temp;

    const index = (state[i] + state[j]) % 256;
    const nMen = mensaje.charCodeAt(k) ^ state[index];
    const hex = nMen.toString(16).toUpperCase().padStart(2, "0");
    mensajeCifrado += hex;
  }

  return mensajeCifrado;
}

/**
 * Algoritmo de Base64 numérico especial para el Código de Control del SIN
 */
function base64SIN(numero: number): string {
  const diccionario = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz./";
  let cociente = numero;
  let palabra = "";

  while (cociente > 0) {
    const resto = cociente % 64;
    palabra = diccionario.charAt(resto) + palabra;
    cociente = Math.floor(cociente / 64);
  }

  return palabra || "0";
}

export interface DatosCodigoControl {
  numeroAutorizacion: string;
  numeroFactura: string | number;
  nitCliente: string;
  fechaEmision: Date | string; // Formato YYYYMMDD o Date
  montoTotal: number | string;
  llaveDosificacion: string;
}

/**
 * Genera el Código de Control oficial de Bolivia (SFV v0.7 / v0.9).
 * Retorna una cadena con pares hexadecimales separados por guiones (e.g. "4B-6A-3F-9C").
 */
export function generarCodigoControl(datos: DatosCodigoControl): string {
  const {
    numeroAutorizacion,
    numeroFactura,
    nitCliente,
    llaveDosificacion,
  } = datos;

  // 1. Formatear y limpiar datos
  const numAutStr = String(numeroAutorizacion).trim();
  const numFacStr = String(typeof numeroFactura === "number" ? Math.round(numeroFactura) : numeroFactura.replace(/\D/g, "")).trim();
  const nitStr = String(nitCliente).replace(/\D/g, "").trim() || "0";

  // Fecha en formato YYYYMMDD
  let fechaStr = "";
  if (datos.fechaEmision instanceof Date) {
    const y = datos.fechaEmision.getFullYear();
    const m = String(datos.fechaEmision.getMonth() + 1).padStart(2, "0");
    const d = String(datos.fechaEmision.getDate()).padStart(2, "0");
    fechaStr = `${y}${m}${d}`;
  } else {
    const cleanFecha = datos.fechaEmision.replace(/\D/g, "");
    fechaStr = cleanFecha.length >= 8 ? cleanFecha.substring(0, 8) : cleanFecha.padStart(8, "0");
  }

  // Monto redondeado a entero según norma SIN
  const montoNum = typeof datos.montoTotal === "number" ? datos.montoTotal : parseFloat(datos.montoTotal);
  const montoStr = String(Math.round(montoNum));

  // Paso 1: Agregar 2 dígitos Verhoeff a cada dato
  const autVerhoeff = generarDigitosVerhoeff(numAutStr, 2);
  const facVerhoeff = generarDigitosVerhoeff(numFacStr, 2);
  const nitVerhoeff = generarDigitosVerhoeff(nitStr, 2);
  const fecVerhoeff = generarDigitosVerhoeff(fechaStr, 2);
  const monVerhoeff = generarDigitosVerhoeff(montoStr, 2);

  // Paso 2: Sumar los 5 valores con Verhoeff y calcular 5 dígitos Verhoeff de la suma
  const sumaTotal =
    BigInt(autVerhoeff) +
    BigInt(facVerhoeff) +
    BigInt(nitVerhoeff) +
    BigInt(fecVerhoeff) +
    BigInt(monVerhoeff);

  const sumaVerhoeff5 = generarDigitosVerhoeff(sumaTotal.toString(), 5);
  const digitos5 = sumaVerhoeff5.slice(-5);

  // Paso 3: Obtener 5 porciones de la llave de dosificación
  const c1 = parseInt(digitos5[0], 10) + 1;
  const c2 = parseInt(digitos5[1], 10) + 1;
  const c3 = parseInt(digitos5[2], 10) + 1;
  const c4 = parseInt(digitos5[3], 10) + 1;
  const c5 = parseInt(digitos5[4], 10) + 1;

  let pos = 0;
  const sub1 = llaveDosificacion.substring(pos, pos + c1); pos += c1;
  const sub2 = llaveDosificacion.substring(pos, pos + c2); pos += c2;
  const sub3 = llaveDosificacion.substring(pos, pos + c3); pos += c3;
  const sub4 = llaveDosificacion.substring(pos, pos + c4); pos += c4;
  const sub5 = llaveDosificacion.substring(pos, pos + c5);

  // Paso 4: Concatenar cadenas con porciones de la llave
  const cadenaConcatenada =
    numAutStr + sub1 +
    numFacStr + sub2 +
    nitStr + sub3 +
    fechaStr + sub4 +
    montoStr + sub5;

  // Paso 5: Cifrado AllegedRC4 con clave = llaveDosificacion + digitos5
  const claveCifrado = llaveDosificacion + digitos5;
  const cadenaCifrada = allegedRC4(cadenaConcatenada, claveCifrado);

  // Paso 6: Suma de caracteres ASCII y obtención de sumas parciales
  let sumaASCII = 0;
  const sumasParciales = [0, 0, 0, 0, 0];

  for (let i = 0; i < cadenaCifrada.length; i++) {
    const ascii = cadenaCifrada.charCodeAt(i);
    sumaASCII += ascii;
    sumasParciales[i % 5] += ascii;
  }

  // Paso 7: Multiplicar suma total por cada parcial y dividir entre 1 + dígito Verhoeff
  let totalSumasAjustadas = 0;
  const dArray = [c1, c2, c3, c4, c5];

  for (let i = 0; i < 5; i++) {
    const baseP = Math.floor((sumaASCII * sumasParciales[i]) / dArray[i]);
    totalSumasAjustadas += baseP;
  }

  // Paso 8: Convertir suma ajustada a Base64 SIN
  const base64Texto = base64SIN(totalSumasAjustadas);

  // Paso 9: Cifrar Base64 con AllegedRC4 y formatear en pares con guiones
  const codigoHex = allegedRC4(base64Texto, claveCifrado);
  const pares: string[] = [];
  for (let i = 0; i < codigoHex.length; i += 2) {
    pares.push(codigoHex.substring(i, i + 2));
  }

  return pares.join("-");
}

export interface DatosCadenaQR {
  nitEmisor: string;
  numeroFactura: string | number;
  numeroAutorizacion: string;
  fechaEmision: Date | string; // Formato DD/MM/YYYY o Date
  totalBs: number | string;
  importeBaseCreditoFiscal?: number | string;
  codigoControl: string;
  nitCliente: string;
  importeICE?: number | string;
  importeVentasTasaCero?: number | string;
  importeNoSujetoCreditoFiscal?: number | string;
  descuento?: number | string;
}

/**
 * Genera la cadena oficial del Código QR para facturación en Bolivia según el SIN:
 * Formato: NIT_EMISOR|NUM_FACTURA|NUM_AUTORIZACION|FECHA_EMISION|TOTAL|BASE_CF|CODIGO_CONTROL|NIT_CLIENTE|ICE|TASA_CERO|NO_SUJETO_CF|DESCUENTO
 */
export function generarCadenaQR(datos: DatosCadenaQR): string {
  const nitEmisor = String(datos.nitEmisor).trim();
  const numFactura = String(typeof datos.numeroFactura === "number" ? datos.numeroFactura : datos.numeroFactura.replace(/\D/g, "")).trim();
  const numAut = String(datos.numeroAutorizacion).trim();

  let fechaStr = "";
  if (datos.fechaEmision instanceof Date) {
    const d = String(datos.fechaEmision.getDate()).padStart(2, "0");
    const m = String(datos.fechaEmision.getMonth() + 1).padStart(2, "0");
    const y = datos.fechaEmision.getFullYear();
    fechaStr = `${d}/${m}/${y}`;
  } else if (typeof datos.fechaEmision === "string") {
    // Si viene ISO "YYYY-MM-DD", convertir a "DD/MM/YYYY"
    if (datos.fechaEmision.includes("-")) {
      const parts = datos.fechaEmision.split("T")[0].split("-");
      if (parts.length === 3) {
        fechaStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
      } else {
        fechaStr = datos.fechaEmision;
      }
    } else {
      fechaStr = datos.fechaEmision;
    }
  }

  const total = Number(datos.totalBs).toFixed(2);
  const baseCF = datos.importeBaseCreditoFiscal !== undefined
    ? Number(datos.importeBaseCreditoFiscal).toFixed(2)
    : total;
  const codigoControl = String(datos.codigoControl).trim();
  const nitCliente = String(datos.nitCliente).trim() || "0";
  const ice = Number(datos.importeICE || 0).toFixed(2);
  const tasaCero = Number(datos.importeVentasTasaCero || 0).toFixed(2);
  const noSujetoCF = Number(datos.importeNoSujetoCreditoFiscal || 0).toFixed(2);
  const descuento = Number(datos.descuento || 0).toFixed(2);

  return `${nitEmisor}|${numFactura}|${numAut}|${fechaStr}|${total}|${baseCF}|${codigoControl}|${nitCliente}|${ice}|${tasaCero}|${noSujetoCF}|${descuento}`;
}

/**
 * Valida un NIT o Documento de Identidad boliviano.
 */
export function validarNITBolivia(nit: string): { valido: boolean; mensaje?: string } {
  const limpio = String(nit).trim();
  if (!limpio || limpio === "0") {
    return { valido: true }; // 0 es cliente genérico/sin NIT
  }
  if (!/^\d{5,15}$/.test(limpio)) {
    return { valido: false, mensaje: "El NIT debe contener entre 5 y 15 dígitos numéricos." };
  }
  return { valido: true };
}
