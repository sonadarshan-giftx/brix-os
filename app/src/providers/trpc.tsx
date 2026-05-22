// ============================================================
// Brixstac — tRPC Provider with Mock API Layer
// ============================================================
// Provides full tRPC integration with a localStorage-backed
// mock API for static deployments. All queries and mutations
// work without a real backend server.

import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import superjson from 'superjson';
import { useEffect, useState, type ReactNode } from 'react';
import type { AppRouter } from '../../api/router';
import {
  projects as mockProjects,
  teams as mockTeams,
  allTickets as mockTickets,
  allSprints as mockSprints,
  conversations as mockConversations,
  meetings as mockMeetings,
  employees as mockEmployees,
  emailThreads as mockEmailThreads,
  approvals as mockApprovals,
} from '@/data/mockData';
import { safeJSONParse, safeJSONStringify, generateNonce } from '@/utils/helpers';

export const trpc = createTRPCReact<AppRouter>();

// ── Mock Data Storage Key ───────────────────────────────────
const MOCK_DATA_KEY = 'brixstac-mock-api-data';
const REQUEST_LOG_KEY = 'brixstac-mock-request-log';
const MAX_REQUEST_LOG = 100;

// ── Mock Data Cache ─────────────────────────────────────────

interface MockDataCache {
  projects: typeof mockProjects;
  teams: typeof mockTeams;
  tickets: typeof mockTickets;
  sprints: typeof mockSprints;
  conversations: typeof mockConversations;
  meetings: typeof mockMeetings;
  employees: typeof mockEmployees;
  emailThreads: typeof mockEmailThreads;
  approvals: typeof mockApprovals;
  lastUpdated: string;
}

function getInitialMockData(): MockDataCache {
  const stored = localStorage.getItem(MOCK_DATA_KEY);
  if (stored) {
    const parsed = safeJSONParse<MockDataCache | null>(stored, null);
    if (parsed) return parsed;
  }
  return {
    projects: [...mockProjects],
    teams: [...mockTeams],
    tickets: [...mockTickets],
    sprints: [...mockSprints],
    conversations: [...mockConversations],
    meetings: [...mockMeetings],
    employees: [...mockEmployees],
    emailThreads: [...mockEmailThreads],
    approvals: [...mockApprovals],
    lastUpdated: new Date().toISOString(),
  };
}

let mockDataCache: MockDataCache = getInitialMockData();

function persistMockData(): void {
  mockDataCache.lastUpdated = new Date().toISOString();
  try {
    localStorage.setItem(MOCK_DATA_KEY, safeJSONStringify(mockDataCache));
  } catch {
    // If quota exceeded, clear and retry without conversations (largest)
    const { conversations, ...rest } = mockDataCache;
    try {
      localStorage.setItem(MOCK_DATA_KEY, safeJSONStringify(rest));
    } catch {
      // Silently fail - data stays in memory
    }
  }
}

function logRequest(op: string, input: unknown, output: unknown): void {
  try {
    const logs = safeJSONParse<{ ts: number; op: string }[]>(
      localStorage.getItem(REQUEST_LOG_KEY) || '[]',
      []
    );
    logs.unshift({ ts: Date.now(), op, input: input ? JSON.stringify(input).slice(0, 200) : null, output: output ? JSON.stringify(output).slice(0, 200) : null } as unknown as { ts: number; op: string });
    localStorage.setItem(
      REQUEST_LOG_KEY,
      safeJSONStringify(logs.slice(0, MAX_REQUEST_LOG))
    );
  } catch {
    // Silently fail
  }
}

// ── Request Deduplication ───────────────────────────────────

const pendingRequests = new Map<string, Promise<unknown>>();

function dedupeRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = pendingRequests.get(key);
  if (existing) return existing as Promise<T>;
  const promise = fn().finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, promise);
  return promise;
}

// ── Mock API Router ─────────────────────────────────────────
// Maps tRPC operation paths to local data operations

