import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { employees, meetings } from '@/data/mockData';
import { Avatar } from '@/components/shared/Avatar';
import { Card } from '@/components/shared/Card';
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  isToday,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  X,
  Video,
  Repeat,
  Search,
  Trash2,
  Edit2,
  Check,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { confirmAction, showToast, escapeHtml } from '@/utils/helpers';

type CalendarView = 'day' | 'week' | 'month' | 'agenda';
type MeetingType = (typeof meetings)[number];

const HOUR_START = 0;
const HOUR_END = 23;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

const MEETING_COLORS: Record<string, { bg: string; border: string }> = {
  standup: { bg: '#e8eaf6', border: '#D97757' },
  '1:1': { bg: '#dbeafe', border: '#3b82f6' },
  planning: { bg: '#fef3c7', border: '#f59e0b' },
  retro: { bg: '#fce7f3', border: '#ec4899' },
  review: { bg: '#d1fae5', border: '#10b981' },
  sync: { bg: '#f3f4f6', border: '#6b7280' },
};

const TEMPLATES = [
  { id: '1:1', label: '1:1 Meeting', duration: 30 },
  { id: 'standup', label: 'Daily Standup', duration: 15 },
  { id: 'planning', label: 'Sprint Planning', duration: 60 },
  { id: 'review', label: 'Sprint Review', duration: 60 },
  { id: 'retro', label: 'Retrospective', duration: 60 },
  { id: 'sync', label: 'Team Sync', duration: 30 },
];

/* ─── helpers ─── */
function getEmployee(id: string) {
  return employees.find((e) => e.id === id);
}

function parseDate(d: string) {
  try {
    const parsed = parseISO(d);
    if (isNaN(parsed.getTime())) return new Date(d);
    return parsed;
  } catch {
    return new Date(d);
  }
}

function meetingOverlapsDay(mtg: typeof meetings[0], day: Date) {
  const start = parseDate(mtg.startTime);
  const end = parseDate(mtg.endTime);
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0);
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);
  return start <= dayEnd && end >= dayStart;
}

/* Generate recurring meeting instances for a date range */
function generateMeetingInstances(meetingsList: MeetingType[], day: Date): MeetingType[] {
  const instances: MeetingType[] = [];
  meetingsList.forEach((mtg) => {
    if (meetingOverlapsDay(mtg, day)) {
      instances.push(mtg);
    }
    // Generate recurring instances (weekly repeat)
    if (mtg.recurring) {
      const mtgStart = parseDate(mtg.startTime);
      const dayOfWeek = mtgStart.getDay();
      if (day.getDay() === dayOfWeek && !isSameDay(day, mtgStart)) {
        const startH = mtgStart.getHours();
        const startM = mtgStart.getMinutes();
        const endDt = parseDate(mtg.endTime);
        const endH = endDt.getHours();
        const endM = endDt.getMinutes();
        const instanceStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), startH, startM);
        const instanceEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), endH, endM);
        instances.push({
          ...mtg,
          id: `${mtg.id}-recurring-${format(day, 'yyyy-MM-dd')}`,
          startTime: instanceStart.toISOString(),
          endTime: instanceEnd.toISOString(),
        });
      }
    }
  });
  return instances;
}

/* ═══════════════════════════════════════════
   CalendarPage
   ═══════════════════════════════════════════ */
