import { useCallback, useState, useEffect, useRef } from 'react';

interface ConversationTurn {
  speaker: string;
  text: string;
  timestamp: number;
}

interface AgentMind {
  mood: 'chill' | 'focused' | 'worried' | 'excited';
  talkCount: number;
  lastTopic: string;
}

interface AgentDef {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  skills: string[];
  personality: 'direct' | 'analytical' | 'creative' | 'concise' | 'diplomatic';
  voiceLang: string;
  // Domain keywords this agent cares about
  domainKeywords: string[];
  // Phrases this agent uses to start responses
  openers: string[];
}

const AGENTS: AgentDef[] = [
  {
    id: 'ai-aria', name: 'Aria', role: 'Senior Developer', avatar: 'AR', color: '#C4623E',
    skills: ['React', 'TypeScript', 'Code Review', 'Architecture'],
    personality: 'direct', voiceLang: 'en-IN',
    domainKeywords: ['frontend', 'react', 'typescript', 'component', 'code review', 'pr', 'pull request', 'hook', 'state', 'render', 'bug', 'fix', 'console error', 'build failed', 'lint', 'test', 'jest', 'cypress', 'merge', 'branch', 'commit'],
    openers: ['So,', 'Honestly,', 'Look,', 'Right,', 'Okay so', 'Hmm.'],
  },
  {
    id: 'ai-sage', name: 'Sage', role: 'Backend Developer', avatar: 'SA', color: '#237b4b',
    skills: ['Database', 'API Design', 'GraphQL', 'PostgreSQL'],
    personality: 'analytical', voiceLang: 'en-GB',
    domainKeywords: ['api', 'database', 'db', 'postgres', 'sql', 'graphql', 'endpoint', 'migration', 'schema', 'query', 'backend', 'server', 'model', 'table', 'index', 'performance', 'slow query', 'cache', 'redis', 'orm', 'seed'],
    openers: ['From a technical perspective,', 'The data suggests', 'I\'ve reviewed the schema, and', 'Statistically speaking,', 'If we analyze this,'],
  },
  {
    id: 'ai-pixel', name: 'Pixel', role: 'Designer', avatar: 'PX', color: '#c4314b',
    skills: ['UI/UX', 'Figma', 'Accessibility', 'Prototyping'],
    personality: 'creative', voiceLang: 'en-US',
    domainKeywords: ['design', 'ui', 'ux', 'figma', 'mockup', 'screen', 'layout', 'color', 'font', 'typography', 'icon', 'component library', 'accessibility', 'a11y', 'responsive', 'mobile', 'breakpoint', 'theme', 'dark mode', 'user flow', 'wireframe', 'prototype'],
    openers: ['So here\'s the thing,', 'From a design perspective,', 'I was thinking...', 'Visually speaking,', 'What if we tried'],
  },
  {
    id: 'ai-echo', name: 'Echo', role: 'DevOps Engineer', avatar: 'EC', color: '#D97757',
    skills: ['CI/CD', 'Infrastructure', 'AWS', 'Security'],
    personality: 'concise', voiceLang: 'en-AU',
    domainKeywords: ['deploy', 'deployment', 'pipeline', 'ci', 'cd', 'jenkins', 'github action', 'docker', 'kubernetes', 'k8s', 'aws', 'ec2', 's3', 'cloudfront', 'infra', 'terraform', 'monitoring', 'alert', 'incident', 'rollback', 'production', 'staging', 'health check', 'uptime', 'latency', 'log', 'crash'],
    openers: ['Quick note.', 'Status update:', 'Looking at the dashboard,', 'Pipeline shows', 'Infrastructure-wise,'],
  },
  {
    id: 'ai-manager', name: 'Kai', role: 'Project Manager', avatar: 'KA', color: '#0891b2',
    skills: ['Planning', 'Reporting', 'Agile', 'Risk Management'],
    personality: 'diplomatic', voiceLang: 'en-IN',
    domainKeywords: ['sprint', 'timeline', 'deadline', 'milestone', 'scope', 'resource', 'budget', 'risk', ' stakeholder', 'client', 'delivery', 'retro', 'retrospective', 'standup', 'planning', ' grooming', 'velocity', 'capacity', 'blocker', 'escalation', 'prioritize', 'quarter', 'okr', 'goal'],
    openers: ['I hear you.', 'Let\'s take a step back.', 'From a planning perspective,', 'To align the team,', 'Looking at the bigger picture,'],
  },
];

/* ═══════════════════════════════════════════════════
   KNOWLEDGE BASE — Each agent's expertise
   ═════════════════════════════════════════════════== */

