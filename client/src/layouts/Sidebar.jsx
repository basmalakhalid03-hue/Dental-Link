import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderOpen, PlusCircle, Users,
  LogOut, ChevronRight, Cpu, Wrench, X, Truck, UserCog, ListTree, UserCircle, Crown,
} from 'lucide-react';

const LogoMark = () => (
  <div className="relative flex-shrink-0" style={{ perspective: '500px' }}>
    {/* Breathing glow */}
    <motion.div
      animate={{ scale: [1, 1.7, 1], opacity: [0.45, 0, 0.45] }}
      transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
      className="absolute inset-0 rounded-full bg-blue-400/40 blur-sm pointer-events-none"
    />

    {/* Coin-flip entry wrapper */}
    <motion.div
      initial={{ rotateY: -90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.15 }}
      className="relative w-9 h-9"
    >
      {/* Rotating dashed ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 9, ease: 'linear' }}
        className="absolute -inset-[3px] rounded-full border border-dashed border-blue-400/65 pointer-events-none"
      />

      {/* Logo image — hover wag */}
      <motion.img
        src="/logo.jpeg"
        alt="DentalLink"
        variants={{
          rest:  { rotate: 0 },
          hover: {
            rotate: [0, -12, 12, -8, 8, -4, 4, 0],
            transition: { duration: 0.55, ease: 'easeInOut' },
          },
        }}
        initial="rest"
        whileHover="hover"
        className="w-9 h-9 rounded-full object-cover relative z-10 cursor-pointer"
        style={{ boxShadow: '0 0 0 2px rgba(59,130,246,0.3)' }}
      />
    </motion.div>
  </div>
);

export default function Sidebar({ open, onClose }) {
  const { user, logout, isAdmin, isDeliveryAgent, isDoctor } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Build nav items based on role
  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    // Delivery agents have their own dedicated view
    ...(!isDeliveryAgent ? [
      { to: '/cases', label: t('nav.allCases'), icon: FolderOpen },
    ] : []),
    // Admin, technician, and doctor can create cases
    ...(!isDeliveryAgent ? [
      { to: '/cases/new', label: t('nav.newCase'), icon: PlusCircle },
    ] : []),
    // Delivery agent sees their delivery queue
    ...(isDeliveryAgent ? [
      { to: '/delivery', label: 'Delivery Queue', icon: Truck },
    ] : []),
  ];
  const adminItems = [
    { to: '/team',               label: t('nav.team'),        icon: Users },
    { to: '/admin/users',        label: 'Manage Users',       icon: UserCog },
    { to: '/admin/workflow',     label: 'Workflow Templates', icon: ListTree },
    { to: '/admin/crown-types',  label: 'Crown Types',        icon: Crown },
  ];

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed top-0 h-full w-64 bg-white border-e border-slate-200 z-40
        flex flex-col transition-transform duration-300 shadow-xl shadow-slate-200/50
        start-0
        ${open ? 'translate-x-0' : isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2.5"
          >
            <LogoMark />
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">DentalLink</p>
              <p className="text-xs text-slate-400 leading-tight">{t('nav.labSystem')}</p>
            </div>
          </motion.div>
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-slate-100">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Main
          </p>
          {navItems.map(({ to, label, icon: Icon }, idx) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 + 0.1 }}
            >
              <NavLink to={to} end={to === '/'} className={linkClass} onClick={onClose}>
                <Icon size={17} />
                <span className="flex-1">{label}</span>
                <ChevronRight
                  size={14}
                  className={`opacity-0 group-hover:opacity-50 transition-opacity ${isRTL ? 'rotate-180' : ''}`}
                />
              </NavLink>
            </motion.div>
          ))}

          {isAdmin && (
            <>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2 mt-5">
                Admin
              </p>
              {adminItems.map(({ to, label, icon: Icon }, idx) => (
                <motion.div
                  key={to}
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 + 0.3 }}
                >
                  <NavLink to={to} className={linkClass} onClick={onClose}>
                    <Icon size={17} />
                    <span className="flex-1">{label}</span>
                  </NavLink>
                </motion.div>
              ))}
            </>
          )}

          {/* Workflow info card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-6 mx-1 p-3 bg-blue-50 rounded-xl border border-blue-100"
          >
            <p className="text-xs font-semibold text-blue-700 mb-2">{t('nav.workflowTypes')}</p>
            <div className="flex items-center gap-2 text-xs text-blue-600 mb-1">
              <Cpu size={12} /> {t('nav.digitalSteps')}
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <Wrench size={12} /> {t('nav.traditionalSteps')}
            </div>
          </motion.div>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-slate-100">
          <NavLink to="/profile" onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isActive ? 'bg-blue-50' : 'hover:bg-slate-50'
              }`
            }
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">
                {user?.role?.replace('_', ' ').toLowerCase()}
              </p>
            </div>
            <UserCircle size={15} className="text-slate-300 flex-shrink-0" />
          </NavLink>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLogout}
            className="w-full mt-2 flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-150"
          >
            <LogOut size={16} />
            {t('nav.signOut')}
          </motion.button>
        </div>
      </aside>
    </>
  );
}
