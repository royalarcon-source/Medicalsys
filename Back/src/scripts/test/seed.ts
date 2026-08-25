import bcrypt from "bcrypt";
import { AppDataSource } from "../../config/database";
import { Rol, RolNombre } from "../../entities/Rol.entity";
import { Usuario } from "../../entities/Usuario.entity";

async function runSeed() {
  await AppDataSource.initialize();

  const rolRepo = AppDataSource.getRepository(Rol);
  const userRepo = AppDataSource.getRepository(Usuario);

  for (const nombre of Object.values(RolNombre)) {
    const exists = await rolRepo.findOne({ where: { nombre } });
    if (!exists) {
      await rolRepo.save(rolRepo.create({ nombre, descripcion: `Rol ${nombre} de MedicalSys` }));
    }
  }

  const adminEmail = "admin@medicalsys.com";
  const existingAdmin = await userRepo.findOne({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const adminRol = await rolRepo.findOne({ where: { nombre: RolNombre.ADMINISTRADOR } });
    const password_hash = await bcrypt.hash("Admin123*", 10);

    const admin = userRepo.create({
      nombres: "Administrador",
      apellidos: "General",
      email: adminEmail,
      password_hash,
      activo: true,
      roles: adminRol ? [adminRol] : [],
    });

    await userRepo.save(admin);
    console.log("✓ Superadmin creado: admin@medicalsys.com / Admin123*");
  }

  console.log("✓ Seed finalizado con éxito.");
  await AppDataSource.destroy();
}

runSeed().catch(console.error);
