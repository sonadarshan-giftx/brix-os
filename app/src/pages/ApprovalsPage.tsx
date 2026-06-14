import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { employees } from '@/data/mockData';
import { Card } from '@/components/shared/Card';
import { TabsBar } from '@/components/shared/TabsBar';
import { confirmAction, showToast, escapeHtml } from '@/utils/helpers';
import type { Approval } from '@/data/mockData';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  UserCheck,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  AlertTriangle,
  Search,
  Pencil,
  X,
} from 'lucide-react';

/* ═══════════════════════════════════════════
   Local Enrichment Types
   ═══════════════════════════════════════════ */
type DisplayPriority = 'high' | 'medium' | 'low';

interface DisplayApproval extends Approval {
  requesterName: string;
  approverName: string;
  priority: DisplayPriority;
  deadline: string;
  amount?: number;
  stage?: string;
  comment?: string;
  decidedAt?: string;
}

/* Map store Approval to display-enriched format */
function enrichApproval(a: Approval): DisplayApproval {
  const requester = employees.find((e) => e.id === a.requesterId);
  const approver = employees.find((e) => e.id === a.approverId);
  // Derive synthetic priority from approval type
  const priorityMap: Record<string, DisplayPriority> = {
    deploy: 'high',
    'pr-review': 'medium',
    budget: 'high',
    'customer-comm': 'medium',
    policy: 'low',
  };
  // Derive synthetic amount from budget approvals
  const amountMap: Record<string, number> = {
    'apr-3': 4500,
    'apr-7': 1440,
    'apr-12': 2100,
    'apr-17': 12000,
  };
  return {
    ...a,
    requesterName: requester?.name || a.requesterId,
    approverName: approver?.name || a.approverId,
    priority: priorityMap[a.type] || 'medium',
    deadline: formatDate(a.dueAt),
    amount: amountMap[a.id],
    stage: a.status === 'pending' ? 'Awaiting Review' : a.status === 'approved' ? 'Completed' : 'Closed',
    comment: undefined,
    decidedAt: a.status !== 'pending' ? a.createdAt : undefined,
  };
}

/* ═══════════════════════════════════════════
   Date formatter
   ═══════════════════════════════════════════ */
function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
  } catch {
    return iso;
  }
}

/* ═══════════════════════════════════════════
   ApprovalsPage
   ═══════════════════════════════════════════ */
