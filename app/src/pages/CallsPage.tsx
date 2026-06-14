/**
 * CallsPage.tsx — BrixOS Calls & Meetings
 * Enterprise-grade Teams + Zoom equivalent
 * 4 views: dashboard | lobby | call | schedule
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff,
  MessageSquare, Users, Hand, Smile, MoreHorizontal,
  PhoneOff, Phone, Settings, Download, Trash2,
  Play, Calendar, Clock, Lock, Shield,
  X, Plus, Copy, Edit3, Check,
  BarChart2, HelpCircle, Layout,
  RotateCcw, RotateCw, Pen, Eraser,
  Square, Circle, ArrowRight, Type,
  Send, ThumbsUp, Hash, Zap,
  LogOut, Search, Link,
} from 'lucide-react';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useCallStore } from '@/hooks/useCallStore';
import type {
  CallParticipant,
  CallMessage,
  BreakoutRoom,
  Poll,
  QAQuestion,
  ScheduledMeeting,
  Recording,
} from '@/hooks/useCallStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type View = 'dashboard' | 'lobby' | 'call' | 'schedule';
type DashboardTab = 'active' | 'upcoming' | 'recent' | 'recordings';
type DrawingTool = 'pen' | 'eraser' | 'rect' | 'circle' | 'arrow' | 'text';
type VirtualBg = 'none' | 'blur' | 'office' | 'beach' | 'space';

interface ActiveMeeting {
  id: string;
  title: string;
  host: string;
  participants: MockParticipant[];
  duration: number;
  color: string;
}

interface RecentMeeting {
  id: string;
  title: string;
  host: string;
  date: number;
  durationSecs: number;
  participantCount: number;
  hasRecording: boolean;
  aiSummary?: string;
}

interface MockParticipant {
  id: string;
  name: string;
  initials: string;
  color: string;
  muted: boolean;
  cameraOff: boolean;
  handRaised: boolean;
  isSpeaking: boolean;
  role: 'host' | 'co-host' | 'participant';
  stream?: MediaStream;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
}

interface DrawPoint {
  x: number;
  y: number;
}

interface DrawHistoryEntry {
  imageData: ImageData;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_PARTICIPANTS: MockParticipant[] = [
  { id: 'u1', name: 'Alex Rivera', initials: 'AR', color: '#5b5fc7', muted: false, cameraOff: false, handRaised: false, isSpeaking: true, role: 'host' },
  { id: 'u2', name: 'Maya Chen', initials: 'MC', color: '#5b5fc7', muted: true, cameraOff: false, handRaised: true, isSpeaking: false, role: 'co-host' },
  { id: 'u3', name: 'Jordan Kim', initials: 'JK', color: '#16a34a', muted: false, cameraOff: true, handRaised: false, isSpeaking: false, role: 'participant' },
  { id: 'u4', name: 'Sam Torres', initials: 'ST', color: '#c4314b', muted: true, cameraOff: true, handRaised: false, isSpeaking: false, role: 'participant' },
  { id: 'u5', name: 'Riley Patel', initials: 'RP', color: '#0891b2', muted: false, cameraOff: false, handRaised: false, isSpeaking: false, role: 'participant' },
  { id: 'u6', name: 'Casey Wong', initials: 'CW', color: '#464775', muted: true, cameraOff: false, handRaised: false, isSpeaking: false, role: 'participant' },
];

const TEAM_MEMBERS = [
  { id: 't1', name: 'Alex Rivera', initials: 'AR', color: '#5b5fc7' },
  { id: 't2', name: 'Maya Chen', initials: 'MC', color: '#5b5fc7' },
  { id: 't3', name: 'Jordan Kim', initials: 'JK', color: '#16a34a' },
  { id: 't4', name: 'Sam Torres', initials: 'ST', color: '#c4314b' },
  { id: 't5', name: 'Riley Patel', initials: 'RP', color: '#0891b2' },
];

const MOCK_ACTIVE_MEETINGS: ActiveMeeting[] = [
  { id: 'm1', title: 'Weekly All-Hands', host: 'Alex Rivera', participants: MOCK_PARTICIPANTS, duration: 1847, color: '#5b5fc7' },
  { id: 'm2', title: 'Design Review', host: 'Maya Chen', participants: MOCK_PARTICIPANTS.slice(0, 3), duration: 423, color: '#5b5fc7' },
  { id: 'm3', title: 'Sprint Planning', host: 'Jordan Kim', participants: MOCK_PARTICIPANTS.slice(2, 6), duration: 2100, color: '#16a34a' },
];

const MOCK_UPCOMING: ScheduledMeeting[] = [
  {
    id: 'sched-1', title: 'Q3 Planning Session', description: 'Plan Q3 goals and OKRs', hostId: 'u1', hostName: 'Alex Rivera',
    startTime: Date.now() + 2 * 3600 * 1000, endTime: Date.now() + 3 * 3600 * 1000, timezone: 'America/New_York',
    recurrence: 'once', participantIds: ['u1', 'u2', 'u3'], participantNames: ['Alex Rivera', 'Maya Chen', 'Jordan Kim'],
    type: 'video', waitingRoom: true, autoRecord: false, meetingId: 'qpls-2026', joinLink: 'https://brixos.io/join/qpls-2026', status: 'upcoming',
  },
  {
    id: 'sched-2', title: '1:1 with Maya', description: 'Weekly sync', hostId: 'u1', hostName: 'Alex Rivera',
    startTime: Date.now() + 5 * 3600 * 1000, endTime: Date.now() + 5.5 * 3600 * 1000, timezone: 'America/New_York',
    recurrence: 'weekly', participantIds: ['u1', 'u2'], participantNames: ['Alex Rivera', 'Maya Chen'],
    type: 'video', waitingRoom: false, autoRecord: false, meetingId: '1on1-maya', joinLink: 'https://brixos.io/join/1on1-maya', status: 'upcoming',
  },
  {
    id: 'sched-3', title: 'Customer Demo — Acme Corp', description: 'Product walkthrough for Acme Corp team', hostId: 'u1', hostName: 'Alex Rivera',
    startTime: Date.now() + 24 * 3600 * 1000, endTime: Date.now() + 25 * 3600 * 1000, timezone: 'America/Los_Angeles',
    recurrence: 'once', participantIds: ['u1', 'u3', 'u5'], participantNames: ['Alex Rivera', 'Jordan Kim', 'Riley Patel'],
    type: 'video', waitingRoom: true, autoRecord: true, meetingId: 'demo-acme', joinLink: 'https://brixos.io/join/demo-acme', status: 'upcoming',
  },
];

const MOCK_RECENT: RecentMeeting[] = [
  { id: 'r1', title: 'Engineering Standup', host: 'Jordan Kim', date: Date.now() - 4 * 3600 * 1000, durationSecs: 900, participantCount: 6, hasRecording: true, aiSummary: 'Blockers: CI pipeline slow. Actions: Fix build cache, update dependencies.' },
  { id: 'r2', title: 'Product Roadmap Review', host: 'Alex Rivera', date: Date.now() - 26 * 3600 * 1000, durationSecs: 3600, participantCount: 12, hasRecording: true, aiSummary: 'Approved Q3 roadmap. Focus on AI features and mobile app.' },
  { id: 'r3', title: 'Budget Review', host: 'Sam Torres', date: Date.now() - 50 * 3600 * 1000, durationSecs: 2700, participantCount: 4, hasRecording: false },
];

const MOCK_RECORDINGS_DISPLAY = [
  { id: 'rec-1', title: 'Weekly All-Hands — May 2026', date: Date.now() - 7 * 86400000, durationSecs: 3420, participantCount: 12, color: '#5b5fc7' },
  { id: 'rec-2', title: 'Design Review — Dashboard v3', date: Date.now() - 3 * 86400000, durationSecs: 2160, participantCount: 5, color: '#5b5fc7' },
  { id: 'rec-3', title: 'Sprint 14 Retrospective', date: Date.now() - 86400000, durationSecs: 1800, participantCount: 8, color: '#16a34a' },
];

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'Pacific/Honolulu', 'America/Toronto', 'America/Vancouver',
  'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Europe/Moscow', 'Africa/Cairo', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok',
  'Asia/Singapore', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai', 'Australia/Sydney',
  'Pacific/Auckland', 'UTC',
];

const REACTIONS_EMOJI = ['❤️', '👍', '🎉', '😂', '🤔', '👋', '🔥', '👏'];

// ─── Utility Helpers ──────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ms: number): string {
  const d = new Date(ms);
  const today = new Date();
  const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function copyToClipboard(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

// ─── Avatar Component ─────────────────────────────────────────────────────────

function Avatar({ initials, color, size = 32, className = '' }: { initials: string; color: string; size?: number; className?: string }) {
  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 ${className}`}
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

// ─── Network Quality Icon ─────────────────────────────────────────────────────

function NetworkQualityIcon({ score }: { score: 1 | 2 | 3 | 4 | 5 }) {
  const colors: Record<number, string> = { 1: '#c4314b', 2: '#f97316', 3: '#eab308', 4: '#16a34a', 5: '#16a34a' };
  return (
    <div className="flex items-end gap-[2px]" title={`Network quality: ${score}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            width: 3, height: 4 + i * 3,
            background: i <= score ? colors[score] : '#374151',
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${value ? 'bg-orange-500' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

// ─── ControlButton ────────────────────────────────────────────────────────────

interface ControlButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  activeColor?: string;
}

function ControlButton({ icon, label, onClick, active, activeColor = '#5b5fc7' }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-white/10 group"
      style={{ minWidth: 52 }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
        style={{ background: active ? activeColor : 'rgba(255,255,255,0.08)' }}
      >
        <span className="text-white">{icon}</span>
      </div>
      <span className="text-xs text-gray-400 group-hover:text-gray-300 whitespace-nowrap">{label}</span>
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function CallsPage() {
  const [view, setView] = useState<View>('dashboard');
  const [dashTab, setDashTab] = useState<DashboardTab>('active');
  const [meetingTitle, setMeetingTitle] = useState('Team Meeting');
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingType, setNewMeetingType] = useState<'video' | 'audio'>('video');
  const [joinLink, setJoinLink] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const store = useCallStore();

  const { localStream, muted, cameraOff, isScreenSharing, toggleMute, toggleCamera, shareScreen, stopScreenShare, hangup } = useWebRTC({
    roomId: store.roomId ?? 'default-room',
    userId: store.localUserId ?? 'local-user',
    authToken: 'mock-token',
    type: store.callType ?? 'video',
  });

  const handleCopy = useCallback((text: string, id: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleJoinMeeting = useCallback((title: string) => {
    setMeetingTitle(title);
    store.joinRoom('room-' + Date.now(), 'local-user', 'video');
    setView('lobby');
  }, [store]);

  const handleStartNewMeeting = useCallback(() => {
    setMeetingTitle(newMeetingTitle || 'Instant Meeting');
    store.joinRoom('room-' + Date.now(), 'local-user', newMeetingType);
    setShowNewMeetingModal(false);
    setView('lobby');
  }, [newMeetingTitle, newMeetingType, store]);

  return (
    <div className="h-full w-full" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <AnimatePresence mode="wait">
        {view === 'dashboard' && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
            <DashboardView
              dashTab={dashTab}
              setDashTab={setDashTab}
              showNewMeetingModal={showNewMeetingModal}
              setShowNewMeetingModal={setShowNewMeetingModal}
              newMeetingTitle={newMeetingTitle}
              setNewMeetingTitle={setNewMeetingTitle}
              newMeetingType={newMeetingType}
              setNewMeetingType={setNewMeetingType}
              joinLink={joinLink}
              setJoinLink={setJoinLink}
              copiedId={copiedId}
              handleCopy={handleCopy}
              handleJoinMeeting={handleJoinMeeting}
              handleStartNewMeeting={handleStartNewMeeting}
              onSchedule={() => setView('schedule')}
              store={store}
            />
          </motion.div>
        )}
        {view === 'lobby' && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
            <LobbyView
              meetingTitle={meetingTitle}
              setMeetingTitle={setMeetingTitle}
              localStream={localStream}
              muted={muted}
              cameraOff={cameraOff}
              toggleMute={toggleMute}
              toggleCamera={toggleCamera}
              onJoin={() => { store.setIsConnecting(false); setView('call'); }}
              onCancel={() => { hangup(); setView('dashboard'); }}
            />
          </motion.div>
        )}
        {view === 'call' && (
          <motion.div key="call" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
            <CallView
              meetingTitle={meetingTitle}
              localStream={localStream}
              muted={muted}
              cameraOff={cameraOff}
              isScreenSharing={isScreenSharing}
              toggleMute={toggleMute}
              toggleCamera={toggleCamera}
              shareScreen={shareScreen}
              stopScreenShare={stopScreenShare}
              hangup={hangup}
              store={store}
              onLeave={() => setView('dashboard')}
            />
          </motion.div>
        )}
        {view === 'schedule' && (
          <motion.div key="schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
            <ScheduleView
              onScheduled={() => setView('dashboard')}
              onCancel={() => setView('dashboard')}
              store={store}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// VIEW 1: DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════

interface DashboardViewProps {
  dashTab: DashboardTab;
  setDashTab: (t: DashboardTab) => void;
  showNewMeetingModal: boolean;
  setShowNewMeetingModal: (v: boolean) => void;
  newMeetingTitle: string;
  setNewMeetingTitle: (v: string) => void;
  newMeetingType: 'video' | 'audio';
  setNewMeetingType: (v: 'video' | 'audio') => void;
  joinLink: string;
  setJoinLink: (v: string) => void;
  copiedId: string | null;
  handleCopy: (text: string, id: string) => void;
  handleJoinMeeting: (title: string) => void;
  handleStartNewMeeting: () => void;
  onSchedule: () => void;
  store: ReturnType<typeof useCallStore>;
}

function DashboardView({
  dashTab, setDashTab, showNewMeetingModal, setShowNewMeetingModal,
  newMeetingTitle, setNewMeetingTitle, newMeetingType, setNewMeetingType,
  joinLink, setJoinLink, copiedId, handleCopy, handleJoinMeeting,
  handleStartNewMeeting, onSchedule, store,
}: DashboardViewProps) {
  const [showSummaryModal, setShowSummaryModal] = useState<RecentMeeting | null>(null);

  const tabs: { key: DashboardTab; label: string }[] = [
    { key: 'active', label: 'Active' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'recent', label: 'Recent' },
    { key: 'recordings', label: 'Recordings' },
  ];

  const allRecordings = [
    ...MOCK_RECORDINGS_DISPLAY,
    ...store.recordings.map((r: Recording) => ({ id: r.id, title: r.title, date: r.date, durationSecs: r.durationSecs, participantCount: r.participantCount, color: '#374151' })),
  ];

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#f5f5f3' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-8 py-4 border-b border-gray-200 flex items-center justify-between bg-[#f5f5f3]">
        <h1 className="text-2xl font-bold text-gray-900">Calls & Meetings</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowNewMeetingModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium text-sm hover:opacity-90 active:scale-95 transition-all"
            style={{ background: '#5b5fc7' }}
          >
            <Plus size={16} /> New Meeting
          </button>
          <button
            onClick={onSchedule}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all"
          >
            <Calendar size={16} /> Schedule
          </button>
        </div>
      </div>

      <div className="px-8 py-6 max-w-7xl mx-auto">
        {/* Quick Start Section */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-1">Start instant meeting</h3>
            <p className="text-sm text-gray-500 mb-4">Jump into a video call right now</p>
            <button
              onClick={() => setShowNewMeetingModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ background: '#5b5fc7' }}
            >
              <Video size={16} /> Start Now
            </button>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-1">Join by link</h3>
            <p className="text-sm text-gray-500 mb-4">Enter a meeting link or ID</p>
            <div className="flex gap-2">
              <input
                value={joinLink}
                onChange={e => setJoinLink(e.target.value)}
                placeholder="https://brixos.io/join/..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                disabled={!joinLink}
                className="px-3 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40"
                style={{ background: '#5b5fc7' }}
              >
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Team Quick-call */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Call</h3>
          <div className="flex gap-3 flex-wrap">
            {TEAM_MEMBERS.map(m => (
              <button key={m.id} className="flex flex-col items-center gap-1.5 group" onClick={() => handleJoinMeeting(`1:1 with ${m.name}`)}>
                <div className="relative">
                  <Avatar initials={m.initials} color={m.color} size={44} className="ring-2 ring-transparent group-hover:ring-orange-400 transition-all" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-white" />
                </div>
                <span className="text-xs text-gray-600 font-medium">{m.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setDashTab(t.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${dashTab === t.key ? 'border-b-2 text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
              style={{ borderColor: dashTab === t.key ? '#5b5fc7' : 'transparent' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Active Tab */}
        {dashTab === 'active' && (
          <div className="grid grid-cols-3 gap-4">
            {MOCK_ACTIVE_MEETINGS.map(m => (
              <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex -space-x-2">
                    {m.participants.slice(0, 4).map(p => (
                      <Avatar key={p.id} initials={p.initials} color={p.color} size={32} className="ring-2 ring-white" />
                    ))}
                    {m.participants.length > 4 && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 ring-2 ring-white">
                        +{m.participants.length - 4}
                      </div>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{m.title}</h3>
                <p className="text-xs text-gray-500 mb-1">Host: {m.host}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                  <span className="flex items-center gap-1"><Clock size={11} />{formatDuration(m.duration)}</span>
                  <span className="flex items-center gap-1"><Users size={11} />{m.participants.length}</span>
                </div>
                <button
                  onClick={() => handleJoinMeeting(m.title)}
                  className="w-full py-2 rounded-lg text-white text-sm font-medium"
                  style={{ background: '#5b5fc7' }}
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming Tab */}
        {dashTab === 'upcoming' && (
          <div className="space-y-3">
            {[...MOCK_UPCOMING, ...store.scheduledMeetings].map(m => (
              <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4">
                <div className="w-14 text-center flex-shrink-0">
                  <div className="text-xs font-semibold text-orange-600">{formatDate(m.startTime)}</div>
                  <div className="text-sm font-bold text-gray-800">{formatTime(m.startTime)}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{m.title}</h3>
                  <p className="text-xs text-gray-500">{m.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex -space-x-1">
                      {MOCK_PARTICIPANTS.slice(0, Math.min(3, m.participantNames.length)).map(p => (
                        <Avatar key={p.id} initials={p.initials} color={p.color} size={20} className="ring-1 ring-white" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">{m.participantNames.length} participants</span>
                    {m.recurrence !== 'once' && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded capitalize">{m.recurrence}</span>}
                    {m.autoRecord && <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded">Auto-record</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleJoinMeeting(m.title)} className="px-3 py-1.5 text-xs font-medium rounded-lg text-white" style={{ background: '#5b5fc7' }}>Join</button>
                  <button className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Edit</button>
                  <button className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-500 hover:bg-red-50">Cancel</button>
                </div>
                <button className="text-xs text-blue-500 hover:underline whitespace-nowrap">+ Calendar</button>
              </div>
            ))}
          </div>
        )}

        {/* Recent Tab */}
        {dashTab === 'recent' && (
          <div className="grid grid-cols-3 gap-4">
            {MOCK_RECENT.map(m => (
              <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{m.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Host: {m.host}</p>
                  </div>
                  {m.hasRecording && (
                    <span className="text-xs bg-red-50 text-red-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />REC
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-4 flex-wrap">
                  <span>{formatDate(m.date)} {formatTime(m.date)}</span>
                  <span><Clock size={11} className="inline mr-0.5" />{formatDuration(m.durationSecs)}</span>
                  <span><Users size={11} className="inline mr-0.5" />{m.participantCount}</span>
                </div>
                {m.aiSummary && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded p-2 mb-3 line-clamp-2">{m.aiSummary}</p>
                )}
                <button
                  onClick={() => setShowSummaryModal(m)}
                  className="w-full py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  View Summary
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Recordings Tab */}
        {dashTab === 'recordings' && (
          <div className="grid grid-cols-3 gap-4">
            {allRecordings.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="h-36 flex items-center justify-center relative" style={{ background: `linear-gradient(135deg, ${r.color}33, ${r.color}66)` }}>
                  <Play size={32} className="text-white opacity-80" />
                  <div className="absolute bottom-2 right-2 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">
                    {formatDuration(r.durationSecs)}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">{r.title}</h3>
                  <p className="text-xs text-gray-400 mb-3">{formatDate(r.date)} · {r.participantCount} participants</p>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1 text-xs px-2 py-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50"><Play size={11} />Play</button>
                    <button className="flex items-center gap-1 text-xs px-2 py-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50"><Download size={11} />Download</button>
                    <button className="flex items-center gap-1 text-xs px-2 py-1.5 rounded border border-red-100 text-red-500 hover:bg-red-50 ml-auto"><Trash2 size={11} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Meeting Modal */}
      <AnimatePresence>
        {showNewMeetingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">New Meeting</h2>
                <button onClick={() => setShowNewMeetingModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
                  <input
                    value={newMeetingTitle}
                    onChange={e => setNewMeetingTitle(e.target.value)}
                    placeholder="Enter meeting title..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNewMeetingType('video')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all ${newMeetingType === 'video' ? 'border-orange-400 text-orange-600 bg-orange-50' : 'border-gray-300 text-gray-600'}`}
                    >
                      <Video size={16} /> Video
                    </button>
                    <button
                      onClick={() => setNewMeetingType('audio')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all ${newMeetingType === 'audio' ? 'border-orange-400 text-orange-600 bg-orange-50' : 'border-gray-300 text-gray-600'}`}
                    >
                      <Phone size={16} /> Audio
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                  <Link size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-500 flex-1 truncate">https://brixos.io/join/room-instant</span>
                  <button
                    onClick={() => handleCopy('https://brixos.io/join/room-instant', 'new-modal')}
                    className="text-xs text-orange-500 hover:text-orange-600 font-medium"
                  >
                    {copiedId === 'new-modal' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowNewMeetingModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button
                  onClick={handleStartNewMeeting}
                  className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium"
                  style={{ background: '#5b5fc7' }}
                >
                  Start Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Summary Modal */}
      <AnimatePresence>
        {showSummaryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">{showSummaryModal.title}</h2>
                <button onClick={() => setShowSummaryModal(null)}><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="flex gap-4 text-sm text-gray-500 mb-4">
                <span><Clock size={14} className="inline mr-1" />{formatDuration(showSummaryModal.durationSecs)}</span>
                <span><Users size={14} className="inline mr-1" />{showSummaryModal.participantCount} participants</span>
                <span>{formatDate(showSummaryModal.date)}</span>
              </div>
              {showSummaryModal.aiSummary && (
                <div className="bg-orange-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={14} className="text-orange-500" />
                    <span className="text-xs font-semibold text-orange-600">AI Summary</span>
                  </div>
                  <p className="text-sm text-gray-700">{showSummaryModal.aiSummary}</p>
                </div>
              )}
              <button onClick={() => setShowSummaryModal(null)} className="w-full py-2.5 rounded-lg bg-gray-100 text-sm font-medium text-gray-700">Close</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// VIEW 2: LOBBY
// ═════════════════════════════════════════════════════════════════════════════

interface LobbyViewProps {
  meetingTitle: string;
  setMeetingTitle: (v: string) => void;
  localStream: MediaStream | null;
  muted: boolean;
  cameraOff: boolean;
  toggleMute: () => void;
  toggleCamera: () => void;
  onJoin: () => void;
  onCancel: () => void;
}

function LobbyView({ meetingTitle, setMeetingTitle, localStream, muted, cameraOff, toggleMute, toggleCamera, onJoin, onCancel }: LobbyViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedBg, setSelectedBg] = useState<VirtualBg>('none');
  const [editingTitle, setEditingTitle] = useState(false);
  const [camera, setCamera] = useState('Default Camera');
  const [mic, setMic] = useState('Default Microphone');
  const [speaker, setSpeaker] = useState('Default Speaker');
  const [speakerTested, setSpeakerTested] = useState(false);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const bgButtons: { key: VirtualBg; label: string }[] = [
    { key: 'none', label: 'None' },
    { key: 'blur', label: 'Blur' },
    { key: 'office', label: 'Office' },
    { key: 'beach', label: 'Beach' },
    { key: 'space', label: 'Space' },
  ];

  const mockDevices = ['Default', 'Camera 1', 'Camera 2'];

  return (
    <div className="h-full flex items-center justify-center" style={{ background: '#26201A' }}>
      <div className="flex gap-8 w-full max-w-4xl px-6">
        {/* Camera Preview */}
        <div className="flex-1">
          <div className="relative rounded-2xl overflow-hidden bg-gray-900" style={{ aspectRatio: '4/3' }}>
            {localStream && !cameraOff ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ filter: selectedBg === 'blur' ? 'blur(8px)' : 'none' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-2">Y</div>
                  <span className="text-gray-400 text-sm">Camera is off</span>
                </div>
              </div>
            )}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
              <button onClick={toggleMute} className={`w-9 h-9 rounded-full flex items-center justify-center ${muted ? 'bg-red-500' : 'bg-white/20 hover:bg-white/30'}`}>
                {muted ? <MicOff size={16} className="text-white" /> : <Mic size={16} className="text-white" />}
              </button>
              <button onClick={toggleCamera} className={`w-9 h-9 rounded-full flex items-center justify-center ${cameraOff ? 'bg-red-500' : 'bg-white/20 hover:bg-white/30'}`}>
                {cameraOff ? <VideoOff size={16} className="text-white" /> : <Video size={16} className="text-white" />}
              </button>
            </div>
          </div>
          {/* Background Selector */}
          <div className="mt-3">
            <p className="text-xs text-gray-400 mb-2 font-medium">Background</p>
            <div className="flex gap-2">
              {bgButtons.map(b => (
                <button
                  key={b.key}
                  onClick={() => setSelectedBg(b.key)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: selectedBg === b.key ? '#5b5fc7' : 'rgba(255,255,255,0.1)', color: selectedBg === b.key ? '#fff' : '#9ca3af' }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-72 flex flex-col">
          <div className="mb-5">
            {editingTitle ? (
              <input
                autoFocus
                value={meetingTitle}
                onChange={e => setMeetingTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
                className="w-full text-xl font-bold text-white bg-transparent border-b-2 border-orange-400 outline-none pb-1"
              />
            ) : (
              <h2 className="text-xl font-bold text-white flex items-center gap-2 cursor-pointer group" onClick={() => setEditingTitle(true)}>
                {meetingTitle}
                <Edit3 size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h2>
            )}
            <p className="text-sm text-gray-400 mt-1">Review your settings before joining</p>
          </div>

          {/* Mic Test */}
          <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-gray-400 mb-2 font-medium">Microphone Level</p>
            <div className="flex items-end gap-1 h-8">
              {[0.4, 0.7, 0.9, 0.6, 0.3].map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{ background: '#16a34a' }}
                  animate={{ height: `${h * 100}%` }}
                  transition={{ duration: 0.3, repeat: Infinity, repeatType: 'reverse', delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>

          {/* Devices */}
          <div className="space-y-3 mb-4">
            {[
              { label: 'Camera', value: camera, set: setCamera },
              { label: 'Microphone', value: mic, set: setMic },
            ].map(d => (
              <div key={d.label}>
                <label className="text-xs text-gray-400 font-medium block mb-1">{d.label}</label>
                <select value={d.value} onChange={e => d.set(e.target.value)} className="w-full bg-white/10 text-white text-xs rounded-lg px-3 py-2 border border-white/20 outline-none">
                  {mockDevices.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1">Speaker</label>
              <div className="flex gap-2">
                <select value={speaker} onChange={e => setSpeaker(e.target.value)} className="flex-1 bg-white/10 text-white text-xs rounded-lg px-3 py-2 border border-white/20 outline-none">
                  {mockDevices.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
                <button
                  onClick={() => { setSpeakerTested(true); setTimeout(() => setSpeakerTested(false), 2000); }}
                  className="px-2 py-1 text-xs rounded-lg border border-white/20 text-gray-300 hover:bg-white/10"
                >
                  {speakerTested ? 'Playing...' : 'Test'}
                </button>
              </div>
            </div>
          </div>

          {/* Who's already in */}
          <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {MOCK_PARTICIPANTS.slice(0, 3).map(p => (
                  <Avatar key={p.id} initials={p.initials} color={p.color} size={28} className="ring-1 ring-gray-800" />
                ))}
              </div>
              <p className="text-xs text-gray-300">{MOCK_PARTICIPANTS.length} others are here</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-4">Joining as <span className="text-white font-medium">You</span></p>

          <div className="flex flex-col gap-2 mt-auto">
            <button
              onClick={onJoin}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm"
              style={{ background: '#5b5fc7' }}
            >
              Join Now
            </button>
            <button onClick={onCancel} className="w-full py-2.5 rounded-xl text-gray-400 text-sm hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// VIEW 3: ACTIVE CALL
// ═════════════════════════════════════════════════════════════════════════════

interface CallViewProps {
  meetingTitle: string;
  localStream: MediaStream | null;
  muted: boolean;
  cameraOff: boolean;
  isScreenSharing: boolean;
  toggleMute: () => void;
  toggleCamera: () => void;
  shareScreen: () => Promise<void>;
  stopScreenShare: () => void;
  hangup: () => void;
  store: ReturnType<typeof useCallStore>;
  onLeave: () => void;
}

function CallView({ meetingTitle, localStream, muted, cameraOff, isScreenSharing, toggleMute, toggleCamera, shareScreen, stopScreenShare, hangup, store, onLeave }: CallViewProps) {
  const [elapsed, setElapsed] = useState(0);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showLeaveMenu, setShowLeaveMenu] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [qaInput, setQaInput] = useState('');
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showBreakoutModal, setShowBreakoutModal] = useState(false);
  const [breakoutCount, setBreakoutCount] = useState(3);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [handRaised, setHandRaised] = useState(false);
  const [showHandRaiseToast, setShowHandRaiseToast] = useState(false);
  const [handRaiseToastName, setHandRaiseToastName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [recordingToast, setRecordingToast] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── MediaRecorder recording ─────────────────────────────────
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(() => {
    if (!localStream) return;
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';
    const recorder = new MediaRecorder(localStream, { mimeType });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordingChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(recordingChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      recordingChunksRef.current = [];
      setRecordingToast(true);
      setTimeout(() => setRecordingToast(false), 3000);
    };
    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    store.startRecording();
  }, [localStream, store]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    store.stopRecording();
  }, [store]);

  // ── Web Speech API — Live Captions ──────────────────────────
  useEffect(() => {
    if (!store.captionsEnabled) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('');
      store.addCaption('local', 'You', transcript);
    };
    recognition.onerror = () => {};
    recognition.start();
    return () => { try { recognition.stop(); } catch { /* already stopped */ } };
  }, [store.captionsEnabled, store]);

  // Auto-dismiss captions after 5 seconds (handled in store — keep last 3, slice)

  const rightPanelOpen = store.chatOpen || store.participantsOpen || store.qaOpen;

  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [store.messages]);

  useEffect(() => {
    const names = ['Maya Chen', 'Jordan Kim', 'Riley Patel'];
    const t = setTimeout(() => {
      setHandRaiseToastName(names[Math.floor(Math.random() * names.length)]);
      setShowHandRaiseToast(true);
      setTimeout(() => setShowHandRaiseToast(false), 3000);
    }, 8000);
    return () => clearTimeout(t);
  }, []);

  const addFloatingReaction = useCallback((emoji: string) => {
    const id = Date.now().toString();
    const x = 30 + Math.random() * 40;
    setFloatingReactions(prev => [...prev, { id, emoji, x }]);
    store.addReaction('local-user', 'You', emoji);
    setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== id)), 3000);
    setShowReactionPicker(false);
  }, [store]);

  const sendMessage = useCallback(() => {
    if (!chatInput.trim()) return;
    store.sendMessage('local-user', 'You', chatInput.trim());
    setChatInput('');
  }, [chatInput, store]);

  const gridCols = useMemo(() => {
    const n = MOCK_PARTICIPANTS.length + 1;
    if (n <= 1) return 'grid-cols-1';
    if (n === 2) return 'grid-cols-2';
    if (n <= 4) return 'grid-cols-2';
    if (n <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  }, []);

  const openPanel = useCallback((tab: 'chat' | 'participants' | 'qa') => {
    store.setRightPanelTab(tab);
    store.setChatOpen(tab === 'chat');
    store.setParticipantsOpen(tab === 'participants');
    store.setQaOpen(tab === 'qa');
  }, [store]);

  const closePanel = useCallback(() => {
    store.setChatOpen(false);
    store.setParticipantsOpen(false);
    store.setQaOpen(false);
  }, [store]);

  return (
    <div className="h-full flex flex-col select-none overflow-hidden" style={{ background: '#26201A' }}>
      {/* Top Bar */}
      <div className="flex items-center px-4 py-2 z-10 flex-shrink-0" style={{ background: '#181410' }}>
        <span className="font-semibold text-white text-sm truncate max-w-xs">{meetingTitle}</span>
        <div className="flex items-center gap-3 ml-4">
          <span className="text-xs text-gray-400 font-mono">{formatDuration(elapsed)}</span>
          {store.recording && (
            <div className="flex items-center gap-1 text-xs text-red-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />REC
            </div>
          )}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <NetworkQualityIcon score={store.networkStats?.qualityScore ?? 4} />
          <Shield size={14} className="text-green-400" />
          <button className="flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded hover:bg-white/20 text-gray-300">
            <Hash size={11} /><span>brix-4829</span>
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Video Grid */}
        <div className={`flex-1 p-3 overflow-y-auto grid gap-2 content-start ${gridCols}`}>
          {MOCK_PARTICIPANTS.map((p) => (
            <VideoTile
              key={p.id}
              participant={p}
              isSpotlighted={store.spotlightedUserId === p.id}
              onSpotlight={() => store.setSpotlight(store.spotlightedUserId === p.id ? null : p.id)}
              isLocal={false}
            />
          ))}
          <VideoTile
            participant={{ id: 'local', name: 'You', initials: 'Y', color: '#5b5fc7', muted, cameraOff, handRaised, isSpeaking: false, role: 'host' }}
            isSpotlighted={false}
            onSpotlight={() => {}}
            isLocal
            localStream={localStream ?? undefined}
          />
        </div>

        {/* Right Panel */}
        <AnimatePresence>
          {rightPanelOpen && (
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="w-80 flex flex-col border-l flex-shrink-0"
              style={{ background: '#1F1812', borderColor: '#ffffff15' }}
            >
              <div className="flex border-b flex-shrink-0" style={{ borderColor: '#ffffff15' }}>
                {(['chat', 'participants', 'qa'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => openPanel(tab)}
                    className="flex-1 py-3 text-xs font-semibold capitalize transition-colors"
                    style={{ color: store.rightPanelTab === tab ? '#fb923c' : '#6b7280', borderBottom: store.rightPanelTab === tab ? '2px solid #fb923c' : '2px solid transparent' }}
                  >
                    {tab === 'chat' ? 'Chat' : tab === 'participants' ? `People (${MOCK_PARTICIPANTS.length + 1})` : 'Q&A'}
                  </button>
                ))}
                <button onClick={closePanel} className="px-3 text-gray-500 hover:text-gray-300"><X size={16} /></button>
              </div>

              {/* Chat */}
              {store.rightPanelTab === 'chat' && (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {store.messages.length === 0 && (
                      <div className="text-center text-gray-500 text-xs mt-8">No messages yet. Say hello!</div>
                    )}
                    {store.messages.map((msg: CallMessage) => (
                      <div key={msg.id} className="flex flex-col">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-gray-300">{msg.name}</span>
                          <span className="text-xs text-gray-600">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm text-gray-200 bg-white/5 px-3 py-2 rounded-xl rounded-tl-none">{msg.text}</p>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-3 border-t flex-shrink-0" style={{ borderColor: '#ffffff15' }}>
                    <div className="flex gap-2">
                      <input
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 bg-white/10 text-white text-sm px-3 py-2 rounded-lg border border-white/10 outline-none focus:border-orange-400 placeholder-gray-500"
                      />
                      <button onClick={sendMessage} className="p-2 rounded-lg" style={{ background: '#5b5fc7' }}><Send size={16} className="text-white" /></button>
                    </div>
                  </div>
                </div>
              )}

              {/* Participants */}
              {store.rightPanelTab === 'participants' && (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="p-3 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: '#ffffff15' }}>
                    <span className="text-xs text-gray-400">{MOCK_PARTICIPANTS.length + 1} participants</span>
                    <button className="text-xs text-orange-400 hover:text-orange-300">Mute All</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {[...MOCK_PARTICIPANTS, { id: 'local', name: 'You (Host)', initials: 'Y', color: '#5b5fc7', muted, cameraOff, handRaised, isSpeaking: false, role: 'host' as const }].map(p => (
                      <div key={p.id} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 group">
                        <Avatar initials={p.initials} color={p.color} size={32} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-white font-medium truncate">{p.name}</span>
                            {p.role !== 'participant' && (
                              <span className="text-xs px-1 rounded" style={{ background: '#5b5fc722', color: '#EBB59C' }}>{p.role}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {p.handRaised && <Hand size={12} className="text-yellow-400" />}
                          {p.muted ? <MicOff size={12} className="text-red-400" /> : <Mic size={12} className="text-green-400" />}
                          {p.cameraOff ? <VideoOff size={12} className="text-red-400" /> : <Video size={12} className="text-gray-400" />}
                          <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10"><MoreHorizontal size={14} className="text-gray-400" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Q&A */}
              {store.rightPanelTab === 'qa' && (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {store.qaQuestions.filter((q: QAQuestion) => !q.dismissed).length === 0 && (
                      <div className="text-center text-gray-500 text-xs mt-8">No questions yet.</div>
                    )}
                    {store.qaQuestions.filter((q: QAQuestion) => !q.dismissed).map((q: QAQuestion) => (
                      <div key={q.id} className={`bg-white/5 rounded-xl p-3 ${q.answered ? 'opacity-50' : ''}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-300">{q.name}</span>
                          <span className="text-xs text-gray-500">{new Date(q.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm text-white mb-2">{q.text}</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => store.upvoteQuestion(q.id, 'local-user')} className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-400">
                            <ThumbsUp size={12} /> {q.upvotes}
                          </button>
                          <button onClick={() => store.answerQuestion(q.id)} className="text-xs text-green-400 hover:text-green-300 ml-auto">Answer</button>
                          <button onClick={() => store.dismissQuestion(q.id)} className="text-xs text-gray-500 hover:text-gray-300">Dismiss</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t flex-shrink-0" style={{ borderColor: '#ffffff15' }}>
                    <div className="flex gap-2">
                      <input
                        value={qaInput}
                        onChange={e => setQaInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && qaInput.trim()) { store.addQaQuestion('local-user', 'You', qaInput.trim()); setQaInput(''); } }}
                        placeholder="Ask a question..."
                        className="flex-1 bg-white/10 text-white text-sm px-3 py-2 rounded-lg border border-white/10 outline-none focus:border-orange-400 placeholder-gray-500"
                      />
                      <button
                        onClick={() => { if (qaInput.trim()) { store.addQaQuestion('local-user', 'You', qaInput.trim()); setQaInput(''); } }}
                        className="p-2 rounded-lg"
                        style={{ background: '#5b5fc7' }}
                      >
                        <Send size={16} className="text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Bar */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center justify-center gap-2 flex-wrap" style={{ background: '#181410' }}>
        <ControlButton icon={muted ? <MicOff size={18} /> : <Mic size={18} />} label={muted ? 'Unmute' : 'Mute'} active={muted} activeColor="#c4314b" onClick={toggleMute} />
        <ControlButton icon={cameraOff ? <VideoOff size={18} /> : <Video size={18} />} label={cameraOff ? 'Start Video' : 'Stop Video'} active={cameraOff} activeColor="#c4314b" onClick={toggleCamera} />
        <ControlButton
          icon={isScreenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
          label={isScreenSharing ? 'Stop Share' : 'Share Screen'}
          active={isScreenSharing} activeColor="#5b5fc7"
          onClick={() => isScreenSharing ? stopScreenShare() : shareScreen()}
        />
        <ControlButton icon={<MessageSquare size={18} />} label="Chat" active={store.chatOpen} activeColor="#5b5fc7" onClick={() => { store.chatOpen ? closePanel() : openPanel('chat'); }} />
        <ControlButton icon={<Users size={18} />} label="People" active={store.participantsOpen} activeColor="#5b5fc7" onClick={() => { store.participantsOpen ? closePanel() : openPanel('participants'); }} />
        <ControlButton icon={<Hand size={18} />} label="Raise Hand" active={handRaised} activeColor="#eab308" onClick={() => { setHandRaised(h => !h); handRaised ? store.lowerHand('local-user') : store.raiseHand('local-user'); }} />

        {/* Reactions */}
        <div className="relative">
          <ControlButton icon={<Smile size={18} />} label="React" active={showReactionPicker} activeColor="#5b5fc7" onClick={() => setShowReactionPicker(p => !p)} />
          <AnimatePresence>
            {showReactionPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex gap-1 p-2 rounded-2xl shadow-xl z-50"
                style={{ background: '#26201A', border: '1px solid #ffffff15' }}
              >
                {REACTIONS_EMOJI.map(e => (
                  <button key={e} onClick={() => addFloatingReaction(e)} className="text-xl hover:scale-125 transition-transform w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10">
                    {e}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* More */}
        <div className="relative">
          <ControlButton icon={<MoreHorizontal size={18} />} label="More" active={showMoreMenu} onClick={() => setShowMoreMenu(p => !p)} />
          <AnimatePresence>
            {showMoreMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 rounded-xl shadow-xl overflow-hidden z-50"
                style={{ background: '#26201A', border: '1px solid #ffffff15' }}
              >
                {[
                  { label: 'Polls', icon: <BarChart2 size={14} />, action: () => { setShowPollModal(true); setShowMoreMenu(false); } },
                  { label: 'Q&A', icon: <HelpCircle size={14} />, action: () => { openPanel('qa'); setShowMoreMenu(false); } },
                  { label: 'Whiteboard', icon: <Layout size={14} />, action: () => { store.setWhiteboardOpen(true); setShowMoreMenu(false); } },
                  { label: 'Breakout Rooms', icon: <Users size={14} />, action: () => { setShowBreakoutModal(true); setShowMoreMenu(false); } },
                  { label: store.captionsEnabled ? 'Hide Captions' : 'Live Captions', icon: <Hash size={14} />, action: () => { store.toggleCaptions(); setShowMoreMenu(false); } },
                  { label: 'Settings', icon: <Settings size={14} />, action: () => { setShowSettings(true); setShowMoreMenu(false); } },
                  { label: store.recording ? 'Stop Recording' : 'Record', icon: <Lock size={14} />, action: () => { store.recording ? stopRecording() : startRecording(); setShowMoreMenu(false); } },
                ].map(item => (
                  <button key={item.label} onClick={item.action} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition-colors">
                    <span className="text-gray-400">{item.icon}</span>{item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Leave */}
        <div className="relative ml-4">
          <button
            onClick={() => setShowLeaveMenu(p => !p)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm text-white"
            style={{ background: '#c4314b' }}
          >
            <PhoneOff size={16} /> Leave
          </button>
          <AnimatePresence>
            {showLeaveMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                className="absolute bottom-full mb-2 right-0 w-44 rounded-xl shadow-xl overflow-hidden z-50"
                style={{ background: '#26201A', border: '1px solid #ffffff15' }}
              >
                <button onClick={() => { hangup(); onLeave(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-white/10">
                  <LogOut size={14} className="text-yellow-400" /> Leave Meeting
                </button>
                <button onClick={() => { hangup(); onLeave(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10">
                  <PhoneOff size={14} /> End for All
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Reactions */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 pointer-events-none z-50 w-0 h-0">
        <AnimatePresence>
          {floatingReactions.map(r => (
            <motion.div
              key={r.id}
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: -150, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.5, ease: 'easeOut' }}
              className="absolute text-3xl"
              style={{ left: `${r.x - 50}%` }}
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Live Captions */}
      <AnimatePresence>
        {store.captionsEnabled && store.captions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 max-w-2xl w-full px-4 z-40 pointer-events-none"
          >
            <div className="rounded-xl px-5 py-3 space-y-1" style={{ background: 'rgba(0,0,0,0.7)' }}>
              {store.captions.slice(-2).map((c, i) => (
                <div key={i} className="text-sm text-white">
                  <span className="text-gray-400 font-medium mr-2">{c.name}:</span>{c.text}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording Saved Toast */}
      <AnimatePresence>
        {recordingToast && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed top-28 left-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg"
            style={{ background: '#16a34a', border: '1px solid #15803d' }}
          >
            <Download size={14} className="text-white" />
            <span className="text-sm text-white font-medium">Recording saved to Downloads</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hand Raise Toast */}
      <AnimatePresence>
        {showHandRaiseToast && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed top-16 left-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg"
            style={{ background: '#26201A', border: '1px solid #ffffff20' }}
          >
            <Hand size={16} className="text-yellow-400" />
            <span className="text-sm text-white font-medium">{handRaiseToastName} raised their hand</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Whiteboard Overlay */}
      <AnimatePresence>
        {store.whiteboardOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white"
          >
            <WhiteboardOverlay onClose={() => store.setWhiteboardOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Poll Modal */}
      <AnimatePresence>
        {showPollModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
              style={{ background: '#26201A', border: '1px solid #ffffff15' }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">Create Poll</h3>
                <button onClick={() => setShowPollModal(false)}><X size={20} className="text-gray-400" /></button>
              </div>
              <input
                value={newPollQuestion}
                onChange={e => setNewPollQuestion(e.target.value)}
                placeholder="Your question..."
                className="w-full bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20 outline-none mb-3 text-sm"
              />
              <div className="space-y-2 mb-4">
                {newPollOptions.map((o, i) => (
                  <input
                    key={i}
                    value={o}
                    onChange={e => setNewPollOptions(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                    placeholder={`Option ${i + 1}`}
                    className="w-full bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20 outline-none text-sm"
                  />
                ))}
                {newPollOptions.length < 4 && (
                  <button onClick={() => setNewPollOptions(p => [...p, ''])} className="text-xs text-orange-400 hover:text-orange-300">+ Add option</button>
                )}
              </div>
              {/* Active Polls */}
              {store.polls.filter((p: Poll) => !p.closed).map((poll: Poll) => (
                <div key={poll.id} className="mb-4 border-t border-white/10 pt-4">
                  <p className="text-sm font-semibold text-white mb-3">{poll.question}</p>
                  <div className="space-y-2">
                    {poll.options.map((opt, i) => {
                      const total = poll.options.reduce((s, o) => s + o.votes, 0);
                      const pct = total ? Math.round((opt.votes / total) * 100) : 0;
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-300"><span>{opt.label}</span><span>{pct}%</span></div>
                          <div className="h-2 rounded-full bg-white/10">
                            <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: '#5b5fc7' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={() => store.closePoll(poll.id)} className="mt-3 text-xs text-red-400 hover:text-red-300">End Poll</button>
                </div>
              ))}
              <div className="flex gap-3 mt-2">
                <button onClick={() => setShowPollModal(false)} className="flex-1 py-2.5 rounded-lg border border-white/20 text-sm text-gray-300 hover:bg-white/10">Cancel</button>
                <button
                  onClick={() => {
                    if (newPollQuestion.trim() && newPollOptions.filter(o => o.trim()).length >= 2) {
                      store.createPoll(newPollQuestion.trim(), newPollOptions.filter(o => o.trim()), 'local-user');
                      setShowPollModal(false);
                      setNewPollQuestion('');
                      setNewPollOptions(['', '']);
                    }
                  }}
                  className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium"
                  style={{ background: '#5b5fc7' }}
                >
                  Launch Poll
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Breakout Rooms Modal */}
      <AnimatePresence>
        {showBreakoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl p-6 shadow-2xl"
              style={{ background: '#26201A', border: '1px solid #ffffff15' }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">Breakout Rooms</h3>
                <button onClick={() => setShowBreakoutModal(false)}><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="mb-5">
                <label className="text-xs text-gray-400 font-medium block mb-2">Number of rooms: <span className="text-white">{breakoutCount}</span></label>
                <input type="range" min={1} max={50} value={breakoutCount} onChange={e => setBreakoutCount(Number(e.target.value))} className="w-full accent-orange-500" />
              </div>
              {store.breakoutRooms.length === 0 ? (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {Array.from({ length: Math.min(breakoutCount, 6) }, (_, i) => (
                    <div key={i} className="rounded-xl p-3 border border-white/10 bg-white/5">
                      <div className="text-sm font-semibold text-white mb-1">Room {i + 1}</div>
                      <div className="text-xs text-gray-400">Auto-assign</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 mb-5 max-h-48 overflow-y-auto">
                  {store.breakoutRooms.map((r: BreakoutRoom) => (
                    <div key={r.id} className="rounded-xl p-3 border border-white/10 bg-white/5">
                      <div className="text-sm font-semibold text-white">{r.name}</div>
                      <div className="text-xs text-gray-400">{r.participants.length} participants</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mb-4">
                <label className="text-xs text-gray-400 font-medium block mb-1">Broadcast message</label>
                <div className="flex gap-2">
                  <input value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="Message to all rooms..." className="flex-1 bg-white/10 text-white text-sm px-3 py-2 rounded-lg border border-white/20 outline-none" />
                  <button onClick={() => setBroadcastMsg('')} className="px-3 py-2 rounded-lg text-xs text-white" style={{ background: '#5b5fc7' }}>Send</button>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowBreakoutModal(false)} className="flex-1 py-2.5 rounded-lg border border-white/20 text-sm text-gray-300 hover:bg-white/10">Cancel</button>
                <button
                  onClick={() => { store.createBreakoutRooms(breakoutCount, MOCK_PARTICIPANTS.map(p => p.id)); setShowBreakoutModal(false); }}
                  className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium"
                  style={{ background: '#5b5fc7' }}
                >
                  Open Rooms
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
              style={{ background: '#26201A', border: '1px solid #ffffff15' }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">Settings</h3>
                <button onClick={() => setShowSettings(false)}><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-200">Noise Suppression</div>
                    <div className="text-xs text-gray-500">Filter background noise</div>
                  </div>
                  <Toggle value={store.noiseSuppression} onChange={store.toggleNoiseSuppression} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-200">Live Captions</div>
                    <div className="text-xs text-gray-500">Show real-time captions</div>
                  </div>
                  <Toggle value={store.captionsEnabled} onChange={store.toggleCaptions} />
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full mt-6 py-2.5 rounded-lg border border-white/20 text-sm text-gray-300 hover:bg-white/10">Close</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── VideoTile Component ──────────────────────────────────────────────────────

interface VideoTileProps {
  participant: MockParticipant;
  isSpotlighted: boolean;
  onSpotlight: () => void;
  isLocal: boolean;
  localStream?: MediaStream;
}

function VideoTile({ participant: p, isSpotlighted, onSpotlight, isLocal, localStream }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const store = useCallStore();
  const virtualBackground = isLocal ? store.virtualBackground : 'none';

  useEffect(() => {
    const stream = isLocal ? localStream : p.stream;
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isLocal, localStream, p.stream]);

  // Canvas-based background processing for local stream
  useEffect(() => {
    if (!isLocal || virtualBackground === 'none' || !localStream) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const offscreenVideo = document.createElement('video');
    offscreenVideo.srcObject = localStream;
    offscreenVideo.autoplay = true;
    offscreenVideo.muted = true;
    offscreenVideo.playsInline = true;
    offscreenVideo.play().catch(() => {});

    let animFrameId: number;
    const render = () => {
      if (offscreenVideo.readyState >= 2) {
        const w = offscreenVideo.videoWidth || 640;
        const h = offscreenVideo.videoHeight || 480;
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;

        if (virtualBackground === 'blur') {
          // Draw blurred background
          ctx.filter = 'blur(12px)';
          ctx.drawImage(offscreenVideo, 0, 0, w, h);
          ctx.filter = 'none';
          // Draw center crop (person area) without blur
          const cropX = w * 0.1;
          const cropW = w * 0.8;
          ctx.drawImage(offscreenVideo, cropX, 0, cropW, h, cropX, 0, cropW, h);
        } else {
          // For other virtual backgrounds: draw video (could overlay bg image in future)
          ctx.drawImage(offscreenVideo, 0, 0, w, h);
        }
      }
      animFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animFrameId);
      offscreenVideo.srcObject = null;
    };
  }, [isLocal, virtualBackground, localStream]);

  const hasStream = isLocal ? !!localStream : !!p.stream;
  const useCanvas = isLocal && virtualBackground !== 'none' && !!localStream;

  return (
    <div
      className={`relative rounded-xl overflow-hidden aspect-video cursor-pointer group ${isSpotlighted ? 'col-span-2 row-span-2' : ''}`}
      style={{
        background: '#181410',
        boxShadow: p.isSpeaking ? '0 0 0 3px #16a34a' : 'none',
        transition: 'box-shadow 0.2s',
      }}
      onClick={onSpotlight}
    >
      {hasStream && !p.cameraOff ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className="w-full h-full object-cover"
            style={{ display: useCanvas ? 'none' : 'block' }}
          />
          {useCanvas && (
            <canvas
              ref={canvasRef}
              className="w-full h-full object-cover"
              style={{ display: 'block' }}
            />
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Avatar initials={p.initials} color={p.color} size={60} />
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <span className="text-xs text-white font-medium px-2 py-0.5 rounded-md" style={{ background: 'rgba(0,0,0,0.6)' }}>
          {p.name}{isLocal ? ' (You)' : ''}
        </span>
        {p.muted && <MicOff size={11} className="text-red-400" />}
      </div>
      {p.handRaised && (
        <div className="absolute top-2 right-2 text-base">✋</div>
      )}
    </div>
  );
}

// ─── Whiteboard Overlay ───────────────────────────────────────────────────────

function WhiteboardOverlay({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<DrawingTool>('pen');
  const [color, setColor] = useState('#000000');
  const [strokeSize, setStrokeSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<DrawHistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<DrawHistoryEntry[]>([]);
  const lastPoint = useRef<DrawPoint | null>(null);

  const COLORS = ['#000000', '#c4314b', '#5b5fc7', '#eab308', '#16a34a', '#5b5fc7'];
  const SIZES = [2, 5, 10];

  const getCtx = useCallback(() => canvasRef.current?.getContext('2d') ?? null, []);

  const saveHistory = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    setHistory(h => [...h, { imageData: ctx.getImageData(0, 0, canvas.width, canvas.height) }]);
    setRedoStack([]);
  }, [getCtx]);

  const getPoint = (e: React.MouseEvent<HTMLCanvasElement>): DrawPoint => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const ctx = getCtx();
    if (!ctx) return;
    saveHistory();
    setIsDrawing(true);
    const pt = getPoint(e);
    lastPoint.current = pt;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, strokeSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.fill();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    const pt = getPoint(e);
    ctx.beginPath();
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = strokeSize;
    ctx.lineCap = 'round';
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    lastPoint.current = pt;
  };

  const handleMouseUp = () => { setIsDrawing(false); lastPoint.current = null; };

  const handleUndo = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas || history.length === 0) return;
    const last = history[history.length - 1];
    setRedoStack(s => [...s, { imageData: ctx.getImageData(0, 0, canvas.width, canvas.height) }]);
    ctx.putImageData(last.imageData, 0, 0);
    setHistory(h => h.slice(0, -1));
  }, [getCtx, history]);

  const handleRedo = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas || redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory(h => [...h, { imageData: ctx.getImageData(0, 0, canvas.width, canvas.height) }]);
    ctx.putImageData(next.imageData, 0, 0);
    setRedoStack(s => s.slice(0, -1));
  }, [getCtx, redoStack]);

  const handleClear = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    saveHistory();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [getCtx, saveHistory]);

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'whiteboard.png';
    a.click();
  }, []);

  const tools: { key: DrawingTool; icon: React.ReactNode; title: string }[] = [
    { key: 'pen', icon: <Pen size={16} />, title: 'Pen' },
    { key: 'eraser', icon: <Eraser size={16} />, title: 'Eraser' },
    { key: 'rect', icon: <Square size={16} />, title: 'Rectangle' },
    { key: 'circle', icon: <Circle size={16} />, title: 'Circle' },
    { key: 'arrow', icon: <ArrowRight size={16} />, title: 'Arrow' },
    { key: 'text', icon: <Type size={16} />, title: 'Text' },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0 flex-wrap">
        <button onClick={onClose} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mr-2 font-medium">
          <X size={16} /> Close
        </button>
        <div className="h-5 w-px bg-gray-300" />
        {tools.map(t => (
          <button key={t.key} onClick={() => setTool(t.key)} title={t.title} className={`w-8 h-8 rounded-lg flex items-center justify-center ${tool === t.key ? 'bg-orange-100 text-orange-600' : 'text-gray-500 hover:bg-gray-100'}`}>
            {t.icon}
          </button>
        ))}
        <div className="h-5 w-px bg-gray-300" />
        {COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)} className="w-6 h-6 rounded-full border-2 transition-transform" style={{ background: c, borderColor: color === c ? '#1f2937' : 'transparent', transform: color === c ? 'scale(1.25)' : 'scale(1)' }} />
        ))}
        <div className="h-5 w-px bg-gray-300" />
        {SIZES.map(s => (
          <button key={s} onClick={() => setStrokeSize(s)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${strokeSize === s ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>
            <div className="rounded-full bg-gray-700" style={{ width: s + 2, height: s + 2 }} />
          </button>
        ))}
        <div className="h-5 w-px bg-gray-300" />
        <button onClick={handleUndo} title="Undo" className="p-1.5 rounded hover:bg-gray-100 text-gray-500" disabled={history.length === 0}><RotateCcw size={15} /></button>
        <button onClick={handleRedo} title="Redo" className="p-1.5 rounded hover:bg-gray-100 text-gray-500" disabled={redoStack.length === 0}><RotateCw size={15} /></button>
        <button onClick={handleClear} className="px-3 py-1 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50">Clear</button>
        <button onClick={handleExport} className="px-3 py-1 text-sm rounded text-white flex items-center gap-1" style={{ background: '#5b5fc7' }}>
          <Download size={13} /> Export
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={typeof window !== 'undefined' ? window.innerWidth : 1920}
        height={typeof window !== 'undefined' ? window.innerHeight - 56 : 1024}
        className="flex-1"
        style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// VIEW 4: SCHEDULE
// ═════════════════════════════════════════════════════════════════════════════

interface ScheduleViewProps {
  onScheduled: () => void;
  onCancel: () => void;
  store: ReturnType<typeof useCallStore>;
}

function ScheduleView({ onScheduled, onCancel, store }: ScheduleViewProps) {
  const now = new Date();
  const toLocalInput = (d: Date) => d.toISOString().slice(0, 16);

  const [title, setTitle] = useState('');
  const [startDt, setStartDt] = useState(toLocalInput(new Date(now.getTime() + 3600000)));
  const [endDt, setEndDt] = useState(toLocalInput(new Date(now.getTime() + 7200000)));
  const [timezone, setTimezone] = useState('America/New_York');
  const [recurrence, setRecurrence] = useState<ScheduledMeeting['recurrence']>('once');
  const [callType, setCallType] = useState<'video' | 'audio'>('video');
  const [waitingRoom, setWaitingRoom] = useState(false);
  const [autoRecord, setAutoRecord] = useState(false);
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [description, setDescription] = useState('');
  const [participantSearch, setParticipantSearch] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<typeof TEAM_MEMBERS>([]);
  const [showToast, setShowToast] = useState(false);

  const filteredMembers = TEAM_MEMBERS.filter(m =>
    m.name.toLowerCase().includes(participantSearch.toLowerCase()) &&
    !selectedParticipants.find(p => p.id === m.id)
  );

  const handleSchedule = useCallback(() => {
    if (!title.trim()) return;
    store.scheduleMeeting({
      title: title.trim(),
      description,
      hostId: 'local-user',
      hostName: 'You',
      startTime: new Date(startDt).getTime(),
      endTime: new Date(endDt).getTime(),
      timezone,
      recurrence,
      participantIds: selectedParticipants.map(p => p.id),
      participantNames: selectedParticipants.map(p => p.name),
      type: callType,
      waitingRoom,
      autoRecord,
      password: requirePassword ? password : undefined,
      status: 'upcoming',
    });
    setShowToast(true);
    setTimeout(() => { setShowToast(false); onScheduled(); }, 2000);
  }, [title, description, startDt, endDt, timezone, recurrence, selectedParticipants, callType, waitingRoom, autoRecord, requirePassword, password, store, onScheduled]);

  const recurrenceOptions: { key: ScheduledMeeting['recurrence']; label: string }[] = [
    { key: 'once', label: 'Once' },
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
  ];

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#f5f5f3' }}>
      <div className="sticky top-0 z-10 px-8 py-4 border-b border-gray-200 flex items-center justify-between bg-[#f5f5f3]">
        <h1 className="text-2xl font-bold text-gray-900">Schedule Meeting</h1>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700"><X size={22} /></button>
      </div>

      <div className="px-8 py-8 max-w-2xl mx-auto space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Meeting Title *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Q3 Planning Session"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Date/Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Start</label>
            <input type="datetime-local" value={startDt} onChange={e => setStartDt(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">End</label>
            <input type="datetime-local" value={endDt} onChange={e => setEndDt(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Timezone</label>
          <select value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white">
            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>

        {/* Recurrence */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Recurrence</label>
          <div className="flex gap-2">
            {recurrenceOptions.map(r => (
              <button
                key={r.key}
                onClick={() => setRecurrence(r.key)}
                className="flex-1 py-2 rounded-lg text-sm font-medium border transition-all"
                style={{ borderColor: recurrence === r.key ? '#5b5fc7' : '#d1d5db', color: recurrence === r.key ? '#5b5fc7' : '#4b5563', background: recurrence === r.key ? '#fff7ed' : 'white' }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Call Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Call Type</label>
          <div className="flex gap-3">
            {([['video', 'Video', Video], ['audio', 'Audio Only', Phone]] as const).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setCallType(key as 'video' | 'audio')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all"
                style={{ borderColor: callType === key ? '#5b5fc7' : '#d1d5db', color: callType === key ? '#5b5fc7' : '#4b5563', background: callType === key ? '#fff7ed' : 'white' }}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Participants */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Participants</label>
          <div className="relative mb-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={participantSearch}
              onChange={e => setParticipantSearch(e.target.value)}
              placeholder="Search team members..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          {participantSearch && filteredMembers.length > 0 && (
            <div className="border border-gray-200 rounded-xl shadow-sm mb-2 overflow-hidden">
              {filteredMembers.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setSelectedParticipants(p => [...p, m]); setParticipantSearch(''); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left"
                >
                  <Avatar initials={m.initials} color={m.color} size={28} />
                  <span className="text-sm text-gray-700">{m.name}</span>
                  <Plus size={14} className="ml-auto text-orange-500" />
                </button>
              ))}
            </div>
          )}
          {selectedParticipants.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedParticipants.map(p => (
                <div key={p.id} className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200 bg-white text-sm">
                  <Avatar initials={p.initials} color={p.color} size={20} />
                  {p.name}
                  <button onClick={() => setSelectedParticipants(prev => prev.filter(x => x.id !== p.id))} className="ml-1 text-gray-400 hover:text-gray-600"><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">Options</label>
          {[
            { label: 'Waiting Room', desc: 'Admit participants manually', value: waitingRoom, onChange: () => setWaitingRoom(v => !v) },
            { label: 'Auto-Record', desc: 'Automatically start recording', value: autoRecord, onChange: () => setAutoRecord(v => !v) },
            { label: 'Require Password', desc: 'Participants must enter a password', value: requirePassword, onChange: () => setRequirePassword(v => !v) },
          ].map(opt => (
            <div key={opt.label} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
              <div>
                <div className="text-sm font-medium text-gray-800">{opt.label}</div>
                <div className="text-xs text-gray-500">{opt.desc}</div>
              </div>
              <Toggle value={opt.value} onChange={opt.onChange} />
            </div>
          ))}
          {requirePassword && (
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Meeting password"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400"
            />
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Description / Agenda</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder="Add agenda or notes..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pb-8">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleSchedule}
            disabled={!title.trim()}
            className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#5b5fc7' }}
          >
            Schedule Meeting
          </button>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white"
            style={{ background: '#16a34a' }}
          >
            <Check size={18} />
            <span className="text-sm font-medium">Meeting scheduled! Link copied to clipboard.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
