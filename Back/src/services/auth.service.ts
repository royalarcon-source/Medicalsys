import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { UsuarioRepository } from "../repositories/usuario.repository";
import { RolRepository } from "../repositories/rol.repository";
import { PacienteRepository } from "../repositories/PacienteRepository";
import { RegisterDTO, LoginDTO } from "../dtos/auth.dto";
import { RolNombre } from "../entities/Rol.entity";

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "2h") as jwt.SignOptions["expiresIn"];

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Falta la variable de entorno JWT_SECRET");
  }
  return secret;
}

export class AuthService {
  async register(dto: RegisterDTO) {
    if (!dto.email || !dto.password || !dto.nombres || !dto.apellidos || !dto.rol) {
      throw { status: 400, message: "Todos los campos obligatorios deben ser completados." };
    }

    if (!Object.values(RolNombre).includes(dto.rol)) {
      throw { status: 400, message: "El rol especificado no es válido en el sistema." };
    }

    if (dto.rol === RolNombre.PACIENTE) {
      if (!dto.documentoIdentidad?.trim()) {
        throw { status: 400, message: "El documento de identidad (CI) es obligatorio para pacientes." };
      }
      if (!dto.fechaNacimiento) {
        throw { status: 400, message: "La fecha de nacimiento es obligatoria para pacientes." };
      }
    }

    const normalizedEmail = dto.email.toLowerCase().trim();
    const existingUser = await UsuarioRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw { status: 409, message: "El identificador de acceso (correo) ya se encuentra registrado." };
    }

    const rolEntity = await RolRepository.findByNombre(dto.rol);
    if (!rolEntity) {
      throw { status: 404, message: "El rol solicitado no existe en la base de datos." };
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const newUser = UsuarioRepository.create({
      nombres: dto.nombres.trim(),
      apellidos: dto.apellidos.trim(),
      email: normalizedEmail,
      passwordHash,
      telefono: dto.telefono?.trim() ?? null,
      activo: true,
      rol: rolEntity,
    });

    await UsuarioRepository.save(newUser);

    if (dto.rol === RolNombre.PACIENTE && dto.documentoIdentidad && dto.fechaNacimiento) {
      await PacienteRepository.crear({
        idUsuario: newUser.idUsuario,
        documentoIdentidad: dto.documentoIdentidad.trim(),
        fechaNacimiento: dto.fechaNacimiento,
        sexo: dto.sexo ?? null,
        direccion: dto.direccion ?? null,
        contactoEmergencia: null,
        telefonoEmergencia: null,
      });
    }

    return {
      id_usuario: newUser.idUsuario,
      nombres: newUser.nombres,
      apellidos: newUser.apellidos,
      email: newUser.email,
      rol: newUser.rol.nombre,
      activo: newUser.activo,
      fecha_creacion: newUser.fechaCreacion,
    };
  }

  async login(dto: LoginDTO) {
    if (!dto.email || !dto.password) {
      throw { status: 400, message: "Debe introducir usuario y contraseña." };
    }

    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await UsuarioRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw { status: 401, message: "Usuario o contraseña incorrectos." };
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw { status: 401, message: "Usuario o contraseña incorrectos." };
    }

    if (!user.activo) {
      throw { status: 403, message: "La cuenta no se encuentra habilitada para acceder." };
    }

    const signOptions: SignOptions = { expiresIn: JWT_EXPIRES_IN };

    const token = jwt.sign(
      {
        id_usuario: user.idUsuario,
        email: user.email,
        rol: user.rol.nombre,
      },
      getJwtSecret(),
      signOptions
    );

    return {
      token,
      usuario: {
        id_usuario: user.idUsuario,
        nombres: user.nombres,
        apellidos: user.apellidos,
        email: user.email,
        rol: user.rol.nombre,
      },
    };
  }
}
