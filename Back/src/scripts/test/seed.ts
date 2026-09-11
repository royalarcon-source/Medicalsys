import bcrypt from "bcrypt";
import { AppDataSource } from "../../config/database";
import { Rol, RolNombre } from "../../entities/Rol.entity";
import { Usuario } from "../../entities/Usuario.entity";
import { Medico } from "../../entities/Medico.entity";
import { Paciente } from "../../entities/Paciente.entity";
import { Servicio } from "../../entities/Servicio.entity";

async function runSeed() {
  await AppDataSource.initialize();

  const rolRepo = AppDataSource.getRepository(Rol);
  const userRepo = AppDataSource.getRepository(Usuario);
  const medicoRepo = AppDataSource.getRepository(Medico);
  const pacienteRepo = AppDataSource.getRepository(Paciente);
  const servicioRepo = AppDataSource.getRepository(Servicio);

  // 1. Roles
  for (const nombre of Object.values(RolNombre)) {
    const exists = await rolRepo.findOne({ where: { nombre } });
    if (!exists) {
      await rolRepo.save(rolRepo.create({ nombre, descripcion: `Rol ${nombre} de MedicalSys` }));
    }
  }

  // 2. Servicios médicos base
  const serviciosBase = [
    { nombre: "Consulta Médica General", descripcion: "Evaluación y diagnóstico médico general", precio: "150.00" },
    { nombre: "Consulta Especializada (Cardiología / Pediatría)", descripcion: "Atención médica por especialista", precio: "250.00" },
    { nombre: "Radiografía / Rayos X de Tórax", descripcion: "Estudio de imagenología digital", precio: "180.00" },
    { nombre: "Hemograma Completo y Bioquímica", descripcion: "Análisis de laboratorio clínico", precio: "120.00" },
    { nombre: "Ecografía Abdominal / Pélvica", descripcion: "Ultrasonido diagnóstico especializado", precio: "220.00" },
    { nombre: "Curación y Procedimiento Menor", descripcion: "Atención de enfermería y curación de heridas", precio: "80.00" },
    { nombre: "Electrocardiograma (ECG)", descripcion: "Registro de actividad cardíaca con informe", precio: "100.00" },
  ];

  for (const s of serviciosBase) {
    const existe = await servicioRepo.findOne({ where: { nombre: s.nombre } });
    if (!existe) {
      await servicioRepo.save(servicioRepo.create({ ...s, activo: true }));
      console.log(`✓ Servicio médico creado: ${s.nombre} (${s.precio} Bs)`);
    }
  }

  const usuariosConfig = [
    {
      email: "admin@medicalsys.com",
      password: "Admin123*",
      nombres: "Administrador",
      apellidos: "General",
      rolNombre: RolNombre.ADMINISTRADOR,
    },
    {
      email: "medico@medicalsys.com",
      password: "Medico123*",
      nombres: "Dra. Valeria",
      apellidos: "Gómez",
      rolNombre: RolNombre.MEDICO,
    },
    {
      email: "recepcion@medicalsys.com",
      password: "Recepcion123*",
      nombres: "Lucía",
      apellidos: "Mendoza",
      rolNombre: RolNombre.RECEPCIONISTA,
    },
    {
      email: "paciente@medicalsys.com",
      password: "Paciente123*",
      nombres: "Juan",
      apellidos: "Pérez",
      rolNombre: RolNombre.PACIENTE,
    },
  ];

  for (const u of usuariosConfig) {
    const rol = await rolRepo.findOne({ where: { nombre: u.rolNombre } });
    if (!rol) continue;

    const passwordHash = await bcrypt.hash(u.password, 10);
    let usuario = await userRepo.findOne({ where: { email: u.email } });

    if (!usuario) {
      usuario = userRepo.create({
        nombres: u.nombres,
        apellidos: u.apellidos,
        email: u.email,
        passwordHash,
        activo: true,
        rol,
      });
      await userRepo.save(usuario);
      console.log(`✓ Usuario creado: ${u.email} / ${u.password}`);
    } else {
      usuario.passwordHash = passwordHash;
      usuario.activo = true;
      usuario.rol = rol;
      usuario.nombres = u.nombres;
      usuario.apellidos = u.apellidos;
      await userRepo.save(usuario);
      console.log(`✓ Contraseña y datos actualizados para: ${u.email} / ${u.password}`);
    }

    // Perfil médico si corresponde
    if (u.rolNombre === RolNombre.MEDICO) {
      const medicoExistente = await medicoRepo.findOne({ where: { usuario: { idUsuario: usuario.idUsuario } } });
      if (!medicoExistente) {
        const medico = medicoRepo.create({
          usuario,
          numeroColegiatura: "COL-12345",
          activo: true,
        });
        await medicoRepo.save(medico);
        console.log(`✓ Perfil de médico asociado a ${u.email}`);
      }
    }

    // Perfil paciente si corresponde
    if (u.rolNombre === RolNombre.PACIENTE) {
      const pacienteExistente = await pacienteRepo.findOne({ where: { usuario: { idUsuario: usuario.idUsuario } } });
      if (!pacienteExistente) {
        const paciente = pacienteRepo.create({
          usuario,
          documentoIdentidad: "12345678",
          fechaNacimiento: new Date("1990-01-01"),
          sexo: "Masculino",
          direccion: "Av. Principal 123",
        });
        await pacienteRepo.save(paciente);
        console.log(`✓ Perfil de paciente asociado a ${u.email}`);
      }
    }
  }

  console.log("\n✓ Seed finalizado con éxito.");
  await AppDataSource.destroy();
}

runSeed().catch(console.error);
