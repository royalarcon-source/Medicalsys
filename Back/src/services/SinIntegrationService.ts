/**
 * Servicio de Integración con el Servicio de Impuestos Nacionales (SIN) de Bolivia (HU-31)
 */
import {
  generarCodigoControl,
  generarCadenaQR,
  validarNITBolivia,
  DatosCadenaQR,
} from "../utils/sinFacturacion";

export interface FiscalConfigSIN {
  nitEmisor: string;
  razonSocialEmisor: string;
  numeroAutorizacion: string;
  llaveDosificacion: string;
  actividadEconomica: string;
  casaMatriz: string;
  municipio: string;
  leyendaLey: string;
  leyendaSector: string;
}

export class SinIntegrationService {
  // Configuración de dosificación fiscal por defecto para MedicalSys
  private static config: FiscalConfigSIN = {
    nitEmisor: process.env.SIN_NIT_EMISOR || "1029384756",
    razonSocialEmisor: process.env.SIN_RAZON_SOCIAL || "CENTRO MÉDICO MEDICALSYS S.R.L.",
    numeroAutorizacion: process.env.SIN_NUMERO_AUTORIZACION || "493029100234",
    llaveDosificacion: process.env.SIN_LLAVE_DOSIFICACION || "9rBda?zkgb2&AjFUy7P%ah9A&DocumentacionMedicalSysBolivia2026",
    actividadEconomica: "SERVICIOS MÉDICOS Y ATENCIÓN DE SALUD",
    casaMatriz: "Av. Principal Médica #450, Edificio Salud",
    municipio: "Santa Cruz, Bolivia",
    leyendaLey: "ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS, EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE DE ACUERDO A LEY",
    leyendaSector: "Documento emitido según normativa del Servicio de Impuestos Nacionales - Sector Salud",
  };

  /**
   * Obtiene la configuración fiscal actual del emisor
   */
  static getConfig(): FiscalConfigSIN {
    return { ...this.config };
  }

  /**
   * Genera el Código de Control oficial del SIN y la cadena QR reglamentaria
   */
  static generarDatosFiscales(params: {
    numeroFactura: string;
    nitCliente: string;
    fechaEmision: Date;
    total: number;
    descuento?: number;
  }): {
    codigoControl: string;
    numeroAutorizacion: string;
    nitEmisor: string;
    razonSocialEmisor: string;
    cadenaQR: string;
    leyendaLey: string;
    leyendaSector: string;
  } {
    const { numeroFactura, nitCliente, fechaEmision, total, descuento = 0 } = params;

    // 1. Validar NIT
    const validacionNIT = validarNITBolivia(nitCliente);
    if (!validacionNIT.valido) {
      throw { status: 400, message: validacionNIT.mensaje };
    }

    // 2. Extraer correlativo numérico si viene con prefijo (e.g. "FAC-2026-00001" -> 1)
    const numeroFacturaLimpio = numeroFactura.replace(/\D/g, "") || "1";

    // 3. Generar Código de Control SFV oficial
    const codigoControl = generarCodigoControl({
      numeroAutorizacion: this.config.numeroAutorizacion,
      numeroFactura: numeroFacturaLimpio,
      nitCliente: nitCliente || "0",
      fechaEmision,
      montoTotal: total,
      llaveDosificacion: this.config.llaveDosificacion,
    });

    // 4. Generar Cadena para Código QR normativo
    const datosQR: DatosCadenaQR = {
      nitEmisor: this.config.nitEmisor,
      numeroFactura: numeroFacturaLimpio,
      numeroAutorizacion: this.config.numeroAutorizacion,
      fechaEmision,
      totalBs: total,
      importeBaseCreditoFiscal: total,
      codigoControl,
      nitCliente: nitCliente || "0",
      descuento,
    };

    const cadenaQR = generarCadenaQR(datosQR);

    return {
      codigoControl,
      numeroAutorizacion: this.config.numeroAutorizacion,
      nitEmisor: this.config.nitEmisor,
      razonSocialEmisor: this.config.razonSocialEmisor,
      cadenaQR,
      leyendaLey: this.config.leyendaLey,
      leyendaSector: this.config.leyendaSector,
    };
  }

  /**
   * Valida la autenticidad de un Código de Control con los parámetros de la factura
   */
  static validarFacturaConSIN(params: {
    numeroAutorizacion: string;
    numeroFactura: string;
    nitCliente: string;
    fechaEmision: Date | string;
    total: number;
    codigoControl: string;
  }): boolean {
    const numeroFacturaLimpio = params.numeroFactura.replace(/\D/g, "") || "1";
    const codigoGenerado = generarCodigoControl({
      numeroAutorizacion: params.numeroAutorizacion || this.config.numeroAutorizacion,
      numeroFactura: numeroFacturaLimpio,
      nitCliente: params.nitCliente || "0",
      fechaEmision: params.fechaEmision,
      montoTotal: params.total,
      llaveDosificacion: this.config.llaveDosificacion,
    });

    return codigoGenerado.toUpperCase() === params.codigoControl.toUpperCase();
  }

  /**
   * Comunica la anulación de factura al SIN (Simulación conforme a protocolo SIAT/SFV)
   */
  static async anularFacturaEnSIN(params: {
    numeroFactura: string;
    numeroAutorizacion: string;
    motivo: string;
  }): Promise<{ exito: boolean; codigoRespuesta: string; mensaje: string }> {
    if (!params.motivo || params.motivo.trim().length < 3) {
      throw { status: 400, message: "Debe especificar un motivo válido de anulación para el SIN." };
    }

    // Registro de anulación tributaria en SIN
    return {
      exito: true,
      codigoRespuesta: "SIN-ANULACION-OK-908",
      mensaje: `La factura ${params.numeroFactura} fue anulada correctamente ante el SIN. Motivo: ${params.motivo}`,
    };
  }
}
