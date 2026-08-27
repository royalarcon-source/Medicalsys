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
exports.Tratamiento = void 0;
const typeorm_1 = require("typeorm");
const Consulta_entity_1 = require("./Consulta.entity");
let Tratamiento = class Tratamiento {
    idTratamiento;
    consulta;
    descripcion;
    indicaciones;
    fechaInicio;
    fechaFin;
};
exports.Tratamiento = Tratamiento;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: "bigint", name: "id_tratamiento" }),
    __metadata("design:type", Number)
], Tratamiento.prototype, "idTratamiento", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Consulta_entity_1.Consulta, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: "id_consulta" }),
    __metadata("design:type", Consulta_entity_1.Consulta)
], Tratamiento.prototype, "consulta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Tratamiento.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], Tratamiento.prototype, "indicaciones", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true, name: "fecha_inicio" }),
    __metadata("design:type", Object)
], Tratamiento.prototype, "fechaInicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true, name: "fecha_fin" }),
    __metadata("design:type", Object)
], Tratamiento.prototype, "fechaFin", void 0);
exports.Tratamiento = Tratamiento = __decorate([
    (0, typeorm_1.Entity)({ name: "tratamiento" })
], Tratamiento);
//# sourceMappingURL=Tratamiento.entity.js.map