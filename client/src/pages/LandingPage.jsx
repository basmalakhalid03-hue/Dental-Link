import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  FolderKanban, GitBranch, BarChart3, CheckCircle2,
  ChevronDown, ArrowRight, Clock, Shield, Zap, Star, Menu, X,
} from 'lucide-react';

// ── Unsplash dental images ────────────────────────────────────────────────────
const SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1588776814546-1ffbb172d4a3?auto=format&fit=crop&w=1920&q=80',
    tag: 'Digital Workflow',
  },
  {
    url: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1920&q=80',
    tag: 'Precision Craftsmanship',
  },
  {
    url: 'https://images.unsplash.com/photo-1629909613654-96e8c4e52f7f?auto=format&fit=crop&w=1920&q=80',
    tag: 'Lab Excellence',
  },
];

const FEATURES = [
  {
    icon: FolderKanban,
    title: 'Case Management',
    desc: 'Create, assign, and track every patient case from initial impression to final crown delivery.',
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
  },
  {
    icon: GitBranch,
    title: 'Workflow Tracking',
    desc: 'Follow 11 digital or 19 traditional fabrication steps with real-time progress and delay alerts.',
    color: 'violet',
    gradient: 'from-violet-500 to-violet-600',
    bg: 'bg-violet-50',
    text: 'text-violet-600',
  },
  {
    icon: Shield,
    title: 'Tooth Selection Chart',
    desc: 'Interactive FDI dental chart with color-coded status per tooth — linked directly to each case.',
    color: 'emerald',
    gradient: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
  },
  {
    icon: BarChart3,
    title: 'Dashboard & Analytics',
    desc: 'Real-time technician performance, completion rates, overdue alerts, and lab-wide statistics.',
    color: 'amber',
    gradient: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
  },
];

const STATS = [
  { value: '11', label: 'Digital Steps Tracked', icon: Zap },
  { value: '19', label: 'Traditional Steps', icon: CheckCircle2 },
  { value: '100%', label: 'Workflow Coverage', icon: Shield },
  { value: 'Live', label: 'Real-time Updates', icon: Clock },
];

// ── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ feature, index }) {
  const Icon = feature.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
      whileHover={{ y: -6, boxShadow: '0 24px 48px rgba(0,0,0,0.10)' }}
      className="group relative bg-white rounded-3xl p-8 border border-slate-100 shadow-sm cursor-default overflow-hidden transition-shadow"
    >
      {/* Hover gradient shimmer */}
      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300`} />

      <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-6`}>
        <Icon size={26} className={feature.text} />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-3">{feature.title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>

      <div className={`mt-6 flex items-center gap-1.5 ${feature.text} text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
        Learn more <ArrowRight size={14} />
      </div>
    </motion.div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/30 flex-shrink-0">
            <img src="/logo.jpeg" alt="DentalLink" className="w-full h-full object-cover" />
          </div>
          <span className={`font-bold text-lg transition-colors ${scrolled ? 'text-slate-900' : 'text-white'}`}>
            DentalLink
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'About'].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase()}`}
              className={`text-sm font-medium transition-colors ${
                scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'
              }`}
            >
              {label}
            </a>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
              scrolled
                ? 'text-slate-700 hover:bg-slate-100'
                : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
          >
            Sign In
          </Link>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/register"
              className="text-sm font-semibold px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-400/30"
            >
              Get Started
            </Link>
          </motion.div>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen
            ? <X size={22} className={scrolled ? 'text-slate-700' : 'text-white'} />
            : <Menu size={22} className={scrolled ? 'text-slate-700' : 'text-white'} />
          }
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-3">
              <a href="#features" className="text-sm font-medium text-slate-700" onClick={() => setMobileOpen(false)}>Features</a>
              <a href="#about" className="text-sm font-medium text-slate-700" onClick={() => setMobileOpen(false)}>About</a>
              <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                <Link to="/login" className="text-sm font-semibold text-center py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50">Sign In</Link>
                <Link to="/register" className="text-sm font-semibold text-center py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700">Get Started Free</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

