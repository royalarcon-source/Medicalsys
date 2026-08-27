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
exports.HistoriaClinica = void 0;
const typeorm_1 = require("typeorm");
const Paciente_entity_1 = require("./Paciente.entity");
let HistoriaClinica = class HistoriaClinica {
    idHistoria;
    paciente;
    fechaApertura;
    observaciones;
};
exports.HistoriaClinica = HistoriaClinica;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: "bigint", name: "id_historia" }),
    __metadata("design:type", Number)
], HistoriaClinica.prototype, "idHistoria", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Paciente_entity_1.Paciente, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: "id_paciente" }),
    __metadata("design:type", Paciente_entity_1.Paciente)
], HistoriaClinica.prototype, "paciente", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamp", name: "fecha_apertura" }),
    __metadata("design:type", Date)
], HistoriaClinica.prototype, "fechaApertura", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], HistoriaClinica.prototype, "observaciones", void 0);
exports.HistoriaClinica = HistoriaClinica = __decorate([
    (0, typeorm_1.Entity)({ name: "historia_clinica" })
], HistoriaClinica);
//# sourceMappingURL=HistoriaClinica.entity.js.map