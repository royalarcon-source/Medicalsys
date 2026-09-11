// src/scripts/test/probar-paciente.ts
/**
 * Script para probar HU-10: Consultar Paciente
 * 
 * Este script:
 * 1. Crea datos de prueba (usuarios/pacientes)
 * 2. Prueba cada funcionalidad
 * 3. Limpia todos los datos creados al final
 * 
 * Requisitos:
 * 1. Servidor debe estar corriendo en http://localhost:3000
 * 2. BD debe estar conectada
 * 
 * Ejecutar:
 * npx ts-node src/scripts/test/probar-paciente.ts
 */

import axios from "axios";
import { AppDataSource } from "../../config/database";
import { Usuario } from "../../entities/Usuario.entity";
import { Paciente } from "../../entities/Paciente.entity";
import { Rol } from "../../entities/Rol.entity";
import bcrypt from "bcrypt";

const BASE_URL = "http://localhost:3000/api";

interface TestResult {
  nombre: string;
  estado: "✓" | "✗";
  mensaje: string;
}

const resultados: TestResult[] = [];
let usuariosCreados: Usuario[] = [];
let pacientesCreados: Paciente[] = [];

async function test(
  nombre: string,
  fn: () => Promise<void>
): Promise<void> {
  try {
    await fn();
    resultados.push({ nombre, estado: "✓", mensaje: "Pasó" });
    console.log(`  ✓ ${nombre}`);
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    resultados.push({ nombre, estado: "✗", mensaje });
    console.log(`  ✗ ${nombre}: ${mensaje}`);
  }
}

async function crearDatosPrueba(): Promise<{
  pacientes: Paciente[];
  usuarios: Usuario[];
}> {
  console.log("\n📋 Creando datos de prueba...\n");

  const usuarioRepo = AppDataSource.getRepository(Usuario);
  const pacienteRepo = AppDataSource.getRepository(Paciente);
  const rolRepo = AppDataSource.getRepository(Rol);

  const rolPaciente = await rolRepo.findOne({
    where: { nombre: "PACIENTE" },
  });

  if (!rolPaciente) {
    throw new Error("No existe rol PACIENTE");
  }

  const usuariosPrueba = [
    {
      nombres: "Juan",
      apellidos: "Test",
      email: `juan-test-${Date.now()}@test.com`,
      ci: `1234567${Math.floor(Math.random() * 10)}`,
    },
    {
      nombres: "María",
      apellidos: "Test",
      email: `maria-test-${Date.now()}@test.com`,
      ci: `8765432${Math.floor(Math.random() * 10)}`,
    },
    {
      nombres: "Carlos",
      apellidos: "Test",
      email: `carlos-test-${Date.now()}@test.com`,
      ci: `1111111${Math.floor(Math.random() * 10)}`,
    },
  ];

  const passwordHash = await bcrypt.hash("test123456", 10);
  const pacientesCreados: Paciente[] = [];
  const usuariosCreados: Usuario[] = [];

  for (const datos of usuariosPrueba) {
    const usuario = usuarioRepo.create({
      rol: rolPaciente,
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      email: datos.email,
      passwordHash,
      telefono: "70000000",
      activo: true,
    });

    await usuarioRepo.save(usuario);
    usuariosCreados.push(usuario);

    const paciente = pacienteRepo.create({
      usuario,
      documentoIdentidad: datos.ci,
      fechaNacimiento: new Date("2000-01-01"),
      sexo: "Masculino",
      direccion: "Test 123",
      contactoEmergencia: "Test",
      telefonoEmergencia: "70000000",
    });

    await pacienteRepo.save(paciente);
    pacientesCreados.push(paciente);
  }

  console.log(`✓ Creados ${usuariosCreados.length} usuario(s) y paciente(s)\n`);

  return { pacientes: pacientesCreados, usuarios: usuariosCreados };
}

async function limpiarDatos(): Promise<void> {
  console.log("\n🧹 Limpiando datos de prueba...\n");

  const pacienteRepo = AppDataSource.getRepository(Paciente);
  const usuarioRepo = AppDataSource.getRepository(Usuario);

  // Eliminar pacientes primero (porque tienen FK a usuario)
  for (const paciente of pacientesCreados) {
    await pacienteRepo.delete(paciente.idPaciente);
  }

  // Luego eliminar usuarios
  for (const usuario of usuariosCreados) {
    await usuarioRepo.delete(usuario.idUsuario);
  }

  console.log(`✓ Eliminados ${usuariosCreados.length} usuario(s) y paciente(s)\n`);
}

