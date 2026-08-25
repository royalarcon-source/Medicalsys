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
exports.Documento = void 0;
const typeorm_1 = require("typeorm");
const Paciente_entity_1 = require("./Paciente.entity");
const HistoriaClinica_entity_1 = require("./HistoriaClinica.entity");
let Documento = class Documento {
    idDocumento;
    paciente;
    historia;
    tipo;
    nombreArchivo;
    mimeType;
    tamanoBytes;
    storageKey; // referencia al objeto en Blob Storage (S3/R2), NO el archivo en sí
    hashArchivo;
    fechaSubida;
    activo;
};
exports.Documento = Documento;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: "bigint", name: "id_documento" }),
    __metadata("design:type", Number)
], Documento.prototype, "idDocumento", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Paciente_entity_1.Paciente, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: "id_paciente" }),
    __metadata("design:type", Paciente_entity_1.Paciente)
], Documento.prototype, "paciente", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => HistoriaClinica_entity_1.HistoriaClinica, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "id_historia" }),
    __metadata("design:type", Object)
], Documento.prototype, "historia", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50 }),
    __metadata("design:type", String)
], Documento.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, name: "nombre_archivo" }),
    __metadata("design:type", String)
], Documento.prototype, "nombreArchivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, name: "mime_type" }),
    __metadata("design:type", String)
], Documento.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "bigint", nullable: true, name: "tamano_bytes" }),
    __metadata("design:type", Object)
], Documento.prototype, "tamanoBytes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 1000, unique: true, name: "storage_key" }),
    __metadata("design:type", String)
], Documento.prototype, "storageKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 128, nullable: true, name: "hash_archivo" }),
    __metadata("design:type", Object)
], Documento.prototype, "hashArchivo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamp", name: "fecha_subida" }),
    __metadata("design:type", Date)
], Documento.prototype, "fechaSubida", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], Documento.prototype, "activo", void 0);
exports.Documento = Documento = __decorate([
    (0, typeorm_1.Entity)({ name: "documento" })
], Documento);
//# sourceMappingURL=Documento.entity.js.map