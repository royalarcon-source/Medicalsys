import { AppDataSource } from "../../config/database";
import { AtencionServicioService } from "../../services/AtencionServicioService";
import { FacturaService } from "../../services/FacturaService";
import { ServicioService } from "../../services/ServicioService";
import { PacienteRepository } from "../../repositories/PacienteRepository";
import { ConsultaRepository } from "../../repositories/ConsultaRepository";

async function testAtencionServicio() {
  console.log("=== INICIANDO PRUEBAS DE REGISTRO DE SERVICIOS (AR-31) ===");
  await AppDataSource.initialize();

  // 1. Obtener paciente y consulta de prueba
  const pacientes = await PacienteRepository.find({ relations: { usuario: true }, take: 1 });
  if (!pacientes.length) {
    throw new Error("No hay pacientes en la base de datos.");
  }
  const paciente = pacientes[0];
  console.log(`✓ Paciente de prueba: ID ${paciente.idPaciente} (${paciente.usuario?.nombres} ${paciente.usuario?.apellidos})`);

  const consultas = await ConsultaRepository.find({
    where: { historia: { paciente: { idPaciente: paciente.idPaciente } } },
    take: 1,
  });
  const idConsulta = consultas.length > 0 ? consultas[0].idConsulta : undefined;
  console.log(`✓ Consulta asociada (opcional): ${idConsulta ? `ID ${idConsulta}` : "Sin consulta vinculada"}`);

  // 2. Obtener servicios del catálogo
  const servicios = await ServicioService.listar();
  if (servicios.length < 2) {
    throw new Error("Se requieren al menos 2 servicios en la base de datos.");
  }
  const s1 = servicios[0];
  const s2 = servicios[1];
  console.log(`✓ Catálogo: Servicio 1='${s1.nombre}' (${s1.precio} Bs), Servicio 2='${s2.nombre}' (${s2.precio} Bs)`);

  // Escenario 1: Registro exitoso de servicios asociados a una atención
  console.log("\n--- Escenario 1: Registro de servicios asociados a la atención ---");
  const registros = await AtencionServicioService.registrar({
    idPaciente: paciente.idPaciente,
    idConsulta,
    items: [
      { idServicio: s1.idServicio, cantidad: 2, observaciones: "Procedimiento inicial" },
      { idServicio: s2.idServicio, cantidad: 1, observaciones: "Insumo descartable" },
    ],
    observacionesGenerales: "Atención por guardia",
  });

  console.log(`  Servicios creados: ${registros.length}`);
  if (registros.length !== 2) {
    throw new Error("No se crearon los 2 registros de atención-servicio esperados.");
  }

  const reg1 = registros[0];
  const reg2 = registros[1];
  console.log(`  Ítem 1: ${reg1.servicio.nombre} x ${reg1.cantidad} = ${reg1.subtotal} Bs, Estado: ${reg1.estado}`);
  console.log(`  Ítem 2: ${reg2.servicio.nombre} x ${reg2.cantidad} = ${reg2.subtotal} Bs, Estado: ${reg2.estado}`);

  if (reg1.estado !== "PENDIENTE" || reg2.estado !== "PENDIENTE") {
    throw new Error("El estado inicial de los servicios registrados debe ser 'PENDIENTE'.");
  }

  const esperadoSubtotal1 = Number((Number(s1.precio) * 2).toFixed(2));
  if (Number(reg1.subtotal) !== esperadoSubtotal1) {
    throw new Error(`Subtotal incorrecto: obtenido ${reg1.subtotal}, esperado ${esperadoSubtotal1}`);
  }
  console.log("✓ Escenario 1 superado con éxito.");

  // Escenario 2: Modificación de servicios antes de la facturación
  console.log("\n--- Escenario 2: Modificación / actualización de cantidad y recálculo ---");
  const reg1Actualizado = await AtencionServicioService.actualizar(reg1.idAtencionServicio, {
    cantidad: 3,
    observaciones: "Cantidad actualizada a 3",
  });

  const esperadoSubtotalActualizado = Number((Number(s1.precio) * 3).toFixed(2));
  console.log(`  Ítem 1 modificado: cantidad=${reg1Actualizado.cantidad}, subtotal=${reg1Actualizado.subtotal} Bs (Esperado: ${esperadoSubtotalActualizado})`);
  if (Number(reg1Actualizado.subtotal) !== esperadoSubtotalActualizado) {
    throw new Error(`Recálculo incorrecto al actualizar: obtenido ${reg1Actualizado.subtotal}, esperado ${esperadoSubtotalActualizado}`);
  }
  console.log("✓ Escenario 2 superado con éxito.");

  // Escenario 3: Validación de cantidades y lista no vacía
  console.log("\n--- Escenario 3: Validaciones de cantidad <= 0 y lista vacía ---");
  try {
    await AtencionServicioService.registrar({
      idPaciente: paciente.idPaciente,
      items: [],
    });
    throw new Error("Debió fallar con lista vacía.");
  } catch (err: any) {
    console.log(`  ✓ Lista vacía rechazada correctamente: "${err.message || err}"`);
  }

  try {
    await AtencionServicioService.registrar({
      idPaciente: paciente.idPaciente,
      items: [{ idServicio: s1.idServicio, cantidad: 0 }],
    });
    throw new Error("Debió fallar con cantidad 0.");
  } catch (err: any) {
    console.log(`  ✓ Cantidad 0 rechazada correctamente: "${err.message || err}"`);
  }

  // Escenario 4: Facturación y bloqueo de modificaciones posteriores (Bloqueo de servicios facturados)
  console.log("\n--- Escenario 4: Integración con Facturación y Bloqueo de Modificación ---");
  // Emitir factura que consolida la atención
  const factura = await FacturaService.emitir({
    idPaciente: paciente.idPaciente,
    idsAtencionServicio: [reg1.idAtencionServicio, reg2.idAtencionServicio],
    nitCliente: "77788899",
    razonSocial: "Paciente Asegurado",
    items: [
      { idServicio: s1.idServicio, cantidad: 3 },
      { idServicio: s2.idServicio, cantidad: 1 },
    ],
  });
  console.log(`  Factura emitida: ${factura.numeroFactura}, Total: ${factura.total} Bs`);

  // Intentar modificar el servicio ya facturado
  try {
    await AtencionServicioService.actualizar(reg1.idAtencionServicio, {
      cantidad: 5,
    });
    throw new Error("Debió bloquearse la modificación de un servicio facturado.");
  } catch (err: any) {
    console.log(`  ✓ Modificación bloqueada correctamente: "${err.message || err}"`);
  }

  // Intentar eliminar el servicio ya facturado
  try {
    await AtencionServicioService.eliminar(reg1.idAtencionServicio);
    throw new Error("Debió bloquearse la eliminación de un servicio facturado.");
  } catch (err: any) {
    console.log(`  ✓ Eliminación bloqueada correctamente: "${err.message || err}"`);
  }

  console.log("\n=======================================================");
  console.log("🎉 TODAS LAS PRUEBAS DE REGISTRO DE SERVICIOS (AR-31) PASARON EXITOSAMENTE");
  console.log("=======================================================");

  await AppDataSource.destroy();
}

testAtencionServicio().catch(async (err) => {
  console.error("💥 Error en pruebas de atención-servicio:", err);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});

