import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { casesAPI } from '../services/api';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import PageTransition, { stagger } from '../components/PageTransition';
import { Search, Plus, Cpu, Wrench, Calendar, User, ChevronRight, AlertTriangle, Clock, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format } from '../utils/format';
import toast from 'react-hot-toast';

const STATUSES = ['', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'];
const TYPES    = ['', 'DIGITAL', 'TRADITIONAL'];

const DueDateBadge = ({ dueDate }) => {
  if (!dueDate) return null;
  const severity = format.daysLeftSeverity(dueDate);
  const label    = format.daysLeftLabel(dueDate);

  const styles = {
    overdue: 'text-rose-600 font-semibold',
    today:   'text-orange-600 font-semibold',
    soon:    'text-amber-600',
    ok:      'text-slate-500',
    none:    'text-slate-400',
  };

  return (
    <div className={`flex items-center gap-1.5 text-xs ${styles[severity]}`}>
      {severity === 'overdue' ? (
        <AlertTriangle size={11} className="text-rose-500 flex-shrink-0" />
      ) : (
        <Calendar size={11} className="flex-shrink-0" />
      )}
      <span>{label}</span>
    </div>
  );
};

export default function Cases() {
  const [cases, setCases]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatus]       = useState('');
  const [typeFilter, setType]           = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading]     = useState(false);
  const { t } = useTranslation();
  const { canDo } = useAuth();

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    try {
      await casesAPI.delete(id);
      setCases((prev) => prev.filter((c) => c.id !== id));
      setConfirmDeleteId(null);
      toast.success(t('case.deleteCase') + ' ✓');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete case');
    } finally {
      setDeleteLoading(false);
    }
  };

  const fetchCases = () => {
    setLoading(true);
    casesAPI
      .getAll({ search: search || undefined, status: statusFilter || undefined, caseType: typeFilter || undefined })
      .then((res) => setCases(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(fetchCases, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, typeFilter]);

  const getProgress = (c) => {
    if (!c.caseSteps?.length) return 0;
    return Math.round((c.caseSteps.filter((s) => s.status === 'COMPLETED').length / c.caseSteps.length) * 100);
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('cases.title')}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {t('cases.casesFound_other', { count: cases.length })}
            </p>
          </div>
          {canDo.createCase && (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/cases/new"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-200"
              >
                <Plus size={16} /> {t('cases.newCase')}
              </Link>
            </motion.div>
          )}
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-slate-100 p-4"
        >
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-44">
              <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('cases.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full ps-9 pe-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-slate-50"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 text-slate-700"
            >
              <option value="">{t('cases.allStatuses')}</option>
              {STATUSES.slice(1).map((s) => (
                <option key={s} value={s}>{t(`status.${s}`, s.replace('_', ' '))}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setType(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 text-slate-700"
            >
              <option value="">{t('cases.allTypes')}</option>
              {TYPES.slice(1).map((tp) => (
                <option key={tp} value={tp}>{t(`createCase.${tp.toLowerCase()}`, tp)}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-3 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full" />
              </motion.div>
            ))}
          </div>
        ) : cases.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 py-20"
          >
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Search size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-700 font-semibold mb-1">{t('cases.noCasesFound')}</p>
            <p className="text-slate-400 text-sm mb-5">{t('cases.adjustFilters')}</p>
            <Link
              to="/cases/new"
              className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all"
            >
              <Plus size={15} /> {t('cases.createFirstCase')}
            </Link>
          </motion.div>
        ) : (
          <motion.div
            variants={stagger.container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {cases.map((c) => {
                const progress    = getProgress(c);
                const isDelayed   = c.status === 'DELAYED';
                const isDigital   = c.caseType === 'DIGITAL';
                const severity    = format.daysLeftSeverity(c.dueDate);
                const borderClass = isDelayed || severity === 'overdue'
                  ? 'border-rose-200'
                  : severity === 'today' || severity === 'soon'
                  ? 'border-amber-200'
                  : 'border-slate-100';

                return (
                  <motion.div
                    key={c.id}
                    variants={stagger.item}
                    layout
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Link
                      to={`/cases/${c.id}`}
                      className={`block bg-white rounded-2xl border transition-all duration-200 p-5 ${borderClass}`}
                    >
                      {/* Top */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isDigital ? 'bg-violet-100 text-violet-600' : 'bg-amber-100 text-amber-600'
                          }`}>
                            {isDigital ? <Cpu size={18} /> : <Wrench size={18} />}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-400">{t('cases.caseNumber')}{c.id}</p>
                            <p className="text-sm font-bold text-slate-800 truncate max-w-[140px]">{c.patientName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={c.status} />
                          {canDo.deleteCase && (
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDeleteId(c.id); }}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title={t('case.deleteCase')}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Info rows */}
                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <User size={11} /><span className="truncate">{c.doctorName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium ${
                            isDigital ? 'bg-violet-50 text-violet-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {isDigital ? <Cpu size={10} /> : <Wrench size={10} />}
                            {c.caseType}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-500 truncate">{c.crownType}</span>
                        </div>
                        {c.technician && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-bold" style={{ fontSize: 8 }}>
                                {c.technician.name.charAt(0)}
                              </span>
                            </div>
                            <span className="truncate">{c.technician.name}</span>
                          </div>
                        )}
                        {(() => {
                          const teeth = c.toothNumbers
                            ? (() => { try { return JSON.parse(c.toothNumbers); } catch { return []; } })()
                            : c.toothNumber ? [c.toothNumber] : [];
                          return teeth.length > 0 ? (
                            <div className="flex items-center gap-1 text-xs text-slate-500 flex-wrap">
                              <span className="text-base">🦷</span>
                              {teeth.sort((a, b) => a - b).map((n) => (
                                <span key={n} className="font-medium">#{n}</span>
                              ))}
                            </div>
                          ) : null;
                        })()}
                        {/* Due date with remaining-days indicator */}
                        {c.dueDate && (
                          <DueDateBadge dueDate={c.dueDate} />
                        )}
                      </div>

                      {/* Progress */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs text-slate-400">{t('cases.progress')}</span>
                          <span className="text-xs font-semibold text-slate-600">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            className={`h-1.5 rounded-full ${
                              c.status === 'COMPLETED' ? 'bg-emerald-500' :
                              c.status === 'DELAYED'   ? 'bg-rose-500'   : 'bg-blue-500'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-slate-400">
                            {c.caseSteps?.filter((s) => s.status === 'COMPLETED').length ?? 0}
                            {' '}{t('common.of')}{' '}
                            {c.caseSteps?.length ?? 0} {t('cases.steps')}
                          </span>
                          <PriorityBadge priority={c.priority} />
                        </div>
                      </div>

                      <div className="flex justify-end mt-3 -mb-1">
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => !deleteLoading && setConfirmDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-4">
                <Trash2 size={20} className="text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('case.confirmDeleteTitle')}</h3>
              <p className="text-sm text-slate-500 mb-6">{t('case.confirmDeleteMsg')}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
                >
                  {t('case.cancel')}
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {deleteLoading && <Loader2 size={14} className="animate-spin" />}
                  {t('case.confirmDeleteBtn')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
