import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { casesAPI, authAPI, workflowAPI, crownTypeAPI } from '../services/api';
import TeethDiagram from '../components/TeethDiagram';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Cpu, Wrench, User, Stethoscope, Crown, Calendar,
  Zap, X, Lock, CheckSquare, Square, ListChecks,
} from 'lucide-react';

const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

const prioritySelected = {
  LOW:    'border-slate-400 bg-slate-100',
  NORMAL: 'border-blue-500 bg-blue-100',
  HIGH:   'border-amber-500 bg-amber-100',
  URGENT: 'border-rose-500 bg-rose-100',
};

const TYPE_COLOR = {
  DIGITAL:     { badge: 'bg-violet-100 text-violet-700', check: 'text-violet-600', num: 'bg-violet-100 text-violet-700' },
  TRADITIONAL: { badge: 'bg-amber-100 text-amber-700',   check: 'text-amber-600',  num: 'bg-amber-100 text-amber-700' },
};

export default function CreateCase() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isDoctor } = useAuth();

  const [loading, setLoading]         = useState(false);
  const [technicians, setTechs]       = useState([]);
  const [doctors, setDoctors]         = useState([]);
  const [crownTypes, setCrownTypes]   = useState([]);
  const [toothNumbers, setToothNumbers] = useState([]);
  const [availableSteps, setAvailableSteps] = useState([]); // steps from API for chosen type
  const [selectedStepIds, setSelectedIds]   = useState([]); // which are checked

  const [form, setForm] = useState({
    patientName: '', doctorName: '', caseType: '',
    crownType: '', technicianId: '', priority: 'NORMAL', dueDate: '',
  });

  useEffect(() => {
    authAPI.getUsers()
      .then((res) => {
        const users = res.data;
        setTechs(users.filter((u) => u.role === 'TECHNICIAN'));
        setDoctors(users.filter((u) => u.role === 'DOCTOR'));
      })
      .catch(console.error);
    crownTypeAPI.getAll(false)
      .then((res) => setCrownTypes(res.data))
      .catch(console.error);
  }, []);

  // Reload steps whenever case type changes
  useEffect(() => {
    if (!form.caseType) { setAvailableSteps([]); setSelectedIds([]); return; }
    workflowAPI.getSteps(form.caseType, false)
      .then((res) => {
        const steps = res.data;
        setAvailableSteps(steps);
        setSelectedIds(steps.map((s) => s.id)); // all checked by default
      })
      .catch(() => toast.error('Failed to load workflow steps'));
  }, [form.caseType]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const toggleStep = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll   = () => setSelectedIds(availableSteps.map((s) => s.id));
  const clearAll    = () => setSelectedIds([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const effectiveDoctorName = isDoctor ? user?.name : form.doctorName;
    if (!form.patientName || !effectiveDoctorName || !form.caseType || !form.crownType) {
      toast.error('Please fill all required fields');
      return;
    }
    if (selectedStepIds.length === 0) {
      toast.error('Select at least one workflow step');
      return;
    }
    setLoading(true);
    try {
      const res = await casesAPI.create({
        ...form,
        doctorName:      effectiveDoctorName,
        toothNumbers:    toothNumbers.length > 0 ? toothNumbers : undefined,
        technicianId:    form.technicianId || undefined,
        dueDate:         form.dueDate || undefined,
        selectedStepIds,
      });
      toast.success('Case created!');
      navigate(`/cases/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white';
  const tc = form.caseType ? TYPE_COLOR[form.caseType] : null;

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4">
            <ArrowLeft size={15} /> {t('createCase.back')}
          </button>
          <h1 className="text-2xl font-bold text-slate-900">{t('createCase.title')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('createCase.subtitle')}</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Patient info */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
            className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
          >
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{t('createCase.patientInfo')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t('createCase.patientName')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={form.patientName}
                    onChange={(e) => set('patientName', e.target.value)}
                    placeholder={t('createCase.patientNamePlaceholder')} required
                    className={`${fieldClass} ps-9`} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t('createCase.doctorName')} <span className="text-rose-500">*</span>
                </label>
                {isDoctor ? (
                  <div className="relative">
                    <Stethoscope size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Lock size={13} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      type="text" readOnly value={user?.name ?? ''}
                      className={`${fieldClass} ps-9 pe-8 bg-slate-50 text-slate-500 cursor-not-allowed`}
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <Stethoscope size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={form.doctorName}
                      onChange={(e) => set('doctorName', e.target.value)}
                      required
                      className={`${fieldClass} ps-9 appearance-none`}
                    >
                      <option value="">{t('createCase.selectDoctor', 'Select doctor...')}</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Workflow type */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
          >
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              {t('createCase.workflowType')} <span className="text-rose-500">*</span>
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { type: 'DIGITAL',     icon: Cpu,    color: 'violet', descKey: 'digitalDesc' },
                { type: 'TRADITIONAL', icon: Wrench,  color: 'amber',  descKey: 'traditionalDesc' },
              ].map(({ type, icon: Icon, color, descKey }) => {
                const sel = form.caseType === type;
                const stepCount = steps => steps.filter(s => s.type === type).length;
                const colors = {
                  violet: { btn: sel ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-slate-200 hover:border-violet-300 text-slate-700', badge: sel ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-600' },
                  amber:  { btn: sel ? 'bg-amber-500 border-amber-500 text-white'   : 'bg-white border-slate-200 hover:border-amber-300 text-slate-700',  badge: sel ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-600' },
                };
                const c = colors[color];
                return (
                  <motion.button
                    key={type} type="button"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => set('caseType', type)}
                    className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 ${c.btn}`}
                  >
                    <Icon size={28} />
                    <div className="text-center">
                      <p className="font-bold text-sm">{t(`createCase.${type.toLowerCase()}`)}</p>
                      <p className={`text-xs mt-0.5 ${sel ? 'opacity-80' : 'text-slate-400'}`}>
                        {t(`createCase.${descKey}`)}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Step selection */}
            <AnimatePresence>
              {form.caseType && availableSteps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-5 overflow-hidden"
                >
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ListChecks size={14} className="text-slate-500" />
                        <p className="text-xs font-semibold text-slate-600">Select Steps</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tc?.badge}`}>
                          {selectedStepIds.length} / {availableSteps.length}
                        </span>
                        <button type="button" onClick={selectAll}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium">All</button>
                        <span className="text-slate-300">|</span>
                        <button type="button" onClick={clearAll}
                          className="text-xs text-slate-500 hover:text-slate-700 font-medium">None</button>
                      </div>
                    </div>

                    {/* Step checkboxes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {availableSteps.map((step, i) => {
                        const checked = selectedStepIds.includes(step.id);
                        return (
                          <motion.button
                            key={step.id}
                            type="button"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.02 }}
                            onClick={() => toggleStep(step.id)}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all duration-150 ${
                              checked
                                ? 'bg-white border-slate-300 shadow-sm'
                                : 'bg-slate-100 border-transparent opacity-50'
                            }`}
                          >
                            {checked
                              ? <CheckSquare size={15} className={tc?.check} />
                              : <Square size={15} className="text-slate-400" />
                            }
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-4 h-4 flex items-center justify-center rounded-full text-slate-500 font-bold flex-shrink-0 ${tc?.num}`}
                                  style={{ fontSize: 9 }}>
                                  {i + 1}
                                </span>
                                <span className="text-xs font-medium text-slate-700 truncate">{step.name}</span>
                              </div>
                              {step.nameAr && (
                                <p className="text-xs text-slate-400 mt-0.5 truncate text-right" dir="rtl">
                                  {step.nameAr}
                                </p>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    {selectedStepIds.length === 0 && (
                      <p className="text-xs text-rose-500 font-medium mt-2 text-center">
                        Select at least one step to continue.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Tooth selection */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
            className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('createCase.toothSelection')}</h2>
              {toothNumbers.length > 0 && (
                <motion.button
                  type="button"
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  onClick={() => setToothNumbers([])}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={12} /> {t('createCase.clearTooth')}
                </motion.button>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-3">{t('createCase.toothHint')}</p>

            <AnimatePresence>
              {toothNumbers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="mb-3 flex flex-wrap items-center gap-2"
                >
                  <span className="text-sm">🦷</span>
                  {[...toothNumbers].sort((a, b) => a - b).map((num) => (
                    <motion.button
                      key={num}
                      type="button"
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      onClick={() => setToothNumbers((prev) => prev.filter((n) => n !== num))}
                      className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-colors"
                    >
                      #{num} <X size={10} />
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <TeethDiagram selectedTeeth={toothNumbers} onSelectTooth={setToothNumbers} compact />
          </motion.div>

          {/* Case details */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
          >
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{t('createCase.caseDetails')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t('createCase.crownType')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Crown size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select value={form.crownType} onChange={(e) => set('crownType', e.target.value)} required
                    className={`${fieldClass} ps-9 appearance-none`}>
                    <option value="">{t('createCase.selectCrownType')}</option>
                    {crownTypes.map((ct) => (
                      <option key={ct.id} value={ct.name}>{ct.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('createCase.assignTechnician')}</label>
                <div className="relative">
                  <User size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select value={form.technicianId} onChange={(e) => set('technicianId', e.target.value)}
                    className={`${fieldClass} ps-9 appearance-none`}>
                    <option value="">{t('createCase.unassigned')}</option>
                    {technicians.map((tc) => <option key={tc.id} value={tc.id}>{tc.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('createCase.priority')}</label>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => {
                    const sel = form.priority === p;
                    return (
                      <motion.button
                        key={p} type="button"
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={() => set('priority', p)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-xl border-2 transition-all ${
                          sel ? prioritySelected[p] : 'border-slate-200 text-slate-400 bg-white hover:border-slate-300'
                        }`}
                      >
                        {t(`priority.${p}`, p)}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('createCase.dueDate')}</label>
                <div className="relative">
                  <Calendar size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="date" value={form.dueDate}
                    onChange={(e) => set('dueDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`${fieldClass} ps-9`} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
            className="flex gap-3"
          >
            <motion.button
              type="button" whileTap={{ scale: 0.97 }}
              onClick={() => navigate(-1)}
              className="flex-1 py-3 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all"
            >
              {t('createCase.cancel')}
            </motion.button>
            <motion.button
              type="submit"
              disabled={loading || selectedStepIds.length === 0}
              whileHover={{ scale: (loading || selectedStepIds.length === 0) ? 1 : 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-3 rounded-xl transition-all shadow-sm shadow-blue-200"
            >
              {loading
                ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                : <Zap size={16} />}
              {loading ? t('createCase.creating') : t('createCase.createBtn')}
            </motion.button>
          </motion.div>
        </form>
      </div>
    </PageTransition>
  );
}
