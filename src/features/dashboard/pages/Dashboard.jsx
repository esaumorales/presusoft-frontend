import { useEffect, useState } from 'react';
import { budgetsService } from '../../budgets/api/budgets.service';
import { clientsService } from '../../clients/api/clients.service';
import { authService } from '../../auth/api/auth.service';

// Secondary palette
const C = {
  text:     '#1e2b39',
  muted:    '#89a8c8',
  border:   '#d0dbe6',
  bg:       '#f6f7f9',
  white:    '#ffffff',
  s500:     '#5280ad',
  s600:     '#3c6690',
  s700:     '#305373',
  s800:     '#273d53',
  s100:     '#ecf0f4',
  s200:     '#d0dbe6',
};

const STATUS_CFG = {
  draft:    { label: 'Borrador',  color: C.s600,   bg: C.s100 },
  sent:     { label: 'Enviado',   color: '#2563eb', bg: '#dbeafe' },
  accepted: { label: 'Aceptado', color: '#15803d', bg: '#dcfce7' },
  rejected: { label: 'Rechazado', color: '#b91c1c', bg: '#fee2e2' },
  expired:  { label: 'Vencido',  color: '#92400e', bg: '#fef3c7' },
};

const Sk = ({ w = 80 }) => (
  <div style={{ width: w, height: 14, borderRadius: 6, background: C.s200 }} />
);

export default function Dashboard() {
  const [budgets, setBudgets] = useState([]);
  const [clientCount, setCC] = useState(0);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [bR, cR, pR] = await Promise.allSettled([
        budgetsService.getAll(),
        clientsService.getAll(),
        authService.getProfile(),
      ]);
      if (bR.status === 'fulfilled') setBudgets(bR.value.data?.data || []);
      if (cR.status === 'fulfilled') setCC((cR.value.data?.data || []).length);
      if (pR.status === 'fulfilled') setProfile(pR.value.data?.data);
      setLoading(false);
    })();
  }, []);

  const draft    = budgets.filter(b => b.status === 'draft').length;
  const sent     = budgets.filter(b => b.status === 'sent').length;
  const accepted = budgets.filter(b => b.status === 'accepted').length;
  const rejected = budgets.filter(b => b.status === 'rejected').length;
  const revenue  = budgets.filter(b => b.status === 'accepted').reduce((s, b) => s + Number(b.total || 0), 0);
  const recent   = budgets.slice(0, 6);
  const total    = budgets.length || 1;

  const stats = [
    { label: 'Ingresos acumulados', value: `$${revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, sub: `${accepted} presupuestos aceptados`, accentColor: C.s700 },
    { label: 'Total presupuestos',  value: budgets.length,  sub: `${draft} borradores activos`,        accentColor: C.s600 },
    { label: 'Enviados',            value: sent,            sub: 'en espera de respuesta',              accentColor: C.s500 },
    { label: 'Clientes',            value: clientCount,     sub: `${rejected} presupuestos rechazados`, accentColor: '#89a8c8' },
  ];

  const months = ['E','F','M','A','M','J','J','A','S','O','N','D'];
  const bars   = [30, 55, 40, 70, 45, 85, 60, 80, 50, 90, 65, 88];

  const card = {
    background: C.white,
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    boxShadow: '0 1px 3px rgba(30,43,57,0.06)',
  };

  const th = {
    padding: '9px 20px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    background: C.bg,
    borderBottom: `1px solid ${C.border}`,
  };

  const td = {
    padding: '13px 20px',
    borderBottom: `1px solid ${C.bg}`,
    fontSize: 13,
    color: C.text,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Title */}
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>
          {loading ? 'Cargando…' : `Hola, ${profile?.name?.split(' ')[0] || 'Usuario'}`}
        </h1>
        <p style={{ margin: '3px 0 0', fontSize: 13, color: C.muted }}>
          Resumen de tu actividad comercial.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ ...card, padding: 18, borderTop: `3px solid ${s.accentColor}` }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {s.label}
            </p>
            {loading
              ? <Sk w={70} />
              : <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1 }}>{s.value}</p>
            }
            <p style={{ margin: '6px 0 0', fontSize: 12, color: C.muted }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart + Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>

        {/* Bar chart */}
        <div style={{ ...card, padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>Actividad mensual</p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>Presupuestos creados por mes</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.s600, background: C.s100, padding: '3px 10px', borderRadius: 20 }}>2025</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110 }}>
            {bars.map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                <div style={{
                  width: '100%',
                  height: `${h}%`,
                  background: i === bars.length - 1 ? C.s700 : C.s200,
                  borderRadius: '3px 3px 0 0',
                }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', marginTop: 6 }}>
            {months.map((m, i) => (
              <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: C.muted }}>{m}</span>
            ))}
          </div>
        </div>

        {/* Status breakdown */}
        <div style={{ ...card, padding: 22 }}>
          <p style={{ margin: '0 0 18px', fontSize: 14, fontWeight: 700, color: C.text }}>Por estado</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Aceptados',  count: accepted, color: '#15803d' },
              { label: 'Enviados',   count: sent,     color: C.s500 },
              { label: 'Borradores', count: draft,    color: C.s300 },
              { label: 'Rechazados', count: rejected, color: '#b91c1c' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{s.label}</span>
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 700 }}>{s.count}</span>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: C.s100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.max((s.count / total) * 100, s.count > 0 ? 5 : 0)}%`, background: s.color, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>Presupuestos recientes</p>
          <a href="/budgets" style={{ fontSize: 13, fontWeight: 600, color: C.s500, textDecoration: 'none' }}>Ver todos →</a>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Código', 'Título', 'Cliente', 'Total', 'Estado'].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}>
                {[50, 120, 80, 60, 60].map((w, j) => (
                  <td key={j} style={td}><Sk w={w} /></td>
                ))}
              </tr>
            )) : recent.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...td, textAlign: 'center', padding: '40px 20px', color: C.muted, fontWeight: 500 }}>
                  Sin presupuestos aún. Crea el primero desde la sección Presupuestos.
                </td>
              </tr>
            ) : recent.map(b => {
              const sc = STATUS_CFG[b.status] || STATUS_CFG.draft;
              return (
                <tr key={b.id}
                  onMouseEnter={e => e.currentTarget.style.background = C.bg}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                  style={{ transition: 'background 0.1s' }}
                >
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 12, color: C.muted, fontWeight: 600 }}>{b.code || `#${b.id}`}</td>
                  <td style={{ ...td, fontWeight: 600, maxWidth: 200 }}>
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</span>
                  </td>
                  <td style={{ ...td, color: C.s500 }}>{b.client?.name || '—'}</td>
                  <td style={{ ...td, fontWeight: 700 }}>${Number(b.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td style={td}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: sc.color, background: sc.bg }}>
                      {sc.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
