import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import { requirePermission } from "../middlewares/requirePermission";
import { AppError } from "../utils/AppError";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

test("requirePermission rechaza usuarios sin token", () => {
  const req: any = { headers: {} };
  const res: any = {};
  let captured: unknown;

  requirePermission("PACIENTE_CONSULTAR")(req, res, (err?: unknown) => {
    captured = err;
  });

  assert.ok(captured instanceof AppError, "Debe devolver un AppError de 401");
  assert.equal((captured as AppError).statusCode, 401);
});

test("requirePermission acepta token válido y añade req.user", () => {
  const token = jwt.sign(
    {
      idUsuario: 7,
      rol: { nombre: "MEDICO" },
      permisos: ["PACIENTE_CONSULTAR"],
    },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

  const req: any = {
    headers: {
      authorization: `Bearer ${token}`,
    },
  };
  const res: any = {};
  let nextCalled = false;

  requirePermission("PACIENTE_CONSULTAR")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true, "Debe invocar next() cuando el token es válido");
  assert.equal(req.user.idUsuario, 7);
  assert.equal(req.user.rol.nombre, "MEDICO");
});

test("requirePermission rechaza el listado de pacientes para PACIENTE", () => {
  const token = jwt.sign(
    {
      idUsuario: 8,
      rol: { nombre: "PACIENTE" },
      permisos: ["PACIENTE_CONSULTAR"],
    },
    process.env.JWT_SECRET!
  );

  const req: any = {
    headers: {
      authorization: `Bearer ${token}`,
    },
  };
  const res: any = {};
  let captured: unknown;

  requirePermission("PACIENTE_CONSULTAR")(req, res, (err?: unknown) => {
    captured = err;
  });

  assert.ok(captured instanceof AppError);
  assert.equal((captured as AppError).statusCode, 403);
});