const KNOWLEDGE: Record<string, string> = {
  sprint: 'Sprint 14 is at 73% completion. Velocity: 42 pts. 8 story points remaining across 4 stories. Multi-state tax engine is 85% done. Filing wizard is at risk of overrunning.',
  bugs: '2 high priority: TAX-142 (payment validation >$10K — integer overflow, fix in progress), TAX-138 (race condition in concurrent filing). 3 medium UI glitches on mobile Safari. 8 low priority.',
  deploy: 'v2.4.1 deployed 2 hours ago. All green: 142ms p99 latency, 0.02% error rate, 99.97% uptime. v2.4.2 scheduled tonight 11PM with dark mode toggle and tax rate cache fix.',
  design: 'Design system v3 at 94% complete. Dark mode tokens, 12 new icons, mobile nav pattern in. Filing wizard has 3 variants being user-tested. Accessibility audit: 12 issues found, 9 fixed.',
  security: 'MFA compliance 100%, 8 policies active, 0 critical alerts. One flagged login from unfamiliar IP at 3AM (passed MFA). SOC2 Type II audit on track for Q3.',
  performance: 'Build time: 4.5 min. Bundle size: 1.2MB gzipped. API p99: 142ms. Database query avg: 12ms. Frontend LCP: 1.8s. Room for improvement on bundle splitting.',
  team: '9 people total. Engineering: 5 devs, 1 QA. Design: 1. DevOps: 1. PM: 1. 5 AI agents. No one is on PTO this week.',
};

function createMind(): AgentMind {
  return { mood: 'chill', talkCount: 0, lastTopic: '' };
}

/* ═════════════════════════════════════════════════==
   AGENT RESPONSES — Unique to each personality
   ═════════════════════════════════════════════════== */

function respond(agent: AgentDef, topic: string, mind: AgentMind): string {
  const opener = agent.openers[Math.floor(Math.random() * agent.openers.length)];
  const info = KNOWLEDGE[topic] || KNOWLEDGE['general'];

  switch (agent.personality) {
    case 'direct': // Aria — no-nonsense, gets to the point
      return `${opener} ${info} What's your call on next steps?`;

    case 'analytical': // Sage — data-driven, thorough
      return `${opener} ${info} I've cross-referenced this with our historical data and the pattern is consistent with our Q2 baseline. Shall I prepare a detailed breakdown?`;

    case 'creative': // Pixel — visual, idea-oriented
      return `${opener} ${info} I'm leaning toward option B for the visual approach — it tests better with users and gives us more flexibility. But I'd love to hear what the team thinks before I finalize the mockups.`;

    case 'concise': // Echo — brief, status-focused
      return `${opener} ${info} All systems nominal. I'll keep monitoring and flag if anything changes.`;

    case 'diplomatic': // Kai — balanced, brings people together
      return `${opener} ${info} I want to make sure we're all aligned on priorities here. Should I schedule a 15-minute sync to decide on next steps, or are we good to proceed?`;

    default:
      return `${opener} ${info}`;
  }
}

/* ═════════════════════════════════════════════════==
   SHOULD THIS AGENT SPEAK?
   Based on their domain expertise and personality
   ═════════════════════════════════════════════════== */

function shouldAgentSpeak(
  agent: AgentDef,
  text: string,
  mind: AgentMind,
  msSinceTheySpoke: number,
  addressedByName: boolean,
): boolean {
  if (msSinceTheySpoke < 4000) return false; // Just spoke

  const t = text.toLowerCase();

  // Called by name → always respond
  const nameMatch = agent.name.toLowerCase() === 'kai'
    ? t.match(/\bkai\b/)
    : t.match(new RegExp(`\\b${agent.name.toLowerCase()}[a-z]*\\b`));
  if (addressedByName || nameMatch) return true;

  // Topic matches their domain
  const topicMatch = agent.domainKeywords.some(kw => t.includes(kw));
  if (topicMatch) {
    // Each personality has different willingness to jump in
    const chance = agent.personality === 'concise' ? 0.5 :
                   agent.personality === 'diplomatic' ? 0.6 :
                   agent.personality === 'analytical' ? 0.7 :
                   agent.personality === 'creative' ? 0.75 : 0.8;
    if (Math.random() < chance && mind.talkCount < 4) return true;
  }

  // Direct question in their domain
  const isQuestion = t.match(/\b(what|how|why|when|should we|can you|do you know)\b/);
  if (isQuestion && topicMatch && mind.talkCount < 3) return true;

  return false;
}

/* ═════════════════════════════════════════════════==
   MAIN HOOK
   ═════════════════════════════════════════════════== */

