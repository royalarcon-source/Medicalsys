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
exports.Campana = void 0;
const typeorm_1 = require("typeorm");
let Campana = class Campana {
    idCampana;
    nombre;
    descripcion;
    fechaInicio;
    fechaFin;
    estado;
};
exports.Campana = Campana;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: "bigint", name: "id_campana" }),
    __metadata("design:type", Number)
], Campana.prototype, "idCampana", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 150 }),
    __metadata("design:type", String)
], Campana.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], Campana.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", name: "fecha_inicio" }),
    __metadata("design:type", Date)
], Campana.prototype, "fechaInicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true, name: "fecha_fin" }),
    __metadata("design:type", Object)
], Campana.prototype, "fechaFin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 30, default: "BORRADOR" }),
    __metadata("design:type", String)
], Campana.prototype, "estado", void 0);
exports.Campana = Campana = __decorate([
    (0, typeorm_1.Entity)({ name: "campana" })
], Campana);
//# sourceMappingURL=Campana.entity.js.map