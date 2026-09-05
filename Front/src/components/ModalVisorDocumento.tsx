import { useEffect } from 'react';
import type { DocumentoItem } from '../services/documentosService';
import {
  X,
  FileText,
  Image as ImageIcon,
  Download,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

interface Props {
  documento: DocumentoItem | null;
  onClose: () => void;
}

export default function ModalVisorDocumento({ documento, onClose }: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!documento) return null;

  const esImagen =
    documento.mimeType?.toLowerCase().includes('image') ||
    /\.(png|jpe?g|webp|gif|svg)$/i.test(documento.nombreArchivo);

  const esPdf =
    documento.mimeType?.toLowerCase().includes('pdf') ||
    /\.pdf$/i.test(documento.nombreArchivo);

  const formatearTamano = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-surface, #ffffff)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-page)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            {esImagen ? (
              <ImageIcon size={22} className="text-primary" />
            ) : (
              <FileText size={22} className="text-primary" />
            )}
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '500px',
                }}
              >
                {documento.nombreArchivo}
              </h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span className="badge badge-confirmada" style={{ fontSize: '11px', padding: '1px 6px' }}>
                  {documento.tipo}
                </span>
                <span>•</span>
                <span>{formatearTamano(documento.tamanoBytes)}</span>
                <span>•</span>
                <span>{new Date(documento.fechaSubida).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a
              href={documento.url}
              target="_blank"
              rel="noopener noreferrer"
              download={documento.nombreArchivo}
              style={{ textDecoration: 'none' }}
              title="Descargar o abrir en pestaña nueva"
            >
              <button
                type="button"
                className="button-secondary button-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <ExternalLink size={14} />
                <span>Abrir enlace</span>
              </button>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="button-secondary button-sm"
              style={{ padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Cerrar vista previa (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Cuerpo del Visor */}
        <div
          style={{
            padding: '16px',
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-subtle, #f8fafc)',
            minHeight: '400px',
          }}
        >
          {esImagen ? (
            <div style={{ textAlign: 'center', maxWidth: '100%' }}>
              <img
                src={documento.url}
                alt={documento.nombreArchivo}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
            </div>
          ) : esPdf ? (
            <iframe
              src={documento.url}
              title={documento.nombreArchivo}
              style={{
                width: '100%',
                height: '70vh',
                border: 'none',
                borderRadius: '8px',
                background: '#ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              <AlertCircle size={40} style={{ margin: '0 auto 10px', opacity: 0.6 }} />
              <p style={{ fontWeight: 600, fontSize: '15px', margin: '0 0 6px 0' }}>
                Vista previa no disponible para este tipo de archivo.
              </p>
              <p style={{ fontSize: '13px', margin: '0 0 16px 0' }}>
                Podés descargarlo o abrirlo directamente con el botón de abajo.
              </p>
              <a
                href={documento.url}
                target="_blank"
                rel="noopener noreferrer"
                download={documento.nombreArchivo}
              >
                <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={16} />
                  <span>Descargar Archivo</span>
                </button>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
