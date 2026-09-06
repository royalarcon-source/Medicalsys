import "reflect-metadata";
import axios, { AxiosInstance } from "axios";
import bcrypt from "bcrypt";
import FormData from "form-data";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../../config/database";
import { cloudinary } from "../../config/cloudinary";
import { Consulta } from "../../entities/Consulta.entity";
import { Documento } from "../../entities/Documento.entity";
import { HistoriaClinica } from "../../entities/HistoriaClinica.entity";
import { Medico } from "../../entities/Medico.entity";
import { Paciente } from "../../entities/Paciente.entity";
import { Rol } from "../../entities/Rol.entity";
import { Usuario } from "../../entities/Usuario.entity";

const BASE_URL = process.env.HU24_25_BASE_URL ?? "http://localhost:3000/api";
const JWT_SECRET = process.env.JWT_SECRET;
const RUN_ID = Date.now().toString();
const api: AxiosInstance = axios.create({ baseURL: BASE_URL, validateStatus: () => true });

let usuarioMedico: Usuario | null = null;
let usuarioPaciente: Usuario | null = null;
let medico: Medico | null = null;
let paciente: Paciente | null = null;
let historia: HistoriaClinica | null = null;
let consulta: Consulta | null = null;
let documento: Documento | null = null;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function authorization(idUsuario: number, rol: string) {
  if (!JWT_SECRET) throw new Error("Falta JWT_SECRET para generar tokens de prueba");
  return { Authorization: `Bearer ${jwt.sign({ id_usuario: idUsuario, rol }, JWT_SECRET, { expiresIn: "1h" })}` };
}

async function prepararDatos(): Promise<void> {
  const rolRepository = AppDataSource.getRepository(Rol);
  const usuarioRepository = AppDataSource.getRepository(Usuario);
  const medicoRepository = AppDataSource.getRepository(Medico);
  const pacienteRepository = AppDataSource.getRepository(Paciente);
  const historiaRepository = AppDataSource.getRepository(HistoriaClinica);
  const consultaRepository = AppDataSource.getRepository(Consulta);
  const roles = new Map<string, Rol>();

  for (const nombre of ["MEDICO", "PACIENTE"]) {
    const rol = await rolRepository.findOneBy({ nombre });
    assert(rol, `No existe el rol ${nombre}`);
    roles.set(nombre, rol);
  }

  const passwordHash = await bcrypt.hash("HU24-25-test-only", 4);
  usuarioMedico = await usuarioRepository.save(
    usuarioRepository.create({
      rol: roles.get("MEDICO")!,
      nombres: "Medico HU24",
      apellidos: "Prueba",
      email: `hu24-25-medico-${RUN_ID}@test.invalid`,
      passwordHash,
      telefono: "70000001",
      activo: true,
    }),
  );
  usuarioPaciente = await usuarioRepository.save(
    usuarioRepository.create({
      rol: roles.get("PACIENTE")!,
      nombres: "Paciente HU25",
      apellidos: "Prueba",
      email: `hu24-25-paciente-${RUN_ID}@test.invalid`,
      passwordHash,
      telefono: "70000002",
      activo: true,
    }),
  );

  medico = await medicoRepository.save(
    medicoRepository.create({
      usuario: usuarioMedico,
      numeroColegiatura: `HU2425-${RUN_ID}`,
      activo: true,
    }),
  );
  paciente = await pacienteRepository.save(
    pacienteRepository.create({
      usuario: usuarioPaciente,
      documentoIdentidad: `HU2425-${RUN_ID}`,
      fechaNacimiento: new Date("1990-01-01"),
      sexo: "F",
      direccion: "Prueba HU24-25",
      contactoEmergencia: null,
      telefonoEmergencia: null,
    }),
  );
  historia = await historiaRepository.save(
    historiaRepository.create({ paciente, observaciones: "Historia de integración HU24-25" }),
  );
  consulta = await consultaRepository.save(
    consultaRepository.create({
      historia,
      medico,
      cita: null,
      consultorio: null,
      motivo: "Consulta de integración documental",
      tipoIngreso: "CONSULTA_ESPONTANEA",
      numeroTurno: 1,
      estadoConsulta: "ATENDIDA",
      fechaConsulta: new Date(),
    }),
  );
}

