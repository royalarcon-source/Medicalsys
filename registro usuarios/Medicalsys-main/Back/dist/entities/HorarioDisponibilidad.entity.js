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
exports.HorarioDisponibilidad = void 0;
const typeorm_1 = require("typeorm");
const Medico_entity_1 = require("./Medico.entity");
let HorarioDisponibilidad = class HorarioDisponibilidad {
    idHorario;
    medico;
    diaSemana; // 1 (lunes) a 7 (domingo)
    horaInicio;
    horaFin;
    activo;
};
exports.HorarioDisponibilidad = HorarioDisponibilidad;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: "bigint", name: "id_horario" }),
    __metadata("design:type", Number)
], HorarioDisponibilidad.prototype, "idHorario", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Medico_entity_1.Medico, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: "id_medico" }),
    __metadata("design:type", Medico_entity_1.Medico)
], HorarioDisponibilidad.prototype, "medico", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "smallint", name: "dia_semana" }),
    __metadata("design:type", Number)
], HorarioDisponibilidad.prototype, "diaSemana", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "time", name: "hora_inicio" }),
    __metadata("design:type", String)
], HorarioDisponibilidad.prototype, "horaInicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "time", name: "hora_fin" }),
    __metadata("design:type", String)
], HorarioDisponibilidad.prototype, "horaFin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], HorarioDisponibilidad.prototype, "activo", void 0);
exports.HorarioDisponibilidad = HorarioDisponibilidad = __decorate([
    (0, typeorm_1.Entity)({ name: "horario_disponibilidad" })
], HorarioDisponibilidad);
//# sourceMappingURL=HorarioDisponibilidad.entity.js.map