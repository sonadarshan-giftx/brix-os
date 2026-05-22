import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, ChevronRight, ChevronDown, FileText, Folder, FolderOpen,
  Bold, Italic, Underline, Strikethrough, Link, Image, Table,
  List, ListOrdered, CheckSquare, Code, Code2, AlignLeft, Quote,
  Type, Palette, Hash, AtSign, Smile, Minus, MoreHorizontal,
  Share2, Eye, Edit3, Clock, Users, Tag, MessageSquare, X,
  ChevronLeft, History, Download, Copy, Move, Trash2, Lock,
  Info, AlertTriangle, CheckCircle, Star, Bookmark, ExternalLink,
  Heading1, Heading2, Heading3, GitBranch, Terminal, Database,
  ArrowRight, Send, ThumbsUp, CornerDownRight, Check,
  FileDown, FilePen, Globe,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DocPage {
  id: string;
  title: string;
  content: string;
  space: string;
  parentId?: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  views: number;
  labels: string[];
  contributors: Contributor[];
  commentCount: number;
  versionCount: number;
}

interface Contributor {
  name: string;
  initials: string;
  color: string;
}

interface TreeNode {
  id: string;
  title: string;
  type: 'folder' | 'page';
  children?: TreeNode[];
  pageId?: string;
}

interface DocSpace {
  id: string;
  name: string;
  initials: string;
  color: string;
}

interface Comment {
  id: string;
  author: Contributor;
  content: string;
  timestamp: string;
  replies: Comment[];
  resolved: boolean;
}

type ParagraphStyle = 'Normal' | 'H1' | 'H2' | 'H3' | 'Code Block' | 'Quote';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const SPACES: DocSpace[] = [
  { id: 'eng', name: 'Engineering Docs', initials: 'ED', color: '#3b82f6' },
  { id: 'prod', name: 'Product Wiki', initials: 'PW', color: '#8b5cf6' },
  { id: 'onboard', name: 'Onboarding', initials: 'OB', color: '#10b981' },
  { id: 'arch', name: 'Architecture', initials: 'AR', color: '#f59e0b' },
  { id: 'api', name: 'API Reference', initials: 'API', color: '#ef4444' },
  { id: 'meetings', name: 'Meeting Notes', initials: 'MN', color: '#06b6d4' },
  { id: 'hr', name: 'HR & Policies', initials: 'HR', color: '#ec4899' },
];

const PAGE_TREE: TreeNode[] = [
  {
    id: 'gs', title: 'Getting Started', type: 'folder',
    children: [
      { id: 'intro', title: 'Introduction', type: 'page', pageId: 'intro' },
      { id: 'qs', title: 'Quick Start', type: 'page', pageId: 'quickstart' },
      { id: 'install', title: 'Installation', type: 'page', pageId: 'install' },
    ],
  },
  {
    id: 'arch-folder', title: 'Architecture', type: 'folder',
    children: [
      { id: 'sysoverview', title: 'System Overview', type: 'page', pageId: 'sysoverview' },
      { id: 'apidesign', title: 'API Design', type: 'page', pageId: 'apidesign' },
      { id: 'dbschema', title: 'Database Schema', type: 'page', pageId: 'dbschema' },
    ],
  },
  {
    id: 'dev', title: 'Development', type: 'folder',
    children: [
      { id: 'codestd', title: 'Code Standards', type: 'page', pageId: 'codestd' },
      { id: 'git', title: 'Git Workflow', type: 'page', pageId: 'git' },
      { id: 'testing', title: 'Testing Guide', type: 'page', pageId: 'testing' },
    ],
  },
  {
    id: 'deploy', title: 'Deployment', type: 'folder',
    children: [
      { id: 'cicd', title: 'CI/CD Pipeline', type: 'page', pageId: 'cicd' },
      { id: 'envs', title: 'Environments', type: 'page', pageId: 'envs' },
    ],
  },
];

const RECENT_PAGES = [
  { id: 'git', title: 'Git Workflow', space: 'Engineering Docs', time: '2h ago' },
  { id: 'sysoverview', title: 'System Overview', space: 'Architecture', time: '1d ago' },
  { id: 'apidesign', title: 'API Design', space: 'API Reference', time: '3d ago' },
];

const MOCK_CONTRIBUTORS: Contributor[] = [
  { name: 'Sonadarshan', initials: 'SD', color: '#D97757' },
  { name: 'Priya K', initials: 'PK', color: '#3b82f6' },
  { name: 'Ravi M', initials: 'RM', color: '#10b981' },
];

const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1',
    author: { name: 'Priya K', initials: 'PK', color: '#3b82f6' },
    content: 'Should we add a section on distributed tracing here? Would be really helpful for debugging microservices.',
    timestamp: '1 hour ago',
    resolved: false,
    replies: [
      {
        id: 'c1r1',
        author: { name: 'Sonadarshan', initials: 'SD', color: '#D97757' },
        content: 'Good point! I\'ll add that in the next update. We can reference the OpenTelemetry setup.',
        timestamp: '45 min ago',
        resolved: false,
        replies: [],
      },
    ],
  },
  {
    id: 'c2',
    author: { name: 'Ravi M', initials: 'RM', color: '#10b981' },
    content: 'The database connection pooling section needs to be updated with the new PgBouncer config.',
    timestamp: '3 hours ago',
    resolved: true,
    replies: [],
  },
];

