/**
 * useCallStore — Zustand store for managing active call state
 * Covers: room, participants, in-call chat, reactions, hand raises,
 * recording, breakout rooms, polls, Q&A, captions, and quality stats.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CallParticipant {
  userId: string;
  name: string;
  avatarUrl?: string;
  role: 'host' | 'co-host' | 'participant';
  muted: boolean;
  cameraOff: boolean;
  handRaised: boolean;
  isSpeaking: boolean;
  screenSharing: boolean;
  stream?: MediaStream;
  networkQuality: 1 | 2 | 3 | 4 | 5; // 1=terrible, 5=excellent
  joinedAt: number;
}

export interface CallMessage {
  id: string;
  userId: string;
  name: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface Reaction {
  id: string;
  userId: string;
  name: string;
  emoji: string;
  timestamp: number;
}

export interface BreakoutRoom {
  id: string;
  name: string;
  participants: string[]; // userIds
  timerSeconds?: number;
  timerStarted?: number;
}

export interface Poll {
  id: string;
  question: string;
  options: { label: string; votes: number; voters: string[] }[];
  createdBy: string;
  createdAt: number;
  closed: boolean;
}

export interface QAQuestion {
  id: string;
  userId: string;
  name: string;
  text: string;
  upvotes: number;
  voters: string[];
  answered: boolean;
  dismissed: boolean;
  timestamp: number;
}

export interface NetworkStats {
  latencyMs: number;
  packetLossPct: number;
  resolution: string;
  bitratekbps: number;
  qualityScore: 1 | 2 | 3 | 4 | 5;
}

export interface LiveCaption {
  userId: string;
  name: string;
  text: string;
  timestamp: number;
}

export interface ScheduledMeeting {
  id: string;
  title: string;
  description: string;
  hostId: string;
  hostName: string;
  startTime: number; // unix ms
  endTime: number;
  timezone: string;
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly';
  participantIds: string[];
  participantNames: string[];
  type: 'video' | 'audio';
  waitingRoom: boolean;
  autoRecord: boolean;
  password?: string;
  meetingId: string;
  joinLink: string;
  status: 'upcoming' | 'live' | 'ended';
}

export interface Recording {
  id: string;
  meetingId: string;
  title: string;
  date: number;
  durationSecs: number;
  participantCount: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  transcript?: string;
  aiSummary?: string;
}

export interface CallState {
  // Active call
  roomId: string | null;
  localUserId: string | null;
  localStream: MediaStream | null;
  participants: Map<string, CallParticipant>;
  isConnecting: boolean;
  callType: 'video' | 'audio' | 'screen';

  // Self state
  muted: boolean;
  cameraOff: boolean;
  screenSharing: boolean;
  handRaised: boolean;
  activeSpeakerId: string | null;
  virtualBackground: 'none' | 'blur' | 'office' | 'beach' | 'space' | 'custom';
  noiseSuppression: boolean;

  // UI panels
  chatOpen: boolean;
  participantsOpen: boolean;
  qaOpen: boolean;
  whiteboardOpen: boolean;
  rightPanelTab: 'chat' | 'participants' | 'qa';

  // Recording
  recording: boolean;
  recordingStartedAt: number | null;

  // In-call chat
  messages: CallMessage[];

  // Reactions (ephemeral, fade out)
  reactions: Reaction[];

  // Hand-raise queue
  handRaiseQueue: string[]; // ordered userIds

  // Live captions
  captionsEnabled: boolean;
  captions: LiveCaption[];

  // Breakout rooms
  breakoutRooms: BreakoutRoom[];
  currentBreakoutRoomId: string | null;

  // Polls
  polls: Poll[];

  // Q&A
  qaQuestions: QAQuestion[];

  // Network quality
  networkStats: NetworkStats | null;

  // Spotlighted participant
  spotlightedUserId: string | null;

  // Duration
  callStartedAt: number | null;

  // Scheduled meetings
  scheduledMeetings: ScheduledMeeting[];

  // Recordings library
  recordings: Recording[];

  // Post-call summary
  showPostCallSummary: boolean;
  postCallSummary: {
    durationSecs: number;
    participantNames: string[];
    messages: CallMessage[];
    aiSummary: string;
    recordingAvailable: boolean;
  } | null;

  // Actions
  joinRoom: (roomId: string, userId: string, type: 'video' | 'audio' | 'screen') => void;
  leaveRoom: () => void;
  setLocalStream: (stream: MediaStream | null) => void;
  addParticipant: (p: CallParticipant) => void;
  removeParticipant: (userId: string) => void;
  updateParticipant: (userId: string, updates: Partial<CallParticipant>) => void;
  setMuted: (muted: boolean) => void;
  setCameraOff: (off: boolean) => void;
  setScreenSharing: (sharing: boolean) => void;
  setHandRaised: (raised: boolean) => void;
  setActiveSpeaker: (userId: string | null) => void;
  setVirtualBackground: (bg: CallState['virtualBackground']) => void;
  toggleNoiseSuppression: () => void;
  setChatOpen: (open: boolean) => void;
  setParticipantsOpen: (open: boolean) => void;
  setQaOpen: (open: boolean) => void;
  setWhiteboardOpen: (open: boolean) => void;
  setRightPanelTab: (tab: CallState['rightPanelTab']) => void;
  startRecording: () => void;
  stopRecording: () => void;
  sendMessage: (userId: string, name: string, text: string) => void;
  addReaction: (userId: string, name: string, emoji: string) => void;
  removeReaction: (id: string) => void;
  raiseHand: (userId: string) => void;
  lowerHand: (userId: string) => void;
  toggleCaptions: () => void;
  addCaption: (userId: string, name: string, text: string) => void;
  createBreakoutRooms: (count: number, participantIds: string[]) => void;
  assignToBreakout: (userId: string, roomId: string) => void;
  joinBreakoutRoom: (roomId: string | null) => void;
  createPoll: (question: string, options: string[], createdBy: string) => void;
  votePoll: (pollId: string, optionIndex: number, userId: string) => void;
  closePoll: (pollId: string) => void;
  addQaQuestion: (userId: string, name: string, text: string) => void;
  upvoteQuestion: (questionId: string, userId: string) => void;
  answerQuestion: (questionId: string) => void;
  dismissQuestion: (questionId: string) => void;
  setNetworkStats: (stats: NetworkStats) => void;
  setSpotlight: (userId: string | null) => void;
  setIsConnecting: (v: boolean) => void;
  scheduleMeeting: (m: Omit<ScheduledMeeting, 'id' | 'meetingId' | 'joinLink'>) => ScheduledMeeting;
  dismissPostCallSummary: () => void;
}

// ── Helper ────────────────────────────────────────────────────────────────────

function generateMeetingId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) id += '-';
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

const MOCK_RECORDINGS: Recording[] = [
  {
    id: 'rec-1', meetingId: 'mtg-abc', title: 'Weekly All-Hands — May 2026',
    date: Date.now() - 7 * 24 * 3600 * 1000, durationSecs: 3420, participantCount: 12,
    aiSummary: 'Key decisions: Q3 roadmap approved, new hire onboarding revamped. Action items: Update docs by Friday, schedule 1:1s for new team members.',
    transcript: 'Sonadarshan: Welcome everyone...\nMaya: Thanks for joining...',
  },
  {
    id: 'rec-2', meetingId: 'mtg-def', title: 'Design Review — Dashboard v3',
    date: Date.now() - 3 * 24 * 3600 * 1000, durationSecs: 2160, participantCount: 5,
    aiSummary: 'Key decisions: Dark mode approved for GA. Action items: Implement accessibility fixes, update design tokens.',
  },
  {
    id: 'rec-3', meetingId: 'mtg-ghi', title: 'Sprint 14 Retrospective',
    date: Date.now() - 1 * 24 * 3600 * 1000, durationSecs: 1800, participantCount: 8,
    aiSummary: 'Key decisions: Reduce WIP limit to 3. Action items: Update team norms document, set up automated velocity tracking.',
  },
];

// ── Store ─────────────────────────────────────────────────────────────────────

export const useCallStore = create<CallState>()(
  subscribeWithSelector((set, get) => ({
    // Active call
    roomId: null,
    localUserId: null,
    localStream: null,
    participants: new Map(),
    isConnecting: false,
    callType: 'video',

    // Self
    muted: false,
    cameraOff: false,
    screenSharing: false,
    handRaised: false,
    activeSpeakerId: null,
    virtualBackground: 'none',
    noiseSuppression: true,

    // UI
    chatOpen: false,
    participantsOpen: false,
    qaOpen: false,
    whiteboardOpen: false,
    rightPanelTab: 'chat',

    // Recording
    recording: false,
    recordingStartedAt: null,

    // Data
    messages: [],
    reactions: [],
    handRaiseQueue: [],
    captionsEnabled: false,
    captions: [],
    breakoutRooms: [],
    currentBreakoutRoomId: null,
    polls: [],
    qaQuestions: [],
    networkStats: null,
    spotlightedUserId: null,
    callStartedAt: null,
    scheduledMeetings: [],
    recordings: MOCK_RECORDINGS,
    showPostCallSummary: false,
    postCallSummary: null,

    // ── Actions ───────────────────────────────────────────────────────────────

    joinRoom: (roomId, userId, type) => set({
      roomId, localUserId: userId, callType: type,
      isConnecting: true, callStartedAt: Date.now(),
      messages: [], reactions: [], handRaiseQueue: [],
      captions: [], polls: [], qaQuestions: [],
      breakoutRooms: [], currentBreakoutRoomId: null,
      participants: new Map(), spotlightedUserId: null,
      recording: false, recordingStartedAt: null,
      showPostCallSummary: false, postCallSummary: null,
    }),

    leaveRoom: () => {
      const s = get();
      const durationSecs = s.callStartedAt ? Math.round((Date.now() - s.callStartedAt) / 1000) : 0;
      const participantNames = Array.from(s.participants.values()).map(p => p.name);
      const aiSummary = `Key decisions made during the ${Math.round(durationSecs / 60)}-minute call. ` +
        `Action items: Follow up on discussed topics, schedule next meeting.`;
      set({
        roomId: null, localUserId: null, localStream: null,
        participants: new Map(), isConnecting: false,
        muted: false, cameraOff: false, screenSharing: false, handRaised: false,
        chatOpen: false, participantsOpen: false, qaOpen: false, whiteboardOpen: false,
        recording: false, recordingStartedAt: null,
        handRaiseQueue: [], breakoutRooms: [], currentBreakoutRoomId: null,
        activeSpeakerId: null, spotlightedUserId: null,
        showPostCallSummary: true,
        postCallSummary: {
          durationSecs, participantNames,
          messages: s.messages,
          aiSummary,
          recordingAvailable: s.recording || !!s.recordingStartedAt,
        },
      });
    },

    setLocalStream: (stream) => set({ localStream: stream }),

    addParticipant: (p) => set((s) => {
      const next = new Map(s.participants);
      next.set(p.userId, p);
      return { participants: next };
    }),

    removeParticipant: (userId) => set((s) => {
      const next = new Map(s.participants);
      next.delete(userId);
      return {
        participants: next,
        handRaiseQueue: s.handRaiseQueue.filter(id => id !== userId),
      };
    }),

    updateParticipant: (userId, updates) => set((s) => {
      const next = new Map(s.participants);
      const existing = next.get(userId);
      if (existing) next.set(userId, { ...existing, ...updates });
      return { participants: next };
    }),

    setMuted: (muted) => set({ muted }),
    setCameraOff: (cameraOff) => set({ cameraOff }),
    setScreenSharing: (screenSharing) => set({ screenSharing }),
    setHandRaised: (handRaised) => set((s) => ({
      handRaised,
      handRaiseQueue: handRaised
        ? (s.localUserId && !s.handRaiseQueue.includes(s.localUserId)
          ? [...s.handRaiseQueue, s.localUserId] : s.handRaiseQueue)
        : s.handRaiseQueue.filter(id => id !== s.localUserId),
    })),

    setActiveSpeaker: (userId) => set({ activeSpeakerId: userId }),
    setVirtualBackground: (virtualBackground) => set({ virtualBackground }),
    toggleNoiseSuppression: () => set((s) => ({ noiseSuppression: !s.noiseSuppression })),
    setChatOpen: (chatOpen) => set({ chatOpen, rightPanelTab: chatOpen ? 'chat' : get().rightPanelTab }),
    setParticipantsOpen: (participantsOpen) => set({ participantsOpen, rightPanelTab: participantsOpen ? 'participants' : get().rightPanelTab }),
    setQaOpen: (qaOpen) => set({ qaOpen, rightPanelTab: qaOpen ? 'qa' : get().rightPanelTab }),
    setWhiteboardOpen: (whiteboardOpen) => set({ whiteboardOpen }),
    setRightPanelTab: (rightPanelTab) => set({ rightPanelTab }),

    startRecording: () => set({ recording: true, recordingStartedAt: Date.now() }),
    stopRecording: () => set({ recording: false }),

    sendMessage: (userId, name, text) => set((s) => ({
      messages: [...s.messages, {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        userId, name, text, timestamp: Date.now(),
      }],
    })),

    addReaction: (userId, name, emoji) => set((s) => {
      const id = `rxn-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      return { reactions: [...s.reactions, { id, userId, name, emoji, timestamp: Date.now() }] };
    }),

    removeReaction: (id) => set((s) => ({ reactions: s.reactions.filter(r => r.id !== id) })),

    raiseHand: (userId) => set((s) => ({
      handRaiseQueue: s.handRaiseQueue.includes(userId) ? s.handRaiseQueue : [...s.handRaiseQueue, userId],
    })),

    lowerHand: (userId) => set((s) => ({
      handRaiseQueue: s.handRaiseQueue.filter(id => id !== userId),
    })),

    toggleCaptions: () => set((s) => ({ captionsEnabled: !s.captionsEnabled })),

    addCaption: (userId, name, text) => set((s) => {
      const caption: LiveCaption = { userId, name, text, timestamp: Date.now() };
      const captions = [...s.captions, caption].slice(-3); // keep last 3
      return { captions };
    }),

    createBreakoutRooms: (count, participantIds) => {
      const rooms: BreakoutRoom[] = Array.from({ length: count }, (_, i) => ({
        id: `br-${i + 1}`,
        name: `Breakout Room ${i + 1}`,
        participants: [],
      }));
      // Auto-assign participants round-robin
      participantIds.forEach((uid, idx) => {
        rooms[idx % count].participants.push(uid);
      });
      set({ breakoutRooms: rooms });
    },

    assignToBreakout: (userId, roomId) => set((s) => ({
      breakoutRooms: s.breakoutRooms.map(room => ({
        ...room,
        participants: room.id === roomId
          ? (room.participants.includes(userId) ? room.participants : [...room.participants, userId])
          : room.participants.filter(id => id !== userId),
      })),
    })),

    joinBreakoutRoom: (roomId) => set({ currentBreakoutRoomId: roomId }),

    createPoll: (question, options, createdBy) => set((s) => ({
      polls: [...s.polls, {
        id: `poll-${Date.now()}`,
        question, createdBy, createdAt: Date.now(), closed: false,
        options: options.map(label => ({ label, votes: 0, voters: [] })),
      }],
    })),

    votePoll: (pollId, optionIndex, userId) => set((s) => ({
      polls: s.polls.map(p => {
        if (p.id !== pollId || p.closed) return p;
        // Remove previous vote
        const newOptions = p.options.map(opt => ({
          ...opt, voters: opt.voters.filter(v => v !== userId),
          votes: opt.voters.includes(userId) ? opt.votes - 1 : opt.votes,
        }));
        // Add new vote
        newOptions[optionIndex] = {
          ...newOptions[optionIndex],
          voters: [...newOptions[optionIndex].voters, userId],
          votes: newOptions[optionIndex].votes + 1,
        };
        return { ...p, options: newOptions };
      }),
    })),

    closePoll: (pollId) => set((s) => ({
      polls: s.polls.map(p => p.id === pollId ? { ...p, closed: true } : p),
    })),

    addQaQuestion: (userId, name, text) => set((s) => ({
      qaQuestions: [...s.qaQuestions, {
        id: `qa-${Date.now()}`,
        userId, name, text, upvotes: 0, voters: [],
        answered: false, dismissed: false, timestamp: Date.now(),
      }],
    })),

    upvoteQuestion: (questionId, userId) => set((s) => ({
      qaQuestions: s.qaQuestions.map(q => {
        if (q.id !== questionId) return q;
        const hasVoted = q.voters.includes(userId);
        return {
          ...q,
          upvotes: hasVoted ? q.upvotes - 1 : q.upvotes + 1,
          voters: hasVoted ? q.voters.filter(v => v !== userId) : [...q.voters, userId],
        };
      }),
    })),

    answerQuestion: (questionId) => set((s) => ({
      qaQuestions: s.qaQuestions.map(q => q.id === questionId ? { ...q, answered: true } : q),
    })),

    dismissQuestion: (questionId) => set((s) => ({
      qaQuestions: s.qaQuestions.map(q => q.id === questionId ? { ...q, dismissed: true } : q),
    })),

    setNetworkStats: (networkStats) => set({ networkStats }),
    setSpotlight: (spotlightedUserId) => set({ spotlightedUserId }),
    setIsConnecting: (isConnecting) => set({ isConnecting }),

    scheduleMeeting: (m) => {
      const id = `sched-${Date.now()}`;
      const meetingId = generateMeetingId();
      const meeting: ScheduledMeeting = {
        ...m, id, meetingId,
        joinLink: `https://brixstac.app/join/${meetingId}`,
      };
      set((s) => ({ scheduledMeetings: [...s.scheduledMeetings, meeting] }));
      return meeting;
    },

    dismissPostCallSummary: () => set({ showPostCallSummary: false, postCallSummary: null }),
  }))
);
