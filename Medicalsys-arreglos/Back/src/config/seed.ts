import bcrypt from "bcrypt";
import { AppDataSource } from "./database";
import { Rol, RolNombre } from "../entities/Rol.entity";
import { Usuario } from "../entities/Usuario.entity";
import { Medico } from "../entities/Medico.entity";
import { Paciente } from "../entities/Paciente.entity";
import { Consultorio } from "../entities/Consultorio.entity";
import { Especialidad } from "../entities/Especialidad.entity";
import { HorarioDisponibilidad } from "../entities/HorarioDisponibilidad.entity";

export async function seedDatabase(): Promise<void> {
  try {
    const rolRepository = AppDataSource.getRepository(Rol);
    const usuarioRepository = AppDataSource.getRepository(Usuario);
    const medicoRepository = AppDataSource.getRepository(Medico);
    const pacienteRepository = AppDataSource.getRepository(Paciente);
    const consultorioRepository = AppDataSource.getRepository(Consultorio);
    const especialidadRepository = AppDataSource.getRepository(Especialidad);
    const horarioRepository = AppDataSource.getRepository(HorarioDisponibilidad);

    // 1. Roles por defecto
    const rolesDefault = [
      { nombre: RolNombre.ADMINISTRADOR, descripcion: "Administrador con control total del sistema" },
      { nombre: RolNombre.MEDICO, descripcion: "Médico facultativo" },
      { nombre: RolNombre.RECEPCIONISTA, descripcion: "Personal de recepción y gestión de citas" },
      { nombre: RolNombre.PACIENTE, descripcion: "Paciente del centro de salud" },
    ];

    for (const r of rolesDefault) {
      const existe = await rolRepository.findOneBy({ nombre: r.nombre });
      if (!existe) {
        const nuevoRol = rolRepository.create(r);
        await rolRepository.save(nuevoRol);
        console.log(`[Seed] Rol creado: ${r.nombre}`);
      }
    }

    const adminRol = await rolRepository.findOneBy({ nombre: RolNombre.ADMINISTRADOR });
    const medicoRol = await rolRepository.findOneBy({ nombre: RolNombre.MEDICO });
    const recepRol = await rolRepository.findOneBy({ nombre: RolNombre.RECEPCIONISTA });
    const pacienteRol = await rolRepository.findOneBy({ nombre: RolNombre.PACIENTE });

    // 2. Especialidades por defecto
    const espList = [
      { nombre: "Medicina General", descripcion: "Atención médica integral primaria" },
      { nombre: "Pediatría", descripcion: "Atención integral infantil" },
      { nombre: "Cardiología", descripcion: "Diagnóstico y tratamiento cardiológico" },
      { nombre: "Ginecología", descripcion: "Salud femenina y obstetricia" },
    ];
    for (const esp of espList) {
      const existe = await especialidadRepository.findOneBy({ nombre: esp.nombre });
      if (!existe) {
        await especialidadRepository.save(especialidadRepository.create(esp));
      }
    }

    // 3. Consultorios físicos por defecto
    const consultoriosList = [
      { nombre: "Consultorio 101", tipo: "Medicina General", piso: "1", capacidad: 1, activo: true },
      { nombre: "Consultorio 102", tipo: "Pediatría", piso: "1", capacidad: 1, activo: true },
      { nombre: "Consultorio 201", tipo: "Cardiología", piso: "2", capacidad: 1, activo: true },
      { nombre: "Consultorio 202", tipo: "Ginecología", piso: "2", capacidad: 1, activo: true },
    ];
    for (const cons of consultoriosList) {
      const existe = await consultorioRepository.findOneBy({ nombre: cons.nombre });
      if (!existe) {
        await consultorioRepository.save(consultorioRepository.create(cons));
      }
    }

    // 4. Administrador de prueba
    if (adminRol) {
      const email = "admin@medicalsys.com";
      let admin = await usuarioRepository.findOneBy({ email });
      const passwordHash = await bcrypt.hash("admin1234", 10);
      if (!admin) {
        admin = usuarioRepository.create({
          nombres: "Carlos",
          apellidos: "Administrador",
          email,
          passwordHash,
          telefono: "70000001",
          activo: true,
          rol: adminRol,
        });
      } else {
        admin.passwordHash = passwordHash;
        admin.activo = true;
        admin.rol = adminRol;
      }
      await usuarioRepository.save(admin);
    }

    // 5. Médico de prueba
    if (medicoRol) {
      const email = "medico@medicalsys.com";
      let userMedico = await usuarioRepository.findOneBy({ email });
      const passwordHash = await bcrypt.hash("medico1234", 10);
      if (!userMedico) {
        userMedico = usuarioRepository.create({
          nombres: "Dra. Valeria",
          apellidos: "Gómez",
          email,
          passwordHash,
          telefono: "70000002",
          activo: true,
          rol: medicoRol,
        });
      } else {
        userMedico.passwordHash = passwordHash;
        userMedico.activo = true;
        userMedico.rol = medicoRol;
      }
      await usuarioRepository.save(userMedico);

      let med = await medicoRepository.findOne({
        where: { usuario: { idUsuario: userMedico.idUsuario } },
        relations: { especialidades: true },
      });
      if (!med) {
        med = medicoRepository.create({
          usuario: userMedico,
          numeroColegiatura: "MED-10293",
          activo: true,
        });
        await medicoRepository.save(med);
      }

      // Asignar especialidad Medicina General si no tiene
      const espMG = await especialidadRepository.findOneBy({ nombre: "Medicina General" });
      if (espMG && (!med.especialidades || med.especialidades.length === 0)) {
        med.especialidades = [espMG];
        await medicoRepository.save(med);
      }

      // Horario de atención (Lunes a Viernes de 08:00 a 16:00)
      for (let dia = 1; dia <= 5; dia++) {
        const existeHorario = await horarioRepository.findOne({
          where: { medico: { idMedico: med.idMedico }, diaSemana: dia, activo: true },
        });
        if (!existeHorario) {
          await horarioRepository.save(
            horarioRepository.create({
              medico: med,
              diaSemana: dia,
              horaInicio: "08:00:00",
              horaFin: "16:00:00",
              activo: true,
            })
          );
        }
      }
    }

    // 6. Recepcionista de prueba
    if (recepRol) {
      const email = "recepcion@medicalsys.com";
      let recep = await usuarioRepository.findOneBy({ email });
      const passwordHash = await bcrypt.hash("recepcion1234", 10);
      if (!recep) {
        recep = usuarioRepository.create({
          nombres: "Lucía",
          apellidos: "Mendoza",
          email,
          passwordHash,
          telefono: "70000003",
          activo: true,
          rol: recepRol,
        });
      } else {
        recep.passwordHash = passwordHash;
        recep.activo = true;
        recep.rol = recepRol;
      }
      await usuarioRepository.save(recep);
    }

    // 7. Paciente de prueba
    if (pacienteRol) {
      const email = "paciente@medicalsys.com";
      let userPaciente = await usuarioRepository.findOneBy({ email });
      const passwordHash = await bcrypt.hash("paciente1234", 10);
      if (!userPaciente) {
        userPaciente = usuarioRepository.create({
          nombres: "Juan",
          apellidos: "Pérez",
          email,
          passwordHash,
          telefono: "70000004",
          activo: true,
          rol: pacienteRol,
        });
      } else {
        userPaciente.passwordHash = passwordHash;
        userPaciente.activo = true;
        userPaciente.rol = pacienteRol;
      }
      await usuarioRepository.save(userPaciente);

      const pacExiste = await pacienteRepository.findOne({ where: { usuario: { idUsuario: userPaciente.idUsuario } } });
      if (!pacExiste) {
        const pac = pacienteRepository.create({
          usuario: userPaciente,
          documentoIdentidad: "12345678",
          fechaNacimiento: new Date("1995-05-15"),
          sexo: "MASCULINO",
          direccion: "Av. Principal 123",
        });
        await pacienteRepository.save(pac);
      }
    }
  } catch (error) {
    console.error("[Seed] Error al inicializar datos base:", error);
  }
}
