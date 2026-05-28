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
import { aiService } from '../api/ai.service';
import { templatesService } from '../../templates/api/templates.service';
import { companiesService } from '../../settings/api/companies.service';
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

const MODULE_SUGGESTIONS = {
  'Frontend': ['React', 'Vue', 'Angular', 'Astro', 'Next.js', 'Nuxt', 'Svelte', 'Tailwind', 'Bootstrap'],
  'Backend': ['Node.js', 'Python/Django', 'Python/FastAPI', 'Java/Spring', 'PHP/Laravel', 'Ruby', 'Go', '.NET'],
  'Base de Datos': ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Firebase', 'Supabase', 'SQL Server'],
  'Infra / Cloud': ['AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'Vercel', 'Heroku'],
  'App Móvil': ['React Native', 'Flutter', 'Swift (iOS)', 'Kotlin (Android)', 'Ionic'],
  'Soporte y Mantenimiento': ['1 Mes', '3 Meses', '6 Meses', '1 Año'],
  'Otros': ['Diseño UI/UX', 'Testing & QA', 'Project Management', 'SEO', 'Analytics']
};

export default function BudgetEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportingFormat, setExportingFormat] = useState(null);

  // AI Model States
  const [aiModal, setAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiMarket, setAiMarket] = useState('peru');
  const [aiScope, setAiScope] = useState('full');

  // Specific Seniorities
  const [aiSenUI, setAiSenUI] = useState('mid');
  const [aiSenFront, setAiSenFront] = useState('mid');
  const [aiSenBack, setAiSenBack] = useState('mid');
  const [aiSenDB, setAiSenDB] = useState('mid');
  const [aiSenInfra, setAiSenInfra] = useState('mid');

  // Toast notification
  const [toast, setToast] = useState(null); // { msg, type: 'success'|'error' }

  // Catalogs
  const [providers, setProviders] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [versions, setVersions] = useState([]);
  const [company, setCompany] = useState(null);

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
  const [multiModules, setMultiModules] = useState([]);
  const [moduleCategory, setModuleCategory] = useState('Frontend');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
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
      const [provRes, tempRes, verRes, compRes] = await Promise.allSettled([
        providersService.getAll(),
        templatesService.getAll(),
        versionsService.getByBudgetId(id),
        companiesService.getAll()
      ]);
      if (provRes.status === 'fulfilled') setProviders(provRes.value.data?.data || []);
      if (tempRes.status === 'fulfilled') setTemplates(tempRes.value.data?.data || []);
      if (verRes.status === 'fulfilled') setVersions(verRes.value.data?.data || []);
      if (compRes.status === 'fulfilled' && compRes.value.data?.data?.length > 0) setCompany(compRes.value.data.data[0]);
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
  const openAddModule = () => { setEditModule(null); setModuleName(''); setMultiModules([]); setModuleModal(true); };
  const openEditModule = (mod) => { setEditModule(mod); setModuleName(mod.name); setModuleModal(true); };

  const saveModule = async () => {
    if (editModule && !moduleName.trim()) return;
    if (!editModule && multiModules.length === 0 && !moduleName.trim()) return;
    
    setSaving(true);
    try {
      if (editModule) {
        await budgetModulesService.update(editModule.id, { name: moduleName });
      } else {
        if (multiModules.length > 0) {
          let order = (budget?.project?.modules?.length || 0);
          for (const m of multiModules) {
            if (m.name.trim()) {
              order++;
              await budgetModulesService.create(budget.projectId, {
                name: m.name,
                orderNumber: order
              });
            }
          }
        } else if (moduleName.trim()) {
          await budgetModulesService.create(budget.projectId, {
            name: moduleName,
            orderNumber: (budget?.project?.modules?.length || 0) + 1
          });
        }
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

  /* ---- AI MODEL GENERATION ---- */
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await aiService.generateBudget(aiPrompt, id, aiMarket, aiScope, {
        ui: aiSenUI,
        front: aiSenFront,
        back: aiSenBack,
        db: aiSenDB,
        infra: aiSenInfra
      });
      const data = res.data?.data;
      setAiResult(data);
      await fetchBudget();
      const adj = data?.financialAdjustments;
      const adjText = adj ? ` | Contingencia ${adj.contingency}% · Margen ${adj.margin}%` : '';
      showToast(`✅ ${data?.totalModules} módulos generados · ${data?.marketLabel} · ${data?.seniorityLabel}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al generar módulos', 'error');
    } finally {
      setAiLoading(false);
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
      showToast(`📥 Archivo "${filename}" descargado en tu carpeta de Descargas`);
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
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'edit'
                  ? 'bg-white text-secondary-900 shadow-sm'
                  : 'text-secondary-500 hover:text-secondary-700'
                }`}
            >
              <Icon icon="mdi:pencil-outline" className="text-base" />
              Editor
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'preview'
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
              <div className="flex gap-2 flex-wrap">
                {/* Botón IA - siempre visible */}
                <button
                  onClick={() => {
                    setAiModal(true); setAiPrompt(''); setAiResult(null);
                    setAiMarket('peru'); setAiScope('full');
                    setAiSenUI('mid'); setAiSenFront('mid'); setAiSenBack('mid'); setAiSenDB('mid'); setAiSenInfra('mid');
                  }}
                  style={{ background: '#4f46e5', color: 'white', border: 'none' }}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <Icon icon="mdi:brain" /> Generar con Modelo
                </button>

                {!isLocked && (
                  <>
                    {modules.length === 0 && budget?.status === 'draft' && (
                      <button onClick={() => setApplyModal(true)} className="btn-secondary text-secondary-600 flex items-center gap-1.5 text-sm">
                        <Icon icon="mdi:text-box-multiple-outline" /> Aplicar Plantilla
                      </button>
                    )}
                    <button onClick={openAddModule} className="btn-primary flex items-center gap-1.5 text-sm">
                      <Icon icon="mdi:plus" /> Añadir Módulo
                    </button>
                  </>
                )}
              </div>
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
            <div className="card p-6 bg-secondary-900 text-white relative overflow-hidden">
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
                  <div className="w-10 h-10 bg-secondary-900 text-white rounded-lg flex items-center justify-center font-black text-xl uppercase">
                    {company?.name ? company.name.charAt(0) : 'P'}
                  </div>
                  <span className="text-xl font-bold tracking-tight text-secondary-900">
                    {company?.name || 'Nombre de mi Empresa'}
                  </span>
                </div>
                {company?.ruc && <p className="text-xs text-secondary-500 font-medium">RUC / NIT: {company.ruc}</p>}
                {company?.address && <p className="text-xs text-secondary-500">{company.address}</p>}
                {company?.phone && <p className="text-xs text-secondary-500">Telf: {company.phone}</p>}
                {company?.email && <p className="text-xs text-secondary-500">Email: {company.email}</p>}
                {company?.website && <p className="text-xs text-secondary-500">Web: {company.website}</p>}
                {!company && (
                  <>
                    <p className="text-xs text-secondary-500 font-medium">Ve a Configuración para actualizar los datos de tu empresa</p>
                  </>
                )}
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
              className="bg-white rounded-2xl shadow-2xl border border-secondary-200 w-full max-w-4xl p-6 space-y-5">
              
              <div className="flex justify-between items-center border-b border-secondary-100 pb-3">
                <h2 className="text-xl font-black text-secondary-950 flex items-center gap-2">
                  <Icon icon={editModule ? 'mdi:pencil-box-multiple' : 'mdi:plus-box-multiple'} className="text-secondary-500" /> 
                  {editModule ? 'Editar Módulo' : 'Generador de Módulo'}
                </h2>
                <button onClick={() => setModuleModal(false)} className="text-secondary-400 hover:text-secondary-700 transition-colors">
                  <Icon icon="mdi:close" className="text-2xl" />
                </button>
              </div>

              {/* Two-Column Drag and Drop Layout */}
              {!editModule && (() => {
                const projectRolesRaw = budget?.teamMembers?.map(tm => tm.projectRole || tm.collaborator?.role || tm.collaborator?.name).filter(Boolean) || [];
                const rolesStr = projectRolesRaw.join(' ').toLowerCase();
                
                const showFront = projectRolesRaw.length === 0 || rolesStr.includes('front') || rolesStr.includes('full') || rolesStr.includes('web') || rolesStr.includes('ui');
                const showBack = projectRolesRaw.length === 0 || rolesStr.includes('back') || rolesStr.includes('full') || rolesStr.includes('api');
                const showData = projectRolesRaw.length === 0 || rolesStr.includes('data') || rolesStr.includes('base') || rolesStr.includes('sql') || rolesStr.includes('full') || rolesStr.includes('back');
                const showInfra = projectRolesRaw.length === 0 || rolesStr.includes('infra') || rolesStr.includes('cloud') || rolesStr.includes('devops') || rolesStr.includes('aws');
                const showMovil = projectRolesRaw.length === 0 || rolesStr.includes('movil') || rolesStr.includes('mobile') || rolesStr.includes('ios') || rolesStr.includes('android');

                const dynamicSuggestions = {};
                if (showFront) dynamicSuggestions['Frontend'] = MODULE_SUGGESTIONS['Frontend'];
                if (showBack) dynamicSuggestions['Backend'] = MODULE_SUGGESTIONS['Backend'];
                if (showData) dynamicSuggestions['Base de Datos'] = MODULE_SUGGESTIONS['Base de Datos'];
                if (showInfra) dynamicSuggestions['Infra / Cloud'] = MODULE_SUGGESTIONS['Infra / Cloud'];
                if (showMovil) dynamicSuggestions['App Móvil'] = MODULE_SUGGESTIONS['App Móvil'];
                dynamicSuggestions['Soporte y Mantenimiento'] = MODULE_SUGGESTIONS['Soporte y Mantenimiento'];
                dynamicSuggestions['Otros'] = MODULE_SUGGESTIONS['Otros'];

                const uniqueProjectRoles = [...new Set(projectRolesRaw)];
                if (uniqueProjectRoles.length > 0) {
                  dynamicSuggestions['Equipo / Roles'] = uniqueProjectRoles;
                }

                // Obtener todas las etiquetas seleccionadas buscando ocurrencias
                const allPossibleTags = Object.values(dynamicSuggestions).flat();
                const selectedTags = editModule 
                  ? allPossibleTags.filter(t => moduleName.includes(t))
                  : allPossibleTags.filter(t => multiModules.some(m => m.name.includes(t)));

                const toggleTech = (tech, category) => {
                  if (editModule) {
                    setModuleName(prev => {
                      if (prev.includes(tech)) {
                        let updated = prev.replace(tech, '');
                        updated = updated.replace(/,\s*,/g, ', ').replace(/\(\s*,/g, '(').replace(/,\s*\)/g, ')').replace(/\s+/g, ' ');
                        updated = updated.replace(/^,\s*/, '').replace(/,\s*$/, '');
                        if (updated.endsWith(' ()')) updated = updated.replace(' ()', '');
                        if (updated === '()') updated = '';
                        return updated.trim();
                      } else {
                        let cleanCat = category || 'Módulo';
                        if (cleanCat === 'Equipo / Roles' || cleanCat === 'Otros') cleanCat = 'Módulo';
                        
                        if (!prev) return `${cleanCat} (${tech})`;
                        
                        const match = prev.match(/^(.*?)\s*\((.*)\)$/);
                        if (match) {
                          let base = match[1].trim();
                          const currentTechs = match[2].trim();
                          if (cleanCat !== 'Módulo' && !base.includes(cleanCat)) {
                            base = `${base} & ${cleanCat}`;
                          }
                          return `${base} (${currentTechs ? currentTechs + ', ' : ''}${tech})`;
                        } else {
                          if (!prev.includes('(')) {
                            return `${prev.trim()} (${tech})`;
                          }
                          return `${prev.trim()}, ${tech}`;
                        }
                      }
                    });
                  } else {
                    setMultiModules(prev => {
                      const techToMonths = (t) => {
                         if (t === '1 Año') return 12;
                         const match = t.match(/(\d+)\s+Mes/i);
                         if (match) return parseInt(match[1], 10);
                         return 0;
                      };
                      const monthsToTech = (m) => {
                         if (m <= 0) return null;
                         if (m % 12 === 0) return `${m/12} ${m/12 === 1 ? 'Año' : 'Años'}`;
                         return `${m} ${m === 1 ? 'Mes' : 'Meses'}`;
                      };

                      let cleanCat = category || 'Módulo';
                      if (cleanCat === 'Equipo / Roles' || cleanCat === 'Otros') cleanCat = 'Módulo';

                      let isTimeAdd = false;
                      if (category === 'Soporte y Mantenimiento' && techToMonths(tech) > 0) {
                          isTimeAdd = true;
                      }

                      let exists = false;
                      let next = prev.map(m => {
                         if (m.name.includes(tech) && !isTimeAdd) {
                            exists = true;
                            let newName = m.name.replace(tech, '');
                            newName = newName.replace(/,\s*,/g, ', ').replace(/\(\s*,/g, '(').replace(/,\s*\)/g, ')').replace(/\s+/g, ' ').replace(/^,\s*/, '').replace(/,\s*$/, '').trim();
                            if (newName.endsWith(' ()')) newName = newName.replace(' ()', '');
                            if (newName === '()') newName = '';
                            return { ...m, name: newName };
                         }
                         return m;
                      }).filter(m => m.name !== '');

                      if (exists) return next;

                      if (isTimeAdd) {
                          const addedMonths = techToMonths(tech);
                          const idx = next.findIndex(m => m.name.startsWith(cleanCat));
                          if (idx >= 0) {
                              const m = next[idx];
                              const match = m.name.match(/^(.*?)\s*\((.*)\)$/);
                              if (match) {
                                  const existingTechs = match[2].split(',').map(t=>t.trim());
                                  let totalMonths = addedMonths;
                                  const nonTimeTechs = [];
                                  for (const t of existingTechs) {
                                      const tm = techToMonths(t);
                                      if (tm > 0) totalMonths += tm;
                                      else nonTimeTechs.push(t);
                                  }
                                  nonTimeTechs.push(monthsToTech(totalMonths));
                                  next[idx] = { ...m, name: `${match[1].trim()} (${nonTimeTechs.join(', ')})` };
                                  return [...next];
                              }
                          }
                      }

                      const idx = next.findIndex(m => m.name.startsWith(cleanCat));
                      if (idx >= 0) {
                          const m = next[idx];
                          const match = m.name.match(/^(.*?)\s*\((.*)\)$/);
                          let newName = '';
                          if (match) {
                             newName = `${match[1].trim()} (${match[2].trim() ? match[2].trim() + ', ' : ''}${tech})`;
                          } else {
                             newName = `${m.name} (${tech})`;
                          }
                          next[idx] = { ...m, name: newName };
                          return [...next];
                      } else {
                          return [...next, { id: Date.now(), name: `${cleanCat} (${tech})` }];
                      }
                    });
                  }
                };

                return (
                  <div className="flex flex-col gap-4">
                    <p className="text-xs text-secondary-500">Arrastra las tecnologías o roles hacia la otra caja para agregarlas al módulo.</p>
                    <div className="flex flex-col md:flex-row gap-6 items-stretch">
                      
                      {/* Izquierda: Disponibles */}
                      <div className="flex-1 bg-secondary-50 rounded-2xl p-5 border border-secondary-200 min-h-[400px] max-h-[500px] overflow-y-auto">
                        <h4 className="text-[11px] font-black text-secondary-600 uppercase tracking-wider mb-5">Disponibles</h4>
                        <div className="space-y-6">
                          {Object.entries(dynamicSuggestions).map(([cat, techs]) => {
                            const availableTechs = editModule 
                              ? techs.filter(t => !moduleName.includes(t))
                              : techs.filter(t => !multiModules.some(m => m.name.includes(t)));

                            if (availableTechs.length === 0) return null;
                            
                            return (
                              <div key={cat}>
                                <h5 className="text-[10px] font-bold text-secondary-400 uppercase mb-2">{cat}</h5>
                                <div className="flex flex-col gap-2">
                                  {availableTechs.map(tech => (
                                    <div
                                      key={tech}
                                      draggable
                                      onDragStart={(e) => {
                                        e.dataTransfer.setData('text/plain', JSON.stringify({ category: cat, tech }));
                                        e.dataTransfer.effectAllowed = 'copy';
                                      }}
                                      className="bg-white rounded-xl p-3 flex items-center justify-between border border-secondary-200 cursor-grab active:cursor-grabbing hover:border-indigo-400 hover:shadow-sm transition-all"
                                    >
                                      <span className="text-xs font-bold text-secondary-700">{tech}</span>
                                      <button 
                                        type="button" 
                                        onClick={() => toggleTech(tech, cat)} 
                                        className="text-secondary-400 hover:text-indigo-600 transition-colors"
                                      >
                                        <Icon icon="mdi:plus-circle" className="text-xl" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Derecha: Seleccionados */}
                      <div 
                        className={`flex-1 rounded-2xl p-5 transition-all duration-300 border-2 flex flex-col ${
                          isDraggingOver 
                            ? 'bg-indigo-50 border-dashed border-indigo-400 shadow-inner' 
                            : (selectedTags.length > 0 || multiModules.length > 0 ? 'bg-[#f0fdf4] border-solid border-green-500' : 'bg-white border-dashed border-secondary-200')
                        }`}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                        onDragEnter={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDraggingOver(false); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingOver(false);
                          try {
                            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                            const alreadyAdded = editModule ? moduleName.includes(data.tech) : multiModules.some(m => m.name.includes(data.tech));
                            if (data.tech && !alreadyAdded) toggleTech(data.tech, data.category);
                          } catch (err) {}
                        }}
                      >
                        <h4 className={`text-[11px] font-black uppercase tracking-wider mb-5 flex items-center gap-2 ${selectedTags.length > 0 || multiModules.length > 0 ? 'text-green-600' : 'text-secondary-400'}`}>
                          {editModule ? 'Módulo' : 'Módulos a Crear'} ({editModule ? selectedTags.length : multiModules.length})
                        </h4>
                        
                        <div className="flex-1 overflow-y-auto mb-4">
                          {!editModule && multiModules.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-secondary-400 opacity-50 py-10">
                              <Icon icon="mdi:drag-variant" className="text-5xl mb-2" />
                            </div>
                          )}
                          
                          {editModule && selectedTags.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-secondary-400 opacity-50 py-10">
                              <Icon icon="mdi:drag-variant" className="text-5xl mb-2" />
                            </div>
                          )}

                          {!editModule && multiModules.length > 0 && (
                            <div className="flex flex-col gap-4">
                               {multiModules.map(m => {
                                  const match = m.name.match(/^(.*?)\s*\((.*)\)$/);
                                  const techs = match && match[2] ? match[2].split(',').map(t=>t.trim()) : [];
                                  
                                  return (
                                    <div key={m.id} className="bg-white rounded-xl p-3 border border-green-500 shadow-sm flex flex-col gap-3">
                                      <div className="flex flex-wrap gap-2">
                                        {techs.map(tech => (
                                          <div key={tech} className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                                            <span>{tech}</span>
                                            <button type="button" onClick={() => toggleTech(tech)} className="hover:text-red-500 transition-colors">
                                              <Icon icon="mdi:close" className="text-sm" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                      <input 
                                        value={m.name} 
                                        onChange={e => setMultiModules(prev => prev.map(mod => mod.id === m.id ? { ...mod, name: e.target.value } : mod))}
                                        className="w-full border border-secondary-200 rounded-lg py-1.5 px-3 text-xs text-secondary-900 font-bold focus:border-indigo-500 outline-none"
                                      />
                                    </div>
                                  );
                               })}
                               <button 
                                 type="button"
                                 onClick={() => setMultiModules(prev => [...prev, { id: Date.now(), name: 'Módulo Personalizado' }])}
                                 className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-secondary-300 rounded-xl text-secondary-500 font-bold hover:bg-secondary-50 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                               >
                                 <Icon icon="mdi:plus-circle-outline" className="text-xl" />
                                 Añadir Módulo Personalizado
                               </button>
                            </div>
                          )}

                          {editModule && selectedTags.length > 0 && (
                            <div className="flex flex-col gap-2">
                              {selectedTags.map(tech => (
                                <div 
                                  key={tech} 
                                  className="bg-white rounded-xl p-3 flex items-center justify-between border border-green-500 shadow-sm"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                                      <Icon icon="mdi:check-circle" className="text-lg" />
                                    </div>
                                    <span className="text-xs font-bold text-secondary-900">{tech}</span>
                                  </div>
                                  <button 
                                    type="button" 
                                    onClick={() => toggleTech(tech)} 
                                    className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                  >
                                    <Icon icon="mdi:close" className="text-lg" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Input Final para edición única */}
                        {editModule && (
                          <div className="pt-4 border-t border-secondary-200">
                            <label className="block text-[10px] font-bold text-secondary-500 uppercase mb-1.5">Nombre Final (Editable)</label>
                            <div className="relative">
                              <input 
                                value={moduleName} 
                                onChange={e => setModuleName(e.target.value)} 
                                placeholder="Ej. Frontend (React, Tailwind)..." 
                                className="w-full border-2 border-secondary-200 rounded-xl py-3 px-4 text-secondary-900 font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all bg-white"
                              />
                              {moduleName && (
                                <button 
                                  onClick={() => setModuleName('')}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-700"
                                >
                                  <Icon icon="mdi:close-circle" className="text-lg" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {!editModule && multiModules.length === 0 && (
                          <div className="pt-4 border-t border-secondary-200">
                            <label className="block text-[10px] font-bold text-secondary-500 uppercase mb-1.5">Nombre (Si no arrastras nada)</label>
                            <input 
                              value={moduleName} 
                              onChange={e => setModuleName(e.target.value)} 
                              placeholder="Módulo personalizado..." 
                              className="w-full border-2 border-secondary-200 rounded-xl py-3 px-4 text-secondary-900 font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all bg-white"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t border-secondary-100">
                <button onClick={() => setModuleModal(false)} className="btn-secondary flex-1 py-2.5 bg-white border-2">Cancelar</button>
                <button onClick={saveModule} disabled={saving || !moduleName.trim()} className="btn-primary flex-1 py-2.5 shadow-lg shadow-indigo-500/20">
                  {saving ? <Icon icon="mdi:loading" className="animate-spin text-xl" /> : (
                    <div className="flex items-center justify-center gap-2">
                      <Icon icon="mdi:check-circle" className="text-lg" />
                      {editModule ? 'Guardar Cambios' : 'Crear Módulo'}
                    </div>
                  )}
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

      {/* ── AI MODEL MODAL ── */}
      <AnimatePresence>
        {aiModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setAiModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-secondary-200 w-full max-w-3xl overflow-hidden"
            >
              {/* Header */}
              <div className=" bg-indigo-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Icon icon="mdi:brain" className="text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Generar con Modelo Predictivo</h2>
                    <p className="text-xs text-violet-200">Modelo entrenado localmente · Sin APIs externas</p>
                  </div>
                </div>
                <p className="text-sm text-violet-100 mt-1">
                  Describe tu proyecto en texto libre. El modelo clasificará el tipo y generará
                  automáticamente módulos, tareas y estimaciones de horas.
                </p>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Selectors: Mercado */}
                <div className="grid grid-cols-1 gap-3 bg-violet-50/50 p-4 rounded-t-xl border border-violet-100 border-b-0">
                  <div>
                    <label className="block text-[11px] font-bold text-violet-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Icon icon="mdi:earth" className="text-sm" /> Mercado
                    </label>
                    <select
                      value={aiMarket}
                      onChange={e => setAiMarket(e.target.value)}
                      className="w-full bg-white border border-violet-200 text-secondary-800 text-sm rounded-lg focus:ring-violet-500 focus:border-violet-500 p-2 shadow-sm"
                    >
                      <option value="peru">🇵🇪 Perú</option>
                      <option value="latam">🌎 Latam</option>
                      <option value="espana">🇪🇸 España</option>
                      <option value="usa">🇺🇸 USA/Europa</option>
                    </select>
                  </div>
                </div>

                {/* Team Members */}
                <div className="bg-violet-50/30 p-4 rounded-b-xl border border-violet-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-violet-200 flex items-center justify-center text-violet-700">
                      <Icon icon="mdi:account-group" className="text-lg" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-violet-900">Equipo Asignado al Proyecto</p>
                      <p className="text-xs text-violet-700">El modelo usará los roles de este equipo para generar los módulos.</p>
                    </div>
                  </div>

                  {budget?.teamMembers?.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {budget.teamMembers.map(member => (
                        <div key={member.id} className="bg-white border border-violet-200 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm">
                          <div className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-[10px] font-bold">
                            {member.collaborator?.name?.charAt(0) || 'U'}
                          </div>
                          <span className="text-xs font-bold text-secondary-800">{member.collaborator?.name}</span>
                          <span className="text-[10px] font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                            {member.projectRole || 'Sin Rol'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-secondary-500 italic p-2 bg-white/50 rounded-lg border border-dashed border-violet-200">
                      No se han asignado miembros a este proyecto.
                    </div>
                  )}
                </div>


                <div>
                  <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wider mb-2">
                    Descripción del Proyecto
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    rows={4}
                    placeholder={
                      'Ej: "Aplicativo web tipo e-commerce para venta de ropa con carrito y pagos"\n' +
                      '    "App móvil de delivery para iOS y Android"\n' +
                      '    "Plataforma SaaS de gestión de inventarios"'
                    }
                    className="input-base resize-none text-sm leading-relaxed"
                  />
                  <p className="text-xs text-secondary-400 mt-1.5">
                    Tipos detectables: <span className="font-semibold text-secondary-600">web · e-commerce · app móvil · saas · api · e-learning · reservas</span>
                  </p>
                </div>

                {/* Result preview */}
                {aiResult && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:check-circle" className="text-green-600 text-xl" />
                      <span className="font-bold text-green-800 text-sm">¡Presupuesto generado con éxito!</span>
                    </div>

                    {/* Row 1: Tipo, Módulos */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white rounded-lg p-3 border border-green-100">
                        <p className="text-secondary-400 uppercase font-bold tracking-wide mb-1">Tipo Detectado</p>
                        <p className="font-bold text-secondary-900 capitalize text-sm">{aiResult.detectedType}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-green-100">
                        <p className="text-secondary-400 uppercase font-bold tracking-wide mb-1">Módulos Creados</p>
                        <p className="font-bold text-secondary-900 text-sm">{aiResult.totalModules} módulos</p>
                      </div>
                    </div>

                    {/* Row 2: Mercado y Seniority aplicados */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100 flex-1">
                        <p className="text-emerald-500 uppercase font-bold tracking-wide mb-1 text-[10px]">Alcance</p>
                        <p className="font-bold text-emerald-800 text-xs">{aiResult.scopeLabel}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 flex-1">
                        <p className="text-blue-400 uppercase font-bold tracking-wide mb-1 text-[10px]">Mercado</p>
                        <p className="font-bold text-blue-800 text-xs">{aiResult.marketLabel}</p>
                      </div>
                    </div>

                    {/* Row 3: Team Breakdown */}
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      <div className="bg-amber-50 rounded p-1.5 border border-amber-100 text-center">
                        <p className="text-amber-500 font-bold text-[9px] uppercase">UI/UX</p>
                        <p className="font-bold text-amber-800 text-[11px] capitalize">{aiResult.team?.ui || 'N/A'}</p>
                      </div>
                      <div className="bg-orange-50 rounded p-1.5 border border-orange-100 text-center">
                        <p className="text-orange-500 font-bold text-[9px] uppercase">Front</p>
                        <p className="font-bold text-orange-800 text-[11px] capitalize">{aiResult.team?.front || 'N/A'}</p>
                      </div>
                      <div className="bg-indigo-50 rounded p-1.5 border border-indigo-100 text-center">
                        <p className="text-indigo-500 font-bold text-[9px] uppercase">Back</p>
                        <p className="font-bold text-indigo-800 text-[11px] capitalize">{aiResult.team?.back || 'N/A'}</p>
                      </div>
                      <div className="bg-cyan-50 rounded p-1.5 border border-cyan-100 text-center">
                        <p className="text-cyan-500 font-bold text-[9px] uppercase">BD</p>
                        <p className="font-bold text-cyan-800 text-[11px] capitalize">{aiResult.team?.db || 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50 rounded p-1.5 border border-slate-200 text-center">
                        <p className="text-slate-500 font-bold text-[9px] uppercase">Infra</p>
                        <p className="font-bold text-slate-800 text-[11px] capitalize">{aiResult.team?.infra || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Row 3: Ajustes financieros */}
                    {aiResult.financialAdjustments && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-violet-50 rounded-lg p-3 border border-violet-100">
                          <p className="text-violet-400 uppercase font-bold tracking-wide mb-1">Contingencia</p>
                          <p className="font-bold text-violet-800 text-sm">{aiResult.financialAdjustments.contingency}%</p>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                          <p className="text-indigo-400 uppercase font-bold tracking-wide mb-1">Margen Comercial</p>
                          <p className="font-bold text-indigo-800 text-sm">{aiResult.financialAdjustments.margin}%</p>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-green-700">Costos, módulos y ajustes financieros aplicados en el presupuesto.</p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setAiModal(false)}
                    className="btn-secondary flex-1"
                  >
                    {aiResult ? 'Cerrar' : 'Cancelar'}
                  </button>
                  {!aiResult && (
                    <button
                      onClick={handleAIGenerate}
                      disabled={aiLoading || !aiPrompt.trim()}
                      className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {aiLoading ? (
                        <><Icon icon="mdi:loading" className="animate-spin text-lg" /> Procesando...</>
                      ) : (
                        <><Icon icon="mdi:brain" /> Generar Módulos</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOAST NOTIFICATION ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold ${toast.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-gray-900 text-white'
              }`}
          >
            <Icon icon={toast.type === 'error' ? 'mdi:alert-circle' : 'mdi:check-circle'} className="text-xl flex-shrink-0" />
            <span>{toast.msg}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
              <Icon icon="mdi:close" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



