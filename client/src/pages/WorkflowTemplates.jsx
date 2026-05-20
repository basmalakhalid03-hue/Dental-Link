import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { workflowAPI } from '../services/api';
import PageTransition from '../components/PageTransition';
import toast from 'react-hot-toast';
import {
  Cpu, Wrench, Plus, Pencil, Trash2, ChevronUp, ChevronDown,
  X, Save, EyeOff, Eye, AlertTriangle, Loader2,
} from 'lucide-react';

const TABS = [
  { type: 'DIGITAL',     label: 'Digital',     labelAr: 'رقمي',      icon: Cpu,    color: 'violet' },
  { type: 'TRADITIONAL', label: 'Traditional',  labelAr: 'تقليدي',    icon: Wrench, color: 'amber' },
];

const COLOR = {
  violet: { tab: 'bg-violet-600 text-white', badge: 'bg-violet-100 text-violet-700', ring: 'ring-violet-500' },
  amber:  { tab: 'bg-amber-500 text-white',  badge: 'bg-amber-100 text-amber-700',   ring: 'ring-amber-500' },
};

function StepModal({ step, type, onClose, onSaved }) {
  const isEdit = !!step;
  const [form, setForm] = useState({
    name:        step?.name        ?? '',
    nameAr:      step?.nameAr      ?? '',
    description: step?.description ?? '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await workflowAPI.updateStep(step.id, form);
        toast.success('Step updated');
      } else {
        await workflowAPI.createStep({ ...form, type });
        toast.success('Step added');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save step');
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-900">
            {isEdit ? 'Edit Step' : 'Add New Step'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Name (EN) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. CAD Design" className={fieldClass} autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Name (AR)
            </label>
            <input
              type="text" value={form.nameAr} onChange={(e) => set('nameAr', e.target.value)}
              placeholder="مثال: تصميم CAD" className={`${fieldClass} text-right`} dir="rtl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
            <textarea
              value={form.description} onChange={(e) => set('description', e.target.value)}
              placeholder="Optional description of this step..."
              rows={3}
              className={`${fieldClass} resize-none`}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-all">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {isEdit ? 'Save Changes' : 'Add Step'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function DeleteConfirm({ step, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await workflowAPI.deleteStep(step.id);
      toast.success('Step deleted');
      onDeleted();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete step');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-rose-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Delete Step</p>
            <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-5">
          Delete <span className="font-semibold text-slate-800">"{step.name}"</span>?
          {step._count?.caseSteps > 0 && (
            <span className="block mt-1 text-rose-600 text-xs font-medium">
              Used in {step._count.caseSteps} case(s) — cannot delete, deactivate instead.
            </span>
          )}
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={deleting || step._count?.caseSteps > 0}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-all">
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function WorkflowTemplates() {
  const [activeTab, setActiveTab] = useState('DIGITAL');
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit'|'delete', step?: {} }

  const fetchSteps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workflowAPI.getSteps(undefined, true); // includeInactive=true for admin
      setSteps(res.data);
    } catch {
      toast.error('Failed to load steps');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSteps(); }, [fetchSteps]);

  const visibleSteps = steps
    .filter((s) => s.type === activeTab)
    .sort((a, b) => a.order - b.order);

  const move = async (step, direction) => {
    const list = visibleSteps;
    const idx = list.findIndex((s) => s.id === step.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return;

    const swapWith = list[swapIdx];
    const reordered = [
      { id: step.id,     order: swapWith.order },
      { id: swapWith.id, order: step.order },
    ];

    // Optimistic update
    setSteps((prev) =>
      prev.map((s) => {
        const found = reordered.find((r) => r.id === s.id);
        return found ? { ...s, order: found.order } : s;
      })
    );

    try {
      await workflowAPI.reorderSteps(reordered);
    } catch {
      toast.error('Reorder failed');
      fetchSteps(); // rollback
    }
  };

  const toggleActive = async (step) => {
    try {
      await workflowAPI.updateStep(step.id, { isActive: !step.isActive });
      setSteps((prev) => prev.map((s) => s.id === step.id ? { ...s, isActive: !s.isActive } : s));
      toast.success(step.isActive ? 'Step deactivated' : 'Step activated');
    } catch {
      toast.error('Failed to update step');
    }
  };

  const tab = TABS.find((t) => t.type === activeTab);
  const c = COLOR[tab.color];

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Workflow Templates</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage the step catalog for Digital and Traditional workflows.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {TABS.map(({ type, label, labelAr, icon: Icon, color }) => {
            const sel = activeTab === type;
            return (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                  sel
                    ? `${COLOR[color].tab} border-transparent shadow-sm`
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Icon size={15} />
                {label}
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${sel ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {steps.filter((s) => s.type === type).length}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => setModal({ mode: 'add' })}
            className="ms-auto flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-blue-200"
          >
            <Plus size={15} />
            Add Step
          </button>
        </div>

        {/* Steps list */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
          ) : visibleSteps.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">No steps yet. Add one above.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {visibleSteps.map((step, idx) => (
                <motion.li
                  key={step.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`flex items-center gap-4 px-5 py-3.5 ${!step.isActive ? 'opacity-50' : ''}`}
                >
                  {/* Order badge */}
                  <span className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold ${c.badge}`}>
                    {step.order}
                  </span>

                  {/* Names */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{step.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {step.nameAr && (
                        <p className="text-xs text-slate-400 truncate" dir="rtl">{step.nameAr}</p>
                      )}
                      {step._count?.caseSteps > 0 && (
                        <span className="text-xs text-slate-400">· used in {step._count.caseSteps} case(s)</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Reorder */}
                    <button
                      onClick={() => move(step, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-20 transition-all"
                      title="Move up"
                    >
                      <ChevronUp size={15} />
                    </button>
                    <button
                      onClick={() => move(step, 'down')}
                      disabled={idx === visibleSteps.length - 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-20 transition-all"
                      title="Move down"
                    >
                      <ChevronDown size={15} />
                    </button>

                    {/* Toggle active */}
                    <button
                      onClick={() => toggleActive(step)}
                      className={`p-1.5 rounded-lg transition-all ${
                        step.isActive
                          ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          : 'text-amber-500 hover:text-amber-700 hover:bg-amber-50'
                      }`}
                      title={step.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {step.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => setModal({ mode: 'edit', step })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setModal({ mode: 'delete', step })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>

        <p className="text-xs text-slate-400 mt-3 text-center">
          Inactive steps are hidden when creating new cases. Steps in use cannot be deleted — deactivate instead.
        </p>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal?.mode === 'add' && (
          <StepModal
            type={activeTab}
            onClose={() => setModal(null)}
            onSaved={fetchSteps}
          />
        )}
        {modal?.mode === 'edit' && (
          <StepModal
            step={modal.step}
            type={activeTab}
            onClose={() => setModal(null)}
            onSaved={fetchSteps}
          />
        )}
        {modal?.mode === 'delete' && (
          <DeleteConfirm
            step={modal.step}
            onClose={() => setModal(null)}
            onDeleted={fetchSteps}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
