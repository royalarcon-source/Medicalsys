/**
 * Suite de Pruebas Automatizadas para HU-36 (Registrar estado de notificación)
 * y HU-37 (Publicar anuncios)
 */
import { AppDataSource } from "../../config/database";
import { AnuncioService } from "../../services/AnuncioService";
import { NotificacionRepository } from "../../repositories/NotificacionRepository";
import { notificacionService } from "../../services/notificacion.service";
import { hasPermission } from "../../permissions/rolePermissions";
import { Usuario } from "../../entities/Usuario.entity";
import { Rol } from "../../entities/Rol.entity";

async function runTests() {
  console.log("======================================================================");
  console.log("📣 INICIANDO PRUEBAS DE HU-36 (NOTIFICACIONES) Y HU-37 (ANUNCIOS)");
  console.log("======================================================================\n");

  await AppDataSource.initialize();

  // --------------------------------------------------------------------------------
  // PRUEBA 1: Registrar estado válido de una notificación (HU-36)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 1: Registrar transición válida PENDIENTE → ENVIADA ---");
  const usuarioRepo = AppDataSource.getRepository(Usuario);
  const rolRepo = AppDataSource.getRepository(Rol);

  const rolPaciente = await rolRepo.findOne({ where: { nombre: "PACIENTE" } });
  if (!rolPaciente) {
    throw new Error("No existe el rol PACIENTE en la base de datos (ejecuta el seed primero).");
  }
  const usuarioDePrueba = await usuarioRepo.findOne({ where: { rol: { idRol: rolPaciente.idRol } } as any });
  if (!usuarioDePrueba) {
    throw new Error("No existe ningún usuario PACIENTE en la base de datos (ejecuta el seed primero).");
  }

  const notificacionPrueba = await NotificacionRepository.save(
    NotificacionRepository.create({
      usuario: usuarioDePrueba,
      cita: null,
      canal: "WHATSAPP",
      tipo: "PRUEBA_HU36",
      mensaje: "Notificación de prueba HU-36",
      estado: "PENDIENTE",
      fechaProgramada: new Date(),
      fechaEnvio: null,
    })
  );

  const notificacionEnviada = await notificacionService.registrarEstado(notificacionPrueba.idNotificacion, {
    estado: "ENVIADA",
  });
  console.log(`  ✓ Notificación #${notificacionEnviada.idNotificacion} pasó a "${notificacionEnviada.estado}"`);
  if (notificacionEnviada.estado !== "ENVIADA" || !notificacionEnviada.fechaEnvio) {
    throw new Error("La notificación debía quedar ENVIADA con fechaEnvio asignada.");
  }
  console.log("✓ PRUEBA 1 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 2: Rechazo de transición inválida (HU-36)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 2: Rechazo de transición inválida (ENVIADA → PENDIENTE) ---");
  try {
    await notificacionService.registrarEstado(notificacionPrueba.idNotificacion, { estado: "PENDIENTE" as any });
    throw new Error("Se debió rechazar la transición ENVIADA → PENDIENTE.");
  } catch (err: any) {
    if (err.statusCode === 400) {
      console.log("  ✓ Transición inválida rechazada correctamente (400).");
    } else {
      throw err;
    }
  }
  console.log("✓ PRUEBA 2 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 3: Notificación inexistente (HU-36)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 3: Rechazo de registro de estado sobre notificación inexistente ---");
  try {
    await notificacionService.registrarEstado(999999999, { estado: "ENVIADA" });
    throw new Error("Se debió rechazar la notificación inexistente.");
  } catch (err: any) {
    if (err.statusCode === 404) {
      console.log("  ✓ Notificación inexistente detectada correctamente (404).");
    } else {
      throw err;
    }
  }
  console.log("✓ PRUEBA 3 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 4: Un PACIENTE solo ve sus propias notificaciones (HU-36)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 4: Restricción de propiedad al listar notificaciones (PACIENTE) ---");
  const propias = await notificacionService.listar({}, { idUsuario: usuarioDePrueba.idUsuario, rol: "PACIENTE" });
  if (!propias.some((n) => n.idNotificacion === notificacionPrueba.idNotificacion)) {
    throw new Error("El paciente debía poder ver su propia notificación de prueba.");
  }
  if (propias.some((n) => n.usuario.idUsuario !== usuarioDePrueba.idUsuario)) {
    throw new Error("El listado para PACIENTE no debe incluir notificaciones de otros usuarios.");
  }
  console.log(`  ✓ El paciente #${usuarioDePrueba.idUsuario} solo ve sus propias notificaciones (${propias.length}).`);

  try {
    await notificacionService.obtenerPorId(notificacionPrueba.idNotificacion, { idUsuario: 999999, rol: "PACIENTE" });
    throw new Error("Se debió rechazar el acceso de otro paciente a esta notificación.");
  } catch (err: any) {
    if (err.statusCode === 403) {
      console.log("  ✓ Acceso de otro paciente rechazado correctamente (403).");
    } else {
      throw err;
    }
  }
  console.log("✓ PRUEBA 4 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 5: Creación de anuncio válido (HU-37)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 5: Creación de anuncio válido ---");
  const anuncio = await AnuncioService.crear({
    titulo: "Horario especial por feriado",
    contenido: "El centro médico atenderá en horario reducido el próximo feriado.",
  });
  console.log(`  ✓ Anuncio creado: ID ${anuncio.idAnuncio}, estado "${anuncio.estado}"`);
  if (anuncio.estado !== "BORRADOR") {
    throw new Error("Todo anuncio nuevo debe iniciar en estado BORRADOR.");
  }
  console.log("✓ PRUEBA 5 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 6: Rechazo de anuncio sin título (HU-37)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 6: Rechazo de anuncio sin título ---");
  try {
    await AnuncioService.crear({ titulo: "  ", contenido: "Contenido" });
    throw new Error("Se debió rechazar el anuncio sin título.");
  } catch (err: any) {
    if (err.statusCode === 400) {
      console.log("  ✓ Anuncio sin título rechazado correctamente (400).");
    } else {
      throw err;
    }
  }
  console.log("✓ PRUEBA 6 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 7: Publicar anuncio y verificar fecha de publicación (HU-37)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 7: Publicar anuncio (BORRADOR → PUBLICADO) ---");
  const anuncioPublicado = await AnuncioService.cambiarEstado(anuncio.idAnuncio, { estado: "PUBLICADO" });
  console.log(`  ✓ Anuncio publicado, fechaPublicacion=${anuncioPublicado.fechaPublicacion}`);
  if (anuncioPublicado.estado !== "PUBLICADO" || !anuncioPublicado.fechaPublicacion) {
    throw new Error("El anuncio publicado debe quedar en PUBLICADO con fechaPublicacion asignada.");
  }
  console.log("✓ PRUEBA 7 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 8: Rechazo de transición inválida de anuncio (HU-37)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 8: Rechazo de transición inválida (PUBLICADO → BORRADOR) ---");
  try {
    await AnuncioService.cambiarEstado(anuncio.idAnuncio, { estado: "BORRADOR" });
    throw new Error("Se debió rechazar la transición PUBLICADO → BORRADOR.");
  } catch (err: any) {
    if (err.statusCode === 400) {
      console.log("  ✓ Transición inválida rechazada correctamente (400).");
    } else {
      throw err;
    }
  }
  console.log("✓ PRUEBA 8 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 9: Zona de anuncios pública vs. listado administrativo (HU-37)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 9: Listado público solo muestra anuncios publicados y vigentes ---");
  const anuncioBorrador = await AnuncioService.crear({
    titulo: "Borrador sin publicar",
    contenido: "Este anuncio no debe verse en la zona pública.",
  });

  const listadoPublico = await AnuncioService.listar({});
  if (!listadoPublico.some((a) => a.idAnuncio === anuncioPublicado.idAnuncio)) {
    throw new Error("El listado público debía incluir el anuncio publicado.");
  }
  if (listadoPublico.some((a) => a.idAnuncio === anuncioBorrador.idAnuncio)) {
    throw new Error("El listado público no debía incluir un anuncio en BORRADOR.");
  }
  console.log("  ✓ El listado público excluye correctamente los anuncios en BORRADOR.");

  const listadoCompleto = await AnuncioService.listar({ todos: true });
  if (!listadoCompleto.some((a) => a.idAnuncio === anuncioBorrador.idAnuncio)) {
    throw new Error("El listado administrativo (todos=true) debía incluir el anuncio en BORRADOR.");
  }
  console.log("  ✓ El listado administrativo (todos=true) incluye anuncios en cualquier estado.");
  console.log("✓ PRUEBA 9 SUPERADA CON ÉXITO.\n");

  // --------------------------------------------------------------------------------
  // PRUEBA 10: Autorización por rol (HU-36 / HU-37)
  // --------------------------------------------------------------------------------
  console.log("--- PRUEBA 10: Verificación de permisos por rol ---");
  if (!hasPermission("ADMINISTRADOR", "NOTIFICACION_GESTIONAR") || !hasPermission("ADMINISTRADOR", "ANUNCIO_GESTIONAR")) {
    throw new Error("El ADMINISTRADOR debe poder gestionar notificaciones y anuncios.");
  }
  if (!hasPermission("RECEPCIONISTA", "NOTIFICACION_GESTIONAR")) {
    throw new Error("RECEPCIONISTA debe poder gestionar el estado de las notificaciones.");
  }
  if (hasPermission("RECEPCIONISTA", "ANUNCIO_GESTIONAR")) {
    throw new Error("FALLO DE SEGURIDAD: RECEPCIONISTA no debería poder gestionar anuncios.");
  }
  for (const rol of ["MEDICO", "PACIENTE"]) {
    if (hasPermission(rol, "NOTIFICACION_GESTIONAR") || hasPermission(rol, "ANUNCIO_GESTIONAR")) {
      throw new Error(`FALLO DE SEGURIDAD: el rol ${rol} no debería poder gestionar notificaciones/anuncios.`);
    }
    if (!hasPermission(rol, "NOTIFICACION_VER") || !hasPermission(rol, "ANUNCIO_VER")) {
      throw new Error(`El rol ${rol} debería poder ver notificaciones y la zona de anuncios.`);
    }
  }
  console.log("  ✓ Permisos de HU-36/HU-37 correctamente asignados por rol.");
  console.log("✓ PRUEBA 10 SUPERADA CON ÉXITO.\n");

  console.log("======================================================================");
  console.log("🎉 TODAS LAS PRUEBAS DE HU-36 Y HU-37 PASARON AL 100% EXITOSAMENTE");
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
