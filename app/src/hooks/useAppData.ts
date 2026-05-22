/**
 * useAppData — Loads real backend data into the Zustand store
 *
 * Called once when the user is authenticated and has a workspace.
 * Maps API response shapes to the store's internal format.
 * Falls back gracefully to existing mock data if the API fails.
 */

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { projectApi, chatApi, workspaceApi } from '@/utils/api';

// Map an API project to the store Project shape
function mapApiProject(p: any) {
  const statusMap: Record<string, string> = {
    PLANNING: 'planning',
    ACTIVE: 'active',
    ON_HOLD: 'on-hold',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  };

  return {
    id: p.id,
    name: p.name,
    key: p.key || p.name.slice(0, 4).toUpperCase(),
    description: p.description || '',
    status: statusMap[p.status] || 'active',
    health: p.health || 'good',
    color: p.color || pickColor(p.id),
    progress: p.progress ?? 0,
    ownerId: p.creatorId,
    ownerName: p.creator?.name || 'Unknown',
    workspaceId: p.workspaceId,
    startDate: p.startDate || null,
    endDate: p.endDate || null,
    budgetTotal: p.budgetTotal || 0,
    budgetSpent: p.budgetSpent || 0,
    tickets: [],
    sprints: [],
    team: [],
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    // Count from API
    ticketCount: p._count?.tickets ?? 0,
    sprintCount: p._count?.sprints ?? 0,
  };
}

// Map an API conversation to the store Conversation shape
function mapApiConversation(c: any) {
  return {
    id: c.id,
    name: c.name || 'Conversation',
    type: c.type?.toLowerCase() || 'channel',
    description: c.description || '',
    workspaceId: c.workspaceId,
    participants: (c.participants || []).map((p: any) => ({
      id: p.user?.id || p.userId,
      name: p.user?.name || 'Member',
      avatar: p.user?.avatar || null,
      role: p.role || 'MEMBER',
    })),
    messages: [],
    lastMessage: c.lastMessage || null,
    unreadCount: c.unreadCount || 0,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

const COLORS = ['#5b5fc7', '#D97757', '#237b4b', '#d97706', '#c4314b', '#0891b2'];
function pickColor(id: string): string {
  const hash = Array.from(id).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
}

export function useAppData() {
  const currentUser = useStore((s) => s.currentUser);
  const workspace = useStore((s) => s.workspace);
  const workspaces = useStore((s) => s.workspaces);
  const authToken = useStore((s) => s.authToken);
  const loaded = useRef(false);

  useEffect(() => {
    if (!currentUser || !authToken) return;
    if (loaded.current) return;
    loaded.current = true;

    const activeWorkspace = workspace || workspaces[0];
    if (!activeWorkspace) return;

    const wsId = activeWorkspace.id;

    // Load projects
    projectApi.list(wsId, authToken)
      .then(({ projects }) => {
        if (projects.length > 0) {
          const mapped = projects.map(mapApiProject);
          useStore.setState((s: any) => { s.projects = mapped; });
        }
      })
      .catch(() => {/* keep mock data */});

    // Load conversations
    chatApi.listConversations(wsId, authToken)
      .then((conversations) => {
        if (conversations.length > 0) {
          const mapped = conversations.map(mapApiConversation);
          useStore.setState((s: any) => { s.conversations = mapped; });
        }
      })
      .catch(() => {/* keep mock data */});

    // Reload workspace details (member list etc.)
    workspaceApi.get(wsId, authToken)
      .then((ws) => {
        useStore.setState((s: any) => { s.workspace = ws; });
      })
      .catch(() => {/* keep current */});

  }, [currentUser, workspace, workspaces, authToken]);
}
