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
exports.Promocion = void 0;
const typeorm_1 = require("typeorm");
const Campana_entity_1 = require("./Campana.entity");
let Promocion = class Promocion {
    idPromocion;
    campana;
    nombre;
    descripcion;
    porcentajeDesc;
    fechaInicio;
    fechaFin;
    activa;
};
exports.Promocion = Promocion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: "bigint", name: "id_promocion" }),
    __metadata("design:type", Number)
], Promocion.prototype, "idPromocion", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Campana_entity_1.Campana, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: "id_campana" }),
    __metadata("design:type", Campana_entity_1.Campana)
], Promocion.prototype, "campana", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 150 }),
    __metadata("design:type", String)
], Promocion.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], Promocion.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "numeric", precision: 5, scale: 2, nullable: true, name: "porcentaje_desc" }),
    __metadata("design:type", Object)
], Promocion.prototype, "porcentajeDesc", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", name: "fecha_inicio" }),
    __metadata("design:type", Date)
], Promocion.prototype, "fechaInicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true, name: "fecha_fin" }),
    __metadata("design:type", Object)
], Promocion.prototype, "fechaFin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], Promocion.prototype, "activa", void 0);
exports.Promocion = Promocion = __decorate([
    (0, typeorm_1.Entity)({ name: "promocion" })
], Promocion);
//# sourceMappingURL=Promocion.entity.js.map