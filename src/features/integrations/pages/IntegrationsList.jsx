import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { providersService } from '../../budgets/api/providers.service';
import { C, card } from '../../../core/styles/palette';

export default function IntegrationsList() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    providersService.getAll()
      .then(res => setProviders(res.data?.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', website: '', description: '' });

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await providersService.create(form);
      const res = await providersService.getAll();
      setProviders(res.data?.data || []);
      setShowModal(false);
      setForm({ name: '', website: '', description: '' });
    } catch (err) {
      alert('Error al crear proveedor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Integraciones</h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: C.muted, maxWidth: 500, lineHeight: 1.5 }}>
            Conecta PresuSoft con tus herramientas favoritas de SaaS para estimar costos dinámicamente y sincronizar métricas.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', background: C.s700, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)' }}>
          <Icon icon="mdi:plus" style={{ fontSize: 18 }} /> Nueva Conexión
        </button>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(30,43,57,0.45)' }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, width: '100%', maxWidth: 400, padding: 24 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: C.text }}>Nuevo Proveedor SaaS</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 4 }}>Nombre</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 7, padding: '8px 12px', fontSize: 13, outline: 'none' }} placeholder="Ej. Vercel" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 4 }}>Sitio Web</label>
                <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} required style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 7, padding: '8px 12px', fontSize: 13, outline: 'none' }} placeholder="https://vercel.com" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 4 }}>Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 7, padding: '8px 12px', fontSize: 13, outline: 'none', resize: 'none' }} placeholder="Plataforma de despliegue frontend..." />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '8px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 6, cursor: 'pointer', fontWeight: 600, color: C.text }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '8px', background: C.s700, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, color: '#fff' }}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Grid of Providers */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ ...card, padding: 24, height: 200, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: C.s100, animation: 'pulse 1.5s infinite' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: '60%', height: 16, background: C.s100, borderRadius: 4, animation: 'pulse 1.5s infinite', marginBottom: 8 }} />
                  <div style={{ width: '40%', height: 12, background: C.s50, borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
                </div>
              </div>
              <div style={{ width: '100%', height: 40, background: C.s50, borderRadius: 6, animation: 'pulse 1.5s infinite', marginTop: 'auto' }} />
            </div>
          ))}
        </div>
      ) : providers.length === 0 ? (
        <div style={{ ...card, padding: 60, textAlign: 'center', color: C.muted }}>
          <Icon icon="mdi:api-off" style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} />
          <h3 style={{ margin: '0 0 8px', fontSize: 18, color: C.text, fontWeight: 700 }}>No hay integraciones disponibles</h3>
          <p style={{ margin: 0, fontSize: 14 }}>Intenta recargar o añade nuevos proveedores desde el backend.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {providers.map((prov, i) => (
            <motion.div
              key={prov.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ ...card, padding: 24, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}
              className="hover:shadow-lg transition-all duration-300 group"
            >
              {/* Status Badge */}
              <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#dcfce7', color: '#16a34a', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                Conectado
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.border}`, color: C.s800, fontSize: 24 }}>
                  {prov.name.toLowerCase().includes('mail') || prov.name.toLowerCase().includes('send') ? <Icon icon="mdi:email-fast-outline" /> : <Icon icon="mdi:cloud-outline" />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>{prov.name}</h3>
                  {prov.website && (
                    <a href={prov.website} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: C.s600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }} className="hover:text-blue-600">
                      {prov.website.replace('https://', '').replace('http://', '')} <Icon icon="mdi:open-in-new" style={{ fontSize: 10 }} />
                    </a>
                  )}
                </div>
              </div>

              <div style={{ flex: 1, marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                  {prov.description || `Integración nativa con ${prov.name}. Sincroniza costos y características de sus ${prov.plans?.length || 0} planes de suscripción para presupuestos dinámicos.`}
                </p>
              </div>

              <div style={{ padding: '12px 16px', background: C.bg, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${C.border}` }}>
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Planes Sincronizados</p>
                  <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 800, color: C.text }}>{prov.plans?.length || 0}</p>
                </div>
                <button style={{ background: 'transparent', border: 'none', color: C.s600, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} className="hover:text-blue-600 transition-colors">
                  Configurar <Icon icon="mdi:arrow-right" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
