import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { companiesService } from '../api/companies.service';
import { authService } from '../../auth/api/auth.service';
import { useAuthStore } from '../../../core/store/useAuthStore';
import { C, card } from '../../../core/styles/palette';

const CURRENCIES = ['PEN', 'USD', 'EUR', 'COP', 'MXN', 'ARS', 'CLP'];
const inputStyle = { width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 7, padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', background: C.white, boxSizing: 'border-box', fontFamily: 'inherit' };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' };
const sectionHead = { display: 'flex', alignItems: 'center', gap: 12, padding: '18px 22px', borderBottom: `1px solid ${C.border}` };

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [company, setCompany] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [companyForm, setCompanyForm] = useState({ name: '', ruc: '', address: '', phone: '', email: '', website: '', currency: 'USD', taxPercentage: 18 });
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [savingC, setSavingC] = useState(false);
  const [savingP, setSavingP] = useState(false);
  const [msgC, setMsgC] = useState('');
  const [msgP, setMsgP] = useState('');

  useEffect(() => {
    (async () => {
      setLoadingCompany(true);
      const [cR, pR] = await Promise.allSettled([companiesService.getAll(), authService.getProfile()]);
      if (cR.status === 'fulfilled') {
        const cs = cR.value.data?.data || [];
        if (cs.length > 0) {
          const c = cs[0];
          setCompany(c);
          setCompanyForm({ name: c.name || '', ruc: c.ruc || '', address: c.address || '', phone: c.phone || '', email: c.email || '', website: c.website || '', currency: c.currency || 'USD', taxPercentage: Number(c.taxPercentage) || 18 });
        }
      }
      if (pR.status === 'fulfilled') {
        const p = pR.value.data?.data;
        if (p) { setProfileForm({ name: p.name || '', phone: p.phone || '' }); if (setUser) setUser(p); }
      }
      setLoadingCompany(false);
    })();
  }, []);

  const setC = e => setCompanyForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const setP = e => setProfileForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const saveProfile = async e => {
    e.preventDefault(); setSavingP(true); setMsgP('');
    try {
      await authService.updateProfile(user.id, profileForm);
      if (setUser) setUser({ ...user, ...profileForm });
      setMsgP('Perfil actualizado correctamente.');
    } catch (err) { setMsgP('Error: ' + (err.response?.data?.message || 'Inténtalo de nuevo.')); }
    finally { setSavingP(false); }
  };

  const saveCompany = async e => {
    e.preventDefault(); setSavingC(true); setMsgC('');
    try {
      const payload = { ...companyForm, taxPercentage: Number(companyForm.taxPercentage) };
      if (company) await companiesService.update(company.id, payload);
      else { const r = await companiesService.create(payload); setCompany(r.data?.data); }
      setMsgC('Empresa guardada correctamente.');
    } catch (err) { setMsgC('Error: ' + (err.response?.data?.message || 'Inténtalo de nuevo.')); }
    finally { setSavingC(false); }
  };

  const btnPrimary = { padding: '9px 20px', background: C.s700, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };
  const Msg = ({ txt }) => txt ? <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 500, color: txt.startsWith('Error') ? '#b91c1c' : '#15803d' }}>{txt}</p> : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Configuración</h1>
        <p style={{ margin: '3px 0 0', fontSize: 13, color: C.muted }}>Administra tu perfil y datos de empresa.</p>
      </div>

      {/* Profile */}
      <div style={card}>
        <div style={sectionHead}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.s700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: C.text, fontSize: 15 }}>Mi Perfil</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: C.muted }}>{user?.email} · <span style={{ textTransform: 'capitalize' }}>{user?.role}</span></p>
          </div>
        </div>
        <form onSubmit={saveProfile} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label style={labelStyle}>Nombre</label><input name="name" value={profileForm.name} onChange={setP} placeholder="Tu nombre" style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono</label><input name="phone" value={profileForm.phone} onChange={setP} placeholder="+51 999 999 999" style={inputStyle} /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Msg txt={msgP} />
            <button type="submit" style={btnPrimary} disabled={savingP}>
              {savingP ? <Icon icon="mdi:loading" className="animate-spin" /> : 'Guardar Perfil'}
            </button>
          </div>
        </form>
      </div>

      {/* Company */}
      <div style={card}>
        <div style={sectionHead}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.s800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            <Icon icon="mdi:domain" style={{ fontSize: 22 }} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: C.text, fontSize: 15 }}>Mi Empresa</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: C.muted }}>Estos datos aparecerán en tus presupuestos exportados.</p>
          </div>
        </div>
        {loadingCompany ? (
          <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ height: 38, background: C.s100, borderRadius: 7 }} />)}
          </div>
        ) : (
          <form onSubmit={saveCompany} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div><label style={labelStyle}>Nombre *</label><input required name="name" value={companyForm.name} onChange={setC} placeholder="Mi Empresa SAC" style={inputStyle} /></div>
              <div><label style={labelStyle}>RUC / NIT</label><input name="ruc" value={companyForm.ruc} onChange={setC} placeholder="20600000001" style={inputStyle} /></div>
              <div><label style={labelStyle}>Teléfono</label><input name="phone" value={companyForm.phone} onChange={setC} placeholder="01 234 5678" style={inputStyle} /></div>
              <div><label style={labelStyle}>Correo</label><input type="email" name="email" value={companyForm.email} onChange={setC} placeholder="empresa@email.com" style={inputStyle} /></div>
              <div><label style={labelStyle}>Sitio Web</label><input type="text" name="website" value={companyForm.website} onChange={setC} placeholder="www.miempresa.com" style={inputStyle} /></div>
              <div>
                <label style={labelStyle}>Moneda</label>
                <select name="currency" value={companyForm.currency} onChange={setC} style={{ ...inputStyle }}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>IGV / TAX (%)</label><input type="number" name="taxPercentage" value={companyForm.taxPercentage} onChange={setC} style={inputStyle} /></div>
            </div>
            <div><label style={labelStyle}>Dirección</label><input name="address" value={companyForm.address} onChange={setC} placeholder="Av. Principal 123, Lima" style={inputStyle} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Msg txt={msgC} />
              <button type="submit" style={btnPrimary} disabled={savingC}>
                {savingC ? <Icon icon="mdi:loading" className="animate-spin" /> : company ? 'Actualizar Empresa' : 'Crear Empresa'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
