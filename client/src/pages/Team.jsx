import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import { Mail, Shield, Wrench } from 'lucide-react';
import PageTransition, { stagger } from '../components/PageTransition';
import { format } from '../utils/format';

const UserCard = ({ user, index }) => {
  const { t } = useTranslation();
  return (
    <motion.div
      variants={stagger.item}
      whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.07)' }}
      className="bg-white rounded-2xl border border-slate-100 p-5"
    >
      <div className="flex items-center gap-4">
        <motion.div
          whileHover={{ scale: 1.08 }}
          className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
        >
          <span className="text-white font-bold text-lg">{user.name.charAt(0)}</span>
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 truncate">{user.name}</p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <Mail size={11} /><span className="truncate">{user.email}</span>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
          user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
        }`}>
          {user.role === 'ADMIN' ? <Shield size={11} /> : <Wrench size={11} />}
          {user.role}
        </span>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between">
        <span className="text-xs text-slate-400">{t('team.memberSince')}</span>
        <span className="text-xs font-medium text-slate-600">{format.date(user.createdAt)}</span>
      </div>
    </motion.div>
  );
};

export default function Team() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    authAPI.getUsers()
      .then((res) => setUsers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const admins = users.filter((u) => u.role === 'ADMIN');
  const techs  = users.filter((u) => u.role === 'TECHNICIAN');

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full" />
    </div>
  );

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('team.title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('team.membersCount', { count: users.length })}</p>
        </div>

        {admins.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-blue-600" />
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{t('team.administrators')}</h2>
            </div>
            <motion.div variants={stagger.container} initial="hidden" animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {admins.map((u, i) => <UserCard key={u.id} user={u} index={i} />)}
            </motion.div>
          </section>
        )}

        {techs.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Wrench size={16} className="text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{t('team.technicians')}</h2>
            </div>
            <motion.div variants={stagger.container} initial="hidden" animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {techs.map((u, i) => <UserCard key={u.id} user={u} index={i} />)}
            </motion.div>
          </section>
        )}
      </div>
    </PageTransition>
  );
}
