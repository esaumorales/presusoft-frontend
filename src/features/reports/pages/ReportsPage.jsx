import { Icon } from '@iconify/react';
import { C, card } from '../../../core/styles/palette';
import { motion } from 'framer-motion';

import { useState, useEffect } from 'react';
import { budgetsService } from '../../budgets/api/budgets.service';

export default function ReportsPage() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    budgetsService.getAll()
      .then(res => setBudgets(res.data?.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Compute real stats from backend data
  const accepted = budgets.filter(b => b.status === 'accepted');
  const sent = budgets.filter(b => b.status === 'sent');
  const drafts = budgets.filter(b => b.status === 'draft');
  const nonDrafts = budgets.filter(b => b.status !== 'draft');

  const totalRevenue = accepted.reduce((acc, b) => acc + Number(b.total || 0), 0);
  const conversionRate = nonDrafts.length > 0 ? Math.round((accepted.length / nonDrafts.length) * 100) : 0;

  const stats = [
    { label: 'Ingresos Estimados', value: `$${totalRevenue.toLocaleString()}`, trend: 'Mensual', icon: 'mdi:currency-usd', color: '#10b981' },
    { label: 'Presupuestos Aprobados', value: accepted.length.toString(), trend: 'Confirmados', icon: 'mdi:file-check-outline', color: '#3b82f6' },
    { label: 'Tasa de Conversión', value: `${conversionRate}%`, trend: 'De los enviados', icon: 'mdi:chart-arc', color: '#8b5cf6' },
    { label: 'Total Emitidos', value: budgets.length.toString(), trend: 'Histórico', icon: 'mdi:folder-multiple-outline', color: '#f59e0b' }
  ];

  const statuses = budgets.length > 0 ? [
    { label: 'Aceptados', percent: Math.round((accepted.length / budgets.length) * 100), color: '#10b981' },
    { label: 'Enviados (Pendientes)', percent: Math.round((sent.length / budgets.length) * 100), color: '#f59e0b' },
    { label: 'Borradores', percent: Math.round((drafts.length / budgets.length) * 100), color: '#64748b' }
  ] : [
    { label: 'Aceptados', percent: 0, color: '#10b981' },
    { label: 'Enviados (Pendientes)', percent: 0, color: '#f59e0b' },
    { label: 'Borradores', percent: 0, color: '#64748b' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Reportes y Analíticas</h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: C.muted, maxWidth: 500, lineHeight: 1.5 }}>
            Visualiza el rendimiento de tus propuestas comerciales, tasas de conversión y proyecciones de ingresos.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select style={{ padding: '8px 16px', background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: C.text, outline: 'none', cursor: 'pointer' }}>
            <option>Últimos 30 días</option>
            <option>Este Trimestre</option>
            <option>Este Año</option>
          </select>
          <button style={{ padding: '8px 16px', background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: C.text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon icon="mdi:tray-arrow-down" style={{ fontSize: 16 }} /> Exportar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${stat.color}15`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon icon={stat.icon} style={{ fontSize: 24 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 8px', borderRadius: 20, background: stat.trend.startsWith('+') ? '#dcfce7' : '#fee2e2', color: stat.trend.startsWith('+') ? '#16a34a' : '#dc2626' }}>
                {stat.trend}
              </span>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.text }}>{stat.value}</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: C.muted }}>{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Placeholder */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ ...card, padding: 24, minHeight: 350, display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>Evolución de Ingresos</h3>
            <Icon icon="mdi:dots-horizontal" style={{ color: C.muted, cursor: 'pointer' }} />
          </div>
          <div style={{ flex: 1, background: `repeating-linear-gradient(0deg, transparent, transparent 39px, ${C.border} 40px)`, display: 'flex', alignItems: 'flex-end', gap: '4%', padding: '0 20px', position: 'relative' }}>
            {/* Mock bars */}
            {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
              <div key={i} className="group relative" style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ width: '100%', height: `${h}%`, background: '#3b82f6', borderRadius: '4px 4px 0 0', opacity: 0.8, transition: 'all 0.3s' }} className="group-hover:opacity-100 group-hover:scale-y-[1.02] origin-bottom cursor-pointer" />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px 0', color: C.muted, fontSize: 11, fontWeight: 600 }}>
            <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span><span>Jul</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ ...card, padding: 24, display: 'flex', flexDirection: 'column' }}
        >
          <h3 style={{ margin: '0 0 24px', fontSize: 16, fontWeight: 700, color: C.text }}>Presupuestos por Estado</h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {statuses.map((item, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>
                  <span>{item.label}</span>
                  <span>{item.percent}%</span>
                </div>
                <div style={{ height: 8, background: C.s100, borderRadius: 4, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percent}%` }}
                    transition={{ duration: 1, delay: 0.5 + (i * 0.2) }}
                    style={{ height: '100%', background: item.color, borderRadius: 4 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
