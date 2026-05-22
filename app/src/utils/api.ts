// Brixstac API Client
// REST client for connecting to the Express backend

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
  constructor(public status: number, public data: any) {
    super(data?.error || `HTTP ${status}`);
    this.name = 'ApiError';
  }
}

async function request<T>(method: string, path: string, body?: any, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, data);
  }

  return data as T;
}

// ── Auth API ──────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; name: string; companyName?: string }) =>
    request<{ user: any; message: string }>('POST', '/auth/register', data),

  login: (data: { email: string; password: string }) =>
    request<{ user: any; accessToken: string; refreshToken: string }>('POST', '/auth/login', data),

  refresh: (refreshToken: string) =>
    request<{ accessToken: string; refreshToken: string }>('POST', '/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    request<{ success: boolean }>('POST', '/auth/logout', { refreshToken }),

  me: (token: string) =>
    request<any>('GET', '/auth/me', undefined, token),

  updateProfile: (data: { name?: string; bio?: string; avatar?: string }, token: string) =>
    request<any>('PATCH', '/auth/me', data, token),

  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string }>('POST', '/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    request<{ success: boolean; message: string }>('POST', '/auth/reset-password', { token, password }),

  verifyEmail: (email: string, code: string) =>
    request<{ success: boolean; message: string }>('POST', '/auth/verify-email', { email, code }),

  resendVerification: (email: string) =>
    request<{ success: boolean; message: string }>('POST', '/auth/resend-verification', { email }),
};

// ── Workspace API ─────────────────────────────────────────────
export const workspaceApi = {
  list: (token: string) =>
    request<any[]>('GET', '/workspaces', undefined, token),

  get: (id: string, token: string) =>
    request<any>('GET', `/workspaces/${id}`, undefined, token),

  create: (data: { name: string; slug: string; description?: string; industry?: string; plan?: string }, token: string) =>
    request<any>('POST', '/workspaces', data, token),

  update: (id: string, data: any, token: string) =>
    request<any>('PATCH', `/workspaces/${id}`, data, token),

  delete: (id: string, token: string) =>
    request<{ success: boolean }>('DELETE', `/workspaces/${id}`, undefined, token),

  invite: (id: string, data: { email: string; role?: string }, token: string) =>
    request<any>('POST', `/workspaces/${id}/invites`, data, token),

  listInvites: (id: string, token: string) =>
    request<any[]>('GET', `/workspaces/${id}/invites`, undefined, token),

  cancelInvite: (workspaceId: string, inviteId: string, token: string) =>
    request<{ success: boolean }>('DELETE', `/workspaces/${workspaceId}/invites/${inviteId}`, undefined, token),

  acceptInvite: (token: string, authToken: string) =>
    request<{ success: boolean; workspace: any }>('POST', '/workspaces/invites/accept', { token }, authToken),

  updateMember: (workspaceId: string, memberId: string, role: string, token: string) =>
    request<any>('PATCH', `/workspaces/${workspaceId}/members/${memberId}`, { role }, token),

  removeMember: (workspaceId: string, memberId: string, token: string) =>
    request<{ success: boolean }>('DELETE', `/workspaces/${workspaceId}/members/${memberId}`, undefined, token),

  leave: (id: string, token: string) =>
    request<{ success: boolean }>('POST', `/workspaces/${id}/leave`, undefined, token),
};

// ── Projects API ────────────────────────────────────────────
export const projectApi = {
  list: (workspaceId: string, token: string) =>
    request<{ projects: any[]; total: number; page: number; totalPages: number }>('GET', `/workspaces/${workspaceId}/projects`, undefined, token),

  get: (workspaceId: string, projectId: string, token: string) =>
    request<any>('GET', `/workspaces/${workspaceId}/projects/${projectId}`, undefined, token),

  create: (workspaceId: string, data: any, token: string) =>
    request<any>('POST', `/workspaces/${workspaceId}/projects`, data, token),

  update: (workspaceId: string, projectId: string, data: any, token: string) =>
    request<any>('PATCH', `/workspaces/${workspaceId}/projects/${projectId}`, data, token),

  delete: (workspaceId: string, projectId: string, token: string) =>
    request<{ success: boolean }>('DELETE', `/workspaces/${workspaceId}/projects/${projectId}`, undefined, token),

  // Tickets
  listTickets: (workspaceId: string, token: string, params?: { projectId?: string; status?: string }) => {
    const q = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null) as [string, string][]).toString() : '';
    return request<{ tickets: any[]; total: number; page: number; totalPages: number }>('GET', `/workspaces/${workspaceId}/tickets${q}`, undefined, token);
  },

  getTicket: (workspaceId: string, ticketId: string, token: string) =>
    request<any>('GET', `/workspaces/${workspaceId}/tickets/${ticketId}`, undefined, token),

  createTicket: (workspaceId: string, projectId: string, data: any, token: string) =>
    request<any>('POST', `/workspaces/${workspaceId}/projects/${projectId}/tickets`, data, token),

  updateTicket: (workspaceId: string, ticketId: string, data: any, token: string) =>
    request<any>('PATCH', `/workspaces/${workspaceId}/tickets/${ticketId}`, data, token),

  deleteTicket: (workspaceId: string, ticketId: string, token: string) =>
    request<{ success: boolean }>('DELETE', `/workspaces/${workspaceId}/tickets/${ticketId}`, undefined, token),

  // Sprints
  listSprints: (workspaceId: string, projectId: string, token: string) =>
    request<any[]>('GET', `/workspaces/${workspaceId}/projects/${projectId}/sprints`, undefined, token),

  createSprint: (workspaceId: string, projectId: string, data: any, token: string) =>
    request<any>('POST', `/workspaces/${workspaceId}/projects/${projectId}/sprints`, data, token),
};