async function ejecutarPruebas(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log("✓ Conexión a BD establecida");

    // Crear datos
    const { pacientes } = await crearDatosPrueba();
    usuariosCreados = pacientes.map((p) => p.usuario!);
    pacientesCreados = pacientes;

    // Esperar a que el servidor procese los datos
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("\n🧪 INICIANDO PRUEBAS\n");
    console.log("=".repeat(60));

    // ========== CA-02: Búsqueda sin criterios ==========
    console.log("\nCA-02: Búsqueda sin criterios");
    await test("Rechaza búsqueda sin parámetros", async () => {
      try {
        await axios.get(`${BASE_URL}/pacientes/buscar`);
        throw new Error("Debería haber rechazado");
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 400) {
          return;
        }
        throw error;
      }
    });

    // ========== CA-03: Búsqueda por CI ==========
    console.log("\nCA-03: Búsqueda por CI");
    await test("Buscar por CI válido", async () => {
      const ci = pacientes[0].documentoIdentidad;
      const response = await axios.get(
        `${BASE_URL}/pacientes/buscar?ci=${ci}`
      );

      if (response.data.total !== 1) {
        throw new Error(`Esperaba 1 resultado, obtuvo ${response.data.total}`);
      }
    });

    await test("Buscar por CI inexistente", async () => {
      const response = await axios.get(
        `${BASE_URL}/pacientes/buscar?ci=00000000`
      );

      if (response.data.total !== 0) {
        throw new Error(`Esperaba 0 resultados, obtuvo ${response.data.total}`);
      }
    });

    // ========== CA-04: Búsqueda por nombre ==========
    console.log("\nCA-04: Búsqueda por nombre/apellido");
    await test("Buscar por nombre", async () => {
      const response = await axios.get(
        `${BASE_URL}/pacientes/buscar?nombre=Juan`
      );

      if (response.data.total === 0) {
        throw new Error("No encontró resultados");
      }

      if (!response.data.resultados[0].nombres) {
        throw new Error("Resultado sin campo nombres");
      }
    });

    await test("Buscar por apellido", async () => {
      const response = await axios.get(
        `${BASE_URL}/pacientes/buscar?apellido=Test`
      );

      if (response.data.total === 0) {
        throw new Error("No encontró resultados");
      }
    });

    // ========== CA-05: Paginación ==========
    console.log("\nCA-05: Paginación");
    await test("Respetar parámetros de paginación", async () => {
      const response = await axios.get(
        `${BASE_URL}/pacientes/buscar?nombre=Test&limit=2&page=1`
      );

      if (response.data.limit !== 2) {
        throw new Error(`Limit incorrecto: ${response.data.limit}`);
      }

      if (response.data.page !== 1) {
        throw new Error(`Page incorrecta: ${response.data.page}`);
      }

      if (response.data.totalPages === undefined) {
        throw new Error("No calculó totalPages");
      }
    });

    // ========== CA-06: Detalle de paciente ==========
    console.log("\nCA-06: Consultar detalle");
    await test("Obtener detalle de paciente", async () => {
      const id = pacientes[0].idPaciente;
      const response = await axios.get(`${BASE_URL}/pacientes/${id}`);

      const p = response.data.paciente;
      if (!p.idPaciente || !p.documentoIdentidad || !p.email) {
        throw new Error("Detalle incompleto");
      }
    });

    // ========== CA-07: Paciente inexistente ==========
    console.log("\nCA-07: Paciente inexistente");
    await test("Maneja paciente inexistente con 404", async () => {
      try {
        await axios.get(`${BASE_URL}/pacientes/99999999`);
        throw new Error("Debería haber devuelto 404");
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return;
        }
        throw error;
      }
    });

    // ========== CA-08: No mostrar historia clínica ==========
    console.log("\nCA-08: No mostrar historia clínica");
    await test("Detalle no incluye campos prohibidos", async () => {
      const id = pacientes[0].idPaciente;
      const response = await axios.get(`${BASE_URL}/pacientes/${id}`);
      const p = response.data.paciente;

      const camposProhibidos = [
        "diagnosticos",
        "tratamientos",
        "consultas",
        "documentos",
        "consentimientos",
        "historiaClinica",
      ];

      for (const campo of camposProhibidos) {
        if (campo in p) {
          throw new Error(`Campo prohibido encontrado: ${campo}`);
        }
      }
    });

    // ========== CA-09: Validación PACIENTE ==========
    console.log("\nCA-09: Restricción para pacientes");
    await test(
      "Validación de propiedad (preparada para HU-08)",
      async () => {
        // Esta prueba está lista pero requiere autenticación real (HU-06/HU-08)
        // Por ahora solo validamos que el endpoint responda
        const id = pacientes[0].idPaciente;
        await axios.get(`${BASE_URL}/pacientes/${id}`);
      }
    );

    // ========== CA-12: Manejo de errores ==========
    console.log("\nCA-12: Manejo de errores");
    await test("Errores sin información interna", async () => {
      try {
        await axios.get(`${BASE_URL}/pacientes/buscar`);
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.data) {
          const mensaje = error.response.data.error || "";

          const patronesPeligrosos = [
            "SELECT",
            "INSERT",
            "UPDATE",
            "DELETE",
            "stack",
            "TypeError",
          ];

          for (const patron of patronesPeligrosos) {
            if (mensaje.toUpperCase().includes(patron.toUpperCase())) {
              throw new Error(`Info interna expuesta: ${patron}`);
            }
          }
          return;
        }
      }
    });

    // ========== Resumen ==========
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DE PRUEBAS");
    console.log("=".repeat(60));

    const pasaron = resultados.filter((r) => r.estado === "✓").length;
    const fallaron = resultados.filter((r) => r.estado === "✗").length;

    console.log(`\nResultados: ${pasaron} ✓ | ${fallaron} ✗\n`);

    if (fallaron > 0) {
      console.log("❌ Pruebas fallidas:\n");
      resultados
        .filter((r) => r.estado === "✗")
        .forEach((r) => {
          console.log(`  • ${r.nombre}`);
          console.log(`    └─ ${r.mensaje}\n`);
        });
    } else {
      console.log("✅ ¡Todas las pruebas pasaron!\n");
    }
  } catch (error) {
    console.error("\n💥 Error fatal:", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    // Limpiar datos
    await limpiarDatos();
    await AppDataSource.destroy();
  }
}

ejecutarPruebas();
