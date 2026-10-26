/**
 * Suite de Pruebas Automatizadas para HU-32 (Crear campaña) y HU-33 (Crear promoción)
 */
import { AppDataSource } from "../../config/database";
import { CampanaService } from "../../services/CampanaService";
import { PromocionService } from "../../services/PromocionService";
import { hasPermission } from "../../permissions/rolePermissions";

async function runTests() {
  console.log("======================================================================");
  console.log("📣 INICIANDO PRUEBAS DE HU-32 (CAMPAÑAS) Y HU-33 (PROMOCIONES)");
  console.log("======================================================================\n");

  await AppDataSource.initialize();

  // --------------------------------------------------------------------------------
  // PRUEBA 1: Creación de campaña válida (HU-32)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 1: Creación de campaña válida ---");
  const campana = await CampanaService.crear({
    nombre: "Campaña de Vacunación 2026",
    descripcion: "Jornada preventiva de vacunación gratuita",
    fechaInicio: "2026-01-01",
    fechaFin: "2026-12-31",
  });
  console.log(`  ✓ Campaña creada: ID ${campana.idCampana}, estado "${campana.estado}"`);
  if (campana.estado !== "BORRADOR") {
    throw new Error("Toda campaña nueva debe iniciar en estado BORRADOR.");
  }
  console.log("✓ PRUEBA 1 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 2: Validación de datos obligatorios (HU-32)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 2: Rechazo de campaña sin nombre ---");
  try {
    await CampanaService.crear({ nombre: "  ", fechaInicio: "2026-01-01" });
    throw new Error("Se debió rechazar la campaña sin nombre.");
  } catch (err: any) {
    if (err.statusCode === 400) {
      console.log("  ✓ Campaña sin nombre rechazada correctamente (400).");
    } else {
      throw err;
    }
  }
  console.log("✓ PRUEBA 2 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 3: Máquina de estados — transición completa (HU-32)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 3: Transición completa de estados de campaña ---");
  let campanaTransicion = await CampanaService.crear({
    nombre: "Campaña de Salud Cardiovascular",
    fechaInicio: "2026-02-01",
    fechaFin: "2026-06-30",
  });

  campanaTransicion = await CampanaService.cambiarEstado(campanaTransicion.idCampana, { estado: "PROGRAMADA" });
  console.log(`  ✓ BORRADOR → PROGRAMADA: estado actual "${campanaTransicion.estado}"`);

  campanaTransicion = await CampanaService.cambiarEstado(campanaTransicion.idCampana, { estado: "ACTIVA" });
  console.log(`  ✓ PROGRAMADA → ACTIVA: estado actual "${campanaTransicion.estado}"`);

  campanaTransicion = await CampanaService.cambiarEstado(campanaTransicion.idCampana, { estado: "FINALIZADA" });
  console.log(`  ✓ ACTIVA → FINALIZADA: estado actual "${campanaTransicion.estado}"`);

  if (campanaTransicion.estado !== "FINALIZADA") {
    throw new Error("La campaña no llegó al estado FINALIZADA tras la transición completa.");
  }
  console.log("✓ PRUEBA 3 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 4: Transición de estado inválida (HU-32)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 4: Rechazo de transición inválida (FINALIZADA → ACTIVA) ---");
  try {
    await CampanaService.cambiarEstado(campanaTransicion.idCampana, { estado: "ACTIVA" });
    throw new Error("Se debió rechazar la transición FINALIZADA → ACTIVA.");
  } catch (err: any) {
    if (err.statusCode === 400) {
      console.log("  ✓ Transición inválida rechazada correctamente (400).");
    } else {
      throw err;
    }
  }
  console.log("✓ PRUEBA 4 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 5: Creación de promoción asociada a campaña existente (HU-33)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 5: Creación de promoción válida asociada a una campaña ---");
  const promocion = await PromocionService.crear({
    idCampana: campana.idCampana,
    nombre: "20% de descuento en chequeo preventivo",
    descripcion: "Válido durante la jornada de vacunación",
    porcentajeDesc: 20,
    fechaInicio: "2026-03-01",
    fechaFin: "2026-03-31",
  });
  console.log(`  ✓ Promoción creada: ID ${promocion.idPromocion}, activa=${promocion.activa}, %desc=${promocion.porcentajeDesc}`);
  if (!promocion.activa) {
    throw new Error("Toda promoción nueva debe iniciar con activa = true.");
  }
  console.log("✓ PRUEBA 5 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 6: Promoción con campaña inexistente (HU-33)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 6: Rechazo de promoción con campaña inexistente ---");
  try {
    await PromocionService.crear({
      idCampana: 999999,
      nombre: "Promoción huérfana",
      fechaInicio: "2026-03-01",
    });
    throw new Error("Se debió rechazar la promoción con campaña inexistente.");
  } catch (err: any) {
    if (err.statusCode === 404) {
      console.log("  ✓ Campaña inexistente detectada correctamente (404).");
    } else {
      throw err;
    }
  }
  console.log("✓ PRUEBA 6 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 7: Porcentaje de descuento fuera de rango (HU-33)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 7: Rechazo de porcentaje de descuento fuera de rango ---");
  try {
    await PromocionService.crear({
      idCampana: campana.idCampana,
      nombre: "Descuento imposible",
      porcentajeDesc: 150,
      fechaInicio: "2026-03-01",
    });
    throw new Error("Se debió rechazar un porcentaje de descuento de 150%.");
  } catch (err: any) {
    if (err.statusCode === 400) {
      console.log("  ✓ Porcentaje fuera de rango rechazado correctamente (400).");
    } else {
      throw err;
    }
  }
  console.log("✓ PRUEBA 7 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 8: Vigencia de promoción fuera del rango de la campaña (HU-33)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 8: Rechazo de promoción con vigencia fuera del rango de su campaña ---");
  try {
    await PromocionService.crear({
      idCampana: campana.idCampana, // campaña vigente 2026-01-01 a 2026-12-31
      nombre: "Promoción fuera de rango",
      fechaInicio: "2027-01-15",
    });
    throw new Error("Se debió rechazar la promoción con fecha de inicio posterior al fin de la campaña.");
  } catch (err: any) {
    if (err.statusCode === 400) {
      console.log("  ✓ Vigencia fuera de rango rechazada correctamente (400).");
    } else {
      throw err;
    }
  }
  console.log("✓ PRUEBA 8 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 9: Listados con filtros (HU-32 / HU-33)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 9: Listado de campañas y promociones con filtros ---");
  const campanasBorrador = await CampanaService.listar({ estado: "BORRADOR" });
  console.log(`  ✓ Campañas en estado BORRADOR: ${campanasBorrador.length}`);
  if (!campanasBorrador.some((c) => c.idCampana === campana.idCampana)) {
    throw new Error("El filtro por estado BORRADOR no incluyó la campaña esperada.");
  }

  const promocionesDeCampana = await PromocionService.listar({ idCampana: campana.idCampana });
  console.log(`  ✓ Promociones de la campaña ${campana.idCampana}: ${promocionesDeCampana.length}`);
  if (!promocionesDeCampana.some((p) => p.idPromocion === promocion.idPromocion)) {
    throw new Error("El filtro por idCampana no incluyó la promoción esperada.");
  }

  const promocionDesactivada = await PromocionService.cambiarEstado(promocion.idPromocion, { activa: false });
  console.log(`  ✓ Promoción desactivada: activa=${promocionDesactivada.activa}`);
  const promocionesActivas = await PromocionService.listar({ idCampana: campana.idCampana, activa: true });
  if (promocionesActivas.some((p) => p.idPromocion === promocion.idPromocion)) {
    throw new Error("El filtro por activa=true no debió incluir la promoción recién desactivada.");
  }
  console.log("  ✓ Filtro por activa=true excluye correctamente la promoción desactivada.");
  console.log("✓ PRUEBA 9 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 10: Autorización por rol (HU-32 / HU-33)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 10: Verificación de permisos por rol ---");
  if (!hasPermission("ADMINISTRADOR", "CAMPANA_GESTIONAR") || !hasPermission("ADMINISTRADOR", "PROMOCION_GESTIONAR")) {
    throw new Error("El ADMINISTRADOR debe tener permiso de gestión sobre campañas y promociones.");
  }
  console.log("  ✓ ADMINISTRADOR tiene CAMPANA_GESTIONAR y PROMOCION_GESTIONAR.");

  for (const rol of ["MEDICO", "RECEPCIONISTA", "PACIENTE"]) {
    if (hasPermission(rol, "CAMPANA_GESTIONAR") || hasPermission(rol, "PROMOCION_GESTIONAR")) {
      throw new Error(`FALLO DE SEGURIDAD: el rol ${rol} no debería poder gestionar campañas/promociones.`);
    }
    if (!hasPermission(rol, "CAMPANA_VER") || !hasPermission(rol, "PROMOCION_VER")) {
      throw new Error(`El rol ${rol} debería poder ver la zona de anuncios (campañas/promociones).`);
    }
  }
  console.log("  ✓ MEDICO, RECEPCIONISTA y PACIENTE solo tienen permiso de lectura (VER), sin gestión.");
  console.log("✓ PRUEBA 10 SUPERADA CON ÉXITO.\n");

  console.log("======================================================================");
  console.log("🎉 TODAS LAS PRUEBAS DE HU-32 Y HU-33 PASARON AL 100% EXITOSAMENTE");
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
