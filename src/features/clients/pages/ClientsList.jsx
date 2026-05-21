import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { clientsService } from '../api/clients.service';
import { C, card } from '../../../core/styles/palette';

const EMPTY = { name: '', email: '', phone: '', businessName: '', address: '', documentNumber: '', notes: '' };

const th = { padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', background: C.bg, borderBottom: `1px solid ${C.border}` };
const td = (extra = {}) => ({ padding: '13px 20px', borderBottom: `1px solid ${C.border2}`, fontSize: 13, color: C.text, ...extra });

const Label = ({ children }) => (
  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{children}</label>
);

const Input = ({ value, onChange, placeholder, type = 'text', name, required, rows }) => {
  const base = { width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 7, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: C.white };
  if (rows) return <textarea value={value} onChange={onChange} placeholder={placeholder} name={name} rows={rows} style={{ ...base, resize: 'vertical' }} />;
  return <input value={value} onChange={onChange} placeholder={placeholder} type={type} name={name} required={required} style={base} />;
};

export default function ClientsList() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetch = async () => {
    setLoading(true);
    try { const r = await clientsService.getAll(); setClients(r.data?.data || []); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setError(''); setShowModal(true); };
  const openEdit   = c => { setEditing(c); setForm({ name: c.name || '', email: c.email || '', phone: c.phone || '', businessName: c.businessName || '', address: c.address || '', documentNumber: c.documentNumber || '', notes: c.notes || '' }); setError(''); setShowModal(true); };
  const close      = () => { setShowModal(false); setEditing(null); };
  const set        = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editing) await clientsService.update(editing.id, form);
      else await clientsService.create(form);
      await fetch(); close();
    } catch (err) { setError(err.response?.data?.message || 'Error al guardar.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm('¿Eliminar este cliente?')) return;
    await clientsService.remove(id); setClients(c => c.filter(x => x.id !== id));
  };

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.businessName?.toLowerCase().includes(search.toLowerCase())
  );

  const btnPrimary = { padding: '9px 18px', background: C.s700, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };
  const btnSecondary = { padding: '9px 18px', background: C.white, color: C.text, border: `1.5px solid ${C.border}`, borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' };
  const iconBtn = { padding: '6px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, cursor: 'pointer', color: C.s600, display: 'inline-flex', alignItems: 'center' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Clientes</h1>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: C.muted }}>{clients.length} clientes registrados.</p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>
          <Icon icon="mdi:plus" style={{ fontSize: 16 }} /> Nuevo Cliente
        </button>
      </div>

      {/* Search */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px' }}>
        <Icon icon="mdi:magnify" style={{ color: C.muted, fontSize: 18, flexShrink: 0 }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email o empresa..."
          style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%', color: C.text, background: 'transparent' }}
        />
      </div>

      {/* Table */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Cliente</th>
              <th style={th}>Empresa</th>
              <th style={th}>Teléfono</th>
              <th style={{ ...th, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}>
                {[140, 100, 90, 70].map((w, j) => (
                  <td key={j} style={td()}><div style={{ width: w, height: 14, background: C.s100, borderRadius: 5 }} /></td>
                ))}
              </tr>
            )) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ ...td(), textAlign: 'center', padding: '48px 20px', color: C.muted, fontWeight: 500 }}>
                  No se encontraron clientes.{!search && ' Crea el primero.'}
                </td>
              </tr>
            ) : filtered.map(c => (
              <tr key={c.id}
                onMouseEnter={e => e.currentTarget.style.background = C.bg}
                onMouseLeave={e => e.currentTarget.style.background = ''}
                style={{ transition: 'background 0.1s' }}
              >
                <td style={td()}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.s700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {c.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: C.text, fontSize: 13 }}>{c.name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{c.email}</p>
                    </div>
                  </div>
                </td>
                <td style={td({ color: C.text2, fontWeight: 500 })}>{c.businessName || '—'}</td>
                <td style={td({ color: C.s500 })}>{c.phone || '—'}</td>
                <td style={{ ...td(), textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                    <button onClick={() => openEdit(c)} style={iconBtn} title="Editar"><Icon icon="mdi:pencil-outline" style={{ fontSize: 16 }} /></button>
                    <button onClick={() => handleDelete(c.id)} style={{ ...iconBtn, color: '#b91c1c' }} title="Eliminar"><Icon icon="mdi:trash-can-outline" style={{ fontSize: 16 }} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(30,43,57,0.45)' }}
            onClick={e => e.target === e.currentTarget && close()}>
            <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, width: '100%', maxWidth: 480, boxShadow: '0 20px 40px rgba(30,43,57,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: `1px solid ${C.border}` }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>{editing ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}><Icon icon="mdi:close" style={{ fontSize: 20 }} /></button>
              </div>
              <form onSubmit={handleSubmit} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {error && <div style={{ padding: '10px 14px', borderRadius: 7, background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: 13 }}>{error}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><Label>Nombre *</Label><Input name="name" value={form.name} onChange={set} placeholder="María García" required /></div>
                  <div><Label>Correo *</Label><Input name="email" type="email" value={form.email} onChange={set} placeholder="maria@empresa.com" required /></div>
                  <div><Label>Teléfono</Label><Input name="phone" value={form.phone} onChange={set} placeholder="+51 999 999 999" /></div>
                  <div><Label>Empresa</Label><Input name="businessName" value={form.businessName} onChange={set} placeholder="Acme Corp" /></div>
                  <div><Label>RUC / DNI</Label><Input name="documentNumber" value={form.documentNumber} onChange={set} placeholder="20600000001" /></div>
                  <div><Label>Dirección</Label><Input name="address" value={form.address} onChange={set} placeholder="Lima, Perú" /></div>
                </div>
                <div><Label>Notas</Label><Input name="notes" value={form.notes} onChange={set} placeholder="Observaciones..." rows={2} /></div>
                <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                  <button type="button" onClick={close} style={{ ...btnSecondary, flex: 1 }}>Cancelar</button>
                  <button type="submit" style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }} disabled={saving}>
                    {saving ? <Icon icon="mdi:loading" className="animate-spin" style={{ fontSize: 18 }} /> : editing ? 'Guardar Cambios' : 'Crear Cliente'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
