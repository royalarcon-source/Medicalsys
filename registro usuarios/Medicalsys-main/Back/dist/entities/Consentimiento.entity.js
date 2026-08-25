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
exports.Consentimiento = void 0;
const typeorm_1 = require("typeorm");
const Paciente_entity_1 = require("./Paciente.entity");
const Documento_entity_1 = require("./Documento.entity");
const Consulta_entity_1 = require("./Consulta.entity");
let Consentimiento = class Consentimiento {
    idConsentimiento;
    paciente;
    documento; // el PDF firmado, una vez generado
    consulta;
    tipo;
    version;
    fechaEmision;
    fechaFirma;
    estado; // PENDIENTE | FIRMADO | REVOCADO
    firmadoPor;
};
exports.Consentimiento = Consentimiento;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: "bigint", name: "id_consentimiento" }),
    __metadata("design:type", Number)
], Consentimiento.prototype, "idConsentimiento", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Paciente_entity_1.Paciente, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: "id_paciente" }),
    __metadata("design:type", Paciente_entity_1.Paciente)
], Consentimiento.prototype, "paciente", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Documento_entity_1.Documento, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "id_documento" }),
    __metadata("design:type", Object)
], Consentimiento.prototype, "documento", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Consulta_entity_1.Consulta, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "id_consulta" }),
    __metadata("design:type", Object)
], Consentimiento.prototype, "consulta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100 }),
    __metadata("design:type", String)
], Consentimiento.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 30 }),
    __metadata("design:type", String)
], Consentimiento.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamp", name: "fecha_emision" }),
    __metadata("design:type", Date)
], Consentimiento.prototype, "fechaEmision", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true, name: "fecha_firma" }),
    __metadata("design:type", Object)
], Consentimiento.prototype, "fechaFirma", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 30, default: "PENDIENTE" }),
    __metadata("design:type", String)
], Consentimiento.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 200, nullable: true, name: "firmado_por" }),
    __metadata("design:type", Object)
], Consentimiento.prototype, "firmadoPor", void 0);
exports.Consentimiento = Consentimiento = __decorate([
    (0, typeorm_1.Entity)({ name: "consentimiento" })
], Consentimiento);
//# sourceMappingURL=Consentimiento.entity.js.map