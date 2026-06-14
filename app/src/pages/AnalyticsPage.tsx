/**
 * AnalyticsPage.tsx — BrixOS Analytics Dashboard
 * Comprehensive workspace analytics with CSS charts, user activity,
 * channel health, and a GitHub-style activity heatmap.
 */

import { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, MessageSquare, Users, Clock, Paperclip,
  ArrowUp, ArrowDown, ChevronUp, ChevronDown,
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const LAST_14_DAYS_MESSAGES = [
  { day: 'May 9', messages: 312, calls: 24 },
  { day: 'May 10', messages: 489, calls: 31 },
  { day: 'May 11', messages: 198, calls: 12 },
  { day: 'May 12', messages: 143, calls: 8 },
  { day: 'May 13', messages: 521, calls: 42 },
  { day: 'May 14', messages: 634, calls: 55 },
  { day: 'May 15', messages: 710, calls: 61 },
  { day: 'May 16', messages: 489, calls: 38 },
  { day: 'May 17', messages: 372, calls: 29 },
  { day: 'May 18', messages: 91, calls: 7 },
  { day: 'May 19', messages: 104, calls: 9 },
  { day: 'May 20', messages: 823, calls: 72 },
  { day: 'May 21', messages: 915, calls: 81 },
  { day: 'May 22', messages: 601, calls: 47 },
];

const TOP_CHANNELS = [
  { name: '#general', messages: 4821, color: '#D97757' },
  { name: '#engineering', messages: 3610, color: '#E8946F' },
  { name: '#product', messages: 2944, color: '#16a34a' },
  { name: '#random', messages: 1987, color: '#0891b2' },
  { name: '#design', messages: 1542, color: '#ec4899' },
  { name: '#marketing', messages: 1103, color: '#f59e0b' },
  { name: '#hr', messages: 724, color: '#8b5cf6' },
  { name: '#finance', messages: 481, color: '#94a3b8' },
];

const MOCK_USERS = [
  { id: 'u1', name: 'Alex Rivera', avatar: 'AR', color: '#D97757', messages: 1842, calls: 94, files: 37, lastActive: Date.now() - 12 * 60 * 1000 },
  { id: 'u2', name: 'Maya Chen', avatar: 'MC', color: '#0891b2', messages: 1534, calls: 78, files: 52, lastActive: Date.now() - 3 * 60 * 1000 },
  { id: 'u3', name: 'Jordan Kim', avatar: 'JK', color: '#16a34a', messages: 1201, calls: 61, files: 18, lastActive: Date.now() - 2 * 3600 * 1000 },
  { id: 'u4', name: 'Sam Torres', avatar: 'ST', color: '#c4314b', messages: 987, calls: 44, files: 29, lastActive: Date.now() - 6 * 3600 * 1000 },
  { id: 'u5', name: 'Riley Patel', avatar: 'RP', color: '#0891b2', messages: 876, calls: 39, files: 14, lastActive: Date.now() - 30 * 60 * 1000 },
  { id: 'u6', name: 'Casey Wong', avatar: 'CW', color: '#ec4899', messages: 743, calls: 28, files: 41, lastActive: Date.now() - 1 * 3600 * 1000 },
  { id: 'u7', name: 'Morgan Lee', avatar: 'ML', color: '#eab308', messages: 612, calls: 21, files: 9, lastActive: Date.now() - 15 * 3600 * 1000 },
  { id: 'u8', name: 'Drew Nakamura', avatar: 'DN', color: '#94a3b8', messages: 489, calls: 17, files: 6, lastActive: Date.now() - 2 * 86400 * 1000 },
  { id: 'u9', name: 'Quinn Garcia', avatar: 'QG', color: '#f97316', messages: 301, calls: 9, files: 3, lastActive: Date.now() - 3 * 86400 * 1000 },
  { id: 'u10', name: 'Avery Scott', avatar: 'AS', color: '#06b6d4', messages: 198, calls: 5, files: 2, lastActive: Date.now() - 7 * 86400 * 1000 },
];

const MOCK_CHANNELS = [
  { id: 'c1', name: '#general', members: 24, messages7d: 1842, trend: +18, lastActivity: Date.now() - 5 * 60 * 1000, status: 'active' as const },
  { id: 'c2', name: '#engineering', members: 12, messages7d: 1345, trend: +7, lastActivity: Date.now() - 22 * 60 * 1000, status: 'active' as const },
  { id: 'c3', name: '#product', members: 9, messages7d: 987, trend: -3, lastActivity: Date.now() - 2 * 3600 * 1000, status: 'active' as const },
  { id: 'c4', name: '#random', members: 24, messages7d: 734, trend: +2, lastActivity: Date.now() - 45 * 60 * 1000, status: 'active' as const },
  { id: 'c5', name: '#design', members: 7, messages7d: 421, trend: -12, lastActivity: Date.now() - 8 * 3600 * 1000, status: 'quiet' as const },
  { id: 'c6', name: '#marketing', members: 6, messages7d: 312, trend: +1, lastActivity: Date.now() - 4 * 3600 * 1000, status: 'quiet' as const },
  { id: 'c7', name: '#hr', members: 4, messages7d: 89, trend: -24, lastActivity: Date.now() - 2 * 86400 * 1000, status: 'quiet' as const },
  { id: 'c8', name: '#finance', members: 3, messages7d: 12, trend: -67, lastActivity: Date.now() - 5 * 86400 * 1000, status: 'inactive' as const },
];

// Activity heatmap: 7 days × 24 hours, values 0-4
function generateHeatmapData(): number[][] {
  const data: number[][] = [];
  for (let d = 0; d < 7; d++) {
    const row: number[] = [];
    for (let h = 0; h < 24; h++) {
      // Business hours (9-18) weekdays (0-4) tend to be more active
      const isBusinessHour = h >= 9 && h <= 18;
      const isWeekday = d < 5;
      const base = isBusinessHour && isWeekday ? 2 : 0;
      const noise = Math.floor(Math.random() * 3);
      row.push(Math.min(4, base + noise));
    }
    data.push(row);
  }
  return data;
}

const HEATMAP_DATA = generateHeatmapData();
const DAYS_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS_LABELS = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLastActive(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function heatmapColor(value: number): string {
  const colors = ['#e5e7eb', '#bfdbfe', '#60a5fa', '#2563eb', '#1e40af'];
  return colors[value] ?? colors[0];
}

type SortKey = 'name' | 'messages' | 'calls' | 'files' | 'lastActive';
type SortDir = 'asc' | 'desc';

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  trend,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  trend: 'up' | 'down';
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '20' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <div className="flex items-center gap-1 mt-0.5">
          {trend === 'up' ? (
            <TrendingUp size={12} className="text-green-500" />
          ) : (
            <TrendingDown size={12} className="text-red-400" />
          )}
          <span className={`text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>{sub}</span>
        </div>
      </div>
    </div>
  );
}

// ─── CSS Bar Chart ────────────────────────────────────────────────────────────

function BarChart({
  data,
  valueKey,
  labelKey,
  color,
  label,
}: {
  data: Record<string, any>[];
  valueKey: string;
  labelKey: string;
  color: string;
  label: string;
}) {
  const max = Math.max(...data.map(d => d[valueKey]));
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">{label}</h3>
      <div className="flex items-end gap-1 h-32">
        {data.map((d, i) => {
          const pct = max > 0 ? (d[valueKey] / max) * 100 : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative" title={`${d[labelKey]}: ${d[valueKey]}`}>
              <div className="w-full rounded-t transition-all" style={{ height: `${pct}%`, background: color, minHeight: 2 }} />
              {/* Tooltip on hover */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                {d[valueKey]}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[8px] text-gray-400 overflow-hidden" title={d[labelKey]}>
            {i % 2 === 0 ? d[labelKey].replace(/May /, '') : ''}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Horizontal Bar Chart ─────────────────────────────────────────────────────

function HorizontalBarChart({ data }: { data: typeof TOP_CHANNELS }) {
  const max = Math.max(...data.map(d => d.messages));
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Top Channels by Activity</h3>
      <div className="space-y-2.5">
        {data.map((ch, i) => {
          const pct = max > 0 ? (ch.messages / max) * 100 : 0;
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-gray-600 w-24 truncate font-medium">{ch.name}</span>
              <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden relative">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: ch.color }}
                />
              </div>
              <span className="text-xs text-gray-500 w-12 text-right">{ch.messages.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Activity Heatmap ─────────────────────────────────────────────────────────

function ActivityHeatmap() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">User Activity Heatmap (Last 7 Days)</h3>
      <div className="overflow-x-auto">
        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col justify-around pr-2" style={{ minWidth: 28 }}>
            {DAYS_LABELS.map(d => (
              <span key={d} className="text-[9px] text-gray-400 font-medium leading-none">{d}</span>
            ))}
          </div>
          {/* Hour columns */}
          <div className="flex flex-col gap-0.5 flex-1">
            {/* Hour labels */}
            <div className="flex gap-0.5 mb-1">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="flex-1 text-center" style={{ minWidth: 10 }}>
                  {i % 3 === 0 ? <span className="text-[8px] text-gray-400">{HOURS_LABELS[i / 3]}</span> : null}
                </div>
              ))}
            </div>
            {HEATMAP_DATA.map((row, dayIdx) => (
              <div key={dayIdx} className="flex gap-0.5">
                {row.map((val, hourIdx) => (
                  <div
                    key={hourIdx}
                    className="flex-1 rounded-sm"
                    style={{ height: 14, minWidth: 10, background: heatmapColor(val) }}
                    title={`${DAYS_LABELS[dayIdx]} ${hourIdx}:00 — activity level ${val}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 justify-end">
          <span className="text-[10px] text-gray-400">Less</span>
          {[0, 1, 2, 3, 4].map(v => (
            <div key={v} className="w-3 h-3 rounded-sm" style={{ background: heatmapColor(v) }} />
          ))}
          <span className="text-[10px] text-gray-400">More</span>
        </div>
      </div>
    </div>
  );
}

// ─── User Activity Table ───────────────────────────────────────────────────────

function UserActivityTable() {
  const [sortKey, setSortKey] = useState<SortKey>('messages');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = useMemo(() => {
    return [...MOCK_USERS].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal as string) : (aVal as number) - (bVal as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [sortKey, sortDir]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp size={10} className="text-gray-300" />;
    return sortDir === 'asc' ? <ChevronUp size={10} className="text-orange-500" /> : <ChevronDown size={10} className="text-orange-500" />;
  };

  const ColHeader = ({ label, col, right = false }: { label: string; col: SortKey; right?: boolean }) => (
    <th
      className={`px-4 py-3 text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700 select-none ${right ? 'text-right' : 'text-left'}`}
      onClick={() => handleSort(col)}
    >
      <span className="flex items-center gap-1" style={{ justifyContent: right ? 'flex-end' : 'flex-start' }}>
        {label}<SortIcon col={col} />
      </span>
    </th>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">User Activity</h3>
        <p className="text-xs text-gray-500 mt-0.5">This month</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <ColHeader label="User" col="name" />
              <ColHeader label="Messages Sent" col="messages" right />
              <ColHeader label="Calls Joined" col="calls" right />
              <ColHeader label="Files Shared" col="files" right />
              <ColHeader label="Last Active" col="lastActive" right />
            </tr>
          </thead>
          <tbody>
            {sorted.map((u, i) => (
              <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                      style={{ background: u.color }}
                    >
                      {u.avatar}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-700 font-mono">{u.messages.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-sm text-gray-700 font-mono">{u.calls}</td>
                <td className="px-4 py-3 text-right text-sm text-gray-700 font-mono">{u.files}</td>
                <td className="px-4 py-3 text-right text-xs text-gray-500">{formatLastActive(u.lastActive)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Channel Health Table ─────────────────────────────────────────────────────

function ChannelHealthTable() {
  const statusDot = {
    active: { color: '#16a34a', label: 'Active' },
    quiet: { color: '#eab308', label: 'Quiet' },
    inactive: { color: '#c4314b', label: 'Inactive' },
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">Channel Health</h3>
        <p className="text-xs text-gray-500 mt-0.5">Last 7 days</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-left">Channel</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-right">Members</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-right">Messages (7d)</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-right">Trend</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-right">Last Activity</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_CHANNELS.map(ch => {
              const s = statusDot[ch.status];
              return (
                <tr key={ch.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{ch.name}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">{ch.members}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700 font-mono">{ch.messages7d.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${ch.trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {ch.trend >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                      {Math.abs(ch.trend)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-gray-500">{formatLastActive(ch.lastActivity)}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: s.color + '18', color: s.color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      {s.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════

export default function AnalyticsPage() {
  const totalMessages = LAST_14_DAYS_MESSAGES.reduce((s, d) => s + d.messages, 0);
  const prevHalfMessages = LAST_14_DAYS_MESSAGES.slice(0, 7).reduce((s, d) => s + d.messages, 0);
  const recentHalfMessages = LAST_14_DAYS_MESSAGES.slice(7).reduce((s, d) => s + d.messages, 0);
  const msgTrend = recentHalfMessages >= prevHalfMessages ? 'up' : 'down';
  const msgTrendPct = prevHalfMessages > 0 ? Math.abs(Math.round(((recentHalfMessages - prevHalfMessages) / prevHalfMessages) * 100)) : 0;

  const totalCallMinutes = LAST_14_DAYS_MESSAGES.reduce((s, d) => s + d.calls * 18, 0); // ~18 min avg

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#f5f5f3', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-8 py-4 border-b border-gray-200 bg-[#f5f5f3] flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Workspace activity overview — June 2026</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <Clock size={13} />
          <span>Last updated: just now</span>
        </div>
      </div>

      <div className="px-8 py-6 max-w-7xl mx-auto space-y-6">
        {/* Top Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            icon={<MessageSquare size={18} />}
            label="Total Messages (14d)"
            value={totalMessages.toLocaleString()}
            sub={`${msgTrendPct}% vs prev week`}
            trend={msgTrend}
            color="#D97757"
          />
          <StatCard
            icon={<Users size={18} />}
            label="Active Users (DAU/MAU)"
            value="8 / 10"
            sub="80% engagement rate"
            trend="up"
            color="#D97757"
          />
          <StatCard
            icon={<Clock size={18} />}
            label="Total Call Minutes"
            value={`${(totalCallMinutes / 60).toFixed(0)}h`}
            sub="+12% vs last month"
            trend="up"
            color="#16a34a"
          />
          <StatCard
            icon={<Paperclip size={18} />}
            label="Files Shared"
            value="211"
            sub="-4% vs last month"
            trend="down"
            color="#0891b2"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-4">
          <BarChart
            data={LAST_14_DAYS_MESSAGES}
            valueKey="messages"
            labelKey="day"
            color="#D97757"
            label="Messages per Day (Last 14 Days)"
          />
          <HorizontalBarChart data={TOP_CHANNELS} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <BarChart
            data={LAST_14_DAYS_MESSAGES}
            valueKey="calls"
            labelKey="day"
            color="#D97757"
            label="Call Minutes by Day (Last 14 Days)"
          />
          <ActivityHeatmap />
        </div>

        {/* Tables */}
        <UserActivityTable />
        <ChannelHealthTable />
      </div>
    </div>
  );
}
