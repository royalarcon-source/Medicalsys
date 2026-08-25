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
exports.Medico = void 0;
const typeorm_1 = require("typeorm");
const Usuario_entity_1 = require("./Usuario.entity");
const Especialidad_entity_1 = require("./Especialidad.entity");
let Medico = class Medico {
    idMedico;
    usuario;
    numeroColegiatura;
    activo;
    especialidades;
};
exports.Medico = Medico;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: "bigint", name: "id_medico" }),
    __metadata("design:type", Number)
], Medico.prototype, "idMedico", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Usuario_entity_1.Usuario, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: "id_usuario" }),
    __metadata("design:type", Usuario_entity_1.Usuario)
], Medico.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, unique: true, name: "numero_colegiatura" }),
    __metadata("design:type", String)
], Medico.prototype, "numeroColegiatura", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], Medico.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Especialidad_entity_1.Especialidad, (especialidad) => especialidad.medicos),
    (0, typeorm_1.JoinTable)({
        name: "medico_especialidad", // usa la tabla intermedia que YA EXISTE en Supabase
        joinColumn: { name: "id_medico", referencedColumnName: "idMedico" },
        inverseJoinColumn: { name: "id_especialidad", referencedColumnName: "idEspecialidad" },
    }),
    __metadata("design:type", Array)
], Medico.prototype, "especialidades", void 0);
exports.Medico = Medico = __decorate([
    (0, typeorm_1.Entity)({ name: "medico" })
], Medico);
//# sourceMappingURL=Medico.entity.js.map