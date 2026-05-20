import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { casesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import PageTransition, { stagger, fadeUp } from '../components/PageTransition';
import {
  LayoutDashboard, CheckCircle2, Clock, AlertTriangle,
  Users, ArrowRight, Cpu, Wrench, ChevronRight, TrendingUp, CalendarX,
} from 'lucide-react';
import { format } from '../utils/format';

const StatCard = ({ title, value, icon: Icon, color, sub, delay = 0 }) => {
  const bg      = { blue: 'border-blue-100', emerald: 'border-emerald-100', amber: 'border-amber-100', rose: 'border-rose-100', orange: 'border-orange-100' };
  const iconBg  = { blue: 'bg-blue-100 text-blue-600', emerald: 'bg-emerald-100 text-emerald-600', amber: 'bg-amber-100 text-amber-600', rose: 'bg-rose-100 text-rose-600', orange: 'bg-orange-100 text-orange-600' };
  const numClr  = { blue: 'text-blue-600', emerald: 'text-emerald-600', amber: 'text-amber-600', rose: 'text-rose-600', orange: 'text-orange-600' };

  return (
    <motion.div
      variants={stagger.item}
      whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
      className={`bg-white rounded-2xl border p-5 transition-shadow ${bg[color]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{title}</p>
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.2, type: 'spring', stiffness: 200 }}
            className={`text-3xl font-bold ${numClr[color]}`}
          >
            {value}
          </motion.p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </motion.div>
  );
};

const ProgressBar = ({ value, color = 'blue' }) => {
  const colors = { blue: 'bg-blue-500', emerald: 'bg-emerald-500', amber: 'bg-amber-400', white: 'bg-white' };
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
      <motion.div
        className={`h-1.5 rounded-full ${colors[color]}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
      />
    </div>
  );
};

// ── Technician performance row ────────────────────────────────────────────────
const TechRow = ({ tech, maxCount, index }) => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.35 + index * 0.07 }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">{tech.technicianName.charAt(0)}</span>
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-700 truncate block max-w-[110px]">
              {tech.technicianName}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{tech.count} {t('dashboard.total')}</span>
              {tech.completedCount > 0 && (
                <>
                  <span className="text-slate-200">·</span>
                  <span className="text-xs text-emerald-600 font-medium">{tech.completedCount} ✓</span>
                </>
              )}
              {tech.avgDays !== null && (
                <>
                  <span className="text-slate-200">·</span>
                  <span className="text-xs text-slate-400">{tech.avgDays}d avg</span>
                </>
              )}
            </div>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-600 flex-shrink-0">{tech.count}</span>
      </div>
      <ProgressBar value={(tech.count / maxCount) * 100} color={tech.completedCount >= tech.count / 2 ? 'emerald' : 'blue'} />
    </motion.div>
  );
};

