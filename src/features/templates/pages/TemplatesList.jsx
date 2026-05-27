import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {templates.map((t) => {
            const modulesCount = t.modules?.length || 0;
            const tasksCount = t.modules?.reduce((acc, m) => acc + (m.tasks?.length || 0), 0) || 0;
            return (
              <div key={t.id} className="group relative" style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(30,43,57,0.04)', display: 'flex', flexDirection: 'column' }}>
                
                {/* Mockup Preview Area */}
                <div style={{ height: 140, background: C.s50, borderBottom: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden', padding: 16 }}>
                  {/* True Document Preview using Scale */}
                  <div style={{ width: '250%', height: '250%', transform: 'scale(0.4)', transformOrigin: 'top left', background: C.white, padding: 32, pointerEvents: 'none', display: 'flex', flexDirection: 'column' }}>
                    {/* Header Documento */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${C.s200}`, paddingBottom: 20, marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, background: C.s900, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon icon="mdi:rocket-launch" style={{ color: 'white', fontSize: 26 }} />
                        </div>
                        <div>
                          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: C.s900 }}>{t.name}</h2>
                          <p style={{ margin: 0, color: C.s500, fontSize: 15, fontWeight: 500 }}>{t.category || 'Estructura Estándar'}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 24, fontWeight: 900, color: C.s300, letterSpacing: 1 }}>PRESUPUESTO</div>
                        <div style={{ fontSize: 15, color: C.s400, fontWeight: 600 }}>{modulesCount} Módulo{modulesCount !== 1 && 's'}</div>
                      </div>
                    </div>

                    {/* Contenido Real de la Plantilla (Módulos y Tareas) */}
                    <div style={{ flex: 1 }}>
                    {t.modules && t.modules.length > 0 ? (
                      t.modules.slice(0, 2).map((mod, mIdx) => (
                        <div key={mIdx} style={{ marginBottom: 16, border: `1.5px solid ${C.s200}`, borderRadius: 10, overflow: 'hidden' }}>
                          <div style={{ background: C.s50, padding: '14px 18px', fontWeight: 800, color: C.s800, fontSize: 17, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Icon icon="mdi:folder-outline" style={{ color: C.s500, fontSize: 20 }} />
                              {mod.name || 'Módulo Nuevo'}
                            </div>
                            <span style={{ fontSize: 14, color: C.s500, fontWeight: 600 }}>Subtotal</span>
                          </div>
                          {mod.tasks && mod.tasks.slice(0, 2).map((task, tIdx) => (
                            <div key={tIdx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 18px', borderTop: `1px solid ${C.s100}`, color: C.s600, fontSize: 16, background: '#fff' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Icon icon="mdi:check-circle-outline" style={{ color: C.s400, fontSize: 16 }} />
                                <span>{task.name || 'Tarea sin título'}</span>
                              </div>
                              <span style={{ fontWeight: 700, color: C.s800 }}>$ {task.price || '0.00'}</span>
                            </div>
                          ))}
                          {mod.tasks && mod.tasks.length > 2 && (
                            <div style={{ padding: '10px 18px', fontSize: 14, color: C.s400, fontStyle: 'italic', background: '#fafafa', borderTop: `1px solid ${C.s100}` }}>
                              + {mod.tasks.length - 2} tareas adicionales...
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: 40, border: `2px dashed ${C.s200}`, borderRadius: 12, textAlign: 'center', color: C.s400, background: C.s50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Icon icon="mdi:file-document-outline" style={{ fontSize: 56, marginBottom: 12, opacity: 0.5 }} />
                        <div style={{ fontSize: 18, fontWeight: 700 }}>Plantilla Vacía</div>
                        <div style={{ fontSize: 15, fontWeight: 500, marginTop: 4 }}>Agrega contenido para previsualizar.</div>
                      </div>
                    )}
                    </div>

                    {/* Total Mockup Footer */}
                    {t.modules && t.modules.length > 0 && (
                      <div style={{ marginTop: '16px', borderTop: `2px solid ${C.s200}`, paddingTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ background: C.s900, color: 'white', padding: '14px 28px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 20 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, opacity: 0.8, letterSpacing: 0.5 }}>TOTAL ESTIMADO</span>
                          <span style={{ fontSize: 28, fontWeight: 900 }}>$ ---</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Interactive Overlay Overlay on Hover */}
                  <div className="absolute inset-0 bg-secondary-900/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-sm z-10">
                    <Link to={`/templates/${t.id}`} className="btn-primary" style={{ background: C.white, color: C.s900, textDecoration: 'none', width: '70%', justifyContent: 'center' }}>
                      <Icon icon="mdi:table-edit" style={{ fontSize: 18 }} /> Abrir
                    </Link>
                    <div style={{ display: 'flex', gap: 8, width: '70%' }}>
                      <button onClick={() => openEdit(t)} style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 6, cursor: 'pointer', display: 'flex', justifyContent: 'center', transition: 'background 0.2s' }} className="hover:bg-white/30" title="Editar Nombre">
                        <Icon icon="mdi:pencil" style={{ fontSize: 16 }} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} style={{ flex: 1, padding: '8px', background: 'rgba(239,68,68,0.2)', border: 'none', color: '#fca5a5', borderRadius: 6, cursor: 'pointer', display: 'flex', justifyContent: 'center', transition: 'background 0.2s' }} className="hover:bg-red-500/40 hover:text-white" title="Eliminar">
                        <Icon icon="mdi:trash-can-outline" style={{ fontSize: 16 }} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Info Footer */}
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: 15, fontWeight: 700, color: C.text }}>{t.name}</h3>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                      {t.category && <span style={{ fontSize: 11, fontWeight: 600, color: C.s700, background: C.s100, padding: '2px 8px', borderRadius: 20 }}>{t.category}</span>}
                      <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>
                        {modulesCount} mód. • {tasksCount} tar.
                      </span>
                    </div>
                  </div>
                  {t.description && <p style={{ margin: 0, fontSize: 13, color: C.text2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>{t.description}</p>}
                </div>

              </div>
            );
          })}
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
