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
exports.Notificacion = void 0;
const typeorm_1 = require("typeorm");
const Usuario_entity_1 = require("./Usuario.entity");
const Cita_entity_1 = require("./Cita.entity");
let Notificacion = class Notificacion {
    idNotificacion;
    usuario;
    cita;
    canal;
    tipo;
    mensaje;
    estado; // PENDIENTE | ENVIADA | FALLIDA | CANCELADA
    fechaProgramada;
    fechaEnvio;
};
exports.Notificacion = Notificacion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: "bigint", name: "id_notificacion" }),
    __metadata("design:type", Number)
], Notificacion.prototype, "idNotificacion", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Usuario_entity_1.Usuario, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: "id_usuario" }),
    __metadata("design:type", Usuario_entity_1.Usuario)
], Notificacion.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Cita_entity_1.Cita, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "id_cita" }),
    __metadata("design:type", Object)
], Notificacion.prototype, "cita", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 30 }),
    __metadata("design:type", String)
], Notificacion.prototype, "canal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50 }),
    __metadata("design:type", String)
], Notificacion.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Notificacion.prototype, "mensaje", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 30, default: "PENDIENTE" }),
    __metadata("design:type", String)
], Notificacion.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true, name: "fecha_programada" }),
    __metadata("design:type", Object)
], Notificacion.prototype, "fechaProgramada", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true, name: "fecha_envio" }),
    __metadata("design:type", Object)
], Notificacion.prototype, "fechaEnvio", void 0);
exports.Notificacion = Notificacion = __decorate([
    (0, typeorm_1.Entity)({ name: "notificacion" })
], Notificacion);
//# sourceMappingURL=Notificacion.entity.js.map