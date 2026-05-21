import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { templatesService } from '../api/templates.service';
import { C, card } from '../../../core/styles/palette';

const CATEGORIES = ['Desarrollo Web', 'App Móvil', 'E-commerce', 'Dashboard', 'API Backend', 'Sistema con IA', 'Landing Page', 'Otro'];
const EMPTY = { name: '', category: '', description: '' };

const inputStyle = { width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 7, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', background: C.white, boxSizing: 'border-box', fontFamily: 'inherit' };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 5 };
const btnPrimary = { padding: '9px 18px', background: C.s700, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };
const btnSecondary = { padding: '9px 18px', background: C.white, color: C.text, border: `1.5px solid ${C.border}`, borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' };

export default function TemplatesList() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetch = async () => {
    setLoading(true);
    try { const r = await templatesService.getAll(); setTemplates(r.data?.data || []); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setError(''); setShowModal(true); };
  const openEdit   = t => { setEditing(t); setForm({ name: t.name, category: t.category || '', description: t.description || '' }); setError(''); setShowModal(true); };
  const close      = () => { setShowModal(false); setEditing(null); };
  const set        = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editing) await templatesService.update(editing.id, form);
      else await templatesService.create({ ...form, modules: [] });
      await fetch(); close();
    } catch (err) { setError(err.response?.data?.message || 'Error al guardar.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm('¿Eliminar esta plantilla?')) return;
    await templatesService.remove(id); setTemplates(t => t.filter(x => x.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Plantillas</h1>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: C.muted }}>Reutiliza estructuras de presupuesto.</p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>
          <Icon icon="mdi:plus" style={{ fontSize: 16 }} /> Nueva Plantilla
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ ...card, padding: 20 }}>
              <div style={{ width: '70%', height: 16, background: C.s100, borderRadius: 5, marginBottom: 10 }} />
              <div style={{ width: '50%', height: 12, background: C.s100, borderRadius: 5 }} />
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div style={{ ...card, padding: 56, textAlign: 'center' }}>
          <Icon icon="mdi:text-box-multiple-outline" style={{ fontSize: 52, color: C.s200, display: 'block', margin: '0 auto 14px' }} />
          <p style={{ margin: 0, fontWeight: 600, color: C.text2, fontSize: 15 }}>Aún no tienes plantillas.</p>
          <p style={{ margin: '6px 0 20px', fontSize: 13, color: C.muted }}>Crea una para reutilizar en futuros presupuestos.</p>
          <button onClick={openCreate} style={btnPrimary}>
            <Icon icon="mdi:plus" /> Crear primera plantilla
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {templates.map(t => (
            <div key={t.id} style={{ ...card, padding: 20, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: C.s600, borderRadius: '10px 10px 0 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <p style={{ margin: 0, fontWeight: 700, color: C.text, fontSize: 14 }}>{t.name}</p>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => openEdit(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.s500, padding: 3 }}><Icon icon="mdi:pencil-outline" style={{ fontSize: 16 }} /></button>
                  <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', padding: 3 }}><Icon icon="mdi:trash-can-outline" style={{ fontSize: 16 }} /></button>
                </div>
              </div>
              {t.category && <span style={{ fontSize: 11, fontWeight: 600, color: C.s600, background: C.s100, padding: '2px 8px', borderRadius: 20 }}>{t.category}</span>}
              {t.description && <p style={{ margin: '8px 0 0', fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{t.description}</p>}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(30,43,57,0.45)' }}
            onClick={e => e.target === e.currentTarget && close()}>
            <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, width: '100%', maxWidth: 440, boxShadow: '0 20px 40px rgba(30,43,57,0.18)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: `1px solid ${C.border}` }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>{editing ? 'Editar Plantilla' : 'Nueva Plantilla'}</h2>
                <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><Icon icon="mdi:close" style={{ fontSize: 20 }} /></button>
              </div>
              <form onSubmit={handleSubmit} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {error && <div style={{ padding: '10px 14px', borderRadius: 7, background: '#fee2e2', color: '#b91c1c', fontSize: 13 }}>{error}</div>}
                <div><label style={labelStyle}>Nombre *</label><input required name="name" value={form.name} onChange={set} placeholder="Ej. App Web Estándar" style={inputStyle} /></div>
                <div>
                  <label style={labelStyle}>Categoría</label>
                  <select name="category" value={form.category} onChange={set} style={{ ...inputStyle }}>
                    <option value="">Sin categoría</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Descripción</label><textarea name="description" value={form.description} onChange={set} rows={3} placeholder="¿Para qué sirve esta plantilla?" style={{ ...inputStyle, resize: 'vertical' }} /></div>
                <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                  <button type="button" onClick={close} style={{ ...btnSecondary, flex: 1 }}>Cancelar</button>
                  <button type="submit" style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }} disabled={saving}>
                    {saving ? <Icon icon="mdi:loading" className="animate-spin" /> : editing ? 'Guardar' : 'Crear'}
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