const mockApiHandlers: Record<
  string,
  (input?: Record<string, unknown>) => Promise<unknown>
> = {
  // ── Projects ──
  'project.list': async () => {
    await simulateNetworkDelay(200);
    return mockDataCache.projects;
  },
  'project.byId': async (input) => {
    await simulateNetworkDelay(150);
    const project = mockDataCache.projects.find((p) => p.id === input?.id);
    if (!project) throw new Error('Project not found');
    return project;
  },
  'project.create': async (input) => {
    await simulateNetworkDelay(300);
    const newProject = {
      ...input,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockDataCache.projects.push(newProject as any);
    persistMockData();
    return newProject;
  },
  'project.update': async (input) => {
    await simulateNetworkDelay(250);
    const idx = mockDataCache.projects.findIndex((p) => p.id === input?.id);
    if (idx === -1) throw new Error('Project not found');
    mockDataCache.projects[idx] = {
      ...mockDataCache.projects[idx],
      ...(input?.data as Record<string, unknown>),
    };
    persistMockData();
    return mockDataCache.projects[idx];
  },
  'project.delete': async (input) => {
    await simulateNetworkDelay(200);
    mockDataCache.projects = mockDataCache.projects.filter(
      (p) => p.id !== input?.id
    );
    persistMockData();
    return { success: true };
  },

  // ── Teams ──
  'team.list': async () => {
    await simulateNetworkDelay(200);
    return mockDataCache.teams;
  },
  'team.byId': async (input) => {
    await simulateNetworkDelay(150);
    const team = mockDataCache.teams.find((t) => t.id === input?.id);
    if (!team) throw new Error('Team not found');
    return team;
  },
  'team.create': async (input) => {
    await simulateNetworkDelay(300);
    const newTeam = {
      ...input,
      id: `team-${Date.now()}`,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockDataCache.teams.push(newTeam as any);
    persistMockData();
    return newTeam;
  },
  'team.update': async (input) => {
    await simulateNetworkDelay(250);
    const idx = mockDataCache.teams.findIndex((t) => t.id === input?.id);
    if (idx === -1) throw new Error('Team not found');
    mockDataCache.teams[idx] = {
      ...mockDataCache.teams[idx],
      ...(input?.data as Record<string, unknown>),
    };
    persistMockData();
    return mockDataCache.teams[idx];
  },
  'team.delete': async (input) => {
    await simulateNetworkDelay(200);
    mockDataCache.teams = mockDataCache.teams.filter(
      (t) => t.id !== input?.id
    );
    persistMockData();
    return { success: true };
  },

  // ── Tickets ──
  'ticket.list': async (input) => {
    await simulateNetworkDelay(250);
    let tickets = [...mockDataCache.tickets];
    if (input?.projectId) {
      tickets = tickets.filter((t) => t.projectId === input.projectId);
    }
    if (input?.status) {
      tickets = tickets.filter((t) => t.status === input.status);
    }
    if (input?.assigneeId) {
      tickets = tickets.filter((t) => t.assigneeId === input.assigneeId);
    }
    return tickets;
  },
  'ticket.byId': async (input) => {
    await simulateNetworkDelay(150);
    const ticket = mockDataCache.tickets.find((t) => t.id === input?.id);
    if (!ticket) throw new Error('Ticket not found');
    return ticket;
  },
  'ticket.create': async (input) => {
    await simulateNetworkDelay(300);
    const newTicket = {
      ...input,
      id: `t-${Date.now()}`,
      key: `${input?.projectId?.toString().toUpperCase().replace('PROJ-', '') || 'TICK'}-${Math.floor(Math.random() * 900) + 100}`,
      createdAt: new Date().toISOString(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockDataCache.tickets.push(newTicket as any);
    persistMockData();
    return newTicket;
  },
  'ticket.update': async (input) => {
    await simulateNetworkDelay(250);
    const idx = mockDataCache.tickets.findIndex((t) => t.id === input?.id);
    if (idx === -1) throw new Error('Ticket not found');
    mockDataCache.tickets[idx] = {
      ...mockDataCache.tickets[idx],
      ...(input?.data as Record<string, unknown>),
    };
    persistMockData();
    return mockDataCache.tickets[idx];
  },
  'ticket.delete': async (input) => {
    await simulateNetworkDelay(200);
    mockDataCache.tickets = mockDataCache.tickets.filter(
      (t) => t.id !== input?.id
    );
    persistMockData();
    return { success: true };
  },

  // ── Sprints ──
  'sprint.list': async (input) => {
    await simulateNetworkDelay(200);
    let sprints = [...mockDataCache.sprints];
    if (input?.projectId) {
      sprints = sprints.filter((s) => s.projectId === input.projectId);
    }
    return sprints;
  },
  'sprint.byId': async (input) => {
    await simulateNetworkDelay(150);
    const sprint = mockDataCache.sprints.find((s) => s.id === input?.id);
    if (!sprint) throw new Error('Sprint not found');
    return sprint;
  },
  'sprint.create': async (input) => {
    await simulateNetworkDelay(300);
    const newSprint = {
      ...input,
      id: `spr-${Date.now()}`,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockDataCache.sprints.push(newSprint as any);
    persistMockData();
    return newSprint;
  },
  'sprint.update': async (input) => {
    await simulateNetworkDelay(250);
    const idx = mockDataCache.sprints.findIndex((s) => s.id === input?.id);
    if (idx === -1) throw new Error('Sprint not found');
    mockDataCache.sprints[idx] = {
      ...mockDataCache.sprints[idx],
      ...(input?.data as Record<string, unknown>),
    };
    persistMockData();
    return mockDataCache.sprints[idx];
  },

  // ── Employees ──
  'employee.list': async () => {
    await simulateNetworkDelay(200);
    return mockDataCache.employees;
  },
  'employee.byId': async (input) => {
    await simulateNetworkDelay(150);
    const employee = mockDataCache.employees.find((e) => e.id === input?.id);
    if (!employee) throw new Error('Employee not found');
    return employee;
  },

  // ── Conversations ──
  'conversation.list': async () => {
    await simulateNetworkDelay(200);
    return mockDataCache.conversations;
  },
  'conversation.byId': async (input) => {
    await simulateNetworkDelay(150);
    const conv = mockDataCache.conversations.find((c) => c.id === input?.id);
    if (!conv) throw new Error('Conversation not found');
    return conv;
  },
  'conversation.create': async (input) => {
    await simulateNetworkDelay(300);
    const newConv = {
      ...input,
      id: `conv-${Date.now()}`,
      messages: [],
      lastMessageAt: new Date().toISOString(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockDataCache.conversations.push(newConv as any);
    persistMockData();
    return newConv;
  },
  'conversation.sendMessage': async (input) => {
    await simulateNetworkDelay(200);
    const convIdx = mockDataCache.conversations.findIndex(
      (c) => c.id === input?.conversationId
    );
    if (convIdx === -1) throw new Error('Conversation not found');
    const message = {
      id: `msg-${Date.now()}`,
      senderId: input?.senderId,
      content: input?.content,
      timestamp: new Date().toISOString(),
    };
    mockDataCache.conversations[convIdx].messages.push(
      message as any
    );
    mockDataCache.conversations[convIdx].lastMessageAt = message.timestamp;
    persistMockData();
    return message;
  },

  // ── Meetings ──
  'meeting.list': async (input) => {
    await simulateNetworkDelay(200);
    let meetings = [...mockDataCache.meetings];
    if (input?.startDate && input?.endDate) {
      meetings = meetings.filter((m) => {
        const mDate = new Date(m.startTime);
        return (
          mDate >= new Date(input.startDate as string) &&
          mDate <= new Date(input.endDate as string)
        );
      });
    }
    return meetings;
  },
  'meeting.byId': async (input) => {
    await simulateNetworkDelay(150);
    const meeting = mockDataCache.meetings.find((m) => m.id === input?.id);
    if (!meeting) throw new Error('Meeting not found');
    return meeting;
  },
  'meeting.create': async (input) => {
    await simulateNetworkDelay(300);
    const newMeeting = {
      ...input,
      id: `mtg-${Date.now()}`,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockDataCache.meetings.push(newMeeting as any);
    persistMockData();
    return newMeeting;
  },
  'meeting.update': async (input) => {
    await simulateNetworkDelay(250);
    const idx = mockDataCache.meetings.findIndex((m) => m.id === input?.id);
    if (idx === -1) throw new Error('Meeting not found');
    mockDataCache.meetings[idx] = {
      ...mockDataCache.meetings[idx],
      ...(input?.data as Record<string, unknown>),
    };
    persistMockData();
    return mockDataCache.meetings[idx];
  },
  'meeting.delete': async (input) => {
    await simulateNetworkDelay(200);
    mockDataCache.meetings = mockDataCache.meetings.filter(
      (m) => m.id !== input?.id
    );
    persistMockData();
    return { success: true };
  },

  // ── Approvals ──
  'approval.list': async () => {
    await simulateNetworkDelay(200);
    return mockDataCache.approvals;
  },
  'approval.byId': async (input) => {
    await simulateNetworkDelay(150);
    const approval = mockDataCache.approvals.find((a) => a.id === input?.id);
    if (!approval) throw new Error('Approval not found');
    return approval;
  },
  'approval.create': async (input) => {
    await simulateNetworkDelay(300);
    const newApproval = {
      ...input,
      id: `apr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    mockDataCache.approvals.push(
      newApproval as any
    );
    persistMockData();
    return newApproval;
  },
  'approval.update': async (input) => {
    await simulateNetworkDelay(250);
    const idx = mockDataCache.approvals.findIndex((a) => a.id === input?.id);
    if (idx === -1) throw new Error('Approval not found');
    mockDataCache.approvals[idx] = {
      ...mockDataCache.approvals[idx],
      ...(input?.data as Record<string, unknown>),
    };
    persistMockData();
    return mockDataCache.approvals[idx];
  },

  // ── Email Threads ──
  'email.list': async () => {
    await simulateNetworkDelay(200);
    return mockDataCache.emailThreads;
  },
  'email.byId': async (input) => {
    await simulateNetworkDelay(150);
    const thread = mockDataCache.emailThreads.find((t) => t.id === input?.id);
    if (!thread) throw new Error('Email thread not found');
    return thread;
  },

  // ── Dashboard / Analytics ──
  'dashboard.stats': async () => {
    await simulateNetworkDelay(300);
    return {
      totalProjects: mockDataCache.projects.length,
      activeProjects: mockDataCache.projects.filter((p) => p.status === 'active')
        .length,
      totalTickets: mockDataCache.tickets.length,
      ticketsByStatus: {
        todo: mockDataCache.tickets.filter((t) => t.status === 'todo').length,
        'in-progress': mockDataCache.tickets.filter(
          (t) => t.status === 'in-progress'
        ).length,
        review: mockDataCache.tickets.filter((t) => t.status === 'review')
          .length,
        done: mockDataCache.tickets.filter((t) => t.status === 'done').length,
      },
      totalEmployees: mockDataCache.employees.length,
      pendingApprovals: mockDataCache.approvals.filter(
        (a) => a.status === 'pending'
      ).length,
      upcomingMeetings: mockDataCache.meetings.filter((m) => {
        const meetingDate = new Date(m.startTime);
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        return meetingDate >= now && meetingDate <= tomorrow;
      }).length,
    };
  },

  // ── Search ──
  'search.global': async (input) => {
    await simulateNetworkDelay(400);
    const query = ((input?.query as string) || '').toLowerCase();
    if (!query) return [];

    const results = [];

    // Search projects
    for (const p of mockDataCache.projects) {
      if (p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)) {
        results.push({ type: 'project', id: p.id, title: p.name, subtitle: p.description.slice(0, 100) });
      }
    }

    // Search tickets
    for (const t of mockDataCache.tickets) {
      if (t.title.toLowerCase().includes(query)) {
        results.push({ type: 'ticket', id: t.id, title: `${t.key}: ${t.title}`, subtitle: t.status });
      }
    }

    // Search employees
    for (const e of mockDataCache.employees) {
      if (e.name.toLowerCase().includes(query) || e.title.toLowerCase().includes(query)) {
        results.push({ type: 'employee', id: e.id, title: e.name, subtitle: e.title });
      }
    }

    // Search teams
    for (const t of mockDataCache.teams) {
      if (t.name.toLowerCase().includes(query)) {
        results.push({ type: 'team', id: t.id, title: t.name, subtitle: `${t.memberIds.length} members` });
      }
    }

    return results.slice(0, 20);
  },
};

// ── Network Simulation ──────────────────────────────────────

function simulateNetworkDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Mock HTTP Batch Link ────────────────────────────────────

function createMockHttpBatchLink() {
  return httpBatchLink({
    url: '/api/trpc',
    transformer: superjson,
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        // Try real fetch first (for when backend is available)
        const response = await globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: 'include',
        });
        if (response.ok) return response;
        throw new Error('Backend returned error');
      } catch {
        // Fallback to mock API
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;

        const body = init?.body;
        let requests: { op: string; input?: Record<string, unknown> }[] = [];

        try {
          if (body) {
            const parsed = JSON.parse(body as string);
            requests = Array.isArray(parsed) ? parsed : [parsed];
          }
        } catch {
          // Parse URL for operation info
          const urlParams = new URL(url, window.location.origin).searchParams;
          const inputStr = urlParams.get('input');
          requests = [
            {
              op: urlParams.get('op') || 'unknown',
              input: inputStr ? JSON.parse(inputStr) : undefined,
            },
          ];
        }

        // Process each request in the batch
        const responses = await Promise.all(
          requests.map(async (req) => {
            const handler = mockApiHandlers[req.op || ''];
            if (!handler) {
              logRequest(req.op || 'unknown', req.input, null);
              return {
                error: {
                  message: `Mock API handler not found for: ${req.op}`,
                  code: 'NOT_FOUND',
                },
              };
            }

            try {
              const result = await dedupeRequest(
                `${req.op}-${JSON.stringify(req.input || {})}`,
                () => handler(req.input)
              );
              logRequest(req.op || 'unknown', req.input, result);
              return { result };
            } catch (err) {
              const error = err instanceof Error ? err.message : 'Unknown error';
              logRequest(req.op || 'unknown', req.input, { error });
              return {
                error: {
                  message: error,
                  code: 'INTERNAL_SERVER_ERROR',
                },
              };
            }
          })
        );

        return new Response(
          JSON.stringify(responses),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    },
  });
}

// ── Query Client Configuration ──────────────────────────────

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          // Don't retry 4xx errors
          if (error instanceof Error && error.message.includes('not found')) {
            return false;
          }
          return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ── Provider Component ──────────────────────────────────────

export function TRPCProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [createMockHttpBatchLink()],
    })
  );

  // Sync mock data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(MOCK_DATA_KEY);
    if (stored) {
      mockDataCache = getInitialMockData();
    }
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

// ── Reset Mock Data ─────────────────────────────────────────

export function resetMockData(): void {
  localStorage.removeItem(MOCK_DATA_KEY);
  localStorage.removeItem(REQUEST_LOG_KEY);
  mockDataCache = getInitialMockData();
  persistMockData();
}