const PAGES_CONTENT: Record<string, DocPage> = {
  sysoverview: {
    id: 'sysoverview',
    title: 'System Overview',
    content: 'system-overview',
    space: 'Architecture',
    createdBy: 'Sonadarshan',
    createdAt: 'Jan 15, 2025',
    updatedBy: 'Sonadarshan',
    updatedAt: '2 hours ago',
    views: 284,
    labels: ['architecture', 'microservices', 'system-design'],
    contributors: MOCK_CONTRIBUTORS,
    commentCount: 2,
    versionCount: 12,
  },
  git: {
    id: 'git',
    title: 'Git Workflow',
    content: 'git-workflow',
    space: 'Engineering Docs',
    createdBy: 'Ravi M',
    createdAt: 'Feb 3, 2025',
    updatedBy: 'Priya K',
    updatedAt: '1 day ago',
    views: 156,
    labels: ['git', 'workflow', 'standards'],
    contributors: [MOCK_CONTRIBUTORS[1], MOCK_CONTRIBUTORS[2]],
    commentCount: 5,
    versionCount: 8,
  },
  apidesign: {
    id: 'apidesign',
    title: 'API Design',
    content: 'api-design',
    space: 'API Reference',
    createdBy: 'Sonadarshan',
    createdAt: 'Dec 10, 2024',
    updatedBy: 'Sonadarshan',
    updatedAt: '3 days ago',
    views: 412,
    labels: ['api', 'rest', 'graphql', 'standards'],
    contributors: MOCK_CONTRIBUTORS,
    commentCount: 7,
    versionCount: 23,
  },
};

