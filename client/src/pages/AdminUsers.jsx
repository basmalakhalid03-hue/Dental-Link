import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  UserPlus, Pencil, Trash2, X, Check, Shield,
  Wrench, Truck, Stethoscope, User,
} from 'lucide-react';

const ROLES = ['ADMIN', 'TECHNICIAN', 'DELIVERY_AGENT', 'DOCTOR'];

const ROLE_META = {
  ADMIN:          { label: 'Admin',          icon: Shield,      color: 'bg-purple-100 text-purple-700' },
  TECHNICIAN:     { label: 'Technician',     icon: Wrench,      color: 'bg-blue-100 text-blue-700' },
  DELIVERY_AGENT: { label: 'Delivery Agent', icon: Truck,       color: 'bg-amber-100 text-amber-700' },
  DOCTOR:         { label: 'Doctor',         icon: Stethoscope, color: 'bg-emerald-100 text-emerald-700' },
};

const RoleBadge = ({ role }) => {
  const meta = ROLE_META[role] || { label: role, icon: User, color: 'bg-slate-100 text-slate-600' };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
      <Icon size={11} />
      {meta.label}
    </span>
  );
};

const EMPTY_FORM = { name: '', email: '', phone: '', password: '', role: 'TECHNICIAN' };

export default function AdminUsers() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser]   = useState(null); // null = create mode
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getUsers();
      setUsers(res.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditUser(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, phone: u.phone || '', password: '', role: u.role });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditUser(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return toast.error('Name and email required');
    if (!editUser && !form.password) return toast.error('Password required for new users');

    setSaving(true);
    try {
      if (editUser) {
        const data = { name: form.name, role: form.role, phone: form.phone };
        if (form.password) data.password = form.password;
        await adminAPI.updateUser(editUser.id, data);
        toast.success('User updated');
      } else {
        await adminAPI.createUser(form);
        toast.success('User created');
      }
      closeModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    setDeleting(u.id);
    try {
      await adminAPI.deleteUser(u.id);
      toast.success('User deleted');
      setUsers(prev => prev.filter(x => x.id !== u.id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Users</h1>
          <p className="text-slate-500 text-sm mt-0.5">{users.length} team members</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
        >
          <UserPlus size={16} />
          Add User
        </motion.button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-6 py-3.5 font-semibold text-slate-600">Name</th>
                <th className="px-6 py-3.5 font-semibold text-slate-600">Email</th>
                <th className="px-6 py-3.5 font-semibold text-slate-600">Role</th>
                <th className="px-6 py-3.5 font-semibold text-slate-600">Active Cases</th>
                <th className="px-6 py-3.5 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{u.name.charAt(0)}</span>
                      </div>
                      <span className="font-medium text-slate-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{u.email}</td>
                  <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
                  <td className="px-6 py-4">
                    {u.role === 'TECHNICIAN' ? (
                      <span className={`font-semibold ${u.activeCases > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                        {u.activeCases}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={deleting === u.id}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900">
                    {editUser ? 'Edit User' : 'Add New User'}
                  </h2>
                  <button onClick={closeModal} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                    <X size={16} className="text-slate-500" />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                      placeholder="e.g. Ahmed Hassan"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      disabled={!!editUser}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-400"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                      placeholder="+20 1xx xxx xxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Password {editUser && <span className="font-normal text-slate-400">(leave blank to keep current)</span>}
                    </label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">Role</label>
                    <div className="grid grid-cols-2 gap-2">
                      {ROLES.map(r => {
                        const meta = ROLE_META[r];
                        const Icon = meta.icon;
                        const active = form.role === r;
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, role: r }))}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                              active
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <Icon size={14} />
                            {meta.label}
                            {active && <Check size={12} className="ml-auto text-blue-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      disabled={saving}
                      className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-60"
                    >
                      {saving ? 'Saving…' : editUser ? 'Save Changes' : 'Create User'}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
