import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import {
  projects, employees, allTickets, getEmployeeById,
  type Project, type Ticket,
} from '@/data/mockData';
import {
  X, FolderPlus, Plus, Bug, UserPlus, CheckCircle2,
  DollarSign, Target, Users, AlertTriangle,
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════
   Dialog Overlay Container
   ════════════════════════════════════════════════════════════ */

export function Dialogs() {
  const createProjectOpen = useStore((s) => s.createProjectDialogOpen);
  const createTaskOpen = useStore((s) => s.createTaskDialogOpen);
  const createBugOpen = useStore((s) => s.createBugDialogOpen);
  const assignTaskOpen = useStore((s) => s.assignTaskDialogOpen);

  return (
    <>
      <AnimatePresence>
        {createProjectOpen && <CreateProjectDialog />}
      </AnimatePresence>
      <AnimatePresence>
        {createTaskOpen && <CreateTaskDialog />}
      </AnimatePresence>
      <AnimatePresence>
        {createBugOpen && <CreateBugDialog />}
      </AnimatePresence>
      <AnimatePresence>
        {assignTaskOpen && <AssignTaskDialog />}
      </AnimatePresence>
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   Create Project Dialog
   ════════════════════════════════════════════════════════════ */

function CreateProjectDialog() {
  const close = useStore((s) => s.closeCreateProject);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('100000');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      close();
    }, 1200);
  };

  return (
    <DialogOverlay onClose={close}>
      {submitted ? (
        <SuccessState icon={<CheckCircle2 size={48} color="#237b4b" />} title="Project Created" message={`${name} is now live and ready for your team.`} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader icon={<FolderPlus size={20} />} title="Create New Project" subtitle="Set up a new workspace for your team" />
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: '#242424' }}>Project Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. API Gateway Refactor"
              className="w-full rounded border px-3 py-2 text-sm outline-none focus:border-[#D97757]" style={{ borderColor: '#d1d1d1' }} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: '#242424' }}>Project Key</label>
            <input type="text" value={key} onChange={(e) => setKey(e.target.value.toUpperCase())} placeholder="e.g. API"
              className="w-full rounded border px-3 py-2 text-sm outline-none focus:border-[#D97757]" style={{ borderColor: '#d1d1d1' }} required maxLength={5} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: '#242424' }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project about?"
              className="w-full resize-none rounded border px-3 py-2 text-sm outline-none focus:border-[#D97757]" style={{ borderColor: '#d1d1d1', minHeight: 60 }} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: '#242424' }}>Budget ($)</label>
            <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm outline-none focus:border-[#D97757]" style={{ borderColor: '#d1d1d1' }} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={close} className="rounded px-4 py-2 text-sm font-medium" style={{ border: '1px solid #d1d1d1', background: '#fff', color: '#616161', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="rounded px-4 py-2 text-sm font-medium text-white" style={{ background: '#D97757', border: 'none', cursor: 'pointer' }}>Create Project</button>
          </div>
        </form>
      )}
    </DialogOverlay>
  );
}

/* ════════════════════════════════════════════════════════════
   Create Task Dialog
   ════════════════════════════════════════════════════════════ */

function CreateTaskDialog() {
  const close = useStore((s) => s.closeCreateTask);
  const activeProjectId = useStore((s) => s.activeDialogProjectId);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('story');
  const [priority, setPriority] = useState('medium');
  const [estimate, setEstimate] = useState('5');
  const [assignee, setAssignee] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const project = projects.find((p) => p.id === activeProjectId);
  const humanEmployees = employees.filter((e) => e.kind === 'human');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitted(true);
    setTimeout(() => close(), 1200);
  };

  return (
    <DialogOverlay onClose={close}>
      {submitted ? (
        <SuccessState icon={<CheckCircle2 size={48} color="#237b4b" />} title="Task Created" message={`${title} added to ${project?.name || 'project'}.`} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader icon={<Plus size={20} />} title="Create New Task" subtitle={project?.name || 'Select a project'} />
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: '#242424' }}>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?"
              className="w-full rounded border px-3 py-2 text-sm outline-none focus:border-[#D97757]" style={{ borderColor: '#d1d1d1' }} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: '#242424' }}>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded border px-3 py-2 text-sm outline-none" style={{ borderColor: '#d1d1d1' }}>
                <option value="story">Story</option>
                <option value="task">Task</option>
                <option value="epic">Epic</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: '#242424' }}>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full rounded border px-3 py-2 text-sm outline-none" style={{ borderColor: '#d1d1d1' }}>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: '#242424' }}>Estimate (pts)</label>
              <input type="number" value={estimate} onChange={(e) => setEstimate(e.target.value)} min="1" max="100"
                className="w-full rounded border px-3 py-2 text-sm outline-none focus:border-[#D97757]" style={{ borderColor: '#d1d1d1' }} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: '#242424' }}>Assignee</label>
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-full rounded border px-3 py-2 text-sm outline-none" style={{ borderColor: '#d1d1d1' }}>
                <option value="">Unassigned</option>
                {humanEmployees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name} — {e.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={close} className="rounded px-4 py-2 text-sm font-medium" style={{ border: '1px solid #d1d1d1', background: '#fff', color: '#616161', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="rounded px-4 py-2 text-sm font-medium text-white" style={{ background: '#D97757', border: 'none', cursor: 'pointer' }}>Create Task</button>
          </div>
        </form>
      )}
    </DialogOverlay>
  );
}

/* ════════════════════════════════════════════════════════════
   Create Bug Dialog
   ════════════════════════════════════════════════════════════ */