function loadSavedMeetings() {
  try {
    const saved = localStorage.getItem('brixos-meetings');
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}
function saveMeetingsToStorage(meetings: any[]) {
  localStorage.setItem('brixos-meetings', JSON.stringify(meetings));
}

export default function CalendarPage() {  useEffect(() => { document.title = "Calendar" + " - BrixOS"; }, []);
  const [view, setView] = useState<CalendarView>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [clickedSlot, setClickedSlot] = useState<{ date: Date; hour: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [localMeetings, setLocalMeetings] = useState<MeetingType[]>(() => loadSavedMeetings() || [...meetings]);
  const [isLoading, setIsLoading] = useState(false);
  const [dragEvent, setDragEvent] = useState<MeetingType | null>(null);

  const openRightRail = useStore((s) => s.openRightRail);
  const closeRightRail = useStore((s) => s.closeRightRail);

  // Persist meetings
  useEffect(() => {
    saveMeetingsToStorage(localMeetings);
  }, [localMeetings]);

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return undefined;
    // Handle recurring instance IDs: strip the -recurring-YYYY-MM-DD suffix
    const baseId = selectedEventId.replace(/-recurring-\d{4}-\d{2}-\d{2}$/, '');
    return localMeetings.find((m) => m.id === baseId);
  }, [selectedEventId, localMeetings]);

  const handleEventClick = useCallback((id: string) => {
    setSelectedEventId(id);
    setShowNewMeeting(false);
    setIsEditing(false);
    openRightRail();
  }, [openRightRail]);

  const handleSlotClick = useCallback((date: Date, hour: number) => {
    setClickedSlot({ date, hour });
    setShowNewMeeting(true);
    setIsEditing(false);
    setSelectedEventId(null);
    openRightRail();
  }, [openRightRail]);

  const closeDetail = useCallback(() => {
    setSelectedEventId(null);
    setShowNewMeeting(false);
    setIsEditing(false);
    closeRightRail();
  }, [closeRightRail]);

  const handleAddMeeting = useCallback((meeting: MeetingType) => {
    setLocalMeetings((prev) => {
      const next = [...prev, meeting];
      saveMeetingsToStorage(next);
      return next;
    });
    showToast('Meeting scheduled successfully', 'success');
    closeDetail();
  }, [closeDetail]);

  const handleEditMeeting = useCallback((updated: MeetingType) => {
    setLocalMeetings((prev) => prev.map((m) => m.id === updated.id ? updated : m));
    showToast('Meeting updated successfully', 'success');
    setIsEditing(false);
    setSelectedEventId(updated.id);
  }, []);

  const handleDeleteMeeting = useCallback((id: string) => {
    if (confirmAction('Are you sure you want to delete this meeting? This action cannot be undone.')) {
      // Strip recurring suffix to delete the base meeting
      const baseId = id.replace(/-recurring-\d{4}-\d{2}-\d{2}$/, '');
      setLocalMeetings((prev) => prev.filter((m) => m.id !== baseId));
      showToast('success');
      closeDetail();
    }
  }, [closeDetail]);

  const handleDragReschedule = useCallback((meetingId: string, newDate: Date, newHour: number) => {
    setLocalMeetings((prev) => prev.map((m) => {
      if (m.id !== meetingId) return m;
      const oldStart = parseDate(m.startTime);
      const oldEnd = parseDate(m.endTime);
      const durationMs = oldEnd.getTime() - oldStart.getTime();
      const newStart = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), newHour, oldStart.getMinutes());
      const newEnd = new Date(newStart.getTime() + durationMs);
      return {
        ...m,
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString(),
      };
    }));
    showToast('Meeting rescheduled', 'success');
  }, []);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const goToday = () => {
    setIsLoading(true);
    setCurrentDate(new Date());
    setTimeout(() => setIsLoading(false), 300);
  };
  const goPrev = () => {
    setIsLoading(true);
    if (view === 'day') setCurrentDate((d) => addDays(d, -1));
    else if (view === 'week') setCurrentDate((d) => addDays(d, -7));
    else if (view === 'month') setCurrentDate((d) => subMonths(d, 1));
    else setCurrentDate((d) => addDays(d, -7));
    setTimeout(() => setIsLoading(false), 300);
  };
  const goNext = () => {
    setIsLoading(true);
    if (view === 'day') setCurrentDate((d) => addDays(d, 1));
    else if (view === 'week') setCurrentDate((d) => addDays(d, 7));
    else if (view === 'month') setCurrentDate((d) => addMonths(d, 1));
    else setCurrentDate((d) => addDays(d, 7));
    setTimeout(() => setIsLoading(false), 300);
  };

  const headerDate = useMemo(() => {
    if (view === 'day') return format(currentDate, 'EEEE, MMMM d, yyyy');
    if (view === 'week') {
      const s = startOfWeek(currentDate, { weekStartsOn: 1 });
      const e = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`;
    }
    if (view === 'month') return format(currentDate, 'MMMM yyyy');
    return `${format(currentDate, 'MMM d')} onwards`;
  }, [view, currentDate]);

  const filteredMeetings = useMemo(() => {
    if (!searchQuery) return localMeetings;
    const q = searchQuery.toLowerCase();
    return localMeetings.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q)
    );
  }, [searchQuery, localMeetings]);

  return (
    <div className="flex h-full flex-col">
      {/* ── Toolbar ── */}
      <div
        className="flex flex-shrink-0 items-center justify-between"
        style={{
          height: 48,
          padding: '0 16px',
          borderBottom: '1px solid #e1e1e1',
        }}
        role="toolbar"
        aria-label="Calendar navigation"
      >
        {/* Left: nav */}
        <div className="flex items-center gap-2">
          <h1 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginRight: 8 }}>Calendar</h1>
          <button
            onClick={goToday}
            className="cursor-pointer rounded"
            style={{
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 500,
              border: '1px solid #d1d1d1',
              background: '#fff',
              color: '#242424',
            }}
            aria-label="Go to today"
          >
            Today
          </button>
          <button
            onClick={goPrev}
            className="cursor-pointer rounded p-1 hover:bg-[#f0f0f0]"
            aria-label="Previous period"
          >
            <ChevronLeft size={16} color="#616161" />
          </button>
          <button
            onClick={goNext}
            className="cursor-pointer rounded p-1 hover:bg-[#f0f0f0]"
            aria-label="Next period"
          >
            <ChevronRight size={16} color="#616161" />
          </button>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#242424', marginLeft: 8 }}>
            {headerDate}
          </span>
        </div>

        {/* Center: view switcher */}
        <div className="flex items-center rounded" style={{ backgroundColor: '#f0f0f0', padding: 2 }} role="tablist" aria-label="Calendar view">
          {(['day', 'week', 'month', 'agenda'] as CalendarView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              role="tab"
              aria-selected={view === v}
              aria-label={`${v} view`}
              className="cursor-pointer"
              style={{
                padding: '3px 12px',
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 4,
                border: 'none',
                background: view === v ? '#ffffff' : 'transparent',
                color: view === v ? '#242424' : '#616161',
                boxShadow: view === v ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                textTransform: 'capitalize',
              }}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Right: new meeting + search */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1 rounded"
            style={{
              height: 30,
              border: '1px solid #d1d1d1',
              padding: '0 8px',
              background: '#fff',
            }}
          >
            <Search size={13} color="#a0a0a0" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search events and meetings..."
              aria-label="Search calendar events"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none"
              style={{ fontSize: 12, width: 120 }}
            />
          </div>
          <button
            onClick={() => {
              setShowNewMeeting(true);
              setIsEditing(false);
              setSelectedEventId(null);
              openRightRail();
            }}
            className="flex cursor-pointer items-center gap-1 rounded"
            style={{
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 500,
              background: '#D97757',
              color: '#fff',
              border: 'none',
            }}
            aria-label="Create new meeting"
          >
            <Plus size={14} aria-hidden="true" />
            New Meeting
          </button>
        </div>
      </div>

      {/* ── Loading State ── */}
      {isLoading && (
        <div className="flex items-center justify-center" style={{ height: 3, background: '#e8eaf6' }}>
          <div className="h-full animate-pulse" style={{ width: '40%', background: '#D97757' }} />
        </div>
      )}

      {/* ── Main Calendar Area ── */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          {view === 'day' && (
            <DayView
              date={currentDate}
              meetings={filteredMeetings}
              onEventClick={handleEventClick}
              onSlotClick={handleSlotClick}
              onDragReschedule={handleDragReschedule}
              dragEvent={dragEvent}
              setDragEvent={setDragEvent}
            />
          )}
          {view === 'week' && (
            <WeekView
              days={weekDays}
              meetings={filteredMeetings}
              onEventClick={handleEventClick}
              onSlotClick={handleSlotClick}
              onDragReschedule={handleDragReschedule}
              dragEvent={dragEvent}
              setDragEvent={setDragEvent}
            />
          )}
          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              meetings={filteredMeetings}
              onEventClick={handleEventClick}
              onDayClick={(d) => {
                setCurrentDate(d);
                setView('day');
              }}
            />
          )}
          {view === 'agenda' && (
            <AgendaView meetings={filteredMeetings} onEventClick={handleEventClick} />
          )}
        </div>

        {/* ── Right Rail: Event Detail / New Meeting / Edit ── */}
        {(selectedEvent || showNewMeeting || isEditing) && (
          <EventDetailRail
            event={selectedEvent}
            isNewMeeting={showNewMeeting}
            isEditing={isEditing}
            onClose={closeDetail}
            clickedSlot={clickedSlot}
            onAdd={handleAddMeeting}
            onEdit={handleEditMeeting}
            onDelete={handleDeleteMeeting}
            onStartEdit={() => setIsEditing(true)}
          />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   WeekView
   ═══════════════════════════════════════════ */
function WeekView({
  days,
  meetings,
  onEventClick,
  onSlotClick,
  onDragReschedule,
  dragEvent,
  setDragEvent,
}: {
  days: Date[];
  meetings: MeetingType[];
  onEventClick: (id: string) => void;
  onSlotClick: (date: Date, hour: number) => void;
  onDragReschedule: (meetingId: string, newDate: Date, newHour: number) => void;
  dragEvent: MeetingType | null;
  setDragEvent: (m: MeetingType | null) => void;
}) {
  return (
    <div className="flex flex-col" style={{ minWidth: 700 }}>
      {/* Day headers */}
      <div className="flex" style={{ borderBottom: '1px solid #e1e1e1' }}>
        <div style={{ width: 60, flexShrink: 0 }} />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="flex flex-1 flex-col items-center justify-center"
            style={{
              padding: '6px 0',
              borderLeft: '1px solid #e1e1e1',
              background: isToday(day) ? '#f8f7ff' : undefined,
            }}
            role="columnheader"
            aria-label={format(day, 'EEEE MMMM do yyyy')}
          >
            <span
              style={{
                fontSize: 11,
                color: isToday(day) ? '#D97757' : '#616161',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              {format(day, 'EEE')}
            </span>
            <div
              className="flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: isToday(day) ? '#D97757' : 'transparent',
                color: isToday(day) ? '#fff' : '#242424',
                fontSize: 14,
                fontWeight: 600,
                marginTop: 2,
              }}
              aria-label={isToday(day) ? 'Today' : undefined}
            >
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="relative flex flex-1 overflow-auto">
        {/* Time labels */}
        <div style={{ width: 60, flexShrink: 0 }}>
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="text-right"
              style={{
                height: 60,
                paddingRight: 8,
                fontSize: 11,
                color: '#767676',
                lineHeight: '12px',
              }}
            >
              {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`}
            </div>
          ))}
        </div>

        {/* Columns */}
        {days.map((day) => {
          const dayMtgs = generateMeetingInstances(meetings, day);
          return (
            <div
              key={day.toISOString()}
              className="relative flex-1"
              style={{
                borderLeft: '1px solid #e1e1e1',
                minWidth: 0,
                background: isToday(day) ? '#fafaff' : undefined,
              }}
              role="gridcell"
              aria-label={format(day, 'EEEE MMMM do')}
            >
              {/* Hour lines */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  onClick={() => onSlotClick(day, hour)}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.background = '#e8eaf6'; }}
                  onDragLeave={(e) => { e.currentTarget.style.background = ''; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.background = '';
                    if (dragEvent) {
                      onDragReschedule(dragEvent.id, day, hour);
                      setDragEvent(null);
                    }
                  }}
                  className="cursor-pointer"
                  style={{
                    height: 60,
                    borderBottom: '1px solid #f0f0f0',
                  }}
                  aria-label={`${hour}:00 slot`}
                />
              ))}

              {/* Current time indicator */}
              {isToday(day) && <CurrentTimeLine />}

              {/* Events */}
              {dayMtgs.map((mtg) => (
                <WeekEventBlock
                  key={mtg.id}
                  meeting={mtg}
                  day={day}
                  onClick={() => onEventClick(mtg.id)}
                  onDragStart={() => setDragEvent(mtg)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   DayView
   ═══════════════════════════════════════════ */
function DayView({
  date,
  meetings,
  onEventClick,
  onSlotClick,
  onDragReschedule,
  dragEvent,
  setDragEvent,
}: {
  date: Date;
  meetings: MeetingType[];
  onEventClick: (id: string) => void;
  onSlotClick: (date: Date, hour: number) => void;
  onDragReschedule: (meetingId: string, newDate: Date, newHour: number) => void;
  dragEvent: MeetingType | null;
  setDragEvent: (m: MeetingType | null) => void;
}) {
  const dayMtgs = generateMeetingInstances(meetings, date);

  return (
    <div className="flex" style={{ minWidth: 500 }}>
      {/* Time labels */}
      <div style={{ width: 60, flexShrink: 0 }}>
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="text-right"
            style={{
              height: 60,
              paddingRight: 8,
              fontSize: 11,
              color: '#767676',
              borderBottom: '1px solid #f0f0f0',
              lineHeight: '12px',
            }}
          >
            {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`}
          </div>
        ))}
      </div>

      {/* Day column */}
      <div className="relative flex-1" style={{ borderLeft: '1px solid #e1e1e1' }}>
        {HOURS.map((hour) => (
          <div
            key={hour}
            onClick={() => onSlotClick(date, hour)}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.background = '#e8eaf6'; }}
            onDragLeave={(e) => { e.currentTarget.style.background = ''; }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.background = '';
              if (dragEvent) {
                onDragReschedule(dragEvent.id, date, hour);
                setDragEvent(null);
              }
            }}
            className="cursor-pointer"
            style={{
              height: 60,
              borderBottom: '1px solid #f0f0f0',
            }}
          />
        ))}

        {isToday(date) && <CurrentTimeLine />}

        {dayMtgs.map((mtg) => (
          <DayEventBlock key={mtg.id} meeting={mtg} onClick={() => onEventClick(mtg.id)} onDragStart={() => setDragEvent(mtg)} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MonthView
   ═══════════════════════════════════════════ */
function MonthView({
  currentDate,
  meetings,
  onEventClick,
  onDayClick,
}: {
  currentDate: Date;
  meetings: MeetingType[];
  onEventClick: (id: string) => void;
  onDayClick: (d: Date) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="flex h-full flex-col" style={{ padding: '8px 12px' }}>
      {/* Day label headers */}
      <div className="grid grid-cols-7" style={{ marginBottom: 4 }}>
        {dayLabels.map((d) => (
          <div
            key={d}
            className="text-center"
            style={{ fontSize: 11, fontWeight: 600, color: '#616161', padding: '4px 0' }}
            role="columnheader"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid flex-1 grid-cols-7" role="grid">
        {days.map((day) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const dayMtgs = generateMeetingInstances(meetings, day);

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className="cursor-pointer"
              style={{
                border: '1px solid #e1e1e1',
                borderWidth: '0 1px 1px 0',
                padding: 4,
                minHeight: 80,
                background: isToday(day) ? '#f8f7ff' : '#fff',
                opacity: isCurrentMonth ? 1 : 0.4,
              }}
              role="gridcell"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDayClick(day); } }}
              aria-label={format(day, 'MMMM do yyyy')}
              aria-selected={isToday(day)}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: isToday(day) ? '#D97757' : 'transparent',
                  color: isToday(day) ? '#fff' : '#242424',
                  fontSize: 12,
                  fontWeight: 500,
                  marginBottom: 2,
                }}
              >
                {format(day, 'd')}
              </div>
              <div className="flex flex-col gap-0.5">
                {dayMtgs.slice(0, 3).map((mtg) => {
                  const c = MEETING_COLORS[mtg.meetingType] || MEETING_COLORS.sync;
                  return (
                    <div
                      key={mtg.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(mtg.id);
                      }}
                      className="cursor-pointer truncate rounded"
                      style={{
                        fontSize: 10,
                        padding: '1px 4px',
                        background: c.bg,
                        borderLeft: `2px solid ${c.border}`,
                        color: '#242424',
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEventClick(mtg.id); } }}
                      aria-label={`${mtg.title} meeting`}
                    >
                      {mtg.title}
                    </div>
                  );
                })}
                {dayMtgs.length > 3 && (
                  <span style={{ fontSize: 10, color: '#D97757', paddingLeft: 4 }}>
                    +{dayMtgs.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   AgendaView
   ═══════════════════════════════════════════ */
function AgendaView({
  meetings: mtgs,
  onEventClick,
}: {
  meetings: MeetingType[];
  onEventClick: (id: string) => void;
}) {
  const sorted = useMemo(() => {
    return [...mtgs].sort((a, b) => parseDate(a.startTime).getTime() - parseDate(b.startTime).getTime());
  }, [mtgs]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof meetings>();
    sorted.forEach((m) => {
      const key = format(parseDate(m.startTime), 'EEEE, MMMM d, yyyy');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return map;
  }, [sorted]);

  return (
    <div className="overflow-auto" style={{ padding: '16px 20px', maxWidth: 720 }} role="list">
      {Array.from(grouped.entries()).map(([dateLabel, dateMtgs]) => (
        <div key={dateLabel} style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 8 }}>
            {dateLabel}
          </h3>
          <div className="space-y-2">
            {dateMtgs.map((mtg) => {
              const start = parseDate(mtg.startTime);
              const end = parseDate(mtg.endTime);
              const durationMin = (end.getTime() - start.getTime()) / 60000;
              const colors = MEETING_COLORS[mtg.meetingType] || MEETING_COLORS.sync;
              return (
                <Card
                  key={mtg.id}
                  hoverable
                  onClick={() => onEventClick(mtg.id)}
                  className="cursor-pointer"
                  role="listitem"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEventClick(mtg.id); } }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex flex-col items-center justify-center rounded"
                      style={{
                        width: 56,
                        background: colors.bg,
                        padding: '6px 0',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: 16, fontWeight: 600, color: '#242424' }}>
                        {format(start, 'h:mm')}
                      </span>
                      <span style={{ fontSize: 10, color: '#616161' }}>{format(start, 'a')}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>
                          {mtg.title}
                        </span>
                        {mtg.recurring && (
                          <Repeat size={12} color="#a0a0a0" aria-label="Recurring meeting" />
                        )}
                      </div>
                      <div className="flex items-center gap-3" style={{ marginTop: 4 }}>
                        <span className="flex items-center gap-1" style={{ fontSize: 12, color: '#616161' }}>
                          <Clock size={12} aria-hidden="true" />
                          {durationMin} min
                        </span>
                        <span className="flex items-center gap-1" style={{ fontSize: 12, color: '#616161' }}>
                          <MapPin size={12} aria-hidden="true" />
                          {mtg.channel || 'Online'}
                        </span>
                        <span className="flex items-center gap-1" style={{ fontSize: 12, color: '#616161' }}>
                          <Users size={12} aria-hidden="true" />
                          {mtg.attendees.length}
                        </span>
                      </div>
                      <div className="flex items-center" style={{ marginTop: 6 }}>
                        <div className="flex -space-x-1.5">
                          {mtg.attendees.slice(0, 4).map((aid) => {
                            const emp = getEmployee(aid);
                            return emp ? (
                              <Avatar key={aid} src={emp.avatar} alt={emp.name} size="xs" isAi={emp.kind === 'ai'} />
                            ) : null;
                          })}
                        </div>
                        {mtg.attendees.length > 4 && (
                          <span style={{ fontSize: 10, color: '#767676', marginLeft: 4 }}>
                            +{mtg.attendees.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Event Blocks (positioned on grid)
   ═══════════════════════════════════════════ */
function WeekEventBlock({
  meeting,
  day,
  onClick,
  onDragStart,
}: {
  meeting: (typeof meetings)[0];
  day: Date;
  onClick: () => void;
  onDragStart: () => void;
}) {
  const start = parseDate(meeting.startTime);
  const end = parseDate(meeting.endTime);
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), HOUR_START, 0, 0);
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), HOUR_END, 59, 59);

  if (end < dayStart || start > dayEnd) return null;

  const effStart = start < dayStart ? dayStart : start;
  const effEnd = end > dayEnd ? dayEnd : end;

  const startMin = (effStart.getHours() - HOUR_START) * 60 + effStart.getMinutes();
  const durationMin = (effEnd.getTime() - effStart.getTime()) / 60000;
  const top = startMin;
  const height = Math.max(durationMin, 20);

  const colors = MEETING_COLORS[meeting.meetingType] || MEETING_COLORS.sync;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      draggable
      onDragStart={onDragStart}
      className="absolute cursor-pointer overflow-hidden rounded"
      style={{
        top: `${(top / 60) * 60 + 0}px`,
        height: `${(height / 60) * 60 - 2}px`,
        left: 2,
        right: 2,
        background: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
        padding: '3px 5px',
        zIndex: 2,
        fontSize: 11,
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      aria-label={`${meeting.title} from ${format(start, 'h:mm a')} to ${format(end, 'h:mm a')}`}
    >
      <div style={{ fontWeight: 600, color: '#242424', lineHeight: '14px' }} className="truncate">
        {meeting.title}
      </div>
      <div style={{ color: '#616161', fontSize: 10, lineHeight: '13px' }}>
        {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
      </div>
      <div className="flex -space-x-1" style={{ marginTop: 2 }}>
        {meeting.attendees.slice(0, 3).map((aid) => {
          const emp = getEmployee(aid);
          return emp ? (
            <Avatar key={aid} src={emp.avatar} alt={emp.name} size="xs" isAi={emp.kind === 'ai'} />
          ) : null;
        })}
      </div>
      {meeting.recurring && (
        <div className="absolute top-0.5 right-0.5">
          <Repeat size={9} color="#a0a0a0" aria-label="Recurring" />
        </div>
      )}
    </div>
  );
}

function DayEventBlock({
  meeting,
  onClick,
  onDragStart,
}: {
  meeting: (typeof meetings)[0];
  onClick: () => void;
  onDragStart: () => void;
}) {
  const start = parseDate(meeting.startTime);
  const end = parseDate(meeting.endTime);
  const startMin = Math.max(0, (start.getHours() - HOUR_START) * 60 + start.getMinutes());
  const durationMin = (end.getTime() - start.getTime()) / 60000;
  const top = startMin;
  const height = Math.max(durationMin, 24);

  const colors = MEETING_COLORS[meeting.meetingType] || MEETING_COLORS.sync;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      draggable
      onDragStart={onDragStart}
      className="absolute cursor-pointer overflow-hidden rounded"
      style={{
        top: `${(top / 60) * 60 + 0}px`,
        height: `${(height / 60) * 60 - 2}px`,
        left: 4,
        right: 4,
        background: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
        padding: '6px 10px',
        zIndex: 2,
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      aria-label={`${meeting.title} from ${format(start, 'h:mm a')} to ${format(end, 'h:mm a')}`}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: '#242424' }}>{meeting.title}</div>
      <div style={{ fontSize: 11, color: '#616161', marginTop: 2 }}>
        {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
      </div>
      <div style={{ fontSize: 11, color: '#616161', marginTop: 2 }}>
        {meeting.description}
      </div>
      <div className="flex -space-x-1.5" style={{ marginTop: 4 }}>
        {meeting.attendees.map((aid) => {
          const emp = getEmployee(aid);
          return emp ? (
            <Avatar key={aid} src={emp.avatar} alt={emp.name} size="sm" isAi={emp.kind === 'ai'} />
          ) : null;
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   CurrentTimeLine
   ═══════════════════════════════════════════ */
function CurrentTimeLine() {
  const [now, setNow] = useState(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const n = new Date();
      setNow(n.getHours() * 60 + n.getMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (now < HOUR_START * 60 || now > HOUR_END * 60 + 59) return null;

  const top = (now - HOUR_START * 60);

  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-10"
      style={{ top: `${(top / 60) * 60}px` }}
      role="separator"
      aria-label="Current time"
    >
      <div className="flex items-center">
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c4314b', marginLeft: -3 }} />
        <div style={{ height: 1, background: '#c4314b', flex: 1 }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   EventDetailRail (right panel)
   ═══════════════════════════════════════════ */
function EventDetailRail({
  event,
  isNewMeeting,
  isEditing,
  onClose,
  clickedSlot,
  onAdd,
  onEdit,
  onDelete,
  onStartEdit,
}: {
  event?: (typeof meetings)[0];
  isNewMeeting: boolean;
  isEditing: boolean;
  onClose: () => void;
  clickedSlot: { date: Date; hour: number } | null;
  onAdd: (meeting: any) => void;
  onEdit: (meeting: any) => void;
  onDelete: (id: string) => void;
  onStartEdit: () => void;
}) {
  if (isNewMeeting || isEditing) {
    return (
      <MeetingForm
        event={isEditing ? event : undefined}
        onClose={onClose}
        clickedSlot={clickedSlot}
        onSchedule={onAdd}
        onEdit={onEdit}
      />
    );
  }

  if (!event) return null;

  const start = parseDate(event.startTime);
  const end = parseDate(event.endTime);
  const organizer = getEmployee(event.attendees[0]);

  return (
    <div
      className="flex flex-shrink-0 flex-col overflow-auto"
      style={{
        width: 340,
        borderLeft: '1px solid #e1e1e1',
        background: '#fff',
      }}
      role="complementary"
      aria-label="Event details"
    >
      {/* Header */}
      <div className="flex items-center justify-between" style={{ padding: '12px 16px', borderBottom: '1px solid #e1e1e1' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#242424' }}>Event Details</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onStartEdit}
            className="cursor-pointer rounded p-1 hover:bg-[#f0f0f0]"
            aria-label="Edit event"
            title="Edit"
          >
            <Edit2 size={14} color="#D97757" />
          </button>
          <button
            onClick={() => onDelete(event.id)}
            className="cursor-pointer rounded p-1 hover:bg-[#f0f0f0]"
            aria-label="Delete event"
            title="Delete"
          >
            <Trash2 size={14} color="#c4314b" />
          </button>
          <button
            onClick={onClose}
            className="cursor-pointer rounded p-1 hover:bg-[#f0f0f0]"
            aria-label="Close panel"
          >
            <X size={16} color="#616161" />
          </button>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* Title */}
        <h3 style={{ fontSize: 18, fontWeight: 600, color: '#242424', lineHeight: '24px' }}>
          {event.title}
        </h3>

        {/* Organizer */}
        {organizer && (
          <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
            <Avatar src={organizer.avatar} alt={organizer.name} size="sm" isAi={organizer.kind === 'ai'} />
            <div>
              <div style={{ fontSize: 13, color: '#242424' }}>
                {organizer.name} {organizer.kind === 'ai' ? '(AI)' : ''}
              </div>
              <div style={{ fontSize: 11, color: '#616161' }}>Organizer</div>
            </div>
          </div>
        )}

        {/* Date & Time */}
        <div className="flex items-start gap-2" style={{ marginTop: 16 }}>
          <Clock size={16} color="#616161" style={{ marginTop: 2, flexShrink: 0 }} aria-hidden="true" />
          <div>
            <div style={{ fontSize: 13, color: '#242424' }}>
              {format(start, 'EEEE, MMMM d')}
            </div>
            <div style={{ fontSize: 12, color: '#616161' }}>
              {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
            </div>
          </div>
        </div>

        {/* Channel / Location */}
        {event.channel && (
          <div className="flex items-start gap-2" style={{ marginTop: 12 }}>
            <Video size={16} color="#616161" style={{ marginTop: 2, flexShrink: 0 }} aria-hidden="true" />
            <div>
              <div style={{ fontSize: 13, color: '#242424' }}>Online</div>
              <div style={{ fontSize: 12, color: '#616161' }}>{event.channel}</div>
            </div>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div className="flex items-start gap-2" style={{ marginTop: 12 }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{ width: 16, height: 16, borderRadius: 2, background: '#f0f0f0' }} />
            </div>
            <div style={{ fontSize: 13, color: '#242424', lineHeight: '18px' }}>
              {event.description}
            </div>
          </div>
        )}

        {/* Recurring badge */}
        {event.recurring && (
          <div
            className="flex items-center gap-1 rounded"
            style={{
              marginTop: 12,
              padding: '4px 8px',
              background: '#f0f0f0',
              fontSize: 11,
              color: '#616161',
            }}
          >
            <Repeat size={11} aria-hidden="true" />
            Repeats weekly
          </div>
        )}

        {/* Attendees */}
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: '#242424', marginBottom: 8 }}>
            Attendees ({event.attendees.length})
          </h3>
          <div className="space-y-2">
            {event.attendees.map((aid) => {
              const emp = getEmployee(aid);
              if (!emp) return null;
              return (
                <div key={aid} className="flex items-center gap-2">
                  <Avatar src={emp.avatar} alt={emp.name} size="sm" isAi={emp.kind === 'ai'} />
                  <div className="flex-1">
                    <div style={{ fontSize: 13, color: '#242424' }}>{emp.name}</div>
                    <div style={{ fontSize: 11, color: '#616161' }}>{emp.title}</div>
                  </div>
                  <div
                    className="rounded-full"
                    style={{
                      width: 8,
                      height: 8,
                      background: '#92c353',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2" style={{ marginTop: 20 }}>
          <button
            className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded"
            style={{
              padding: '8px 0',
              fontSize: 13,
              fontWeight: 500,
              background: '#D97757',
              color: '#fff',
              border: 'none',
            }}
            onClick={() => showToast('info')}
            aria-label="Join video meeting"
          >
            <Video size={14} aria-hidden="true" />
            Join Meeting
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MeetingForm (new + edit)
   ═══════════════════════════════════════════ */
function MeetingForm({
  event,
  onClose,
  clickedSlot,
  onSchedule,
  onEdit,
}: {
  event?: (typeof meetings)[0];
  onClose: () => void;
  clickedSlot: { date: Date; hour: number } | null;
  onSchedule: (meeting: any) => void;
  onEdit: (meeting: any) => void;
}) {
  const isEdit = !!event;
  const [title, setTitle] = useState(event?.title || '');
  const [template, setTemplate] = useState(event?.meetingType || '');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>(event?.attendees || []);
  const [duration, setDuration] = useState(
    event ? Math.round((parseDate(event.endTime).getTime() - parseDate(event.startTime).getTime()) / 60000) : 30
  );
  const [location, setLocation] = useState(event?.channel || 'Online');
  const [recurring, setRecurring] = useState(event?.recurring || false);
  const [agenda, setAgenda] = useState(event?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultDate = event
    ? format(parseDate(event.startTime), 'yyyy-MM-dd')
    : clickedSlot?.date
      ? format(clickedSlot.date, 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd');
  const defaultStart = event
    ? format(parseDate(event.startTime), 'HH:mm')
    : clickedSlot?.hour
      ? `${String(clickedSlot.hour).padStart(2, '0')}:00`
      : '09:00';

  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState(defaultStart);

  const toggleAttendee = (id: string) => {
    setSelectedAttendees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setTemplate(t.id);
    setDuration(t.duration);
    if (!title) {
      setTitle(t.label);
    }
    if (t.id === 'standup') {
      setSelectedAttendees(employees.filter((e) => e.teamIds.includes('team-engineering')).map((e) => e.id));
    } else if (t.id === '1:1') {
      setSelectedAttendees(['emp-maya', 'emp-raj']);
    }
  };

  const handleSubmit = () => {
    const cleanTitle = escapeHtml(title.trim());
    if (!cleanTitle || cleanTitle.length < 2) {
      showToast('error');
      return;
    }
    if (selectedAttendees.length === 0) {
      showToast('error');
      return;
    }
    setIsSubmitting(true);

    const startH = parseInt(startTime.split(':')[0]);
    const startM = parseInt(startTime.split(':')[1]);
    const endTotalMin = startH * 60 + startM + duration;
    const endH = Math.floor(endTotalMin / 60);
    const endM = endTotalMin % 60;

    const [year, month, dayNum] = date.split('-').map(Number);
    const startDateTime = new Date(year, month - 1, dayNum, startH, startM);
    const endDateTime = new Date(year, month - 1, dayNum, endH, endM);

    const meetingData = {
      id: isEdit ? event!.id : `mtg-${Date.now()}`,
      title: cleanTitle,
      date,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      duration,
      meetingType: template || 'sync',
      type: template || 'sync',
      attendees: selectedAttendees,
      organizer: 'emp-alex',
      location,
      channel: location,
      description: agenda,
      status: 'scheduled' as const,
      recurring,
    };

    setTimeout(() => {
      if (isEdit) {
        onEdit(meetingData);
      } else {
        onSchedule(meetingData);
      }
      setIsSubmitting(false);
    }, 300);
  };

  const isValid = title.trim().length >= 2 && selectedAttendees.length > 0;

  return (
    <div
      className="flex flex-shrink-0 flex-col overflow-auto"
      style={{
        width: 340,
        borderLeft: '1px solid #e1e1e1',
        background: '#fff',
      }}
      role="dialog"
      aria-label={isEdit ? 'Edit meeting' : 'New meeting'}
    >
      <div className="flex items-center justify-between" style={{ padding: '12px 16px', borderBottom: '1px solid #e1e1e1' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#242424' }}>{isEdit ? 'Edit Meeting' : 'New Meeting'}</span>
        <button onClick={onClose} className="cursor-pointer rounded p-2 hover:bg-[#f0f0f0]" aria-label="Close" style={{ minWidth: 44, minHeight: 44, border: 'none', background: 'transparent' }}>
          <X size={16} color="#616161" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-auto" style={{ padding: 16 }}>
        {/* Templates */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase' }}>
            Quick Start
          </label>
          <div className="mt-1 flex flex-wrap gap-1">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t)}
                className="cursor-pointer rounded"
                style={{
                  padding: '3px 8px',
                  fontSize: 11,
                  border: template === t.id ? '1px solid #D97757' : '1px solid #d1d1d1',
                  background: template === t.id ? '#e8eaf6' : '#fff',
                  color: template === t.id ? '#D97757' : '#242424',
                }}
                aria-label={`Apply ${t.label} template`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase' }}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Meeting title"
            className="mt-1 w-full rounded outline-none"
            style={{
              height: 32,
              padding: '0 10px',
              fontSize: 13,
              border: '1px solid #d1d1d1',
            }}
            aria-required="true"
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase' }}>
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded outline-none"
              style={{
                height: 32,
                padding: '0 8px',
                fontSize: 12,
                border: '1px solid #d1d1d1',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase' }}>
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 w-full rounded outline-none"
              style={{
                height: 32,
                padding: '0 8px',
                fontSize: 12,
                border: '1px solid #d1d1d1',
              }}
            />
          </div>
        </div>

        {/* Duration */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase' }}>
            Duration (minutes)
          </label>
          <div className="mt-1 flex gap-1">
            {[15, 30, 45, 60, 90, 120].map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className="cursor-pointer rounded"
                style={{
                  padding: '3px 8px',
                  fontSize: 11,
                  border: duration === d ? '1px solid #D97757' : '1px solid #d1d1d1',
                  background: duration === d ? '#e8eaf6' : '#fff',
                  color: duration === d ? '#D97757' : '#242424',
                }}
                aria-label={`${d} minutes`}
              >
                {d}m
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase' }}>
            Location / Channel
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 w-full rounded outline-none"
            style={{
              height: 32,
              padding: '0 10px',
              fontSize: 13,
              border: '1px solid #d1d1d1',
            }}
          />
        </div>

        {/* Attendees */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase' }}>
            Attendees ({selectedAttendees.length})
          </label>
          <div className="mt-1 space-y-1" role="group" aria-label="Select attendees">
            {employees.map((emp) => {
              const selected = selectedAttendees.includes(emp.id);
              return (
                <button
                  key={emp.id}
                  onClick={() => toggleAttendee(emp.id)}
                  className="flex w-full cursor-pointer items-center gap-2 rounded"
                  style={{
                    padding: '4px 6px',
                    background: selected ? '#e8eaf6' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                  }}
                  role="checkbox"
                  aria-checked={selected}
                  aria-label={`${emp.name} ${emp.kind === 'ai' ? 'AI' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleAttendee(emp.id)}
                    style={{ width: 14, height: 14 }}
                    aria-hidden="true"
                    tabIndex={-1}
                  />
                  <Avatar src={emp.avatar} alt={emp.name} size="xs" isAi={emp.kind === 'ai'} />
                  <span style={{ fontSize: 12, color: '#242424', flex: 1 }}>{emp.name}</span>
                  {emp.kind === 'ai' && (
                    <span
                      className="rounded"
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '1px 4px',
                        background: '#D97757',
                        color: '#fff',
                      }}
                    >
                      AI
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recurring */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="recurring"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
            style={{ width: 16, height: 16 }}
            aria-label="Repeat weekly"
          />
          <label htmlFor="recurring" style={{ fontSize: 12, color: '#242424', cursor: 'pointer' }}>
            Repeat weekly
          </label>
        </div>

        {/* Agenda */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase' }}>
            Agenda
          </label>
          <textarea
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            placeholder="Meeting agenda or notes..."
            className="mt-1 w-full resize-none rounded outline-none"
            rows={4}
            style={{
              padding: '8px 10px',
              fontSize: 13,
              border: '1px solid #d1d1d1',
            }}
          />
        </div>
      </div>

      {/* Submit button */}
      <div style={{ padding: 12, borderTop: '1px solid #e1e1e1' }}>
        <button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className="w-full cursor-pointer rounded"
          style={{
            height: 36,
            fontSize: 13,
            fontWeight: 600,
            background: isValid && !isSubmitting ? '#D97757' : '#d1d1d1',
            color: isValid ? '#fff' : '#a0a0a0',
            border: 'none',
            cursor: isValid && !isSubmitting ? 'pointer' : 'not-allowed',
            opacity: isSubmitting ? 0.7 : 1,
          }}
          aria-label={isEdit ? 'Save changes' : 'Schedule meeting'}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {isEdit ? 'Saving...' : 'Scheduling...'}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1">
              {isEdit ? <Check size={14} /> : <Plus size={14} />}
              {isEdit ? 'Save Changes' : 'Schedule Meeting'}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