// ── Chat API ──────────────────────────────────────────────────
export const chatApi = {
  // ── Legacy conversations (DMs) ──
  listConversations: (workspaceId: string, token: string) =>
    request<any[]>('GET', `/workspaces/${workspaceId}/conversations`, undefined, token),
  getConversation: (workspaceId: string, id: string, token: string) =>
    request<any>('GET', `/workspaces/${workspaceId}/conversations/${id}`, undefined, token),
  createConversation: (workspaceId: string, data: any, token: string) =>
    request<any>('POST', `/workspaces/${workspaceId}/conversations`, data, token),
  sendMessage: (workspaceId: string, conversationId: string, content: string, token: string) =>
    request<any>('POST', `/workspaces/${workspaceId}/conversations/${conversationId}/messages`, { content }, token),
  markRead: (workspaceId: string, conversationId: string, token: string) =>
    request<{ success: boolean }>('POST', `/workspaces/${workspaceId}/conversations/${conversationId}/read`, undefined, token),

  // ── Channels ──
  listChannels: (workspaceId: string, token: string) =>
    request<any[]>('GET', `/workspaces/${workspaceId}/channels`, undefined, token),
  getChannel: (workspaceId: string, channelId: string, token: string) =>
    request<any>('GET', `/workspaces/${workspaceId}/channels/${channelId}`, undefined, token),
  createChannel: (workspaceId: string, data: { name: string; description?: string; isPrivate?: boolean; memberIds?: string[] }, token: string) =>
    request<any>('POST', `/workspaces/${workspaceId}/channels`, data, token),
  updateChannel: (workspaceId: string, channelId: string, data: any, token: string) =>
    request<any>('PATCH', `/workspaces/${workspaceId}/channels/${channelId}`, data, token),
  archiveChannel: (workspaceId: string, channelId: string, token: string) =>
    request<{ success: boolean }>('DELETE', `/workspaces/${workspaceId}/channels/${channelId}`, undefined, token),
  joinChannel: (workspaceId: string, channelId: string, token: string) =>
    request<{ success: boolean }>('POST', `/workspaces/${workspaceId}/channels/${channelId}/join`, undefined, token),
  leaveChannel: (workspaceId: string, channelId: string, token: string) =>
    request<{ success: boolean }>('POST', `/workspaces/${workspaceId}/channels/${channelId}/leave`, undefined, token),
  addChannelMember: (workspaceId: string, channelId: string, userId: string, token: string) =>
    request<{ success: boolean }>('POST', `/workspaces/${workspaceId}/channels/${channelId}/members`, { userId }, token),
  removeChannelMember: (workspaceId: string, channelId: string, userId: string, token: string) =>
    request<{ success: boolean }>('DELETE', `/workspaces/${workspaceId}/channels/${channelId}/members/${userId}`, undefined, token),
  listChannelMembers: (workspaceId: string, channelId: string, token: string) =>
    request<any[]>('GET', `/workspaces/${workspaceId}/channels/${channelId}/members`, undefined, token),

  // ── Channel Messages ──
  listMessages: (workspaceId: string, channelId: string, token: string, cursor?: string, limit = 50) =>
    request<{ messages: any[]; nextCursor: string | null }>('GET', `/workspaces/${workspaceId}/channels/${channelId}/messages?${cursor ? `cursor=${cursor}&` : ''}limit=${limit}`, undefined, token),
  sendChannelMessage: (workspaceId: string, channelId: string, data: { content: string; replyToId?: string; attachments?: any[] }, token: string) =>
    request<any>('POST', `/workspaces/${workspaceId}/channels/${channelId}/messages`, data, token),
  editMessage: (workspaceId: string, channelId: string, messageId: string, content: string, token: string) =>
    request<any>('PATCH', `/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}`, { content }, token),
  deleteMessage: (workspaceId: string, channelId: string, messageId: string, token: string) =>
    request<{ success: boolean }>('DELETE', `/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}`, undefined, token),
  getThread: (workspaceId: string, channelId: string, messageId: string, token: string) =>
    request<any[]>('GET', `/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}/thread`, undefined, token),
  pinMessage: (workspaceId: string, channelId: string, messageId: string, token: string) =>
    request<{ success: boolean }>('POST', `/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}/pin`, undefined, token),
  unpinMessage: (workspaceId: string, channelId: string, messageId: string, token: string) =>
    request<{ success: boolean }>('DELETE', `/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}/pin`, undefined, token),
  listPins: (workspaceId: string, channelId: string, token: string) =>
    request<any[]>('GET', `/workspaces/${workspaceId}/channels/${channelId}/pins`, undefined, token),
  markChannelRead: (workspaceId: string, channelId: string, token: string) =>
    request<{ success: boolean }>('POST', `/workspaces/${workspaceId}/channels/${channelId}/read`, undefined, token),

  // ── Reactions ──
  addReaction: (workspaceId: string, channelId: string, messageId: string, emoji: string, token: string) =>
    request<any>('POST', `/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}/reactions`, { emoji }, token),
  removeReaction: (workspaceId: string, channelId: string, messageId: string, emoji: string, token: string) =>
    request<{ success: boolean }>('DELETE', `/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, undefined, token),

  // ── Bookmarks ──
  addBookmark: (workspaceId: string, messageId: string, token: string) =>
    request<{ success: boolean }>('POST', `/workspaces/${workspaceId}/messages/${messageId}/bookmark`, undefined, token),
  removeBookmark: (workspaceId: string, messageId: string, token: string) =>
    request<{ success: boolean }>('DELETE', `/workspaces/${workspaceId}/messages/${messageId}/bookmark`, undefined, token),
  listBookmarks: (workspaceId: string, token: string) =>
    request<any[]>('GET', `/workspaces/${workspaceId}/bookmarks`, undefined, token),

  // ── Search ──
  search: (workspaceId: string, params: { q: string; type?: string; channelId?: string; from?: string; before?: string; after?: string }, token: string) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null) as [string, string][]).toString();
    return request<any>('GET', `/workspaces/${workspaceId}/search?${q}`, undefined, token);
  },

  // ── Presence ──
  setPresence: (workspaceId: string, data: { status: string; statusText?: string; statusEmoji?: string; expiresAt?: string }, token: string) =>
    request<any>('PATCH', `/workspaces/${workspaceId}/presence`, data, token),
  listPresence: (workspaceId: string, token: string) =>
    request<any[]>('GET', `/workspaces/${workspaceId}/presence`, undefined, token),

  // ── DMs ──
  listDMs: (workspaceId: string, token: string) =>
    request<any[]>('GET', `/workspaces/${workspaceId}/dm`, undefined, token),
  startDM: (workspaceId: string, userIds: string[], token: string) =>
    request<any>('POST', `/workspaces/${workspaceId}/dm`, { userIds }, token),

  // ── Polls ──
  createPoll: (workspaceId: string, channelId: string, data: { question: string; options: string[]; anonymous?: boolean; multiple?: boolean }, token: string) =>
    request<any>('POST', `/workspaces/${workspaceId}/channels/${channelId}/polls`, data, token),
  votePoll: (workspaceId: string, pollId: string, optionIds: string[], token: string) =>
    request<any>('POST', `/workspaces/${workspaceId}/polls/${pollId}/vote`, { optionIds }, token),
  getPoll: (workspaceId: string, pollId: string, token: string) =>
    request<any>('GET', `/workspaces/${workspaceId}/polls/${pollId}`, undefined, token),

  // ── Notifications ──
  listNotifications: (workspaceId: string, token: string) =>
    request<any[]>('GET', `/workspaces/${workspaceId}/notifications`, undefined, token),
  setNotificationPreference: (workspaceId: string, channelId: string, level: string, token: string) =>
    request<{ success: boolean }>('POST', `/workspaces/${workspaceId}/notifications/preferences`, { channelId, level }, token),
  markNotificationRead: (workspaceId: string, notifId: string, token: string) =>
    request<{ success: boolean }>('PATCH', `/workspaces/${workspaceId}/notifications/${notifId}/read`, undefined, token),

  // ── Link Preview ──
  linkPreview: async (workspaceId: string, url: string, token: string) =>
    fetch(`${API_BASE_URL}/workspaces/${workspaceId}/link-preview?url=${encodeURIComponent(url)}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()),

  // ── Forward Message ──
  forwardMessage: async (workspaceId: string, messageId: string, targetChannelId: string, comment: string | undefined, token: string) =>
    fetch(`${API_BASE_URL}/workspaces/${workspaceId}/messages/${messageId}/forward`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetChannelId, comment })
    }).then(r => r.json()),

  // ── Slash Commands ──
  slashCommand: async (workspaceId: string, command: string, args: string, channelId: string, token: string) =>
    fetch(`${API_BASE_URL}/workspaces/${workspaceId}/slash-command`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, args, channelId })
    }).then(r => r.json()),

  // ── Huddles ──
  startHuddle: async (workspaceId: string, channelId: string, token: string) =>
    fetch(`${API_BASE_URL}/workspaces/${workspaceId}/channels/${channelId}/huddle/start`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()),
  joinHuddle: async (workspaceId: string, channelId: string, token: string) =>
    fetch(`${API_BASE_URL}/workspaces/${workspaceId}/channels/${channelId}/huddle/join`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()),
  leaveHuddle: async (workspaceId: string, channelId: string, token: string) =>
    fetch(`${API_BASE_URL}/workspaces/${workspaceId}/channels/${channelId}/huddle/leave`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()),
  getHuddle: async (workspaceId: string, channelId: string, token: string) =>
    fetch(`${API_BASE_URL}/workspaces/${workspaceId}/channels/${channelId}/huddle`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()),

  // ── Scheduled Messages ──
  getScheduledMessages: async (workspaceId: string, token: string) =>
    fetch(`${API_BASE_URL}/workspaces/${workspaceId}/scheduled-messages`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()),
  cancelScheduledMessage: async (workspaceId: string, messageId: string, token: string) =>
    fetch(`${API_BASE_URL}/workspaces/${workspaceId}/scheduled-messages/${messageId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()),

  // ── File Upload ──
  uploadFile: async (workspaceId: string, file: File, token: string): Promise<any> => {
    const form = new FormData();
    form.append('file', file);
    const resp = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/workspaces/${workspaceId}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!resp.ok) throw new Error('Upload failed');
    return resp.json();
  },
};

// ── Calendar API ──────────────────────────────────────────────
export const calendarApi = {
  listMeetings: (workspaceId: string, token: string) =>
    request<any[]>('GET', `/workspaces/${workspaceId}/meetings`, undefined, token),

  createMeeting: (workspaceId: string, data: any, token: string) =>
    request<any>('POST', `/workspaces/${workspaceId}/meetings`, data, token),

  listEvents: (workspaceId: string, token: string) =>
    request<any[]>('GET', `/workspaces/${workspaceId}/calendar`, undefined, token),

  createEvent: (workspaceId: string, data: any, token: string) =>
    request<any>('POST', `/workspaces/${workspaceId}/calendar`, data, token),
};

// ── Approvals API ───────────────────────────────────────────
export const approvalApi = {
  list: (workspaceId: string, token: string) =>
    request<any[]>('GET', `/workspaces/${workspaceId}/approvals`, undefined, token),

  create: (workspaceId: string, data: any, token: string) =>
    request<any>('POST', `/workspaces/${workspaceId}/approvals`, data, token),

  review: (workspaceId: string, id: string, decision: string, reason?: string, token?: string) =>
    request<any>('PATCH', `/workspaces/${workspaceId}/approvals/${id}/review`, { decision, reason }, token),
};

// ── Billing API ───────────────────────────────────────────────
export const billingApi = {
  getSubscription: (token: string) =>
    request<any>('GET', '/billing', undefined, token),

  getPlans: (token: string) =>
    request<any[]>('GET', '/billing/plans', undefined, token),

  checkout: (plan: string, workspaceId?: string, token?: string) =>
    request<any>('POST', '/billing/checkout', { plan, workspaceId }, token),

  cancel: (token: string) =>
    request<any>('POST', '/billing/cancel', undefined, token),
};

// ── Admin API ─────────────────────────────────────────────────
export const adminApi = {
  getStats: (token: string) =>
    request<any>('GET', '/admin/stats', undefined, token),

  getUsers: (page: number, limit: number, token: string) =>
    request<any>('GET', `/admin/users?page=${page}&limit=${limit}`, undefined, token),

  getAuditLogs: (page: number, limit: number, token: string) =>
    request<any>('GET', `/admin/audit-logs?page=${page}&limit=${limit}`, undefined, token),

  getRevenue: (token: string) =>
    request<any[]>('GET', '/admin/revenue', undefined, token),

  getHealth: (token: string) =>
    request<any[]>('GET', '/admin/health', undefined, token),
};

export { API_BASE_URL, ApiError };
