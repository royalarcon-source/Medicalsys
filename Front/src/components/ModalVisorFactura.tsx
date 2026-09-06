import { useState, useEffect } from 'react';
import type { FacturaItem } from '../services/facturaService';
import QRCodeDisplay from './QRCodeDisplay';
import {
  X,
  Printer,
  FileCheck,
  Building,
  Ban,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  factura: FacturaItem | null;
  onClose: () => void;
  onFacturaAnulada?: (facturaActualizada: FacturaItem) => void;
  puedeAnular?: boolean;
}

export default function ModalVisorFactura({
  factura,
  onClose,
  onFacturaAnulada,
  puedeAnular = false,
}: Props) {
  const [mostrarModalAnular, setMostrarModalAnular] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [anulando, setAnulando] = useState(false);
  const [errorAnulacion, setErrorAnulacion] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !mostrarModalAnular) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, mostrarModalAnular]);

  if (!factura) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmarAnulacion = async () => {
    if (!motivoAnulacion.trim() || motivoAnulacion.trim().length < 3) {
      setErrorAnulacion('Debe ingresar un motivo válido de anulación (mínimo 3 caracteres).');
      return;
    }

    try {
      setAnulando(true);
      setErrorAnulacion(null);
      const token = window.localStorage.getItem('token');
      const res = await fetch(`/api/facturas/${factura.idFactura}/anular`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ motivo: motivoAnulacion.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Error al anular la factura');
      }

      const resultado = await res.json();
      setMostrarModalAnular(false);
      if (onFacturaAnulada) {
        onFacturaAnulada(resultado.factura);
      }
    } catch (err: any) {
      setErrorAnulacion(err.message || 'No se pudo anular la factura');
    } finally {
      setAnulando(false);
    }
  };

  const formatearFecha = (fechaStr: string) => {
    try {
      const d = new Date(fechaStr);
      return d.toLocaleDateString('es-BO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return fechaStr;
    }
  };

  const pacienteNombre = factura.paciente?.usuario
    ? `${factura.paciente.usuario.nombres} ${factura.paciente.usuario.apellidos}`.trim()
    : 'Paciente General';

  const subtotalNum = Number(factura.subtotal) || 0;
  const totalNum = Number(factura.total) || 0;
  const descuentoNum = Number((subtotalNum - totalNum).toFixed(2));

  const nitEmisor = factura.datosFiscalesSIN?.nitEmisor || '1029384756';
  const numAutorizacion = factura.datosFiscalesSIN?.numeroAutorizacion || '493029100234';
  const leyendaLey = factura.datosFiscalesSIN?.leyendaLey || 'ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS, EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE DE ACUERDO A LEY';
  const leyendaSector = factura.datosFiscalesSIN?.leyendaSector || 'Documento emitido según normativa del Servicio de Impuestos Nacionales - Sector Salud';

  // Cadena para código QR normativo
  const cadenaQR = factura.datosFiscalesSIN?.cadenaQR ||
    `${nitEmisor}|${factura.numeroFactura?.replace(/\D/g, '') || factura.idFactura}|${numAutorizacion}|${new Date(factura.fechaEmision).toLocaleDateString('es-BO')}|${totalNum.toFixed(2)}|${totalNum.toFixed(2)}|${factura.codigoControl || '0'}|${factura.nitCliente || '0'}|0|0|0|${descuentoNum > 0 ? descuentoNum.toFixed(2) : '0'}`;

  const esAnulada = factura.estado === 'ANULADA';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          className="no-print"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCheck size={20} color="#0284c7" />
            <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '15px' }}>
              Comprobante Fiscal Digital (SIN Bolivia)
            </span>
            <span
              style={{
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: esAnulada ? '#fee2e2' : factura.estado === 'PAGADA' ? '#dcfce7' : '#e0f2fe',
                color: esAnulada ? '#b91c1c' : factura.estado === 'PAGADA' ? '#166534' : '#0369a1',
                fontWeight: 700,
              }}
            >
              {factura.estado}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {puedeAnular && !esAnulada && (
              <button
                type="button"
                onClick={() => setMostrarModalAnular(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  border: '1px solid #fca5a5',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Ban size={15} />
                <span>Anular Factura</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <Printer size={15} />
              <span>Imprimir / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '6px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                borderRadius: '6px',
              }}
              title="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Invoice Body */}
        <div
          style={{
            padding: '28px 32px',
            overflowY: 'auto',
            color: '#1e293b',
            fontFamily: 'Inter, system-ui, sans-serif',
            position: 'relative',
          }}
          id="factura-print-area"
        >
          {esAnulada && (
            <div
              style={{
                position: 'absolute',
                top: '40%',
                left: '20%',
                right: '20%',
                transform: 'rotate(-25deg)',
                color: 'rgba(239, 68, 68, 0.18)',
                fontSize: '72px',
                fontWeight: 900,
                textAlign: 'center',
                pointerEvents: 'none',
                userSelect: 'none',
                border: '8px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '16px',
                padding: '12px',
              }}
            >
              ANULADA
            </div>
          )}

          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #0284c7',
              paddingBottom: '16px',
              marginBottom: '20px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Building size={24} color="#0284c7" />
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                  CENTRO MÉDICO MEDICALSYS S.R.L.
                </h2>
              </div>
              <p style={{ margin: '2px 0', fontSize: '12px', color: '#64748b' }}>
                Casa Matriz: Av. Principal Médica #450, Edificio Salud
              </p>
              <p style={{ margin: '2px 0', fontSize: '12px', color: '#64748b' }}>
                Teléfono: (+591) 4-4123456 • Santa Cruz, Bolivia
              </p>
              <p style={{ margin: '2px 0', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                Actividad: SERVICIOS MÉDICOS Y ATENCIÓN DE SALUD
              </p>
            </div>

            <div
              style={{
                textAlign: 'right',
                backgroundColor: '#f8fafc',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                minWidth: '220px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                NIT: <span style={{ fontWeight: 800, color: '#0f172a' }}>{nitEmisor}</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', margin: '4px 0' }}>
                FACTURA N° {factura.numeroFactura}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Autorización: <span style={{ fontFamily: 'monospace' }}>{numAutorizacion}</span>
              </div>
              <div style={{ fontSize: '10px', color: '#0284c7', marginTop: '2px', fontWeight: 600 }}>
                ORIGINAL
              </div>
            </div>
          </div>

          {/* Customer Metadata */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
              backgroundColor: '#f8fafc',
              padding: '14px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
            }}
          >
            <div>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                Fecha y Hora de Emisión:
              </div>
              <div style={{ fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
                {formatearFecha(factura.fechaEmision)}
              </div>

              <div style={{ marginTop: '10px', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                Señor(a) / Razón Social:
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px', fontSize: '14px' }}>
                {factura.razonSocial || pacienteNombre}
              </div>
            </div>

            <div>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                NIT / CI / CEX:
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                {factura.nitCliente || factura.paciente?.documentoIdentidad || '0'}
              </div>

              <div style={{ marginTop: '10px', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                Paciente Registrado:
              </div>
              <div style={{ fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
                {pacienteNombre} {factura.paciente?.documentoIdentidad ? `(CI: ${factura.paciente.documentoIdentidad})` : ''}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: '20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: '50px', color: '#475569' }}>Cant.</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: '#475569' }}>Detalle de Servicio / Atención Médica</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', width: '110px', color: '#475569' }}>P. Unit (Bs)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', width: '110px', color: '#475569' }}>Subtotal (Bs)</th>
                </tr>
              </thead>
              <tbody>
                {factura.detalles && factura.detalles.length > 0 ? (
                  factura.detalles.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>
                        {item.cantidad}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {item.servicio?.nombre || `Servicio #${item.idServicio}`}
                        </div>
                        {item.servicio?.descripcion && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                            {item.servicio.descripcion}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                        {Number(item.precioUnitario || item.servicio?.precio || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>
                        {Number(item.subtotal || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ padding: '14px', textAlign: 'center', color: '#64748b' }}>
                      Consulta médica y servicios asociados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <div style={{ width: '300px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Subtotal:</span>
                <span style={{ fontWeight: 600 }}>Bs. {subtotalNum.toFixed(2)}</span>
              </div>

              {descuentoNum > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9', color: '#16a34a' }}>
                  <span>Descuentos aplicados:</span>
                  <span style={{ fontWeight: 600 }}>- Bs. {descuentoNum.toFixed(2)}</span>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  marginTop: '4px',
                  borderTop: '2px solid #0f172a',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#0f172a',
                }}
              >
                <span>TOTAL A PAGAR:</span>
                <span style={{ color: '#0284c7' }}>Bs. {totalNum.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '11px', color: '#64748b' }}>
                <span>Importe Base Crédito Fiscal:</span>
                <span style={{ fontWeight: 600 }}>Bs. {totalNum.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* SIN Fiscal Security Footer with Official QR Code */}
          <div
            style={{
              borderTop: '1px dashed #cbd5e1',
              paddingTop: '16px',
              display: 'flex',
              gap: '20px',
              alignItems: 'center',
            }}
          >
            {/* QR Code */}
            <div style={{ flexShrink: 0 }}>
              <QRCodeDisplay text={cadenaQR} size={115} title="Código QR Normativo SIN Bolivia" />
            </div>

            {/* Fiscal Text & Control Code */}
            <div style={{ flex: 1, fontSize: '11px', color: '#475569' }}>
              <div style={{ backgroundColor: '#f1f5f9', padding: '6px 10px', borderRadius: '6px', marginBottom: '8px' }}>
                <div style={{ fontWeight: 700, color: '#1e293b' }}>
                  Código de Control: <span style={{ fontFamily: 'monospace', color: '#0284c7', fontSize: '13px' }}>{factura.codigoControl || 'N/A'}</span>
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                  Fecha Límite de Emisión: 31/12/2026
                </div>
              </div>

              <div style={{ fontWeight: 700, textAlign: 'center', fontSize: '10px', color: '#0f172a', marginBottom: '4px' }}>
                "{leyendaLey}"
              </div>
              <div style={{ textAlign: 'center', fontSize: '10px', color: '#64748b' }}>
                "{leyendaSector}"
              </div>
            </div>
          </div>
        </div>

        {/* Modal Confirmación de Anulación */}
        {mostrarModalAnular && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '20px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                padding: '24px',
                maxWidth: '460px',
                width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#b91c1c', marginBottom: '12px' }}>
                <AlertTriangle size={24} />
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>
                  Anulación de Factura ante el SIN
                </h3>
              </div>

              <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 14px 0', lineHeight: '1.5' }}>
                ¿Está seguro de anular la factura <strong>{factura.numeroFactura}</strong>? Esta acción comunicará la anulación tributaria al SIN y revertirá los servicios asociados a estado pendiente.
              </p>

              {errorAnulacion && (
                <div style={{ padding: '8px 12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
                  {errorAnulacion}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Motivo de anulación (Requerido por normativa):
                </label>
                <textarea
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                  placeholder="Ej. Datos fiscales incorrectos / Error en emisión / Factura duplicada"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setMostrarModalAnular(false)}
                  disabled={anulando}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarAnulacion}
                  disabled={anulando}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {anulando ? 'Anulando...' : 'Confirmar Anulación'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