function CreateBugDialog() {
  const close = useStore((s) => s.closeCreateBug);
  const activeProjectId = useStore((s) => s.activeDialogProjectId);
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState('high');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const project = projects.find((p) => p.id === activeProjectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitted(true);
    setTimeout(() => close(), 1200);
  };

  return (
    <DialogOverlay onClose={close}>
      {submitted ? (
        <SuccessState icon={<CheckCircle2 size={48} color="#c4314b" />} title="Bug Reported" message={`${title} logged in ${project?.name || 'project'}.`} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader icon={<Bug size={20} />} title="Report a Bug" subtitle={project?.name || 'Select a project'} />
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: '#242424' }}>Bug Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Describe the bug briefly"
              className="w-full rounded border px-3 py-2 text-sm outline-none focus:border-[#c4314b]" style={{ borderColor: '#d1d1d1' }} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: '#242424' }}>Severity</label>
            <div className="flex gap-2">
              {['critical', 'high', 'medium', 'low'].map((s) => (
                <button key={s} type="button" onClick={() => setSeverity(s)}
                  className="flex-1 rounded py-2 text-xs font-semibold"
                  style={{
                    background: severity === s ? (s === 'critical' ? '#c4314b' : s === 'high' ? '#f59e0b' : '#D97757') : '#f0f0f0',
                    color: severity === s ? '#fff' : '#616161',
                    border: 'none',
                    cursor: 'pointer',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: '#242424' }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Steps to reproduce, expected vs actual behavior..."
              className="w-full resize-none rounded border px-3 py-2 text-sm outline-none focus:border-[#c4314b]" style={{ borderColor: '#d1d1d1', minHeight: 80 }} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={close} className="rounded px-4 py-2 text-sm font-medium" style={{ border: '1px solid #d1d1d1', background: '#fff', color: '#616161', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="rounded px-4 py-2 text-sm font-medium text-white" style={{ background: '#c4314b', border: 'none', cursor: 'pointer' }}>Report Bug</button>
          </div>
        </form>
      )}
    </DialogOverlay>
  );
}

/* ════════════════════════════════════════════════════════════
   Assign Task Dialog
   ════════════════════════════════════════════════════════════ */

function AssignTaskDialog() {
  const close = useStore((s) => s.closeAssignTask);
  const activeProjectId = useStore((s) => s.activeDialogProjectId);
  const [taskId, setTaskId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const project = projects.find((p) => p.id === activeProjectId);
  const unassignedTasks = allTickets.filter((t) => t.projectId === activeProjectId && !t.assigneeId);
  const humanEmployees = employees.filter((e) => e.kind === 'human');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId || !assigneeId) return;
    setSubmitted(true);
    setTimeout(() => close(), 1200);
  };

  return (
    <DialogOverlay onClose={close}>
      {submitted ? (
        <SuccessState icon={<UserPlus size={48} color="#D97757" />} title="Task Assigned" message="Team member notified and task added to their queue." />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader icon={<UserPlus size={20} />} title="Assign Task" subtitle={project?.name || 'Select a project'} />
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: '#242424' }}>Select Task</label>
            <select value={taskId} onChange={(e) => setTaskId(e.target.value)} className="w-full rounded border px-3 py-2 text-sm outline-none" style={{ borderColor: '#d1d1d1' }} required>
              <option value="">Choose a task...</option>
              {unassignedTasks.map((t) => (
                <option key={t.id} value={t.id}>{t.key}: {t.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: '#242424' }}>Assign To</label>
            <div className="space-y-1.5">
              {humanEmployees.map((e) => (
                <button key={e.id} type="button" onClick={() => setAssigneeId(e.id)}
                  className="flex w-full items-center gap-2 rounded border p-2 text-left"
                  style={{ borderColor: assigneeId === e.id ? '#D97757' : '#d1d1d1', background: assigneeId === e.id ? '#e8eaf6' : '#fff' }}>
                  <div className="h-7 w-7 rounded-full" style={{ background: '#e8eaf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#D97757' }}>{e.name.substring(0, 2)}</div>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: '#242424' }}>{e.name}</div>
                    <div className="text-[10px]" style={{ color: '#616161' }}>{e.title}</div>
                  </div>
                  {assigneeId === e.id && <CheckCircle2 size={14} color="#D97757" className="ml-auto" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={close} className="rounded px-4 py-2 text-sm font-medium" style={{ border: '1px solid #d1d1d1', background: '#fff', color: '#616161', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="rounded px-4 py-2 text-sm font-medium text-white" style={{ background: '#D97757', border: 'none', cursor: 'pointer' }}>Assign Task</button>
          </div>
        </form>
      )}
    </DialogOverlay>
  );
}

/* ════════════════════════════════════════════════════════════
   Dialog Primitives
   ════════════════════════════════════════════════════════════ */

function DialogOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-[440px] rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-3 top-3 rounded p-1 hover:bg-gray-100" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
          <X size={16} color="#8a8a8a" />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}

function DialogHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: '#e8eaf6' }}>{icon}</div>
      <div>
        <h3 className="text-base font-semibold" style={{ color: '#242424' }}>{title}</h3>
        <p className="text-xs" style={{ color: '#616161' }}>{subtitle}</p>
      </div>
    </div>
  );
}

function SuccessState({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="mb-3">{icon}</div>
      <h3 className="text-lg font-semibold" style={{ color: '#242424' }}>{title}</h3>
      <p className="mt-1 text-sm" style={{ color: '#616161' }}>{message}</p>
    </div>
  );
}
