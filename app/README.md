# Brixstac

**AI-Native Enterprise Operating System**

Brixstac is the all-in-one platform that replaces fragmented engineering tools — project management, team chat, video calls, code repositories, CI/CD pipelines, security monitoring, AI agents, and more — into a single cohesive workspace.

## Product Modules

| Module | Route | Description |
|--------|-------|-------------|
| **Dashboard** | `/` | Central hub with KPIs, activity feed, and quick actions |
| **Projects** | `/projects` | Project management with sprints, backlogs, Kanban boards |
| **Teams** | `/teams` | Team directory, org chart, roles & permissions |
| **Chat** | `/chat` | Real-time messaging with channels, DMs, threads |
| **Calendar** | `/calendar` | Event scheduling, meetings, availability |
| **Calls** | `/calls` | Video conferencing with screen sharing |
| **Apps** | `/apps` | App marketplace and integrations |
| **Approvals** | `/approvals` | Workflow approvals and sign-offs |
| **Automation** | `/automation` | Workflow automation builder |
| **Security** | `/security` | Zero Trust security dashboard |
| **Billing** | `/billing` | Subscription and usage management |
| **Admin** | `/admin` | Admin dashboard and settings |
| **Profile** | `/profile` | User profile and preferences |

## AI Agents

Brixstac includes 6 specialized AI agents that work alongside your team:

- **Dev Agent** — Code review, bug fixes, test generation
- **PM Agent** — Backlog prioritization, sprint planning
- **QA Agent** — Test case generation, bug triage
- **DevOps Agent** — Deployments, monitoring, incident response
- **Support Agent** — Ticket resolution, FAQ generation
- **Tech Lead Agent** — Architecture review, PR approval

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **State**: Zustand + TanStack Query
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend**: tRPC + Hono + Drizzle ORM + PostgreSQL

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type check
npm run check
```

## License

Copyright 2026 Brixstac. All rights reserved.
