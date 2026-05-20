import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { deliveryAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Package, PackageCheck, PackageOpen, Truck,
  Clock, CheckCircle2, Stethoscope, Phone,
} from 'lucide-react';

const STATUS_CONFIG = {
  null:             { label: 'Awaiting',        color: 'bg-slate-100 text-slate-600',  icon: Clock },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', color: 'bg-amber-100 text-amber-700',  icon: PackageOpen },
  PICKED_UP:        { label: 'Picked Up',        color: 'bg-blue-100 text-blue-700',    icon: Truck },
  DELIVERED:        { label: 'Delivered',         color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
};

const DELIVERY_STATUSES = [
  { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
  { value: 'PICKED_UP',        label: 'Picked Up' },
  { value: 'DELIVERED',        label: 'Delivered' },
];

const StatCard = ({ icon: Icon, label, value, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-sm`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
      <Icon size={18} />
    </div>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
    <p className="text-sm text-slate-500 mt-0.5">{label}</p>
  </motion.div>
);

export default function DeliveryDashboard() {
  const [cases, setCases]   = useState([]);
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const load = async () => {
    try {
      setLoading(true);
      const [casesRes, statsRes] = await Promise.all([
        deliveryAPI.getCases(),
        deliveryAPI.getStats(),
      ]);
      setCases(casesRes.data);
      setStats(statsRes.data);
    } catch {
      toast.error('Failed to load delivery data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (caseItem, newStatus) => {
    if (!newStatus || newStatus === caseItem.deliveryStatus) return;
    setUpdating(caseItem.id);
    try {
      const res = await deliveryAPI.updateStatus(caseItem.id, newStatus);
      setCases(prev => prev.map(c => c.id === caseItem.id ? res.data : c));
      if (stats) deliveryAPI.getStats().then(r => setStats(r.data)).catch(() => {});
      toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filterStatus === 'ALL'
    ? cases
    : cases.filter(c => (c.deliveryStatus ?? 'AWAITING') === filterStatus);

  const FILTERS = [
    { key: 'ALL', label: 'All' },
    { key: 'AWAITING', label: 'Awaiting' },
    { key: 'READY_FOR_PICKUP', label: 'Ready' },
    { key: 'PICKED_UP', label: 'Picked Up' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Delivery Queue</h1>
        <p className="text-slate-500 text-sm mt-0.5">Track and advance delivery status for completed cases</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Clock}        label="Awaiting Ready"  value={stats.awaitingReady}  color="bg-slate-100 text-slate-600" />
          <StatCard icon={PackageOpen}  label="Ready for Pickup" value={stats.readyForPickup} color="bg-amber-100 text-amber-600" />
          <StatCard icon={Truck}        label="Picked Up"        value={stats.pickedUp}        color="bg-blue-100 text-blue-600" />
          <StatCard icon={PackageCheck} label="Delivered"        value={stats.delivered}       color="bg-emerald-100 text-emerald-600" />
        </div>
      )}

      {/* Filter pills */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterStatus === f.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Cases list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            No cases in this category.
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((c, i) => {
              const config = STATUS_CONFIG[c.deliveryStatus ?? null];
              const Icon = config.icon;
              const isUpdating = updating === c.id;

              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    <Icon size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 text-sm">{c.patientName}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {c.caseType} · {c.crownType}
                      {c.technician && ` · ${c.technician.name}`}
                      {c.toothNumber && ` · Tooth #${c.toothNumber}`}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-slate-600">
                        <Stethoscope size={12} className="text-slate-400" />
                        {c.doctorName}
                      </span>
                      {c.doctorPhone && (
                        <a
                          href={`tel:${c.doctorPhone}`}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                          onClick={e => e.stopPropagation()}
                        >
                          <Phone size={12} />
                          {c.doctorPhone}
                        </a>
                      )}
                    </div>
                  </div>

                  <select
                    value={c.deliveryStatus ?? ''}
                    onChange={(e) => handleStatusChange(c, e.target.value)}
                    disabled={isUpdating}
                    className="flex-shrink-0 px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:opacity-50 cursor-pointer"
                  >
                    <option value="">Awaiting</option>
                    {DELIVERY_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
