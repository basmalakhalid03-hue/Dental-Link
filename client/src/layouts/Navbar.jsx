import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 gap-3 sticky top-0 z-20">
      {/* Mobile menu button */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-slate-600">
          <line x1="3" y1="6"  x2="21" y2="6"  />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </motion.button>

      <div className="flex-1" />

      {/* Right section */}
      <div className="flex items-center gap-2">
        <LanguageSwitcher />

        {/* Notification bell */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <Bell size={18} className="text-slate-500" />
          <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-blue-500 rounded-full" />
        </motion.button>

        {/* User avatar */}
        <div className="flex items-center gap-2.5 ms-1">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-sm cursor-pointer"
          >
            <span className="text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </motion.div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</p>
            <p className="text-xs text-slate-400 leading-tight capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
