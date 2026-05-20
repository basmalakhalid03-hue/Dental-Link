import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { crownTypeAPI } from '../services/api';
import PageTransition from '../components/PageTransition';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, ChevronUp, ChevronDown,
  X, Save, Eye, EyeOff, AlertTriangle, Loader2, Crown,
} from 'lucide-react';

function TypeModal({ type, onClose, onSaved }) {
  const isEdit = !!type;
  const [form, setForm]   = useState({ name: type?.name ?? '', nameAr: type?.nameAr ?? '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await crownTypeAPI.update(type.id, form);
        toast.success('Crown type updated');
      } else {
        await crownTypeAPI.create(form);
        toast.success('Crown type added');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const fieldCls = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-900">
            {isEdit ? 'Edit Crown Type' : 'Add Crown Type'}
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
              type="text" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Zirconia"
              className={fieldCls} autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Name (AR)</label>
            <input
              type="text" value={form.nameAr}
              onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
              placeholder="مثال: زركونيا"
              className={`${fieldCls} text-right`} dir="rtl"
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
              {isEdit ? 'Save Changes' : 'Add'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function DeleteConfirm({ type, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const handle = async () => {
    setDeleting(true);
    try {
      await crownTypeAPI.delete(type.id);
      toast.success('Deleted');
      onDeleted();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete');
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
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
            <AlertTriangle size={18} className="text-rose-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Delete Crown Type</p>
            <p className="text-xs text-slate-500 mt-0.5">Existing cases will keep their stored value.</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-5">
          Delete <span className="font-semibold">"{type.name}"</span>?
          {type.usedInCases > 0 && (
            <span className="block mt-1 text-amber-600 text-xs font-medium">
              Used in {type.usedInCases} case(s) — existing cases won't be affected.
            </span>
          )}
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button onClick={handle} disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-all">
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function CrownTypes() {
  const [types,  setTypes]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,  setModal]  = useState(null);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crownTypeAPI.getAll(true);
      setTypes(res.data);
    } catch {
      toast.error('Failed to load crown types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  const sorted = [...types].sort((a, b) => a.order - b.order);

  const move = async (type, direction) => {
    const idx     = sorted.findIndex((t) => t.id === type.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const swapWith  = sorted[swapIdx];
    const reordered = [
      { id: type.id,     order: swapWith.order },
      { id: swapWith.id, order: type.order },
    ];

    setTypes((prev) =>
      prev.map((t) => {
        const found = reordered.find((r) => r.id === t.id);
        return found ? { ...t, order: found.order } : t;
      })
    );

    try {
      await crownTypeAPI.reorder(reordered);
    } catch {
      toast.error('Reorder failed');
      fetchTypes();
    }
  };

  const toggleActive = async (type) => {
    try {
      await crownTypeAPI.update(type.id, { isActive: !type.isActive });
      setTypes((prev) => prev.map((t) => t.id === type.id ? { ...t, isActive: !t.isActive } : t));
      toast.success(type.isActive ? 'Deactivated' : 'Activated');
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Crown size={22} className="text-amber-500" /> Crown Types
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Manage the list of crown restoration types available when creating cases.
              </p>
            </div>
            <button
              onClick={() => setModal({ mode: 'add' })}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-blue-200"
            >
              <Plus size={15} /> Add Type
            </button>
          </div>
        </motion.div>

        {/* List */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">No crown types yet. Add one above.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {sorted.map((type, idx) => (
                <motion.li
                  key={type.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`flex items-center gap-4 px-5 py-3.5 ${!type.isActive ? 'opacity-50' : ''}`}
                >
                  {/* Order badge */}
                  <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                    {idx + 1}
                  </span>

                  {/* Names */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{type.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {type.nameAr && (
                        <p className="text-xs text-slate-400 truncate" dir="rtl">{type.nameAr}</p>
                      )}
                      {type.usedInCases > 0 && (
                        <span className="text-xs text-slate-400">· {type.usedInCases} case(s)</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => move(type, 'up')} disabled={idx === 0}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-20 transition-all">
                      <ChevronUp size={15} />
                    </button>
                    <button onClick={() => move(type, 'down')} disabled={idx === sorted.length - 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-20 transition-all">
                      <ChevronDown size={15} />
                    </button>

                    <button onClick={() => toggleActive(type)}
                      className={`p-1.5 rounded-lg transition-all ${
                        type.isActive
                          ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          : 'text-amber-500 hover:text-amber-700 hover:bg-amber-50'
                      }`}
                      title={type.isActive ? 'Deactivate' : 'Activate'}>
                      {type.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>

                    <button onClick={() => setModal({ mode: 'edit', type })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                      <Pencil size={15} />
                    </button>

                    <button onClick={() => setModal({ mode: 'delete', type })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>

        <p className="text-xs text-slate-400 mt-3 text-center">
          Inactive types are hidden when creating new cases. Deleting a type won't affect existing cases.
        </p>
      </div>

      <AnimatePresence>
        {modal?.mode === 'add'    && <TypeModal onClose={() => setModal(null)} onSaved={fetchTypes} />}
        {modal?.mode === 'edit'   && <TypeModal type={modal.type} onClose={() => setModal(null)} onSaved={fetchTypes} />}
        {modal?.mode === 'delete' && <DeleteConfirm type={modal.type} onClose={() => setModal(null)} onDeleted={fetchTypes} />}
      </AnimatePresence>
    </PageTransition>
  );
}
