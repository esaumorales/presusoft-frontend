import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { budgetsService } from '../api/budgets.service';
import { clientsService } from '../../clients/api/clients.service';
import { templatesService } from '../../templates/api/templates.service';
import { collaboratorsService } from '../../team/api/collaborators.service';
import { C } from '../../../core/styles/palette';

const btnPrimary = { padding: '10px 20px', background: C.s800, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };
const btnSecondary = { padding: '10px 20px', background: C.white, color: C.text, border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' };
const inputStyle = { width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '12px 16px', fontSize: 14, color: C.s900, outline: 'none', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 700, color: C.s700, marginBottom: 6 };

const EMPTY = { title: '', description: '', clientId: '', templateId: '', currency: 'PEN', taxPercentage: 18, validityDays: 15 };

export default function BudgetCreateWizard({ isOpen, onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY);
  const [clients, setClients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [teamSelection, setTeamSelection] = useState({}); // { collaboratorId: quantity }
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setForm(EMPTY);
      setTeamSelection({});
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [cR, tR, colR] = await Promise.allSettled([
        clientsService.getAll(),
        templatesService.getAll(),
        collaboratorsService.getAll()
      ]);
      if (cR.status === 'fulfilled') setClients(cR.value.data?.data || []);
      if (tR.status === 'fulfilled') setTemplates(tR.value.data?.data || []);
      if (colR.status === 'fulfilled') setCollaborators(colR.value.data?.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  const moveToProject = (id, roleName = null) => {
    const defaultRole = collaborators.find(c => c.id === id)?.role?.split(',')[0]?.trim() || 'Otros';
    setTeamSelection(prev => {
      const currentRoles = prev[id]?.projectRoles || [];
      const newRole = roleName || defaultRole;
      if (!currentRoles.includes(newRole)) {
        return { ...prev, [id]: { quantity: 1, projectRoles: [...currentRoles, newRole] } };
      }
      return prev;
    });
  };

  const toggleProjectRole = (id, roleName) => {
    setTeamSelection(prev => {
      const currentRoles = prev[id]?.projectRoles || [];
      let newRoles;
      if (currentRoles.includes(roleName)) {
        newRoles = currentRoles.filter(r => r !== roleName);
        if (newRoles.length === 0) return prev; // Require at least one role
      } else {
        newRoles = [...currentRoles, roleName];
      }
      return { ...prev, [id]: { ...prev[id], projectRoles: newRoles } };
    });
  };
  const moveToAvailable = (id) => setTeamSelection(prev => {
    const next = { ...prev };
    delete next[id];
    return next;
  });

  const handleDragStart = (e, id, roleName) => {
    e.dataTransfer.setData('memberId', id);
    e.dataTransfer.setData('roleName', roleName);
  };

  const handleDropToProject = (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('memberId');
    const roleName = e.dataTransfer.getData('roleName');
    if (id) moveToProject(id, roleName);
  };

  const handleDropToAvailable = (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('memberId');
    if (id) moveToAvailable(id);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      const payload = {
        title: form.title,
        description: form.description,
        clientId: form.clientId === '' ? undefined : form.clientId,
        templateId: form.templateId === '' ? undefined : form.templateId,
        currency: form.currency,
        taxPercentage: Number(form.taxPercentage),
        validityDays: Number(form.validityDays),
        team: Object.entries(teamSelection).map(([id, info]) => ({
          collaboratorId: id,
          quantity: info.quantity,
          projectRole: info.projectRoles.join(', ')
        }))
      };

      await budgetsService.create(payload);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el proyecto.');
    } finally {
      setSaving(false);
    }
  };

  const selectedIds = Object.keys(teamSelection);
  const disponibles = collaborators.filter(c => !selectedIds.includes(c.id));
  const seleccionados = collaborators.filter(c => selectedIds.includes(c.id));

  const rolesGrouped = disponibles.reduce((acc, c) => {
    const rolesString = c.role || 'Otros';
    const roles = rolesString.split(',').map(r => r.trim()).filter(Boolean);
    if (roles.length === 0) roles.push('Otros');
    roles.forEach(r => {
      if (!acc[r]) acc[r] = [];
      acc[r].push(c);
    });
    return acc;
  }, {});

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}
        onClick={e => e.target === e.currentTarget && onClose()}>
        
        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: step === 1 ? 600 : 960, transition: 'max-width 0.3s ease', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)' }}>
          
          <div style={{ background: C.s50, padding: '24px 32px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: step === 1 ? '#fff' : C.s500, background: step === 1 ? C.s800 : C.s200, padding: '2px 8px', borderRadius: 12 }}>Paso 1</span>
                <div style={{ width: 30, height: 2, background: C.border }} />
                <span style={{ fontSize: 12, fontWeight:800, color: step === 2 ? '#fff' : C.s500, background: step === 2 ? C.s800 : C.s200, padding: '2px 8px', borderRadius: 12 }}>Paso 2</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.s900 }}>
                {step === 1 ? 'Detalles del Proyecto' : 'Asignación de Equipo'}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: C.s500 }}>
                {step === 1 ? 'Comienza definiendo la información básica y el cliente.' : 'Selecciona a los miembros del equipo que participarán en este proyecto.'}
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.s400, padding: 4 }}><Icon icon="mdi:close" style={{ fontSize: 24 }} /></button>
          </div>

          <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
            {error && <div style={{ padding: '12px 16px', borderRadius: 8, background: '#fee2e2', color: '#b91c1c', fontSize: 13, fontWeight: 500, marginBottom: 20 }}>{error}</div>}
            
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={labelStyle}>Nombre del Proyecto *</label>
                  <input name="title" value={form.title} onChange={set} placeholder="Ej. Desarrollo de App Móvil para E-commerce" style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Cliente</label>
                  <select name="clientId" value={form.clientId} onChange={set} style={{...inputStyle, cursor: 'pointer'}}>
                    <option value="">Selecciona un cliente (Opcional)</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Moneda</label>
                    <select name="currency" value={form.currency} onChange={set} style={{...inputStyle, cursor: 'pointer'}}>
                      <option value="PEN">Soles (PEN)</option>
                      <option value="USD">Dólares (USD)</option>
                      <option value="EUR">Euros (EUR)</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Plantilla Base</label>
                    <select name="templateId" value={form.templateId} onChange={set} style={{...inputStyle, cursor: 'pointer'}}>
                      <option value="">Comenzar en blanco</option>
                      {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Descripción Breve</label>
                  <textarea name="description" value={form.description} onChange={set} placeholder="Objetivos principales del proyecto..." style={{...inputStyle, minHeight: 80, resize: 'vertical'}} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <p style={{ margin: 0, fontSize: 13, color: C.s500, lineHeight: 1.5 }}>
                  Arrastra los miembros hacia la otra caja.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'stretch' }}>
                  <div 
                    style={{ flex: '1 1 300px', background: C.s50, borderRadius: 16, padding: 20, border: `1px solid ${C.border}` }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDropToAvailable}
                  >
                    <h4 style={{ margin: '0 0 16px 0', fontSize: 13, fontWeight: 800, color: C.s600, textTransform: 'uppercase', letterSpacing: 1 }}>Disponibles ({disponibles.length})</h4>
                    {disponibles.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 30, color: C.s400 }}>
                        <Icon icon="mdi:check-all" style={{ fontSize: 32, opacity: 0.5 }} />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {Object.entries(rolesGrouped).map(([role, members]) => (
                          <div key={role}>
                            <h5 style={{ margin: '0 0 10px 0', fontSize: 11, fontWeight: 800, color: C.s400, textTransform: 'uppercase' }}>{role}</h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {members.map(m => (
                                <div 
                                  key={`${role}-${m.id}`}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, m.id, role)}
                                  style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${C.border}`, cursor: 'grab' }}
                                  onMouseDown={e => e.currentTarget.style.cursor = 'grabbing'}
                                  onMouseUp={e => e.currentTarget.style.cursor = 'grab'}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div>
                                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>{m.name}</p>
                                      <p style={{ margin: 0, fontSize: 11, color: C.s500 }}>${m.hourlyRate}/hr</p>
                                    </div>
                                  </div>
                                  <button type="button" onClick={(e) => { e.stopPropagation(); moveToProject(m.id, role); }} style={{ background: 'none', border: 'none', color: C.s800, cursor: 'pointer' }}>
                                    <Icon icon="mdi:plus-circle" style={{ fontSize: 24 }} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div 
                    style={{ flex: '1 1 300px', borderRadius: 16, padding: 20, background: seleccionados.length > 0 ? '#f0fdf4' : C.white, border: `2px dashed ${seleccionados.length > 0 ? '#22c55e' : C.border}` }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDropToProject}
                  >
                    <h4 style={{ margin: '0 0 16px 0', fontSize: 13, fontWeight: 800, color: seleccionados.length > 0 ? '#16a34a' : C.s400, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                      Equipo ({seleccionados.length})
                    </h4>
                    {seleccionados.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px 20px', color: C.s400 }}>
                        <Icon icon="mdi:drag-variant" style={{ fontSize: 48, opacity: 0.3 }} />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {seleccionados.map(m => {
                          const selectionData = teamSelection[m.id];
                          const rolesArray = m.role ? m.role.split(',').map(r => r.trim()).filter(Boolean) : ['Otros'];
                          
                          return (
                            <div 
                              key={m.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, m.id, selectionData?.projectRoles?.[0])}
                              style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${C.primary}`, cursor: 'grab', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0f9ff', color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Icon icon="mdi:check-circle" style={{ fontSize: 20 }} />
                                </div>
                                <div>
                                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.s900 }}>{m.name}</p>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                                    {rolesArray.length > 1 ? (
                                      rolesArray.map(r => {
                                        const isSelected = selectionData?.projectRoles?.includes(r);
                                        return (
                                          <span
                                            key={r}
                                            onClick={(e) => { e.stopPropagation(); toggleProjectRole(m.id, r); }}
                                            style={{
                                              cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                                              background: isSelected ? C.s800 : C.white,
                                              color: isSelected ? '#fff' : C.s500,
                                              border: `1px solid ${isSelected ? C.s800 : C.border}`,
                                              transition: 'all 0.2s'
                                            }}
                                            title="Clic para activar/desactivar este rol"
                                          >
                                            {r}
                                          </span>
                                        );
                                      })
                                    ) : (
                                      <span style={{ fontSize: 11, color: '#fff', fontWeight: 700, background: C.s800, padding: '2px 8px', borderRadius: 12 }}>
                                        {selectionData?.projectRoles?.[0] || rolesArray[0]}
                                      </span>
                                    )}
                                    <span style={{ fontSize: 11, color: C.s500, fontWeight: 600, marginLeft: 4 }}>• ${m.hourlyRate}/hr</span>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); moveToAvailable(m.id); }}
                                style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                title="Quitar del proyecto"
                              >
                                <Icon icon="mdi:close" style={{ fontSize: 18 }} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '20px 32px', background: '#fafafa', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {step === 1 ? (
              <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
            ) : (
              <button type="button" onClick={handleBack} style={btnSecondary}>Volver al Paso 1</button>
            )}

            {step === 1 ? (
              <button type="button" onClick={handleNext} disabled={!form.title} style={{ ...btnPrimary, opacity: form.title ? 1 : 0.5 }}>
                Continuar <Icon icon="mdi:arrow-right" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={saving} style={btnPrimary}>
                {saving ? <><Icon icon="mdi:loading" className="animate-spin" /> Creando...</> : <><Icon icon="mdi:check-circle" /> Confirmar y Crear Proyecto</>}
              </button>
            )}
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
