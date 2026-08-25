"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Paciente = void 0;
const typeorm_1 = require("typeorm");
const Usuario_entity_1 = require("./Usuario.entity");
let Paciente = class Paciente {
    idPaciente;
    usuario;
    documentoIdentidad;
    fechaNacimiento;
    sexo;
    direccion;
    contactoEmergencia;
    telefonoEmergencia;
    fechaRegistro;
};
exports.Paciente = Paciente;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: "bigint", name: "id_paciente" }),
    __metadata("design:type", Number)
], Paciente.prototype, "idPaciente", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Usuario_entity_1.Usuario, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "id_usuario" }),
    __metadata("design:type", Object)
], Paciente.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 30, unique: true, name: "documento_identidad" }),
    __metadata("design:type", String)
], Paciente.prototype, "documentoIdentidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", name: "fecha_nacimiento" }),
    __metadata("design:type", Date)
], Paciente.prototype, "fechaNacimiento", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, nullable: true }),
    __metadata("design:type", Object)
], Paciente.prototype, "sexo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 250, nullable: true }),
    __metadata("design:type", Object)
], Paciente.prototype, "direccion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 150, nullable: true, name: "contacto_emergencia" }),
    __metadata("design:type", Object)
], Paciente.prototype, "contactoEmergencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 30, nullable: true, name: "telefono_emergencia" }),
    __metadata("design:type", Object)
], Paciente.prototype, "telefonoEmergencia", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamp", name: "fecha_registro" }),
    __metadata("design:type", Date)
], Paciente.prototype, "fechaRegistro", void 0);
exports.Paciente = Paciente = __decorate([
    (0, typeorm_1.Entity)({ name: "paciente" })
], Paciente);
//# sourceMappingURL=Paciente.entity.js.map