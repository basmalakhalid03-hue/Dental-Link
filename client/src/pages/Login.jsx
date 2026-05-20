import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, CheckCircle2, ArrowLeft } from 'lucide-react';

const IMAGE_URL =
  'https://images.unsplash.com/photo-1588776814546-1ffbb172d4a3?auto=format&fit=crop&w=1400&q=80';

const PANEL_FEATURES = [
  'Full digital & traditional workflow tracking',
  'FDI dental chart with per-tooth case linking',
  'Real-time technician performance dashboard',
  'Overdue alerts & due-date management',
];

const DEMO_ACCOUNTS = [
  { label: 'Admin',      email: 'admin@dentallink.com', pass: 'admin123', color: 'blue' },
  { label: 'Technician', email: 'ahmed@dentallink.com', pass: 'tech123',  color: 'emerald' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0 },
};

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const { t }       = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 focus:bg-white ' +
    'transition-all placeholder:text-slate-400';

  return (
    <div className="min-h-screen flex overflow-hidden">

      {/* ── LEFT: Form panel ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex-1 flex flex-col bg-white overflow-y-auto"
      >
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-10 max-w-[480px] mx-auto w-full">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-10">
            <Link to="/" className="flex items-center gap-2.5 group">
              <motion.div whileHover={{ scale: 1.08 }} className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-slate-100">
                <img src="/logo.jpeg" alt="DentalLink" className="w-full h-full object-cover" />
              </motion.div>
              <div>
                <p className="font-bold text-slate-900 text-sm leading-tight">DentalLink</p>
                <p className="text-slate-400 text-xs leading-tight">{t('nav.labSystem')}</p>
              </div>
            </Link>
            <LanguageSwitcher />
          </div>

          {/* Back to home */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mb-8 transition-colors w-fit"
          >
            <ArrowLeft size={12} /> Back to home
          </Link>

          {/* Heading */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.45 }}>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1.5">{t('auth.welcome')}</h1>
            <p className="text-slate-500 text-sm">{t('auth.enterCredentials')}</p>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial="hidden"
            animate="show"
            transition={{ staggerChildren: 0.07, delayChildren: 0.15 }}
            className="mt-8 space-y-5"
          >
            <motion.div variants={fadeUp}>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder={t('auth.emailPlaceholder')}
                required
                className={inputCls}
              />
            </motion.div>

            <motion.div variants={fadeUp}>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder={t('auth.passwordPlaceholder')}
                  required
                  className={`${inputCls} pe-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="pt-1">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 px-6 rounded-xl transition-colors shadow-lg shadow-blue-500/25 text-sm"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <LogIn size={16} />
                )}
                {loading ? t('auth.signingIn') : t('auth.signIn')}
              </motion.button>
            </motion.div>
          </motion.form>

          {/* Demo accounts */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="mt-7 p-4 bg-slate-50 rounded-2xl border border-slate-200"
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              {t('auth.demoAccounts')}
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map(({ label, email, pass, color }) => (
                <motion.button
                  key={email}
                  whileHover={{ x: 3, backgroundColor: color === 'blue' ? '#eff6ff' : '#f0fdf4' }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setForm({ email, password: pass })}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                        color === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'
                      }`}
                    >
                      {label[0]}
                    </span>
                    <div className="text-start">
                      <p className="text-xs font-bold text-slate-700">{label}</p>
                      <p className="text-[10px] text-slate-400">{email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 group-hover:text-blue-500 transition-colors">
                    {t('auth.useAccount')}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Register link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            {t('auth.dontHaveAccount')}{' '}
            <Link to="/register" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
              {t('auth.register')}
            </Link>
          </p>
        </div>
      </motion.div>

      {/* ── RIGHT: Image panel ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="hidden lg:block w-[52%] relative overflow-hidden bg-slate-900"
      >
        {/* Ken Burns slow zoom */}
        <motion.div
          className="absolute inset-0 bg-cover bg-center bg-slate-800"
          style={{ backgroundImage: `url(${IMAGE_URL})` }}
          animate={{ scale: [1.05, 1.12] }}
          transition={{ duration: 18, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/75 via-slate-900/55 to-slate-900/85" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />

        {/* Content on image */}
        <div className="relative z-10 h-full flex flex-col justify-between p-12">

          {/* Feature pills (top) */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col gap-3 max-w-xs"
          >
            {PANEL_FEATURES.map((f, i) => (
              <motion.div
                key={f}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3.5 py-2 text-white text-xs font-medium"
              >
                <CheckCircle2 size={13} className="text-blue-300 flex-shrink-0" />
                {f}
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom quote */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="w-8 h-1 rounded-full bg-blue-400 mb-5" />
            <blockquote className="text-white text-xl font-light italic leading-relaxed mb-4">
              "Precision workflow management for the modern dental laboratory."
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/20">
                <img src="/logo.jpeg" alt="DentalLink" className="w-full h-full object-cover" style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              <div>
                <p className="text-white text-xs font-bold">DentalLink</p>
                <p className="text-white/50 text-[10px]">Graduation Project — 2026</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

    </div>
  );
}
