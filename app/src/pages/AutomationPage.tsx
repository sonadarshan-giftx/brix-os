import { useState } from 'react';
import { Card } from '@/components/shared/Card';
import { TabsBar } from '@/components/shared/TabsBar';
import { StatusChip } from '@/components/shared/StatusChip';
import { Avatar } from '@/components/shared/Avatar';
import {
  Play,
  Pause,
  Plus,
  Zap,
  GitBranch,
  Box,
  ChevronRight,
  Settings,
  Terminal,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Code2,
  MessageSquare,
  Bot,
  X,
  Send,
  Shield,
  Users,
  Eye,
  MoreHorizontal,
  RotateCcw,
  Sparkles,
  SplitSquareVertical,
} from 'lucide-react';

/* ═══════════════════════════════════════════════
   Automation Page — Actions | Configurator | Pair
   ═══════════════════════════════════════════════ */
const automationTabs = [
  { id: 'automation', label: 'Automation' },
  { id: 'configurator', label: 'Configurator' },
  { id: 'pair', label: 'Pair' },
];

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState('automation');

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className="flex items-center justify-between flex-shrink-0"
        style={{ padding: '16px 20px 8px' }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#242424', letterSpacing: '-0.01em' }}>
            {activeTab === 'automation' && 'Automation'}
            {activeTab === 'configurator' && 'Architect · AI Configuration'}
            {activeTab === 'pair' && 'Pair Programming'}
          </h1>
          <p style={{ fontSize: 13, color: '#616161', marginTop: 2 }}>
            {activeTab === 'automation' && 'Custom workflows, pipelines, and apps'}
            {activeTab === 'configurator' && 'Describe what you want to change'}
            {activeTab === 'pair' && 'Real-time collaborative coding'}
          </p>
        </div>
        {activeTab === 'automation' && (
          <button
            className="flex items-center gap-1.5 rounded px-3 font-medium cursor-pointer"
            style={{
              height: 32,
              fontSize: 13,
              backgroundColor: '#D97757',
              color: '#ffffff',
              border: 'none',
            }}
          >
            <Plus size={14} />
            New Action
          </button>
        )}
      </div>

      {/* Tabs */}
      <TabsBar tabs={automationTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '16px 20px' }}>
        {activeTab === 'automation' && <AutomationSurface />}
        {activeTab === 'configurator' && <ConfiguratorSurface />}
        {activeTab === 'pair' && <PairSurface />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Automation Surface
   ═══════════════════════════════════════════════ */
function AutomationSurface() {
  const [autoTab, setAutoTab] = useState<'actions' | 'pipelines' | 'apps'>('actions');

  const subTabs = [
    { id: 'actions', label: 'Actions' },
    { id: 'pipelines', label: 'Pipelines' },
    { id: 'apps', label: 'Custom Apps' },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setAutoTab(t.id as typeof autoTab)}
            className="rounded-full px-3 py-1 cursor-pointer font-medium"
            style={{
              fontSize: 12,
              backgroundColor: autoTab === t.id ? '#e8eaf6' : '#f0f0f0',
              color: autoTab === t.id ? '#D97757' : '#616161',
              border: 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {autoTab === 'actions' && <ActionsList />}
      {autoTab === 'pipelines' && <PipelinesView />}
      {autoTab === 'apps' && <CustomAppsView />}
    </div>
  );
}

/* ── Actions List ── */
function ActionsList() {
  const actions = [
    {
      id: 'a1',
      name: 'Weekly Cost Summary',
      runtime: 'Python',
      trigger: 'Scheduled (Mon 9AM)',
      lastRun: 'Success',
      lastRunTime: '2h ago',
      runCount: 12,
      icon: Zap,
    },
    {
      id: 'a2',
      name: 'Health Check',
      runtime: 'Bash',
      trigger: 'On-demand',
      lastRun: 'Success',
      lastRunTime: '1d ago',
      runCount: 45,
      icon: Shield,
    },
    {
      id: 'a3',
      name: 'Sprint Reminder',
      runtime: 'Python',
      trigger: 'Scheduled (Fri 4PM)',
      lastRun: 'Pending',
      lastRunTime: '—',
      runCount: 8,
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-3">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Card key={a.id} padding="md" className="flex items-center gap-4">
            <div
              className="flex items-center justify-center rounded flex-shrink-0"
              style={{ width: 40, height: 40, backgroundColor: '#e8eaf6' }}
            >
              <Icon size={18} color="#D97757" />
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>{a.name}</div>
              <div className="flex items-center gap-3" style={{ fontSize: 11, color: '#616161' }}>
                <span className="flex items-center gap-1">
                  <Terminal size={11} />
                  {a.runtime}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {a.trigger}
                </span>
                <span className="flex items-center gap-1">
                  <Play size={11} />
                  {a.runCount} runs
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusChip status={a.lastRun === 'Success' ? 'online' : 'away'} label={a.lastRun} />
              <span style={{ fontSize: 11, color: '#767676' }}>{a.lastRunTime}</span>
              <button
                className="rounded px-2 cursor-pointer"
                style={{ height: 28, fontSize: 12, backgroundColor: '#D97757', color: '#ffffff', border: 'none' }}
              >
                Run
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ── Pipelines View ── */
function PipelinesView() {
  const nodes = [
    { id: 'n1', name: 'cost-summary', type: 'action', status: 'done' as const },
    { id: 'n2', name: 'health-check', type: 'action', status: 'done' as const },
    { id: 'n3', name: 'post-to-channel', type: 'action', status: 'pending' as const },
  ];

  return (
    <div>
      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424' }}>Friday Report</h3>
            <p style={{ fontSize: 12, color: '#616161' }}>Runs every Friday at 5 PM</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1 rounded px-2 cursor-pointer"
              style={{ height: 28, fontSize: 12, border: '1px solid #d1d1d1', color: '#242424', backgroundColor: 'transparent' }}
            >
              <Pause size={12} />
              Pause
            </button>
            <button
              className="rounded px-2 cursor-pointer"
              style={{ height: 28, fontSize: 12, backgroundColor: '#D97757', color: '#ffffff', border: 'none' }}
            >
              <Play size={12} />
            </button>
          </div>
        </div>

        {/* Visual DAG */}
        <div className="flex items-center justify-center gap-0" style={{ padding: '24px 0' }}>
          {nodes.map((node, idx) => (
            <div key={node.id} className="flex items-center">
              <div
                className="flex flex-col items-center rounded-lg p-4"
                style={{
                  minWidth: 140,
                  backgroundColor: node.status === 'done' ? '#e8eaf6' : '#f5f5f3',
                  border: `2px solid ${node.status === 'done' ? '#D97757' : '#d1d1d1'}`,
                }}
              >
                <div
                  className="flex items-center justify-center rounded-full mb-2"
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: node.status === 'done' ? '#D97757' : '#a0a0a0',
                  }}
                >
                  {node.status === 'done' ? (
                    <CheckCircle2 size={16} color="#ffffff" />
                  ) : (
                    <Clock size={16} color="#ffffff" />
                  )}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#242424' }}>
                  {node.name}
                </span>
                <span style={{ fontSize: 10, color: '#616161', marginTop: 2 }}>
                  {node.type}
                </span>
              </div>
              {idx < nodes.length - 1 && (
                <div
                  className="flex items-center justify-center"
                  style={{ width: 48, height: 2, backgroundColor: '#d1d1d1' }}
                >
                  <ChevronRight size={14} color="#a0a0a0" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 mt-4" style={{ fontSize: 12, color: '#616161' }}>
          <span className="flex items-center gap-1">
            <CheckCircle2 size={12} color="#237b4b" />
            2/3 steps completed
          </span>
          <span>Last run: Apr 25, 5:00 PM</span>
        </div>
      </Card>
    </div>
  );
}

/* ── Custom Apps View ── */
function CustomAppsView() {
  return (
    <Card padding="lg">
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>
        Monthly Close
      </h3>
      <p style={{ fontSize: 13, color: '#616161', marginBottom: 16 }}>
        Run end-of-month financial close process.
      </p>
      <div className="flex items-end gap-3 mb-4">
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#616161', display: 'block', marginBottom: 4 }}>
            Close Date
          </label>
          <input
            type="date"
            defaultValue="2025-04-30"
            className="rounded"
            style={{
              height: 32,
              padding: '0 12px',
              fontSize: 13,
              border: '1px solid #d1d1d1',
              color: '#242424',
            }}
          />
        </div>
        <button
          className="flex items-center gap-1 rounded px-4 font-medium cursor-pointer"
          style={{
            height: 32,
            fontSize: 13,
            backgroundColor: '#D97757',
            color: '#ffffff',
            border: 'none',
          }}
        >
          <Play size={14} />
          Run
        </button>
      </div>

      {/* Preview */}
      <div
        className="rounded p-4"
        style={{ backgroundColor: '#f5f5f3', border: '1px solid #e1e1e1' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Eye size={14} color="#616161" />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#616161' }}>Preview</span>
        </div>
        <div className="space-y-1" style={{ fontSize: 12, color: '#616161' }}>
          <div>1. Generate cost summary report</div>
          <div>2. Validate all invoices processed</div>
          <div>3. Post closure notice to #finance</div>
        </div>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════
   Configurator Surface — "Architect" AI
   ═══════════════════════════════════════════════ */
function ConfiguratorSurface() {
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'user',
      content: 'Tighten Finance security',
    },
    {
      id: 'm2',
      sender: 'architect',
      content: 'I\'ve analyzed your request and propose 3 security policy changes:',
      proposals: [
        { id: 'p1', title: 'Access Policy', change: 'Restrict prod DB access to Owner role only', impact: 'high' as const },
        { id: 'p2', title: 'Chat Policy', change: 'Require approval for AI access to financial channels', impact: 'medium' as const },
        { id: 'p3', title: 'Device Posture', change: 'Enforce WireGuard VPN for all admin actions', impact: 'medium' as const },
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  function sendMessage() {
    if (!inputValue.trim()) return;
    setMessages([...messages, { id: `m-${Date.now()}`, sender: 'user', content: inputValue }]);
    setInputValue('');
  }

  return (
    <div className="flex gap-4" style={{ height: 'calc(100vh - 220px)' }}>
      {/* Chat Area */}
      <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>
        {/* Authority indicator */}
        <div
          className="flex items-center gap-2 mb-3 rounded p-2"
          style={{ backgroundColor: '#e8eaf6', fontSize: 12, color: '#D97757' }}
        >
          <Shield size={14} />
          <span style={{ fontWeight: 600 }}>You have Owner access</span>
          <span>— can apply all changes</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4" style={{ paddingRight: 8 }}>
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.sender === 'architect' ? (
                <div className="flex gap-3">
                  <Avatar src="/avatar-manager.jpg" alt="Architect" size="sm" isAi={true} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#242424' }}>Architect</span>
                      <span style={{ fontSize: 10, color: '#767676' }}>AI</span>
                    </div>
                    <div
                      className="rounded-lg p-3"
                      style={{ backgroundColor: '#f5f5f3', fontSize: 13, color: '#242424' }}
                    >
                      {msg.content}
                    </div>
                    {/* Proposals */}
                    {(msg as { proposals?: { id: string; title: string; change: string; impact: 'high' | 'medium' | 'low' }[] }).proposals && (
                      <div className="mt-3 space-y-2">
                        {(msg as { proposals: { id: string; title: string; change: string; impact: 'high' | 'medium' | 'low' }[] }).proposals.map((p) => (
                          <Card key={p.id} padding="md" className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#242424' }}>
                                  {p.title}
                                </span>
                                <StatusChip
                                  status={p.impact === 'high' ? 'busy' : 'away'}
                                  label={p.impact}
                                />
                              </div>
                              <p style={{ fontSize: 12, color: '#616161' }}>{p.change}</p>
                            </div>
                          </Card>
                        ))}

                        {/* Simulated Impact */}
                        <div
                          className="rounded p-3"
                          style={{ backgroundColor: 'rgba(255, 170, 68, 0.08)', border: '1px solid rgba(255, 170, 68, 0.3)' }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle size={14} color="#b56200" />
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#b56200' }}>
                              Simulated Impact
                            </span>
                          </div>
                          <p style={{ fontSize: 12, color: '#616161' }}>
                            2 past events would have been affected by these changes.
                          </p>
                        </div>

                        {/* Apply button */}
                        <button
                          className="w-full flex items-center justify-center gap-2 rounded font-medium cursor-pointer"
                          style={{
                            height: 36,
                            fontSize: 14,
                            backgroundColor: '#D97757',
                            color: '#ffffff',
                            border: 'none',
                          }}
                        >
                          <CheckCircle2 size={16} />
                          Apply Changes
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 justify-end">
                  <div
                    className="rounded-lg p-3"
                    style={{
                      backgroundColor: '#e8eaf6',
                      fontSize: 13,
                      color: '#242424',
                      maxWidth: '70%',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #e1e1e1' }}>
          <input
            type="text"
            placeholder="Describe what you want to configure..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 rounded"
            style={{
              height: 36,
              padding: '0 12px',
              fontSize: 13,
              border: '1px solid #d1d1d1',
              color: '#242424',
            }}
          />
          <button
            onClick={sendMessage}
            className="flex items-center justify-center rounded cursor-pointer"
            style={{
              width: 36,
              height: 36,
              backgroundColor: '#D97757',
              color: '#ffffff',
              border: 'none',
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Tool Panel */}
      <div
        className="flex-shrink-0"
        style={{ width: 220, borderLeft: '1px solid #e1e1e1', paddingLeft: 16 }}
      >
        <h4 style={{ fontSize: 12, fontWeight: 600, color: '#616161', marginBottom: 12, textTransform: 'uppercase' }}>
          Architect Tools
        </h4>
        <div className="space-y-1">
          {[
            { name: 'Workspace', icon: Settings },
            { name: 'Team', icon: Users },
            { name: 'Projects', icon: Box },
            { name: 'AI Employees', icon: Bot },
            { name: 'Rules', icon: Shield },
            { name: 'Integrations', icon: PlugIcon },
            { name: 'Security', icon: LockIcon },
          ].map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.name}
                className="flex items-center gap-2 rounded p-2"
                style={{ fontSize: 12, color: '#242424' }}
              >
                <Icon size={14} color="#D97757" />
                <span>{tool.name}</span>
              </div>
            );
          })}
        </div>

        <h4
          className="mt-6"
          style={{ fontSize: 12, fontWeight: 600, color: '#616161', marginBottom: 12, textTransform: 'uppercase' }}
        >
          Recent Changes
        </h4>
        <div className="space-y-2" style={{ fontSize: 11, color: '#616161' }}>
          <div>
            <div style={{ fontWeight: 600, color: '#242424' }}>Security policy update</div>
            <div>Apr 28 · Applied</div>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#242424' }}>Added new skill pack</div>
            <div>Apr 25 · Applied</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Pair Programming Surface
   ═══════════════════════════════════════════════ */
function PairSurface() {
  const [sessionActive] = useState(true);

  if (!sessionActive) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div
          className="flex items-center justify-center rounded-full mb-4"
          style={{ width: 64, height: 64, backgroundColor: '#e8eaf6' }}
        >
          <Code2 size={28} color="#D97757" />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#242424', marginBottom: 8 }}>
          No Active Pair Session
        </h2>
        <p style={{ fontSize: 13, color: '#616161', marginBottom: 16 }}>
          Start a new session to collaborate in real-time
        </p>
        <button
          className="flex items-center gap-2 rounded px-4 font-medium cursor-pointer"
          style={{
            height: 36,
            fontSize: 14,
            backgroundColor: '#D97757',
            color: '#ffffff',
            border: 'none',
          }}
        >
          <Plus size={16} />
          Start New Pair Session
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" style={{ height: 'calc(100vh - 220px)' }}>
      {/* Session Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>
            Debugging SSN validation with Aria
          </span>
          <StatusChip status="ai-active" label="Active" />
        </div>
        <div className="flex items-center gap-2">
          <ParticipantsRow />
          <div className="flex items-center gap-1" style={{ borderLeft: '1px solid #e1e1e1', paddingLeft: 8 }}>
            <button
              className="flex items-center gap-1 rounded px-2 cursor-pointer"
              style={{ height: 28, fontSize: 11, border: '1px solid #d1d1d1', color: '#242424', backgroundColor: 'transparent' }}
            >
              <Pause size={12} />
              Pause
            </button>
            <button
              className="flex items-center gap-1 rounded px-2 cursor-pointer"
              style={{ height: 28, fontSize: 11, border: '1px solid #d1d1d1', color: '#242424', backgroundColor: 'transparent' }}
            >
              <RotateCcw size={12} />
              Swap
            </button>
            <button
              className="flex items-center gap-1 rounded px-2 cursor-pointer"
              style={{ height: 28, fontSize: 11, border: '1px solid #c4314b', color: '#c4314b', backgroundColor: 'transparent' }}
            >
              <X size={12} />
              End
            </button>
          </div>
        </div>
      </div>

      {/* Split View */}
      <div className="flex gap-3 flex-1" style={{ minHeight: 0 }}>
        {/* Code Editor */}
        <Card padding="none" className="flex-1 flex flex-col overflow-hidden">
          <div
            className="flex items-center gap-2 flex-shrink-0"
            style={{
              height: 36,
              padding: '0 12px',
              backgroundColor: '#1f1f1f',
              borderRadius: '6px 6px 0 0',
            }}
          >
            <Code2 size={14} color="#a0a0a0" />
            <span style={{ fontSize: 12, color: '#e1e1e1' }}>ssn_validator.py</span>
            <span style={{ fontSize: 11, color: '#767676', marginLeft: 'auto' }}>Python</span>
          </div>
          <div className="flex-1 overflow-auto p-4" style={{ backgroundColor: '#1f1f1f' }}>
            <pre style={{ fontSize: 12, lineHeight: '20px', color: '#e1e1e1', fontFamily: 'monospace', margin: 0 }}>
{`import re
from typing import Optional

def validate_ssn(ssn: str) -> Optional[str]:
    """Validate a US Social Security Number."""
    # Remove hyphens and whitespace
    cleaned = re.sub(r'[\s-]', '', ssn)
    
    # Check length
    if len(cleaned) != 9:
        return "SSN must be 9 digits"
    
    # Check all digits
    if not cleaned.isdigit():
        return "SSN must contain only digits"
    
    # Check for invalid SSNs
    if cleaned.startswith("000"):
        return "Invalid area number"
    
    # Check for known fake SSNs
    if cleaned == "123456789":
        return "Known test SSN"
    
    return None  # Valid

def format_ssn(ssn: str) -> str:
    """Format SSN as XXX-XX-XXXX."""
    cleaned = re.sub(r'[\s-]', '', ssn)
    return f"{cleaned[:3]}-{cleaned[3:5]}-{cleaned[5:]}"`}
            </pre>
          </div>
        </Card>

        {/* Right Panel: AI + Chat */}
        <div className="flex flex-col gap-3" style={{ width: 300 }}>
          {/* AI collaborator */}
          <Card padding="md" className="flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <Avatar src="/avatar-aria.jpg" alt="Aria" size="sm" isAi={true} status="online" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#242424' }}>Aria</div>
                <div style={{ fontSize: 10, color: '#767676' }}>AI Collaborator</div>
              </div>
              <div className="ml-auto">
                <StatusChip status="ai-active" label="Driving" />
              </div>
            </div>
            <div
              className="rounded p-2"
              style={{ backgroundColor: '#f5f5f3', fontSize: 11, color: '#616161' }}
            >
              <Sparkles size={12} color="#D97757" style={{ display: 'inline', marginRight: 4 }} />
              I suggest adding validation for area numbers 666 and 900-999 which are invalid.
            </div>
          </Card>

          {/* Chat */}
          <Card padding="none" className="flex-1 flex flex-col overflow-hidden">
            <div
              className="flex items-center flex-shrink-0"
              style={{
                height: 32,
                padding: '0 12px',
                borderBottom: '1px solid #e1e1e1',
                fontSize: 12,
                fontWeight: 600,
                color: '#616161',
              }}
            >
              <MessageSquare size={12} style={{ marginRight: 6 }} />
              Session Chat
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="flex gap-2">
                <Avatar src="/avatar-alex.jpg" alt="Alex" size="xs" />
                <div
                  className="rounded p-2"
                  style={{ backgroundColor: '#f5f5f3', fontSize: 11, color: '#242424' }}
                >
                  The SSN validator is failing for edge cases
                </div>
              </div>
              <div className="flex gap-2">
                <Avatar src="/avatar-aria.jpg" alt="Aria" size="xs" isAi={true} />
                <div
                  className="rounded p-2"
                  style={{ backgroundColor: '#e8eaf6', fontSize: 11, color: '#242424' }}
                >
                  I see the issue. We need to validate area numbers. Let me add checks for 666 and 900-999.
                </div>
              </div>
              <div className="flex gap-2">
                <Avatar src="/avatar-alex.jpg" alt="Alex" size="xs" />
                <div
                  className="rounded p-2"
                  style={{ backgroundColor: '#f5f5f3', fontSize: 11, color: '#242424' }}
                >
                  Good catch. Also check for group number 00.
                </div>
              </div>
            </div>
            <div
              className="flex gap-1 flex-shrink-0 p-2"
              style={{ borderTop: '1px solid #e1e1e1' }}
            >
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 rounded"
                style={{
                  height: 28,
                  padding: '0 8px',
                  fontSize: 12,
                  border: '1px solid #d1d1d1',
                  color: '#242424',
                }}
              />
              <button
                className="flex items-center justify-center rounded cursor-pointer"
                style={{ width: 28, height: 28, backgroundColor: '#D97757', color: '#ffffff', border: 'none' }}
              >
                <Send size={12} />
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Participants Row (Pair)
   ═══════════════════════════════════════════════ */
function ParticipantsRow() {
  const participants = [
    { id: 'p1', name: 'Alex Chen', avatar: '/avatar-alex.jpg', color: '#D97757', isAi: false },
    { id: 'p2', name: 'Aria', avatar: '/avatar-aria.jpg', color: '#92c353', isAi: true },
  ];

  return (
    <div className="flex items-center gap-1">
      {participants.map((p) => (
        <div key={p.id} className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{ backgroundColor: '#f5f5f3' }}>
          <div
            className="rounded-full"
            style={{ width: 8, height: 8, backgroundColor: p.color }}
          />
          <Avatar src={p.avatar} alt={p.name} size="xs" isAi={p.isAi} />
          <span style={{ fontSize: 11, color: '#242424' }}>{p.name}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Missing icon components
   ═══════════════════════════════════════════════ */
function PlugIcon({ size, color }: { size: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22v-5" /><path d="M15 8V2" /><path d="M9 8V2" /><path d="M15 8a5 5 0 0 1 0 10H9a5 5 0 0 1 0-10z" />
    </svg>
  );
}

function LockIcon({ size, color }: { size: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
