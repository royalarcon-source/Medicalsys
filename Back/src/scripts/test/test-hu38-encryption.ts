/**
 * Script de Pruebas de Cifrado AES-256-GCM para HU-38 (Cifrar información sensible)
 */
import { encrypt, decrypt, encryptionTransformer } from "../../utils/encryption";

async function runEncryptionTests() {
  console.log("======================================================================");
  console.log("🔒 INICIANDO PRUEBAS DE CIFRADO Y TRANSFORMER (HU-38)");
  console.log("======================================================================\n");

  const textoPrueba = "Paciente con antecedentes de hipertensión arterial y alergia a la penicilina.";

  // 1. Cifrado formato iv:authTag:ciphertext
  console.log("--- PRUEBA 1: Cifrado con AES-256-GCM ---");
  const cifrado = encrypt(textoPrueba);
  if (!cifrado || cifrado === textoPrueba) {
    throw new Error("El texto no fue cifrado correctamente.");
  }
  const partes = cifrado.split(":");
  if (partes.length !== 3 || partes[0].length !== 24 || partes[1].length !== 32) {
    throw new Error(`El formato del hash cifrado es incorrecto. Obtenido: ${cifrado}`);
  }
  console.log(`  ✓ Texto cifrado con formato iv:tag:cipher → ${cifrado.substring(0, 40)}...`);
  console.log("  ✓ PRUEBA 1 SUPERADA.\n");

  // 2. Descifrado correcto
  console.log("--- PRUEBA 2: Descifrado a texto plano original ---");
  const descifrado = decrypt(cifrado);
  if (descifrado !== textoPrueba) {
    throw new Error(`El texto descifrado no coincide. Esperado: "${textoPrueba}", Obtenido: "${descifrado}"`);
  }
  console.log(`  ✓ Texto descifrado idéntico al original: "${descifrado}"`);
  console.log("  ✓ PRUEBA 2 SUPERADA.\n");

  // 3. Resiliencia a datos legados en texto plano
  console.log("--- PRUEBA 3: Resiliencia ante datos legados en texto plano ---");
  const textoPlanoLegado = "Av. 6 de Agosto #123";
  const descifradoLegado = decrypt(textoPlanoLegado);
  if (descifradoLegado !== textoPlanoLegado) {
    throw new Error("El descifrado de texto plano legado debió retornar el texto sin cambios.");
  }
  console.log(`  ✓ Texto plano legado leído correctamente sin errores: "${descifradoLegado}"`);
  console.log("  ✓ PRUEBA 3 SUPERADA.\n");

  // 4. Manejo de nulos y vacíos
  console.log("--- PRUEBA 4: Manejo de null / undefined / cadenas vacías ---");
  if (encrypt(null) !== null || decrypt(null) !== null) {
    throw new Error("Fallo en manejo de null");
  }
  if (encrypt(undefined) !== undefined || decrypt(undefined) !== undefined) {
    throw new Error("Fallo en manejo de undefined");
  }
  if (encrypt("") !== "" || decrypt("") !== "") {
    throw new Error("Fallo en manejo de cadena vacía");
  }
  console.log("  ✓ Manejo de null/undefined/vacíos correcto.");
  console.log("  ✓ PRUEBA 4 SUPERADA.\n");

  // 5. TypeORM ValueTransformer
  console.log("--- PRUEBA 5: TypeORM ValueTransformer to() y from() ---");
  const valorDirecto = "Contacto Emergencia: Juan Pérez 77712345";
  const transformadoTo = encryptionTransformer.to(valorDirecto);
  if (typeof transformadoTo !== "string" || transformadoTo.includes("Juan Pérez")) {
    throw new Error("ValueTransformer.to no cifró el contenido.");
  }
  const transformadoFrom = encryptionTransformer.from(transformadoTo);
  if (transformadoFrom !== valorDirecto) {
    throw new Error(`ValueTransformer.from no restauró el valor original. Obtenido: ${transformadoFrom}`);
  }
  console.log(`  ✓ ValueTransformer.to() cifró el dato`);
  console.log(`  ✓ ValueTransformer.from() restauró el dato original: "${transformadoFrom}"`);
  console.log("  ✓ PRUEBA 5 SUPERADA.\n");

  console.log("======================================================================");
  console.log("🎉 TODAS LAS PRUEBAS DE CIFRADO DE HU-38 PASARON EXITOSAMENTE");
  console.log("======================================================================");
}

runEncryptionTests().catch((err) => {
  console.error("💥 Error en pruebas de cifrado:", err);
  process.exit(1);
});