const TEMPLATES = [
  { id: 'meeting', title: 'Meeting Notes', icon: '📅', desc: 'Agenda, decisions, action items' },
  { id: 'proposal', title: 'Project Proposal', icon: '📋', desc: 'Goals, scope, timeline, stakeholders' },
  { id: 'rfc', title: 'Technical RFC', icon: '🔧', desc: 'Problem, proposal, alternatives, decisions' },
  { id: 'retro', title: 'Sprint Retrospective', icon: '🔄', desc: 'Went well, improve, action items' },
  { id: 'adr', title: 'Architecture Decision Record', icon: '🏗️', desc: 'Context, decision, consequences' },
  { id: 'howto', title: 'How-To Guide', icon: '📖', desc: 'Step-by-step instructions' },
  { id: 'blank', title: 'Blank Page', icon: '📄', desc: 'Start from scratch' },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function SpaceAvatar({ space, size = 28 }: { space: DocSpace; size?: number }) {
  return (
    <div
      className="rounded flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, background: space.color, fontSize: size * 0.35 }}
    >
      {space.initials}
    </div>
  );
}

function ContributorAvatar({ c, size = 28 }: { c: Contributor; size?: number }) {
  return (
    <div
      title={c.name}
      className="rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 border-2 border-white"
      style={{ width: size, height: size, background: c.color, fontSize: size * 0.38 }}
    >
      {c.initials}
    </div>
  );
}

function TreeItem({
  node,
  depth,
  selectedPageId,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selectedPageId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(depth === 0);

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 w-full text-left px-2 py-1 rounded hover:bg-white/10 text-sm text-white/80 hover:text-white transition-colors"
          style={{ paddingLeft: 8 + depth * 12 }}
        >
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          {open ? <FolderOpen size={14} className="text-yellow-400 flex-shrink-0" /> : <Folder size={14} className="text-yellow-400 flex-shrink-0" />}
          <span className="truncate">{node.title}</span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              {node.children?.map(child => (
                <TreeItem
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  selectedPageId={selectedPageId}
                  onSelect={onSelect}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const isSelected = node.pageId === selectedPageId;
  return (
    <button
      onClick={() => node.pageId && onSelect(node.pageId)}
      className={`flex items-center gap-1.5 w-full text-left px-2 py-1 rounded text-sm transition-colors ${
        isSelected ? 'bg-[#D97757]/30 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
      }`}
      style={{ paddingLeft: 8 + depth * 12 }}
    >
      <FileText size={13} className="flex-shrink-0 opacity-70" />
      <span className="truncate">{node.title}</span>
    </button>
  );
}

function InfoPanel({ icon: Icon, color, title, children }: { icon: typeof Info; color: string; title: string; children: React.ReactNode }) {
  return (
    <div className={`flex gap-3 p-4 rounded-lg border my-4`} style={{ background: color + '15', borderColor: color + '40' }}>
      <Icon size={18} style={{ color, flexShrink: 0, marginTop: 2 }} />
      <div>
        <p className="font-semibold text-sm mb-1" style={{ color }}>{title}</p>
        <div className="text-sm text-gray-700">{children}</div>
      </div>
    </div>
  );
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-lg overflow-hidden my-4 border border-gray-700">
      <div className="flex items-center justify-between bg-[#2a2a3e] px-4 py-2">
        <span className="text-xs text-gray-400 font-mono">{lang}</span>
        <button onClick={copy} className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
          {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>
      <pre className="bg-[#1e1e2e] text-gray-100 p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function SystemOverviewContent() {
  return (
    <div className="doc-content">
      <h1>System Overview</h1>
      <p className="text-gray-600 text-lg leading-relaxed">
        This document describes the high-level architecture of the Brix platform — a cloud-native,
        microservices-based SaaS product built for enterprise teams.
      </p>

      <InfoPanel icon={Info} color="#3b82f6" title="About this document">
        Last reviewed by the Architecture team on May 15, 2025. For questions, reach out to{' '}
        <span className="text-blue-600 font-medium">@Sonadarshan</span> or post in{' '}
        <span className="text-blue-600 font-medium">#arch-decisions</span>.
      </InfoPanel>

      <h2>Architecture Principles</h2>
      <p>Our architecture is guided by four core principles:</p>
      <ul>
        <li><strong>Event-driven by default</strong>: Services communicate asynchronously via Kafka where latency allows.</li>
        <li><strong>API-first design</strong>: Every capability is exposed as a versioned REST or GraphQL API.</li>
        <li><strong>Zero-trust security</strong>: All service-to-service calls are authenticated and authorized via mTLS + RBAC.</li>
        <li><strong>Observable by design</strong>: Every service emits traces, metrics, and structured logs.</li>
      </ul>

      <h2>High-Level Architecture</h2>
      <p>The Brix platform consists of the following major layers:</p>

      <h3>Frontend Layer</h3>
      <p>
        A React 19 + TypeScript SPA served from Cloudflare CDN. The frontend communicates exclusively
        with the API Gateway — no direct service calls from the browser.
      </p>

      <h3>API Gateway</h3>
      <p>
        Kong-based gateway handling authentication, rate limiting, request routing, and API versioning.
        All external traffic enters through this single point.
      </p>
      <CodeBlock lang="yaml" code={`# Kong route config example
routes:
  - name: projects-api
    paths:
      - /api/v1/projects
    plugins:
      - name: jwt
      - name: rate-limiting
        config:
          minute: 1000
          policy: local`} />

      <h3>Core Microservices</h3>
      <div className="overflow-x-auto my-4">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Service</th>
              <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Language</th>
              <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Responsibility</th>
              <th className="border border-gray-200 px-4 py-2 text-left font-semibold">DB</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['auth-service', 'Go', 'JWT issuance, OAuth, SSO', 'Redis + Postgres'],
              ['projects-service', 'Node.js', 'Project CRUD, permissions', 'Postgres'],
              ['tickets-service', 'Python', 'Ticket management, workflows', 'Postgres + Elasticsearch'],
              ['notifications-service', 'Go', 'Email, push, webhooks', 'Redis'],
              ['ai-service', 'Python', 'LLM calls, embeddings, agents', 'Postgres + Pinecone'],
              ['docs-service', 'Node.js', 'Documentation, versioning', 'Postgres + S3'],
            ].map(([svc, lang, resp, db]) => (
              <tr key={svc} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-4 py-2 font-mono text-blue-600">{svc}</td>
                <td className="border border-gray-200 px-4 py-2">{lang}</td>
                <td className="border border-gray-200 px-4 py-2 text-gray-600">{resp}</td>
                <td className="border border-gray-200 px-4 py-2 text-gray-500">{db}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Data Flow</h2>
      <p>A typical user action (e.g., creating a ticket) flows as follows:</p>
      <ol>
        <li>Browser sends <code>POST /api/v1/tickets</code> to the API Gateway.</li>
        <li>Gateway validates JWT, applies rate limits, routes to <code>tickets-service</code>.</li>
        <li><code>tickets-service</code> writes to Postgres and publishes a <code>ticket.created</code> event to Kafka.</li>
        <li><code>notifications-service</code> consumes the event and sends email/push to assignees.</li>
        <li><code>ai-service</code> consumes the event to run auto-labeling and priority prediction.</li>
      </ol>

      <InfoPanel icon={AlertTriangle} color="#f59e0b" title="Known limitation">
        The Kafka consumer in <code>ai-service</code> currently has no dead-letter queue. Events that fail
        processing are silently dropped. Tracked in <span className="text-blue-600 font-medium">ARCH-142</span>.
      </InfoPanel>

      <h2>Infrastructure</h2>
      <p>All services run on Kubernetes (EKS, us-east-1 + eu-west-1) with:</p>
      <ul>
        <li>Horizontal pod autoscaling based on CPU + custom Kafka lag metrics</li>
        <li>Istio service mesh for mTLS and traffic management</li>
        <li>ArgoCD for GitOps deployments</li>
        <li>Prometheus + Grafana for metrics, Jaeger for distributed tracing</li>
      </ul>

      <InfoPanel icon={CheckCircle} color="#10b981" title="SLA">
        Core APIs maintain a 99.9% uptime SLA. The AI service has a separate 99.5% SLA due to
        external LLM provider dependencies.
      </InfoPanel>
    </div>
  );
}

function GitWorkflowContent() {
  return (
    <div className="doc-content">
      <h1>Git Workflow</h1>
      <p className="text-gray-600 text-lg">
        Our branching strategy and PR process for maintaining a clean, deployable main branch at all times.
      </p>

      <h2>Branch Strategy</h2>
      <p>We follow a <strong>trunk-based development</strong> model with short-lived feature branches:</p>
      <CodeBlock lang="bash" code={`# Create a feature branch
git checkout main && git pull
git checkout -b feat/TICK-123-user-auth-flow

# Work, commit, push
git add -p  # stage changes interactively
git commit -m "feat(auth): add OAuth2 callback handler"
git push -u origin feat/TICK-123-user-auth-flow`} />

      <h3>Branch Naming Convention</h3>
      <div className="overflow-x-auto my-4">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-2 text-left">Type</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Pattern</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Example</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Feature', 'feat/TICK-{id}-{slug}', 'feat/TICK-123-user-auth'],
              ['Bug fix', 'fix/TICK-{id}-{slug}', 'fix/TICK-456-login-crash'],
              ['Hotfix', 'hotfix/{slug}', 'hotfix/null-pointer-prod'],
              ['Chore', 'chore/{slug}', 'chore/upgrade-dependencies'],
              ['Release', 'release/{version}', 'release/v2.4.0'],
            ].map(([type, pattern, example]) => (
              <tr key={type} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-4 py-2 font-medium">{type}</td>
                <td className="border border-gray-200 px-4 py-2 font-mono text-sm text-purple-600">{pattern}</td>
                <td className="border border-gray-200 px-4 py-2 font-mono text-sm text-gray-500">{example}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Commit Message Format</h2>
      <p>We use <strong>Conventional Commits</strong> spec:</p>
      <CodeBlock lang="text" code={`<type>(<scope>): <description>

[optional body]

[optional footer(s)]

# Examples:
feat(auth): add Google SSO integration
fix(tickets): resolve null pointer on empty assignee
docs(api): update rate limit documentation
chore(deps): upgrade React to 19.1.0
refactor(projects): extract permission check to middleware`} />

      <h2>Pull Request Process</h2>
      <ol>
        <li>Open a PR from your feature branch into <code>main</code>.</li>
        <li>Fill in the PR template: summary, testing steps, screenshots (if UI change).</li>
        <li>Ensure all CI checks pass: lint, type-check, unit tests, integration tests.</li>
        <li>Request review from at least <strong>2 team members</strong>.</li>
        <li>Address all review comments (or explicitly resolve with explanation).</li>
        <li>Squash and merge — keep commit history clean.</li>
      </ol>

      <InfoPanel icon={AlertTriangle} color="#f59e0b" title="Do not merge with failing tests">
        Bypassing CI is not allowed even for "trivial" changes. If CI is flaky, fix the test first.
        Open a <code>chore/fix-flaky-test</code> branch and fix it.
      </InfoPanel>

      <h2>Code Review Guidelines</h2>
      <p>When reviewing, check for:</p>
      <ul>
        <li>✅ Correctness: does the code do what it says?</li>
        <li>✅ Tests: are edge cases covered?</li>
        <li>✅ Performance: any N+1 queries, unnecessary re-renders?</li>
        <li>✅ Security: input validation, auth checks, no secrets committed</li>
        <li>✅ Readability: clear naming, not overly clever</li>
      </ul>

      <h2>Release Process</h2>
      <CodeBlock lang="bash" code={`# Cut a release
git checkout main && git pull
git checkout -b release/v2.5.0
# Update CHANGELOG.md, bump version
git tag v2.5.0 -m "Release v2.5.0"
git push origin release/v2.5.0 --tags
# ArgoCD auto-deploys tagged commit to staging, then prod after approval`} />

      <InfoPanel icon={CheckCircle} color="#10b981" title="Automated release notes">
        Our CI pipeline auto-generates release notes from conventional commits using{' '}
        <code>semantic-release</code>. No need to write them manually.
      </InfoPanel>
    </div>
  );
}

function ApiDesignContent() {
  return (
    <div className="doc-content">
      <h1>API Design</h1>
      <p className="text-gray-600 text-lg">
        Guidelines and conventions for designing REST and GraphQL APIs at Brix.
      </p>

      <h2>REST API Conventions</h2>
      <h3>URL Structure</h3>
      <CodeBlock lang="text" code={`# Resource collections (plural nouns)
GET    /api/v1/projects
POST   /api/v1/projects

# Individual resources
GET    /api/v1/projects/:id
PATCH  /api/v1/projects/:id
DELETE /api/v1/projects/:id

# Nested resources (max 1 level deep)
GET    /api/v1/projects/:id/tickets
POST   /api/v1/projects/:id/tickets`} />

      <h3>Response Format</h3>
      <CodeBlock lang="json" code={`{
  "data": {
    "id": "proj_01HX...",
    "type": "project",
    "attributes": {
      "name": "Brix Mobile App",
      "status": "active",
      "createdAt": "2025-01-15T10:30:00Z"
    },
    "relationships": {
      "owner": { "data": { "type": "user", "id": "usr_01HX..." } }
    }
  },
  "meta": {
    "requestId": "req_abc123"
  }
}`} />

      <h3>Error Format</h3>
      <CodeBlock lang="json" code={`{
  "errors": [
    {
      "status": "422",
      "code": "VALIDATION_ERROR",
      "title": "Validation failed",
      "detail": "Name must be between 3 and 100 characters",
      "source": { "pointer": "/data/attributes/name" }
    }
  ]
}`} />

      <h2>Authentication</h2>
      <p>All API calls require a Bearer token in the Authorization header:</p>
      <CodeBlock lang="bash" code={`curl -X GET https://api.brix.dev/v1/projects \\
  -H "Authorization: Bearer eyJhbGci..." \\
  -H "Content-Type: application/json"`} />

      <InfoPanel icon={Info} color="#3b82f6" title="Token types">
        <strong>User tokens</strong> (JWT, 1h expiry) for browser clients.{' '}
        <strong>Service tokens</strong> (long-lived API keys) for server-to-server calls.
        Never use service tokens in frontend code.
      </InfoPanel>

      <h2>Rate Limiting</h2>
      <div className="overflow-x-auto my-4">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-2 text-left">Tier</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Limit</th>
              <th className="border border-gray-200 px-4 py-2 text-left">Window</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Free', '1,000 req', '1 hour'],
              ['Pro', '10,000 req', '1 hour'],
              ['Enterprise', '100,000 req', '1 hour'],
              ['Internal services', 'Unlimited', '—'],
            ].map(([tier, limit, window]) => (
              <tr key={tier} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-4 py-2 font-medium">{tier}</td>
                <td className="border border-gray-200 px-4 py-2">{limit}</td>
                <td className="border border-gray-200 px-4 py-2 text-gray-500">{window}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Versioning</h2>
      <p>
        We use URL versioning (<code>/api/v1/</code>, <code>/api/v2/</code>). Breaking changes
        always require a new major version. We maintain the previous version for{' '}
        <strong>12 months</strong> after a new version is released.
      </p>

      <InfoPanel icon={AlertTriangle} color="#ef4444" title="Deprecation policy">
        APIs marked as deprecated are removed after the 12-month sunset period.
        Deprecation notices appear in response headers:{' '}
        <code>Deprecation: true</code>, <code>Sunset: Sat, 01 Jan 2027 00:00:00 GMT</code>
      </InfoPanel>
    </div>
  );
}

function DefaultContent({ pageId }: { pageId: string }) {
  const titles: Record<string, string> = {
    intro: 'Introduction', quickstart: 'Quick Start', install: 'Installation',
    dbschema: 'Database Schema', codestd: 'Code Standards', testing: 'Testing Guide',
    cicd: 'CI/CD Pipeline', envs: 'Environments',
  };
  return (
    <div className="doc-content">
      <h1>{titles[pageId] || 'Page'}</h1>
      <p className="text-gray-500 text-lg">This page is currently being written. Check back soon!</p>
      <InfoPanel icon={Info} color="#3b82f6" title="Work in progress">
        This document is a stub. <span className="text-blue-600">@Sonadarshan</span> is the owner.
        Ping in <span className="text-blue-600">#engineering</span> if you need this urgently.
      </InfoPanel>
    </div>
  );
}

function PageContent({ pageId }: { pageId: string }) {
  if (pageId === 'sysoverview') return <SystemOverviewContent />;
  if (pageId === 'git') return <GitWorkflowContent />;
  if (pageId === 'apidesign') return <ApiDesignContent />;
  return <DefaultContent pageId={pageId} />;
}

// ─── Templates Modal ─────────────────────────────────────────────────────────

function TemplatesModal({ onClose, onSelect }: { onClose: () => void; onSelect: (t: string) => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl w-full max-w-2xl shadow-2xl"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Choose a Template</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 p-6">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#D97757] hover:bg-orange-50 text-left transition-all group"
            >
              <span className="text-2xl">{t.icon}</span>
              <div>
                <p className="font-medium text-gray-900 group-hover:text-[#D97757] transition-colors">{t.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Search Results ──────────────────────────────────────────────────────────

function SearchResults({ query, onSelect }: { query: string; onSelect: (id: string) => void }) {
  const results = Object.values(PAGES_CONTENT).filter(
    p => p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.labels.some(l => l.includes(query.toLowerCase()))
  );
  return (
    <div className="absolute left-2 right-2 top-full mt-1 bg-[#2a2a3e] border border-white/20 rounded-lg shadow-xl z-50 overflow-hidden">
      {results.length === 0 ? (
        <p className="text-white/50 text-sm p-4">No results for "{query}"</p>
      ) : (
        results.map(r => (
          <button
            key={r.id}
            onClick={() => onSelect(r.id)}
            className="w-full text-left px-4 py-3 hover:bg-white/10 border-b border-white/10 last:border-0 transition-colors"
          >
            <p className="text-white text-sm font-medium">{r.title}</p>
            <p className="text-white/50 text-xs mt-0.5">{r.space} · Updated {r.updatedAt}</p>
          </button>
        ))
      )}
    </div>
  );
}

// ─── Comment Component ────────────────────────────────────────────────────────

function CommentThread({ comment, onResolve }: { comment: Comment; onResolve: (id: string) => void }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');

  return (
    <div className={`rounded-lg border p-4 mb-3 ${comment.resolved ? 'opacity-50 bg-gray-50' : 'bg-white border-gray-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1">
          <ContributorAvatar c={comment.author} size={32} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm text-gray-900">{comment.author.name}</span>
              <span className="text-xs text-gray-400">{comment.timestamp}</span>
              {comment.resolved && (
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Resolved</span>
              )}
            </div>
            <p className="text-sm text-gray-700">{comment.content}</p>
            <div className="flex items-center gap-3 mt-2">
              <button onClick={() => setShowReply(!showReply)} className="text-xs text-gray-400 hover:text-[#D97757] flex items-center gap-1 transition-colors">
                <CornerDownRight size={12} /> Reply
              </button>
              <button className="text-xs text-gray-400 hover:text-blue-500 flex items-center gap-1 transition-colors">
                <ThumbsUp size={12} /> Like
              </button>
              {!comment.resolved && (
                <button onClick={() => onResolve(comment.id)} className="text-xs text-gray-400 hover:text-green-500 flex items-center gap-1 transition-colors">
                  <Check size={12} /> Resolve
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {comment.replies.map(r => (
        <div key={r.id} className="ml-10 mt-3 flex items-start gap-3">
          <ContributorAvatar c={r.author} size={26} />
          <div className="flex-1 bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-xs text-gray-900">{r.author.name}</span>
              <span className="text-xs text-gray-400">{r.timestamp}</span>
            </div>
            <p className="text-sm text-gray-700">{r.content}</p>
          </div>
        </div>
      ))}

      <AnimatePresence>
        {showReply && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-10 mt-3 overflow-hidden"
          >
            <div className="flex gap-2">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 border border-gray-200 rounded-lg p-2 text-sm resize-none focus:outline-none focus:border-[#D97757] transition-colors"
                rows={2}
              />
              <button
                onClick={() => { setReplyText(''); setShowReply(false); }}
                className="self-end px-3 py-2 bg-[#D97757] text-white rounded-lg text-sm hover:bg-[#c4694a] transition-colors flex items-center gap-1"
              >
                <Send size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Right Panel ─────────────────────────────────────────────────────────────

function RightPanel({ page, onClose }: { page: DocPage; onClose: () => void }) {
  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-72 bg-white border-l border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="font-semibold text-sm text-gray-700">Page Details</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-5 text-sm">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Contributors</p>
          <div className="flex items-center gap-1">
            {page.contributors.map(c => <ContributorAvatar key={c.name} c={c} size={30} />)}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Page Info</p>
          <div className="space-y-1.5 text-gray-600">
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-gray-400" />
              <span>Created {page.createdAt} by {page.createdBy}</span>
            </div>
            <div className="flex items-center gap-2">
              <Edit3 size={13} className="text-gray-400" />
              <span>Updated {page.updatedAt} by {page.updatedBy}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye size={13} className="text-gray-400" />
              <span>{page.views} views</span>
            </div>
            <div className="flex items-center gap-2">
              <History size={13} className="text-gray-400" />
              <span>{page.versionCount} versions</span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Labels</p>
          <div className="flex flex-wrap gap-1.5">
            {page.labels.map(l => (
              <span key={l} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{l}</span>
            ))}
            <button className="text-xs text-gray-400 hover:text-[#D97757] transition-colors">+ Add</button>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Linked Issues</p>
          {['ARCH-142', 'ENG-301', 'ENG-289'].map(issue => (
            <div key={issue} className="flex items-center gap-2 py-1 text-blue-600 hover:text-blue-700 cursor-pointer">
              <ExternalLink size={12} />
              <span>{issue}</span>
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Comments</p>
          <div className="flex items-center gap-2 text-gray-600">
            <MessageSquare size={14} />
            <span>{page.commentCount} comments</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Editor Toolbar ───────────────────────────────────────────────────────────

const TOOLBAR_BUTTONS = [
  { icon: Bold, cmd: 'bold', title: 'Bold (Ctrl+B)' },
  { icon: Italic, cmd: 'italic', title: 'Italic (Ctrl+I)' },
  { icon: Underline, cmd: 'underline', title: 'Underline (Ctrl+U)' },
  { icon: Strikethrough, cmd: 'strikeThrough', title: 'Strikethrough' },
];

function EditorToolbar({ onFormat }: { onFormat: (cmd: string, value?: string) => void }) {
  const [styleOpen, setStyleOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const styles: ParagraphStyle[] = ['Normal', 'H1', 'H2', 'H3', 'Code Block', 'Quote'];

  return (
    <div className="flex items-center gap-0.5 flex-wrap py-2 px-4 bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="relative mr-1">
        <button
          onClick={() => setStyleOpen(!styleOpen)}
          className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors min-w-[100px]"
        >
          <Type size={14} />
          <span>Normal</span>
          <ChevronDown size={12} className="ml-auto" />
        </button>
        <AnimatePresence>
          {styleOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[140px]"
            >
              {styles.map(s => (
                <button
                  key={s}
                  onClick={() => { onFormat('formatBlock', s === 'H1' ? 'h1' : s === 'H2' ? 'h2' : s === 'H3' ? 'h3' : s === 'Code Block' ? 'pre' : s === 'Quote' ? 'blockquote' : 'p'); setStyleOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {TOOLBAR_BUTTONS.map(({ icon: Icon, cmd, title }) => (
        <button
          key={cmd}
          onClick={() => onFormat(cmd)}
          title={title}
          className="p-1.5 rounded text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <Icon size={15} />
        </button>
      ))}

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {[
        { icon: Link, cmd: 'createLink', title: 'Insert link' },
        { icon: Image, cmd: 'insertImage', title: 'Insert image' },
        { icon: Table, cmd: 'insertTable', title: 'Insert table' },
      ].map(({ icon: Icon, cmd, title }) => (
        <button key={cmd} onClick={() => onFormat(cmd)} title={title} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors">
          <Icon size={15} />
        </button>
      ))}

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {[
        { icon: ListOrdered, cmd: 'insertOrderedList', title: 'Ordered list' },
        { icon: List, cmd: 'insertUnorderedList', title: 'Unordered list' },
        { icon: CheckSquare, cmd: 'insertCheckList', title: 'Checklist' },
      ].map(({ icon: Icon, cmd, title }) => (
        <button key={cmd} onClick={() => onFormat(cmd)} title={title} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors">
          <Icon size={15} />
        </button>
      ))}

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {[
        { icon: Code, cmd: 'inlineCode', title: 'Inline code' },
        { icon: Code2, cmd: 'codeBlock', title: 'Code block' },
        { icon: Quote, cmd: 'blockquote', title: 'Quote' },
        { icon: Minus, cmd: 'insertHorizontalRule', title: 'Divider' },
      ].map(({ icon: Icon, cmd, title }) => (
        <button key={cmd} onClick={() => onFormat(cmd)} title={title} className="p-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors">
          <Icon size={15} />
        </button>
      ))}

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <button onClick={() => onFormat('mention')} title="Mention" className="p-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors">
        <AtSign size={15} />
      </button>
      <button onClick={() => onFormat('emoji')} title="Emoji" className="p-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors">
        <Smile size={15} />
      </button>
    </div>
  );
}

// ─── Main DocsPage Component ──────────────────────────────────────────────────

export default function DocsPage() {
  const [selectedSpace, setSelectedSpace] = useState<DocSpace>(SPACES[0]);
  const [selectedPageId, setSelectedPageId] = useState<string>('sysoverview');
  const [isEditing, setIsEditing] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [newComment, setNewComment] = useState('');
  const [showMoreActions, setShowMoreActions] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const currentPage = PAGES_CONTENT[selectedPageId];

  const handlePageSelect = useCallback((id: string) => {
    setSelectedPageId(id);
    setIsEditing(false);
    setSearchQuery('');
    setShowSearch(false);
  }, []);

  const handleFormat = useCallback((cmd: string, value?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(cmd, false, value);
  }, []);

  const handleEditorInput = useCallback(() => {
    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveStatus('saved'), 1500);
  }, []);

  const handleResolveComment = useCallback((id: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, resolved: true } : c));
  }, []);

  const resolvedCount = comments.filter(c => c.resolved).length;

  return (
    <div className="flex h-screen bg-[#f5f5f3] overflow-hidden">
      {/* ── Left Sidebar ── */}
      <div className="w-70 bg-[#1e1e2e] flex flex-col flex-shrink-0" style={{ width: 280 }}>
        {/* Spaces header */}
        <div className="p-4 border-b border-white/10">
          <div className="relative mb-3">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowSearch(e.target.value.length > 0); }}
              placeholder="Search pages..."
              className="w-full bg-white/10 text-white/80 placeholder-white/30 text-sm rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:bg-white/15 transition-colors"
            />
            {showSearch && (
              <SearchResults query={searchQuery} onSelect={id => handlePageSelect(id)} />
            )}
          </div>
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
          >
            <Plus size={13} /> Create Page
          </button>
        </div>

        {/* Spaces list */}
        <div className="p-2 border-b border-white/10">
          <p className="text-xs text-white/40 font-semibold uppercase tracking-wider px-2 mb-2">Spaces</p>
          {SPACES.map(space => (
            <button
              key={space.id}
              onClick={() => setSelectedSpace(space)}
              className={`flex items-center gap-2.5 w-full px-2 py-1.5 rounded text-sm transition-colors ${
                selectedSpace.id === space.id ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <SpaceAvatar space={space} size={22} />
              <span className="truncate">{space.name}</span>
            </button>
          ))}
          <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-white/40 hover:text-white/70 transition-colors mt-1">
            <Plus size={14} />
            <span>Create Space</span>
          </button>
        </div>

        {/* Page tree */}
        <div className="flex-1 overflow-y-auto p-2">
          <p className="text-xs text-white/40 font-semibold uppercase tracking-wider px-2 mb-2">Pages</p>
          {PAGE_TREE.map(node => (
            <TreeItem
              key={node.id}
              node={node}
              depth={0}
              selectedPageId={selectedPageId}
              onSelect={handlePageSelect}
            />
          ))}
        </div>

        {/* Recent pages */}
        <div className="p-2 border-t border-white/10">
          <p className="text-xs text-white/40 font-semibold uppercase tracking-wider px-2 mb-2">Recent</p>
          {RECENT_PAGES.map(p => (
            <button
              key={p.id}
              onClick={() => handlePageSelect(p.id)}
              className="flex items-start gap-2 w-full px-2 py-1.5 rounded text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Clock size={12} className="flex-shrink-0 mt-0.5 opacity-60" />
              <div className="text-left min-w-0">
                <p className="truncate">{p.title}</p>
                <p className="text-xs text-white/30">{p.time}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Page toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-400 min-w-0">
            <span className="hover:text-gray-600 cursor-pointer transition-colors">
              {selectedSpace.name}
            </span>
            <ChevronRight size={14} />
            <span className="hover:text-gray-600 cursor-pointer transition-colors">
              {currentPage?.space || 'Page'}
            </span>
            <ChevronRight size={14} />
            <span className="text-gray-700 font-medium truncate">{currentPage?.title || 'Untitled'}</span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isEditing && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                {saveStatus === 'saving' && (
                  <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full" /> Saving...</>
                )}
                {saveStatus === 'saved' && <><Check size={12} className="text-green-500" /> Saved</>}
              </span>
            )}

            {currentPage && (
              <button className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors">
                <History size={13} />
                View {currentPage.versionCount} versions
              </button>
            )}

            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isEditing
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-[#D97757] text-white hover:bg-[#c4694a]'
              }`}
            >
              {isEditing ? <><Eye size={14} /> View</> : <><Edit3 size={14} /> Edit</>}
            </button>

            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors">
              <Share2 size={14} />
              Share
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMoreActions(!showMoreActions)}
                className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <MoreHorizontal size={18} />
              </button>
              <AnimatePresence>
                {showMoreActions && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1 min-w-[180px]"
                  >
                    {[
                      { icon: FileDown, label: 'Export PDF' },
                      { icon: FilePen, label: 'Export Word' },
                      { icon: Copy, label: 'Copy link' },
                      { icon: Move, label: 'Move page' },
                      { icon: Lock, label: 'Restrictions' },
                    ].map(item => (
                      <button key={item.label} onClick={() => setShowMoreActions(false)} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <item.icon size={14} className="text-gray-400" />
                        {item.label}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={() => setShowMoreActions(false)} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                        Delete page
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setShowRightPanel(!showRightPanel)}
              className={`p-1.5 rounded-lg transition-colors ${showRightPanel ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Info size={16} />
            </button>
          </div>
        </div>

        {/* Editor toolbar (edit mode) */}
        <AnimatePresence>
          {isEditing && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden flex-shrink-0">
              <EditorToolbar onFormat={handleFormat} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content area */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[860px] mx-auto px-8 py-8">
              {/* Page title */}
              {isEditing ? (
                <input
                  defaultValue={currentPage?.title || 'Untitled Page'}
                  className="text-4xl font-bold text-gray-900 w-full bg-transparent border-none outline-none mb-6 placeholder-gray-300"
                  placeholder="Page title"
                />
              ) : (
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {currentPage?.title || 'Untitled Page'}
                </h1>
              )}

              {currentPage && !isEditing && (
                <div className="flex items-center gap-3 mb-8 text-sm text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <ContributorAvatar c={MOCK_CONTRIBUTORS[0]} size={20} />
                    <span>Last edited by <strong className="text-gray-600">{currentPage.updatedBy}</strong></span>
                  </div>
                  <span>·</span>
                  <span>{currentPage.updatedAt}</span>
                  <span>·</span>
                  <span>{currentPage.views} views</span>
                </div>
              )}

              {/* Page body */}
              {isEditing ? (
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleEditorInput}
                  suppressContentEditableWarning
                  className="min-h-[400px] text-gray-800 leading-relaxed focus:outline-none doc-editor"
                  data-placeholder="Start writing..."
                />
              ) : (
                <PageContent pageId={selectedPageId} />
              )}

              {/* Comments section */}
              {!isEditing && (
                <div className="mt-12 border-t border-gray-200 pt-8">
                  <div className="flex items-center gap-2 mb-6">
                    <MessageSquare size={18} className="text-gray-500" />
                    <h3 className="font-semibold text-gray-800">
                      Comments ({comments.length - resolvedCount} open · {resolvedCount} resolved)
                    </h3>
                  </div>

                  {comments.map(comment => (
                    <CommentThread key={comment.id} comment={comment} onResolve={handleResolveComment} />
                  ))}

                  <div className="mt-4 flex gap-3">
                    <ContributorAvatar c={MOCK_CONTRIBUTORS[0]} size={34} />
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Add a comment... (use @mention to notify someone)"
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-[#D97757] transition-colors"
                        rows={3}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors"><AtSign size={15} /></button>
                          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors"><Smile size={15} /></button>
                        </div>
                        <button
                          disabled={!newComment.trim()}
                          onClick={() => setNewComment('')}
                          className="px-4 py-1.5 bg-[#D97757] text-white rounded-lg text-sm hover:bg-[#c4694a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Comment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <AnimatePresence>
            {showRightPanel && currentPage && (
              <RightPanel page={currentPage} onClose={() => setShowRightPanel(false)} />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Templates modal */}
      <AnimatePresence>
        {showTemplates && (
          <TemplatesModal
            onClose={() => setShowTemplates(false)}
            onSelect={() => setShowTemplates(false)}
          />
        )}
      </AnimatePresence>

      {/* Styles */}
      <style>{`
        .doc-content h1 { font-size: 2rem; font-weight: 700; color: #111827; margin: 1.5rem 0 0.75rem; line-height: 1.2; }
        .doc-content h2 { font-size: 1.375rem; font-weight: 600; color: #1f2937; margin: 2rem 0 0.5rem; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; }
        .doc-content h3 { font-size: 1.125rem; font-weight: 600; color: #374151; margin: 1.5rem 0 0.375rem; }
        .doc-content p { color: #4b5563; line-height: 1.75; margin: 0.75rem 0; }
        .doc-content ul, .doc-content ol { padding-left: 1.5rem; margin: 0.75rem 0; }
        .doc-content li { color: #4b5563; line-height: 1.75; margin: 0.25rem 0; }
        .doc-content ul li { list-style-type: disc; }
        .doc-content ol li { list-style-type: decimal; }
        .doc-content code { background: #f3f4f6; border: 1px solid #e5e7eb; padding: 0.1rem 0.35rem; border-radius: 4px; font-family: 'Fira Code', monospace; font-size: 0.85em; color: #ef4444; }
        .doc-content strong { color: #111827; }
        .doc-editor { font-size: 1rem; }
        .doc-editor:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }
      `}</style>
    </div>
  );
}
