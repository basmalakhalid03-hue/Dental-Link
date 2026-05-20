import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import toast from 'react-hot-toast';
import { UserPlus, Eye, EyeOff, ArrowLeft, Sparkles, Clock, Shield, Zap, Phone } from 'lucide-react';

const SLIDES = [
  'https://images.unsplash.com/photo-1629909613654-96e8c4e52f7f?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1588776814546-1ffbb9f7568f?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=1400&q=80',
];
const SLIDE_INTERVAL = 5000;

const PANEL_HIGHLIGHTS = [
  { icon: Zap,    title: 'Instant setup',     desc: 'Create your lab account in under 60 seconds' },
  { icon: Shield, title: 'Role-based access', desc: 'Admin and technician roles out of the box' },
  { icon: Clock,  title: 'Real-time tracking', desc: 'Every case step tracked the moment it happens' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0 },
};

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'TECHNICIAN' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [slide, setSlide]       = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSlide(p => (p + 1) % SLIDES.length), SLIDE_INTERVAL);
    return () => clearInterval(id);
  }, []);
  const { register } = useAuth();
  const navigate     = useNavigate();
  const { t }        = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Min 6 characters'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
            <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold px-3 py-1 rounded-full mb-3">
              <Sparkles size={11} /> Free to get started
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1.5">{t('auth.createAccount')}</h1>
            <p className="text-slate-500 text-sm">Set up your dental lab account in seconds</p>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial="hidden"
            animate="show"
            transition={{ staggerChildren: 0.07, delayChildren: 0.15 }}
            className="mt-8 space-y-4"
          >
            <motion.div variants={fadeUp}>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                {t('auth.fullName')}
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={t('auth.fullNamePlaceholder')}
                required
                className={inputCls}
              />
            </motion.div>

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
                {t('auth.phone')}
                <span className="ms-1 text-slate-400 font-normal normal-case">(optional)</span>
              </label>
              <div className="relative">
                <Phone size={15} className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+20 1xx xxx xxxx"
                  className={`${inputCls} ps-11`}
                />
              </div>
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
                  placeholder={t('auth.minPassword')}
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
              {/* Password strength hint */}
              {form.password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 flex gap-1"
                >
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                        form.password.length >= n * 3
                          ? form.password.length >= 8 ? 'bg-emerald-400' : 'bg-amber-400'
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                  <span className="text-[10px] text-slate-400 ms-1 self-center">
                    {form.password.length < 3 ? 'Weak' : form.password.length < 8 ? 'Fair' : 'Strong'}
                  </span>
                </motion.div>
              )}
            </motion.div>

            <motion.div variants={fadeUp}>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                {t('auth.role')}
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { value: 'TECHNICIAN',     label: t('auth.roleTechnician'), icon: '🔬', active: 'border-blue-500 bg-blue-50 text-blue-700',   dot: 'bg-blue-500'   },
                  { value: 'DOCTOR',         label: t('auth.roleDoctor'),     icon: '🩺', active: 'border-violet-500 bg-violet-50 text-violet-700', dot: 'bg-violet-500' },
                  { value: 'DELIVERY_AGENT', label: t('auth.roleDelivery'),   icon: '🚚', active: 'border-amber-500 bg-amber-50 text-amber-700',   dot: 'bg-amber-500'  },
                  { value: 'ADMIN',          label: t('auth.roleAdmin'),      icon: '⚙️', active: 'border-rose-500 bg-rose-50 text-rose-700',     dot: 'bg-rose-500'   },
                ].map(({ value, label, icon, active, dot }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, role: value })}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      form.role === value
                        ? active
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-base">{icon}</span>
                    <span className="flex-1 text-start">{label}</span>
                    {form.role === value && (
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                    )}
                  </button>
                ))}
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
                  <UserPlus size={16} />
                )}
                {loading ? t('auth.creating') : t('auth.createAccount')}
              </motion.button>
            </motion.div>
          </motion.form>

          {/* Sign in link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
              {t('auth.signInLink')}
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
        {/* Slideshow with per-slide Ken Burns zoom */}
        <AnimatePresence>
          <motion.div
            key={slide}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${SLIDES[slide]})` }}
            initial={{ opacity: 0, scale: 1.0 }}
            animate={{ opacity: 1, scale: 1.13 }}
            exit={{ opacity: 0, scale: 1.16 }}
            transition={{
              opacity: { duration: 1.0, ease: 'easeInOut' },
              scale:   { duration: SLIDE_INTERVAL / 1000 + 1, ease: 'linear' },
            }}
          />
        </AnimatePresence>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-900/80 via-slate-900/50 to-slate-900/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-12">

          {/* Top: Highlights */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="space-y-4 max-w-sm"
          >
            {PANEL_HIGHLIGHTS.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.12, duration: 0.4 }}
                className="flex items-start gap-3.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-500/30 border border-blue-400/30 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-blue-300" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">{title}</p>
                  <p className="text-white/55 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom: Brand + quote */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <div className="w-8 h-1 rounded-full bg-blue-400 mb-5" />
            <blockquote className="text-white text-xl font-light italic leading-relaxed mb-5">
              "Everything your dental lab needs — from case creation to crown delivery."
            </blockquote>
            {/* Stats row */}
            <div className="flex gap-6 mb-6">
              {[
                { n: '11', l: 'Digital steps' },
                { n: '19', l: 'Traditional steps' },
                { n: '∞',  l: 'Cases tracked' },
              ].map(({ n, l }) => (
                <div key={l}>
                  <p className="text-white font-extrabold text-xl">{n}</p>
                  <p className="text-white/45 text-xs">{l}</p>
                </div>
              ))}
            </div>

            {/* Slide indicators */}
            <div className="flex items-center gap-2">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === slide
                      ? 'w-7 bg-white'
                      : 'w-2 bg-white/35 hover:bg-white/55'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

    </div>
  );
}
