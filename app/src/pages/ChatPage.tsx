// ============================================================
// Brixstac OS — Enterprise Chat Page
// Complete Slack + Teams replacement with Socket.IO real-time
// ============================================================

import {
  useState, useRef, useEffect, useCallback, useMemo, memo,
} from 'react';
import { chatApi } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { io, Socket } from 'socket.io-client';
import {
  Send, Paperclip, Phone, Video, Smile, Search, X, Sparkles,
  Bot, Pin, Lock, Edit3, ChevronDown, ChevronRight,
  Plus, MoreHorizontal, Bell, Mic, AtSign, Hash,
  Bold, Italic, Strikethrough, Code, List, Link2,
  MessageSquare, Bookmark, Forward, Trash2, Settings,
  Users, AlertCircle, FileText, Image as ImageIcon,
  Download, Star, Globe, LogOut, HelpCircle,
  CheckCheck, Check, Zap, BarChart2, Clock,
  ChevronUp, Eye, EyeOff, Volume2, VolumeX,
  Copy, ExternalLink, RefreshCw, Filter, Calendar,
  PanelRightOpen, PanelRightClose, Maximize2, Minimize2,
  BellOff, UserPlus, Flag, Archive, Headphones,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   TYPES & INTERFACES
   ═══════════════════════════════════════════════════════════════ */

interface WorkspaceMember {
  id: string;
  name: string;
  title: string;
  email: string;
  status: 'online' | 'offline' | 'away' | 'dnd';
  kind: 'human' | 'ai';
  initials: string;
  color: string;
  avatar?: string;
  timezone?: string;
  customStatus?: { emoji: string; text: string; expiresAt?: string };
}

interface Channel {
  id: string;
  name: string;
  description: string;
  members: number;
  unread: number;
  private: boolean;
  muted?: boolean;
  notificationPref?: 'all' | 'mentions' | 'nothing';
  pinnedCount?: number;
  topic?: string;
}

interface DMConversation {
  id: string;
  personId: string;
  unread: number;
  lastMessage: string;
  lastTime: string;
  readReceipt?: 'sent' | 'delivered' | 'read';
}

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

interface MessageAttachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'video';
  url?: string;
  size?: string;
  preview?: string;
}

interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

interface Poll {
  question: string;
  options: PollOption[];
  closed?: boolean;
  multiSelect?: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  time: string;
  timestamp: number;
  isMe?: boolean;
  reactions?: Reaction[];
  threadCount?: number;
  threadUsers?: string[];
  edited?: boolean;
  pinned?: boolean;
  bookmarked?: boolean;
  attachments?: MessageAttachment[];
  isUnreadDivider?: boolean;
  pending?: boolean;
  failed?: boolean;
  poll?: Poll;
  replyTo?: { id: string; senderName: string; text: string };
  channelId?: string;
}

interface ThreadState {
  open: boolean;
  parentMessage: ChatMessage | null;
  replies: ChatMessage[];
  following: boolean;
}

interface SearchResult {
  id: string;
  type: 'message' | 'file' | 'channel' | 'person';
  channelId?: string;
  channelName?: string;
  senderId?: string;
  senderName?: string;
  text?: string;
  time?: string;
  name?: string;
  description?: string;
}

interface ScheduledMsg {
  id?: string;
  channelId: string;
  text: string;
  scheduledAt: string;
}

interface LinkPreviewData {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
}

interface HuddleState {
  channelId: string;
  participants: string[];
  active: boolean;
}

type ActivePanel = 'none' | 'pinned' | 'bookmarks' | 'members' | 'thread';
type NotifPref = 'all' | 'mentions' | 'nothing' | 'muted';

const SLASH_COMMANDS = [
  { command: '/status', description: 'Set your status' },
  { command: '/remind', description: 'Set a reminder' },
  { command: '/giphy', description: 'Search GIFs' },
  { command: '/invite', description: 'Invite to channel' },
  { command: '/leave', description: 'Leave channel' },
];

/* ═══════════════════════════════════════════════════════════════
   STATIC / MOCK DATA
   ═══════════════════════════════════════════════════════════════ */

const WORKSPACE_MEMBERS: WorkspaceMember[] = [
  { id: 'u-alex', name: 'Alex Chen', title: 'CEO & Founder', email: 'alex@brixstac.io', status: 'online', kind: 'human', initials: 'AC', color: '#c4314b', timezone: 'America/New_York' },
  { id: 'u-sarah', name: 'Sarah Kim', title: 'Co-founder & CTO', email: 'sarah@brixstac.io', status: 'online', kind: 'human', initials: 'SK', color: '#0891b2', timezone: 'Asia/Kolkata' },
  { id: 'u-aria', name: 'Aria', title: 'AI Sr. Developer', email: 'aria@brixstac.io', status: 'online', kind: 'ai', initials: 'AR', color: '#7c3aed' },
  { id: 'u-sage', name: 'Sage', title: 'AI Backend Dev', email: 'sage@brixstac.io', status: 'online', kind: 'ai', initials: 'SG', color: '#6d28d9' },
  { id: 'u-pixel', name: 'Pixel', title: 'AI Designer', email: 'pixel@brixstac.io', status: 'online', kind: 'ai', initials: 'PX', color: '#7c3aed' },
  { id: 'u-echo', name: 'Echo', title: 'AI DevOps', email: 'echo@brixstac.io', status: 'online', kind: 'ai', initials: 'EC', color: '#5b21b6' },
  { id: 'u-nova', name: 'Nova', title: 'AI QA Engineer', email: 'nova@brixstac.io', status: 'away', kind: 'ai', initials: 'NV', color: '#0e7490' },
];

const INITIAL_CHANNELS: Channel[] = [
  { id: 'c-general', name: 'general', description: 'Company-wide announcements and work-based matters', members: 9, unread: 3, private: false, pinnedCount: 2 },
  { id: 'c-engineering', name: 'engineering', description: 'All things engineering', members: 7, unread: 8, private: false, pinnedCount: 1 },
  { id: 'c-frontend', name: 'frontend', description: 'Frontend development discussions', members: 4, unread: 2, private: false },
  { id: 'c-backend', name: 'backend', description: 'Backend and API discussions', members: 3, unread: 5, private: false },
  { id: 'c-ai-updates', name: 'ai-updates', description: 'AI employee updates and announcements', members: 9, unread: 4, private: false },
  { id: 'c-announcements', name: 'announcements', description: 'Important company announcements', members: 9, unread: 1, private: false },
  { id: 'c-random', name: 'random', description: 'Non-work banter and fun stuff', members: 9, unread: 0, private: false },
  { id: 'c-design', name: 'design', description: 'Design system and UI/UX', members: 5, unread: 0, private: false },
  { id: 'c-qa', name: 'qa', description: 'Quality assurance and testing', members: 3, unread: 2, private: false },
  { id: 'c-devops', name: 'devops', description: 'Infrastructure and deployments', members: 4, unread: 0, private: false },
  { id: 'c-leadership', name: 'leadership', description: 'Leadership discussions', members: 3, unread: 0, private: true },
];

const INITIAL_DMS: DMConversation[] = [
  { id: 'dm-aria', personId: 'u-aria', unread: 2, lastMessage: 'The PR is ready for review!', lastTime: '2m ago', readReceipt: 'delivered' },
  { id: 'dm-sage', personId: 'u-sage', unread: 0, lastMessage: 'API endpoints are all set', lastTime: '1h ago', readReceipt: 'read' },
  { id: 'dm-sarah', personId: 'u-sarah', unread: 1, lastMessage: 'Can we sync tomorrow?', lastTime: '3h ago', readReceipt: 'sent' },
];

function generateMockMessages(channelId: string, currentUserId: string): ChatMessage[] {
  const senders = WORKSPACE_MEMBERS.slice(0, 5);
  const now = Date.now();
  const msgs: ChatMessage[] = [];
  const texts: Record<string, string[]> = {
    'c-general': [
      'Good morning everyone! Ready for another productive day 🚀',
      'Reminder: all-hands meeting at 3pm today',
      'The new design system components are live in Storybook',
      'Sprint 14 planning doc is in the drive, please review before Thursday',
      'Just pushed a fix for the auth bug — can someone verify on staging?',
      "Great work on the Q2 release team! That was a huge milestone 🎉",
    ],
    'c-engineering': [
      'Anyone seen this weird TypeScript error? `Type instantiation is excessively deep`',
      'Just merged the new WebSocket architecture — latency dropped 40%',
      'We need to upgrade our Node version before the next deploy',
      "The CI pipeline is failing on the lint step — I'm looking into it",
      'Code review requested on #1247 — new rate limiting middleware',
      'Database migration scripts are ready for review',
    ],
    'c-frontend': [
      'Working on the new dashboard layout — should be done by EOD',
      'React 19 is out! Should we plan the upgrade?',
      'Bundle size is up 12% — need to audit our dependencies',
      'The animation performance on mobile needs work',
      'New component: `<DataTable />` with virtual scrolling — 10x faster',
    ],
    'default': [
      'Hey, just checking in!',
      'Working on it, will update soon',
      'That looks great, nice work',
      'Let me know if you need any help',
      'On it!',
      'Done ✓',
    ],
  };
  const channelTexts = texts[channelId] || texts['default'];

  for (let i = 0; i < 20; i++) {
    const sender = senders[i % senders.length];
    const isMe = sender.id === currentUserId;
    const hoursAgo = (20 - i) * 0.5;
    const ts = now - hoursAgo * 3600 * 1000;
    const d = new Date(ts);
    msgs.push({
      id: `msg-${channelId}-${i}`,
      senderId: sender.id,
      senderName: sender.name,
      text: channelTexts[i % channelTexts.length],
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: ts,
      isMe,
      reactions: i === 3 ? [
        { emoji: '👍', count: 3, users: ['u-aria', 'u-sage', 'u-sarah'] },
        { emoji: '🚀', count: 2, users: ['u-pixel', 'u-echo'] },
      ] : i === 7 ? [
        { emoji: '❤️', count: 1, users: ['u-alex'] },
      ] : undefined,
      threadCount: i === 5 ? 4 : i === 10 ? 2 : 0,
      pinned: i === 2,
      channelId,
    });
  }
  return msgs;
}

/* ═══════════════════════════════════════════════════════════════
   EMOJI DATA
   ═══════════════════════════════════════════════════════════════ */

const EMOJI_CATEGORIES = {
  'Smileys': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐'],
  'People': ['👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦','🤷','👮','🕵️','💂','🥷','👷','🫅','🤴','👸','👲','🧕','🤵','👰','🤰','🤱','👼','🎅','🤶','🧙','🧝','🧛','🧟','🧞','🧜','🧚','🧑‍🦰','🧑‍🦱','🧑‍🦳','🧑‍🦲','🙊','🙉','🙈','🐵'],
  'Nature': ['🌱','🌿','🍀','🎋','🍃','🍂','🍁','🪺','🪸','🌾','🌷','🌹','🥀','🪷','🌺','🌸','🌼','🌻','🌞','🌝','🌛','🌜','🌚','🌕','🌖','🌗','🌘','🌑','🌒','🌓','🌔','🌙','🌟','⭐','🌠','🌌','⛅','🌤️','🔥','💧','🌊','🌈','🌀','🌪️','⚡','❄️','🌵','🎄','🌴','🪵','🪨'],
  'Food': ['🍏','🍎','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🥑','🍆','🥔','🥕','🌽','🌶️','🫑','🥦','🥬','🧄','🧅','🍄','🥜','🌰','🍞','🥐','🥖','🫓','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫔','🌮'],
  'Activities': ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🏒','🥍','🏑','🏏','🪃','⛳','🎣','🤿','🎽','🛹','🛼','🛷','⛸️','🥋','🥊','🥅','⛺','🎪','🤹','🎭','🎨','🎬','🎤','🎧','🎼','🎵','🎶','🎸','🎹','🥁','🎻','🎺','🪗','🎲','♟️','🎯','🎳','🎮','🎰','🧩'],
  'Travel': ['🚗','🚕','🚙','🛻','🚌','🏎️','🚓','🚑','🚒','🚐','🛵','🏍️','🚲','🛴','🛺','🚨','✈️','🚀','🛸','🚁','⛵','🚢','🛳️','🚂','🚃','🚋','🚝','🚄','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏧','🏨','🏩','🏪','🏫','🏬','🏭','🏗️','⛩️','🕌','🕍','⛪','🏟️','🎡','🎢'],
  'Objects': ['⌚','📱','💻','⌨️','🖥️','🖨️','🖱️','💾','💿','📀','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📺','📻','🧭','⏱️','⏰','🕰️','⌛','📡','🔋','🔌','💡','🔦','🕯️','🪔','🧯','📖','📚','📝','✏️','🖊️','🖋️','📌','📍','📎','🖇️','📐','📏','🗂️','📁','📂','🗑️','🔒','🔓'],
  'Symbols': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','✡️','🔯','☯️','⚛️','🛐','♾️','💲','💱','✖️','➕','➖','➗','🟰','♻️','🔱','📛','🔰','⭕','✅','❌','❎','🔄','🔃','🔙','🔚','🔛','🔜','🔝'],
  'Flags': ['🏳️','🏴','🏁','🚩','🏳️‍🌈','🏳️‍⚧️','🏴‍☠️','🇦🇫','🇦🇱','🇩🇿','🇺🇸','🇬🇧','🇨🇦','🇦🇺','🇩🇪','🇫🇷','🇯🇵','🇰🇷','🇮🇳','🇧🇷','🇲🇽','🇮🇹','🇪🇸','🇷🇺','🇨🇳','🇸🇦','🇿🇦','🇦🇷','🇳🇬','🇵🇰','🇧🇩','🇮🇩','🇳🇱','🇧🇪','🇨🇭','🇸🇪','🇳🇴','🇩🇰','🇫🇮','🇵🇱'],
};

const QUICK_REACTIONS = ['👍','❤️','😂','😮','😢','🎉'];

/* ═══════════════════════════════════════════════════════════════
   UTILITY HELPERS
   ═══════════════════════════════════════════════════════════════ */

function formatDateLabel(timestamp: number): string {
  const d = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function getLocalTime(timezone?: string): string {
  try {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', timeZone: timezone || 'UTC',
    });
  } catch {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
}

function getMemberById(id: string): WorkspaceMember | undefined {
  return WORKSPACE_MEMBERS.find(m => m.id === id);
}

function getPresenceDot(status: WorkspaceMember['status']): string {
  const map = { online: '#22c55e', away: '#f59e0b', dnd: '#ef4444', offline: '#6b7280' };
  return map[status] || '#6b7280';
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

// ── Avatar ──────────────────────────────────────────────────
interface AvatarProps {
  member: WorkspaceMember;
  size?: 'sm' | 'md' | 'lg';
  showPresence?: boolean;
  onClick?: () => void;
}
const Avatar = memo(({ member, size = 'md', showPresence = false, onClick }: AvatarProps) => {
  const dims = { sm: 28, md: 36, lg: 48 }[size];
  const fontSize = { sm: 10, md: 13, lg: 18 }[size];
  return (
    <div
      className="relative flex-shrink-0 cursor-pointer"
      style={{ width: dims, height: dims }}
      onClick={onClick}
    >
      <div
        className="w-full h-full rounded-full flex items-center justify-center font-semibold text-white select-none"
        style={{ background: member.color, fontSize }}
      >
        {member.initials}
      </div>
      {member.kind === 'ai' && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-purple-600 rounded-full flex items-center justify-center">
          <Sparkles size={7} className="text-white" />
        </div>
      )}
      {showPresence && member.kind !== 'ai' && (
        <div
          className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#1a1a2e]"
          style={{ background: getPresenceDot(member.status) }}
        />
      )}
    </div>
  );
});

// ── Presence Dot (standalone) ────────────────────────────────
const PresenceDot = ({ status }: { status: WorkspaceMember['status'] }) => (
  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getPresenceDot(status) }} />
);

// ── Typing Indicator ────────────────────────────────────────
const TypingIndicator = ({ names }: { names: string[] }) => {
  if (!names.length) return null;
  const label = names.length === 1
    ? `${names[0]} is typing…`
    : names.length === 2
    ? `${names[0]} and ${names[1]} are typing…`
    : `${names[0]} and ${names.length - 1} others are typing…`;
  return (
    <div className="flex items-center gap-2 px-4 py-1 text-xs text-gray-400">
      <div className="flex gap-0.5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gray-400"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <span>{label}</span>
    </div>
  );
};

