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
exports.Consulta = void 0;
const typeorm_1 = require("typeorm");
const HistoriaClinica_entity_1 = require("./HistoriaClinica.entity");
const Medico_entity_1 = require("./Medico.entity");
const Cita_entity_1 = require("./Cita.entity");
const Consultorio_entity_1 = require("./Consultorio.entity");
let Consulta = class Consulta {
    idConsulta;
    historia;
    medico;
    cita; // NULL = atención sin cita previa (HU-18)
    consultorio;
    fechaConsulta;
    motivo;
    anamnesis;
    examenFisico;
    observaciones;
};
exports.Consulta = Consulta;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: "bigint", name: "id_consulta" }),
    __metadata("design:type", Number)
], Consulta.prototype, "idConsulta", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => HistoriaClinica_entity_1.HistoriaClinica, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: "id_historia" }),
    __metadata("design:type", HistoriaClinica_entity_1.HistoriaClinica)
], Consulta.prototype, "historia", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Medico_entity_1.Medico, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: "id_medico" }),
    __metadata("design:type", Medico_entity_1.Medico)
], Consulta.prototype, "medico", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Cita_entity_1.Cita, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "id_cita" }),
    __metadata("design:type", Object)
], Consulta.prototype, "cita", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Consultorio_entity_1.Consultorio, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "id_consultorio" }),
    __metadata("design:type", Object)
], Consulta.prototype, "consultorio", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamp", name: "fecha_consulta" }),
    __metadata("design:type", Date)
], Consulta.prototype, "fechaConsulta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], Consulta.prototype, "motivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], Consulta.prototype, "anamnesis", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true, name: "examen_fisico" }),
    __metadata("design:type", Object)
], Consulta.prototype, "examenFisico", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], Consulta.prototype, "observaciones", void 0);
exports.Consulta = Consulta = __decorate([
    (0, typeorm_1.Entity)({ name: "consulta" })
], Consulta);
//# sourceMappingURL=Consulta.entity.js.map