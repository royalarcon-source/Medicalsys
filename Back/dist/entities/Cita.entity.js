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
exports.Cita = void 0;
const typeorm_1 = require("typeorm");
const Paciente_entity_1 = require("./Paciente.entity");
const Medico_entity_1 = require("./Medico.entity");
const Consultorio_entity_1 = require("./Consultorio.entity");
let Cita = class Cita {
    idCita;
    paciente;
    medico;
    consultorio;
    fechaHoraInicio;
    fechaHoraFin;
    motivo;
    estado;
    fechaCreacion;
};
exports.Cita = Cita;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: "bigint", name: "id_cita" }),
    __metadata("design:type", Number)
], Cita.prototype, "idCita", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Paciente_entity_1.Paciente, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: "id_paciente" }),
    __metadata("design:type", Paciente_entity_1.Paciente)
], Cita.prototype, "paciente", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Medico_entity_1.Medico, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: "id_medico" }),
    __metadata("design:type", Medico_entity_1.Medico)
], Cita.prototype, "medico", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Consultorio_entity_1.Consultorio, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "id_consultorio" }),
    __metadata("design:type", Object)
], Cita.prototype, "consultorio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", name: "fecha_hora_inicio" }),
    __metadata("design:type", Date)
], Cita.prototype, "fechaHoraInicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", name: "fecha_hora_fin" }),
    __metadata("design:type", Date)
], Cita.prototype, "fechaHoraFin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 500, nullable: true }),
    __metadata("design:type", Object)
], Cita.prototype, "motivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 30, default: "PENDIENTE" }),
    __metadata("design:type", String)
], Cita.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamp", name: "fecha_creacion" }),
    __metadata("design:type", Date)
], Cita.prototype, "fechaCreacion", void 0);
exports.Cita = Cita = __decorate([
    (0, typeorm_1.Entity)({ name: "cita" })
], Cita);
//# sourceMappingURL=Cita.entity.js.map