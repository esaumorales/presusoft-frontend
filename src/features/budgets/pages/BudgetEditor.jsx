import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { budgetsService } from '../api/budgets.service';
import { budgetModulesService } from '../api/budgetModules.service';
import { budgetTasksService } from '../api/budgetTasks.service';
import { budgetCostsService } from '../api/budgetCosts.service';
import { dependenciesService } from '../api/dependencies.service';
import { providersService } from '../api/providers.service';
import { versionsService } from '../api/versions.service';
import { exportsService } from '../api/exports.service';
import { templatesService } from '../../templates/api/templates.service';
import { C, card, STATUS_CFG } from '../../../core/styles/palette';

const parseMetadata = (desc) => {
  const meta = { role: '', priority: 'Media', dependsOn: '', cleanDesc: desc || '' };
  if (!desc) return meta;
  const match = desc.match(/^\[Meta:(.*?)\]\n([\s\S]*)/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      meta.role = parsed.role || '';
      meta.priority = parsed.priority || 'Media';
      meta.dependsOn = parsed.dependsOn || '';
      meta.cleanDesc = match[2] || '';
    } catch { }
  }
  return meta;
};

const serializeMetadata = (cleanDesc, role, priority, dependsOn) => {
  if (!role && priority === 'Media' && !dependsOn) return cleanDesc;
  const meta = JSON.stringify({ role, priority, dependsOn });
  return `[Meta:${meta}]\n${cleanDesc}`;
};

const TASK_DEFAULTS = { name: '', description: '', hours: '', hourlyRate: '', quantity: '1', unitPrice: '', role: '', priority: 'Media', dependsOn: '' };