export default function ApprovalsPage() {  useEffect(() => { document.title = "Approvals" + " - BrixOS"; }, []);

  // Single source of truth: Zustand store
  const storeApprovals = useStore((s) => s.approvals);
  const updateApproval = useStore((s) => s.updateApproval);

  // Enrich store approvals for display
  const items = useMemo(() => storeApprovals.map(enrichApproval), [storeApprovals]);

  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [selectedApproval, setSelectedApproval] = useState<DisplayApproval | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');

  // Derive counts from the SAME data source
  const pendingCount = items.filter((a) => a.status === 'pending').length;
  const approvedCount = items.filter((a) => a.status === 'approved').length;
  const rejectedCount = items.filter((a) => a.status === 'rejected').length;
  const highRiskCount = items.filter((a) => a.status === 'pending' && a.priority === 'high').length;

  // Update store badge — use getter, not setter
  useEffect(() => {
    useStore.setState({ approvalCount: pendingCount });
  }, [pendingCount]);

  const tabs = [
    { id: 'pending', label: `Pending (${pendingCount})` },
    { id: 'approved', label: `Approved (${approvedCount})` },
    { id: 'rejected', label: `Rejected (${rejectedCount})` },
    { id: 'analytics', label: 'Analytics' },
  ];

  const filtered = useMemo(() => {
    const base = items.filter((a) => {
      if (activeTab === 'pending') return a.status === 'pending';
      if (activeTab === 'approved') return a.status === 'approved';
      if (activeTab === 'rejected') return a.status === 'rejected';
      return true;
    });
    if (!search) return base;
    const q = search.toLowerCase();
    return base.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.requesterName.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q)
    );
  }, [items, activeTab, search]);

  // Budget threshold: flag items where amount is > 50% of some threshold ($100K)
  const BUDGET_THRESHOLD = 100000;
  const overBudgetThreshold = (amount?: number) => {
    if (!amount || amount <= 0) return false;
    return amount > BUDGET_THRESHOLD * 0.5; // > 50% of $100K = > $50K
  };

  const handleApprove = useCallback(
    (id: string, withComment?: string) => {
      if (!confirmAction('Are you sure you want to approve this request?')) return;
      setIsLoading(id);
      setError(null);
      setTimeout(() => {
        // Update the Zustand store — single source of truth
        updateApproval(id, {
          status: 'approved',
          title: selectedApproval?.title || storeApprovals.find((a) => a.id === id)?.title || '',
        });
        // Update local comment on the selected approval for display
        if (selectedApproval && selectedApproval.id === id) {
          setSelectedApproval((prev) => prev ? { ...prev, status: 'approved' as const, comment: withComment || prev.comment, decidedAt: new Date().toISOString() } : null);
        }
        setIsLoading(null);
        setIsDetailOpen(false);
        setSelectedApproval(null);
        setComment('');
        showToast('Request approved', 'success');
      }, 400);
    },
    [updateApproval, selectedApproval, storeApprovals]
  );

  const handleReject = useCallback(
    (id: string, withComment?: string) => {
      if (!confirmAction('Are you sure you want to reject this request?')) return;
      if (!withComment || !withComment.trim()) {
        setError('Please provide a reason for rejection');
        return;
      }
      setIsLoading(id);
      setError(null);
      setTimeout(() => {
        // Update the Zustand store — single source of truth
        updateApproval(id, {
          status: 'rejected',
          title: selectedApproval?.title || storeApprovals.find((a) => a.id === id)?.title || '',
        });
        if (selectedApproval && selectedApproval.id === id) {
          setSelectedApproval((prev) => prev ? { ...prev, status: 'rejected' as const, comment: withComment, decidedAt: new Date().toISOString() } : null);
        }
        setIsLoading(null);
        setIsDetailOpen(false);
        setSelectedApproval(null);
        setComment('');
        showToast('Request rejected', 'info');
      }, 400);
    },
    [updateApproval, selectedApproval, storeApprovals]
  );

  const handleEditSend = useCallback(
    (approval: DisplayApproval) => {
      setSelectedApproval(approval);
      setEditTitle(approval.title);
      setIsEditing(true);
      setIsDetailOpen(true);
      setError(null);
    },
    []
  );

  const handleSaveEdit = useCallback(
    (id: string) => {
      const cleanTitle = escapeHtml(editTitle.trim());
      if (!cleanTitle || cleanTitle.length < 3) {
        setError('Title must be at least 3 characters');
        return;
      }
      // Update the Zustand store
      updateApproval(id, { title: cleanTitle });
      setIsEditing(false);
      setIsDetailOpen(false);
      setSelectedApproval(null);
      setError(null);
      showToast('success');
    },
    [editTitle, updateApproval]
  );

  const handleViewDetail = useCallback((approval: DisplayApproval) => {
    setSelectedApproval(approval);
    setIsEditing(false);
    setIsDetailOpen(true);
    setError(null);
    setComment('');
  }, []);

  const closeDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedApproval(null);
    setIsEditing(false);
    setError(null);
    setComment('');
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div
        className="flex flex-shrink-0 items-center justify-between"
        style={{
          height: 48,
          padding: '0 16px',
          borderBottom: '1px solid #e1e1e1',
        }}
        role="banner"
      >
        <div className="flex items-center gap-2">
          <h1 style={{ fontSize: 16, fontWeight: 600, color: '#242424' }}>Approvals</h1>
          <div
            className="rounded-full"
            style={{
              width: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
              background: '#c4314b',
              color: '#fff',
            }}
            role="status"
            aria-label={`${pendingCount} pending approvals`}
          >
            {pendingCount}
          </div>
          {highRiskCount > 0 && (
            <div
              className="flex items-center gap-1 rounded-full"
              style={{
                padding: '2px 8px',
                fontSize: 10,
                fontWeight: 600,
                background: '#fef3c7',
                color: '#b56200',
              }}
              role="alert"
            >
              <AlertTriangle size={10} aria-hidden="true" />
              {highRiskCount} high-risk
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1 rounded"
            style={{ height: 30, border: '1px solid #d1d1d1', padding: '0 8px', background: '#fff' }}
          >
            <Search size={14} color="#a0a0a0" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search approvals..."
              aria-label="Search approvals"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none"
              style={{ fontSize: 12, width: 160 }}
            />
          </div>
          <button
            className="flex cursor-pointer items-center gap-1 rounded"
            style={{
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 500,
              background: '#D97757',
              color: '#fff',
              border: 'none',
            }}
            onClick={() => {
              showToast('info');
            }}
            aria-label="Create new approval request"
          >
            <span style={{ fontSize: 14 }}>+</span>
            New Request
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <TabsBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ── Loading indicator ── */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2" style={{ padding: 4 }}>
          <Loader2 size={14} className="animate-spin" color="#D97757" />
          <span style={{ fontSize: 12, color: '#D97757' }}>Processing...</span>
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center justify-between rounded" style={{ margin: '4px 16px', padding: '6px 12px', background: '#fef2f2', border: '1px solid #fecaca' }}>
          <span className="flex items-center gap-1" style={{ fontSize: 12, color: '#c4314b' }}>
            <AlertTriangle size={14} aria-hidden="true" /> {error}
          </span>
          <button onClick={() => setError(null)} className="cursor-pointer" style={{ border: 'none', background: 'transparent' }} aria-label="Dismiss error">
            <X size={14} color="#c4314b" />
          </button>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto" style={{ padding: '0 16px 16px' }}>
          {activeTab === 'analytics' ? (
            <ApprovalsAnalytics items={items} />
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center rounded"
              style={{
                margin: '40px auto',
                padding: 48,
                maxWidth: 400,
                border: '1px dashed #d1d1d1',
                background: '#fafafa',
              }}
            >
              <CheckCircle2 size={40} color="#92c353" />
              <p style={{ fontSize: 14, fontWeight: 500, color: '#616161', marginTop: 12 }}>
                {search ? 'No approvals match your search' : activeTab === 'pending' ? 'All caught up!' : `No ${activeTab} approvals`}
              </p>
              <p style={{ fontSize: 12, color: '#767676', marginTop: 4 }}>
                {search ? 'Try different keywords' : 'No items to display'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <ApprovalCard
                  key={item.id}
                  item={item}
                  isLoading={isLoading === item.id}
                  budgetFlag={overBudgetThreshold(item.amount)}
                  onApprove={() => handleApprove(item.id, comment)}
                  onReject={() => handleReject(item.id, comment)}
                  onEditSend={() => handleEditSend(item)}
                  onViewDetail={() => handleViewDetail(item)}
                  showActions={activeTab === 'pending'}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Detail / Edit Panel ── */}
        {isDetailOpen && selectedApproval && (
          <div
            className="flex flex-shrink-0 flex-col overflow-auto"
            style={{ width: 380, borderLeft: '1px solid #e1e1e1', background: '#fff' }}
            role="complementary"
            aria-label="Approval details"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between" style={{ padding: '12px 16px', borderBottom: '1px solid #e1e1e1' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#242424' }}>
                {isEditing ? 'Edit Approval' : 'Approval Details'}
              </span>
              <button onClick={closeDetail} className="cursor-pointer rounded p-2 hover:bg-[#f0f0f0]" style={{ border: 'none', background: 'transparent', minWidth: 44, minHeight: 44 }} aria-label="Close panel">
                <X size={16} color="#616161" />
              </button>
            </div>

            <div style={{ padding: 16 }}>
              {/* Edit mode */}
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase' }}>Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="mt-1 w-full rounded outline-none"
                      style={{ height: 32, padding: '0 10px', fontSize: 13, border: '1px solid #d1d1d1' }}
                      aria-label="Edit title"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase' }}>Requester</label>
                    <p style={{ fontSize: 13, color: '#242424', marginTop: 4 }}>{selectedApproval.requesterName}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase' }}>Type</label>
                    <p style={{ fontSize: 13, color: '#242424', marginTop: 4 }}>{selectedApproval.type}</p>
                  </div>
                  <div className="flex gap-2" style={{ marginTop: 16 }}>
                    <button
                      onClick={() => handleSaveEdit(selectedApproval.id)}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded"
                      style={{ padding: '8px 0', fontSize: 13, fontWeight: 500, background: '#D97757', color: '#fff', border: 'none' }}
                    >
                      <Send size={14} aria-hidden="true" /> Save &amp; Send
                    </button>
                    <button
                      onClick={() => { setIsEditing(false); setError(null); }}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded"
                      style={{ padding: '8px 0', fontSize: 13, fontWeight: 500, border: '1px solid #d1d1d1', background: '#fff', color: '#616161' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <>
                  {/* Status badge */}
                  <div className="mb-4 flex items-center gap-2">
                    <span className="rounded-full" style={{
                      padding: '2px 10px', fontSize: 11, fontWeight: 600,
                      background: selectedApproval.status === 'approved' ? 'rgba(146,195,83,0.15)' : selectedApproval.status === 'rejected' ? 'rgba(196,49,75,0.15)' : 'rgba(255,170,68,0.15)',
                      color: selectedApproval.status === 'approved' ? '#237b4b' : selectedApproval.status === 'rejected' ? '#c4314b' : '#b56200',
                    }}>
                      {selectedApproval.status === 'approved' ? 'Approved' : selectedApproval.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                    {selectedApproval.decidedAt && (
                      <span style={{ fontSize: 11, color: '#767676' }}>
                        {new Date(selectedApproval.decidedAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <h2 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 8 }}>{selectedApproval.title}</h2>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <UserCheck size={14} color="#616161" aria-hidden="true" />
                      <span style={{ fontSize: 12, color: '#616161' }}>Requester: </span>
                      <span style={{ fontSize: 12, color: '#242424', fontWeight: 500 }}>{selectedApproval.requesterName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} color="#616161" aria-hidden="true" />
                      <span style={{ fontSize: 12, color: '#616161' }}>Deadline: </span>
                      <span style={{ fontSize: 12, color: '#242424', fontWeight: 500 }}>{formatDate(selectedApproval.deadline)}</span>
                    </div>
                    {selectedApproval.amount !== undefined && (
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 12, color: '#616161' }}>Amount: </span>
                        <span style={{ fontSize: 12, color: '#242424', fontWeight: 500 }}>
                          ${selectedApproval.amount.toLocaleString()}
                        </span>
                        {overBudgetThreshold(selectedApproval.amount) && (
                          <span className="flex items-center gap-0.5 rounded-full" style={{ padding: '1px 6px', fontSize: 10, fontWeight: 600, background: '#fef3c7', color: '#b56200' }}>
                            <AlertTriangle size={9} /> &gt;50% of threshold
                          </span>
                        )}
                      </div>
                    )}
                    {selectedApproval.stage && (
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 12, color: '#616161' }}>Stage: </span>
                        <span className="rounded-full" style={{ padding: '2px 8px', fontSize: 10, background: '#e8eaf6', color: '#D97757' }}>{selectedApproval.stage}</span>
                      </div>
                    )}
                  </div>

                  {/* Comment history */}
                  {selectedApproval.comment && (
                    <div className="mt-4 rounded" style={{ padding: 10, background: '#f8f8f8' }}>
                      <div className="flex items-center gap-1" style={{ marginBottom: 4 }}>
                        <MessageSquare size={12} color="#616161" aria-hidden="true" />
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase' }}>Comment</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#242424' }}>{selectedApproval.comment}</p>
                    </div>
                  )}

                  {/* Pending actions */}
                  {selectedApproval.status === 'pending' && (
                    <>
                      {/* Comment input */}
                      <div className="mt-4">
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                          Comment
                        </label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Add a comment (required for rejection)..."
                          className="w-full resize-none rounded outline-none"
                          rows={3}
                          style={{ padding: '8px 10px', fontSize: 12, border: '1px solid #d1d1d1' }}
                          aria-label="Approval comment"
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => handleApprove(selectedApproval.id, comment)}
                          disabled={isLoading === selectedApproval.id}
                          className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded"
                          style={{ padding: '8px 0', fontSize: 13, fontWeight: 500, background: '#237b4b', color: '#fff', border: 'none', opacity: isLoading === selectedApproval.id ? 0.7 : 1 }}
                        >
                          {isLoading === selectedApproval.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(selectedApproval.id, comment)}
                          disabled={isLoading === selectedApproval.id}
                          className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded"
                          style={{ padding: '8px 0', fontSize: 13, fontWeight: 500, border: '1px solid #c4314b', background: '#fff', color: '#c4314b', opacity: isLoading === selectedApproval.id ? 0.7 : 1 }}
                        >
                          {isLoading === selectedApproval.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                          Reject
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ApprovalCard
   ═══════════════════════════════════════════ */
function ApprovalCard({
  item,
  isLoading,
  budgetFlag,
  onApprove,
  onReject,
  onEditSend,
  onViewDetail,
  showActions,
}: {
  item: DisplayApproval;
  isLoading: boolean;
  budgetFlag: boolean;
  onApprove: () => void;
  onReject: () => void;
  onEditSend: () => void;
  onViewDetail: () => void;
  showActions: boolean;
}) {
  return (
    <Card
      hoverable
      onClick={onViewDetail}
      className="cursor-pointer"
      role="listitem"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onViewDetail(); } }}
      aria-label={`${item.title} by ${item.requesterName}, ${item.status}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3" style={{ flex: 1, minWidth: 0 }}>
          <div className="mt-0.5 flex-shrink-0">
            {item.type === 'PR' ? (
              <CodeIcon />
            ) : item.type === 'spend' ? (
              <SpendIcon />
            ) : item.type === 'deploy' ? (
              <DeployIcon />
            ) : item.type === 'budget' ? (
              <BudgetIcon />
            ) : (
              <CheckCircle2 size={18} color="#D97757" />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="truncate" style={{ fontSize: 14, fontWeight: 500, color: '#242424' }}>
                {item.title}
              </span>
              <span className="rounded-full" style={{
                padding: '1px 6px', fontSize: 10, fontWeight: 600,
                background: item.priority === 'high' ? '#fef3c7' : '#f0f0f0',
                color: item.priority === 'high' ? '#b56200' : '#616161',
              }}>
                {item.priority === 'high' ? '!' : ''} {item.priority}
              </span>
              {budgetFlag && (
                <span className="flex items-center gap-0.5 rounded-full" style={{ padding: '1px 6px', fontSize: 10, fontWeight: 600, background: '#fef3c7', color: '#b56200' }}>
                  <AlertTriangle size={9} /> Budget
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap" style={{ marginTop: 6 }}>
              <span style={{ fontSize: 12, color: '#616161' }}>{item.requesterName}</span>
              <span className="rounded-full" style={{ padding: '1px 6px', fontSize: 10, background: '#f0f0f0', color: '#616161' }}>{item.type}</span>
              <span className="flex items-center gap-1" style={{ fontSize: 11, color: '#767676' }}>
                <Clock size={11} aria-hidden="true" /> {formatDate(item.deadline)}
              </span>
              {item.amount !== undefined && (
                <span style={{ fontSize: 12, color: '#242424', fontWeight: 500 }}>${item.amount.toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>
        {showActions && (
          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => { e.stopPropagation(); onApprove(); }}
              disabled={isLoading}
              className="cursor-pointer rounded"
              style={{ padding: '4px 8px', fontSize: 11, border: '1px solid #237b4b', color: '#237b4b', background: 'transparent', opacity: isLoading ? 0.5 : 1 }}
              aria-label={`Approve ${item.title}`}
            >
              {isLoading ? <Loader2 size={12} className="animate-spin" /> : <ThumbsUp size={12} aria-hidden="true" />}
              Approve
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onReject(); }}
              disabled={isLoading}
              className="cursor-pointer rounded"
              style={{ padding: '4px 8px', fontSize: 11, border: '1px solid #c4314b', color: '#c4314b', background: 'transparent', opacity: isLoading ? 0.5 : 1 }}
              aria-label={`Reject ${item.title}`}
            >
              {isLoading ? <Loader2 size={12} className="animate-spin" /> : <ThumbsDown size={12} aria-hidden="true" />}
              Reject
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEditSend(); }}
              disabled={isLoading}
              className="cursor-pointer rounded"
              style={{ padding: '4px 8px', fontSize: 11, border: '1px solid #D97757', color: '#D97757', background: 'transparent' }}
              aria-label={`Edit ${item.title}`}
            >
              <Pencil size={12} aria-hidden="true" /> Edit
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════
   Analytics Panel
   ═══════════════════════════════════════════ */
function ApprovalsAnalytics({ items }: { items: Approval[] }) {
  const stats = useMemo(() => {
    const total = items.length;
    const pending = items.filter((a) => a.status === 'pending').length;
    const approved = items.filter((a) => a.status === 'approved').length;
    const rejected = items.filter((a) => a.status === 'rejected').length;
    const avgDecisionTime = '2.4h';
    const totalAmount = items.reduce((sum, a) => sum + (a.amount || 0), 0);
    return { total, pending, approved, rejected, avgDecisionTime, totalAmount };
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: '#D97757' },
          { label: 'Pending', value: stats.pending, color: '#f59e0b' },
          { label: 'Approved', value: stats.approved, color: '#237b4b' },
          { label: 'Rejected', value: stats.rejected, color: '#c4314b' },
        ].map((s) => (
          <Card key={s.label}>
            <p style={{ fontSize: 11, color: '#616161', textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 600, color: s.color, marginTop: 4 }}>{s.value}</p>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p style={{ fontSize: 11, color: '#616161', textTransform: 'uppercase', fontWeight: 600 }}>Average Decision Time</p>
          <p style={{ fontSize: 22, fontWeight: 600, color: '#D97757', marginTop: 4 }}>{stats.avgDecisionTime}</p>
        </Card>
        <Card>
          <p style={{ fontSize: 11, color: '#616161', textTransform: 'uppercase', fontWeight: 600 }}>Total Amount</p>
          <p style={{ fontSize: 22, fontWeight: 600, color: '#0891b2', marginTop: 4 }}>${stats.totalAmount.toLocaleString()}</p>
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Icon Components
   ═══════════════════════════════════════════ */
function CodeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="16" height="16" rx="3" stroke="#D97757" strokeWidth="1.5" fill="none" />
      <path d="M6.5 6L4.5 9L6.5 12" stroke="#D97757" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M11.5 6L13.5 9L11.5 12" stroke="#D97757" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function SpendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="9" r="8" stroke="#b56200" strokeWidth="1.5" fill="none" />
      <text x="9" y="13" textAnchor="middle" fill="#b56200" fontSize="10" fontWeight="600">$</text>
    </svg>
  );
}

function DeployIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 1L16 5V13L9 17L2 13V5L9 1Z" stroke="#0891b2" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <path d="M9 9L9 9" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BudgetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="3" width="14" height="12" rx="2" stroke="#237b4b" strokeWidth="1.5" fill="none" />
      <path d="M2 7H16" stroke="#237b4b" strokeWidth="1" />
      <text x="9" y="13" textAnchor="middle" fill="#237b4b" fontSize="7" fontWeight="600">$</text>
    </svg>
  );
}
