import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { casesAPI, stepsAPI, filesAPI, authAPI, crownTypeAPI } from '../services/api';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import TeethDiagram from '../components/TeethDiagram';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeft, CheckCircle2, Play, ChevronDown, ChevronUp,
  Send, Cpu, Wrench, User, Calendar, Stethoscope,
  Trophy, AlertTriangle, Loader2, Clock, Paperclip,
  Upload, File, Trash2, Image, FileText, Pencil, X,
  ZoomIn, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { format } from '../utils/format';

// ── Animated step status icon ─────────────────────────────────────────────────
const StepIcon = ({ status, order }) => {
  if (status === 'COMPLETED') return (
    <motion.div
      initial={{ scale: 0, rotate: -90 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-200"
    >
      <CheckCircle2 size={16} className="text-white" />
    </motion.div>
  );
  if (status === 'CURRENT') return (
    <motion.div
      animate={{ boxShadow: ['0 0 0 0 rgba(37,99,235,0.4)', '0 0 0 8px rgba(37,99,235,0)', '0 0 0 0 rgba(37,99,235,0)'] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0"
    >
      <Play size={12} className="text-white fill-white ms-0.5" />
    </motion.div>
  );
  return (
    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-semibold text-slate-400">{order}</span>
    </div>
  );
};

// ── Note form ─────────────────────────────────────────────────────────────────
const NoteForm = ({ stepId, onAdd }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await stepsAPI.addNote(stepId, { content });
      onAdd(res.data);
      setContent('');
      toast.success(t('case.addNoteBtn') + ' ✓');
    } catch {
      toast.error('Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 flex gap-2">
      <input
        type="text" value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('case.addNote')}
        className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-slate-50"
      />
      <motion.button
        type="submit" disabled={loading || !content.trim()}
        whileTap={{ scale: 0.95 }}
        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-1"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
        {t('case.addNoteBtn')}
      </motion.button>
    </form>
  );
};

// ── Single step card ──────────────────────────────────────────────────────────
const StepCard = ({ step, index, onComplete, isOwner }) => {
  const [expanded, setExpanded]     = useState(step.status === 'CURRENT');
  const [completing, setCompleting] = useState(false);
  const [notes, setNotes]           = useState(step.notes || []);
  const { t } = useTranslation();

  const handleComplete = async () => {
    setCompleting(true);
    try { await onComplete(step.id); }
    finally { setCompleting(false); }
  };

  const borderColor =
    step.status === 'COMPLETED' ? 'border-emerald-200 bg-emerald-50/20' :
    step.status === 'CURRENT'   ? 'border-blue-200 bg-blue-50/20'      : 'border-slate-100 bg-white';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.035, duration: 0.3 }}
      className={`rounded-xl border transition-all duration-200 ${borderColor}`}
    >
      <button className="w-full flex items-center gap-3 p-4 text-start" onClick={() => setExpanded(!expanded)}>
        <StepIcon status={step.status} order={step.step.order} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-semibold truncate ${
              step.status === 'COMPLETED' ? 'text-emerald-700' :
              step.status === 'CURRENT'   ? 'text-blue-700'    : 'text-slate-500'
            }`}>
              {step.step.name}
            </p>
            {step.status === 'CURRENT' && (
              <motion.span
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium"
              >
                {t('case.statusActive')}
              </motion.span>
            )}
          </div>
          {step.completedAt && (
            <p className="text-xs text-emerald-600 mt-0.5">
              {t('case.completedAt')} {format.relative(step.completedAt)}
            </p>
          )}
          {notes.length > 0 && (
            <p className="text-xs text-slate-400 mt-0.5">
              {t('case.notesCount_other', { count: notes.length })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {step.status === 'CURRENT' && isOwner && (
            <motion.button
              onClick={(e) => { e.stopPropagation(); handleComplete(); }}
              disabled={completing}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all shadow-sm shadow-blue-200 disabled:opacity-50"
            >
              {completing ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
              {completing ? t('case.saving') : t('case.completeStep')}
            </motion.button>
          )}
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-dashed border-slate-200 pt-3">
              {step.step.description && (
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">{step.step.description}</p>
              )}
              {notes.length > 0 && (
                <div className="space-y-2 mb-3">
                  {notes.map((note, ni) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: ni * 0.04 }}
                      className="flex gap-2.5 bg-white rounded-lg p-2.5 border border-slate-100"
                    >
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 font-bold" style={{ fontSize: 9 }}>
                          {(note.author?.name || 'U').charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-slate-700">{note.author?.name || 'Unknown'}</span>
                          <span className="text-xs text-slate-400">{format.relative(note.createdAt)}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{note.content}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              {(step.status === 'CURRENT' || step.status === 'COMPLETED') && isOwner && (
                <NoteForm stepId={step.id} onAdd={(note) => setNotes((n) => [...n, note])} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Step timeline ─────────────────────────────────────────────────────────────
const StepTimeline = ({ steps }) => {
  const { t } = useTranslation();
  const completed = steps.filter((s) => s.status === 'COMPLETED' && s.completedAt)
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));

  if (completed.length === 0) return (
    <div className="text-center py-8 text-slate-400 text-sm">{t('case.noCompletedSteps')}</div>
  );

  return (
    <div className="relative ps-6">
      {/* Vertical line */}
      <div className="absolute start-2 top-2 bottom-2 w-px bg-emerald-200" />
      <div className="space-y-4">
        {completed.map((step, idx) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="relative"
          >
            {/* Dot */}
            <div className="absolute -start-4 top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-300" />
            <div className="bg-white rounded-xl border border-emerald-100 p-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-sm font-semibold text-slate-800">{step.step.name}</span>
                  <span className="text-xs text-slate-400">{t('case.step')} {step.step.order}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock size={11} />
                  <span>{format.datetime(step.completedAt)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {/* Current step indicator */}
        {steps.find((s) => s.status === 'CURRENT') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: completed.length * 0.05 }}
            className="relative"
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -start-4 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white ring-1 ring-blue-300"
            />
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-3">
              <div className="flex items-center gap-2">
                <Play size={13} className="text-blue-500 fill-blue-500 flex-shrink-0" />
                <span className="text-sm font-semibold text-blue-700">
                  {steps.find((s) => s.status === 'CURRENT')?.step.name}
                </span>
                <span className="text-xs text-blue-400">{t('case.statusActive')}</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// ── File attachment section ───────────────────────────────────────────────────
const FileIcon = ({ mimetype }) => {
  if (mimetype?.startsWith('image/')) return <Image size={16} className="text-violet-500" />;
  if (mimetype === 'application/pdf') return <FileText size={16} className="text-rose-500" />;
  return <File size={16} className="text-slate-500" />;
};

const AttachmentsSection = ({ caseId, isOwner }) => {
  const { t } = useTranslation();
  const [files, setFiles]             = useState([]);
  const [uploading, setUploading]     = useState(false);
  const [progress, setProgress]       = useState(0);
  const [dragging, setDragging]       = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const inputRef = useRef();

  const imageFiles = files.filter((f) => f.mimetype?.startsWith('image/'));
  const otherFiles = files.filter((f) => !f.mimetype?.startsWith('image/'));

  useEffect(() => {
    filesAPI.getCaseFiles(caseId)
      .then((res) => setFiles(res.data))
      .catch(() => {});
  }, [caseId]);

  // Keyboard nav for lightbox
  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e) => {
      if (e.key === 'Escape')      setLightboxIdx(null);
      if (e.key === 'ArrowRight')  setLightboxIdx((i) => (i + 1) % imageFiles.length);
      if (e.key === 'ArrowLeft')   setLightboxIdx((i) => (i - 1 + imageFiles.length) % imageFiles.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIdx, imageFiles.length]);

  const doUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const res = await filesAPI.upload(caseId, file, setProgress);
      setFiles((f) => [res.data, ...f]);
      toast.success(t('case.fileUploaded'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('case.fileUploadFailed'));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDelete = async (fileId) => {
    try {
      await filesAPI.delete(fileId);
      setFiles((f) => f.filter((x) => x.id !== fileId));
      setLightboxIdx(null);
      toast.success(t('case.fileDeleted'));
    } catch {
      toast.error('Failed to delete file');
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) doUpload(file);
  };

  return (
    <div>
      {/* Drop zone */}
      {isOwner && (
        <motion.div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          animate={{ borderColor: dragging ? '#3b82f6' : '#e2e8f0', backgroundColor: dragging ? '#eff6ff' : '#f8fafc' }}
          className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors mb-4"
        >
          <input ref={inputRef} type="file" className="hidden"
            accept="image/*,application/pdf"
            onChange={(e) => doUpload(e.target.files[0])}
          />
          {uploading ? (
            <div>
              <Loader2 size={20} className="mx-auto text-blue-500 animate-spin mb-2" />
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <motion.div className="bg-blue-500 h-1.5 rounded-full"
                  animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
              </div>
              <p className="text-xs text-slate-500 mt-1">{progress}%</p>
            </div>
          ) : (
            <>
              <Upload size={20} className={`mx-auto mb-2 ${dragging ? 'text-blue-500' : 'text-slate-400'}`} />
              <p className="text-sm font-medium text-slate-600">{t('case.dropFiles')}</p>
              <p className="text-xs text-slate-400 mt-1">{t('case.fileTypes')}</p>
            </>
          )}
        </motion.div>
      )}

      {files.length === 0 && !isOwner && (
        <p className="text-center text-slate-400 text-sm py-4">{t('case.noFiles')}</p>
      )}

      {/* Image thumbnails grid */}
      {imageFiles.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
          <AnimatePresence>
            {imageFiles.map((file, idx) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                whileHover={{ scale: 1.03 }}
                className="relative group aspect-square rounded-xl overflow-hidden cursor-pointer border border-slate-200 bg-slate-100"
                onClick={() => setLightboxIdx(idx)}
              >
                <img
                  src={`/uploads/${file.filename}`}
                  alt={file.originalName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn size={20} className="text-white drop-shadow" />
                </div>
                {isOwner && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                    className="absolute top-1.5 right-1.5 p-1 bg-rose-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  >
                    <Trash2 size={10} className="text-white" />
                  </motion.button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Non-image file list */}
      {otherFiles.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence>
            {otherFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                  <FileIcon mimetype={file.mimetype} />
                </div>
                <div className="flex-1 min-w-0">
                  <a href={`/uploads/${file.filename}`} target="_blank" rel="noreferrer"
                    className="text-xs font-semibold text-slate-800 truncate hover:text-blue-600 transition-colors block">
                    {file.originalName}
                  </a>
                  <p className="text-xs text-slate-400">
                    {format.fileSize(file.size)} · {file.uploadedBy?.name} · {format.relative(file.createdAt)}
                  </p>
                </div>
                {isOwner && (
                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(file.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </motion.button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && imageFiles[lightboxIdx] && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/92 z-[60] flex items-center justify-center"
            onClick={() => setLightboxIdx(null)}
          >
            {/* Main image */}
            <motion.img
              key={lightboxIdx}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              src={`/uploads/${imageFiles[lightboxIdx].filename}`}
              alt={imageFiles[lightboxIdx].originalName}
              className="max-w-[88vw] max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Close */}
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setLightboxIdx(null)}
              className="absolute top-4 right-4 p-2.5 bg-white/15 hover:bg-white/25 rounded-full text-white backdrop-blur-sm transition-colors"
            >
              <X size={18} />
            </motion.button>

            {/* Prev / Next */}
            {imageFiles.length > 1 && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i - 1 + imageFiles.length) % imageFiles.length); }}
                  className="absolute left-4 p-3 bg-white/15 hover:bg-white/25 rounded-full text-white backdrop-blur-sm transition-colors"
                >
                  <ChevronLeft size={22} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i + 1) % imageFiles.length); }}
                  className="absolute right-4 p-3 bg-white/15 hover:bg-white/25 rounded-full text-white backdrop-blur-sm transition-colors"
                >
                  <ChevronRight size={22} />
                </motion.button>
              </>
            )}

            {/* Caption */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-5 text-center pointer-events-none px-4"
            >
              <p className="text-white text-sm font-medium drop-shadow">{imageFiles[lightboxIdx].originalName}</p>
              {imageFiles.length > 1 && (
                <p className="text-white/50 text-xs mt-1">{lightboxIdx + 1} / {imageFiles.length}</p>
              )}
            </motion.div>

            {/* Dot indicators */}
            {imageFiles.length > 1 && (
              <div className="absolute bottom-14 flex gap-1.5">
                {imageFiles.map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setLightboxIdx(i); }}
                    animate={{ width: i === lightboxIdx ? 16 : 6, opacity: i === lightboxIdx ? 1 : 0.4 }}
                    className="h-1.5 rounded-full bg-white"
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Due date badge ────────────────────────────────────────────────────────────
const DueDateBadge = ({ dueDate, status }) => {
  if (!dueDate || status === 'COMPLETED') return <span className="font-semibold text-slate-700 text-sm">{format.date(dueDate)}</span>;
  const severity = format.daysLeftSeverity(dueDate);
  const label    = format.daysLeftLabel(dueDate);
  const colorMap = {
    overdue: 'text-rose-600',
    today:   'text-orange-600',
    soon:    'text-amber-600',
    ok:      'text-slate-700',
  };
  return (
    <div className="flex items-center gap-1.5">
      <span className={`font-semibold text-sm ${colorMap[severity] || 'text-slate-700'}`}>{format.date(dueDate)}</span>
      {label && (
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
          severity === 'overdue' ? 'bg-rose-100 text-rose-600' :
          severity === 'today'   ? 'bg-orange-100 text-orange-600' :
          severity === 'soon'    ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
        }`}>
          {label}
        </span>
      )}
    </div>
  );
};

