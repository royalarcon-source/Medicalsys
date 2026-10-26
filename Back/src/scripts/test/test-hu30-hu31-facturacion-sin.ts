/**
 * Suite de Pruebas Automatizadas para HU-30 (Consultar Facturas) y HU-31 (Integración con SIN de Bolivia)
 */
import { AppDataSource } from "../../config/database";
import { FacturaService } from "../../services/FacturaService";
import { ServicioService } from "../../services/ServicioService";
import { SinIntegrationService } from "../../services/SinIntegrationService";
import { PacienteRepository } from "../../repositories/PacienteRepository";
import {
  calcularDigitoVerhoeff,
  generarDigitosVerhoeff,
  allegedRC4,
  generarCodigoControl,
  generarCadenaQR,
  validarNITBolivia,
} from "../../utils/sinFacturacion";

async function runTests() {
  console.log("======================================================================");
  console.log("🏥 INICIANDO PRUEBAS DE HU-30 (CONSULTAR FACTURAS) Y HU-31 (SIN BOLIVIA)");
  console.log("======================================================================\n");

  await AppDataSource.initialize();

  // --------------------------------------------------------------------------------
  // PRUEBA 1: Algoritmos matemáticos y criptográficos del SIN
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 1: Validación de algoritmos oficiales del SIN (Verhoeff y AllegedRC4) ---");

  // Verhoeff para número conocido
  const digito1 = calcularDigitoVerhoeff("12345");
  console.log(`  ✓ Dígito Verhoeff para '12345': ${digito1}`);
  if (typeof digito1 !== "number" || isNaN(digito1)) {
    throw new Error("El cálculo de dígito Verhoeff falló.");
  }

  const verhoeff5 = generarDigitosVerhoeff("12345", 2);
  console.log(`  ✓ Cadena con 2 dígitos Verhoeff: ${verhoeff5} (Longitud: ${verhoeff5.length})`);
  if (verhoeff5.length !== 7) {
    throw new Error("Generación de múltiples dígitos Verhoeff incorrecta.");
  }

  // AllegedRC4
  const cifradoRC4 = allegedRC4("PruebaMedicalSys", "ClaveSecreta123");
  console.log(`  ✓ Cifrado AllegedRC4: ${cifradoRC4}`);
  if (!/^[0-9A-F]+$/.test(cifradoRC4)) {
    throw new Error("AllegedRC4 debe retornar una cadena hexadecimal en mayúsculas.");
  }

  // Código de Control oficial
  const codigoControlPrueba = generarCodigoControl({
    numeroAutorizacion: "29040011007",
    numeroFactura: "1503",
    nitCliente: "4189468011",
    fechaEmision: new Date(2007, 6, 2), // 20070702
    montoTotal: 2500,
    llaveDosificacion: "9rBda?zkgb2&AjFUy7P%ah9A&DocumentacionMedicalSysBolivia2026",
  });
  console.log(`  ✓ Código de Control generado: ${codigoControlPrueba}`);
  if (!/^[0-9A-F]{2}(-[0-9A-F]{2})+$/.test(codigoControlPrueba)) {
    throw new Error(`Formato de Código de Control inválido: ${codigoControlPrueba}`);
  }

  // Cadena QR Normativa del SIN
  const cadenaQR = generarCadenaQR({
    nitEmisor: "1029384756",
    numeroFactura: "1503",
    numeroAutorizacion: "29040011007",
    fechaEmision: new Date(2026, 8, 6),
    totalBs: 2500.5,
    codigoControl: codigoControlPrueba,
    nitCliente: "4189468011",
    descuento: 0,
  });
  console.log(`  ✓ Cadena QR Normativo: ${cadenaQR}`);
  const partesQR = cadenaQR.split("|");
  if (partesQR.length !== 12 || partesQR[0] !== "1029384756" || partesQR[6] !== codigoControlPrueba) {
    throw new Error(`Formato de Cadena QR inválido según norma SIN: ${cadenaQR}`);
  }
  console.log("✓ PRUEBA 1 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 2: Validación de NIT boliviano
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 2: Validación de NIT y Documento de Identidad boliviano ---");
  const nitValido = validarNITBolivia("1029384756");
  const nitCero = validarNITBolivia("0");
  const nitInvalido = validarNITBolivia("ABC123");

  if (!nitValido.valido || !nitCero.valido || nitInvalido.valido) {
    throw new Error("Fallo en la validación de NIT.");
  }
  console.log("  ✓ Validación de NIT correcta (soporta NITs válidos, 0 para sin NIT y rechaza no numéricos).");
  console.log("✓ PRUEBA 2 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 3: Emisión con integración SIN (HU-31)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 3: Emisión de factura con Código de Control y metadatos SIN ---");
  const pacientes = await PacienteRepository.find({ relations: { usuario: true }, take: 2 });
  if (pacientes.length < 1) {
    throw new Error("Se requiere al menos 1 paciente en la base de datos.");
  }
  const paciente1 = pacientes[0];
  let servicios = await ServicioService.listar();
  if (servicios.length === 0) {
    const nuevoServ = await ServicioService.crear({
      nombre: "Consulta Médica General",
      descripcion: "Atención y diagnóstico médico inicial",
      precio: 150.0,
    });
    servicios = [nuevoServ];
  }
  const serv = servicios[0];

  const facturaEmitida = await FacturaService.emitir({
    idPaciente: paciente1.idPaciente,
    nitCliente: "87654321",
    razonSocial: "Empresa de Servicios Médicos S.A.",
    items: [{ idServicio: serv.idServicio, cantidad: 2 }],
    porcentajeDescuento: 5,
    estado: "EMITIDA",
  });

  console.log(`  ✓ Factura N°: ${facturaEmitida.numeroFactura}`);
  console.log(`  ✓ Subtotal: ${facturaEmitida.subtotal} Bs | Total: ${facturaEmitida.total} Bs`);
  console.log(`  ✓ Código de Control SIN: ${facturaEmitida.codigoControl}`);
  console.log(`  ✓ Estado: ${facturaEmitida.estado}`);

  if (!facturaEmitida.codigoControl || !/^[0-9A-F]{2}(-[0-9A-F]{2})+$/.test(facturaEmitida.codigoControl)) {
    throw new Error("La factura emitida no tiene un Código de Control válido del SIN.");
  }
  console.log("✓ PRUEBA 3 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 4: Consulta de Factura por ID con metadatos SIN (HU-30 y HU-31)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 4: Consulta individual de factura por ID con datos fiscales enriquecidos ---");
  const facturaConsultada = await FacturaService.obtenerPorId(facturaEmitida.idFactura);

  console.log(`  ✓ ID consultado: ${facturaConsultada.idFactura}`);
  console.log(`  ✓ Razón Social: ${facturaConsultada.razonSocial}`);
  console.log(`  ✓ Detalles cargados: ${facturaConsultada.detalles?.length} ítems`);
  console.log(`  ✓ NIT Emisor SIN: ${facturaConsultada.datosFiscalesSIN?.nitEmisor}`);
  console.log(`  ✓ N° Autorización SIN: ${facturaConsultada.datosFiscalesSIN?.numeroAutorizacion}`);
  console.log(`  ✓ Cadena QR generada: ${facturaConsultada.datosFiscalesSIN?.cadenaQR}`);
  console.log(`  ✓ Leyenda de Ley: ${facturaConsultada.datosFiscalesSIN?.leyendaLey}`);

  if (!facturaConsultada.datosFiscalesSIN?.cadenaQR || !facturaConsultada.datosFiscalesSIN?.numeroAutorizacion) {
    throw new Error("La consulta por ID no incluyó los metadatos fiscales del SIN.");
  }
  console.log("✓ PRUEBA 4 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 5: Filtros avanzados de listado (HU-30)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 5: Listado de facturas con filtros avanzados ---");

  // 5.1 Filtro por paciente
  const listadoPorPaciente = await FacturaService.listar({ idPaciente: paciente1.idPaciente });
  console.log(`  ✓ Facturas por paciente (${paciente1.idPaciente}): ${listadoPorPaciente.length}`);
  if (listadoPorPaciente.length === 0) {
    throw new Error("El filtro por paciente no retornó resultados.");
  }

  // 5.2 Filtro por NIT
  const listadoPorNIT = await FacturaService.listar({ nitCliente: "87654321" });
  console.log(`  ✓ Facturas por NIT '87654321': ${listadoPorNIT.length}`);
  if (listadoPorNIT.length === 0) {
    throw new Error("El filtro por NIT no retornó resultados.");
  }

  // 5.3 Filtro por término de búsqueda (número o razón social)
  const listadoPorBusqueda = await FacturaService.listar({ busqueda: "Empresa de Servicios" });
  console.log(`  ✓ Facturas por búsqueda 'Empresa de Servicios': ${listadoPorBusqueda.length}`);
  if (listadoPorBusqueda.length === 0) {
    throw new Error("El filtro por término de búsqueda no retornó resultados.");
  }

  // 5.4 Filtro por estado
  const listadoPorEstado = await FacturaService.listar({ estado: "EMITIDA" });
  console.log(`  ✓ Facturas con estado 'EMITIDA': ${listadoPorEstado.length}`);
  if (listadoPorEstado.length === 0) {
    throw new Error("El filtro por estado no retornó resultados.");
  }
  console.log("✓ PRUEBA 5 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 6: Seguridad e IDOR para rol PACIENTE (HU-30)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 6: Validación de permisos y protección IDOR para rol PACIENTE ---");
  if (paciente1.usuario) {
    // Consulta permitida de su propia factura
    const resPropia = await FacturaService.obtenerPorId(facturaEmitida.idFactura, {
      idUsuario: paciente1.usuario.idUsuario,
      rol: "PACIENTE",
    });
    console.log(`  ✓ Paciente consultó su propia factura correctamente: ${resPropia.numeroFactura}`);

    // Consulta rechazada si intenta ver factura ajena
    try {
      await FacturaService.obtenerPorId(facturaEmitida.idFactura, {
        idUsuario: paciente1.usuario.idUsuario + 9999, // Otro usuario
        rol: "PACIENTE",
      });
      throw new Error("FALLO DE SEGURIDAD: Un paciente pudo consultar una factura que no le pertenece.");
    } catch (err: any) {
      if (err.status === 403) {
        console.log("  ✓ IDOR bloqueado correctamente (HTTP 403 al intentar acceder a factura ajena).");
      } else {
        throw err;
      }
    }
  }
  console.log("✓ PRUEBA 6 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 7: Anulación de Factura con reporte al SIN (HU-31)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 7: Anulación de factura ante el SIN ---");
  const resultadoAnulacion = await FacturaService.anularFactura(
    facturaEmitida.idFactura,
    "Error en datos fiscales del cliente",
    { idUsuario: 1, rol: "ADMINISTRADOR" }
  );

  console.log(`  ✓ Mensaje de anulación: ${resultadoAnulacion.mensaje}`);
  console.log(`  ✓ Nuevo estado en base de datos: ${resultadoAnulacion.factura.estado}`);

  if (resultadoAnulacion.factura.estado !== "ANULADA") {
    throw new Error("El estado de la factura no cambió a ANULADA.");
  }

  // Intentar re-anular (debe fallar)
  try {
    await FacturaService.anularFactura(
      facturaEmitida.idFactura,
      "Intento duplicado",
      { idUsuario: 1, rol: "ADMINISTRADOR" }
    );
    throw new Error("No se debe permitir re-anular una factura que ya está anulada.");
  } catch (err: any) {
    if (err.status === 400) {
      console.log("  ✓ Bloqueo de re-anulación verificado correctamente (HTTP 400).");
    } else {
      throw err;
    }
  }
  console.log("✓ PRUEBA 7 SUPERADA CON ÉXITO.\n");

  console.log("======================================================================");
  console.log("🎉 TODAS LAS PRUEBAS DE HU-30 Y HU-31 PASARON AL 100% EXITOSAMENTE");
  console.log("======================================================================");

  await AppDataSource.destroy();
}

runTests().catch(async (err) => {
  console.error("💥 Error en ejecución de pruebas:", err);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