export default function BudgetEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportingFormat, setExportingFormat] = useState(null);

  // Catalogs
  const [providers, setProviders] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [versions, setVersions] = useState([]);

  // Sliders local state
  const [localPercentages, setLocalPercentages] = useState({
    contingencyPercentage: 0,
    marginPercentage: 0,
    taxPercentage: 18,
    discountPercentage: 0,
  });

  // Modals
  const [moduleModal, setModuleModal] = useState(false);
  const [moduleName, setModuleName] = useState('');
  const [editModule, setEditModule] = useState(null);

  const [taskModal, setTaskModal] = useState(null); // null | moduleId
  const [taskForm, setTaskForm] = useState(TASK_DEFAULTS);
  const [taskType, setTaskType] = useState('hours'); // 'hours' | 'fixed'
  const [editTask, setEditTask] = useState(null);

  const [depModal, setDepModal] = useState(null); // null | moduleId
  const [depForm, setDepForm] = useState({ providerId: '', planId: '', quantity: 1 });
  const [editDep, setEditDep] = useState(null);

  const [applyModal, setApplyModal] = useState(false);
  const [compareModal, setCompareModal] = useState(null); // null | version object

  // Vista Previa & Save as Template States
  const [viewMode, setViewMode] = useState('edit'); // 'edit' | 'preview'
  const [saveTemplateModal, setSaveTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: '', category: 'Desarrollo Web', description: '' });

  const fetchBudget = async () => {
    try {
      const res = await budgetsService.getById(id);
      const bData = res.data?.data;
      setBudget(bData);
      if (bData) {
        setLocalPercentages({
          contingencyPercentage: Number(bData.contingencyPercentage || 0),
          marginPercentage: Number(bData.marginPercentage || 0),
          taxPercentage: Number(bData.taxPercentage || 0),
          discountPercentage: Number(bData.discountPercentage || 0),
        });
        setTemplateForm({
          name: `Plantilla de ${bData.title}`,
          category: 'Desarrollo Web',
          description: bData.description || `Plantilla generada a partir del presupuesto de ${bData.title}`,
        });
      }
    } catch {
      navigate('/budgets');
    }
  };

  const fetchCatalogsAndVersions = async () => {
    try {
      const [provRes, tempRes, verRes] = await Promise.allSettled([
        providersService.getAll(),
        templatesService.getAll(),
        versionsService.getByBudgetId(id)
      ]);
      if (provRes.status === 'fulfilled') setProviders(provRes.value.data?.data || []);
      if (tempRes.status === 'fulfilled') setTemplates(tempRes.value.data?.data || []);
      if (verRes.status === 'fulfilled') setVersions(verRes.value.data?.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      Promise.all([fetchBudget(), fetchCatalogsAndVersions()]).then(() => setLoading(false));
    }
  }, [id]);

  const getCurrencySymbol = (curr) => {
    if (curr === 'PEN') return 'S/.';
    if (curr === 'EUR') return '€';
    return '$';
  };

  const symbol = getCurrencySymbol(budget?.currency);

  const handleChangeStatus = async (status) => {
    try {
      await budgetsService.changeStatus(id, status);
      await fetchBudget();
    } catch (e) {
      alert(e.response?.data?.message || 'Error al cambiar estado');
    }
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
        await budgetModulesService.create(budget.projectId, {
          name: moduleName,
          orderNumber: (budget?.project?.modules?.length || 0) + 1
        });
      }
      await fetchBudget();
      setModuleModal(false);
    } catch (e) {
      alert(e.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const deleteModule = async (modId) => {
    if (!window.confirm('¿Eliminar módulo y todas sus tareas/dependencias?')) return;
    await budgetModulesService.remove(modId);
    await fetchBudget();
  };

  /* ---- TASKS ---- */
  const openAddTask = (moduleId) => {
    setEditTask(null);
    setTaskType('hours');
    setTaskForm(TASK_DEFAULTS);
    setTaskModal(moduleId);
  };

  const openEditTask = (task, moduleId) => {
    setEditTask(task);
    setTaskType(task.hours ? 'hours' : 'fixed');
    const meta = parseMetadata(task.description);
    setTaskForm({
      name: task.name || '',
      description: meta.cleanDesc || '',
      hours: task.hours || '',
      hourlyRate: task.hourlyRate || '',
      quantity: task.quantity || '1',
      unitPrice: task.unitPrice || '',
      role: meta.role,
      priority: meta.priority,
      dependsOn: meta.dependsOn,
    });
    setTaskModal(moduleId);
  };

  const saveTask = async () => {
    if (!taskForm.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: taskForm.name,
        description: serializeMetadata(taskForm.description, taskForm.role, taskForm.priority, taskForm.dependsOn),
        orderNumber: editTask ? editTask.orderNumber : 1,
      };

      if (taskType === 'hours') {
        payload.hours = Number(taskForm.hours) || 0;
        payload.hourlyRate = Number(taskForm.hourlyRate) || 0;
        payload.quantity = Number(taskForm.quantity) || 1;
        payload.unitPrice = null;
      } else {
        payload.hours = null;
        payload.hourlyRate = null;
        payload.quantity = Number(taskForm.quantity) || 1;
        payload.unitPrice = Number(taskForm.unitPrice) || 0;
      }

      if (editTask) {
        await budgetTasksService.update(editTask.id, payload);
      } else {
        await budgetTasksService.create(taskModal, payload);
      }
      await fetchBudget();
      setTaskModal(null);
    } catch (e) {
      alert(e.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('¿Eliminar tarea?')) return;
    await budgetTasksService.remove(taskId);
    await fetchBudget();
  };

  /* ---- DEPENDENCIES (EXTERNAL) ---- */
  const openAddDependency = (moduleId) => {
    setEditDep(null);
    const defaultProvider = providers[0];
    const defaultPlan = defaultProvider?.plans?.[0];
    setDepForm({
      providerId: defaultProvider?.id || '',
      planId: defaultPlan?.id || '',
      quantity: 1
    });
    setDepModal(moduleId);
  };

  const openEditDependency = (dep, moduleId) => {
    setEditDep(dep);
    setDepForm({
      providerId: dep.providerId,
      planId: dep.planId,
      quantity: dep.quantity
    });
    setDepModal(moduleId);
  };

  const saveDependency = async () => {
    if (!depForm.planId) return;
    setSaving(true);
    try {
      const payload = {
        providerId: depForm.providerId,
        planId: depForm.planId,
        quantity: Number(depForm.quantity) || 1
      };

      if (editDep) {
        await dependenciesService.update(editDep.id, {
          planId: payload.planId,
          quantity: payload.quantity
        });
      } else {
        await dependenciesService.create(depModal, payload);
      }
      await fetchBudget();
      setDepModal(null);
    } catch (e) {
      alert(e.response?.data?.message || 'Error al guardar dependencia');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDependency = async (depId) => {
    if (!window.confirm('¿Eliminar dependencia externa?')) return;
    await dependenciesService.remove(depId);
    await fetchBudget();
  };

  /* ---- SLIDERS SAVING ---- */
  const handleSliderSave = async (field, value) => {
    try {
      await budgetsService.update(id, { [field]: Number(value) });
      await fetchBudget();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al actualizar porcentajes');
    }
  };

  /* ---- TEMPLATE APPLICATION ---- */
  const handleApplyTemplate = async (templateId) => {
    if (!window.confirm('¿Estás seguro de inyectar esta plantilla?')) return;
    setSaving(true);
    try {
      await templatesService.apply(templateId, id);
      await fetchBudget();
      setApplyModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al aplicar plantilla');
    } finally {
      setSaving(false);
    }
  };

  /* ---- VERSIONS / SNAPSHOTS ---- */
  const handleCreateSnapshot = async () => {
    setSaving(true);
    try {
      await versionsService.createSnapshot(id);
      const verRes = await versionsService.getByBudgetId(id);
      setVersions(verRes.data?.data || []);
      await fetchBudget();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al crear snapshot');
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreVersion = async (versionId) => {
    if (!window.confirm('¿Deseas restaurar esta versión? Esto sobrescribirá el estado actual del presupuesto.')) return;
    setSaving(true);
    try {
      await versionsService.restore(versionId);
      await fetchBudget();
      const verRes = await versionsService.getByBudgetId(id);
      setVersions(verRes.data?.data || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al restaurar versión');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!templateForm.name.trim()) {
      alert('Por favor introduce un nombre para la plantilla.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: templateForm.name,
        category: templateForm.category || 'Otro',
        description: templateForm.description || '',
        modules: (budget?.project?.modules || []).map((mod, idx) => ({
          name: mod.name,
          description: mod.description || '',
          orderNumber: idx + 1,
          tasks: (mod.tasks || []).map((t, tIdx) => ({
            name: t.name,
            description: t.description || '',
            estimatedHours: Number(t.hours) || 0,
            defaultRate: Number(t.hourlyRate) || 0,
            orderNumber: tIdx + 1
          }))
        }))
      };
      await templatesService.create(payload);
      alert('¡Plantilla guardada con éxito! Puedes reutilizarla para nuevos presupuestos.');
      setSaveTemplateModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al guardar la plantilla.');
    } finally {
      setSaving(false);
    }
  };

  /* ---- PREMIUM EXPORTS ---- */
  const handleExport = async (format) => {
    setExportingFormat(format);
    try {
      let res;
      if (format === 'pdf') {
        res = await exportsService.exportToPdf(id);
      } else if (format === 'word') {
        res = await exportsService.exportToWord(id);
      } else {
        res = await exportsService.exportToExcel(id);
      }

      const fileUrl = res.data?.data?.fileUrl;
      if (!fileUrl) throw new Error('No se recibió la URL de descarga.');

      const filename = fileUrl.split('/').pop();
      const downloadRes = await exportsService.downloadFile(filename);

      // Trigger client-side blob download
      const blob = new Blob([downloadRes.data], { type: downloadRes.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al generar o descargar el archivo');
    } finally {
      setExportingFormat(null);
    }
  };

  const isLocked = budget?.status === 'accepted';
  const modules = budget?.project?.modules || [];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 gap-3">
      <Icon icon="mdi:loading" className="text-5xl text-secondary-500 animate-spin" />
      <p className="text-sm text-secondary-500">Cargando presupuesto...</p>
    </div>
  );

  const sc = STATUS_CFG[budget?.status] || STATUS_CFG.draft;

  // Selected Provider Plans lookup
  const selectedProvider = providers.find(p => p.id === depForm.providerId);
  const selectedPlan = selectedProvider?.plans?.find(pl => pl.id === depForm.planId);

  const renderSlider = (label, field, min = 0, max = 100, step = 1) => {
    const value = localPercentages[field];
    return (
      <div key={field} className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-secondary-700">{label}</span>
          <span className="font-bold text-secondary-900 bg-secondary-100 px-1.5 py-0.5 rounded">{value}%</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={isLocked}
          onChange={(e) => setLocalPercentages(prev => ({ ...prev, [field]: Number(e.target.value) }))}
          onMouseUp={(e) => handleSliderSave(field, e.target.value)}
          onTouchEnd={(e) => handleSliderSave(field, e.target.value)}
          className="w-full h-1.5 bg-secondary-200 rounded-lg appearance-none cursor-pointer accent-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-b border-secondary-200 pb-4 no-print">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => navigate('/budgets')} className="text-secondary-400 hover:text-secondary-700 transition-colors">
              <Icon icon="mdi:arrow-left" className="text-2xl" />
            </button>
            <span className="font-mono text-xs font-bold text-secondary-400 bg-secondary-100 px-2 py-0.5 rounded">{budget?.code}</span>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span>
          </div>
          <h1 className="text-2xl font-black text-secondary-900">{budget?.title}</h1>
          <p className="text-secondary-500 text-sm mt-1">
            Cliente: {budget?.project?.client?.name || budget?.client?.name || 'Sin cliente'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented View Switcher */}
          <div className="flex bg-secondary-100 p-1 rounded-lg border border-secondary-200">
            <button
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                viewMode === 'edit'
                  ? 'bg-white text-secondary-900 shadow-sm'
                  : 'text-secondary-500 hover:text-secondary-700'
              }`}
            >
              <Icon icon="mdi:pencil-outline" className="text-base" />
              Editor
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                viewMode === 'preview'
                  ? 'bg-white text-secondary-900 shadow-sm'
                  : 'text-secondary-500 hover:text-secondary-700'
              }`}
            >
              <Icon icon="mdi:eye-outline" className="text-base" />
              Vista Previa
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {viewMode === 'preview' && (
              <button
                onClick={() => window.print()}
                className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3 bg-secondary-800 text-white border-none hover:bg-secondary-900"
              >
                <Icon icon="mdi:printer" />
                Imprimir / PDF
              </button>
            )}

            <button
              onClick={() => setSaveTemplateModal(true)}
              className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3"
            >
              <Icon icon="mdi:text-box-multiple-outline" />
              Guardar como Plantilla
            </button>

            {!isLocked && budget?.status === 'draft' && (
              <button onClick={() => handleChangeStatus('sent')} className="btn-primary bg-blue-600 hover:bg-blue-700 flex items-center gap-2 text-sm py-1.5 px-4">
                <Icon icon="mdi:send-outline" /> Enviar Propuesta
              </button>
            )}
            {!isLocked && budget?.status === 'sent' && (
              <>
                <button onClick={() => handleChangeStatus('accepted')} className="btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-2 text-sm py-1.5 px-4">
                  <Icon icon="mdi:check" /> Aceptar
                </button>
                <button onClick={() => handleChangeStatus('rejected')} className="btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-2 text-sm py-1.5 px-4">
                  <Icon icon="mdi:close" /> Rechazar
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Workspace Left (70%) + Settings Right (30%) */}
      {viewMode === 'edit' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Modules, Tasks, Dependencies */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-secondary-900">Módulos del Proyecto</h2>
            {!isLocked && (
              <div className="flex gap-2">
                {modules.length === 0 && budget?.status === 'draft' && (
                  <button onClick={() => setApplyModal(true)} className="btn-secondary text-secondary-600 flex items-center gap-1.5 text-sm">
                    <Icon icon="mdi:text-box-multiple-outline" /> Aplicar Plantilla
                  </button>
                )}
                <button onClick={openAddModule} className="btn-primary flex items-center gap-1.5 text-sm">
                  <Icon icon="mdi:plus" /> Añadir Módulo
                </button>
              </div>
            )}
          </div>

          {modules.length === 0 ? (
            <div className="card p-12 text-center border-dashed border-2 border-secondary-300">
              <Icon icon="mdi:view-grid-plus-outline" className="text-5xl text-secondary-300 mx-auto mb-3" />
              <p className="text-secondary-500 font-semibold">Este presupuesto no tiene módulos.</p>
              <p className="text-xs text-secondary-400 mt-1 mb-6">Añade un módulo personalizado o aplica una plantilla base.</p>
              {!isLocked && (
                <div className="flex justify-center gap-3">
                  {budget?.status === 'draft' && (
                    <button onClick={() => setApplyModal(true)} className="btn-secondary flex items-center gap-1.5 text-sm">
                      <Icon icon="mdi:text-box-multiple-outline" /> Cargar Plantilla
                    </button>
                  )}
                  <button onClick={openAddModule} className="btn-primary flex items-center gap-1.5 text-sm">
                    <Icon icon="mdi:plus" /> Crear Módulo
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {modules.map((mod) => (
                <motion.div key={mod.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
                  {/* Module Header */}
                  <div className="flex items-center justify-between px-6 py-3.5 bg-secondary-50/50 border-b border-secondary-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary-200 flex items-center justify-center">
                        <Icon icon="mdi:folder-outline" className="text-secondary-700 text-lg" />
                      </div>
                      <div>
                        <span className="font-bold text-secondary-900">{mod.name}</span>
                        <p className="text-[10px] text-secondary-400 font-medium tracking-wider uppercase mt-0.5">Subtotal: {symbol} {Number(mod.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                    {!isLocked && (
                      <div className="flex gap-0.5">
                        <button onClick={() => openAddTask(mod.id)} className="p-1.5 text-secondary-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="Añadir tarea">
                          <Icon icon="mdi:plus" className="text-lg" />
                        </button>
                        <button onClick={() => openAddDependency(mod.id)} className="p-1.5 text-secondary-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors" title="Añadir dependencia SaaS">
                          <Icon icon="mdi:api" className="text-lg" />
                        </button>
                        <button onClick={() => openEditModule(mod)} className="p-1.5 text-secondary-400 hover:text-secondary-700 rounded-lg hover:bg-secondary-100 transition-colors">
                          <Icon icon="mdi:pencil-outline" className="text-base" />
                        </button>
                        <button onClick={() => deleteModule(mod.id)} className="p-1.5 text-secondary-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                          <Icon icon="mdi:trash-can-outline" className="text-base" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tasks Sub-list */}
                  <div className="p-4 border-b border-secondary-50">
                    <div className="flex items-center gap-1.5 mb-2 px-2 text-xs font-bold text-secondary-400 tracking-wide uppercase">
                      <Icon icon="mdi:clipboard-text-play-outline" /> Tareas Estimadas
                    </div>
                    {(!mod.tasks || mod.tasks.length === 0) ? (
                      <p className="px-6 py-3 text-xs text-secondary-400 italic">Sin tareas estimadas en este módulo.</p>
                    ) : (
                      <div className="divide-y divide-secondary-100 border border-secondary-100 rounded-lg overflow-hidden bg-white">
                        {mod.tasks.map(task => {
                          const meta = parseMetadata(task.description);
                          return (
                          <div key={task.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-secondary-50/20 transition-colors">
                            <div className="flex-1 pr-4">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-semibold text-secondary-800">{task.name}</p>
                                {meta.priority && meta.priority !== 'Media' && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${meta.priority === 'Alta' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                    {meta.priority}
                                  </span>
                                )}
                                {meta.role && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">
                                    {meta.role}
                                  </span>
                                )}
                                {meta.dependsOn && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 flex items-center gap-0.5" title={`Depende de tarea ID: ${meta.dependsOn}`}>
                                    <Icon icon="mdi:link-variant" /> Dependencia
                                  </span>
                                )}
                              </div>
                              {meta.cleanDesc && <p className="text-xs text-secondary-400 line-clamp-1 mt-0.5">{meta.cleanDesc}</p>}
                              <p className="text-[10px] text-secondary-500 font-mono mt-1">
                                {task.hours ? `${task.hours}h × ${symbol}${task.hourlyRate}/h` : `Cant: ${task.quantity} × ${symbol}${task.unitPrice}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-secondary-900 text-sm">
                                {symbol} {Number(task.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                              {!isLocked && (
                                <div className="flex gap-0.5">
                                  <button onClick={() => openEditTask(task, mod.id)} className="p-1 text-secondary-400 hover:text-blue-600 rounded transition-colors">
                                    <Icon icon="mdi:pencil-outline" className="text-sm" />
                                  </button>
                                  <button onClick={() => deleteTask(task.id)} className="p-1 text-secondary-400 hover:text-red-600 rounded transition-colors">
                                    <Icon icon="mdi:trash-can-outline" className="text-sm" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Dependencies (SaaS) Sub-list */}
                  <div className="p-4 bg-secondary-50/20">
                    <div className="flex items-center gap-1.5 mb-2 px-2 text-xs font-bold text-secondary-400 tracking-wide uppercase">
                      <Icon icon="mdi:cloud-outline" /> Dependencias Externas (SaaS / APIs)
                    </div>
                    {(!mod.dependencies || mod.dependencies.length === 0) ? (
                      <p className="px-6 py-3 text-xs text-secondary-400 italic">Sin dependencias externas registradas.</p>
                    ) : (
                      <div className="divide-y divide-secondary-100 border border-secondary-100 rounded-lg overflow-hidden bg-white">
                        {mod.dependencies.map(dep => (
                          <div key={dep.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-secondary-50/20 transition-colors">
                            <div className="flex-1 pr-4">
                              <p className="text-sm font-semibold text-secondary-800">{dep.provider?.name || 'SaaS'}</p>
                              <p className="text-xs text-secondary-500 mt-0.5">
                                Plan: <span className="font-medium text-secondary-700">{dep.plan?.name || 'Personalizado'}</span> · Recursos: {dep.quantity} · Billed: {dep.plan?.billingCycle === 'annual' ? 'Anual' : 'Mensual'}
                              </p>
                              {dep.plan?.description && <p className="text-[10px] text-secondary-400 mt-0.5">{dep.plan.description}</p>}
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-secondary-900 text-sm">
                                {symbol} {Number(dep.cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                              {!isLocked && (
                                <div className="flex gap-0.5">
                                  <button onClick={() => openEditDependency(dep, mod.id)} className="p-1 text-secondary-400 hover:text-blue-600 rounded transition-colors">
                                    <Icon icon="mdi:pencil-outline" className="text-sm" />
                                  </button>
                                  <button onClick={() => handleDeleteDependency(dep.id)} className="p-1 text-secondary-400 hover:text-red-600 rounded transition-colors">
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
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Summary, Settings, Versions, Exports */}
        <div className="space-y-6">
          {/* Totals Summary */}
          <div className="card p-6 bg-gradient-to-br from-secondary-900 to-secondary-800 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Icon icon="mdi:calculator" className="text-9xl" />
            </div>

            <h3 className="font-bold text-xs uppercase tracking-widest text-secondary-400 mb-4">Resumen de Totales</h3>
            <div className="space-y-3 font-medium text-sm">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-secondary-300">Subtotal Módulos</span>
                <span>{symbol} {Number(budget?.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-secondary-300">Contingencia ({budget?.contingencyPercentage}%)</span>
                <span>{symbol} {Number(budget?.contingencyAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-secondary-300">Margen Comercial ({budget?.marginPercentage}%)</span>
                <span>{symbol} {Number(budget?.marginAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-secondary-300">IGV / Impuesto ({budget?.taxPercentage}%)</span>
                <span>{symbol} {Number(budget?.taxAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-secondary-300">Descuento ({budget?.discountPercentage}%)</span>
                <span className="text-red-300">-{symbol} {Number(budget?.discountAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="font-black text-base text-white">TOTAL FINAL</span>
                <span className="font-black text-2xl text-white">
                  {symbol} {Number(budget?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Sliders */}
          <div className="card p-6 space-y-5">
            <h3 className="font-bold text-sm text-secondary-900 border-b border-secondary-100 pb-2.5 flex items-center gap-1.5">
              <Icon icon="mdi:tune-vertical" className="text-secondary-500" /> Ajustes Financieros
            </h3>

            {/* Currency Selector */}
            <div>
              <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wider mb-1.5">Moneda Base</label>
              <select
                value={budget?.currency}
                disabled={isLocked}
                onChange={async (e) => {
                  try {
                    await budgetsService.update(id, { currency: e.target.value });
                    await fetchBudget();
                  } catch (err) {
                    alert(err.response?.data?.message || 'Error al cambiar moneda');
                  }
                }}
                className="input-base"
              >
                <option value="PEN">Soles (PEN)</option>
                <option value="USD">Dólares (USD)</option>
                <option value="EUR">Euros (EUR)</option>
              </select>
            </div>

            {renderSlider('Contingencia', 'contingencyPercentage', 0, 30)}
            {renderSlider('Margen Comercial', 'marginPercentage', 0, 80)}
            {renderSlider('Impuestos (IGV)', 'taxPercentage', 0, 30)}
            {renderSlider('Descuento', 'discountPercentage', 0, 40)}
          </div>

          {/* Snapshot Versions */}
          <div className="card p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-secondary-100 pb-2.5">
              <h3 className="font-bold text-sm text-secondary-900 flex items-center gap-1.5">
                <Icon icon="mdi:history" className="text-secondary-500" /> Historial de Snapshots
              </h3>
              {!isLocked && (
                <button onClick={handleCreateSnapshot} disabled={saving} className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5">
                  <Icon icon="mdi:plus-circle" /> Guardar
                </button>
              )}
            </div>

            {versions.length === 0 ? (
              <p className="text-xs text-secondary-400 italic text-center py-4">No hay snapshots creados.</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {versions.map((ver) => (
                  <div key={ver.id} className="p-3 bg-secondary-50 rounded-lg border border-secondary-100 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-secondary-800">Versión v{ver.versionNumber}</p>
                      <p className="text-[10px] text-secondary-400 mt-0.5">{new Date(ver.createdAt).toLocaleString()}</p>
                      <p className="text-[9px] text-secondary-500 mt-0.5">Por: {ver.createdBy?.name || 'Sistema'}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setCompareModal(ver)} className="px-2 py-1 bg-white text-secondary-700 border border-secondary-200 rounded font-semibold hover:bg-secondary-100" title="Comparar con actual">
                        Comparar
                      </button>
                      {!isLocked && (
                        <button onClick={() => handleRestoreVersion(ver.id)} className="px-2 py-1 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700" title="Restaurar este estado">
                          Restaurar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export Options */}
          <div className="card p-6 space-y-3">
            <h3 className="font-bold text-sm text-secondary-900 border-b border-secondary-100 pb-2.5 flex items-center gap-1.5">
              <Icon icon="mdi:file-export-outline" className="text-secondary-500" /> Exportar Documentos
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'PDF', format: 'pdf', icon: 'mdi:file-pdf-box', cls: 'hover:bg-red-50 text-red-600 border-red-200' },
                { label: 'Word', format: 'word', icon: 'mdi:file-word-box', cls: 'hover:bg-blue-50 text-blue-600 border-blue-200' },
                { label: 'Excel', format: 'excel', icon: 'mdi:file-excel-box', cls: 'hover:bg-green-50 text-green-600 border-green-200' },
              ].map(opt => (
                <button
                  key={opt.format}
                  disabled={exportingFormat !== null}
                  onClick={() => handleExport(opt.format)}
                  className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-colors text-xs font-bold gap-1 bg-white disabled:opacity-40 cursor-pointer ${opt.cls}`}
                >
                  {exportingFormat === opt.format ? (
                    <Icon icon="mdi:loading" className="text-xl animate-spin" />
                  ) : (
                    <Icon icon={opt.icon} className="text-2xl" />
                  )}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      ) : (
        /* Vista Previa: Render A4 paper sheet container */
        <div className="a4-container">
          <div id="print-area" className="a4-document space-y-8 font-sans">
            {/* Header / Branding */}
            <div className="flex justify-between items-start border-b-2 border-secondary-900 pb-6">
              <div className="text-left">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 bg-secondary-900 text-white rounded-lg flex items-center justify-center font-black text-xl">
                    P
                  </div>
                  <span className="text-xl font-bold tracking-tight text-secondary-900">PresuSoft Co.</span>
                </div>
                <p className="text-xs text-secondary-500 font-medium">PresuSoft Soluciones Tecnológicas S.A.C.</p>
                <p className="text-xs text-secondary-500">RUC: 20123456789</p>
                <p className="text-xs text-secondary-500">Av. Javier Prado Este 1234, San Isidro, Lima</p>
                <p className="text-xs text-secondary-500">contacto@presusoft.com | www.presusoft.com</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-black text-secondary-900 tracking-wide uppercase">PRESUPUESTO</h2>
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-mono font-bold text-secondary-700 bg-secondary-100 px-2 py-0.5 rounded inline-block">
                    {budget?.code}
                  </p>
                  <p className="text-xs text-secondary-500">
                    <span className="font-semibold">Fecha Emisión:</span> {new Date(budget?.createdAt || Date.now()).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-secondary-500">
                    <span className="font-semibold">Validez Oferta:</span> {new Date(new Date(budget?.createdAt || Date.now()).getTime() + (budget?.validityDays || 15) * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })} ({budget?.validityDays || 15} días)
                  </p>
                  <p className="text-xs text-secondary-500">
                    <span className="font-semibold">Estado:</span> {sc.label}
                  </p>
                </div>
              </div>
            </div>

            {/* Client vs Creator Metadata */}
            <div className="grid grid-cols-2 gap-8 bg-secondary-50 p-6 rounded-lg border border-secondary-100 text-left">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-secondary-500 uppercase tracking-wider border-b border-secondary-200 pb-1">
                  PREPARADO PARA
                </h4>
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-sm text-secondary-900">
                    {budget?.project?.client?.name || budget?.client?.name || 'Cliente sin especificar'}
                  </p>
                  {(budget?.project?.client?.businessName || budget?.client?.businessName) && (
                    <p className="font-medium text-secondary-700">
                      {budget?.project?.client?.businessName || budget?.client?.businessName}
                    </p>
                  )}
                  {(budget?.project?.client?.documentNumber || budget?.client?.documentNumber) && (
                    <p className="text-secondary-600">
                      RUC/DNI: {budget?.project?.client?.documentNumber || budget?.client?.documentNumber}
                    </p>
                  )}
                  {(budget?.project?.client?.email || budget?.client?.email) && (
                    <p className="text-secondary-600">
                      Email: {budget?.project?.client?.email || budget?.client?.email}
                    </p>
                  )}
                  {(budget?.project?.client?.phone || budget?.client?.phone) && (
                    <p className="text-secondary-600">
                      Tlf: {budget?.project?.client?.phone || budget?.client?.phone}
                    </p>
                  )}
                  {(budget?.project?.client?.address || budget?.client?.address) && (
                    <p className="text-secondary-600">
                      Dirección: {budget?.project?.client?.address || budget?.client?.address}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-secondary-500 uppercase tracking-wider border-b border-secondary-200 pb-1">
                  ELABORADO POR
                </h4>
                <div className="space-y-1 text-xs text-secondary-600">
                  <p className="font-bold text-sm text-secondary-900">
                    {budget?.createdBy?.name || 'Líder de Proyecto PresuSoft'}
                  </p>
                  <p className="font-medium text-secondary-700">Área de Consultoría y Desarrollo</p>
                  <p>PresuSoft Soluciones Tecnológicas</p>
                  <p>Email: consultoria@presusoft.com</p>
                  <p>Tlf: +51 (1) 500-5000 anexo 210</p>
                </div>
              </div>
            </div>

            {/* Description Brief */}
            {budget?.description && (
              <div className="space-y-2 text-left">
                <h3 className="text-sm font-bold text-secondary-900 border-b border-secondary-200 pb-1.5 uppercase tracking-wide">
                  Descripción del Proyecto / Alcance
                </h3>
                <p className="text-xs text-secondary-600 whitespace-pre-line leading-relaxed">
                  {budget.description}
                </p>
              </div>
            )}

            {/* Modules and Tasks */}
            <div className="space-y-6 text-left">
              <h3 className="text-sm font-bold text-secondary-900 border-b border-secondary-200 pb-1.5 uppercase tracking-wide">
                Desglose Detallado del Proyecto
              </h3>

              {modules.length === 0 ? (
                <p className="text-xs text-secondary-500 italic">No hay módulos definidos en este presupuesto.</p>
              ) : (
                modules.map((mod) => (
                  <div key={mod.id} className="space-y-2">
                    <div className="flex justify-between items-center bg-secondary-900 text-white px-4 py-1.5 rounded text-xs font-bold">
                      <span>MÓDULO: {mod.name}</span>
                      <span>Subtotal Módulo: {symbol} {Number(mod.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <table className="w-full text-left text-xs border border-secondary-100 rounded overflow-hidden">
                      <thead>
                        <tr className="bg-secondary-50 text-secondary-700 font-bold border-b border-secondary-200">
                          <th className="py-2 px-3 w-1/2">Descripción de Tarea</th>
                          <th className="py-2 px-3 text-center">Tipo</th>
                          <th className="py-2 px-3 text-center">Horas / Cant</th>
                          <th className="py-2 px-3 text-right">Tarifa / P.Unitario</th>
                          <th className="py-2 px-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-secondary-100">
                        {(!mod.tasks || mod.tasks.length === 0) ? (
                          <tr>
                            <td colSpan={5} className="py-3 px-3 text-secondary-400 italic text-center">
                              Sin tareas estimadas en este módulo.
                            </td>
                          </tr>
                        ) : (
                          mod.tasks.map(task => (
                            <tr key={task.id} className="hover:bg-secondary-50/20">
                              <td className="py-2 px-3">
                                <span className="font-semibold text-secondary-900">{task.name}</span>
                                {task.description && (
                                  <p className="text-[10px] text-secondary-500 mt-0.5">{task.description}</p>
                                )}
                              </td>
                              <td className="py-2 px-3 text-center text-secondary-600">
                                {task.hours ? 'Por Horas' : 'Fijo'}
                              </td>
                              <td className="py-2 px-3 text-center font-mono">
                                {task.hours ? `${task.hours} hrs` : `${task.quantity} und`}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-secondary-600">
                                {symbol} {Number(task.hours ? task.hourlyRate : task.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-secondary-900">
                                {symbol} {Number(task.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>

            {/* External SaaS Dependencies */}
            {modules.some(m => m.dependencies && m.dependencies.length > 0) && (
              <div className="space-y-3 page-break text-left">
                <h3 className="text-sm font-bold text-secondary-900 border-b border-secondary-200 pb-1.5 uppercase tracking-wide">
                  Servicios SaaS Integrados y Licencias Externas
                </h3>
                <p className="text-xs text-secondary-500">
                  Los siguientes servicios corresponden a proveedores terceros necesarios para la operación del software. Los costos se facturan de manera externa y son convertidos a la moneda base del presupuesto.
                </p>

                <table className="w-full text-left text-xs border border-secondary-100 rounded overflow-hidden">
                  <thead>
                    <tr className="bg-secondary-50 text-secondary-700 font-bold border-b border-secondary-200">
                      <th className="py-2 px-3">Proveedor / Servicio</th>
                      <th className="py-2 px-3">Plan de Licencia</th>
                      <th className="py-2 px-3 text-center">Facturación</th>
                      <th className="py-2 px-3 text-center">Cantidad</th>
                      <th className="py-2 px-3 text-right">Costo Calculado ({symbol})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100">
                    {modules.flatMap(m => m.dependencies || []).map(dep => (
                      <tr key={dep.id} className="hover:bg-secondary-50/20">
                        <td className="py-2 px-3">
                          <span className="font-semibold text-secondary-900">{dep.provider?.name}</span>
                          {dep.plan?.description && (
                            <p className="text-[10px] text-secondary-500 mt-0.5">{dep.plan.description}</p>
                          )}
                        </td>
                        <td className="py-2 px-3 text-secondary-700">
                          {dep.plan?.name}
                        </td>
                        <td className="py-2 px-3 text-center text-secondary-600 capitalize font-medium">
                          {dep.plan?.billingCycle === 'annual' ? 'Anual' : 'Mensual'}
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          {dep.quantity}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-secondary-900">
                          {symbol} {Number(dep.cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Financial Summary Breakdown (Inversión General) */}
            <div className="flex justify-end pt-4 page-break text-left">
              <div className="w-1/2 space-y-2 text-xs">
                <h4 className="font-bold text-secondary-800 border-b border-secondary-200 pb-1.5 uppercase tracking-wide">
                  Resumen de Inversión Financiera
                </h4>
                <div className="space-y-1.5 font-medium">
                  <div className="flex justify-between">
                    <span className="text-secondary-500">Subtotal Módulos</span>
                    <span className="font-mono text-secondary-900">{symbol} {Number(budget?.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  
                  {Number(budget?.contingencyAmount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-secondary-500">Contingencia ({budget?.contingencyPercentage}%)</span>
                      <span className="font-mono text-secondary-900">+{symbol} {Number(budget?.contingencyAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {Number(budget?.marginAmount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-secondary-500">Margen Comercial ({budget?.marginPercentage}%)</span>
                      <span className="font-mono text-secondary-900">+{symbol} {Number(budget?.marginAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {Number(budget?.taxAmount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-secondary-500">Impuestos / IGV ({budget?.taxPercentage}%)</span>
                      <span className="font-mono text-secondary-900">+{symbol} {Number(budget?.taxAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {Number(budget?.discountAmount || 0) > 0 && (
                    <div className="flex justify-between border-b border-secondary-200 pb-2">
                      <span className="text-secondary-500">Descuento Aplicado ({budget?.discountPercentage}%)</span>
                      <span className="font-mono text-red-600">-{symbol} {Number(budget?.discountAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-2 text-sm font-black text-secondary-950">
                    <span>TOTAL PRESUPUESTO</span>
                    <span className="text-base font-mono">
                      {symbol} {Number(budget?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Signatures */}
            <div className="pt-8 space-y-6 border-t border-secondary-200 page-break text-left">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-secondary-900 uppercase tracking-wide">
                  Términos y Condiciones de Pago
                </h4>
                <ul className="list-disc pl-4 text-[11px] text-secondary-500 space-y-0.5">
                  <li>Forma de pago: 50% como adelanto al firmar la aceptación de propuesta y 50% contra conformidad final de entrega.</li>
                  <li>Esta oferta tiene una validez estricta de {budget?.validityDays || 15} días desde la fecha de emisión especificada en el encabezado.</li>
                  <li>Los costos de servicios SaaS y dependencias externas de terceros están sujetos a variaciones de precios del proveedor.</li>
                  <li>Cualquier requerimiento adicional no contemplado en el presente documento será valorizado como un control de cambios separado.</li>
                </ul>
              </div>

              {/* Signature Blocks */}
              <div className="grid grid-cols-2 gap-12 pt-8">
                <div className="text-center space-y-12">
                  <div className="border-b border-secondary-300 w-3/4 mx-auto"></div>
                  <div className="text-[10px] text-secondary-600">
                    <p className="font-bold text-secondary-900">
                      {budget?.project?.client?.name || budget?.client?.name || 'Firma Autorizada Cliente'}
                    </p>
                    <p>{budget?.project?.client?.businessName || budget?.client?.businessName || 'Aceptación y Conformidad'}</p>
                    <p>Fecha de Firma: ____ / ____ / ________</p>
                  </div>
                </div>

                <div className="text-center space-y-12">
                  <div className="border-b border-secondary-300 w-3/4 mx-auto"></div>
                  <div className="text-[10px] text-secondary-600">
                    <p className="font-bold text-secondary-900">
                      {budget?.createdBy?.name || 'Firma Autorizada PresuSoft'}
                    </p>
                    <p>Consultor Tecnológico</p>
                    <p>PresuSoft Soluciones Tecnológicas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

      {/* === MODALS === */}
      <AnimatePresence>
        {/* Module Modal */}
        {moduleModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-950/40 glass-effect"
            onClick={e => e.target === e.currentTarget && setModuleModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-xl shadow-2xl border border-secondary-200 w-full max-w-md p-6 space-y-4">
              <h2 className="text-lg font-bold text-secondary-950">{editModule ? 'Editar Módulo' : 'Nuevo Módulo'}</h2>
              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase mb-1.5">Nombre del Módulo *</label>
                <input value={moduleName} onChange={e => setModuleName(e.target.value)} placeholder="Ej. Backend, Frontend, QA..." className="input-base" />
              </div>
              <div className="flex gap-3 pt-2">
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-950/40 glass-effect"
            onClick={e => e.target === e.currentTarget && setTaskModal(null)}>
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-xl shadow-2xl border border-secondary-200 w-full max-w-lg p-6 space-y-4">
              <h2 className="text-lg font-bold text-secondary-950">{editTask ? 'Editar Tarea' : 'Nueva Tarea'}</h2>

              {/* Task Type Switcher */}
              <div className="flex bg-secondary-100 p-1 rounded-lg">
                <button type="button" onClick={() => setTaskType('hours')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${taskType === 'hours' ? 'bg-white text-secondary-900 shadow-sm' : 'text-secondary-500'}`}>
                  Por Horas
                </button>
                <button type="button" onClick={() => setTaskType('fixed')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${taskType === 'fixed' ? 'bg-white text-secondary-900 shadow-sm' : 'text-secondary-500'}`}>
                  Precio Fijo
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase mb-1.5">Nombre de la tarea *</label>
                <input value={taskForm.name} onChange={e => setTaskForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej. Implementar autenticación OAuth" className="input-base" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {taskType === 'hours' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-secondary-500 uppercase mb-1.5">Horas Estimadas</label>
                      <input type="number" value={taskForm.hours} onChange={e => setTaskForm(f => ({ ...f, hours: e.target.value }))} placeholder="15" className="input-base" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-secondary-500 uppercase mb-1.5">Tarifa por Hora ({symbol})</label>
                      <input type="number" value={taskForm.hourlyRate} onChange={e => setTaskForm(f => ({ ...f, hourlyRate: e.target.value }))} placeholder="35" className="input-base" />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-secondary-500 uppercase mb-1.5">Precio Unitario ({symbol})</label>
                    <input type="number" value={taskForm.unitPrice} onChange={e => setTaskForm(f => ({ ...f, unitPrice: e.target.value }))} placeholder="150" className="input-base" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-secondary-500 uppercase mb-1.5">Cantidad</label>
                  <input type="number" value={taskForm.quantity} onChange={e => setTaskForm(f => ({ ...f, quantity: e.target.value }))} className="input-base" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary-500 uppercase mb-1.5">Rol / Perfil</label>
                  <input value={taskForm.role} onChange={e => setTaskForm(f => ({ ...f, role: e.target.value }))} placeholder="Ej. Frontend, QA..." className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary-500 uppercase mb-1.5">Prioridad</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))} className="input-base bg-white">
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-secondary-500 uppercase mb-1.5">Depende de (Opcional)</label>
                  <select value={taskForm.dependsOn} onChange={e => setTaskForm(f => ({ ...f, dependsOn: e.target.value }))} className="input-base bg-white">
                    <option value="">Ninguna</option>
                    {(() => {
                      const mod = modules.find(m => m.id === taskModal);
                      if (!mod || !mod.tasks) return null;
                      return mod.tasks.filter(t => t.id !== editTask?.id).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ));
                    })()}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase mb-1.5">Descripción</label>
                <textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} rows={2} className="input-base resize-none" placeholder="Descripción adicional..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setTaskModal(null)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={saveTask} disabled={saving} className="btn-primary flex-1">
                  {saving ? <Icon icon="mdi:loading" className="animate-spin text-xl" /> : 'Guardar Tarea'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Dependency Modal */}
        {depModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-950/40 glass-effect"
            onClick={e => e.target === e.currentTarget && setDepModal(null)}>
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-xl shadow-2xl border border-secondary-200 w-full max-w-md p-6 space-y-4">
              <h2 className="text-lg font-bold text-secondary-950">{editDep ? 'Editar Dependencia' : 'Nueva Dependencia SaaS'}</h2>

              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase mb-1.5">Proveedor Externo</label>
                <select
                  value={depForm.providerId}
                  disabled={!!editDep}
                  onChange={e => {
                    const prov = providers.find(p => p.id === e.target.value);
                    setDepForm(f => ({
                      ...f,
                      providerId: e.target.value,
                      planId: prov?.plans?.[0]?.id || ''
                    }));
                  }}
                  className="input-base"
                >
                  <option value="">Selecciona un proveedor</option>
                  {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Plan Selection */}
              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase mb-1.5">Plan de Servicio</label>
                <select
                  value={depForm.planId}
                  onChange={e => setDepForm(f => ({ ...f, planId: e.target.value }))}
                  className="input-base"
                >
                  <option value="">Selecciona un plan</option>
                  {selectedProvider?.plans?.map(pl => (
                    <option key={pl.id} value={pl.id}>
                      {pl.name} - ${pl.price} USD / {pl.billingCycle === 'annual' ? 'Año' : 'Mes'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase mb-1.5">Cantidad de Recursos</label>
                <input
                  type="number"
                  min="1"
                  value={depForm.quantity}
                  onChange={e => setDepForm(f => ({ ...f, quantity: e.target.value }))}
                  className="input-base"
                />
              </div>

              {/* Price Preview & Tooltip info */}
              {selectedPlan && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-blue-900">Detalles de Costo Estimado:</p>
                      <p className="text-[11px] text-blue-700">
                        Costo Base: ${selectedPlan.price} USD / {selectedPlan.billingCycle === 'annual' ? 'año' : 'mes'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-blue-900">
                        Subtotal Plan: ${(selectedPlan.price * (Number(depForm.quantity) || 1)).toFixed(2)} USD
                      </p>
                    </div>
                  </div>
                  
                  {/* Tooltip / Details card for Plan */}
                  <div className="bg-white p-2.5 rounded border border-blue-100 mt-2">
                    <p className="text-[11px] font-bold text-secondary-800 mb-1 flex items-center gap-1">
                      <Icon icon="mdi:information-outline" className="text-blue-600" /> Beneficios y detalles del plan:
                    </p>
                    <p className="text-[10px] text-secondary-600 leading-relaxed whitespace-pre-line">
                      {selectedPlan.description || 'Este plan incluye funcionalidades estándar de la plataforma. Verifica los límites en la documentación del proveedor.'}
                    </p>
                  </div>
                  
                  <p className="text-[9px] text-blue-600 mt-1 italic text-center">
                    * El backend convertirá automáticamente los costos en USD a {budget?.currency} en base a la tasa actual.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setDepModal(null)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={saveDependency} disabled={saving || !depForm.planId} className="btn-primary flex-1">
                  {saving ? <Icon icon="mdi:loading" className="animate-spin text-xl" /> : 'Guardar Dependencia'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Apply Template Modal */}
        {applyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-950/40 glass-effect"
            onClick={e => e.target === e.currentTarget && setApplyModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-xl shadow-2xl border border-secondary-200 w-full max-w-lg p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-secondary-100 pb-2">
                <h2 className="text-lg font-bold text-secondary-950">Seleccionar Plantilla Base</h2>
                <button onClick={() => setApplyModal(false)} className="text-secondary-400 hover:text-secondary-600">
                  <Icon icon="mdi:close" className="text-xl" />
                </button>
              </div>

              {templates.length === 0 ? (
                <p className="text-xs text-secondary-400 italic text-center py-6">No hay plantillas creadas. Ve a la sección Plantillas primero.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {templates.map((temp) => (
                    <div key={temp.id} className="p-4 bg-secondary-50 hover:bg-secondary-100/60 rounded-xl border border-secondary-100 flex justify-between items-center transition-colors">
                      <div className="space-y-1">
                        <p className="font-bold text-secondary-900 text-sm">{temp.name}</p>
                        {temp.category && <span className="inline-block text-[10px] bg-secondary-200 text-secondary-700 px-2 py-0.5 rounded font-bold">{temp.category}</span>}
                        {temp.description && <p className="text-xs text-secondary-500 pr-4">{temp.description}</p>}
                      </div>
                      <button onClick={() => handleApplyTemplate(temp.id)} disabled={saving} className="btn-primary text-xs py-1.5 px-3">
                        Aplicar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Version Comparison Modal */}
        {compareModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-950/40 glass-effect"
            onClick={e => e.target === e.currentTarget && setCompareModal(null)}>
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-xl shadow-2xl border border-secondary-200 w-full max-w-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-secondary-100 pb-2">
                <h2 className="text-lg font-bold text-secondary-950">Comparar Presupuesto con Snapshot v{compareModal.versionNumber}</h2>
                <button onClick={() => setCompareModal(null)} className="text-secondary-400 hover:text-secondary-600">
                  <Icon icon="mdi:close" className="text-xl" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-secondary-200 text-xs font-bold text-secondary-400 uppercase">
                      <th className="py-2">Concepto</th>
                      <th className="py-2 text-right">Actual</th>
                      <th className="py-2 text-right">Snapshot</th>
                      <th className="py-2 text-right">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const snap = compareModal.snapshotData || {};
                      return [
                        renderSlider ? (
                          <>
                            {renderSlider && (
                              <>
                                <tr className="border-b border-secondary-100">
                                  <td className="py-3 font-semibold text-secondary-700">Moneda Base</td>
                                  <td className="py-3 text-right text-secondary-900 font-bold">{budget.currency}</td>
                                  <td className="py-3 text-right text-secondary-600">{snap.currency}</td>
                                  <td className="py-3 text-right text-secondary-400">—</td>
                                </tr>
                                {[
                                  { label: 'Subtotal Módulos', field: 'subtotal' },
                                  { label: 'Contingencia (%)', field: 'contingencyPercentage', isPercent: true },
                                  { label: 'Contingencia Monto', field: 'contingencyAmount' },
                                  { label: 'Margen Comercial (%)', field: 'marginPercentage', isPercent: true },
                                  { label: 'Margen Comercial Monto', field: 'marginAmount' },
                                  { label: 'IGV / Impuesto (%)', field: 'taxPercentage', isPercent: true },
                                  { label: 'IGV / Impuesto Monto', field: 'taxAmount' },
                                  { label: 'Descuento (%)', field: 'discountPercentage', isPercent: true },
                                  { label: 'Descuento Monto', field: 'discountAmount' },
                                ].map(row => {
                                  const curVal = budget[row.field];
                                  const snapVal = snap[row.field];
                                  const diff = Number(curVal || 0) - Number(snapVal || 0);

                                  const curFormatted = row.isPercent ? `${curVal}%` : `${symbol} ${Number(curVal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                                  const snapFormatted = row.isPercent ? `${snapVal}%` : `${getCurrencySymbol(snap.currency)} ${Number(snapVal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

                                  let diffFormatted = '';
                                  let diffClass = 'text-secondary-500';
                                  if (!row.isPercent) {
                                    if (diff > 0) {
                                      diffFormatted = `+${symbol} ${diff.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                                      diffClass = 'text-red-500 font-bold';
                                    } else if (diff < 0) {
                                      diffFormatted = `-${symbol} ${Math.abs(diff).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                                      diffClass = 'text-green-500 font-bold';
                                    } else {
                                      diffFormatted = 'Sin cambios';
                                    }
                                  } else {
                                    if (diff > 0) {
                                      diffFormatted = `+${diff.toFixed(1)}%`;
                                      diffClass = 'text-red-500 font-bold';
                                    } else if (diff < 0) {
                                      diffFormatted = `${diff.toFixed(1)}%`;
                                      diffClass = 'text-green-500 font-bold';
                                    } else {
                                      diffFormatted = 'Sin cambios';
                                    }
                                  }

                                  return (
                                    <tr key={row.label} className="border-b border-secondary-100">
                                      <td className="py-2.5 font-medium text-secondary-700">{row.label}</td>
                                      <td className="py-2.5 text-right font-semibold text-secondary-900">{curFormatted}</td>
                                      <td className="py-2.5 text-right text-secondary-600">{snapFormatted}</td>
                                      <td className={`py-2.5 text-right ${diffClass}`}>{diffFormatted}</td>
                                    </tr>
                                  );
                                })}
                                <tr className="border-b border-secondary-200 bg-secondary-50 font-black">
                                  <td className="py-3 pl-2 text-secondary-900">TOTAL FINAL</td>
                                  <td className="py-3 text-right text-secondary-950 text-base">
                                    {symbol} {Number(budget.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-3 text-right text-secondary-700">
                                    {getCurrencySymbol(snap.currency)} {Number(snap.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </td>
                                  {(() => {
                                    const diff = Number(budget.total || 0) - Number(snap.total || 0);
                                    return (
                                      <td className={`py-3 pr-2 text-right ${diff > 0 ? 'text-red-600' : diff < 0 ? 'text-green-600' : 'text-secondary-500'}`}>
                                        {diff > 0 ? '+' : ''}{symbol} {diff.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                      </td>
                                    );
                                  })()}
                                </tr>
                              </>
                            )}
                          </>
                        ) : null
                      ];
                    })()}
                  </tbody>
                </table>
              </div>

              {/* General project structure difference */}
              <div className="p-4 bg-secondary-50 rounded-lg text-xs space-y-1">
                <p className="font-bold text-secondary-800">Estructura del Proyecto:</p>
                <div className="grid grid-cols-2 gap-4 text-secondary-600">
                  <div>
                    <span className="font-semibold text-secondary-700">Estado Actual:</span>
                    <ul className="list-disc pl-4 mt-1">
                      <li>{modules.length} módulos</li>
                      <li>{modules.reduce((a, m) => a + (m.tasks?.length || 0), 0)} tareas</li>
                      <li>{modules.reduce((a, m) => a + (m.dependencies?.length || 0), 0)} dependencias SaaS</li>
                    </ul>
                  </div>
                  <div>
                    <span className="font-semibold text-secondary-700">En Snapshot:</span>
                    <ul className="list-disc pl-4 mt-1">
                      <li>{compareModal.snapshotData?.project?.modules?.length || 0} módulos</li>
                      <li>{compareModal.snapshotData?.project?.modules?.reduce((a, m) => a + (m.tasks?.length || 0), 0) || 0} tareas</li>
                      <li>{compareModal.snapshotData?.project?.modules?.reduce((a, m) => a + (m.dependencies?.length || 0), 0) || 0} dependencias SaaS</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={() => setCompareModal(null)} className="btn-secondary px-6">Cerrar Comparación</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Save Template Modal */}
        {saveTemplateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-950/40 glass-effect text-left"
            onClick={e => e.target === e.currentTarget && setSaveTemplateModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-xl shadow-2xl border border-secondary-200 w-full max-w-md p-6 space-y-4">
              <h2 className="text-lg font-bold text-secondary-950">Guardar como Plantilla</h2>
              <p className="text-xs text-secondary-500">
                Crea una plantilla reutilizable con los módulos y tareas actuales de este presupuesto.
              </p>
              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase mb-1.5">Nombre de la Plantilla *</label>
                <input
                  value={templateForm.name}
                  onChange={e => setTemplateForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej. Plantilla ERP Base"
                  className="input-base"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase mb-1.5">Categoría</label>
                <select
                  value={templateForm.category}
                  onChange={e => setTemplateForm(f => ({ ...f, category: e.target.value }))}
                  className="input-base"
                >
                  <option value="Desarrollo Web">Desarrollo Web</option>
                  <option value="Mobile App">Mobile App</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="ERP / CRM">ERP / CRM</option>
                  <option value="Marketing Digital">Marketing Digital</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase mb-1.5">Descripción</label>
                <textarea
                  value={templateForm.description}
                  onChange={e => setTemplateForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Describe brevemente el alcance de esta plantilla..."
                  className="input-base resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setSaveTemplateModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={handleSaveAsTemplate} disabled={saving} className="btn-primary flex-1 bg-secondary-800 hover:bg-secondary-900 text-white">
                  {saving ? <Icon icon="mdi:loading" className="animate-spin text-xl" /> : 'Guardar Plantilla'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


