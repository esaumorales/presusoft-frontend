import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { budgetsService } from '../api/budgets.service';
import { budgetModulesService } from '../api/budgetModules.service';
import { budgetTasksService } from '../api/budgetTasks.service';
import { budgetCostsService } from '../api/budgetCosts.service';

const STATUS_CFG = {
  draft:    { label: 'Borrador',  cls: 'bg-secondary-100 text-secondary-700' },
  sent:     { label: 'Enviado',   cls: 'bg-blue-100 text-blue-700' },
  accepted: { label: 'Aceptado', cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rechazado', cls: 'bg-red-100 text-red-700' },
  expired:  { label: 'Vencido',  cls: 'bg-orange-100 text-orange-700' },
};

const TASK_DEFAULTS = { name: '', description: '', hours: '', hourlyRate: '', quantity: '', unitPrice: '' };
const COST_DEFAULTS = { name: '', type: 'one_time', amount: '', quantity: 1, description: '' };

export default function BudgetEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  // Modals
  const [moduleModal, setModuleModal] = useState(false);
  const [moduleName, setModuleName] = useState('');
  const [editModule, setEditModule] = useState(null);

  const [taskModal, setTaskModal] = useState(null); // null | moduleId
  const [taskForm, setTaskForm] = useState(TASK_DEFAULTS);
  const [editTask, setEditTask] = useState(null);

  const [costModal, setCostModal] = useState(false);
  const [costForm, setCostForm] = useState(COST_DEFAULTS);
  const [editCost, setEditCost] = useState(null);

  const [saving, setSaving] = useState(false);

  const fetchBudget = async () => {
    try {
      const res = await budgetsService.getById(id);
      setBudget(res.data?.data);
    } catch { navigate('/budgets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBudget(); }, [id]);

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      await budgetsService.calculate(id);
      await fetchBudget();
    } catch (e) { alert('Error al calcular'); }
    finally { setCalculating(false); }
  };

  const handleChangeStatus = async (status) => {
    try {
      await budgetsService.changeStatus(id, status);
      await fetchBudget();
    } catch (e) { alert(e.response?.data?.message || 'Error al cambiar estado'); }
  };

  /* ---- MODULES ---- */
  const openAddModule = () => { setEditModule(null); setModuleName(''); setModuleModal(true); };
  const openEditModule = (mod) => { setEditModule(mod); setModuleName(mod.name); setModuleModal(true); };

  const saveModule = async () => {
    if (!moduleName.trim()) return;
    setSaving(true);
    try {
      if (editModule) {
        await budgetModulesService.update(editModule.id, { name: moduleName });
      } else {
        await budgetModulesService.create({ budgetId: id, name: moduleName, orderNumber: (budget?.modules?.length || 0) + 1 });
      }
      await fetchBudget();
      setModuleModal(false);
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const deleteModule = async (modId) => {
    if (!window.confirm('¿Eliminar módulo y todas sus tareas?')) return;
    await budgetModulesService.remove(modId);
    await fetchBudget();
  };

  /* ---- TASKS ---- */
  const openAddTask = (moduleId) => { setEditTask(null); setTaskForm(TASK_DEFAULTS); setTaskModal(moduleId); };
  const openEditTask = (task, moduleId) => { setEditTask(task); setTaskForm({ name: task.name || '', description: task.description || '', hours: task.hours || '', hourlyRate: task.hourlyRate || '', quantity: task.quantity || '', unitPrice: task.unitPrice || '' }); setTaskModal(moduleId); };

  const saveTask = async () => {
    setSaving(true);
    try {
      const payload = { ...taskForm, budgetId: id, moduleId: taskModal };
      if (payload.hours) payload.hours = Number(payload.hours);
      if (payload.hourlyRate) payload.hourlyRate = Number(payload.hourlyRate);
      if (payload.quantity) payload.quantity = Number(payload.quantity);
      if (payload.unitPrice) payload.unitPrice = Number(payload.unitPrice);
      if (editTask) { await budgetTasksService.update(editTask.id, payload); }
      else { await budgetTasksService.create(payload); }
      await fetchBudget();
      setTaskModal(null);
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('¿Eliminar tarea?')) return;
    await budgetTasksService.remove(taskId);
    await fetchBudget();
  };

  /* ---- COSTS ---- */
  const openAddCost = () => { setEditCost(null); setCostForm(COST_DEFAULTS); setCostModal(true); };
  const openEditCost = (cost) => { setEditCost(cost); setCostForm({ name: cost.name, type: cost.type, amount: cost.amount, quantity: cost.quantity, description: cost.description || '' }); setCostModal(true); };

  const saveCost = async () => {
    setSaving(true);
    try {
      const payload = { ...costForm, budgetId: id, amount: Number(costForm.amount), quantity: Number(costForm.quantity) };
      if (editCost) { await budgetCostsService.update(editCost.id, payload); }
      else { await budgetCostsService.create(payload); }
      await fetchBudget();
      setCostModal(false);
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const deleteCost = async (costId) => {
    if (!window.confirm('¿Eliminar costo?')) return;
    await budgetCostsService.remove(costId);
    await fetchBudget();
  };

  const isLocked = budget?.status === 'accepted';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Icon icon="mdi:loading" className="text-5xl text-secondary-400 animate-spin" />
    </div>
  );

  const sc = STATUS_CFG[budget?.status] || STATUS_CFG.draft;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => navigate('/budgets')} className="text-secondary-400 hover:text-secondary-700 dark:hover:text-white transition-colors">
              <Icon icon="mdi:arrow-left" className="text-xl" />
            </button>
            <span className="font-mono text-xs font-bold text-secondary-400">{budget?.code}</span>
            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${sc.cls}`}>{sc.label}</span>
          </div>
          <h1 className="text-2xl font-black text-secondary-900 dark:text-white">{budget?.title}</h1>
          <p className="text-secondary-500 text-sm mt-1">{budget?.client?.name || 'Sin cliente asignado'}</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {!isLocked && (
            <>
              <button onClick={handleCalculate} disabled={calculating}
                className="btn-secondary flex items-center gap-2 text-sm">
                <Icon icon={calculating ? 'mdi:loading' : 'mdi:calculator-variant-outline'} className={calculating ? 'animate-spin' : ''} />
                Calcular
              </button>
              {budget?.status === 'draft' && (
                <button onClick={() => handleChangeStatus('sent')}
                  className="btn-primary flex items-center gap-2 text-sm bg-blue-600">
                  <Icon icon="mdi:send-outline" />
                  Enviar
                </button>
              )}
              {budget?.status === 'sent' && (
                <>
                  <button onClick={() => handleChangeStatus('accepted')} className="btn-primary flex items-center gap-2 text-sm bg-green-600">
                    <Icon icon="mdi:check" /> Aceptado
                  </button>
                  <button onClick={() => handleChangeStatus('rejected')} className="btn-secondary flex items-center gap-2 text-sm text-red-600">
                    <Icon icon="mdi:close" /> Rechazado
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Totals Banner */}
      <div className="relative rounded-xl overflow-hidden p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary-900 to-secondary-800" />
        {[
          { label: 'Subtotal', value: budget?.subtotal },
          { label: `IGV (${budget?.taxPercentage}%)`, value: budget?.taxAmount },
          { label: `Descuento (${budget?.discountPercentage}%)`, value: budget?.discountAmount },
          { label: 'TOTAL', value: budget?.total, big: true },
        ].map((t, i) => (
          <div key={i} className={`relative z-10 ${t.big ? 'col-span-2 md:col-span-1' : ''}`}>
            <p className="text-secondary-400 text-xs font-bold uppercase tracking-widest mb-1">{t.label}</p>
            <p className={`font-black text-white ${t.big ? 'text-3xl' : 'text-xl'}`}>
              ${Number(t.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      {/* Modules */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-secondary-900 dark:text-white">Módulos y Tareas</h2>
          {!isLocked && (
            <button onClick={openAddModule} className="btn-primary flex items-center gap-2 text-sm">
              <Icon icon="mdi:plus" /> Añadir Módulo
            </button>
          )}
        </div>

        {(!budget?.modules || budget.modules.length === 0) && (
          <div className=" bg-white/70 dark:bg-secondary-900/70 rounded-xl border border-dashed border-secondary-300 dark:border-secondary-700 p-12 text-center">
            <Icon icon="mdi:view-grid-plus-outline" className="text-5xl text-secondary-300 mx-auto mb-3" />
            <p className="text-secondary-500 font-semibold">Sin módulos. Añade el primero para comenzar.</p>
          </div>
        )}

        {budget?.modules?.map(mod => (
          <motion.div key={mod.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="card shadow-lg overflow-hidden">
            {/* Module Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-secondary-50/50 dark:bg-secondary-950/30 border-b border-secondary-200 dark:border-secondary-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-secondary-800 dark:bg-secondary-700 flex items-center justify-center">
                  <Icon icon="mdi:folder-outline" className="text-white text-base" />
                </div>
                <span className="font-bold text-secondary-900 dark:text-white">{mod.name}</span>
              </div>
              {!isLocked && (
                <div className="flex gap-1">
                  <button onClick={() => openAddTask(mod.id)} className="p-1.5 text-secondary-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Añadir tarea">
                    <Icon icon="mdi:plus" className="text-lg" />
                  </button>
                  <button onClick={() => openEditModule(mod)} className="p-1.5 text-secondary-400 hover:text-secondary-700 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors">
                    <Icon icon="mdi:pencil-outline" className="text-base" />
                  </button>
                  <button onClick={() => deleteModule(mod.id)} className="p-1.5 text-secondary-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Icon icon="mdi:trash-can-outline" className="text-base" />
                  </button>
                </div>
              )}
            </div>

            {/* Tasks Table */}
            <div className="divide-y divide-secondary-100 dark:divide-secondary-800">
              {(!mod.tasks || mod.tasks.length === 0) ? (
                <p className="px-6 py-4 text-sm text-secondary-400 italic">Sin tareas en este módulo.</p>
              ) : mod.tasks.map(task => (
                <div key={task.id} className="flex items-center justify-between px-6 py-3 hover:bg-secondary-50/50 dark:hover:bg-secondary-800/30 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-secondary-900 dark:text-white">{task.name}</p>
                    <p className="text-xs text-secondary-500 mt-0.5">
                      {task.hours ? `${task.hours}h × $${task.hourlyRate}/h` : `${task.quantity} × $${task.unitPrice}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-secondary-900 dark:text-white text-sm">
                      ${Number(task.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    {!isLocked && (
                      <div className="flex gap-1">
                        <button onClick={() => openEditTask(task, mod.id)} className="p-1.5 text-secondary-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                          <Icon icon="mdi:pencil-outline" className="text-sm" />
                        </button>
                        <button onClick={() => deleteTask(task.id)} className="p-1.5 text-secondary-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <Icon icon="mdi:trash-can-outline" className="text-sm" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {!isLocked && (
                <button onClick={() => openAddTask(mod.id)} className="w-full px-6 py-3 text-sm text-secondary-400 hover:text-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors flex items-center gap-2">
                  <Icon icon="mdi:plus-circle-outline" /> Añadir tarea
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Extra Costs */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-secondary-900 dark:text-white">Costos Extra</h2>
          {!isLocked && (
            <button onClick={openAddCost} className="btn-secondary flex items-center gap-2 text-sm">
              <Icon icon="mdi:plus" /> Añadir Costo
            </button>
          )}
        </div>

        <div className="card shadow-lg overflow-hidden">
          {(!budget?.costs || budget.costs.length === 0) ? (
            <p className="px-6 py-8 text-center text-sm text-secondary-400">Sin costos extra (servidores, licencias, etc.).</p>
          ) : (
            <div className="divide-y divide-secondary-100 dark:divide-secondary-800">
              {budget.costs.map(cost => (
                <div key={cost.id} className="flex items-center justify-between px-6 py-4 hover:bg-secondary-50/50 dark:hover:bg-secondary-800/30 transition-colors">
                  <div>
                    <p className="font-semibold text-secondary-900 dark:text-white text-sm">{cost.name}</p>
                    <p className="text-xs text-secondary-500 capitalize">{cost.type?.replace('_', ' ')} · ×{cost.quantity}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-secondary-900 dark:text-white text-sm">
                      ${Number(cost.total || cost.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    {!isLocked && (
                      <div className="flex gap-1">
                        <button onClick={() => openEditCost(cost)} className="p-1.5 text-secondary-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                          <Icon icon="mdi:pencil-outline" className="text-sm" />
                        </button>
                        <button onClick={() => deleteCost(cost.id)} className="p-1.5 text-secondary-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <Icon icon="mdi:trash-can-outline" className="text-sm" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* === MODALS === */}
      <AnimatePresence>
        {/* Module Modal */}
        {moduleModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-950/60 "
            onClick={e => e.target === e.currentTarget && setModuleModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-secondary-900 rounded-xl shadow-2xl border border-secondary-200 dark:border-secondary-800 w-full max-w-md p-6 space-y-4">
              <h2 className="text-xl font-bold text-secondary-900 dark:text-white">{editModule ? 'Editar Módulo' : 'Nuevo Módulo'}</h2>
              <input value={moduleName} onChange={e => setModuleName(e.target.value)} placeholder="Ej. Backend, Frontend, Diseño UI..." className="input-base" />
              <div className="flex gap-3">
                <button onClick={() => setModuleModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={saveModule} disabled={saving} className="btn-primary flex-1">
                  {saving ? <Icon icon="mdi:loading" className="animate-spin text-xl" /> : 'Guardar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Task Modal */}
        {taskModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-950/60 "
            onClick={e => e.target === e.currentTarget && setTaskModal(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-secondary-900 rounded-xl shadow-2xl border border-secondary-200 dark:border-secondary-800 w-full max-w-lg p-6 space-y-4">
              <h2 className="text-xl font-bold text-secondary-900 dark:text-white">{editTask ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wider mb-1.5">Nombre de la tarea *</label>
                <input value={taskForm.name} onChange={e => setTaskForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej. Implementar JWT" className="input-base" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wider mb-1.5">Horas</label>
                  <input type="number" value={taskForm.hours} onChange={e => setTaskForm(f => ({ ...f, hours: e.target.value }))} placeholder="10" className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wider mb-1.5">Tarifa/h ($)</label>
                  <input type="number" value={taskForm.hourlyRate} onChange={e => setTaskForm(f => ({ ...f, hourlyRate: e.target.value }))} placeholder="35" className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wider mb-1.5">Cantidad</label>
                  <input type="number" value={taskForm.quantity} onChange={e => setTaskForm(f => ({ ...f, quantity: e.target.value }))} placeholder="1" className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wider mb-1.5">Precio unitario ($)</label>
                  <input type="number" value={taskForm.unitPrice} onChange={e => setTaskForm(f => ({ ...f, unitPrice: e.target.value }))} placeholder="0" className="input-base" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wider mb-1.5">Descripción</label>
                <textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} rows={2} className="input-base resize-none" placeholder="Descripción opcional..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setTaskModal(null)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={saveTask} disabled={saving} className="btn-primary flex-1">
                  {saving ? <Icon icon="mdi:loading" className="animate-spin text-xl" /> : 'Guardar Tarea'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Cost Modal */}
        {costModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-950/60 "
            onClick={e => e.target === e.currentTarget && setCostModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-secondary-900 rounded-xl shadow-2xl border border-secondary-200 dark:border-secondary-800 w-full max-w-md p-6 space-y-4">
              <h2 className="text-xl font-bold text-secondary-900 dark:text-white">{editCost ? 'Editar Costo' : 'Nuevo Costo Extra'}</h2>
              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wider mb-1.5">Nombre *</label>
                <input value={costForm.name} onChange={e => setCostForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej. Servidor VPS" className="input-base" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wider mb-1.5">Tipo</label>
                  <select value={costForm.type} onChange={e => setCostForm(f => ({ ...f, type: e.target.value }))} className="input-base">
                    <option value="one_time">Único</option>
                    <option value="monthly">Mensual</option>
                    <option value="annual">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wider mb-1.5">Cantidad</label>
                  <input type="number" value={costForm.quantity} onChange={e => setCostForm(f => ({ ...f, quantity: e.target.value }))} className="input-base" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wider mb-1.5">Monto ($)</label>
                <input type="number" value={costForm.amount} onChange={e => setCostForm(f => ({ ...f, amount: e.target.value }))} placeholder="120" className="input-base" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setCostModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={saveCost} disabled={saving} className="btn-primary flex-1">
                  {saving ? <Icon icon="mdi:loading" className="animate-spin text-xl" /> : 'Guardar Costo'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

