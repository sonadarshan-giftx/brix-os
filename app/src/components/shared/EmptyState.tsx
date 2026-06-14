import type { ReactNode } from 'react';
import {
  Inbox, Search, FolderOpen, MessageSquare, Users,
  Phone, Calendar, CheckCircle2, Shield, Zap, Bell,
  FileQuestion, ClipboardList, Mail, Bookmark,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

type EmptyVariant =
  | 'generic'
  | 'search'
  | 'inbox'
  | 'projects'
  | 'chat'
  | 'teams'
  | 'calls'
  | 'calendar'
  | 'approvals'
  | 'security'
  | 'notifications'
  | 'apps';

interface EmptyStateProps {
  variant?: EmptyVariant;
  icon?: ReactNode;
  title?: string;
  message?: string;
  action?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  className?: string;
}

// ═══════════════════════════════════════════════════════════
// Variant presets — icons, titles, and messages
// ═══════════════════════════════════════════════════════════

const VARIANT_CONFIG: Record<EmptyVariant, { icon: ReactNode; defaultTitle: string; defaultMessage: string }> = {
  generic: {
    icon: <Inbox size={40} />,
    defaultTitle: 'Nothing here yet',
    defaultMessage: 'This area is currently empty.',
  },
  search: {
    icon: <Search size={40} />,
    defaultTitle: 'No results found',
    defaultMessage: 'Try adjusting your search terms or filters.',
  },
  inbox: {
    icon: <Mail size={40} />,
    defaultTitle: 'Your inbox is empty',
    defaultMessage: 'You\'re all caught up! New messages will appear here.',
  },
  projects: {
    icon: <FolderOpen size={40} />,
    defaultTitle: 'No projects yet',
    defaultMessage: 'Create your first project to start tracking work.',
  },
  chat: {
    icon: <MessageSquare size={40} />,
    defaultTitle: 'No conversations',
    defaultMessage: 'Start a conversation by selecting a contact or channel.',
  },
  teams: {
    icon: <Users size={40} />,
    defaultTitle: 'No team members',
    defaultMessage: 'Add team members to collaborate on projects.',
  },
  calls: {
    icon: <Phone size={40} />,
    defaultTitle: 'No calls',
    defaultMessage: 'Start a call to connect with your team in real-time.',
  },
  calendar: {
    icon: <Calendar size={40} />,
    defaultTitle: 'No upcoming events',
    defaultMessage: 'Your calendar is clear. Create an event to get started.',
  },
  approvals: {
    icon: <CheckCircle2 size={40} />,
    defaultTitle: 'No pending approvals',
    defaultMessage: 'You\'re all caught up! Approval requests will appear here.',
  },
  security: {
    icon: <Shield size={40} />,
    defaultTitle: 'Security overview',
    defaultMessage: 'All security policies are active. No action needed.',
  },
  notifications: {
    icon: <Bell size={40} />,
    defaultTitle: 'No notifications',
    defaultMessage: 'You\'re all caught up! Notifications will appear here.',
  },
  apps: {
    icon: <Zap size={40} />,
    defaultTitle: 'No apps connected',
    defaultMessage: 'Browse the app marketplace to connect tools you use.',
  },
};

/**
 * EmptyState — Polished empty state with variant presets
 *
 * Features:
 * - 12 built-in variants with appropriate icons and messages
 * - Custom icon/title/message support
 * - Primary and secondary action buttons
 * - Accessible with ARIA attributes
 */
export function EmptyState({
  variant = 'generic',
  icon: customIcon,
  title: customTitle,
  message: customMessage,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const config = VARIANT_CONFIG[variant];
  const icon = customIcon ?? config.icon;
  const title = customTitle ?? config.defaultTitle;
  const message = customMessage ?? config.defaultMessage;

  return (
    <div
      className={`flex flex-col items-center justify-center py-16 text-center ${className ?? ''}`}
      role="status"
      aria-live="polite"
      aria-label={title}
    >
      {/* Icon */}
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: '#f0f0fa', color: 'var(--op-accent-muted, #a0a0a0)' }}
      >
        <span style={{ color: 'var(--op-accent, #D97757)', opacity: 0.6 }}>
          {icon}
        </span>
      </div>

      {/* Title */}
      <h3
        className="mb-1 font-semibold"
        style={{ fontSize: 14, color: '#242424' }}
      >
        {title}
      </h3>

      {/* Message */}
      {message && (
        <p
          className="max-w-[280px]"
          style={{ fontSize: 13, color: '#616161' }}
        >
          {message}
        </p>
      )}

      {/* Action buttons */}
      {(action || secondaryAction) && (
        <div className="mt-4 flex gap-2">
          {action && (
            <button
              onClick={action.onClick}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2 font-medium"
              style={{
                fontSize: 13,
                backgroundColor: 'var(--op-accent, #D97757)',
                color: '#fff',
                border: 'none',
              }}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2 font-medium"
              style={{
                fontSize: 13,
                backgroundColor: '#fff',
                color: '#242424',
                border: '1px solid #e1e1e1',
              }}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Pre-built convenience components for common empty states
// ═══════════════════════════════════════════════════════════

/** Empty search results */
export function EmptySearch({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <EmptyState
      variant="search"
      title={`No results for "${query}"`}
      message="Try a different search term or check your spelling."
      action={{ label: 'Clear Search', onClick: onClear }}
    />
  );
}

/** Empty inbox */
export function EmptyInbox({ onCompose }: { onCompose?: () => void }) {
  return (
    <EmptyState
      variant="inbox"
      action={onCompose ? { label: 'Compose Message', onClick: onCompose } : undefined}
    />
  );
}

/** Empty projects */
export function EmptyProjects({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      variant="projects"
      action={onCreate ? { label: 'Create Project', onClick: onCreate } : undefined}
    />
  );
}

/** Empty chat */
export function EmptyChat({ onStartConversation }: { onStartConversation?: () => void }) {
  return (
    <EmptyState
      variant="chat"
      action={onStartConversation ? { label: 'Start Chat', onClick: onStartConversation } : undefined}
    />
  );
}

/** Empty notifications (all read) */
export function EmptyNotifications() {
  return (
    <EmptyState
      variant="notifications"
      title="All caught up!"
      message="You have no unread notifications."
    />
  );
}

/** Error empty state */
export function EmptyError({
  title = 'Something went wrong',
  message = 'We couldn\'t load this content.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      variant="generic"
      icon={<FileQuestion size={40} />}
      title={title}
      message={message}
      action={onRetry ? { label: 'Try Again', onClick: onRetry } : undefined}
    />
  );
}
