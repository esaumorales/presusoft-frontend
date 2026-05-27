import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { budgetsService } from '../api/budgets.service';
import { clientsService } from '../../clients/api/clients.service';
import { templatesService } from '../../templates/api/templates.service';
import BudgetCreateWizard from '../components/BudgetCreateWizard';
import { C, card, STATUS_CFG } from '../../../core/styles/palette';

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
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCurrency, setFilterCurrency] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [showModal, setShowModal] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const [bR, cR, tR] = await Promise.allSettled([
        budgetsService.getAll(),
        clientsService.getAll(),
        templatesService.getAll()
      ]);
      if (bR.status === 'fulfilled') setBudgets(bR.value.data?.data || []);
      if (cR.status === 'fulfilled') setClients(cR.value.data?.data || []);
      if (tR.status === 'fulfilled') setTemplates(tR.value.data?.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

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
    .filter(b => filterCurrency === 'all' || b.currency === filterCurrency)
    .filter(b => {
      if (filterDate === 'all') return true;
      const date = new Date(b.createdAt || Date.now());
      const now = new Date();
      if (filterDate === 'month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      if (filterDate === 'year') return date.getFullYear() === now.getFullYear();
      return true;
    })
    .filter(b => {
      const clientName = b.project?.client?.name || '';
      return b.title?.toLowerCase().includes(search.toLowerCase()) || clientName.toLowerCase().includes(search.toLowerCase());
    });

  // Summary Metrics
  const activeCount = budgets.filter(b => ['accepted', 'sent'].includes(b.status)).length;
  const draftCount = budgets.filter(b => b.status === 'draft').length;
  const recentChanges = budgets.filter(b => new Date(b.updatedAt || Date.now()) > new Date(Date.now() - 86400000 * 3)).length; // last 3 days

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.text }}>Proyectos y Presupuestos</h1>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: C.muted }}>Gestiona y analiza tus propuestas comerciales.</p>
        </div>
        <button onClick={() => setShowModal(true)} style={btnPrimary}>
          <Icon icon="mdi:plus" style={{ fontSize: 16 }} /> Nuevo Proyecto
        </button>
      </div>

      {/* Panel de Resumen Rápido */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div style={{ ...card, padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon="mdi:file-document-multiple-outline" style={{ fontSize: 22 }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.muted }}>Total Presupuestos</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>{budgets.length}</p>
          </div>
        </div>
        <div style={{ ...card, padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon="mdi:check-decagram-outline" style={{ fontSize: 22 }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.muted }}>Proyectos Activos</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>{activeCount}</p>
          </div>
        </div>
        <div style={{ ...card, padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon="mdi:alert-circle-outline" style={{ fontSize: 22 }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.muted }}>Borradores / Alertas</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>{draftCount}</p>
          </div>
        </div>
        <div style={{ ...card, padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon="mdi:bell-ring-outline" style={{ fontSize: 22 }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.muted }}>Cambios Recientes</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>{recentChanges}</p>
          </div>
        </div>
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ ...card, flex: 1, minWidth: 250, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px' }}>
            <Icon icon="mdi:magnify" style={{ color: C.muted, fontSize: 18, flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar presupuesto o cliente..."
              style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%', color: C.text, background: 'transparent' }} />
          </div>
          <select value={filterCurrency} onChange={e => setFilterCurrency(e.target.value)} style={{ ...card, padding: '0 14px', fontSize: 13, fontWeight: 600, color: C.text, outline: 'none', cursor: 'pointer', border: `1px solid ${C.border}` }}>
            <option value="all">Todas las Monedas</option>
            <option value="PEN">Soles (PEN)</option>
            <option value="USD">Dólares (USD)</option>
            <option value="EUR">Euros (EUR)</option>
          </select>
          <select value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ ...card, padding: '0 14px', fontSize: 13, fontWeight: 600, color: C.text, outline: 'none', cursor: 'pointer', border: `1px solid ${C.border}` }}>
            <option value="all">Todas las Fechas</option>
            <option value="month">Este Mes</option>
            <option value="year">Este Año</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginRight: 4 }}>Estado:</span>
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
                  <td style={td({ color: C.s500 })}>{b.project?.client?.name || '—'}</td>
                  <td style={{ ...td(), fontWeight: 700 }}>
                    {b.currency === 'PEN' ? 'S/. ' : b.currency === 'EUR' ? '€ ' : '$ '}
                    {Number(b.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
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

      {/* Create Modal Wizard */}
      <BudgetCreateWizard 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onCreated={fetch} 
      />
    </div>
  );
}