export function useClawbot() {
  const minds = useRef<Record<string, AgentMind>>({});
  const history = useRef<Record<string, ConversationTurn[]>>({});
  const lastSpokeAt = useRef<Record<string, number>>({});

  const getAgents = useCallback(() => AGENTS, []);

  const answerQuestion = useCallback((agentId: string, question: string, _ctx: string): string => {
    const agent = AGENTS.find(a => a.id === agentId);
    if (!agent) return '';
    const mind = minds.current[agentId] || createMind();
    minds.current[agentId] = mind;
    mind.talkCount++;
    const topic = extractTopic(question);
    const response = respond(agent, topic, mind);
    mind.lastTopic = topic;
    return response;
  }, []);

  const shouldRespond = useCallback((agentId: string, speaker: string, text: string, timeSince: number): { should: boolean; reason: string; query: string } => {
    const agent = AGENTS.find(a => a.id === agentId);
    if (!agent) return { should: false, reason: 'unknown_agent', query: '' };
    const mind = minds.current[agentId] || createMind();
    minds.current[agentId] = mind;

    const addressed = text.toLowerCase().includes(agent.name.toLowerCase());
    if (shouldAgentSpeak(agent, text, mind, timeSince, addressed)) {
      mind.talkCount++;
      return { should: true, reason: addressed ? 'called_by_name' : 'domain_expertise', query: text };
    }
    return { should: false, reason: 'not_my_area', query: '' };
  }, []);

  const joinCall = useCallback((agentId: string, _callId: string, participants: string[]): string => {
    const agent = AGENTS.find(a => a.id === agentId);
    if (!agent) return '';
    minds.current[agentId] = createMind();
    lastSpokeAt.current[agentId] = Date.now();
    const greetings: Record<string, string> = {
      'ai-aria': `Hey! Good to see everyone.`,
      'ai-sage': `Hello. I've reviewed the latest schema changes — looks solid.`,
      'ai-pixel': `Hey hey! ✨ Ready when you are.`,
      'ai-echo': `All systems green. Monitoring active.`,
      'ai-manager': `Good morning, team. Shall we get started?`,
    };
    return greetings[agentId] || `Hey, I'm ${agent.name}.`;
  }, []);

  const speakInCall = useCallback((agentId: string, trigger: string, _ctx: string): string => {
    const agent = AGENTS.find(a => a.id === agentId);
    if (!agent) return '';
    const mind = minds.current[agentId] || createMind();
    const topic = extractTopic(trigger);
    mind.talkCount++;
    return respond(agent, topic, mind);
  }, []);

  const leaveCall = useCallback((agentId: string): { notes: string[]; actionItems: string[]; summary: string } => {
    const h = history.current[agentId] || [];
    const myMessages = h.filter(t => t.speaker === 'Aria (AI)').map(t => t.text);
    return {
      notes: myMessages.slice(0, 5).map((s, i) => `${i + 1}. ${s.substring(0, 100)}...`),
      actionItems: ['Review notes', 'Assign action items'],
      summary: `${AGENTS.find(a => a.id === agentId)?.name || 'Agent'} contributed ${myMessages.length} times.`,
    };
  }, []);

  const generateCallNotes = useCallback((text: string): { notes: string[]; actionItems: string[]; summary: string } => {
    const lines = text.split('\n').filter(l => l.trim());
    const speakers = new Set<string>();
    const points: string[] = [];
    lines.forEach(l => { const m = l.match(/^(.+?):\s*(.+)$/); if (m) { speakers.add(m[1].trim()); const c = m[2].trim(); if (c.length > 10) points.push(c.substring(0, 120)); } });
    return { notes: points.slice(0, 5).map((p, i) => `${i + 1}. ${p}...`), actionItems: ['Review notes', 'Assign owners'], summary: `${speakers.size} participants, ${lines.length} exchanges.` };
  }, []);

  return { agents: AGENTS, answerQuestion, shouldRespond, joinCall, speakInCall, leaveCall, generateCallNotes, getAllAgents: getAgents };
}

function extractTopic(text: string): string {
  const t = text.toLowerCase();
  if (t.match(/sprint|velocity|timeline|deadline|planning|retro|standup|grooming|capacity|milestone/)) return 'sprint';
  if (t.match(/bug|issue|fix|error|crash|broken|defect|regression/)) return 'bugs';
  if (t.match(/deploy|deployment|pipeline|release|production|staging|ci|cd|docker|k8s|aws|infra|monitoring|health|uptime|latency|incident|rollback|alert/)) return 'deploy';
  if (t.match(/design|ui|ux|figma|mockup|screen|layout|color|font|icon|theme|dark mode|accessibility|responsive|prototype|wireframe|visual/)) return 'design';
  if (t.match(/security|auth|login|mfa|audit|vulnerability|pen|password|zero trust|compliance|soc2/)) return 'security';
  if (t.match(/frontend|react|typescript|component|hook|state|render|javascript|html|css|jsx|tsx|npm|webpack|vite/)) return 'frontend';
  if (t.match(/api|database|db|postgres|sql|graphql|endpoint|schema|query|backend|server|model|table|index|orm|redis|migration/)) return 'backend';
  if (t.match(/performance|slow|speed|optimize|cache|memory|cpu|bundle|load time/)) return 'performance';
  if (t.match(/team|resource|budget|stakeholder|client|delivery|okr|goal|quarter/)) return 'team';
  return 'general';
}
