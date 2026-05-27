import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuthStore } from '../../../core/store/useAuthStore';
import { useEffect } from 'react';

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Forzar siempre modo claro dentro del dashboard al montar
    document.documentElement.classList.remove('dark');
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { name: 'Proyectos',     path: '/budgets',      icon: 'mdi:file-document-outline' },
    { name: 'Clientes',      path: '/clients',      icon: 'mdi:account-group-outline' },
    { name: 'Equipo',        path: '/team',         icon: 'mdi:account-hard-hat-outline' },
    { name: 'Plantillas',    path: '/templates',    icon: 'mdi:text-box-multiple-outline' },
    { name: 'Reportes',      path: '/reports',      icon: 'mdi:chart-bar' },
    { name: 'Configuración', path: '/settings',     icon: 'mdi:cog-outline' },
    { name: 'Integraciones', path: '/integrations', icon: 'mdi:api' },
  ];

  // Colors from secondary palette
  const S = {
    bg:          '#f6f7f9',   // secondary-50
    sidebar:     '#1e2b39',   // secondary-900
    sidebarBorder:'#273d53', // secondary-800
    sidebarHover:'#273d53',  // secondary-800
    sidebarActive:'#305373', // secondary-700
    topbar:      '#ffffff',
    border:      '#d0dbe6',   // secondary-200
    text:        '#1e2b39',   // secondary-900
    textMuted:   '#89a8c8',   // secondary-400
    accent:      '#5280ad',   // secondary-500
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: S.bg }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 220, minWidth: 220, height: '100%',
        background: S.sidebar,
        borderRight: `1px solid ${S.sidebarBorder}`,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Logo */}
        <div style={{
          height: 60, padding: '0 20px',
          borderBottom: `1px solid ${S.sidebarBorder}`,
          display: 'flex', alignItems: 'center',
        }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' }}>
            PresuSoft
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(item => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8,
                  fontSize: 14, fontWeight: active ? 600 : 500, textDecoration: 'none',
                  background: active ? S.sidebarActive : 'transparent',
                  color: active ? '#fff' : '#afc4d9',
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = S.sidebarHover; e.currentTarget.style.color = '#fff'; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#afc4d9'; }}}
              >
                <Icon icon={item.icon} style={{ fontSize: 18, flexShrink: 0 }} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '10px 10px 16px', borderTop: `1px solid ${S.sidebarBorder}` }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, width: '100%',
              fontSize: 14, fontWeight: 500, color: '#89a8c8',
              background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = S.sidebarHover; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#89a8c8'; }}
          >
            <Icon icon="mdi:logout" style={{ fontSize: 18 }} />
            Cerrar Sesión
          </button>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#305373', marginTop: 8 }}>
            Hecho por <span style={{ color: '#5280ad', fontWeight: 600 }}>Biznovatech</span>
          </p>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Topbar */}
        <header style={{
          height: 60, minHeight: 60,
          background: S.topbar,
          borderBottom: `1px solid ${S.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px',
        }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: S.bg, border: `1.5px solid ${S.border}`,
            borderRadius: 8, padding: '7px 12px', width: 280,
          }}>
            <Icon icon="mdi:magnify" style={{ color: '#89a8c8', fontSize: 16, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Buscar..."
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, width: '100%', color: S.text }}
            />
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button style={{ position: 'relative', width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid ${S.border}`, cursor: 'pointer', color: '#5280ad' }}>
              <Icon icon="mdi:bell-outline" style={{ fontSize: 18 }} />
              <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, background: '#dc2626', borderRadius: '50%', border: '1.5px solid #fff' }} />
            </button>

            <div style={{ width: 1, height: 28, background: S.border }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: S.sidebarActive,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
              }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div style={{ lineHeight: 1.3 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: 0 }}>{user?.name || 'Usuario'}</p>
                <p style={{ fontSize: 11, color: S.textMuted, margin: 0, textTransform: 'capitalize' }}>{user?.role || 'editor'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 24, background: S.bg }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
