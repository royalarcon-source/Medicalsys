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
exports.Factura = void 0;
const typeorm_1 = require("typeorm");
const Paciente_entity_1 = require("./Paciente.entity");
let Factura = class Factura {
    idFactura;
    paciente;
    numeroFactura;
    fechaEmision;
    nitCliente;
    razonSocial;
    subtotal;
    impuestos;
    total;
    estado; // BORRADOR | EMITIDA | ANULADA | PAGADA
    codigoControl; // lo devuelve el SIN al validar (HU-31)
};
exports.Factura = Factura;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: "bigint", name: "id_factura" }),
    __metadata("design:type", Number)
], Factura.prototype, "idFactura", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Paciente_entity_1.Paciente, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: "id_paciente" }),
    __metadata("design:type", Paciente_entity_1.Paciente)
], Factura.prototype, "paciente", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, unique: true, nullable: true, name: "numero_factura" }),
    __metadata("design:type", Object)
], Factura.prototype, "numeroFactura", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamp", name: "fecha_emision" }),
    __metadata("design:type", Date)
], Factura.prototype, "fechaEmision", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 30, nullable: true, name: "nit_cliente" }),
    __metadata("design:type", Object)
], Factura.prototype, "nitCliente", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 200, nullable: true, name: "razon_social" }),
    __metadata("design:type", Object)
], Factura.prototype, "razonSocial", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "numeric", precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", String)
], Factura.prototype, "subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "numeric", precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", String)
], Factura.prototype, "impuestos", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "numeric", precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", String)
], Factura.prototype, "total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 30, default: "BORRADOR" }),
    __metadata("design:type", String)
], Factura.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true, name: "codigo_control" }),
    __metadata("design:type", Object)
], Factura.prototype, "codigoControl", void 0);
exports.Factura = Factura = __decorate([
    (0, typeorm_1.Entity)({ name: "factura" })
], Factura);
//# sourceMappingURL=Factura.entity.js.map