const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
const STATUSES   = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, canDo } = useAuth();
  const { t } = useTranslation();
  const [caseData, setCaseData]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('steps');
  const [showEditModal, setShowEditModal]       = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm]       = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [crownTypes,  setCrownTypes]  = useState([]);

  useEffect(() => {
    casesAPI.getById(id)
      .then((res) => setCaseData(res.data))
      .catch(() => { toast.error('Case not found'); navigate('/cases'); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (isAdmin) {
      authAPI.getUsers()
        .then((res) => setTechnicians(res.data.filter((u) => u.role === 'TECHNICIAN')))
        .catch(() => {});
    }
  }, [isAdmin]);

  useEffect(() => {
    crownTypeAPI.getAll(false)
      .then((res) => setCrownTypes(res.data))
      .catch(() => {});
  }, []);

  // Delay notification — fires once after data loads
  useEffect(() => {
    if (!caseData) return;
    const severity = format.daysLeftSeverity(caseData.dueDate);
    if (severity === 'overdue' && caseData.status !== 'COMPLETED') {
      const days = Math.abs(format.daysLeft(caseData.dueDate));
      toast.error(`${t('case.overdueWarning')} ${days} ${t('case.daysAgo')}`, {
        duration: 5000,
        icon: '⚠️',
      });
    } else if (severity === 'today' && caseData.status !== 'COMPLETED') {
      toast(`${t('case.dueTodayWarning')}`, { icon: '📅', duration: 4000 });
    }
  }, [caseData?.id]);

  const handleComplete = async (stepId) => {
    try {
      const res = await stepsAPI.complete(stepId);
      setCaseData(res.data.case);
      if (res.data.done) {
        toast.success('🎉 ' + t('case.caseComplete'), { duration: 4000 });
      } else {
        toast.success(`✓ ${res.data.nextStep?.step?.name || 'Next step'}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete step');
    }
  };

  const openEditModal = () => {
    setEditForm({
      patientName:  caseData.patientName,
      doctorName:   caseData.doctorName,
      crownType:    caseData.crownType,
      priority:     caseData.priority,
      status:       caseData.status,
      dueDate:      caseData.dueDate ? caseData.dueDate.split('T')[0] : '',
      technicianId: caseData.technicianId ?? '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const res = await casesAPI.update(id, {
        ...editForm,
        technicianId: editForm.technicianId || null,
        dueDate:      editForm.dueDate || null,
      });
      setCaseData((prev) => ({ ...prev, ...res.data }));
      setShowEditModal(false);
      toast.success(t('case.saveChanges') + ' ✓');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update case');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await casesAPI.delete(id);
      toast.success(t('case.deleteCase') + ' ✓');
      navigate('/cases');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete case');
      setDeleteLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
          className="w-10 h-10 border-2 border-blue-200 border-t-blue-600 rounded-full"
        />
        <p className="text-sm text-slate-500">{t('case.loading')}</p>
      </div>
    </div>
  );

  if (!caseData) return null;

  const steps          = caseData.caseSteps || [];
  const completedCount = steps.filter((s) => s.status === 'COMPLETED').length;
  const progress       = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;
  const currentStep    = steps.find((s) => s.status === 'CURRENT');
  const isOwner        = isAdmin || caseData.technicianId === user?.id;
  const isDigital      = caseData.caseType === 'DIGITAL';
  const fileCount      = caseData.files?.length ?? 0;

  const tabs = [
    { key: 'steps',    label: t('case.tabSteps'),    badge: steps.length },
    { key: 'timeline', label: t('case.tabTimeline'),  badge: completedCount },
    { key: 'files',    label: t('case.tabFiles'),     badge: fileCount },
  ];

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Link to="/cases" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft size={15} /> {t('case.backToCases')}
          </Link>
        </motion.div>

        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm"
        >
          <motion.div
            className={`h-1.5 ${isDigital ? 'bg-violet-500' : 'bg-amber-500'}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ transformOrigin: 'start' }}
          />
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4">
                <motion.div
                  whileHover={{ rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 0.4 }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    isDigital ? 'bg-violet-100 text-violet-600' : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  {isDigital ? <Cpu size={22} /> : <Wrench size={22} />}
                </motion.div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="text-xl font-bold text-slate-900">{caseData.patientName}</h1>
                    <StatusBadge status={caseData.status} size="md" />
                    <PriorityBadge priority={caseData.priority} />
                  </div>
                  <p className="text-slate-500 text-sm">{caseData.crownType} · {t('cases.caseNumber')}{caseData.id}</p>
                  {(() => {
                    const teeth = caseData.toothNumbers
                      ? (() => { try { return JSON.parse(caseData.toothNumbers); } catch { return []; } })()
                      : caseData.toothNumber ? [caseData.toothNumber] : [];
                    return teeth.length > 0 ? (
                      <p className="text-sm text-blue-600 font-medium mt-0.5 flex items-center gap-1 flex-wrap">
                        🦷 {t('case.toothLabel')}
                        {teeth.sort((a, b) => a - b).map((n) => (
                          <span key={n} className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 rounded-md text-xs font-bold">#{n}</span>
                        ))}
                      </p>
                    ) : null;
                  })()}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <AnimatePresence>
                  {caseData.status === 'COMPLETED' && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl border border-emerald-200"
                    >
                      <Trophy size={16} />
                      <span className="text-sm font-semibold">{t('case.caseComplete')}</span>
                    </motion.div>
                  )}
                  {caseData.status === 'DELAYED' && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-2 bg-rose-50 text-rose-700 px-3 py-2 rounded-xl border border-rose-200"
                    >
                      <AlertTriangle size={16} />
                      <span className="text-sm font-semibold">{t('case.delayed')}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                {canDo.editCase && (
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={openEditModal}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200 text-sm font-semibold hover:bg-blue-100 transition-colors"
                  >
                    <Pencil size={14} /> {t('case.editCase')}
                  </motion.button>
                )}
                {canDo.deleteCase && (
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 text-sm font-semibold hover:bg-rose-100 transition-colors"
                  >
                    <Trash2 size={14} /> {t('case.deleteCase')}
                  </motion.button>
                )}
              </div>
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 text-sm">
              {[
                { icon: Stethoscope, label: t('case.doctor'),     content: <span className="font-semibold text-slate-700 text-sm">{caseData.doctorName}</span> },
                { icon: User,        label: t('case.technician'), content: <span className="font-semibold text-slate-700 text-sm">{caseData.technician?.name || t('case.unassigned')}</span> },
                { icon: Calendar,    label: t('case.created'),    content: <span className="font-semibold text-slate-700 text-sm">{format.date(caseData.createdAt)}</span> },
                { icon: Calendar,    label: t('case.dueDate'),    content: <DueDateBadge dueDate={caseData.dueDate} status={caseData.status} /> },
              ].map(({ icon: Icon, label, content }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex items-start gap-2"
                >
                  <Icon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">{label}</p>
                    {content}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-700">{t('case.overallProgress')}</span>
                  {currentStep && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full"
                    >
                      {t('case.current')}: {currentStep.step.name}
                    </motion.span>
                  )}
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {completedCount} {t('case.of')} {steps.length} {t('case.steps')} ({progress}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <motion.div
                  className={`h-3 rounded-full ${
                    caseData.status === 'COMPLETED' ? 'bg-emerald-500' :
                    caseData.status === 'DELAYED'   ? 'bg-rose-500'   : 'bg-blue-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                {[0, 25, 50, 75, 100].map((m) => (
                  <span key={m} className="text-xs text-slate-300">{m}%</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Teeth diagram */}
        {(() => {
          const caseTeeth = caseData.toothNumbers
            ? (() => { try { return JSON.parse(caseData.toothNumbers); } catch { return []; } })()
            : caseData.toothNumber ? [caseData.toothNumber] : [];
          if (!caseTeeth.length) return null;
          return (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
            >
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span>🦷</span> {t('teeth.title')}
              </h2>
              <TeethDiagram
                caseTeeth={caseTeeth}
                teethCases={caseTeeth.map((n) => ({ toothNumber: n, status: caseData.status }))}
                readOnly compact
              />
            </motion.div>
          );
        })()}

        {/* Workflow tabs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm"
        >
          {/* Tab header */}
          <div className="flex items-center gap-1 px-4 pt-4 border-b border-slate-100">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-t-xl transition-all -mb-px border-b-2 ${
                  activeTab === tab.key
                    ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                    : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.label}
                {tab.badge > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Steps tab */}
          {activeTab === 'steps' && (
            <>
              <div className="flex items-center justify-between px-6 py-3 border-b border-slate-50">
                <div>
                  <p className="text-xs text-slate-400">{steps.length} {t('case.stepsTotal')}</p>
                </div>
                <div className="flex gap-3 text-xs">
                  {[
                    { color: 'bg-emerald-500', label: t('case.statusCompleted') },
                    { color: 'bg-blue-600',    label: t('case.statusActive') },
                    { color: 'bg-slate-200',   label: t('case.statusPending') },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-slate-500">
                      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
              {/* Dot-progress bar */}
              <div className="px-6 py-3 border-b border-slate-50 overflow-x-auto">
                <div className="flex items-center min-w-max">
                  {steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 + idx * 0.03, type: 'spring', stiffness: 300 }}
                        className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          step.status === 'COMPLETED' ? 'bg-emerald-500' :
                          step.status === 'CURRENT'   ? 'bg-blue-600 ring-2 ring-blue-200' : 'bg-slate-200'
                        }`}
                        title={step.step.name}
                      />
                      {idx < steps.length - 1 && (
                        <motion.div
                          className={`h-0.5 w-6 ${step.status === 'COMPLETED' ? 'bg-emerald-300' : 'bg-slate-200'}`}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: 0.35 + idx * 0.03 }}
                          style={{ transformOrigin: 'start' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin">
                {steps.map((step, idx) => (
                  <StepCard key={step.id} step={step} index={idx} onComplete={handleComplete} isOwner={isOwner} />
                ))}
              </div>
            </>
          )}

          {/* Timeline tab */}
          {activeTab === 'timeline' && (
            <div className="p-6">
              <p className="text-xs text-slate-400 mb-4">{t('case.timelineDesc')}</p>
              <StepTimeline steps={steps} />
            </div>
          )}

          {/* Files tab */}
          {activeTab === 'files' && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Paperclip size={15} className="text-slate-400" />
                <p className="text-sm font-bold text-slate-700">{t('case.attachments')}</p>
              </div>
              <AttachmentsSection caseId={parseInt(id)} isOwner={isOwner} />
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Edit case modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showEditModal && editForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => !editLoading && setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Pencil size={16} className="text-blue-600" /> {t('case.editCaseTitle')}
                </h2>
                <button onClick={() => setShowEditModal(false)} disabled={editLoading}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('createCase.patientName')}</label>
                    <input
                      type="text" required
                      value={editForm.patientName}
                      onChange={(e) => setEditForm((f) => ({ ...f, patientName: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('createCase.doctorName')}</label>
                    <input
                      type="text" required
                      value={editForm.doctorName}
                      onChange={(e) => setEditForm((f) => ({ ...f, doctorName: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-slate-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('createCase.crownType')}</label>
                    <select
                      value={editForm.crownType}
                      onChange={(e) => setEditForm((f) => ({ ...f, crownType: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-slate-50"
                    >
                      {crownTypes.map((ct) => <option key={ct.id} value={ct.name}>{ct.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('createCase.priority')}</label>
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-slate-50"
                    >
                      {PRIORITIES.map((p) => <option key={p} value={p}>{t(`priority.${p}`, p)}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('cases.allStatuses').replace('All ', '')}</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-slate-50"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`, s)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('createCase.dueDate')}</label>
                    <input
                      type="date"
                      value={editForm.dueDate}
                      onChange={(e) => setEditForm((f) => ({ ...f, dueDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-slate-50"
                    />
                  </div>
                </div>

                {isAdmin && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('createCase.assignTechnician')}</label>
                    <select
                      value={editForm.technicianId}
                      onChange={(e) => setEditForm((f) => ({ ...f, technicianId: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-slate-50"
                    >
                      <option value="">{t('createCase.unassigned')}</option>
                      {technicians.map((tech) => (
                        <option key={tech.id} value={tech.id}>{tech.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowEditModal(false)} disabled={editLoading}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all">
                    {t('case.cancel')}
                  </button>
                  <button type="submit" disabled={editLoading}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                    {editLoading && <Loader2 size={14} className="animate-spin" />}
                    {editLoading ? t('case.saving') : t('case.saveChanges')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete confirmation modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => !deleteLoading && setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-4">
                <Trash2 size={20} className="text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('case.confirmDeleteTitle')}</h3>
              <p className="text-sm text-slate-500 mb-6">{t('case.confirmDeleteMsg')}</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} disabled={deleteLoading}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all">
                  {t('case.cancel')}
                </button>
                <button onClick={handleDelete} disabled={deleteLoading}
                  className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {deleteLoading && <Loader2 size={14} className="animate-spin" />}
                  {t('case.confirmDeleteBtn')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
