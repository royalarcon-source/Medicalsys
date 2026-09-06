import { useEffect } from 'react';
import type { FacturaItem } from '../services/facturaService';
import {
  X,
  Printer,
  FileCheck,
  Building,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  factura: FacturaItem | null;
  onClose: () => void;
}

export default function ModalVisorFactura({ factura, onClose }: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!factura) return null;

  const handlePrint = () => {
    window.print();
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
          maxWidth: '750px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar (Actions) */}
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
              Comprobante Digital de Facturación
            </span>
            <span
              style={{
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: factura.estado === 'PAGADA' ? '#dcfce7' : '#e0f2fe',
                color: factura.estado === 'PAGADA' ? '#166534' : '#0369a1',
                fontWeight: 600,
              }}
            >
              {factura.estado}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

        {/* Printable Invoice Container */}
        <div
          style={{
            padding: '32px',
            overflowY: 'auto',
            color: '#1e293b',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
          id="factura-print-area"
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #0284c7',
              paddingBottom: '20px',
              marginBottom: '24px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Building size={24} color="#0284c7" />
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                  CENTRO MÉDICO MEDICALSYS
                </h2>
              </div>
              <p style={{ margin: '2px 0', fontSize: '13px', color: '#64748b' }}>
                Av. Principal Médica #450, Edificio Salud
              </p>
              <p style={{ margin: '2px 0', fontSize: '13px', color: '#64748b' }}>
                Teléfono: (+591) 4-4123456 • Santa Cruz, Bolivia
              </p>
              <p style={{ margin: '2px 0', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                NIT Emisor: 1029384756
              </p>
            </div>

            <div
              style={{
                textAlign: 'right',
                backgroundColor: '#f8fafc',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', letterSpacing: '0.05em' }}>
                FACTURA DIGITAL
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                N° {factura.numeroFactura}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Autorización: 493029100234
              </div>
            </div>
          </div>

          {/* Customer & Issue Metadata */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
              backgroundColor: '#f8fafc',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
            }}
          >
            <div>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                Razón Social / Señor(a):
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px', fontSize: '14px' }}>
                {factura.razonSocial || pacienteNombre}
              </div>

              <div style={{ marginTop: '10px', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                NIT / CI:
              </div>
              <div style={{ fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
                {factura.nitCliente || factura.paciente?.documentoIdentidad || '0'}
              </div>
            </div>

            <div>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                Fecha y Hora de Emisión:
              </div>
              <div style={{ fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
                {formatearFecha(factura.fechaEmision)}
              </div>

              <div style={{ marginTop: '10px', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                Paciente Vinculado:
              </div>
              <div style={{ fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
                {pacienteNombre} {factura.paciente?.documentoIdentidad ? `(CI: ${factura.paciente.documentoIdentidad})` : ''}
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div style={{ marginBottom: '24px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'center', width: '60px', color: '#475569' }}>Cant.</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569' }}>Descripción del Servicio / Atención Médica</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', width: '120px', color: '#475569' }}>P. Unit (Bs)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', width: '120px', color: '#475569' }}>Subtotal (Bs)</th>
                </tr>
              </thead>
              <tbody>
                {factura.detalles && factura.detalles.length > 0 ? (
                  factura.detalles.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>
                        {item.cantidad}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {item.servicio?.nombre || `Servicio #${item.idServicio}`}
                        </div>
                        {item.servicio?.descripcion && (
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {item.servicio.descripcion}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        {Number(item.precioUnitario || item.servicio?.precio || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>
                        {Number(item.subtotal || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                      Consulta médica y servicios asociados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <div style={{ width: '280px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Subtotal:</span>
                <span style={{ fontWeight: 600 }}>Bs. {subtotalNum.toFixed(2)}</span>
              </div>

              {descuentoNum > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', color: '#16a34a' }}>
                  <span>Descuentos aplicados:</span>
                  <span style={{ fontWeight: 600 }}>- Bs. {descuentoNum.toFixed(2)}</span>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  marginTop: '4px',
                  borderTop: '2px solid #0f172a',
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#0f172a',
                }}
              >
                <span>TOTAL A PAGAR:</span>
                <span style={{ color: '#0284c7' }}>Bs. {totalNum.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer & Security Control Code */}
          <div
            style={{
              borderTop: '1px dashed #cbd5e1',
              paddingTop: '16px',
              fontSize: '11px',
              color: '#64748b',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, color: '#475569' }}>
                Código de Control: <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>{factura.codigoControl || 'N/A'}</span>
              </div>
              <div style={{ marginTop: '3px' }}>
                "ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS, EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE DE ACUERDO A LEY"
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a' }}>
              <ShieldCheck size={20} />
              <span style={{ fontWeight: 600, fontSize: '11px' }}>Comprobante Válido</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
