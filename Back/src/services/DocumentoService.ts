import { AppDataSource } from "../config/database";
import { cloudinary } from "../config/cloudinary";
import { Consulta } from "../entities/Consulta.entity";
import { Documento } from "../entities/Documento.entity";
import { MedicoRepository } from "../repositories/MedicoRepository";
import { PacienteRepository } from "../repositories/PacienteRepository";
import { AppError } from "../utils/AppError";

interface UsuarioActual {
  idUsuario: number;
  rol: string;
}

interface ArchivoSubido {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

interface ResultadoCloudinary {
  public_id: string;
}

const documentoRepository = () => AppDataSource.getRepository(Documento);

function cargarCloudinary(archivo: ArchivoSubido): Promise<ResultadoCloudinary> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "medicalsys/documentos",
        resource_type: "auto",
        use_filename: false,
        unique_filename: true,
      },
      (error, resultado) => {
        if (error || !resultado) {
          reject(new AppError("No se pudo almacenar el documento.", 502));
          return;
        }
        resolve({ public_id: resultado.public_id });
      },
    );

    stream.end(archivo.buffer);
  });
}

async function obtenerConsulta(idConsulta: number): Promise<Consulta> {
  const consulta = await AppDataSource.getRepository(Consulta).findOne({
    where: { idConsulta },
    relations: {
      medico: true,
      historia: { paciente: true },
    },
  });

  if (!consulta) {
    throw new AppError("La consulta indicada no existe.", 404);
  }
  if (!consulta.historia?.paciente) {
    throw new AppError("La consulta no tiene un paciente asociado.", 400);
  }
  if (!consulta.medico) {
    throw new AppError("La consulta no tiene un médico asignado.", 400);
  }

  return consulta;
}

async function validarAccesoConsulta(
  consulta: Consulta,
  usuarioActual: UsuarioActual,
  accion: "subir" | "consultar",
): Promise<void> {
  if (usuarioActual.rol === "ADMINISTRADOR") return;

  if (usuarioActual.rol === "MEDICO") {
    const medico = await MedicoRepository.buscarPorUsuario(usuarioActual.idUsuario);
    if (!medico || medico.idMedico !== consulta.medico.idMedico) {
      throw new AppError(`No tienes permiso para ${accion} documentos de esta consulta.`, 403);
    }
    return;
  }

  if (accion === "consultar" && usuarioActual.rol === "PACIENTE") {
    const paciente = await PacienteRepository.buscarPorUsuario(usuarioActual.idUsuario);
    if (!paciente || paciente.idPaciente !== consulta.historia.paciente.idPaciente) {
      throw new AppError("No tienes permiso para consultar documentos de este paciente.", 403);
    }
    return;
  }

  throw new AppError(`No tienes permiso para ${accion} documentos.`, 403);
}

function respuestaDocumento(documento: Documento) {
  let format: string | undefined = undefined;
  if (documento.nombreArchivo && documento.nombreArchivo.includes(".")) {
    const ext = documento.nombreArchivo.split(".").pop()?.toLowerCase();
    if (ext) format = ext;
  }
  if (!format && documento.mimeType?.toLowerCase().includes("pdf")) {
    format = "pdf";
  }

  const isPdf = documento.mimeType?.toLowerCase().includes("pdf") || format === "pdf";

  const url = cloudinary.url(documento.storageKey, {
    secure: true,
    resource_type: isPdf ? "image" : "auto",
    format,
  });

  return {
    idDocumento: documento.idDocumento,
    idConsulta: documento.consulta?.idConsulta ?? null,
    idPaciente: documento.paciente.idPaciente,
    tipo: documento.tipo,
    nombreArchivo: documento.nombreArchivo,
    mimeType: documento.mimeType,
    tamanoBytes: documento.tamanoBytes,
    storageKey: documento.storageKey,
    fechaSubida: documento.fechaSubida,
    activo: documento.activo,
    url,
  };
}

export class DocumentoService {
  async subir(
    idConsulta: number,
    tipo: string,
    archivo: ArchivoSubido,
    usuarioActual: UsuarioActual,
  ) {
    if (!Number.isInteger(idConsulta) || idConsulta <= 0) {
      throw new AppError("idConsulta debe ser un entero positivo.", 400);
    }
    if (!tipo?.trim() || tipo.trim().length > 50) {
      throw new AppError("tipo es obligatorio y no puede superar 50 caracteres.", 400);
    }
    if (!archivo) {
      throw new AppError("Debes adjuntar un archivo en el campo archivo.", 400);
    }

    const consulta = await obtenerConsulta(idConsulta);
    await validarAccesoConsulta(consulta, usuarioActual, "subir");

    const almacenado = await cargarCloudinary(archivo);
    try {
      const documento = await documentoRepository().save(
        documentoRepository().create({
          paciente: consulta.historia.paciente,
          historia: consulta.historia,
          consulta,
          tipo: tipo.trim(),
          nombreArchivo: archivo.originalname,
          mimeType: archivo.mimetype,
          tamanoBytes: archivo.size,
          storageKey: almacenado.public_id,
          hashArchivo: null,
          activo: true,
        }),
      );

      return respuestaDocumento(documento);
    } catch (error) {
      await cloudinary.uploader.destroy(almacenado.public_id, { resource_type: "auto" });
      throw error;
    }
  }

  async listar(idConsulta: number | undefined, usuarioActual: UsuarioActual) {
    if (idConsulta !== undefined && (!Number.isInteger(idConsulta) || idConsulta <= 0)) {
      throw new AppError("idConsulta debe ser un entero positivo.", 400);
    }

    const query = documentoRepository()
      .createQueryBuilder("documento")
      .innerJoinAndSelect("documento.consulta", "consulta")
      .innerJoinAndSelect("documento.paciente", "paciente")
      .leftJoinAndSelect("documento.historia", "historia")
      .orderBy("documento.fecha_subida", "DESC");

    if (idConsulta !== undefined) {
      query.andWhere("consulta.id_consulta = :idConsulta", { idConsulta });
    }

    if (usuarioActual.rol === "ADMINISTRADOR") {
      // El administrador puede supervisar documentos de cualquier consulta.
    } else if (usuarioActual.rol === "MEDICO") {
      const medico = await MedicoRepository.buscarPorUsuario(usuarioActual.idUsuario);
      if (!medico) throw new AppError("No existe un perfil de médico asociado a tu usuario.", 403);
      query.andWhere("consulta.id_medico = :idMedico", { idMedico: medico.idMedico });
    } else if (usuarioActual.rol === "PACIENTE") {
      const paciente = await PacienteRepository.buscarPorUsuario(usuarioActual.idUsuario);
      if (!paciente) throw new AppError("No existe un perfil de paciente asociado a tu usuario.", 403);
      query.andWhere("paciente.id_paciente = :idPaciente", { idPaciente: paciente.idPaciente });
    } else {
      throw new AppError("No tienes permiso para consultar documentos.", 403);
    }

    const documentos = await query.getMany();
    return documentos.map(respuestaDocumento);
  }
}
