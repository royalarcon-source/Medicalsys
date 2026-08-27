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
exports.DetalleFactura = void 0;
const typeorm_1 = require("typeorm");
const Factura_entity_1 = require("./Factura.entity");
const Servicio_entity_1 = require("./Servicio.entity");
let DetalleFactura = class DetalleFactura {
    idDetalle;
    factura;
    servicio;
    cantidad;
    precioUnitario;
    subtotal;
};
exports.DetalleFactura = DetalleFactura;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: "bigint", name: "id_detalle" }),
    __metadata("design:type", Number)
], DetalleFactura.prototype, "idDetalle", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Factura_entity_1.Factura, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: "id_factura" }),
    __metadata("design:type", Factura_entity_1.Factura)
], DetalleFactura.prototype, "factura", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Servicio_entity_1.Servicio, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: "id_servicio" }),
    __metadata("design:type", Servicio_entity_1.Servicio)
], DetalleFactura.prototype, "servicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 1 }),
    __metadata("design:type", Number)
], DetalleFactura.prototype, "cantidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "numeric", precision: 12, scale: 2, name: "precio_unitario" }),
    __metadata("design:type", String)
], DetalleFactura.prototype, "precioUnitario", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "numeric", precision: 12, scale: 2 }),
    __metadata("design:type", String)
], DetalleFactura.prototype, "subtotal", void 0);
exports.DetalleFactura = DetalleFactura = __decorate([
    (0, typeorm_1.Entity)({ name: "detalle_factura" })
], DetalleFactura);
//# sourceMappingURL=DetalleFactura.entity.js.map