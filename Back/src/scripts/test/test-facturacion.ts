import { AppDataSource } from "../../config/database";
import { FacturaService } from "../../services/FacturaService";
import { ServicioService } from "../../services/ServicioService";
import { PacienteRepository } from "../../repositories/PacienteRepository";

async function testFacturacion() {
  console.log("=== INICIANDO PRUEBAS DE FACTURACIÓN (AR-32) ===");
  await AppDataSource.initialize();

  // 1. Obtener un paciente de prueba
  const pacientes = await PacienteRepository.find({ relations: { usuario: true }, take: 1 });
  if (!pacientes.length) {
    throw new Error("No hay pacientes en la base de datos para realizar la prueba.");
  }
  const paciente = pacientes[0];
  console.log(`✓ Paciente de prueba: ID ${paciente.idPaciente} (${paciente.usuario?.nombres} ${paciente.usuario?.apellidos})`);

  // 2. Obtener servicios activos
  const servicios = await ServicioService.listar();
  if (servicios.length < 2) {
    throw new Error("Se requieren al menos 2 servicios en la base de datos.");
  }
  console.log(`✓ Servicios disponibles: ${servicios.length} ítems`);
  const s1 = servicios[0];
  const s2 = servicios[1];

  // 3. Emitir Factura 1: Servicios múltiples sin descuento
  console.log("\n--- Prueba 1: Emisión sin descuento ---");
  const factura1 = await FacturaService.emitir({
    idPaciente: paciente.idPaciente,
    nitCliente: "87654321",
    razonSocial: "Clínica Privada Demo S.R.L.",
    items: [
      { idServicio: s1.idServicio, cantidad: 1 },
      { idServicio: s2.idServicio, cantidad: 2 },
    ],
  });

  const esperadoSubtotal1 = Number((Number(s1.precio) * 1 + Number(s2.precio) * 2).toFixed(2));
  console.log(`  Número Factura: ${factura1.numeroFactura}`);
  console.log(`  Subtotal: ${factura1.subtotal} Bs (Esperado: ${esperadoSubtotal1})`);
  console.log(`  Total: ${factura1.total} Bs (Esperado: ${esperadoSubtotal1})`);
  console.log(`  Estado: ${factura1.estado}`);
  console.log(`  Código Control: ${factura1.codigoControl}`);

  if (Number(factura1.total) !== esperadoSubtotal1) {
    throw new Error(`Error en cálculo de total: obtenido ${factura1.total}, esperado ${esperadoSubtotal1}`);
  }
  console.log("✓ Prueba 1 superada con éxito.");

  // 4. Emitir Factura 2: Con 10% de descuento porcentual
  console.log("\n--- Prueba 2: Emisión con 10% de descuento ---");
  const factura2 = await FacturaService.emitir({
    idPaciente: paciente.idPaciente,
    nitCliente: "12345678",
    razonSocial: "Juan Pérez",
    items: [
      { idServicio: s1.idServicio, cantidad: 2 },
    ],
    porcentajeDescuento: 10,
    estado: "PAGADA",
  });

  const subtotal2 = Number((Number(s1.precio) * 2).toFixed(2));
  const esperadoTotal2 = Number((subtotal2 * 0.9).toFixed(2));
  console.log(`  Número Factura: ${factura2.numeroFactura}`);
  console.log(`  Subtotal: ${factura2.subtotal} Bs`);
  console.log(`  Total con 10% desc: ${factura2.total} Bs (Esperado: ${esperadoTotal2})`);
  console.log(`  Estado: ${factura2.estado}`);

  if (Number(factura2.total) !== esperadoTotal2) {
    throw new Error(`Error en cálculo con descuento: obtenido ${factura2.total}, esperado ${esperadoTotal2}`);
  }
  console.log("✓ Prueba 2 superada con éxito.");

  // 5. Verificar correlatividad
  console.log("\n--- Prueba 3: Verificación de correlativo ---");
  console.log(`  Factura 1: ${factura1.numeroFactura}`);
  console.log(`  Factura 2: ${factura2.numeroFactura}`);
  const num1 = parseInt(factura1.numeroFactura!.split("-")[2], 10);
  const num2 = parseInt(factura2.numeroFactura!.split("-")[2], 10);
  if (num2 !== num1 + 1) {
    throw new Error(`Correlativo inválido: ${factura1.numeroFactura} seguido de ${factura2.numeroFactura}`);
  }
  console.log("✓ Correlativo secuencial verificado.");

  // 6. Consultar detalle de factura con ítems
  console.log("\n--- Prueba 4: Consulta de detalle de factura ---");
  const detalleFactura = await FacturaService.obtenerPorId(factura1.idFactura);
  console.log(`  Factura consultada: ${detalleFactura.numeroFactura}`);
  console.log(`  Paciente: ${detalleFactura.paciente?.usuario?.nombres} ${detalleFactura.paciente?.usuario?.apellidos}`);
  console.log(`  Ítems encontrados: ${detalleFactura.detalles?.length}`);
  if (!detalleFactura.detalles || detalleFactura.detalles.length !== 2) {
    throw new Error("No se cargaron los detalles de la factura correctamente.");
  }
  console.log("✓ Consulta de detalle verificada.");

  // 7. Listado de facturas
  console.log("\n--- Prueba 5: Listado con filtros ---");
  const listado = await FacturaService.listar({ idPaciente: paciente.idPaciente });
  console.log(`  Facturas encontradas para el paciente: ${listado.length}`);
  if (listado.length < 2) {
    throw new Error("El listado filtrado no devolvió las facturas emitidas.");
  }
  console.log("✓ Listado verificado.");

  console.log("\n=======================================================");
  console.log("🎉 TODAS LAS PRUEBAS DE FACTURACIÓN (AR-32) PASARON EXITOSAMENTE");
  console.log("=======================================================");

  await AppDataSource.destroy();
}

testFacturacion().catch(async (err) => {
  console.error("💥 Error en pruebas de facturación:", err);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
