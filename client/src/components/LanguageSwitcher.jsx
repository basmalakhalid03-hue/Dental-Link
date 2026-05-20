import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages } from 'lucide-react';
import { useState } from 'react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = i18n.language;

  const langs = [
    { code: 'en', label: 'English', native: 'EN', flag: '🇺🇸' },
    { code: 'ar', label: 'العربية', native: 'ع', flag: '🇸🇦' },
  ];

  const toggle = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  const currentLang = langs.find((l) => l.code === current) || langs[0];

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-all text-sm font-medium text-slate-600"
      >
        <Languages size={15} className="text-slate-400" />
        <span className="text-xs font-bold">{currentLang.native}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-1 end-0 z-50 w-36 bg-white rounded-xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden"
            >
              {langs.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => toggle(lang.code)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                    current === lang.code
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span>{lang.label}</span>
                  {current === lang.code && (
                    <span className="ms-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
