import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { collaboratorsService } from '../api/collaborators.service';
import { C, card } from '../../../core/styles/palette';

const btnPrimary = { padding: '9px 18px', background: C.s800, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };
const btnSecondary = { padding: '9px 18px', background: C.white, color: C.text, border: `1.5px solid ${C.border}`, borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' };

export default function TeamList() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({ name: '', roles: [''], hourlyRate: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchTeam = async () => {
    try {
      const res = await collaboratorsService.getAll();
      setTeam(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const openModal = (collaborator = null) => {
    if (collaborator) {
      setEditingId(collaborator.id);
      const rolesArray = collaborator.role ? collaborator.role.split(',').map(r => r.trim()).filter(Boolean) : [''];
      setForm({ name: collaborator.name, roles: rolesArray.length > 0 ? rolesArray : [''], hourlyRate: Number(collaborator.hourlyRate) });
    } else {
      setEditingId(null);
      setForm({ name: '', roles: [''], hourlyRate: 0 });
    }
    setError('');
    setShowModal(true);
  };

  const close = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const validRoles = form.roles.map(r => r.trim()).filter(Boolean);
      const payload = {
        name: form.name,
        role: validRoles.length > 0 ? validRoles.join(', ') : 'Otros',
        hourlyRate: Number(form.hourlyRate)
      };

      if (editingId) {
        await collaboratorsService.update(editingId, payload);
      } else {
        await collaboratorsService.create(payload);
      }
      
      await fetchTeam();
      close();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar el perfil ${name}?`)) return;
    try {
      await collaboratorsService.remove(id);
      setTeam(t => t.filter(x => x.id !== id));
    } catch (err) {
      alert('Error al eliminar.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.s900 }}>Perfiles de Equipo</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: C.s500, fontWeight: 500 }}>
            Configura los roles de tu empresa y su costo por hora para asignarlos a los proyectos.
          </p>
        </div>
        <button onClick={() => openModal()} style={btnPrimary}>
          <Icon icon="mdi:plus" style={{ fontSize: 18 }} /> Nuevo Perfil
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Cargando perfiles...</div>
      ) : team.length === 0 ? (
        <div style={{ ...card, padding: '80px 20px', textAlign: 'center' }}>
          <Icon icon="mdi:account-hard-hat-outline" style={{ fontSize: 64, color: C.s200, marginBottom: 16 }} />
          <h2 style={{ margin: 0, color: C.s800, fontSize: 20 }}>No tienes perfiles configurados</h2>
          <p style={{ color: C.s500, marginTop: 8 }}>Añade roles como "Frontend", "Diseñador" o "DevOps" para cotizar tus proyectos.</p>
          <button onClick={() => openModal()} style={{ ...btnPrimary, marginTop: 16 }}>Añadir mi primer perfil</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {team.map(profile => (
            <div key={profile.id} style={{ 
              ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              padding: '20px', transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: 12, background: C.s100, color: C.s700, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <Icon icon="mdi:briefcase-account-outline" style={{ fontSize: 24 }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>{profile.name}</h3>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                    {profile.role ? profile.role.split(',').map((r, i) => (
                      <span key={i} style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: C.s800, padding: '2px 8px', borderRadius: 12 }}>
                        {r.trim()}
                      </span>
                    )) : (
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: C.s800, padding: '2px 8px', borderRadius: 12 }}>
                        Perfil
                      </span>
                    )}
                    <span style={{ fontSize: 13, color: C.s500, fontWeight: 600, marginLeft: 4 }}>
                      ${Number(profile.hourlyRate).toLocaleString('en-US', { minimumFractionDigits: 2 })} / hr
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openModal(profile)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.s400, padding: 4 }} title="Editar">
                  <Icon icon="mdi:pencil-outline" style={{ fontSize: 20 }} />
                </button>
                <button onClick={() => handleDelete(profile.id, profile.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', padding: 4 }} title="Eliminar">
                  <Icon icon="mdi:trash-can-outline" style={{ fontSize: 20 }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(30,43,57,0.5)', backdropFilter: 'blur(2px)' }}
            onClick={e => e.target === e.currentTarget && close()}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, width: '100%', maxWidth: 420, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${C.border}`, background: C.s50 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.s900 }}>
                  {editingId ? 'Editar Miembro' : 'Nuevo Miembro'}
                </h2>
                <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.s400, padding: 4 }}><Icon icon="mdi:close" style={{ fontSize: 24 }} /></button>
              </div>

              <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && (
                  <div style={{ padding: '12px 16px', borderRadius: 8, background: '#fee2e2', color: '#b91c1c', fontSize: 13, fontWeight: 500 }}>
                    {error}
                  </div>
                )}
                
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.s700, marginBottom: 6 }}>Nombre del Miembro *</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ej. Juan Pérez o Desarrollador Senior"
                    required
                    style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 14, color: C.s900, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.s700, marginBottom: 6 }}>Roles asignados *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {form.roles.map((r, index) => (
                      <div key={index} style={{ display: 'flex', gap: 8 }}>
                        <input
                          value={r}
                          onChange={(e) => {
                            const newRoles = [...form.roles];
                            newRoles[index] = e.target.value;
                            setForm(f => ({ ...f, roles: newRoles }));
                          }}
                          placeholder="Ej. Frontend, Backend, QA"
                          required
                          style={{ flex: 1, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 14, color: C.s900, outline: 'none', boxSizing: 'border-box' }}
                        />
                        {form.roles.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newRoles = form.roles.filter((_, i) => i !== index);
                              setForm(f => ({ ...f, roles: newRoles }));
                            }}
                            style={{ width: 40, background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Eliminar rol"
                          >
                            <Icon icon="mdi:trash-can-outline" style={{ fontSize: 18 }} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, roles: [...f.roles, ''] }))}
                    style={{ marginTop: 8, background: 'none', border: 'none', color: C.s800, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 0' }}
                  >
                    <Icon icon="mdi:plus" /> Añadir otro rol a esta persona
                  </button>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.s700, marginBottom: 6 }}>Costo Base por Hora</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.s400, fontWeight: 700 }}>$</div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="hourlyRate"
                      value={form.hourlyRate}
                      onChange={(e) => setForm(f => ({ ...f, hourlyRate: e.target.value }))}
                      style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '10px 14px 10px 30px', fontSize: 14, color: C.s900, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                  <button type="button" onClick={close} style={{ ...btnSecondary, flex: 1 }}>Cancelar</button>
                  <button type="submit" style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }} disabled={saving}>
                    {saving ? <Icon icon="mdi:loading" className="animate-spin" /> : 'Guardar Perfil'}
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
