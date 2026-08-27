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
exports.Diagnostico = void 0;
const typeorm_1 = require("typeorm");
const Consulta_entity_1 = require("./Consulta.entity");
let Diagnostico = class Diagnostico {
    idDiagnostico;
    consulta;
    codigo;
    descripcion;
    tipo;
};
exports.Diagnostico = Diagnostico;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: "bigint", name: "id_diagnostico" }),
    __metadata("design:type", Number)
], Diagnostico.prototype, "idDiagnostico", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Consulta_entity_1.Consulta, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: "id_consulta" }),
    __metadata("design:type", Consulta_entity_1.Consulta)
], Diagnostico.prototype, "consulta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 30, nullable: true }),
    __metadata("design:type", Object)
], Diagnostico.prototype, "codigo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 500 }),
    __metadata("design:type", String)
], Diagnostico.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 30, nullable: true }),
    __metadata("design:type", Object)
], Diagnostico.prototype, "tipo", void 0);
exports.Diagnostico = Diagnostico = __decorate([
    (0, typeorm_1.Entity)({ name: "diagnostico" })
], Diagnostico);
//# sourceMappingURL=Diagnostico.entity.js.map