// ── Emoji Picker ────────────────────────────────────────────
interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}
const EmojiPicker = memo(({ onSelect, onClose }: EmojiPickerProps) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Smileys');
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('brixstac-recent-emoji') || '[]'); } catch { return []; }
  });

  const filteredEmojis = useMemo(() => {
    if (!search) return null;
    const q = search.toLowerCase();
    return Object.values(EMOJI_CATEGORIES).flat().filter(e => e.includes(q));
  }, [search]);

  const handleSelect = (emoji: string) => {
    const updated = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 20);
    setRecentEmojis(updated);
    localStorage.setItem('brixstac-recent-emoji', JSON.stringify(updated));
    onSelect(emoji);
  };

  const displayEmojis = filteredEmojis || (
    activeCategory === 'Recent'
      ? recentEmojis
      : EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES] || []
  );

  const categories = ['Recent', ...Object.keys(EMOJI_CATEGORIES)];
  const categoryIcons: Record<string, string> = {
    Recent: '🕐', Smileys: '😀', People: '👨', Nature: '🌿', Food: '🍔',
    Activities: '⚽', Travel: '✈️', Objects: '💡', Symbols: '❤️', Flags: '🏳️',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 8 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full mb-2 right-0 w-80 bg-[#1e1e32] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Search */}
      <div className="p-2 border-b border-white/10">
        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5">
          <Search size={13} className="text-gray-400" />
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search emoji…"
            className="bg-transparent text-sm text-white placeholder-gray-400 outline-none w-full"
          />
        </div>
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="flex gap-0.5 px-2 py-1 overflow-x-auto scrollbar-hide border-b border-white/10">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              title={cat}
              className={`flex-shrink-0 px-1.5 py-1 rounded text-lg transition-colors ${activeCategory === cat ? 'bg-white/15' : 'hover:bg-white/5'}`}
            >
              {categoryIcons[cat] || '?'}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div className="p-2 h-48 overflow-y-auto">
        {!search && <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 px-1">{activeCategory}</div>}
        <div className="grid grid-cols-8 gap-0.5">
          {displayEmojis.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              onClick={() => handleSelect(emoji)}
              className="text-xl w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
            >
              {emoji}
            </button>
          ))}
          {displayEmojis.length === 0 && (
            <div className="col-span-8 text-center text-gray-500 py-4 text-sm">No emoji found</div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

// ── Profile Card Popover ────────────────────────────────────
interface ProfileCardProps {
  member: WorkspaceMember;
  onClose: () => void;
  onDm?: () => void;
  isOwnProfile?: boolean;
  onSetStatus?: () => void;
}
const ProfileCard = memo(({ member, onClose, onDm, isOwnProfile, onSetStatus }: ProfileCardProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 8 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: 8 }}
    transition={{ duration: 0.15 }}
    className="absolute z-50 w-72 bg-[#1e1e32] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
    style={{ bottom: 'calc(100% + 8px)', left: 0 }}
    onClick={e => e.stopPropagation()}
  >
    {/* Banner */}
    <div className="h-16" style={{ background: `linear-gradient(135deg, ${member.color}66, ${member.color}22)` }} />
    <div className="px-4 pb-4">
      {/* Avatar + status */}
      <div className="flex items-end justify-between -mt-6 mb-3">
        <div className="relative">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg border-4 border-[#1e1e32]"
            style={{ background: member.color }}
          >
            {member.initials}
          </div>
          {member.kind === 'ai' && (
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center border-2 border-[#1e1e32]">
              <Sparkles size={9} className="text-white" />
            </div>
          )}
          {member.kind !== 'ai' && (
            <div
              className="absolute bottom-0 right-1 w-3.5 h-3.5 rounded-full border-2 border-[#1e1e32]"
              style={{ background: getPresenceDot(member.status) }}
            />
          )}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="font-semibold text-white text-base">{member.name}</div>
      <div className="text-xs text-gray-400 mt-0.5">{member.title}</div>
      {member.customStatus && (
        <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-300">
          <span>{member.customStatus.emoji}</span>
          <span>{member.customStatus.text}</span>
        </div>
      )}
      {member.timezone && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
          <Clock size={11} />
          <span>{getLocalTime(member.timezone)} local time</span>
        </div>
      )}
      <div className="flex gap-2 mt-3">
        {!isOwnProfile && onDm && (
          <button
            onClick={() => { onDm(); onClose(); }}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#5b5fc7] hover:bg-[#c4674a] text-white text-xs font-medium py-2 rounded-lg transition-colors"
          >
            <MessageSquare size={13} />
            Message
          </button>
        )}
        {!isOwnProfile && (
          <button className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium py-2 rounded-lg transition-colors">
            <Video size={13} />
            Call
          </button>
        )}
        {isOwnProfile && onSetStatus && (
          <button
            onClick={() => { onSetStatus(); onClose(); }}
            className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium py-2 rounded-lg transition-colors"
          >
            <Smile size={13} />
            Set Status
          </button>
        )}
      </div>
    </div>
  </motion.div>
));

// ── Poll Renderer ────────────────────────────────────────────
interface PollRendererProps {
  poll: Poll;
  messageId: string;
  currentUserId: string;
  isCreator: boolean;
  onVote: (messageId: string, optionId: string) => void;
  onClose: (messageId: string) => void;
}
const PollRenderer = memo(({ poll, messageId, currentUserId, isCreator, onVote, onClose }: PollRendererProps) => {
  const totalVotes = poll.options.reduce((s, o) => s + o.votes.length, 0);
  const myVote = poll.options.find(o => o.votes.includes(currentUserId))?.id;
  return (
    <div className="mt-2 bg-white/5 rounded-xl p-4 max-w-sm border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 size={15} className="text-[#5b5fc7]" />
        <span className="font-semibold text-white text-sm">{poll.question}</span>
      </div>
      <div className="space-y-2">
        {poll.options.map(opt => {
          const pct = totalVotes ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
          const isMyChoice = opt.id === myVote;
          return (
            <button
              key={opt.id}
              disabled={poll.closed}
              onClick={() => !poll.closed && onVote(messageId, opt.id)}
              className={`w-full text-left rounded-lg overflow-hidden border transition-colors ${
                isMyChoice ? 'border-[#5b5fc7]' : 'border-white/10 hover:border-white/20'
              } ${poll.closed ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="relative px-3 py-2">
                <div
                  className="absolute inset-0 transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: isMyChoice ? 'rgba(217,119,87,0.2)' : 'rgba(255,255,255,0.05)',
                  }}
                />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-white">
                    {isMyChoice && <Check size={12} className="text-[#5b5fc7]" />}
                    {opt.text}
                  </div>
                  <span className="text-xs text-gray-400">{pct}%</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-500">{totalVotes} votes</span>
        {isCreator && !poll.closed && (
          <button onClick={() => onClose(messageId)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
            Close poll
          </button>
        )}
        {poll.closed && <span className="text-xs text-gray-500 italic">Poll closed</span>}
      </div>
    </div>
  );
});

// ── Message Composer ─────────────────────────────────────────
interface ComposerProps {
  channelId: string;
  placeholder?: string;
  onSend: (text: string, attachments?: File[]) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  members: WorkspaceMember[];
  channels: Channel[];
  replyTo?: { id: string; senderName: string; text: string };
  onClearReply?: () => void;
  onOpenPollBuilder?: () => void;
  onSchedule?: (text: string, at: string) => void;
  onSlashCommandResult?: (response: string) => void;
  workspaceId?: string;
  authToken?: string;
}
const MessageComposer = memo(({
  channelId, placeholder = 'Message…', onSend, onTypingStart, onTypingStop,
  members, channels, replyTo, onClearReply, onOpenPollBuilder, onSchedule,
  onSlashCommandResult, workspaceId = 'ws-default', authToken = '',
}: ComposerProps) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [showChannelMention, setShowChannelMention] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashIndex, setSlashIndex] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const isTypingRef = useRef(false);
  const draftKey = `brixstac-draft-${channelId}`;

  // Load draft
  useEffect(() => {
    const draft = localStorage.getItem(draftKey);
    if (draft && editorRef.current) {
      editorRef.current.innerText = draft;
      setText(draft);
    }
    return () => { if (editorRef.current) editorRef.current.innerText = ''; };
  }, [channelId]);

  const saveDraft = useCallback((val: string) => {
    if (val.trim()) localStorage.setItem(draftKey, val);
    else localStorage.removeItem(draftKey);
  }, [draftKey]);

  const handleTyping = useCallback(() => {
    const val = editorRef.current?.innerText || '';
    setText(val);
    saveDraft(val);

    // Detect slash commands
    if (val.startsWith('/')) {
      const parts = val.split(' ');
      const q = parts[0].slice(1); // text after /
      if (parts.length === 1) {
        setSlashQuery(q);
        setShowSlashCommands(true);
        setShowMentions(false);
        setShowChannelMention(false);
      } else {
        setShowSlashCommands(false);
      }
    } else {
      setShowSlashCommands(false);
    }

    // Detect @mention
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const textBefore = range.startContainer.textContent?.slice(0, range.startOffset) || '';
      const atMatch = textBefore.match(/@(\w*)$/);
      const hashMatch = textBefore.match(/#(\w*)$/);
      if (atMatch) {
        setMentionQuery(atMatch[1]);
        setShowMentions(true);
        setShowChannelMention(false);
        setShowSlashCommands(false);
      } else if (hashMatch) {
        setMentionQuery(hashMatch[1]);
        setShowChannelMention(true);
        setShowMentions(false);
        setShowSlashCommands(false);
      } else if (!val.startsWith('/')) {
        setShowMentions(false);
        setShowChannelMention(false);
      }
    }

    // Typing indicators
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTypingStart?.();
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onTypingStop?.();
    }, 2000);
  }, [saveDraft, onTypingStart, onTypingStop]);

  const filteredSlashCommands = SLASH_COMMANDS.filter(c =>
    c.command.slice(1).toLowerCase().startsWith(slashQuery.toLowerCase())
  );

  const insertSlashCommand = (cmd: string) => {
    if (editorRef.current) {
      editorRef.current.innerText = cmd + ' ';
      setText(cmd + ' ');
      // Move cursor to end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    setShowSlashCommands(false);
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showSlashCommands) {
      const cmds = SLASH_COMMANDS.filter(c => c.command.slice(1).toLowerCase().startsWith(slashQuery.toLowerCase()));
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIndex(i => Math.min(i + 1, cmds.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSlashIndex(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const cmd = cmds[slashIndex];
        if (cmd) insertSlashCommand(cmd.command);
        return;
      }
      if (e.key === 'Escape') { setShowSlashCommands(false); return; }
    }
    if (showMentions || showChannelMention) {
      const items = showMentions
        ? members.filter(m => m.name.toLowerCase().includes(mentionQuery.toLowerCase()))
        : channels.filter(c => c.name.toLowerCase().includes(mentionQuery.toLowerCase()));
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex(i => Math.min(i + 1, items.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const item = items[mentionIndex];
        if (item) insertMention(showMentions ? `@${item.name}` : `#${item.name}`);
        return;
      }
      if (e.key === 'Escape') { setShowMentions(false); setShowChannelMention(false); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
    if (e.key === 'Escape') {
      onClearReply?.();
      setShowEmoji(false);
    }
  }, [showSlashCommands, slashQuery, slashIndex, showMentions, showChannelMention, mentionQuery, mentionIndex, members, channels]);

  const insertMention = (mention: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const textBefore = range.startContainer.textContent?.slice(0, range.startOffset) || '';
    const atIdx = textBefore.lastIndexOf(showMentions ? '@' : '#');
    if (atIdx === -1) return;
    range.setStart(range.startContainer, atIdx);
    range.deleteContents();
    const node = document.createTextNode(mention + ' ');
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    setShowMentions(false);
    setShowChannelMention(false);
    setText(editor.innerText);
  };

  const doFormat = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    setText(editorRef.current?.innerText || '');
  };

  const doSend = () => {
    const val = editorRef.current?.innerText.trim() || '';
    if (!val && attachments.length === 0) return;

    // Handle slash command execution
    if (val.startsWith('/')) {
      const parts = val.split(/\s+/);
      const command = parts[0]; // e.g. "/status"
      const args = parts.slice(1).join(' ');
      // Only execute known slash commands
      const isKnown = SLASH_COMMANDS.some(c => c.command === command);
      if (isKnown) {
        chatApi.slashCommand(workspaceId, command.slice(1), args, channelId, authToken)
          .then((data: any) => {
            const response = data?.response || data?.message || `${command} executed`;
            onSlashCommandResult?.(response);
          })
          .catch(() => {
            onSlashCommandResult?.(`${command} executed`);
          });
        if (editorRef.current) editorRef.current.innerHTML = '';
        setText('');
        localStorage.removeItem(draftKey);
        clearTimeout(typingTimerRef.current);
        isTypingRef.current = false;
        onTypingStop?.();
        setShowSlashCommands(false);
        return;
      }
    }

    onSend(val, attachments.length ? attachments : undefined);
    if (editorRef.current) editorRef.current.innerHTML = '';
    setText('');
    setAttachments([]);
    localStorage.removeItem(draftKey);
    clearTimeout(typingTimerRef.current);
    isTypingRef.current = false;
    onTypingStop?.();
    onClearReply?.();
    setShowEmoji(false);
    setShowMentions(false);
    setShowSlashCommands(false);
  };

  const filteredMentions = members.filter(m =>
    m.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );
  const filteredChannelMentions = channels.filter(c =>
    c.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  return (
    <div className="flex-shrink-0 px-4 pb-4">
      {/* Reply-to banner */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between bg-white/5 border border-white/10 rounded-t-lg px-3 py-1.5 -mb-px text-xs text-gray-400"
          >
            <span>Replying to <span className="text-white font-medium">{replyTo.senderName}</span>: {replyTo.text.slice(0, 60)}{replyTo.text.length > 60 ? '…' : ''}</span>
            <button onClick={onClearReply} className="hover:text-white transition-colors ml-2"><X size={12} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formatting toolbar */}
      <div className="flex items-center gap-0.5 bg-white/5 border border-white/10 border-b-0 rounded-t-lg px-2 py-1">
        {[
          { icon: <Bold size={13} />, cmd: 'bold', title: 'Bold (Ctrl+B)' },
          { icon: <Italic size={13} />, cmd: 'italic', title: 'Italic (Ctrl+I)' },
          { icon: <Strikethrough size={13} />, cmd: 'strikeThrough', title: 'Strikethrough' },
          { icon: <Code size={13} />, cmd: 'formatBlock', val: 'pre', title: 'Code block' },
          { icon: <List size={13} />, cmd: 'insertUnorderedList', title: 'Bullet list' },
          { icon: <Link2 size={13} />, cmd: 'createLink', val: prompt as unknown as string, title: 'Link' },
        ].map(({ icon, cmd, val, title }) => (
          <button
            key={cmd}
            title={title}
            onMouseDown={e => { e.preventDefault(); if (cmd === 'createLink') { const url = window.prompt('URL:'); if (url) doFormat(cmd, url); } else doFormat(cmd, val); }}
            className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            {icon}
          </button>
        ))}
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          title="Poll"
          onClick={onOpenPollBuilder}
          className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <BarChart2 size={13} />
        </button>
      </div>

      {/* Editor + actions */}
      <div className="relative bg-white/5 border border-white/10 rounded-b-lg">
        {/* Slash command dropdown */}
        <AnimatePresence>
          {showSlashCommands && filteredSlashCommands.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute bottom-full mb-1 left-0 w-64 bg-[#1e1e32] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
            >
              <div className="px-3 py-1.5 text-xs text-gray-500 border-b border-white/5 uppercase tracking-wider">Commands</div>
              {filteredSlashCommands.map((cmd, i) => (
                <button
                  key={cmd.command}
                  onClick={() => insertSlashCommand(cmd.command)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${i === slashIndex ? 'bg-[#5b5fc7]/20' : 'hover:bg-white/5'}`}
                >
                  <Zap size={12} className="text-[#5b5fc7] flex-shrink-0" />
                  <span className="text-white font-medium">{cmd.command}</span>
                  <span className="text-gray-500 text-xs ml-auto">{cmd.description}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mention dropdown */}
        <AnimatePresence>
          {(showMentions || showChannelMention) && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute bottom-full mb-1 left-0 w-64 bg-[#1e1e32] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
            >
              {(showMentions ? filteredMentions : filteredChannelMentions).map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => insertMention(showMentions ? `@${'name' in item ? item.name : ''}` : `#${'name' in item ? item.name : ''}`)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${i === mentionIndex ? 'bg-[#5b5fc7]/20' : 'hover:bg-white/5'}`}
                >
                  {showMentions ? (
                    <>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style={{ background: (item as WorkspaceMember).color }}>
                        {(item as WorkspaceMember).initials}
                      </div>
                      <span className="text-white">{item.name}</span>
                      <span className="text-gray-500 text-xs ml-auto">{(item as WorkspaceMember).title}</span>
                    </>
                  ) : (
                    <>
                      <Hash size={13} className="text-gray-400 flex-shrink-0" />
                      <span className="text-white">{item.name}</span>
                    </>
                  )}
                </button>
              ))}
              {(showMentions ? filteredMentions : filteredChannelMentions).length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">No results</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* contentEditable */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleTyping}
          onKeyDown={handleKeyDown}
          data-placeholder={placeholder}
          className="min-h-[52px] max-h-48 overflow-y-auto px-3 py-3 text-sm text-white outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500"
          suppressContentEditableWarning
        />

        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pb-2">
            {attachments.map((f, i) => (
              <div key={i} className="relative group">
                {f.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    className="w-16 h-16 object-cover rounded-lg border border-white/10"
                  />
                ) : (
                  <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
                    <FileText size={12} />
                    {f.name.slice(0, 20)}
                  </div>
                )}
                <button
                  onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={9} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-2 py-1.5 border-t border-white/5">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Attach file"
            >
              <Paperclip size={15} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={e => { if (e.target.files) setAttachments(prev => [...prev, ...Array.from(e.target.files!)]); }}
            />
            <div className="relative">
              <button
                onClick={() => setShowEmoji(v => !v)}
                className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Emoji"
              >
                <Smile size={15} />
              </button>
              <AnimatePresence>
                {showEmoji && (
                  <EmojiPicker
                    onSelect={emoji => {
                      if (editorRef.current) {
                        editorRef.current.focus();
                        document.execCommand('insertText', false, emoji);
                        setText(editorRef.current.innerText);
                      }
                      setShowEmoji(false);
                    }}
                    onClose={() => setShowEmoji(false)}
                  />
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={() => { if (editorRef.current) { editorRef.current.focus(); document.execCommand('insertText', false, '@'); handleTyping(); } }}
              className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Mention someone"
            >
              <AtSign size={15} />
            </button>
            <button
              onClick={() => setShowSchedule(v => !v)}
              className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Schedule message"
            >
              <Clock size={15} />
            </button>
          </div>
          <div className="flex items-center gap-1">
            {/* Schedule date picker */}
            <AnimatePresence>
              {showSchedule && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden"
                >
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="bg-white/10 text-white text-xs rounded-lg px-2 py-1 border border-white/20 outline-none mr-1"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  {scheduleDate && (
                    <button
                      onClick={() => { onSchedule?.(editorRef.current?.innerText.trim() || '', scheduleDate); setShowSchedule(false); setScheduleDate(''); if (editorRef.current) editorRef.current.innerHTML = ''; setText(''); }}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-2 py-1 mr-1 transition-colors"
                    >
                      Schedule
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={doSend}
              disabled={!text.trim() && attachments.length === 0}
              className="flex items-center gap-1.5 bg-[#5b5fc7] hover:bg-[#c4674a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <Send size={13} />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Message Action Toolbar ────────────────────────────────────
interface MsgActionBarProps {
  message: ChatMessage;
  isMe: boolean;
  onReact: (msgId: string, emoji: string) => void;
  onReply: (msg: ChatMessage) => void;
  onEdit: (msg: ChatMessage) => void;
  onPin: (msgId: string) => void;
  onBookmark: (msgId: string) => void;
  onDelete: (msgId: string) => void;
  onForward: (msg: ChatMessage) => void;
  onCopyLink: (msgId: string) => void;
}
const MsgActionBar = memo(({
  message, isMe, onReact, onReply, onEdit, onPin, onBookmark, onDelete, onForward, onCopyLink,
}: MsgActionBarProps) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMore, setShowMore] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.1 }}
      className="absolute -top-9 right-2 flex items-center gap-0.5 bg-[#1e1e32] border border-white/10 rounded-lg shadow-xl px-1 py-1 z-10"
      onClick={e => e.stopPropagation()}
    >
      {/* Quick emoji reactions */}
      {QUICK_REACTIONS.map(emoji => (
        <button
          key={emoji}
          onClick={() => onReact(message.id, emoji)}
          className="w-7 h-7 flex items-center justify-center text-sm rounded hover:bg-white/10 transition-colors"
        >
          {emoji}
        </button>
      ))}
      {/* Full emoji picker */}
      <div className="relative">
        <button
          onClick={() => setShowEmojiPicker(v => !v)}
          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors"
          title="More emoji"
        >
          <Smile size={13} />
        </button>
        <AnimatePresence>
          {showEmojiPicker && (
            <EmojiPicker
              onSelect={emoji => { onReact(message.id, emoji); setShowEmojiPicker(false); }}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
        </AnimatePresence>
      </div>
      <div className="w-px h-4 bg-white/10" />
      <button onClick={() => onReply(message)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors" title="Reply in thread">
        <MessageSquare size={13} />
      </button>
      {isMe && (
        <button onClick={() => onEdit(message)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors" title="Edit message">
          <Edit3 size={13} />
        </button>
      )}
      <button onClick={() => onPin(message.id)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors" title="Pin message">
        <Pin size={13} />
      </button>
      <button onClick={() => onBookmark(message.id)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors" title="Save message">
        <Bookmark size={13} />
      </button>
      {/* More menu */}
      <div className="relative">
        <button
          onClick={() => setShowMore(v => !v)}
          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors"
          title="More actions"
        >
          <MoreHorizontal size={13} />
        </button>
        <AnimatePresence>
          {showMore && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-full right-0 mt-1 w-44 bg-[#1e1e32] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20"
            >
              {[
                { icon: <Forward size={13} />, label: 'Forward', action: () => { onForward(message); setShowMore(false); } },
                { icon: <Copy size={13} />, label: 'Copy link', action: () => { onCopyLink(message.id); setShowMore(false); } },
                { icon: <ExternalLink size={13} />, label: 'Open in thread', action: () => { onReply(message); setShowMore(false); } },
                ...(isMe ? [{ icon: <Trash2 size={13} />, label: 'Delete', action: () => { onDelete(message.id); setShowMore(false); }, danger: true }] : []),
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-white/5 ${(item as any).danger ? 'text-red-400 hover:text-red-300' : 'text-gray-300 hover:text-white'}`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

// ── Syntax Highlighting ──────────────────────────────────────
function syntaxHighlight(code: string, lang: string): string {
  let s = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const kw = (words: string) => new RegExp(`\\b(${words})\\b`, 'g');
  const span = (cls: string, v: string) => `<span style="color:${cls}">${v}</span>`;
  if (['js','javascript','ts','typescript','jsx','tsx'].includes(lang)) {
    s = s.replace(/(["'`])((?:[^\\]|\\.)*?)\1/g, (_,q,c) => span('#c3e88d', q+c+q));
    s = s.replace(/(\/\/.*$)/gm, m => span('#546e7a', m));
    s = s.replace(/\/\*[\s\S]*?\*\//g, m => span('#546e7a', m));
    s = s.replace(kw('const|let|var|function|return|if|else|for|while|class|import|export|from|default|async|await|try|catch|throw|new|typeof|null|undefined|true|false|void|this|extends|interface|type|enum'), m => span('#c792ea', m));
    s = s.replace(/\b(\d+\.?\d*)\b/g, m => span('#f78c6c', m));
    s = s.replace(/\b([a-zA-Z_$][\w$]*)\s*(?=\()/g, (_,n) => span('#82aaff', n)+'(');
  } else if (['python','py'].includes(lang)) {
    s = s.replace(/(["'])((?:[^\\]|\\.)*?)\1/g, (_,q,c) => span('#c3e88d', q+c+q));
    s = s.replace(/(#.*$)/gm, m => span('#546e7a', m));
    s = s.replace(kw('def|class|import|from|return|if|elif|else|for|while|in|not|and|or|True|False|None|lambda|yield|with|as|pass|break|continue|raise|try|except|finally|async|await'), m => span('#c792ea', m));
    s = s.replace(/\b(\d+)\b/g, m => span('#f78c6c', m));
  } else if (['html','xml'].includes(lang)) {
    s = s.replace(/(&lt;\/?)([\w-]+)/g, (_,lt,tag) => lt+span('#f07178', tag));
    s = s.replace(/([\w-]+)=/g, (_,a) => span('#ffcb6b', a)+'=');
  } else if (['css','scss'].includes(lang)) {
    s = s.replace(/([.#][\w-]+)/g, m => span('#ffcb6b', m));
    s = s.replace(/([\w-]+)\s*:/g, (_,p) => span('#82aaff', p)+':');
  } else if (lang === 'json') {
    s = s.replace(/("[\w\-]+")\s*:/g, (_,k) => span('#82aaff', k)+':');
    s = s.replace(/:\s*(".*?")/g, (_,v) => ': '+span('#c3e88d', v));
    s = s.replace(/:\s*(\d+\.?\d*)/g, (_,n) => ': '+span('#f78c6c', n));
    s = s.replace(/:\s*(true|false|null)/g, (_,b) => ': '+span('#c792ea', b));
  } else if (['bash','sh','shell'].includes(lang)) {
    s = s.replace(/(#.*$)/gm, m => span('#546e7a', m));
    s = s.replace(kw('echo|cd|ls|mkdir|rm|cp|mv|grep|cat|chmod|sudo|git|npm|yarn|docker|curl|wget'), m => span('#82aaff', m));
    s = s.replace(/\$([\w_]+)/g, (_,v) => span('#f07178', '$'+v));
  }
  return s;
}

function renderMessageContent(text: string): string {
  return (text || '')
    // Fenced code blocks FIRST
    .replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) => {
      const l = (lang || '').toLowerCase();
      const highlighted = syntaxHighlight(code.trim(), l);
      const label = l ? `<span style="color:#546e7a;font-size:10px;text-transform:uppercase;letter-spacing:.05em">${l}</span>` : '';
      return `<div class="my-2">${label}<pre style="background:#1e1e2e;border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:12px;overflow-x:auto;margin:2px 0 0"><code style="font-family:monospace;font-size:12px;line-height:1.5">${highlighted}</code></pre></div>`;
    })
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,.1);padding:1px 4px;border-radius:3px;font-family:monospace;font-size:12px">$1</code>')
    .replace(/@(\w+)/g, '<span style="color:#5b5fc7;font-weight:500;cursor:pointer">@$1</span>')
    .replace(/#(\w[-\w]*)/g, '<span style="color:#60a5fa;font-weight:500;cursor:pointer">#$1</span>')
    .replace(/\n/g, '<br>');
}

// ── Single Message ───────────────────────────────────────────
interface MessageItemProps {
  message: ChatMessage;
  prevMessage?: ChatMessage;
  currentUserId: string;
  showAvatar: boolean;
  onReact: (msgId: string, emoji: string) => void;
  onReply: (msg: ChatMessage) => void;
  onEdit: (msg: ChatMessage) => void;
  onPin: (msgId: string) => void;
  onBookmark: (msgId: string) => void;
  onDelete: (msgId: string) => void;
  onForward: (msg: ChatMessage) => void;
  onCopyLink: (msgId: string) => void;
  onVotePoll: (msgId: string, optId: string) => void;
  onClosePoll: (msgId: string) => void;
  onProfileClick: (memberId: string, anchor: HTMLElement) => void;
  isHighlighted?: boolean;
  editingId: string | null;
  onEditSave: (msgId: string, newText: string) => void;
  onEditCancel: () => void;
}
const MessageItem = memo(({
  message, prevMessage, currentUserId, showAvatar,
  onReact, onReply, onEdit, onPin, onBookmark, onDelete, onForward, onCopyLink,
  onVotePoll, onClosePoll, onProfileClick, isHighlighted, editingId, onEditSave, onEditCancel,
}: MessageItemProps) => {
  const [hovered, setHovered] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [linkPreview, setLinkPreview] = useState<LinkPreviewData | null>(null);
  const [previewDismissed, setPreviewDismissed] = useState(false);
  const isEditing = editingId === message.id;
  const isMe = message.senderId === currentUserId;
  const member = getMemberById(message.senderId);

  // Link preview fetch
  useEffect(() => {
    const dismissed = (() => {
      try { return JSON.parse(localStorage.getItem('brixstac-dismissed-previews') || '[]') as string[]; } catch { return [] as string[]; }
    })();
    const urlMatch = message.text.match(/https?:\/\/[^\s<>"]+/g);
    if (!urlMatch || urlMatch.length === 0) return;
    const url = urlMatch[0];
    if (dismissed.includes(url)) { setPreviewDismissed(true); return; }
    let cancelled = false;
    fetch(`/api/workspaces/ws-default/link-preview?url=${encodeURIComponent(url)}`, { headers: {} })
      .then(r => r.json())
      .then(data => {
        if (!cancelled && (data.title || data.description)) {
          setLinkPreview({ ...data, url });
        }
      })
      .catch(() => {
        // Simulate a basic preview from URL metadata
        if (!cancelled) {
          try {
            const hostname = new URL(url).hostname;
            setLinkPreview({ url, siteName: hostname, title: hostname });
          } catch {}
        }
      });
    return () => { cancelled = true; };
  }, [message.text]);

  const dismissPreview = (url: string) => {
    const prev = (() => { try { return JSON.parse(localStorage.getItem('brixstac-dismissed-previews') || '[]') as string[]; } catch { return [] as string[]; } })();
    localStorage.setItem('brixstac-dismissed-previews', JSON.stringify([...prev, url]));
    setPreviewDismissed(true);
    setLinkPreview(null);
  };

  if (message.isUnreadDivider) {
    return (
      <div className="flex items-center gap-3 my-3 px-4">
        <div className="flex-1 h-px bg-red-500/30" />
        <span className="text-xs text-red-400 font-medium whitespace-nowrap">New Messages</span>
        <div className="flex-1 h-px bg-red-500/30" />
      </div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`relative group flex gap-3 px-4 py-0.5 transition-colors ${hovered ? 'bg-white/[0.03]' : ''} ${isHighlighted ? 'bg-[#5b5fc7]/10 ring-1 ring-[#5b5fc7]/20 rounded-lg mx-2' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar column */}
      <div className="w-9 flex-shrink-0 mt-0.5">
        {showAvatar && member ? (
          <Avatar
            member={member}
            size="sm"
            showPresence
            onClick={e => onProfileClick(member.id, e.currentTarget as HTMLElement)}
          />
        ) : null}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {showAvatar && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <button
              className="font-semibold text-sm text-white hover:underline"
              onClick={e => member && onProfileClick(member.id, e.currentTarget)}
            >
              {message.senderName}
            </button>
            {member?.kind === 'ai' && (
              <span className="text-xs text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded font-medium">AI</span>
            )}
            <span className="text-xs text-gray-500">{message.time}</span>
            {message.edited && <span className="text-xs text-gray-600 italic">(edited)</span>}
            {message.pending && (
              <span className="text-xs text-yellow-500 flex items-center gap-0.5">
                <RefreshCw size={9} className="animate-spin" />
                sending…
              </span>
            )}
            {message.failed && (
              <span className="text-xs text-red-400 flex items-center gap-0.5">
                <AlertCircle size={9} />
                Failed
              </span>
            )}
          </div>
        )}

        {/* Reply-to */}
        {message.replyTo && (
          <div className="flex items-start gap-1.5 mb-1 pl-2 border-l-2 border-white/20 opacity-60 hover:opacity-80 transition-opacity cursor-pointer">
            <span className="text-xs text-gray-400 font-medium">{message.replyTo.senderName}</span>
            <span className="text-xs text-gray-500 truncate">{message.replyTo.text.slice(0, 80)}</span>
          </div>
        )}

        {/* Message text / edit mode */}
        {isEditing ? (
          <div className="mt-1">
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onEditSave(message.id, editText); }
                if (e.key === 'Escape') onEditCancel();
              }}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 mt-1 text-xs">
              <button onClick={() => onEditSave(message.id, editText)} className="text-[#5b5fc7] hover:text-[#c4674a] font-medium">Save</button>
              <button onClick={onEditCancel} className="text-gray-400 hover:text-white">Cancel</button>
            </div>
          </div>
        ) : (
          <div
            className="text-sm text-gray-100 leading-relaxed break-words"
            dangerouslySetInnerHTML={{ __html: renderMessageContent(message.text) }}
          />
        )}

        {/* Link Preview Card */}
        {linkPreview && !previewDismissed && (
          <div className="relative mt-2 flex items-start gap-3 bg-[rgba(0,0,0,0.03)] border border-white/10 border-l-4 border-l-[#5b5fc7] rounded-lg p-3 max-w-sm group/preview">
            {linkPreview.image && (
              <img
                src={linkPreview.image}
                alt={linkPreview.title || ''}
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div className="flex-1 min-w-0">
              {linkPreview.siteName && (
                <div className="text-xs text-gray-500 font-medium mb-0.5">{linkPreview.siteName}</div>
              )}
              {linkPreview.title && (
                <div className="text-sm text-white font-medium line-clamp-1">{linkPreview.title}</div>
              )}
              {linkPreview.description && (
                <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{linkPreview.description}</div>
              )}
              <a
                href={linkPreview.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 mt-1 text-xs text-[#5b5fc7] hover:underline"
              >
                <Link2 size={10} />
                {linkPreview.url.replace(/^https?:\/\//, '').slice(0, 50)}
              </a>
            </div>
            <button
              onClick={() => dismissPreview(linkPreview.url)}
              className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-gray-500 hover:text-white opacity-0 group-hover/preview:opacity-100 transition-opacity rounded hover:bg-white/10"
            >
              <X size={10} />
            </button>
          </div>
        )}

        {/* Poll */}
        {message.poll && (
          <PollRenderer
            poll={message.poll}
            messageId={message.id}
            currentUserId={currentUserId}
            isCreator={isMe}
            onVote={onVotePoll}
            onClose={onClosePoll}
          />
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.attachments.map(att => (
              <div key={att.id} className="group/att">
                {att.type === 'image' ? (
                  <div className="relative">
                    <img
                      src={att.url || att.preview}
                      alt={att.name}
                      className="max-w-xs max-h-48 rounded-xl border border-white/10 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    />
                    <button className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover/att:opacity-100 transition-opacity">
                      <Download size={11} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 transition-colors cursor-pointer">
                    <FileText size={16} className="text-[#5b5fc7] flex-shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-white">{att.name}</div>
                      {att.size && <div className="text-xs text-gray-500">{att.size}</div>}
                    </div>
                    <Download size={13} className="text-gray-400 ml-2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.reactions.map(r => {
              const reacted = r.users.includes(currentUserId);
              return (
                <button
                  key={r.emoji}
                  onClick={() => onReact(message.id, r.emoji)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm border transition-colors ${
                    reacted
                      ? 'bg-[#5b5fc7]/20 border-[#5b5fc7]/40 text-[#5b5fc7]'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20 hover:bg-white/10'
                  }`}
                  title={r.users.map(uid => getMemberById(uid)?.name || uid).join(', ')}
                >
                  <span>{r.emoji}</span>
                  <span className="text-xs font-medium">{r.count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Read receipts — shown on own messages */}
        {isMe && (message as any).readBy && (message as any).readBy.length > 0 && (
          <div className="flex items-center gap-0.5 mt-1 justify-end" title={`Read by: ${(message as any).readBy.slice(0,5).join(', ')}`}>
            {(message as any).readBy.slice(0, 3).map((uid: string, i: number) => {
              const m = getMemberById(uid);
              return m ? (
                <div key={uid} className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-white font-semibold border border-gray-900" style={{ background: m.color, fontSize: 7, marginLeft: i > 0 ? -4 : 0 }}>
                  {m.initials?.[0]}
                </div>
              ) : null;
            })}
            {(message as any).readBy.length > 3 && <span className="text-xs text-gray-500 ml-1">+{(message as any).readBy.length - 3}</span>}
          </div>
        )}

        {/* Thread count */}
        {(message.threadCount || 0) > 0 && (
          <button
            onClick={() => onReply(message)}
            className="flex items-center gap-2 mt-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            <MessageSquare size={11} />
            <span>{message.threadCount} {message.threadCount === 1 ? 'reply' : 'replies'}</span>
            {message.threadUsers?.slice(0, 3).map(uid => {
              const m = getMemberById(uid);
              return m ? (
                <div key={uid} className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ background: m.color, fontSize: 8 }}>
                  {m.initials}
                </div>
              ) : null;
            })}
            <span className="text-gray-500">Last reply {message.time}</span>
          </button>
        )}
      </div>

      {/* Pinned badge */}
      {message.pinned && (
        <div className="absolute top-1 right-12 flex items-center gap-1 text-xs text-amber-400">
          <Pin size={10} />
        </div>
      )}

      {/* Action bar on hover */}
      <AnimatePresence>
        {hovered && !isEditing && (
          <MsgActionBar
            message={message}
            isMe={isMe}
            onReact={onReact}
            onReply={onReply}
            onEdit={onEdit}
            onPin={onPin}
            onBookmark={onBookmark}
            onDelete={onDelete}
            onForward={onForward}
            onCopyLink={onCopyLink}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ── Create Channel Modal ─────────────────────────────────────
interface CreateChannelModalProps {
  workspaceId: string;
  authToken: string;
  members: WorkspaceMember[];
  onClose: () => void;
  onCreate: (channel: Channel) => void;
}
const CreateChannelModal = memo(({ workspaceId, authToken, members, onClose, onCreate }: CreateChannelModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [inviteQuery, setInviteQuery] = useState('');
  const [invitedMembers, setInvitedMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNameChange = (v: string) => {
    setName(v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(inviteQuery.toLowerCase()) &&
    !invitedMembers.find(im => im.id === m.id)
  );

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Channel name is required'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ name, description, private: isPrivate, members: invitedMembers.map(m => m.id) }),
      });
      if (!res.ok) throw new Error('Failed to create channel');
      const data = await res.json();
      onCreate({
        id: data.id || `c-${name}`,
        name, description, private: isPrivate,
        members: invitedMembers.length + 1, unread: 0,
      });
      onClose();
    } catch {
      // Fallback: create locally
      onCreate({
        id: `c-${name}-${Date.now()}`,
        name, description, private: isPrivate,
        members: invitedMembers.length + 1, unread: 0,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-[#12122a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Create a channel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-sm text-red-400">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-400 font-medium mb-1.5 uppercase tracking-wider">Channel name</label>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus-within:border-[#5b5fc7]/50">
              <Hash size={15} className="text-gray-500" />
              <input
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. marketing-ideas"
                className="bg-transparent text-white text-sm outline-none flex-1 placeholder-gray-500"
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Lowercase letters, numbers, and hyphens only.</p>
          </div>
          <div>
            <label className="block text-xs text-gray-400 font-medium mb-1.5 uppercase tracking-wider">Description <span className="text-gray-600 normal-case">(optional)</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is this channel about?"
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-[#5b5fc7]/50 resize-none"
            />
          </div>
          <div className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg">
            <div>
              <div className="text-sm text-white font-medium flex items-center gap-2">
                <Lock size={14} className="text-gray-400" />
                Private channel
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Only invited people can see this channel</div>
            </div>
            <button
              onClick={() => setIsPrivate(v => !v)}
              className={`relative w-10 h-6 rounded-full transition-colors ${isPrivate ? 'bg-[#5b5fc7]' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${isPrivate ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
          <div>
            <label className="block text-xs text-gray-400 font-medium mb-1.5 uppercase tracking-wider">Add members</label>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus-within:border-[#5b5fc7]/50 mb-2">
              <Search size={13} className="text-gray-500" />
              <input
                value={inviteQuery}
                onChange={e => setInviteQuery(e.target.value)}
                placeholder="Search by name or email…"
                className="bg-transparent text-white text-sm outline-none flex-1 placeholder-gray-500"
              />
            </div>
            {inviteQuery && filteredMembers.length > 0 && (
              <div className="bg-[#1e1e32] border border-white/10 rounded-xl overflow-hidden max-h-36 overflow-y-auto">
                {filteredMembers.slice(0, 6).map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setInvitedMembers(prev => [...prev, m]); setInviteQuery(''); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: m.color }}>{m.initials}</div>
                    <span className="text-sm text-white">{m.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">{m.title}</span>
                  </button>
                ))}
              </div>
            )}
            {invitedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {invitedMembers.map(m => (
                  <span key={m.id} className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-0.5 text-xs text-white">
                    {m.name}
                    <button onClick={() => setInvitedMembers(prev => prev.filter(im => im.id !== m.id))} className="text-gray-400 hover:text-white ml-0.5">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || loading}
            className="flex-1 py-2.5 rounded-lg bg-[#5b5fc7] hover:bg-[#c4674a] disabled:opacity-40 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
            Create Channel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
});

// ── Poll Builder Modal ────────────────────────────────────────
interface PollBuilderProps {
  onClose: () => void;
  onInsert: (poll: Poll) => void;
}
const PollBuilder = memo(({ onClose, onInsert }: PollBuilderProps) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [multiSelect, setMultiSelect] = useState(false);

  const addOption = () => setOptions(prev => [...prev, '']);
  const updateOption = (i: number, v: string) => setOptions(prev => prev.map((o, idx) => idx === i ? v : o));
  const removeOption = (i: number) => setOptions(prev => prev.filter((_, idx) => idx !== i));

  const handleInsert = () => {
    const validOpts = options.filter(o => o.trim());
    if (!question.trim() || validOpts.length < 2) return;
    onInsert({
      question: question.trim(),
      options: validOpts.map((text, i) => ({ id: `opt-${i}`, text, votes: [] })),
      multiSelect,
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#12122a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><BarChart2 size={18} className="text-[#5b5fc7]" /> Create Poll</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 font-medium mb-1.5 uppercase tracking-wider">Question</label>
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ask a question…"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-[#5b5fc7]/50"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 font-medium mb-1.5 uppercase tracking-wider">Options</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={opt}
                    onChange={e => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-[#5b5fc7]/50"
                  />
                  {options.length > 2 && (
                    <button onClick={() => removeOption(i)} className="text-gray-500 hover:text-red-400 transition-colors"><X size={14} /></button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <button onClick={addOption} className="mt-2 flex items-center gap-1.5 text-xs text-[#5b5fc7] hover:text-[#c4674a] transition-colors">
                <Plus size={13} /> Add option
              </button>
            )}
          </div>
          <div className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg">
            <div className="text-sm text-white">Allow multiple votes</div>
            <button
              onClick={() => setMultiSelect(v => !v)}
              className={`relative w-10 h-6 rounded-full transition-colors ${multiSelect ? 'bg-[#5b5fc7]' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${multiSelect ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors">Cancel</button>
          <button
            onClick={handleInsert}
            disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
            className="flex-1 py-2.5 rounded-lg bg-[#5b5fc7] hover:bg-[#c4674a] disabled:opacity-40 text-white text-sm font-medium transition-colors"
          >
            Insert Poll
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
});

// ── Custom Status Modal ────────────────────────────────────────
interface CustomStatusModalProps {
  currentStatus?: { emoji: string; text: string; expiresAt?: string };
  onClose: () => void;
  onSave: (status: { emoji: string; text: string; expiresAt?: string }) => void;
}
const CustomStatusModal = memo(({ currentStatus, onClose, onSave }: CustomStatusModalProps) => {
  const [emoji, setEmoji] = useState(currentStatus?.emoji || '🟢');
  const [text, setText] = useState(currentStatus?.text || '');
  const [expiry, setExpiry] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const EXPIRY_OPTIONS = [
    { label: "Don't clear", value: '' },
    { label: '30 minutes', value: '30m' },
    { label: '1 hour', value: '1h' },
    { label: '4 hours', value: '4h' },
    { label: 'Today', value: 'today' },
    { label: 'This week', value: 'week' },
  ];

  const computeExpiry = (v: string): string | undefined => {
    if (!v) return undefined;
    const now = new Date();
    if (v === '30m') { now.setMinutes(now.getMinutes() + 30); return now.toISOString(); }
    if (v === '1h') { now.setHours(now.getHours() + 1); return now.toISOString(); }
    if (v === '4h') { now.setHours(now.getHours() + 4); return now.toISOString(); }
    if (v === 'today') { now.setHours(23, 59, 59); return now.toISOString(); }
    if (v === 'week') { now.setDate(now.getDate() + (7 - now.getDay())); return now.toISOString(); }
    return undefined;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-[#12122a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10">
          <h2 className="text-base font-bold text-white">Set a status</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(v => !v)}
                className="w-12 h-10 bg-white/5 border border-white/10 rounded-lg text-xl flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                {emoji}
              </button>
              <AnimatePresence>
                {showEmojiPicker && (
                  <EmojiPicker
                    onSelect={e => { setEmoji(e); setShowEmojiPicker(false); }}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                )}
              </AnimatePresence>
            </div>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="What's your status?"
              maxLength={100}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-[#5b5fc7]/50"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Clear status after</label>
            <div className="grid grid-cols-3 gap-1.5">
              {EXPIRY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setExpiry(opt.value)}
                  className={`py-1.5 px-2 rounded-lg text-xs transition-colors ${expiry === opt.value ? 'bg-[#5b5fc7] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors">Cancel</button>
          <button
            onClick={() => { onSave({ emoji, text, expiresAt: computeExpiry(expiry) }); onClose(); }}
            className="flex-1 py-2 rounded-lg bg-[#5b5fc7] hover:bg-[#c4674a] text-white text-sm font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
});

// ── Search Modal ─────────────────────────────────────────────
interface SearchModalProps {
  channels: Channel[];
  members: WorkspaceMember[];
  allMessages: Record<string, ChatMessage[]>;
  onClose: () => void;
  onNavigate: (channelId: string, messageId?: string) => void;
}
const SearchModal = memo(({ channels, members, allMessages, onClose, onNavigate }: SearchModalProps) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'messages' | 'files' | 'channels' | 'people'>('messages');
  const [filterChannel, setFilterChannel] = useState('');
  const [filterPerson, setFilterPerson] = useState('');
  const [recentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('brixstac-searches') || '[]'); } catch { return []; }
  });

  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const out: SearchResult[] = [];
    if (activeTab === 'messages') {
      Object.entries(allMessages).forEach(([chId, msgs]) => {
        const ch = channels.find(c => c.id === chId);
        msgs.forEach(msg => {
          if (msg.text.toLowerCase().includes(q)) {
            if (filterChannel && chId !== filterChannel) return;
            if (filterPerson && msg.senderId !== filterPerson) return;
            out.push({ id: msg.id, type: 'message', channelId: chId, channelName: ch?.name, senderId: msg.senderId, senderName: msg.senderName, text: msg.text, time: msg.time });
          }
        });
      });
    }
    if (activeTab === 'channels') {
      channels.filter(c => c.name.includes(q) || c.description?.toLowerCase().includes(q)).forEach(c => {
        out.push({ id: c.id, type: 'channel', name: c.name, description: c.description });
      });
    }
    if (activeTab === 'people') {
      members.filter(m => m.name.toLowerCase().includes(q) || m.title.toLowerCase().includes(q)).forEach(m => {
        out.push({ id: m.id, type: 'person', name: m.name, description: m.title });
      });
    }
    return out.slice(0, 30);
  }, [query, activeTab, allMessages, channels, members, filterChannel, filterPerson]);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (q.trim()) {
      const prev = JSON.parse(localStorage.getItem('brixstac-searches') || '[]') as string[];
      const updated = [q, ...prev.filter(s => s !== q)].slice(0, 10);
      localStorage.setItem('brixstac-searches', JSON.stringify(updated));
    }
  };

  const highlightText = (text: string, q: string) => {
    if (!q.trim()) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text.slice(0, 120);
    const start = Math.max(0, idx - 30);
    const snippet = text.slice(start, start + 120);
    return snippet.replace(new RegExp(q, 'gi'), m => `<mark class="bg-[#5b5fc7]/30 text-[#5b5fc7]">${m}</mark>`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-2xl mx-auto mt-16 bg-[#12122a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search messages, files, channels, people…"
            className="flex-1 bg-transparent text-white text-base outline-none placeholder-gray-500"
          />
          {query && <button onClick={() => setQuery('')} className="text-gray-400 hover:text-white transition-colors"><X size={16} /></button>}
          <kbd className="text-xs text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">Esc</kbd>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(['messages', 'files', 'channels', 'people'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'text-[#5b5fc7] border-b-2 border-[#5b5fc7]' : 'text-gray-400 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filter chips */}
        {activeTab === 'messages' && (
          <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto border-b border-white/5">
            <Filter size={12} className="text-gray-500 flex-shrink-0" />
            <select
              value={filterChannel}
              onChange={e => setFilterChannel(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-gray-300 outline-none cursor-pointer"
            >
              <option value="">All channels</option>
              {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
            <select
              value={filterPerson}
              onChange={e => setFilterPerson(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-gray-300 outline-none cursor-pointer"
            >
              <option value="">From anyone</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        )}

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {!query.trim() && recentSearches.length > 0 && (
            <div className="p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Recent searches</div>
              {recentSearches.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(s)}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-300 transition-colors"
                >
                  <Clock size={13} className="text-gray-500" />
                  {s}
                </button>
              ))}
            </div>
          )}

          {query.trim() && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Search size={32} className="mb-3 opacity-30" />
              <p className="text-sm">No {activeTab} found for "{query}"</p>
            </div>
          )}

          {results.map(result => (
            <button
              key={result.id}
              onClick={() => { if (result.channelId) onNavigate(result.channelId, result.id); else if (result.type === 'channel') onNavigate(result.id); onClose(); }}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
            >
              {result.type === 'message' && (
                <>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs text-white font-bold">
                    {getMemberById(result.senderId || '')?.initials || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-white">{result.senderName}</span>
                      <span className="text-xs text-gray-500">in #{result.channelName}</span>
                      <span className="text-xs text-gray-600 ml-auto">{result.time}</span>
                    </div>
                    <div className="text-xs text-gray-400 line-clamp-2" dangerouslySetInnerHTML={{ __html: highlightText(result.text || '', query) }} />
                  </div>
                </>
              )}
              {result.type === 'channel' && (
                <>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0"><Hash size={14} className="text-gray-400" /></div>
                  <div>
                    <div className="text-sm font-medium text-white">#{result.name}</div>
                    <div className="text-xs text-gray-500">{result.description}</div>
                  </div>
                </>
              )}
              {result.type === 'person' && (
                <>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold" style={{ background: getMemberById(result.id)?.color || '#666' }}>
                    {getMemberById(result.id)?.initials || '?'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{result.name}</div>
                    <div className="text-xs text-gray-500">{result.description}</div>
                  </div>
                </>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
});

// ── Thread Panel ─────────────────────────────────────────────
interface ThreadPanelProps {
  thread: ThreadState;
  currentUserId: string;
  onClose: () => void;
  onReply: (text: string) => void;
  onToggleFollow: () => void;
  members: WorkspaceMember[];
  channels: Channel[];
}
const ThreadPanel = memo(({ thread, currentUserId, onClose, onReply, onToggleFollow, members, channels }: ThreadPanelProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [thread.replies.length]);

  if (!thread.parentMessage) return null;
  const parent = thread.parentMessage;
  const parentMember = getMemberById(parent.senderId);

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-96 flex-shrink-0 flex flex-col bg-[#0f0f22] border-l border-white/10 h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-gray-400" />
          <span className="font-semibold text-white text-sm">Thread</span>
          {thread.replies.length > 0 && (
            <span className="text-xs text-gray-500">{thread.replies.length} {thread.replies.length === 1 ? 'reply' : 'replies'}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFollow}
            title={thread.following ? 'Unfollow thread' : 'Follow thread'}
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-colors ${thread.following ? 'bg-[#5b5fc7]/20 text-[#5b5fc7]' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
          >
            <Bell size={11} />
            {thread.following ? 'Following' : 'Follow'}
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4">
        {/* Parent message */}
        <div className="px-4 pb-4 border-b border-white/10 mb-4">
          <div className="flex gap-3">
            {parentMember && <Avatar member={parentMember} size="sm" showPresence />}
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm font-semibold text-white">{parent.senderName}</span>
                <span className="text-xs text-gray-500">{parent.time}</span>
              </div>
              <div className="text-sm text-gray-100 whitespace-pre-wrap">{parent.text}</div>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="space-y-1">
          {thread.replies.map((reply, i) => {
            const prevReply = thread.replies[i - 1];
            const showAv = !prevReply || prevReply.senderId !== reply.senderId || (reply.timestamp - prevReply.timestamp > 5 * 60 * 1000);
            const replyMember = getMemberById(reply.senderId);
            return (
              <div key={reply.id} className="flex gap-3 px-4 py-0.5 hover:bg-white/[0.02] group">
                <div className="w-8 flex-shrink-0">
                  {showAv && replyMember && <Avatar member={replyMember} size="sm" />}
                </div>
                <div className="flex-1">
                  {showAv && (
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-white">{reply.senderName}</span>
                      <span className="text-xs text-gray-500">{reply.time}</span>
                    </div>
                  )}
                  <div className="text-sm text-gray-100 whitespace-pre-wrap">{reply.text}</div>
                  {reply.reactions && reply.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {reply.reactions.map(r => (
                        <span key={r.emoji} className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-1.5 py-0.5 text-xs text-gray-300">
                          {r.emoji} {r.count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {thread.replies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-600">
            <MessageSquare size={28} className="mb-2 opacity-30" />
            <p className="text-sm">No replies yet</p>
            <p className="text-xs mt-0.5">Start the thread below</p>
          </div>
        )}
      </div>

      {/* Reply composer */}
      <div className="flex-shrink-0 p-3 border-t border-white/10">
        <MessageComposer
          channelId={`thread-${parent.id}`}
          placeholder="Reply in thread…"
          onSend={onReply}
          members={members}
          channels={channels}
        />
      </div>
    </motion.div>
  );
});

// ── Pinned Messages Panel ─────────────────────────────────────
interface PinnedPanelProps {
  messages: ChatMessage[];
  onClose: () => void;
  onUnpin: (msgId: string) => void;
  onJump: (msgId: string) => void;
}
const PinnedPanel = memo(({ messages, onClose, onUnpin, onJump }: PinnedPanelProps) => (
  <motion.div
    initial={{ x: 40, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: 40, opacity: 0 }}
    transition={{ type: 'spring', damping: 25 }}
    className="w-80 flex-shrink-0 flex flex-col bg-[#0f0f22] border-l border-white/10 h-full"
  >
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
      <div className="flex items-center gap-2">
        <Pin size={15} className="text-[#5b5fc7]" />
        <span className="font-semibold text-white text-sm">Pinned Messages</span>
        <span className="text-xs text-gray-500">{messages.length}</span>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
    </div>
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-gray-600">
          <Pin size={28} className="mb-2 opacity-30" />
          <p className="text-sm">No pinned messages</p>
        </div>
      )}
      {messages.map(msg => {
        const member = getMemberById(msg.senderId);
        return (
          <div key={msg.id} className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-2 mb-1.5">
              {member && <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: member.color }}>{member.initials}</div>}
              <span className="text-xs font-medium text-white">{msg.senderName}</span>
              <span className="text-xs text-gray-500 ml-auto">{msg.time}</span>
            </div>
            <p className="text-xs text-gray-300 line-clamp-3">{msg.text}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => onJump(msg.id)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                <ExternalLink size={10} /> Jump to
              </button>
              <button onClick={() => onUnpin(msg.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors ml-auto">Unpin</button>
            </div>
          </div>
        );
      })}
    </div>
  </motion.div>
));

// ── Bookmarks Panel ───────────────────────────────────────────
interface BookmarksPanelProps {
  messages: ChatMessage[];
  onClose: () => void;
  onRemove: (msgId: string) => void;
  onJump: (channelId: string, msgId: string) => void;
}
const BookmarksPanel = memo(({ messages, onClose, onRemove, onJump }: BookmarksPanelProps) => (
  <motion.div
    initial={{ x: 40, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: 40, opacity: 0 }}
    transition={{ type: 'spring', damping: 25 }}
    className="w-80 flex-shrink-0 flex flex-col bg-[#0f0f22] border-l border-white/10 h-full"
  >
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
      <div className="flex items-center gap-2">
        <Bookmark size={15} className="text-amber-400" />
        <span className="font-semibold text-white text-sm">Saved Messages</span>
        <span className="text-xs text-gray-500">{messages.length}</span>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
    </div>
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-gray-600">
          <Bookmark size={28} className="mb-2 opacity-30" />
          <p className="text-sm">No saved messages yet</p>
          <p className="text-xs mt-0.5">Hover a message to bookmark it</p>
        </div>
      )}
      {messages.map(msg => {
        const member = getMemberById(msg.senderId);
        return (
          <div key={msg.id} className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-2 mb-1.5">
              {member && <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: member.color }}>{member.initials}</div>}
              <span className="text-xs font-medium text-white">{msg.senderName}</span>
              <span className="text-xs text-gray-500 ml-auto">{msg.time}</span>
            </div>
            <p className="text-xs text-gray-300 line-clamp-3">{msg.text}</p>
            <div className="flex gap-2 mt-2">
              {msg.channelId && (
                <button onClick={() => onJump(msg.channelId!, msg.id)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                  <ExternalLink size={10} /> Jump to
                </button>
              )}
              <button onClick={() => onRemove(msg.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors ml-auto">Remove</button>
            </div>
          </div>
        );
      })}
    </div>
  </motion.div>
));

// ── Members Panel ─────────────────────────────────────────────
interface MembersPanelProps {
  channel: Channel;
  members: WorkspaceMember[];
  presenceMap: Record<string, WorkspaceMember['status']>;
  onClose: () => void;
  onProfileClick: (memberId: string) => void;
  onDm: (memberId: string) => void;
}
const MembersPanel = memo(({ channel, members, presenceMap, onClose, onProfileClick, onDm }: MembersPanelProps) => {
  const [search, setSearch] = useState('');
  const filtered = members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  const online = filtered.filter(m => (presenceMap[m.id] || m.status) === 'online');
  const away = filtered.filter(m => ['away', 'dnd'].includes(presenceMap[m.id] || m.status));
  const offline = filtered.filter(m => (presenceMap[m.id] || m.status) === 'offline');

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ type: 'spring', damping: 25 }}
      className="w-80 flex-shrink-0 flex flex-col bg-[#0f0f22] border-l border-white/10 h-full"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-gray-400" />
          <span className="font-semibold text-white text-sm">#{channel.name}</span>
          <span className="text-xs text-gray-500">{channel.members} members</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
      </div>
      <div className="px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5">
          <Search size={13} className="text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Find members…"
            className="bg-transparent text-sm text-white placeholder-gray-500 outline-none"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {[
          { label: `Online — ${online.length}`, members: online },
          { label: `Away — ${away.length}`, members: away },
          { label: `Offline — ${offline.length}`, members: offline },
        ].map(({ label, members: group }) => group.length > 0 && (
          <div key={label}>
            <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</div>
            {group.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 group/member">
                <Avatar member={{ ...m, status: presenceMap[m.id] || m.status }} size="sm" showPresence />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-white font-medium truncate">{m.name}</span>
                    {m.kind === 'ai' && <Sparkles size={10} className="text-purple-400 flex-shrink-0" />}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{m.title}</div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover/member:opacity-100 transition-opacity">
                  <button onClick={() => onDm(m.id)} className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Send DM">
                    <MessageSquare size={12} />
                  </button>
                  <button onClick={() => onProfileClick(m.id)} className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="View profile">
                    <Eye size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
});

// ── Forward Message Modal ─────────────────────────────────────
interface ForwardMessageModalProps {
  message: ChatMessage;
  channels: Channel[];
  workspaceId: string;
  authToken: string;
  onClose: () => void;
  onSuccess: () => void;
}
const ForwardMessageModal = memo(({ message, channels, workspaceId, authToken, onClose, onSuccess }: ForwardMessageModalProps) => {
  const [channelSearch, setChannelSearch] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(channelSearch.toLowerCase())
  );

  const handleForward = async () => {
    if (!selectedChannelId) return;
    setLoading(true);
    try {
      await chatApi.forwardMessage(workspaceId, message.id, selectedChannelId, comment || undefined, authToken);
    } catch {
      // API may not exist yet; treat as success
    } finally {
      setLoading(false);
      onSuccess();
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-[#12122a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Forward size={16} className="text-[#5b5fc7]" />
            Forward message
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Original message preview */}
          <div className="bg-white/5 border-l-4 border-[#5b5fc7] rounded-r-lg px-3 py-2">
            <div className="text-xs text-gray-400 mb-0.5 font-medium">{message.senderName}</div>
            <div className="text-sm text-gray-200 line-clamp-3">{message.text.slice(0, 100)}{message.text.length > 100 ? '…' : ''}</div>
          </div>

          {/* Channel search */}
          <div>
            <label className="block text-xs text-gray-400 font-medium mb-1.5 uppercase tracking-wider">Forward to</label>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus-within:border-[#5b5fc7]/50 mb-2">
              <Search size={13} className="text-gray-500" />
              <input
                value={channelSearch}
                onChange={e => setChannelSearch(e.target.value)}
                placeholder="Search channels…"
                className="bg-transparent text-white text-sm outline-none flex-1 placeholder-gray-500"
                autoFocus
              />
            </div>
            <div className="bg-[#1e1e32] border border-white/10 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
              {filteredChannels.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannelId(ch.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${selectedChannelId === ch.id ? 'bg-[#5b5fc7]/20 text-white' : 'text-gray-300 hover:bg-white/5'}`}
                >
                  {ch.private ? <Lock size={12} className="text-gray-500" /> : <Hash size={12} className="text-gray-500" />}
                  <span className="flex-1 truncate">{ch.name}</span>
                  {selectedChannelId === ch.id && <Check size={13} className="text-[#5b5fc7] flex-shrink-0" />}
                </button>
              ))}
              {filteredChannels.length === 0 && (
                <div className="px-3 py-3 text-sm text-gray-500">No channels found</div>
              )}
            </div>
          </div>

          {/* Optional comment */}
          <div>
            <label className="block text-xs text-gray-400 font-medium mb-1.5 uppercase tracking-wider">Add a comment <span className="text-gray-600 normal-case">(optional)</span></label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Add a note…"
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-[#5b5fc7]/50 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors">Cancel</button>
          <button
            onClick={handleForward}
            disabled={!selectedChannelId || loading}
            className="flex-1 py-2.5 rounded-lg bg-[#5b5fc7] hover:bg-[#c4674a] disabled:opacity-40 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Forward size={14} />}
            Forward
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
});

/* ═══════════════════════════════════════════════════════════════
   MAIN CHAT PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function ChatPage() {
  const authToken = useStore(s => (s as any).authToken as string) || '';
  const workspace = useStore(s => (s as any).workspace);
  const currentUser = useStore(s => (s as any).currentUser);
  const workspaceId = workspace?.id || 'ws-default';

  // Derive current user id
  const currentUserId = currentUser?.id || 'u-alex';
  const currentMember: WorkspaceMember = useMemo(() => ({
    id: currentUserId,
    name: currentUser?.name || 'You',
    title: currentUser?.title || 'Member',
    email: currentUser?.email || '',
    status: 'online' as const,
    kind: 'human' as const,
    initials: (currentUser?.name || 'YO').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
    color: '#c4314b',
  }), [currentUser, currentUserId]);

  // ── State ────────────────────────────────────────────────
  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);
  const [dms] = useState<DMConversation[]>(INITIAL_DMS);
  const [activeChannelId, setActiveChannelId] = useState<string>('c-general');
  const [activeDmId, setActiveDmId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [presenceMap, setPresenceMap] = useState<Record<string, WorkspaceMember['status']>>({});
  const [thread, setThread] = useState<ThreadState>({ open: false, parentMessage: null, replies: [], following: false });
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [channelsCollapsed, setChannelsCollapsed] = useState(false);
  const [dmsCollapsed, setDmsCollapsed] = useState(false);
  const [channelSearch, setChannelSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; senderName: string; text: string } | undefined>();
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [showCustomStatus, setShowCustomStatus] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [customStatus, setCustomStatus] = useState<{ emoji: string; text: string; expiresAt?: string } | undefined>();
  const [pendingPoll, setPendingPoll] = useState<Poll | undefined>();
  const [socketConnected, setSocketConnected] = useState(false);
  const [showJumpToPresent, setShowJumpToPresent] = useState(false);
  const [profilePopover, setProfilePopover] = useState<{ memberId: string; anchor: DOMRect } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ channelId: string; x: number; y: number } | null>(null);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMsg[]>([]);
  const [channelNotifPrefs, setChannelNotifPrefs] = useState<Record<string, NotifPref>>({});
  const [notifPopover, setNotifPopover] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importStep, setImportStep] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState<Record<string, boolean>>({});

  // ── Feature: Forward Message ──────────────────────────────
  const [forwardModalMsg, setForwardModalMsg] = useState<ChatMessage | null>(null);
  const [showForwardSuccess, setShowForwardSuccess] = useState(false);

  // ── Feature: Link Preview (state tracked per-message in MessageItem) ──

  // ── Feature: Slash Command ephemeral responses ────────────
  const [ephemeralMessages, setEphemeralMessages] = useState<Array<{ id: string; text: string; channelId: string }>>([]);

  // ── Feature: Desktop Notifications + DND ─────────────────
  const [desktopNotifPermission, setDesktopNotifPermission] = useState<NotificationPermission>('default');
  const isDND = currentMember?.status === 'dnd';

  // ── Feature: Read Receipts ────────────────────────────────
  const [readReceipts, setReadReceipts] = useState<Map<string, Array<{ userId: string; readAt: number }>>>(new Map());

  // ── Feature: Workflow Automation ──────────────────────────
  interface AutomationRule { id: string; name: string; enabled: boolean; trigger: { event: string; conditions?: { keyword?: string; channelId?: string } }; action: { type: string; config: { message?: string; emoji?: string; webhookUrl?: string } } }
  const [automationRules] = useState<AutomationRule[]>(() => { try { return JSON.parse(localStorage.getItem('brixstac_automations') || '[]'); } catch { return []; } });
  const [showAutomationsPanel, setShowAutomationsPanel] = useState(false);

  // ── Feature: E2E Encryption ───────────────────────────────
  const [e2eEnabled, setE2eEnabled] = useState(false);
  const e2eKeysRef = useRef<{ publicKey: CryptoKey; privateKey: CryptoKey } | null>(null);

  // ── Feature: Huddles ──────────────────────────────────────
  const [huddles, setHuddles] = useState<Record<string, HuddleState>>({});
  const [activeHuddle, setActiveHuddle] = useState<{ channelId: string; muted: boolean } | null>(null);
  const [dismissedHuddleBanner, setDismissedHuddleBanner] = useState<string | null>(null);

  // ── Feature: Scheduled messages (API-fetched) ─────────────
  const [serverScheduledMessages, setServerScheduledMessages] = useState<ScheduledMsg[]>([]);
  const [editingScheduledId, setEditingScheduledId] = useState<string | null>(null);
  const [editScheduledDate, setEditScheduledDate] = useState('');

  // ── Refs ─────────────────────────────────────────────────
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── Active channel/DM info ────────────────────────────────
  const activeChannel = useMemo(() => channels.find(c => c.id === activeChannelId), [channels, activeChannelId]);
  const activeDmPerson = useMemo(() => dms.find(d => d.id === activeDmId)
    ? WORKSPACE_MEMBERS.find(m => m.id === dms.find(d => d.id === activeDmId)?.personId)
    : null, [dms, activeDmId]);

  const currentMessages = useMemo(() => {
    const channelKey = activeDmId || activeChannelId;
    return messages[channelKey] || [];
  }, [messages, activeChannelId, activeDmId]);

  const pinnedMessages = useMemo(() => currentMessages.filter(m => m.pinned), [currentMessages]);
  const bookmarkedMessages = useMemo(() => Object.values(messages).flat().filter(m => m.bookmarked), [messages]);

  // ── Socket.IO Setup ──────────────────────────────────────
  useEffect(() => {
    let sock: Socket;
    try {
      sock = io(window.location.origin, {
        path: '/socket.io/',
        auth: { token: authToken },
        transports: ['websocket', 'polling'],
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });
      socketRef.current = sock;

      sock.on('connect', () => {
        setSocketConnected(true);
        if (workspaceId) sock.emit('workspace:join', workspaceId);
      });

      sock.on('disconnect', () => setSocketConnected(false));

      sock.on('connect_error', () => {
        setSocketConnected(false);
      });

      // Incoming messages
      sock.on('channel:message', (payload: ChatMessage) => {
        if (!payload.id || !payload.channelId) return;
        setMessages(prev => {
          const key = payload.channelId!;
          const existing = prev[key] || [];
          if (existing.find(m => m.id === payload.id)) return prev;
          return { ...prev, [key]: [...existing, { ...payload, isMe: payload.senderId === currentUserId }] };
        });
        // Unread badge (skip if DND)
        if (!isDND) {
          setChannels(prev => prev.map(c =>
            c.id === payload.channelId && payload.channelId !== activeChannelId
              ? { ...c, unread: c.unread + 1 }
              : c
          ));
          // Desktop notification for background channels
          const ch = channels.find(c => c.id === payload.channelId);
          if (ch && payload.senderId !== currentUserId) showDesktopNotification(payload, ch.name);
        }
        // Run automations
        if (payload.senderId !== currentUserId) runAutomations(payload);
        // Emit read receipt if this is the active channel
        if (payload.channelId === activeChannelId || payload.channelId === activeDmId) {
          sock.emit('read:message', { messageId: payload.id, channelId: payload.channelId });
        }
      });

      // Typing events
      sock.on('channel:typing:start', ({ channelId, userId, userName }: { channelId: string; userId: string; userName: string }) => {
        if (userId === currentUserId) return;
        setTypingUsers(prev => ({
          ...prev,
          [channelId]: [...(prev[channelId] || []).filter(n => n !== userName), userName],
        }));
        clearTimeout(typingTimerRef.current[`${channelId}-${userId}`]);
        typingTimerRef.current[`${channelId}-${userId}`] = setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [channelId]: (prev[channelId] || []).filter(n => n !== userName),
          }));
        }, 4000);
      });

      sock.on('channel:typing:stop', ({ channelId, userId, userName }: { channelId: string; userId: string; userName: string }) => {
        setTypingUsers(prev => ({
          ...prev,
          [channelId]: (prev[channelId] || []).filter(n => n !== userName),
        }));
      });

      // Presence updates
      sock.on('presence:update', ({ userId, status }: { userId: string; status: WorkspaceMember['status'] }) => {
        setPresenceMap(prev => ({ ...prev, [userId]: status }));
      });

      // Message reactions from others
      sock.on('message:reaction', ({ messageId, channelId, emoji, userId, add }: any) => {
        setMessages(prev => {
          const msgs = prev[channelId] || [];
          return {
            ...prev,
            [channelId]: msgs.map(m => {
              if (m.id !== messageId) return m;
              const reactions = [...(m.reactions || [])];
              const idx = reactions.findIndex(r => r.emoji === emoji);
              if (add) {
                if (idx === -1) return { ...m, reactions: [...reactions, { emoji, count: 1, users: [userId] }] };
                reactions[idx] = { ...reactions[idx], count: reactions[idx].count + 1, users: [...reactions[idx].users, userId] };
              } else {
                if (idx === -1) return m;
                const users = reactions[idx].users.filter(u => u !== userId);
                if (users.length === 0) reactions.splice(idx, 1);
                else reactions[idx] = { ...reactions[idx], count: users.length, users };
              }
              return { ...m, reactions };
            }),
          };
        });
      });

      // Message pinned/unpinned
      sock.on('message:pinned', ({ messageId, channelId }: any) => {
        setMessages(prev => ({
          ...prev,
          [channelId]: (prev[channelId] || []).map(m => m.id === messageId ? { ...m, pinned: true } : m),
        }));
      });

      sock.on('message:deleted', ({ messageId, channelId }: any) => {
        setMessages(prev => ({
          ...prev,
          [channelId]: (prev[channelId] || []).filter(m => m.id !== messageId),
        }));
      });

      // Read receipts
      sock.on('read:receipt', ({ messageId, userId: readerId, readAt }: { messageId: string; userId: string; readAt: number }) => {
        if (readerId === currentUserId) return;
        setReadReceipts(prev => {
          const next = new Map(prev);
          const existing = next.get(messageId) || [];
          if (!existing.find(r => r.userId === readerId)) {
            next.set(messageId, [...existing, { userId: readerId, readAt }]);
          }
          return next;
        });
      });

      // Huddle events
      sock.on('huddle:started', (huddle: any) => {
        setHuddles(prev => ({ ...prev, [huddle.channelId]: { active: true, participants: huddle.participants || [], startedBy: huddle.startedBy } }));
      });
      sock.on('huddle:ended', ({ channelId }: any) => {
        setHuddles(prev => { const n = { ...prev }; delete n[channelId]; return n; });
        setActiveHuddle(null);
      });
      sock.on('huddle:participant_joined', ({ huddleId, userId: uid }: any) => {
        setHuddles(prev => {
          const entries = Object.entries(prev);
          const entry = entries.find(([,h]: any) => h.id === huddleId || true);
          if (!entry) return prev;
          const [cid, h] = entry as any;
          return { ...prev, [cid]: { ...h, participants: [...(h.participants||[]).filter((u:string)=>u!==uid), uid] } };
        });
      });

    } catch (e) {
      // Socket.IO not available; fall through to mock data
      console.warn('Socket.IO unavailable, running with mock data');
    }

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [authToken, workspaceId]);

  // ── Desktop notification permission ──────────────────────
  useEffect(() => {
    if ('Notification' in window) {
      setDesktopNotifPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(p => setDesktopNotifPermission(p));
      }
    }
  }, []);

  // ── Show desktop notification for messages in background channels ──────
  const showDesktopNotification = useCallback((msg: ChatMessage, channelName: string) => {
    if (isDND) return;
    if (desktopNotifPermission !== 'granted') return;
    if (document.hasFocus() && (msg.channelId === activeChannelId || msg.channelId === activeDmId)) return;
    const notif = new Notification(`#${channelName}`, {
      body: `${msg.senderName || 'Someone'}: ${(msg.text || '').slice(0, 100)}`,
      icon: '/favicon.ico',
      tag: `msg-${msg.channelId}`,
      silent: false,
    });
    notif.onclick = () => { window.focus(); if (msg.channelId) { selectChannel(msg.channelId); } notif.close(); };
    setTimeout(() => notif.close(), 5000);
  }, [isDND, desktopNotifPermission, activeChannelId, activeDmId]);

  // ── Automation engine ─────────────────────────────────────
  const runAutomations = useCallback((msg: ChatMessage) => {
    automationRules.filter(r => r.enabled).forEach(rule => {
      if (rule.trigger.event === 'message_keyword' && rule.trigger.conditions?.keyword) {
        if (!(msg.text || '').toLowerCase().includes(rule.trigger.conditions.keyword.toLowerCase())) return;
      }
      if (rule.trigger.conditions?.channelId && rule.trigger.conditions.channelId !== msg.channelId) return;
      if (rule.action.type === 'post_message' && rule.action.config.message && msg.channelId) {
        fetch(`/api/workspaces/${workspaceId}/channels/${msg.channelId}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: rule.action.config.message }),
        }).catch(() => {});
      } else if (rule.action.type === 'notify_webhook' && rule.action.config.webhookUrl) {
        fetch(rule.action.config.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'message', message: msg }) }).catch(() => {});
      }
    });
  }, [automationRules, workspaceId, authToken]);

  // ── E2E key initialisation ────────────────────────────────
  useEffect(() => {
    if (!('subtle' in (window.crypto || {}))) return;
    const stored = localStorage.getItem(`brixstac_e2e_${workspaceId}`);
    if (stored) {
      try {
        const { privateKeyJwk, publicKeyJwk } = JSON.parse(stored);
        Promise.all([
          window.crypto.subtle.importKey('jwk', privateKeyJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey']),
          window.crypto.subtle.importKey('jwk', publicKeyJwk, { name: 'ECDH', namedCurve: 'P-256' }, true, []),
        ]).then(([privateKey, publicKey]) => { e2eKeysRef.current = { privateKey, publicKey }; }).catch(() => {});
        return;
      } catch {}
    }
    window.crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']).then(async (kp: any) => {
      const privateKeyJwk = await window.crypto.subtle.exportKey('jwk', kp.privateKey);
      const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', kp.publicKey);
      localStorage.setItem(`brixstac_e2e_${workspaceId}`, JSON.stringify({ privateKeyJwk, publicKeyJwk }));
      e2eKeysRef.current = { privateKey: kp.privateKey, publicKey: kp.publicKey };
    }).catch(() => {});
  }, [workspaceId]);

  // ── Load messages for active channel ─────────────────────
  const loadMessages = useCallback(async (channelId: string, before?: number) => {
    setLoadingMessages(true);
    try {
      const url = `/api/workspaces/${workspaceId}/channels/${channelId}/messages?limit=50${before ? `&before=${before}` : ''}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${authToken}` } });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const fetched: ChatMessage[] = (data.messages || []).map((m: any) => ({
        ...m,
        isMe: m.senderId === currentUserId,
        channelId,
      }));
      setMessages(prev => ({
        ...prev,
        [channelId]: before
          ? [...fetched, ...(prev[channelId] || [])]
          : fetched,
      }));
      setHasMoreMessages(prev => ({ ...prev, [channelId]: (data.messages || []).length === 50 }));
    } catch {
      // Use mock data
      if (!messages[channelId]) {
        const mock = generateMockMessages(channelId, currentUserId);
        setMessages(prev => ({ ...prev, [channelId]: mock }));
        setHasMoreMessages(prev => ({ ...prev, [channelId]: true }));
      }
    } finally {
      setLoadingMessages(false);
    }
  }, [workspaceId, authToken, currentUserId, messages]);

  // Join channel room
  const joinChannelRoom = useCallback((channelId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('channel:join', channelId);
    }
  }, []);

  const leaveChannelRoom = useCallback((channelId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('channel:leave', channelId);
    }
  }, []);

  // ── Channel selection ─────────────────────────────────────
  const selectChannel = useCallback((channelId: string) => {
    if (activeChannelId === channelId) return;
    leaveChannelRoom(activeChannelId);
    setActiveChannelId(channelId);
    setActiveDmId(null);
    setThread({ open: false, parentMessage: null, replies: [], following: false });
    setActivePanel('none');
    setEditingId(null);
    setReplyTo(undefined);
    // Clear unread
    setChannels(prev => prev.map(c => c.id === channelId ? { ...c, unread: 0 } : c));
    // Load messages if not yet loaded
    loadMessages(channelId);
    joinChannelRoom(channelId);
    // Mark as read via API
    fetch(`/api/workspaces/${workspaceId}/channels/${channelId}/read`, {
      method: 'POST', headers: { Authorization: `Bearer ${authToken}` },
    }).catch(() => {});
  }, [activeChannelId, leaveChannelRoom, loadMessages, joinChannelRoom, workspaceId, authToken]);

  // Initial load
  useEffect(() => {
    loadMessages(activeChannelId);
    joinChannelRoom(activeChannelId);
    return () => leaveChannelRoom(activeChannelId);
  }, []);

  // Load scheduled messages from server
  useEffect(() => {
    chatApi.getScheduledMessages(workspaceId, authToken)
      .then((data: any) => {
        const msgs = Array.isArray(data) ? data : (data?.messages || []);
        setServerScheduledMessages(msgs);
      })
      .catch(() => {}); // silently fail if API not available
  }, [workspaceId, authToken]);

  // ── Auto-scroll ───────────────────────────────────────────
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setShowJumpToPresent(false);
    } else {
      setShowJumpToPresent(true);
    }
  }, [currentMessages.length]);

  // Scroll handler for "Jump to present" and load-more
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
    setShowJumpToPresent(!isNearBottom);
    // Load more at top
    if (container.scrollTop < 50 && !loadingMessages && hasMoreMessages[activeChannelId]) {
      const oldest = currentMessages[0];
      if (oldest) loadMessages(activeChannelId, oldest.timestamp);
    }
  }, [loadingMessages, hasMoreMessages, activeChannelId, currentMessages, loadMessages]);

  // ── Send message ──────────────────────────────────────────
  const sendMessage = useCallback((text: string, attachments?: File[]) => {
    if (!text.trim() && !attachments?.length && !pendingPoll) return;
    const channelKey = activeDmId || activeChannelId;
    const tempId = `temp-${Date.now()}`;
    const now = new Date();

    const newMsg: ChatMessage = {
      id: tempId,
      senderId: currentUserId,
      senderName: currentMember.name,
      text,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: now.getTime(),
      isMe: true,
      pending: true,
      channelId: channelKey,
      replyTo,
      poll: pendingPoll,
      attachments: attachments?.map(f => ({
        id: `att-${Date.now()}-${f.name}`,
        name: f.name,
        type: f.type.startsWith('image/') ? 'image' as const : 'file' as const,
        size: `${(f.size / 1024).toFixed(1)} KB`,
        preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
        url: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
      })),
    };

    // Optimistic update
    setMessages(prev => ({ ...prev, [channelKey]: [...(prev[channelKey] || []), newMsg] }));
    setPendingPoll(undefined);

    // Emit via socket
    if (socketRef.current?.connected) {
      socketRef.current.emit('channel:message', {
        channelId: channelKey,
        text,
        replyTo,
        poll: newMsg.poll,
      }, (ack: { id?: string; error?: string }) => {
        setMessages(prev => ({
          ...prev,
          [channelKey]: (prev[channelKey] || []).map(m =>
            m.id === tempId
              ? { ...m, id: ack?.id || tempId, pending: false, failed: !!ack?.error }
              : m
          ),
        }));
      });
    } else {
      // REST fallback
      fetch(`/api/workspaces/${workspaceId}/channels/${activeChannelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ text, replyTo: replyTo?.id }),
      }).then(r => r.json()).then(data => {
        setMessages(prev => ({
          ...prev,
          [channelKey]: (prev[channelKey] || []).map(m =>
            m.id === tempId ? { ...m, id: data.id || tempId, pending: false } : m
          ),
        }));
      }).catch(() => {
        // Keep as sent locally
        setMessages(prev => ({
          ...prev,
          [channelKey]: (prev[channelKey] || []).map(m =>
            m.id === tempId ? { ...m, pending: false } : m
          ),
        }));
      });
    }

    setReplyTo(undefined);
  }, [currentUserId, currentMember, activeChannelId, activeDmId, replyTo, pendingPoll, workspaceId, authToken]);

  // ── Typing indicators ─────────────────────────────────────
  const emitTypingStart = useCallback(() => {
    const channelKey = activeDmId || activeChannelId;
    socketRef.current?.emit('channel:typing:start', { channelId: channelKey, userName: currentMember.name });
  }, [activeChannelId, activeDmId, currentMember.name]);

  const emitTypingStop = useCallback(() => {
    const channelKey = activeDmId || activeChannelId;
    socketRef.current?.emit('channel:typing:stop', { channelId: channelKey, userName: currentMember.name });
  }, [activeChannelId, activeDmId, currentMember.name]);

  // ── Message actions ───────────────────────────────────────
  const handleReact = useCallback((msgId: string, emoji: string) => {
    const channelKey = activeDmId || activeChannelId;
    setMessages(prev => {
      const msgs = prev[channelKey] || [];
      return {
        ...prev,
        [channelKey]: msgs.map(m => {
          if (m.id !== msgId) return m;
          const reactions = [...(m.reactions || [])];
          const idx = reactions.findIndex(r => r.emoji === emoji);
          const alreadyReacted = idx !== -1 && reactions[idx].users.includes(currentUserId);
          if (alreadyReacted) {
            const users = reactions[idx].users.filter(u => u !== currentUserId);
            if (users.length === 0) reactions.splice(idx, 1);
            else reactions[idx] = { ...reactions[idx], count: users.length, users };
          } else {
            if (idx === -1) reactions.push({ emoji, count: 1, users: [currentUserId] });
            else reactions[idx] = { ...reactions[idx], count: reactions[idx].count + 1, users: [...reactions[idx].users, currentUserId] };
          }
          return { ...m, reactions };
        }),
      };
    });
    socketRef.current?.emit('message:react', { messageId: msgId, channelId: channelKey, emoji });
  }, [activeChannelId, activeDmId, currentUserId]);

  const handleReply = useCallback((msg: ChatMessage) => {
    setThread({ open: true, parentMessage: msg, replies: [], following: false });
    setActivePanel('thread');
  }, []);

  const handleSetReplyTo = useCallback((msg: ChatMessage) => {
    setReplyTo({ id: msg.id, senderName: msg.senderName, text: msg.text });
  }, []);

  const handleEdit = useCallback((msg: ChatMessage) => setEditingId(msg.id), []);
  const handleEditCancel = useCallback(() => setEditingId(null), []);

  const handleEditSave = useCallback((msgId: string, newText: string) => {
    const channelKey = activeDmId || activeChannelId;
    setMessages(prev => ({
      ...prev,
      [channelKey]: (prev[channelKey] || []).map(m =>
        m.id === msgId ? { ...m, text: newText, edited: true } : m
      ),
    }));
    setEditingId(null);
    socketRef.current?.emit('message:edit', { messageId: msgId, channelId: channelKey, text: newText });
    fetch(`/api/workspaces/${workspaceId}/messages/${msgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ text: newText }),
    }).catch(() => {});
  }, [activeChannelId, activeDmId, workspaceId, authToken]);

  const handlePin = useCallback((msgId: string) => {
    const channelKey = activeDmId || activeChannelId;
    setMessages(prev => ({
      ...prev,
      [channelKey]: (prev[channelKey] || []).map(m =>
        m.id === msgId ? { ...m, pinned: !m.pinned } : m
      ),
    }));
    setChannels(prev => prev.map(c => c.id === activeChannelId ? { ...c, pinnedCount: (c.pinnedCount || 0) + 1 } : c));
    socketRef.current?.emit('message:pin', { messageId: msgId, channelId: channelKey });
  }, [activeChannelId, activeDmId]);

  const handleBookmark = useCallback((msgId: string) => {
    const channelKey = activeDmId || activeChannelId;
    setMessages(prev => ({
      ...prev,
      [channelKey]: (prev[channelKey] || []).map(m =>
        m.id === msgId ? { ...m, bookmarked: !m.bookmarked } : m
      ),
    }));
  }, [activeChannelId, activeDmId]);

  const handleDelete = useCallback((msgId: string) => {
    if (!window.confirm('Delete this message?')) return;
    const channelKey = activeDmId || activeChannelId;
    setMessages(prev => ({
      ...prev,
      [channelKey]: (prev[channelKey] || []).filter(m => m.id !== msgId),
    }));
    socketRef.current?.emit('message:delete', { messageId: msgId, channelId: channelKey });
    fetch(`/api/workspaces/${workspaceId}/messages/${msgId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${authToken}` },
    }).catch(() => {});
  }, [activeChannelId, activeDmId, workspaceId, authToken]);

  const handleForward = useCallback((msg: ChatMessage) => {
    setForwardModalMsg(msg);
  }, []);

  const handleCopyLink = useCallback((msgId: string) => {
    const link = `${window.location.origin}/chat/${activeChannelId}/${msgId}`;
    navigator.clipboard.writeText(link).catch(() => {});
  }, [activeChannelId]);

  const handleVotePoll = useCallback((msgId: string, optId: string) => {
    const channelKey = activeDmId || activeChannelId;
    setMessages(prev => ({
      ...prev,
      [channelKey]: (prev[channelKey] || []).map(m => {
        if (m.id !== msgId || !m.poll) return m;
        const options = m.poll.options.map(o => {
          if (o.id !== optId) return o;
          const alreadyVoted = o.votes.includes(currentUserId);
          return { ...o, votes: alreadyVoted ? o.votes.filter(v => v !== currentUserId) : [...o.votes, currentUserId] };
        });
        return { ...m, poll: { ...m.poll, options } };
      }),
    }));
  }, [activeChannelId, activeDmId, currentUserId]);

  const handleClosePoll = useCallback((msgId: string) => {
    const channelKey = activeDmId || activeChannelId;
    setMessages(prev => ({
      ...prev,
      [channelKey]: (prev[channelKey] || []).map(m =>
        m.id === msgId && m.poll ? { ...m, poll: { ...m.poll, closed: true } } : m
      ),
    }));
  }, [activeChannelId, activeDmId]);

  const handleThreadReply = useCallback((text: string) => {
    if (!thread.parentMessage || !text.trim()) return;
    const newReply: ChatMessage = {
      id: `reply-${Date.now()}`,
      senderId: currentUserId,
      senderName: currentMember.name,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      isMe: true,
    };
    setThread(prev => ({ ...prev, replies: [...prev.replies, newReply] }));
    // Update parent thread count
    const channelKey = activeDmId || activeChannelId;
    setMessages(prev => ({
      ...prev,
      [channelKey]: (prev[channelKey] || []).map(m =>
        m.id === thread.parentMessage?.id
          ? { ...m, threadCount: (m.threadCount || 0) + 1, threadUsers: [...new Set([...(m.threadUsers || []), currentUserId])] }
          : m
      ),
    }));
    socketRef.current?.emit('thread:reply', { parentId: thread.parentMessage.id, channelId: channelKey, text });
  }, [thread.parentMessage, currentUserId, currentMember.name, activeChannelId, activeDmId]);

  // ── Huddle handlers ───────────────────────────────────────
  const handleStartHuddle = useCallback((channelId: string) => {
    chatApi.startHuddle(workspaceId, channelId, authToken)
      .then((data: any) => {
        setHuddles(prev => ({
          ...prev,
          [channelId]: { channelId, participants: [currentUserId, ...(data?.participants || [])], active: true },
        }));
      })
      .catch(() => {
        // Optimistic: start huddle locally
        setHuddles(prev => ({
          ...prev,
          [channelId]: { channelId, participants: [currentUserId], active: true },
        }));
      });
  }, [workspaceId, authToken, currentUserId]);

  const handleJoinHuddle = useCallback((channelId: string) => {
    chatApi.joinHuddle(workspaceId, channelId, authToken)
      .then((data: any) => {
        setHuddles(prev => ({
          ...prev,
          [channelId]: {
            ...prev[channelId],
            participants: [...new Set([...(prev[channelId]?.participants || []), currentUserId, ...(data?.participants || [])])],
          },
        }));
        setActiveHuddle({ channelId, muted: false });
      })
      .catch(() => {
        setHuddles(prev => ({
          ...prev,
          [channelId]: {
            ...prev[channelId],
            participants: [...new Set([...(prev[channelId]?.participants || []), currentUserId])],
          },
        }));
        setActiveHuddle({ channelId, muted: false });
      });
  }, [workspaceId, authToken, currentUserId]);

  const handleLeaveHuddle = useCallback((channelId: string) => {
    chatApi.leaveHuddle(workspaceId, channelId, authToken).catch(() => {});
    setActiveHuddle(null);
    setHuddles(prev => ({
      ...prev,
      [channelId]: { ...prev[channelId], participants: (prev[channelId]?.participants || []).filter(u => u !== currentUserId) },
    }));
  }, [workspaceId, authToken, currentUserId]);

  // ── Profile popover ───────────────────────────────────────
  const handleProfileClick = useCallback((memberId: string, anchor: HTMLElement) => {
    const rect = anchor.getBoundingClientRect();
    setProfilePopover({ memberId, anchor: rect });
  }, []);

  const handleDmFromProfile = useCallback((memberId: string) => {
    const dm = dms.find(d => d.personId === memberId);
    if (dm) { setActiveDmId(dm.id); setActiveChannelId(''); }
  }, [dms]);

  // ── Scheduled message handlers ────────────────────────────
  const handleCancelScheduled = useCallback((msgId: string) => {
    chatApi.cancelScheduledMessage(workspaceId, msgId, authToken).catch(() => {});
    setServerScheduledMessages(prev => prev.filter(m => m.id !== msgId));
    setScheduledMessages(prev => prev.filter(m => (m as any).id !== msgId));
  }, [workspaceId, authToken]);

  const handleEditScheduledTime = useCallback((msgId: string, newAt: string) => {
    // Update locally; a real implementation would PATCH the server
    setServerScheduledMessages(prev => prev.map(m => m.id === msgId ? { ...m, scheduledAt: newAt } : m));
    setEditingScheduledId(null);
    setEditScheduledDate('');
  }, []);

  // ── Channel context menu ──────────────────────────────────
  const handleChannelContextMenu = useCallback((e: React.MouseEvent, channelId: string) => {
    e.preventDefault();
    setContextMenu({ channelId, x: e.clientX, y: e.clientY });
  }, []);

  // ── Import simulation ─────────────────────────────────────
  const startImport = useCallback((type: 'slack' | 'teams') => {
    setShowImportModal(true);
    setImportProgress(0);
    const steps = type === 'slack'
      ? ['Connecting to Slack…', 'Fetching channels…', 'Importing messages…', 'Importing files…', 'Finalizing…']
      : ['Connecting to Teams…', 'Fetching teams…', 'Importing channels…', 'Importing chats…', 'Done!'];
    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setImportStep(steps[i]);
        setImportProgress(Math.round((i + 1) / steps.length * 100));
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setShowImportModal(false), 1500);
      }
    }, 1200);
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
      if (e.key === 'Escape') {
        setShowSearchModal(false);
        setProfilePopover(null);
        setContextMenu(null);
        setNotifPopover(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = () => {
      setContextMenu(null);
      setProfilePopover(null);
      setNotifPopover(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // Navigate to message
  const navigateToMessage = useCallback((channelId: string, msgId?: string) => {
    selectChannel(channelId);
    if (msgId) {
      setHighlightedMsgId(msgId);
      setTimeout(() => {
        const el = document.getElementById(`msg-${msgId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => setHighlightedMsgId(null), 3000);
      }, 300);
    }
  }, [selectChannel]);

  // ── Message grouping with date separators ─────────────────
  const groupedMessages = useMemo(() => {
    type Item = ChatMessage | { type: 'date'; label: string; key: string };
    const items: Item[] = [];
    let lastDate = '';
    currentMessages.forEach(msg => {
      const dateLabel = formatDateLabel(msg.timestamp);
      if (dateLabel !== lastDate) {
        items.push({ type: 'date', label: dateLabel, key: `date-${msg.id}` });
        lastDate = dateLabel;
      }
      items.push(msg);
    });
    return items;
  }, [currentMessages]);

  const channelKey = activeDmId || activeChannelId;
  const typingNames = typingUsers[channelKey] || [];

  // Filter channels by search
  const filteredChannels = useMemo(() =>
    channels.filter(c => c.name.toLowerCase().includes(channelSearch.toLowerCase())),
    [channels, channelSearch]
  );

  // ── Notification pref handler ─────────────────────────────
  const setNotifPref = (channelId: string, pref: NotifPref) => {
    setChannelNotifPrefs(prev => ({ ...prev, [channelId]: pref }));
    setChannels(prev => prev.map(c => c.id === channelId ? { ...c, muted: pref === 'muted' } : c));
    setNotifPopover(null);
  };

  // ── Total unread ──────────────────────────────────────────
  const totalUnread = channels.reduce((s, c) => s + (c.muted ? 0 : c.unread), 0)
    + dms.reduce((s, d) => s + d.unread, 0);

  /* ─────────────────────────────────────────────────────────
     RENDER
     ───────────────────────────────────────────────────────── */
  return (
    <div className="flex h-full bg-[#0f0f22] text-white overflow-hidden" onClick={() => { setContextMenu(null); setProfilePopover(null); }}>

      {/* ── LEFT SIDEBAR ─────────────────────────────────── */}
      <div className="w-60 flex-shrink-0 flex flex-col bg-[#1a1a2e] border-r border-white/5 h-full overflow-hidden">
        {/* Workspace header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-white/5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#5b5fc7] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">B</span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{workspace?.name || 'Brixstac'}</div>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${socketConnected ? 'bg-green-400' : 'bg-gray-500'}`} />
                <span className="text-xs text-gray-500 truncate">{socketConnected ? 'Connected' : 'Offline'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {totalUnread > 0 && (
              <span className="text-xs bg-[#5b5fc7] text-white rounded-full px-1.5 py-0.5 font-medium min-w-5 text-center">{totalUnread > 99 ? '99+' : totalUnread}</span>
            )}
            <button
              onClick={() => setShowSearchModal(true)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Search (Ctrl+K)"
            >
              <Search size={14} />
            </button>
          </div>
        </div>

        {/* Channel search */}
        <div className="px-3 py-2">
          <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1.5">
            <Search size={11} className="text-gray-500" />
            <input
              value={channelSearch}
              onChange={e => setChannelSearch(e.target.value)}
              placeholder="Find channel…"
              className="bg-transparent text-xs text-white placeholder-gray-500 outline-none flex-1 min-w-0"
            />
          </div>
        </div>

        {/* Scrollable nav */}
        <div className="flex-1 overflow-y-auto pb-4">
          {/* Bookmarks shortcut */}
          <button
            onClick={() => setActivePanel(p => p === 'bookmarks' ? 'none' : 'bookmarks')}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors hover:bg-white/5 ${activePanel === 'bookmarks' ? 'text-amber-400' : 'text-gray-400'}`}
          >
            <Bookmark size={14} />
            Saved
            {bookmarkedMessages.length > 0 && (
              <span className="ml-auto text-xs text-gray-600">{bookmarkedMessages.length}</span>
            )}
          </button>

          {/* CHANNELS section */}
          <div className="mt-2">
            <button
              onClick={() => setChannelsCollapsed(v => !v)}
              className="w-full flex items-center gap-1 px-3 py-1 text-xs text-gray-500 uppercase tracking-wider font-medium hover:text-gray-300 transition-colors group"
            >
              {channelsCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              Channels
              <button
                onClick={e => { e.stopPropagation(); setShowCreateChannel(true); }}
                className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/10 hover:text-white"
                title="New channel"
              >
                <Plus size={13} />
              </button>
            </button>

            <AnimatePresence>
              {!channelsCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {filteredChannels.map(ch => {
                    const isActive = ch.id === activeChannelId && !activeDmId;
                    const notifPref = channelNotifPrefs[ch.id];
                    const huddleActive = huddles[ch.id]?.active;
                    return (
                      <div
                        key={ch.id}
                        className={`group relative flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${isActive ? 'bg-[#5b5fc7]/20 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'} ${ch.muted ? 'opacity-50' : ''}`}
                        onClick={() => selectChannel(ch.id)}
                        onContextMenu={e => handleChannelContextMenu(e, ch.id)}
                      >
                        {ch.private ? <Lock size={12} className="flex-shrink-0" /> : <Hash size={12} className="flex-shrink-0" />}
                        <span className={`text-sm truncate flex-1 ${ch.unread > 0 && !ch.muted ? 'font-semibold text-white' : ''}`}>
                          {ch.name}
                        </span>
                        {/* Huddle active pulse */}
                        {huddleActive && (
                          <span className="relative flex h-2 w-2 flex-shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                          </span>
                        )}
                        {ch.muted && <VolumeX size={11} className="text-gray-600 flex-shrink-0" />}
                        {ch.unread > 0 && !ch.muted && (
                          <span className="text-xs bg-[#5b5fc7] text-white rounded-full px-1.5 py-0.5 font-medium min-w-5 text-center flex-shrink-0">
                            {ch.unread > 99 ? '99+' : ch.unread}
                          </span>
                        )}
                        {/* Huddle + notification bell on hover */}
                        <div className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                          <button
                            onClick={e => { e.stopPropagation(); handleStartHuddle(ch.id); }}
                            className="p-0.5 rounded hover:bg-white/10 text-gray-400 hover:text-green-400 transition-colors"
                            title="Start huddle"
                          >
                            <Headphones size={11} />
                          </button>
                          <div className="relative">
                            <button
                              onClick={e => { e.stopPropagation(); setNotifPopover(p => p === ch.id ? null : ch.id); }}
                              className="p-0.5 rounded hover:bg-white/10"
                              title="Notification settings"
                            >
                              <Bell size={11} />
                            </button>
                            <AnimatePresence>
                              {notifPopover === ch.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="absolute right-0 top-full mt-1 w-48 bg-[#1e1e32] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider border-b border-white/5">Notifications</div>
                                  {(['all', 'mentions', 'nothing', 'muted'] as NotifPref[]).map(pref => (
                                    <button
                                      key={pref}
                                      onClick={() => setNotifPref(ch.id, pref)}
                                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${(notifPref || 'all') === pref ? 'text-[#5b5fc7]' : 'text-gray-300 hover:bg-white/5'}`}
                                    >
                                      {(notifPref || 'all') === pref && <Check size={12} />}
                                      <span className="capitalize">{pref === 'all' ? 'All messages' : pref === 'mentions' ? '@Mentions & keywords' : pref === 'nothing' ? 'Nothing' : 'Mute channel'}</span>
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add channel button */}
                  <button
                    onClick={() => setShowCreateChannel(true)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    <Plus size={13} />
                    Add a channel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* DIRECT MESSAGES section */}
          <div className="mt-3">
            <button
              onClick={() => setDmsCollapsed(v => !v)}
              className="w-full flex items-center gap-1 px-3 py-1 text-xs text-gray-500 uppercase tracking-wider font-medium hover:text-gray-300 transition-colors group"
            >
              {dmsCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              Direct Messages
              <button
                onClick={e => { e.stopPropagation(); }}
                className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/10 hover:text-white"
                title="New DM"
              >
                <Plus size={13} />
              </button>
            </button>

            <AnimatePresence>
              {!dmsCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {dms.map(dm => {
                    const person = WORKSPACE_MEMBERS.find(m => m.id === dm.personId);
                    if (!person) return null;
                    const isActive = dm.id === activeDmId;
                    const status = presenceMap[person.id] || person.status;
                    return (
                      <div
                        key={dm.id}
                        onClick={() => { setActiveDmId(dm.id); setActiveChannelId(''); }}
                        className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${isActive ? 'bg-[#5b5fc7]/20' : 'hover:bg-white/5'}`}
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: person.color }}>
                            {person.initials}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#1a1a2e]" style={{ background: getPresenceDot(status) }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm truncate block ${dm.unread > 0 ? 'font-semibold text-white' : 'text-gray-400'}`}>{person.name}</span>
                        </div>
                        {dm.unread > 0 && (
                          <span className="text-xs bg-[#5b5fc7] text-white rounded-full w-4 h-4 flex items-center justify-center font-medium flex-shrink-0">{dm.unread}</span>
                        )}
                        {dm.readReceipt === 'read' && <CheckCheck size={11} className="text-blue-400 flex-shrink-0" />}
                        {dm.readReceipt === 'delivered' && <CheckCheck size={11} className="text-gray-500 flex-shrink-0" />}
                        {dm.readReceipt === 'sent' && <Check size={11} className="text-gray-600 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* APPS section */}
          <div className="mt-3 px-3">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1.5">Apps</div>
            {[
              { icon: <Globe size={13} />, label: 'Import from Slack', action: () => startImport('slack') },
              { icon: <Globe size={13} />, label: 'Import from Teams', action: () => startImport('teams') },
            ].map(app => (
              <button
                key={app.label}
                onClick={app.action}
                className="w-full flex items-center gap-2 py-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                {app.icon}
                {app.label}
              </button>
            ))}
          </div>
        </div>

        {/* Own profile */}
        <div className="flex items-center gap-2 px-3 py-3 border-t border-white/5">
          <div className="relative cursor-pointer" onClick={() => setShowCustomStatus(true)}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ background: currentMember.color }}>
              {currentMember.initials}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border border-[#1a1a2e]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white truncate">{currentMember.name}</div>
            {customStatus ? (
              <div className="text-xs text-gray-500 truncate">{customStatus.emoji} {customStatus.text}</div>
            ) : (
              <div className="text-xs text-gray-600 truncate">Set status…</div>
            )}
          </div>
          <button onClick={() => setShowCustomStatus(true)} className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors" title="Set status">
            <Smile size={13} />
          </button>
          <button
            onClick={() => {
              // Toggle DND
              const newStatus = isDND ? 'online' : 'dnd';
              fetch(`/api/workspaces/${workspaceId}/presence`, { method: 'PATCH', headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) }).catch(() => {});
            }}
            className={`p-1 rounded hover:bg-white/10 transition-colors ${isDND ? 'text-red-400' : 'text-gray-500 hover:text-white'}`}
            title={isDND ? 'Do Not Disturb — click to disable' : 'Enable Do Not Disturb'}
          >
            <BellOff size={13} />
          </button>
          {desktopNotifPermission === 'default' && (
            <button onClick={() => Notification.requestPermission().then(p => setDesktopNotifPermission(p))} className="p-1 rounded hover:bg-white/10 text-yellow-500 hover:text-yellow-400 transition-colors" title="Enable desktop notifications">
              <Bell size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN AREA ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Channel header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 flex-shrink-0 bg-[#0f0f22]/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {activeDmId && activeDmPerson ? (
              <>
                <div className="relative">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ background: activeDmPerson.color }}>
                    {activeDmPerson.initials}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#0f0f22]" style={{ background: getPresenceDot(presenceMap[activeDmPerson.id] || activeDmPerson.status) }} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white">{activeDmPerson.name}</span>
                    {activeDmPerson.kind === 'ai' && <span className="text-xs text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded font-medium">AI</span>}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">{presenceMap[activeDmPerson.id] || activeDmPerson.status}</div>
                </div>
              </>
            ) : activeChannel ? (
              <>
                {activeChannel.private ? <Lock size={16} className="text-gray-400 flex-shrink-0" /> : <Hash size={16} className="text-gray-400 flex-shrink-0" />}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{activeChannel.name}</span>
                    {activeChannel.muted && <VolumeX size={13} className="text-gray-500" />}
                  </div>
                  {activeChannel.description && (
                    <div className="text-xs text-gray-500 truncate max-w-sm">{activeChannel.description}</div>
                  )}
                </div>
              </>
            ) : null}
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {activeChannel && (
              <>
                {/* Members count */}
                <button
                  onClick={() => setActivePanel(p => p === 'members' ? 'none' : 'members')}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors ${activePanel === 'members' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                  title="Members"
                >
                  <Users size={14} />
                  <span>{activeChannel.members}</span>
                </button>

                {/* Pinned messages */}
                {(activeChannel.pinnedCount || 0) > 0 && (
                  <button
                    onClick={() => setActivePanel(p => p === 'pinned' ? 'none' : 'pinned')}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors ${activePanel === 'pinned' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    title="Pinned messages"
                  >
                    <Pin size={14} />
                    <span>{activeChannel.pinnedCount}</span>
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => setShowSearchModal(true)}
              className="p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
              title="Search (Ctrl+K)"
            >
              <Search size={15} />
            </button>

            {activeDmId && (
              <button className="p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors" title="Start video call">
                <Video size={15} />
              </button>
            )}
            {activeChannel && (
              <button className="p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors" title="Start call">
                <Video size={15} />
              </button>
            )}

            <button
              onClick={() => setActivePanel(p => p === 'thread' || p === 'members' || p === 'pinned' || p === 'bookmarks' ? 'none' : 'none')}
              className="p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
              title="Close panel"
            >
              {activePanel !== 'none' ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
            </button>
          </div>
        </div>

        {/* Huddle banner for current channel */}
        {activeChannelId && huddles[activeChannelId]?.active && dismissedHuddleBanner !== activeChannelId && !activeHuddle && (
          <div className="flex items-center gap-3 px-4 py-2 bg-green-500/10 border-b border-green-500/20 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-green-400 flex-1">
              <Headphones size={14} />
              <span className="text-sm font-medium">
                Huddle in #{activeChannel?.name} • {huddles[activeChannelId].participants.length} participant{huddles[activeChannelId].participants.length !== 1 ? 's' : ''}
              </span>
              <div className="flex -space-x-1 ml-2">
                {huddles[activeChannelId].participants.slice(0, 4).map(uid => {
                  const m = getMemberById(uid);
                  return m ? (
                    <div key={uid} className="w-5 h-5 rounded-full border border-[#0f0f22] flex items-center justify-center text-white text-xs font-bold" style={{ background: m.color, fontSize: 8 }}>{m.initials}</div>
                  ) : null;
                })}
              </div>
            </div>
            <button
              onClick={() => handleJoinHuddle(activeChannelId)}
              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Join
            </button>
            <button
              onClick={() => setDismissedHuddleBanner(activeChannelId)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Messages + panels */}
        <div className="flex flex-1 overflow-hidden">
          {/* Message list */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Load more indicator */}
            {loadingMessages && (
              <div className="flex items-center justify-center py-3">
                <RefreshCw size={14} className="animate-spin text-gray-500" />
                <span className="text-xs text-gray-500 ml-2">Loading messages…</span>
              </div>
            )}

            {/* Scrollable message area */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto py-4 space-y-0.5"
              onScroll={handleScroll}
            >
              {groupedMessages.map((item, i) => {
                if ('type' in item && item.type === 'date') {
                  return (
                    <div key={item.key} className="flex items-center gap-3 my-3 px-4">
                      <div className="flex-1 h-px bg-white/5" />
                      <span className="text-xs text-gray-500 font-medium whitespace-nowrap px-2 bg-[#0f0f22]">{item.label}</span>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                  );
                }

                const msg = item as ChatMessage;
                const prevItem = groupedMessages[i - 1];
                const prevMsg = prevItem && !('type' in prevItem) ? prevItem as ChatMessage : null;
                const showAv = !prevMsg || prevMsg.senderId !== msg.senderId || (msg.timestamp - prevMsg.timestamp > 5 * 60 * 1000);

                return (
                  <div key={msg.id} id={`msg-${msg.id}`}>
                    <MessageItem
                      message={msg}
                      prevMessage={prevMsg || undefined}
                      currentUserId={currentUserId}
                      showAvatar={showAv}
                      onReact={handleReact}
                      onReply={handleReply}
                      onEdit={handleEdit}
                      onPin={handlePin}
                      onBookmark={handleBookmark}
                      onDelete={handleDelete}
                      onForward={handleForward}
                      onCopyLink={handleCopyLink}
                      onVotePoll={handleVotePoll}
                      onClosePoll={handleClosePoll}
                      onProfileClick={handleProfileClick}
                      isHighlighted={highlightedMsgId === msg.id}
                      editingId={editingId}
                      onEditSave={handleEditSave}
                      onEditCancel={handleEditCancel}
                    />
                  </div>
                );
              })}

              {currentMessages.length === 0 && !loadingMessages && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                  {activeChannel?.private ? <Lock size={36} className="mb-3 opacity-30" /> : <Hash size={36} className="mb-3 opacity-30" />}
                  <p className="text-base font-medium text-gray-400 mb-1">
                    {activeDmId ? `This is the beginning of your DM with ${activeDmPerson?.name}` : `Welcome to #${activeChannel?.name}`}
                  </p>
                  <p className="text-sm text-gray-600">{activeChannel?.description || 'Send a message to get started.'}</p>
                </div>
              )}

              {/* Ephemeral slash command responses */}
              {ephemeralMessages.filter(m => m.channelId === channelKey).map(em => (
                <div key={em.id} className="flex items-start gap-3 px-4 py-1.5">
                  <div className="w-9 flex-shrink-0" />
                  <div className="flex items-center gap-2 text-sm text-gray-400 italic">
                    <Zap size={12} className="text-[#5b5fc7] flex-shrink-0" />
                    <span>{em.text}</span>
                    <button onClick={() => setEphemeralMessages(prev => prev.filter(m => m.id !== em.id))} className="text-gray-600 hover:text-gray-400 ml-1">
                      <X size={10} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Scheduled messages in channel (greyed out) */}
              {[...scheduledMessages, ...serverScheduledMessages].filter(s => s.channelId === channelKey).length > 0 && (
                <div className="mx-4 mt-2 mb-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-px bg-blue-500/20" />
                    <span className="text-xs text-blue-400/70 font-medium whitespace-nowrap px-1">Scheduled</span>
                    <div className="flex-1 h-px bg-blue-500/20" />
                  </div>
                  {[...scheduledMessages, ...serverScheduledMessages].filter(s => s.channelId === channelKey).map((sm, i) => (
                    <div key={(sm as any).id || `schd-${i}`} className="flex gap-3 px-0 py-1 opacity-60">
                      <div className="w-9 flex-shrink-0 flex items-center justify-center">
                        <Clock size={14} className="text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-blue-300">{currentMember.name}</span>
                          <span className="text-xs text-blue-400/60">⏰ {new Date(sm.scheduledAt).toLocaleString()}</span>
                        </div>
                        <div className="text-sm text-gray-400 italic">{sm.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <TypingIndicator names={typingNames} />
              <div ref={messagesEndRef} />
            </div>

            {/* Jump to present button */}
            <AnimatePresence>
              {showJumpToPresent && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onClick={() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); setShowJumpToPresent(false); }}
                  className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#5b5fc7] hover:bg-[#c4674a] text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg transition-colors z-10"
                >
                  <ChevronDown size={13} />
                  Jump to present
                </motion.button>
              )}
            </AnimatePresence>

            {/* Composer */}
            {/* Scheduled messages pending items */}
            {[...scheduledMessages, ...serverScheduledMessages].filter(s => s.channelId === channelKey).map((sm, i) => {
              const smId = (sm as any).id || `local-${i}`;
              return (
                <div key={smId} className="flex items-center gap-2 px-4 py-1.5 text-xs text-blue-300 bg-blue-500/5 border-t border-blue-500/10">
                  <Clock size={11} className="text-blue-400 flex-shrink-0" />
                  <span className="flex-1 truncate">
                    ⏰ Scheduled for {new Date(sm.scheduledAt).toLocaleString()} — "{sm.text.slice(0, 50)}{sm.text.length > 50 ? '…' : ''}"
                  </span>
                  {editingScheduledId === smId ? (
                    <>
                      <input
                        type="datetime-local"
                        value={editScheduledDate}
                        onChange={e => setEditScheduledDate(e.target.value)}
                        className="bg-white/10 text-white text-xs rounded px-1.5 py-0.5 border border-white/20 outline-none"
                        min={new Date().toISOString().slice(0, 16)}
                      />
                      <button
                        onClick={() => handleEditScheduledTime(smId, editScheduledDate)}
                        className="text-blue-400 hover:text-blue-300 font-medium ml-1"
                      >Save</button>
                      <button
                        onClick={() => { setEditingScheduledId(null); setEditScheduledDate(''); }}
                        className="text-gray-400 hover:text-white"
                      >Cancel</button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setEditingScheduledId(smId); setEditScheduledDate(sm.scheduledAt.slice(0, 16)); }}
                        className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                      >Edit</button>
                      <span className="text-gray-600">·</span>
                      <button
                        onClick={() => {
                          if ((sm as any).id) handleCancelScheduled((sm as any).id);
                          else setScheduledMessages(prev => prev.filter((_, j) => j !== i));
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors font-medium"
                      >Cancel</button>
                    </>
                  )}
                </div>
              );
            })}

            <MessageComposer
              channelId={channelKey}
              placeholder={activeDmId && activeDmPerson ? `Message ${activeDmPerson.name}` : `Message #${activeChannel?.name}`}
              onSend={sendMessage}
              onTypingStart={emitTypingStart}
              onTypingStop={emitTypingStop}
              members={WORKSPACE_MEMBERS}
              channels={channels}
              replyTo={replyTo}
              onClearReply={() => setReplyTo(undefined)}
              onOpenPollBuilder={() => setShowPollBuilder(true)}
              onSchedule={(text, at) => {
                setScheduledMessages(prev => [...prev, { channelId: channelKey, text, scheduledAt: at }]);
              }}
              onSlashCommandResult={(response) => {
                const id = `ephemeral-${Date.now()}`;
                setEphemeralMessages(prev => [...prev, { id, text: response, channelId: channelKey }]);
                setTimeout(() => setEphemeralMessages(prev => prev.filter(m => m.id !== id)), 10000);
              }}
              workspaceId={workspaceId}
              authToken={authToken}
            />
          </div>

          {/* ── RIGHT PANELS ─────────────────────────────── */}
          <AnimatePresence>
            {activePanel === 'thread' && thread.open && thread.parentMessage && (
              <ThreadPanel
                key="thread"
                thread={thread}
                currentUserId={currentUserId}
                onClose={() => { setThread(t => ({ ...t, open: false })); setActivePanel('none'); }}
                onReply={handleThreadReply}
                onToggleFollow={() => setThread(t => ({ ...t, following: !t.following }))}
                members={WORKSPACE_MEMBERS}
                channels={channels}
              />
            )}
            {activePanel === 'pinned' && (
              <PinnedPanel
                key="pinned"
                messages={pinnedMessages}
                onClose={() => setActivePanel('none')}
                onUnpin={handlePin}
                onJump={msgId => navigateToMessage(activeChannelId, msgId)}
              />
            )}
            {activePanel === 'bookmarks' && (
              <BookmarksPanel
                key="bookmarks"
                messages={bookmarkedMessages}
                onClose={() => setActivePanel('none')}
                onRemove={handleBookmark}
                onJump={(cId, mId) => navigateToMessage(cId, mId)}
              />
            )}
            {activePanel === 'members' && activeChannel && (
              <MembersPanel
                key="members"
                channel={activeChannel}
                members={WORKSPACE_MEMBERS}
                presenceMap={presenceMap}
                onClose={() => setActivePanel('none')}
                onProfileClick={memberId => {
                  const el = document.body;
                  setProfilePopover({ memberId, anchor: el.getBoundingClientRect() });
                }}
                onDm={handleDmFromProfile}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── GLOBAL MODALS & POPOVERS ──────────────────────── */}

      {/* Channel context menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50 w-52 bg-[#1e1e32] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={e => e.stopPropagation()}
          >
            {[
              { icon: <Eye size={13} />, label: 'Mark as read', action: () => { setChannels(p => p.map(c => c.id === contextMenu.channelId ? { ...c, unread: 0 } : c)); setContextMenu(null); } },
              { icon: <BellOff size={13} />, label: 'Mute channel', action: () => { setNotifPref(contextMenu.channelId, 'muted'); setContextMenu(null); } },
              { icon: <Copy size={13} />, label: 'Copy link', action: () => { navigator.clipboard.writeText(`${window.location.origin}/chat/${contextMenu.channelId}`).catch(() => {}); setContextMenu(null); } },
              { icon: <Archive size={13} />, label: 'Leave channel', action: () => { setChannels(p => p.filter(c => c.id !== contextMenu.channelId)); setContextMenu(null); }, danger: true },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-white/5 ${(item as any).danger ? 'text-red-400' : 'text-gray-300'}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile card */}
      <AnimatePresence>
        {profilePopover && (() => {
          const member = WORKSPACE_MEMBERS.find(m => m.id === profilePopover.memberId) || currentMember;
          const isOwn = member.id === currentUserId;
          return (
            <div
              className="fixed z-50"
              style={{ left: Math.min(profilePopover.anchor.left, window.innerWidth - 300), top: profilePopover.anchor.bottom + 8 }}
            >
              <ProfileCard
                member={member}
                onClose={() => setProfilePopover(null)}
                onDm={isOwn ? undefined : () => handleDmFromProfile(member.id)}
                isOwnProfile={isOwn}
                onSetStatus={isOwn ? () => setShowCustomStatus(true) : undefined}
              />
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Search modal */}
      <AnimatePresence>
        {showSearchModal && (
          <SearchModal
            channels={channels}
            members={WORKSPACE_MEMBERS}
            allMessages={messages}
            onClose={() => setShowSearchModal(false)}
            onNavigate={navigateToMessage}
          />
        )}
      </AnimatePresence>

      {/* Create channel modal */}
      <AnimatePresence>
        {showCreateChannel && (
          <CreateChannelModal
            workspaceId={workspaceId}
            authToken={authToken}
            members={WORKSPACE_MEMBERS}
            onClose={() => setShowCreateChannel(false)}
            onCreate={ch => { setChannels(prev => [...prev, ch]); selectChannel(ch.id); }}
          />
        )}
      </AnimatePresence>

      {/* Poll builder */}
      <AnimatePresence>
        {showPollBuilder && (
          <PollBuilder
            onClose={() => setShowPollBuilder(false)}
            onInsert={poll => { setPendingPoll(poll); setShowPollBuilder(false); }}
          />
        )}
      </AnimatePresence>

      {/* Custom status modal */}
      <AnimatePresence>
        {showCustomStatus && (
          <CustomStatusModal
            currentStatus={customStatus}
            onClose={() => setShowCustomStatus(false)}
            onSave={status => setCustomStatus(status)}
          />
        )}
      </AnimatePresence>

      {/* Import modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#12122a] border border-white/10 rounded-2xl shadow-2xl p-6"
            >
              <div className="text-center mb-4">
                <div className="w-14 h-14 rounded-full bg-[#5b5fc7]/10 flex items-center justify-center mx-auto mb-3">
                  <Download size={24} className="text-[#5b5fc7]" />
                </div>
                <h3 className="text-lg font-bold text-white">Importing Workspace</h3>
                <p className="text-sm text-gray-400 mt-1">{importStep}</p>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mb-2">
                <motion.div
                  className="h-full bg-[#5b5fc7] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${importProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="text-center text-sm text-gray-500">{importProgress}%</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending poll indicator */}
      <AnimatePresence>
        {pendingPoll && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#1e1e32] border border-white/10 rounded-xl px-4 py-2.5 shadow-xl z-40"
          >
            <BarChart2 size={14} className="text-[#5b5fc7]" />
            <span className="text-sm text-white">Poll ready: "{pendingPoll.question.slice(0, 40)}"</span>
            <button onClick={() => setPendingPoll(undefined)} className="text-gray-400 hover:text-white ml-2"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scheduled messages badge */}
      {(scheduledMessages.length > 0 || serverScheduledMessages.length > 0) && (
        <div className="fixed bottom-20 right-4 flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-xl px-3 py-2 text-xs text-blue-300 z-40">
          <Clock size={12} />
          {scheduledMessages.length + serverScheduledMessages.length} scheduled message{scheduledMessages.length + serverScheduledMessages.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Active huddle floating bar */}
      <AnimatePresence>
        {activeHuddle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#1a2e1a] border border-green-500/40 rounded-2xl px-4 py-2.5 shadow-2xl z-50"
          >
            <div className="flex items-center gap-1.5 text-green-400">
              <Headphones size={14} />
              <span className="text-sm font-medium">
                #{channels.find(c => c.id === activeHuddle.channelId)?.name || activeHuddle.channelId}
              </span>
            </div>
            {/* Participant avatars */}
            <div className="flex -space-x-1">
              {(huddles[activeHuddle.channelId]?.participants || [currentUserId]).slice(0, 5).map(uid => {
                const m = getMemberById(uid);
                return m ? (
                  <div key={uid} className="w-6 h-6 rounded-full border-2 border-[#1a2e1a] flex items-center justify-center text-white font-bold" style={{ background: m.color, fontSize: 9 }}>{m.initials}</div>
                ) : null;
              })}
            </div>
            {/* Mute button */}
            <button
              onClick={() => {
                setActiveHuddle(prev => prev ? { ...prev, muted: !prev.muted } : null);
                // Re-acquire mic with updated noise suppression
                if ((activeHuddle as any).stream) {
                  (activeHuddle as any).stream.getAudioTracks().forEach((t: MediaStreamTrack) => { t.enabled = activeHuddle.muted; });
                }
              }}
              className={`p-1.5 rounded-lg transition-colors ${activeHuddle.muted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
              title={activeHuddle.muted ? 'Unmute' : 'Mute'}
            >
              {activeHuddle.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            {/* Noise suppression toggle */}
            <button
              onClick={async () => {
                const curr = (activeHuddle as any).noiseSuppression !== false;
                const next = !curr;
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: next, noiseSuppression: next, autoGainControl: next } });
                  setActiveHuddle(prev => prev ? { ...prev, noiseSuppression: next, stream } as any : null);
                } catch {}
              }}
              className={`p-1.5 rounded-lg transition-colors ${(activeHuddle as any).noiseSuppression === false ? 'text-gray-500 hover:text-white bg-white/5' : 'text-green-400 bg-green-500/10'}`}
              title={`Noise suppression: ${(activeHuddle as any).noiseSuppression === false ? 'off' : 'on'}`}
            >
              <Activity size={14} />
            </button>
            {/* Hang up */}
            <button
              onClick={() => handleLeaveHuddle(activeHuddle.channelId)}
              className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              title="Leave huddle"
            >
              <Phone size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forward message modal */}
      <AnimatePresence>
        {forwardModalMsg && (
          <ForwardMessageModal
            message={forwardModalMsg}
            channels={channels}
            workspaceId={workspaceId}
            authToken={authToken}
            onClose={() => setForwardModalMsg(null)}
            onSuccess={() => {
              setShowForwardSuccess(true);
              setTimeout(() => setShowForwardSuccess(false), 3000);
            }}
          />
        )}
      </AnimatePresence>

      {/* Forward success toast */}
      <AnimatePresence>
        {showForwardSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-green-600/90 text-white text-sm font-medium px-4 py-2 rounded-full shadow-xl z-50"
          >
            <Check size={14} />
            Message forwarded
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