function formulario(nombre: string, mimeType: string): FormData {
  const form = new FormData();
  form.append("idConsulta", String(consulta!.idConsulta));
  form.append("tipo", "RESULTADO");
  form.append("archivo", Buffer.from("contenido de prueba HU24-25"), {
    filename: nombre,
    contentType: mimeType,
  });
  return form;
}

async function ejecutar(): Promise<void> {
  try {
    await AppDataSource.initialize();
    await prepararDatos();
    const medicoAuth = authorization(usuarioMedico!.idUsuario, "MEDICO");
    const pacienteAuth = authorization(usuarioPaciente!.idUsuario, "PACIENTE");

    const documentoForm = formulario("resultado.pdf", "application/pdf");
    const subida = await api.post("/documentos", documentoForm, {
      headers: { ...documentoForm.getHeaders(), ...medicoAuth },
    });
    assert(subida.status === 201, `HU24 esperaba 201 y recibió ${subida.status}: ${JSON.stringify(subida.data)}`);
    documento = await AppDataSource.getRepository(Documento).findOneBy({ idDocumento: subida.data.documento.idDocumento });
    assert(documento, "La respuesta 201 no creó el documento");
    console.log("✓ HU24 subida de médico responde 201");

    const consultaPaciente = await api.get(`/documentos?idConsulta=${consulta!.idConsulta}`, {
      headers: pacienteAuth,
    });
    assert(consultaPaciente.status === 200, `HU25 esperaba 200 y recibió ${consultaPaciente.status}: ${JSON.stringify(consultaPaciente.data)}`);
    assert(consultaPaciente.data.documentos.length === 1, "El paciente no recibió su documento");
    console.log("✓ HU25 paciente consulta su documento y responde 200");

    const intentoPacienteForm = formulario("intento.pdf", "application/pdf");
    const subidaPaciente = await api.post("/documentos", intentoPacienteForm, {
      headers: { ...intentoPacienteForm.getHeaders(), ...pacienteAuth },
    });
    assert(subidaPaciente.status === 403, `Paciente debía recibir 403 y recibió ${subidaPaciente.status}`);
    console.log("✓ Paciente no puede subir y responde 403");

    const archivoInvalidoForm = formulario("notas.txt", "text/plain");
    const archivoInvalido = await api.post("/documentos", archivoInvalidoForm, {
      headers: { ...archivoInvalidoForm.getHeaders(), ...medicoAuth },
    });
    assert(archivoInvalido.status === 400, `Archivo inválido debía recibir 400 y recibió ${archivoInvalido.status}`);
    console.log("✓ Archivo no permitido responde 400");
    console.log("RESULTADO HTTP HU24/HU25: VERDE");
  } catch (error) {
    console.error(`RESULTADO HTTP HU24/HU25: ROJO - ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      if (documento) {
        await AppDataSource.getRepository(Documento).delete(documento.idDocumento);
        await cloudinary.uploader.destroy(documento.storageKey, { resource_type: "auto" }).catch(() => undefined);
      }
      if (consulta) await AppDataSource.getRepository(Consulta).delete(consulta.idConsulta);
      if (historia) await AppDataSource.getRepository(HistoriaClinica).delete(historia.idHistoria);
      if (medico) await AppDataSource.getRepository(Medico).delete(medico.idMedico);
      if (paciente) await AppDataSource.getRepository(Paciente).delete(paciente.idPaciente);
      if (usuarioMedico) await AppDataSource.getRepository(Usuario).delete(usuarioMedico.idUsuario);
      if (usuarioPaciente) await AppDataSource.getRepository(Usuario).delete(usuarioPaciente.idUsuario);
      await AppDataSource.destroy();
    }
  }
}

ejecutar();