// ── Hero section ──────────────────────────────────────────────────────────────
function HeroSection() {
  const [current, setCurrent] = useState(0);
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);

  useEffect(() => {
    const timer = setInterval(() => setCurrent(i => (i + 1) % SLIDES.length), 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section ref={ref} className="relative h-screen min-h-[640px] overflow-hidden bg-slate-900 flex items-center justify-center">
      {/* Slider images — all rendered, only current is opaque */}
      <motion.div style={{ y }} className="absolute inset-0">
        {SLIDES.map((slide, i) => (
          <motion.div
            key={i}
            className="absolute inset-0"
            animate={{ opacity: i === current ? 1 : 0 }}
            transition={{ duration: 1.4, ease: 'easeInOut' }}
          >
            <motion.div
              className="absolute inset-0 bg-cover bg-center bg-slate-800"
              style={{ backgroundImage: `url(${slide.url})` }}
              animate={{ scale: i === current ? 1.04 : 1.08 }}
              transition={{ duration: i === current ? 6 : 0, ease: 'easeOut' }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/65 to-slate-900/40 z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent z-10" />

      {/* Hero content */}
      <div className="relative z-20 max-w-5xl mx-auto px-6 text-center">
        {/* Animated tag */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-white/90 text-sm font-medium mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          Dental Lab Management System
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6"
        >
          Streamline Your{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            Dental Lab
          </span>
          <br />Workflow
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Track every crown fabrication step from impression to final delivery.
          Manage cases, technicians, and workflows — all in one place.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/register"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-2xl text-base shadow-lg shadow-blue-900/40 transition-colors"
            >
              Get Started Free <ArrowRight size={18} />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/login"
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/25 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-all"
            >
              Sign In
            </Link>
          </motion.div>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-wrap justify-center gap-6 mt-12 text-white/50 text-xs font-medium"
        >
          {['Free to use', 'No setup required', 'Bilingual EN / AR'].map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-blue-400" />
              {t}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Slide dots */}
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current ? 'w-8 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

      {/* Current slide tag */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-28 right-8 z-20 hidden sm:flex items-center gap-2 text-white/60 text-xs font-medium"
        >
          <span className="w-1 h-4 rounded-full bg-blue-400" />
          {SLIDES[current].tag}
        </motion.div>
      </AnimatePresence>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1">
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        >
          <ChevronDown size={22} className="text-white/40" />
        </motion.div>
      </div>
    </section>
  );
}

// ── Features section ──────────────────────────────────────────────────────────
function FeaturesSection() {
  return (
    <section id="features" className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55 }}
          className="text-center mb-18"
        >
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 text-blue-600 text-sm font-semibold mb-4">
            <Zap size={13} /> Everything you need
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 mt-2">
            Built for modern dental labs
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">
            From case creation to delivery — every step is tracked, every technician accountable.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          {FEATURES.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
        </div>
      </div>
    </section>
  );
}

// ── Stats strip ───────────────────────────────────────────────────────────────
function StatsSection() {
  return (
    <section className="py-16 bg-slate-50 border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map(({ value, label, icon: Icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="text-center"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Icon size={20} className="text-blue-600" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{value}</p>
              <p className="text-slate-500 text-sm mt-1">{label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Preview / about section ───────────────────────────────────────────────────
function AboutSection() {
  return (
    <section id="about" className="py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-full px-4 py-1.5 text-violet-600 text-sm font-semibold mb-6">
              <Star size={13} /> Why DentalLink
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-6">
              Precision lab management,<br />
              <span className="text-blue-600">the way it should be</span>
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              DentalLink replaces fragmented spreadsheets and manual tracking with a
              structured digital workflow. Every case moves through defined steps —
              so nothing gets lost, delayed, or forgotten.
            </p>
            <ul className="space-y-4">
              {[
                { icon: CheckCircle2, text: 'Full FDI dental chart with per-tooth status', color: 'text-emerald-500' },
                { icon: CheckCircle2, text: 'Step-level completion tracking per technician', color: 'text-emerald-500' },
                { icon: CheckCircle2, text: 'Due date alerts and overdue case flagging', color: 'text-emerald-500' },
                { icon: CheckCircle2, text: 'File attachments per case (X-rays, scans)', color: 'text-emerald-500' },
              ].map(({ icon: Ic, text, color }) => (
                <li key={text} className="flex items-start gap-3 text-slate-700 text-sm">
                  <Ic size={18} className={`${color} flex-shrink-0 mt-0.5`} />
                  {text}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Visual card stack */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            {/* Decorative blobs */}
            <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full bg-blue-100/60 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-56 h-56 rounded-full bg-violet-100/50 blur-3xl pointer-events-none" />

            {/* Main dashboard preview card */}
            <div className="relative bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/60 p-6 overflow-hidden">
              {/* Fake dashboard header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-bold text-slate-900 text-sm">Dashboard</p>
                  <p className="text-xs text-slate-400 mt-0.5">Today's overview</p>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
              </div>

              {/* Fake stat cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { n: '24', l: 'Total Cases', c: 'bg-blue-50 text-blue-700' },
                  { n: '18', l: 'Completed',   c: 'bg-emerald-50 text-emerald-700' },
                  { n: '4',  l: 'In Progress', c: 'bg-amber-50 text-amber-700' },
                  { n: '2',  l: 'Delayed',     c: 'bg-rose-50 text-rose-700' },
                ].map(({ n, l, c }) => (
                  <div key={l} className={`${c} rounded-2xl p-3`}>
                    <p className="text-xl font-bold">{n}</p>
                    <p className="text-xs font-medium opacity-80">{l}</p>
                  </div>
                ))}
              </div>

              {/* Fake recent cases */}
              <div className="space-y-2">
                {['Mohamed Ali — Upper Crown', 'Sara Ahmed — Bridge'].map((name, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      #{i + 1}
                    </div>
                    <p className="text-xs text-slate-700 font-medium flex-1 truncate">{name}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {i === 0 ? 'In Progress' : 'Completed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating info pill */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute -bottom-5 -right-4 bg-white border border-slate-200 rounded-2xl shadow-lg px-4 py-3 flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Crown Delivered</p>
                <p className="text-[10px] text-slate-400">Step 11 / 11</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── CTA section ───────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="relative py-28 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-80 h-80 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white/5 translate-x-1/3 translate-y-1/3 blur-3xl" />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
        className="absolute top-16 right-24 w-40 h-40 rounded-full border border-white/10"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
        className="absolute bottom-12 left-20 w-28 h-28 rounded-full border border-white/10"
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55 }}
        >
          <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-4">
            Start Today — It's Free
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
            Ready to transform<br />your dental lab?
          </h2>
          <p className="text-blue-100/80 text-lg mb-10 leading-relaxed">
            Join dental labs already using DentalLink to manage cases,
            track workflows, and deliver precision work on time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/register"
                className="flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-2xl text-base hover:bg-blue-50 transition-colors shadow-xl shadow-blue-900/20"
              >
                Register Now <ArrowRight size={18} />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/login"
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/25 text-white font-semibold px-8 py-4 rounded-2xl text-base hover:bg-white/20 transition-all"
              >
                Sign In to Dashboard
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden">
              <img src="/logo.jpeg" alt="DentalLink" className="w-full h-full object-cover" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
            <div>
              <p className="font-bold text-white">DentalLink</p>
              <p className="text-slate-500 text-xs">Lab Management System</p>
            </div>
          </div>

          <div className="flex items-center gap-8 text-slate-500 text-sm">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
          </div>

          <p className="text-slate-600 text-sm">
            © 2026 DentalLink — Graduation Project
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <AboutSection />
      <CTASection />
      <Footer />
    </div>
  );
}