export default function Dashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, isDeliveryAgent, isDoctor, canDo } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Delivery agents have a dedicated page
  if (isDeliveryAgent) return <Navigate to="/delivery" replace />;

  useEffect(() => {
    casesAPI.getDashboard()
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
            className="w-10 h-10 border-2 border-blue-200 border-t-blue-600 rounded-full"
          />
          <p className="text-sm text-slate-500">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  const maxTechCount = Math.max(...(stats?.casesByTechnician?.map((t) => t.count) || [1]), 1);

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('dashboard.title')}</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {t('dashboard.welcome')} <span className="font-semibold text-slate-700">{user?.name}</span>
            </p>
          </div>
          {canDo.createCase && (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/cases/new"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-200"
              >
                {t('dashboard.newCase')}
              </Link>
            </motion.div>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard title={t('dashboard.totalCases')}  value={stats?.total ?? 0}      icon={LayoutDashboard} color="blue"    sub={t('dashboard.allTime')} delay={0} />
          <StatCard title={t('dashboard.completed')}   value={stats?.completed ?? 0}  icon={CheckCircle2}    color="emerald" sub={`${stats?.completionRate ?? 0}% ${t('dashboard.completionRate_label')}`} delay={0.07} />
          <StatCard title={t('dashboard.inProgress')}  value={stats?.inProgress ?? 0} icon={Clock}           color="amber"   sub={t('dashboard.activeNow')} delay={0.14} />
          <StatCard title={t('dashboard.delayed')}     value={stats?.delayed ?? 0}    icon={AlertTriangle}   color="rose"    sub={t('dashboard.needsAttention')} delay={0.21} />
        </motion.div>

        {/* Overdue alert */}
        {(stats?.overdue ?? 0) > 0 && (
          <motion.div
            variants={fadeUp} initial="hidden" animate="show"
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-5 py-3"
          >
            <CalendarX size={18} className="text-rose-500 flex-shrink-0" />
            <div>
              <span className="text-sm font-semibold text-rose-800">
                {stats.overdue} {t('dashboard.overdueAlert')}
              </span>
              <span className="text-xs text-rose-500 ms-2">{t('dashboard.overdueSubtext')}</span>
            </div>
            <Link to="/cases?status=IN_PROGRESS" className="ms-auto text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1">
              {t('dashboard.viewAll')} <ChevronRight size={12} className={isRTL ? 'rotate-180' : ''} />
            </Link>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Cases */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show"
            transition={{ delay: 0.15 }}
            className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">{t('dashboard.recentCases')}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{t('dashboard.latest5')}</p>
              </div>
              <Link to="/cases" className="text-sm text-blue-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                {t('dashboard.viewAll')}
                <ChevronRight size={14} className={isRTL ? 'rotate-180' : ''} />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {(!stats?.recentCases?.length) && (
                <div className="px-6 py-12 text-center text-slate-400 text-sm">{t('dashboard.noCasesYet')}</div>
              )}
              {stats?.recentCases?.map((c, idx) => {
                const isDigital = c.caseType === 'DIGITAL';
                const severity  = format.daysLeftSeverity(c.dueDate);
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.06 }}
                  >
                    <Link
                      to={`/cases/${c.id}`}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-sm">
                        #{c.id}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{c.patientName}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={`flex items-center gap-1 text-xs ${isDigital ? 'text-violet-600' : 'text-amber-600'}`}>
                            {isDigital ? <Cpu size={10} /> : <Wrench size={10} />}
                            {c.caseType}
                          </span>
                          {c.dueDate && severity !== 'ok' && severity !== 'none' && (
                            <span className={`text-xs font-medium ${
                              severity === 'overdue' ? 'text-rose-600' :
                              severity === 'today'   ? 'text-orange-500' : 'text-amber-500'
                            }`}>
                              {format.daysLeftLabel(c.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={c.status} />
                        <ArrowRight size={14} className={`text-slate-300 group-hover:text-blue-500 transition-colors ${isRTL ? 'rotate-180' : ''}`} />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Completion ring */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="show"
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white"
            >
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide mb-1">
                {t('dashboard.completionRate')}
              </p>
              <motion.p
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 150 }}
                className="text-4xl font-bold mb-1"
              >
                {stats?.completionRate ?? 0}%
              </motion.p>
              <p className="text-blue-200 text-sm mb-4">{t('dashboard.ofAllCompleted')}</p>
              <div className="w-full bg-blue-500/40 rounded-full h-2">
                <motion.div
                  className="bg-white h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats?.completionRate ?? 0}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-blue-200">
                <span>0%</span><span>100%</span>
              </div>
            </motion.div>

            {/* Technician performance */}
            {stats?.casesByTechnician?.length > 0 && (
              <motion.div
                variants={fadeUp} initial="hidden" animate="show"
                transition={{ delay: 0.28 }}
                className="bg-white rounded-2xl border border-slate-100 p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={16} className="text-blue-500" />
                  <h3 className="text-sm font-bold text-slate-900">{t('dashboard.techPerformance')}</h3>
                </div>
                <div className="space-y-4">
                  {stats.casesByTechnician.map((tech, idx) => (
                    <TechRow key={tech.technicianId} tech={tech} maxCount={maxTechCount} index={idx} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Pending */}
            {stats?.pending > 0 && (
              <motion.div
                variants={fadeUp} initial="hidden" animate="show"
                transition={{ delay: 0.33 }}
                className="bg-amber-50 rounded-2xl border border-amber-100 p-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={14} className="text-amber-600" />
                  <p className="text-sm font-semibold text-amber-800">{t('dashboard.pendingCases')}</p>
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-2xl font-bold text-amber-900"
                >
                  {stats.pending}
                </motion.p>
                <p className="text-xs text-amber-600 mt-1">{t('dashboard.awaitingAssignment')}</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
