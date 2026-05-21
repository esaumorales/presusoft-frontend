import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { templatesService } from '../api/templates.service';
import { C, card } from '../../../core/styles/palette';

const CATEGORIES = ['Desarrollo Web', 'App Móvil', 'E-commerce', 'Dashboard', 'API Backend', 'Sistema con IA', 'Landing Page', 'Otro'];

export default function TemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await templatesService.getById(id);
        setTemplate(res.data?.data);
      } catch (err) {
        setError('No se pudo cargar la plantilla.');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [id]);

  const handleMetadataChange = (e) => {
    const { name, value } = e.target;
    setTemplate((prev) => ({ ...prev, [name]: value }));
  };

  // Modules management
  const addModule = () => {
    setTemplate((prev) => {
      const currentModules = prev.modules || [];
      const newModule = {
        name: 'Nuevo Módulo',
        description: '',
        orderNumber: currentModules.length + 1,
        tasks: [],
      };
      return { ...prev, modules: [...currentModules, newModule] };
    });
  };

  const updateModuleField = (modIndex, field, value) => {
    setTemplate((prev) => {
      const updatedModules = [...prev.modules];
      updatedModules[modIndex] = { ...updatedModules[modIndex], [field]: value };
      return { ...prev, modules: updatedModules };
    });
  };

  const removeModule = (modIndex) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este módulo de la plantilla? Se perderán todas sus tareas.')) return;
    setTemplate((prev) => {
      const updatedModules = prev.modules.filter((_, idx) => idx !== modIndex);
      // Re-assign order numbers
      const reordered = updatedModules.map((mod, idx) => ({ ...mod, orderNumber: idx + 1 }));
      return { ...prev, modules: reordered };
    });
  };

  // Tasks management
  const addTask = (modIndex) => {
    setTemplate((prev) => {
      const updatedModules = [...prev.modules];
      const currentTasks = updatedModules[modIndex].tasks || [];
      const newTask = {
        name: 'Nueva Tarea',
        description: '',
        estimatedHours: 0,
        defaultRate: 0,
        orderNumber: currentTasks.length + 1,
      };
      updatedModules[modIndex] = {
        ...updatedModules[modIndex],
        tasks: [...currentTasks, newTask],
      };
      return { ...prev, modules: updatedModules };
    });
  };

  const updateTaskField = (modIndex, taskIndex, field, value) => {
    setTemplate((prev) => {
      const updatedModules = [...prev.modules];
      const updatedTasks = [...updatedModules[modIndex].tasks];
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        [field]: field === 'estimatedHours' || field === 'defaultRate' ? Number(value) : value,
      };
      updatedModules[modIndex] = { ...updatedModules[modIndex], tasks: updatedTasks };
      return { ...prev, modules: updatedModules };
    });
  };

  const removeTask = (modIndex, taskIndex) => {
    setTemplate((prev) => {
      const updatedModules = [...prev.modules];
      const updatedTasks = updatedModules[modIndex].tasks.filter((_, idx) => idx !== taskIndex);
      const reordered = updatedTasks.map((t, idx) => ({ ...t, orderNumber: idx + 1 }));
      updatedModules[modIndex] = { ...updatedModules[modIndex], tasks: reordered };
      return { ...prev, modules: updatedModules };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      // Validate modules
      if (!template.name.trim()) {
        throw new Error('El nombre de la plantilla es obligatorio.');
      }
      
      const payload = {
        name: template.name,
        category: template.category || null,
        description: template.description || null,
        modules: (template.modules || []).map((mod) => ({
          name: mod.name,
          description: mod.description || null,
          orderNumber: mod.orderNumber,
          tasks: (mod.tasks || []).map((t) => ({
            name: t.name,
            description: t.description || null,
            estimatedHours: Number(t.estimatedHours) || 0,
            defaultRate: Number(t.defaultRate) || 0,
            orderNumber: t.orderNumber,
          })),
        })),
      };

      await templatesService.update(id, payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Icon icon="mdi:loading" className="text-5xl text-secondary-500 animate-spin" />
        <p className="text-sm text-secondary-500">Cargando plantilla...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/templates')}
            style={{
              padding: 8,
              background: C.white,
              border: `1.5px solid ${C.border}`,
              borderRadius: 8,
              cursor: 'pointer',
              color: C.text2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Icon icon="mdi:arrow-left" style={{ fontSize: 18 }} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>
              Editor de Plantilla: <span style={{ color: C.s600 }}>{template.name}</span>
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: C.muted }}>
              Estructura los módulos y tareas que luego podrás importar a tus presupuestos.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                style={{
                  padding: '8px 16px',
                  background: '#dcfce7',
                  color: '#15803d',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Icon icon="mdi:check-circle-outline" style={{ fontSize: 18 }} />
                ¡Cambios guardados con éxito!
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{
              background: 'linear-gradient(135deg, #3c6690 0%, #1e2b39 100%)',
              boxShadow: '0 4px 12px rgba(30,43,57,0.15)',
              padding: '10px 24px',
            }}
          >
            {saving ? (
              <Icon icon="mdi:loading" className="animate-spin" />
            ) : (
              <Icon icon="mdi:content-save-outline" />
            )}
            Guardar Cambios
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: '#fee2e2', color: '#b91c1c', fontSize: 13, fontWeight: 500 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: 20, alignItems: 'start' }}>
        {/* Metadata Sidebar Card */}
        <div style={{ ...card, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text, borderBottom: `1px solid ${C.border2}`, paddingBottom: 10 }}>
            Información General
          </h2>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 5 }}>Nombre de la Plantilla *</label>
            <input
              name="name"
              value={template.name}
              onChange={handleMetadataChange}
              placeholder="Ej. App Móvil Estándar"
              style={{
                width: '100%',
                border: `1.5px solid ${C.border}`,
                borderRadius: 7,
                padding: '9px 12px',
                fontSize: 13,
                color: C.text,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 5 }}>Categoría</label>
            <select
              name="category"
              value={template.category || ''}
              onChange={handleMetadataChange}
              style={{
                width: '100%',
                border: `1.5px solid ${C.border}`,
                borderRadius: 7,
                padding: '9px 12px',
                fontSize: 13,
                color: C.text,
                outline: 'none',
                background: C.white,
              }}
            >
              <option value="">Sin categoría</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 5 }}>Descripción</label>
            <textarea
              name="description"
              value={template.description || ''}
              onChange={handleMetadataChange}
              rows={4}
              placeholder="Explica qué incluye esta plantilla..."
              style={{
                width: '100%',
                border: `1.5px solid ${C.border}`,
                borderRadius: 7,
                padding: '9px 12px',
                fontSize: 13,
                color: C.text,
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Modules & Tasks Workspace */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>Módulos y Tareas</h2>
            <button
              onClick={addModule}
              className="btn-secondary"
              style={{
                borderColor: C.s500,
                color: C.s600,
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Icon icon="mdi:plus-circle-outline" style={{ fontSize: 18 }} />
              Añadir Módulo
            </button>
          </div>

          {(!template.modules || template.modules.length === 0) ? (
            <div style={{ ...card, padding: 48, textAlign: 'center', background: 'rgba(255, 255, 255, 0.7)' }}>
              <Icon icon="mdi:view-grid-plus-outline" style={{ fontSize: 48, color: C.muted, display: 'block', margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontWeight: 600, color: C.text2, fontSize: 14 }}>Esta plantilla no tiene módulos.</p>
              <p style={{ margin: '4px 0 16px', fontSize: 12, color: C.muted }}>Añade módulos como "Frontend", "Backend" o "Diseño" para estructurar las tareas.</p>
              <button onClick={addModule} className="btn-primary" style={{ background: C.s700 }}>
                Añadir Primer Módulo
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {template.modules.map((mod, modIdx) => (
                <motion.div
                  key={modIdx}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ ...card, overflow: 'hidden' }}
                >
                  {/* Module Title Section */}
                  <div
                    style={{
                      background: C.bg,
                      padding: '12px 20px',
                      borderBottom: `1px solid ${C.border2}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                      <Icon icon="mdi:folder-outline" style={{ fontSize: 18, color: C.s500 }} />
                      <input
                        value={mod.name}
                        onChange={(e) => updateModuleField(modIdx, 'name', e.target.value)}
                        placeholder="Nombre del módulo (Ej. Frontend)"
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: C.text,
                          border: 'none',
                          background: 'transparent',
                          outline: 'none',
                          padding: '4px 8px',
                          borderBottom: '1px solid transparent',
                          width: '100%',
                          maxWidth: 240,
                        }}
                        onFocus={(e) => (e.target.style.borderBottomColor = C.s500)}
                        onBlur={(e) => (e.target.style.borderBottomColor = 'transparent')}
                      />
                      <input
                        value={mod.description || ''}
                        onChange={(e) => updateModuleField(modIdx, 'description', e.target.value)}
                        placeholder="Descripción breve..."
                        style={{
                          fontSize: 12,
                          color: C.muted,
                          border: 'none',
                          background: 'transparent',
                          outline: 'none',
                          padding: '4px 8px',
                          borderBottom: '1px solid transparent',
                          flex: 1,
                        }}
                        onFocus={(e) => (e.target.style.borderBottomColor = C.s300)}
                        onBlur={(e) => (e.target.style.borderBottomColor = 'transparent')}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => addTask(modIdx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: C.s600,
                          padding: '4px 8px',
                          fontSize: 12,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Icon icon="mdi:plus" /> Añadir Tarea
                      </button>
                      <button
                        onClick={() => removeModule(modIdx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#b91c1c',
                          padding: 4,
                        }}
                        title="Eliminar Módulo"
                      >
                        <Icon icon="mdi:trash-can-outline" style={{ fontSize: 16 }} />
                      </button>
                    </div>
                  </div>

                  {/* Tasks list */}
                  <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column' }}>
                    {(!mod.tasks || mod.tasks.length === 0) ? (
                      <p style={{ margin: '12px 10px', fontSize: 12, color: C.muted, fontStyle: 'italic' }}>
                        Sin tareas en este módulo. Haz clic en "Añadir Tarea" para crear una.
                      </p>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${C.border2}` }}>
                            <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: 11, fontWeight: 600, color: C.muted }}>Tarea</th>
                            <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: 11, fontWeight: 600, color: C.muted }}>Descripción</th>
                            <th style={{ textAlign: 'center', padding: '6px 8px', fontSize: 11, fontWeight: 600, color: C.muted, width: 80 }}>Horas</th>
                            <th style={{ textAlign: 'center', padding: '6px 8px', fontSize: 11, fontWeight: 600, color: C.muted, width: 100 }}>Tarifa ($)</th>
                            <th style={{ textAlign: 'right', padding: '6px 8px', fontSize: 11, fontWeight: 600, color: C.muted, width: 100 }}>Total Est.</th>
                            <th style={{ padding: '6px 8px', width: 40 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {mod.tasks.map((task, taskIdx) => (
                            <tr key={taskIdx} style={{ borderBottom: `1px solid ${C.border2}` }}>
                              <td style={{ padding: '8px 8px' }}>
                                <input
                                  value={task.name}
                                  onChange={(e) => updateTaskField(modIdx, taskIdx, 'name', e.target.value)}
                                  placeholder="Ej. Diseño Mockup"
                                  style={{
                                    width: '100%',
                                    border: 'none',
                                    borderBottom: '1px solid transparent',
                                    background: 'transparent',
                                    outline: 'none',
                                    fontSize: 13,
                                    color: C.text,
                                    padding: '2px 4px',
                                  }}
                                  onFocus={(e) => (e.target.style.borderBottomColor = C.s300)}
                                  onBlur={(e) => (e.target.style.borderBottomColor = 'transparent')}
                                />
                              </td>
                              <td style={{ padding: '8px 8px' }}>
                                <input
                                  value={task.description || ''}
                                  onChange={(e) => updateTaskField(modIdx, taskIdx, 'description', e.target.value)}
                                  placeholder="Detalle opcional..."
                                  style={{
                                    width: '100%',
                                    border: 'none',
                                    borderBottom: '1px solid transparent',
                                    background: 'transparent',
                                    outline: 'none',
                                    fontSize: 12,
                                    color: C.muted,
                                    padding: '2px 4px',
                                  }}
                                  onFocus={(e) => (e.target.style.borderBottomColor = C.s300)}
                                  onBlur={(e) => (e.target.style.borderBottomColor = 'transparent')}
                                />
                              </td>
                              <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                                <input
                                  type="number"
                                  value={task.estimatedHours}
                                  min="0"
                                  onChange={(e) => updateTaskField(modIdx, taskIdx, 'estimatedHours', e.target.value)}
                                  style={{
                                    width: 60,
                                    textAlign: 'center',
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 4,
                                    fontSize: 12,
                                    padding: '2px 4px',
                                    outline: 'none',
                                  }}
                                />
                              </td>
                              <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                                <input
                                  type="number"
                                  value={task.defaultRate}
                                  min="0"
                                  onChange={(e) => updateTaskField(modIdx, taskIdx, 'defaultRate', e.target.value)}
                                  style={{
                                    width: 80,
                                    textAlign: 'center',
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 4,
                                    fontSize: 12,
                                    padding: '2px 4px',
                                    outline: 'none',
                                  }}
                                />
                              </td>
                              <td style={{ padding: '8px 8px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: C.text }}>
                                ${(Number(task.estimatedHours || 0) * Number(task.defaultRate || 0)).toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td style={{ padding: '8px 8px', textAlign: 'right' }}>
                                <button
                                  onClick={() => removeTask(modIdx, taskIdx)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: C.muted,
                                    padding: 2,
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = '#b91c1c')}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
                                >
                                  <Icon icon="mdi:close" style={{ fontSize: 16 }} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
