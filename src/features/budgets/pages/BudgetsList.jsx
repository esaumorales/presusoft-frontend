import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { budgetsService } from '../api/budgets.service';
import { clientsService } from '../../clients/api/clients.service';
import { C, card, STATUS_CFG } from '../../../core/styles/palette';

const EMPTY = { title: '', description: '', clientId: '', currency: 'USD', taxPercentage: 18, validityDays: 15 };

const th = { padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', background: C.bg, borderBottom: `1px solid ${C.border}` };
const td = (extra = {}) => ({ padding: '13px 20px', borderBottom: `1px solid ${C.border2}`, fontSize: 13, color: C.text, ...extra });
const btnPrimary = { padding: '9px 18px', background: C.s700, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };
const btnSecondary = { padding: '9px 18px', background: C.white, color: C.text, border: `1.5px solid ${C.border}`, borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const iconBtn = (color = C.s600) => ({ padding: 6, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, cursor: 'pointer', color, display: 'inline-flex', alignItems: 'center' });
const filterBtn = (active) => ({ padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 20, border: `1.5px solid ${active ? C.s700 : C.border}`, background: active ? C.s700 : C.white, color: active ? '#fff' : C.text2, cursor: 'pointer' });

const STATUSES = ['all', 'draft', 'sent', 'accepted', 'rejected', 'expired'];
const LABELS   = { all: 'Todos', draft: 'Borrador', sent: 'Enviado', accepted: 'Aceptado', rejected: 'Rechazado', expired: 'Vencido' };

export default function BudgetsList() {
  const [budgets, setBudgets] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const [bR, cR] = await Promise.allSettled([budgetsService.getAll(), clientsService.getAll()]);
      if (bR.status === 'fulfilled') setBudgets(bR.value.data?.data || []);
      if (cR.status === 'fulfilled') setClients(cR.value.data?.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const close = () => { setShowModal(false); setForm(EMPTY); setError(''); };
  const set   = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form };
      if (payload.clientId === '') delete payload.clientId;
      payload.taxPercentage = Number(payload.taxPercentage);
      payload.validityDays  = Number(payload.validityDays);
      await budgetsService.create(payload);
      await fetch(); close();
    } catch (err) { setError(err.response?.data?.message || 'Error al crear.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm('¿Eliminar este presupuesto?')) return;
    await budgetsService.remove(id); setBudgets(b => b.filter(x => x.id !== id));
  };

  const handleDuplicate = async id => {
    try { await budgetsService.duplicate(id); await fetch(); }
    catch { alert('Error al duplicar.'); }
  };

  const filtered = budgets
    .filter(b => filterStatus === 'all' || b.status === filterStatus)
    .filter(b => b.title?.toLowerCase().includes(search.toLowerCase()) || b.client?.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Presupuestos</h1>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: C.muted }}>{budgets.length} presupuestos en total.</p>
        </div>
        <button onClick={() => setShowModal(true)} style={btnPrimary}>
          <Icon icon="mdi:plus" style={{ fontSize: 16 }} /> Nuevo Presupuesto
        </button>
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px' }}>
          <Icon icon="mdi:magnify" style={{ color: C.muted, fontSize: 18, flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar presupuesto o cliente..."
            style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%', color: C.text, background: 'transparent' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={filterBtn(filterStatus === s)}>{LABELS[s]}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Código</th>
              <th style={th}>Título</th>
              <th style={th}>Cliente</th>
              <th style={th}>Total</th>
              <th style={th}>Estado</th>
              <th style={{ ...th, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}>
                {[50, 160, 100, 70, 70, 80].map((w, j) => (
                  <td key={j} style={td()}><div style={{ width: w, height: 13, background: C.s100, borderRadius: 5 }} /></td>
                ))}
              </tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ ...td(), textAlign: 'center', padding: '48px 20px', color: C.muted, fontWeight: 500 }}>
                No se encontraron presupuestos.
              </td></tr>
            ) : filtered.map(b => {
              const sc = STATUS_CFG[b.status] || STATUS_CFG.draft;
              return (
                <tr key={b.id}
                  onMouseEnter={e => e.currentTarget.style.background = C.bg}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                  style={{ transition: 'background 0.1s' }}>
                  <td style={{ ...td(), fontFamily: 'monospace', fontSize: 12, color: C.muted, fontWeight: 700 }}>{b.code || `#${b.id}`}</td>
                  <td style={{ ...td(), fontWeight: 600, maxWidth: 220 }}>
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</span>
                  </td>
                  <td style={td({ color: C.s500 })}>{b.client?.name || '—'}</td>
                  <td style={{ ...td(), fontWeight: 700 }}>${Number(b.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td style={td()}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: sc.color, background: sc.bg }}>{sc.label}</span>
                  </td>
                  <td style={{ ...td(), textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 5 }}>
                      <Link to={`/budgets/${b.id}`} style={iconBtn(C.s600)} title="Editar"><Icon icon="mdi:pencil-outline" style={{ fontSize: 15 }} /></Link>
                      <button onClick={() => handleDuplicate(b.id)} style={iconBtn(C.s500)} title="Duplicar"><Icon icon="mdi:content-copy" style={{ fontSize: 15 }} /></button>
                      <button onClick={() => handleDelete(b.id)} style={iconBtn('#b91c1c')} title="Eliminar"><Icon icon="mdi:trash-can-outline" style={{ fontSize: 15 }} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(30,43,57,0.45)' }}
            onClick={e => e.target === e.currentTarget && close()}>
            <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, width: '100%', maxWidth: 480, boxShadow: '0 20px 40px rgba(30,43,57,0.18)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: `1px solid ${C.border}` }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>Nuevo Presupuesto</h2>
                <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><Icon icon="mdi:close" style={{ fontSize: 20 }} /></button>
              </div>
              <form onSubmit={handleSubmit} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {error && <div style={{ padding: '10px 14px', borderRadius: 7, background: '#fee2e2', color: '#b91c1c', fontSize: 13 }}>{error}</div>}
                {[
                  { label: 'Título *', name: 'title', placeholder: 'Ej. Sistema web para Acme Corp', required: true },
                  { label: 'Descripción', name: 'description', placeholder: 'Descripción breve...' },
                ].map(f => (
                  <div key={f.name}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 5 }}>{f.label}</label>
                    <input name={f.name} value={form[f.name]} onChange={set} placeholder={f.placeholder} required={f.required}
                      style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 7, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 5 }}>Cliente</label>
                  <select name="clientId" value={form.clientId} onChange={set} style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 7, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', background: C.white }}>
                    <option value="">Sin cliente asignado</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 5 }}>IGV (%)</label>
                    <input name="taxPercentage" type="number" value={form.taxPercentage} onChange={set}
                      style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 7, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 5 }}>Validez (días)</label>
                    <input name="validityDays" type="number" value={form.validityDays} onChange={set}
                      style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 7, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                  <button type="button" onClick={close} style={{ ...btnSecondary, flex: 1 }}>Cancelar</button>
                  <button type="submit" style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }} disabled={saving}>
                    {saving ? <Icon icon="mdi:loading" className="animate-spin" /> : 'Crear Presupuesto'}
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
