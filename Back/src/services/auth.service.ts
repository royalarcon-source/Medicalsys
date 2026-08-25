import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { UsuarioRepository } from "../repositories/usuario.repository";
import { RolRepository } from "../repositories/rol.repository";
import { RegisterDTO, LoginDTO } from "../dtos/auth.dto";
import { RolNombre } from "../entities/Rol.entity";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "medicalsys_default_secret_key";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "2h") as jwt.SignOptions["expiresIn"];

export class AuthService {
  async register(dto: RegisterDTO) {
    if (!dto.email || !dto.password || !dto.nombres || !dto.apellidos || !dto.rol) {
      throw { status: 400, message: "Todos los campos obligatorios deben ser completados." };
    }

    if (!Object.values(RolNombre).includes(dto.rol)) {
      throw { status: 400, message: "El rol especificado no es válido en el sistema." };
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

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const newUser = UsuarioRepository.create({
      nombres: dto.nombres.trim(),
      apellidos: dto.apellidos.trim(),
      email: normalizedEmail,
      password_hash: hashedPassword,
      telefono: dto.telefono?.trim(),
      activo: true,
      roles: [rolEntity],
    });

    await UsuarioRepository.save(newUser);

    return {
      id_usuario: newUser.id_usuario,
      nombres: newUser.nombres,
      apellidos: newUser.apellidos,
      email: newUser.email,
      roles: newUser.roles.map((r) => r.nombre),
      activo: newUser.activo,
      fecha_creacion: newUser.fecha_creacion,
    };
  }

  async login(dto: LoginDTO) {
    if (!dto.email || !dto.password) {
      throw { status: 400, message: "Debe introducir usuario y contraseña." };
    }

    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await UsuarioRepository.findByEmail(normalizedEmail);

    // Mensaje genérico para evitar enumeración de usuarios (CA-03 Login)
    if (!user) {
      throw { status: 401, message: "Usuario o contraseña incorrectos." };
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw { status: 401, message: "Usuario o contraseña incorrectos." };
    }

    // Validación de usuario deshabilitado (CA-04 Login)
    if (!user.activo) {
      throw { status: 403, message: "La cuenta no se encuentra habilitada para acceder." };
    }

    const roles = user.roles.map((r) => r.nombre);
    const signOptions: SignOptions = { expiresIn: JWT_EXPIRES_IN };

    const token = jwt.sign(
      {
        id_usuario: user.id_usuario,
        email: user.email,
        roles,
      },
      JWT_SECRET,
      signOptions
    );

    return {
      token,
      usuario: {
        id_usuario: user.id_usuario,
        nombres: user.nombres,
        apellidos: user.apellidos,
        email: user.email,
        roles,
      },
    };
  }
}
