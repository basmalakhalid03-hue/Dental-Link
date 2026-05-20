import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/PageTransition';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  User, Mail, Phone, Shield, Calendar,
  Pencil, Save, X, Loader2,
} from 'lucide-react';

const ROLE_STYLE = {
  ADMIN:          { label: 'Admin',          bg: 'bg-rose-100',   text: 'text-rose-700',   icon: '⚙️' },
  TECHNICIAN:     { label: 'Technician',     bg: 'bg-blue-100',   text: 'text-blue-700',   icon: '🔬' },
  DOCTOR:         { label: 'Doctor',         bg: 'bg-violet-100', text: 'text-violet-700', icon: '🩺' },
  DELIVERY_AGENT: { label: 'Delivery Agent', bg: 'bg-amber-100',  text: 'text-amber-700',  icon: '🚚' },
};

export default function Profile() {
  const { user, login } = useAuth();
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form, setForm] = useState({
    name:  user?.name  ?? '',
    phone: user?.phone ?? '',
  });

  const roleStyle = ROLE_STYLE[user?.role] ?? ROLE_STYLE.TECHNICIAN;

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      // Use admin update if admin, otherwise use a dedicated /auth/me PUT
      // For now update via admin endpoint since no dedicated profile update exists
      // We refresh the user via getMe after update
      await authAPI.updateMe({ name: form.name.trim(), phone: form.phone.trim() || null });
      // Refresh user in context
      const res = await authAPI.getMe();
      // Re-store updated user
      localStorage.setItem('user', JSON.stringify(res.data));
      window.dispatchEvent(new Event('user-updated'));
      toast.success('Profile updated');
      setEditing(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ name: user?.name ?? '', phone: user?.phone ?? '' });
    setEditing(false);
  };

  const fieldCls = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white';

  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <PageTransition>
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500 text-sm mt-1">Your account information</p>
        </motion.div>

        {/* Avatar + role card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5"
        >
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200">
              <span className="text-white text-2xl font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-slate-900 truncate">{user?.name}</p>
              <p className="text-sm text-slate-500 truncate">{user?.email}</p>
              <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-bold ${roleStyle.bg} ${roleStyle.text}`}>
                <span>{roleStyle.icon}</span>
                {roleStyle.label}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info fields */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Details</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Pencil size={13} /> Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <X size={13} /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                <User size={13} /> Full Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className={fieldCls}
                  autoFocus
                />
              ) : (
                <p className="text-sm font-medium text-slate-800 px-1">{user?.name}</p>
              )}
            </div>

            {/* Email (read-only always) */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                <Mail size={13} /> Email
              </label>
              <p className="text-sm font-medium text-slate-800 px-1">{user?.email}</p>
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                <Phone size={13} /> Phone Number
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+20 1xx xxx xxxx"
                  className={fieldCls}
                />
              ) : (
                <p className="text-sm font-medium text-slate-800 px-1">
                  {user?.phone || <span className="text-slate-400 italic">Not provided</span>}
                </p>
              )}
            </div>

            {/* Role (read-only) */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                <Shield size={13} /> Role
              </label>
              <p className="text-sm font-medium text-slate-800 px-1">{roleStyle.label}</p>
            </div>

            {/* Joined */}
            {joined && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                  <Calendar size={13} /> Member Since
                </label>
                <p className="text-sm font-medium text-slate-800 px-1">{joined}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
