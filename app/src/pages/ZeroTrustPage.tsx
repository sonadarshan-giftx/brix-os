import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, AlertTriangle, Eye, Globe, Fingerprint, Users, Server,
  Activity, CheckCircle2, XCircle, Plus, Trash2, RefreshCw, Settings,
  Zap, Monitor, Laptop, Smartphone, Wifi, Database, Cloud, Key,
  TrendingUp, TrendingDown, BarChart2, Filter, Download, Search,
  ChevronDown, ChevronRight, Terminal, Bell, Radio, Network, Layers,
  UserCheck, UserX, FileText, AlertCircle, Info, MapPin, Clock,
} from 'lucide-react';

// ── Theme constants ───────────────────────────────────────────────────────────

const T = {
  bg:       '#0d0e1a',
  card:     '#13152b',
  border:   '#1e2140',
  green:    '#00ff88',
  red:      '#ff4444',
  yellow:   '#ffbb00',
  blue:     '#4488ff',
  purple:   '#E8946F',
  text:     '#e0e0f0',
  muted:    '#7070a0',
  mono:     "'Fira Code', 'JetBrains Mono', 'Courier New', monospace",
};

// ── Mock data ─────────────────────────────────────────────────────────────────

const ALERTS = [
  { id: 1, time: '09:42', user: 'j.smith@corp.com', event: 'Login from new country: RU', severity: 'critical', resolved: false },
  { id: 2, time: '09:38', user: 'device-MBP-204',   event: 'Antivirus signatures outdated by 14 days', severity: 'high', resolved: false },
  { id: 3, time: '09:21', user: 'm.chen@corp.com',   event: 'Large data download: 2.4 GB in 3 min', severity: 'high', resolved: false },
  { id: 4, time: '08:55', user: 'r.kumar@corp.com',  event: 'After-hours access: 02:34 AM UTC', severity: 'medium', resolved: true },
  { id: 5, time: '08:12', user: 'api-gateway-prod',  event: 'Suspicious outbound connection to 185.141.x.x', severity: 'critical', resolved: false },
  { id: 6, time: '07:44', user: 'a.torres@corp.com', event: 'MFA device changed', severity: 'medium', resolved: true },
  { id: 7, time: '07:03', user: 'device-WIN-089',    event: 'Encryption disabled on endpoint', severity: 'critical', resolved: false },
];

const THREAT_MAP_POINTS = [
  { x: 18,  y: 28,  country: 'USA',    count: 0,    safe: true  },
  { x: 48,  y: 22,  country: 'Russia', count: 12,   safe: false },
  { x: 52,  y: 30,  country: 'China',  count: 9,    safe: false },
  { x: 43,  y: 25,  country: 'Germany',count: 0,    safe: true  },
  { x: 40,  y: 22,  country: 'UK',     count: 0,    safe: true  },
  { x: 83,  y: 60,  country: 'Brazil', count: 3,    safe: false },
  { x: 56,  y: 65,  country: 'Nigeria',count: 5,    safe: false },
  { x: 67,  y: 28,  country: 'India',  count: 2,    safe: false },
  { x: 78,  y: 35,  country: 'Japan',  count: 0,    safe: true  },
];

const APPLICATIONS = [
  { id: 1, name: 'Salesforce', category: 'CRM', risk: 'low', dataClass: 'Confidential', users: 124, sso: true, status: 'allowed', casb: true },
  { id: 2, name: 'Slack', category: 'Comms', risk: 'medium', dataClass: 'Internal', users: 340, sso: true, status: 'monitor', casb: true },
  { id: 3, name: 'GitHub', category: 'DevOps', risk: 'medium', dataClass: 'Restricted', users: 87, sso: true, status: 'allowed', casb: false },
  { id: 4, name: 'Personal Gmail', category: 'Shadow IT', risk: 'high', dataClass: 'Unknown', users: 45, sso: false, status: 'blocked', casb: false },
  { id: 5, name: 'Dropbox (personal)', category: 'Shadow IT', risk: 'critical', dataClass: 'Unknown', users: 23, sso: false, status: 'blocked', casb: false },
  { id: 6, name: 'Figma', category: 'Design', risk: 'low', dataClass: 'Internal', users: 32, sso: true, status: 'allowed', casb: false },
  { id: 7, name: 'AWS Console', category: 'Cloud', risk: 'high', dataClass: 'Restricted', users: 18, sso: true, status: 'allowed', casb: true },
  { id: 8, name: 'ChatGPT (personal)', category: 'Shadow IT', risk: 'critical', dataClass: 'Unknown', users: 67, sso: false, status: 'blocked', casb: false },
];

const DEVICES = [
  { id: 1, name: 'MBP-204', user: 'j.smith', os: 'macOS 14.3', compliance: 'compliant',    posture: 96, lastSeen: '2 min ago',  encrypted: true,  av: true,  mdm: true },
  { id: 2, name: 'WIN-089', user: 'r.kumar', os: 'Windows 11', compliance: 'critical',     posture: 31, lastSeen: '1 hr ago',   encrypted: false, av: true,  mdm: true },
  { id: 3, name: 'MBP-112', user: 'm.chen',  os: 'macOS 13.6', compliance: 'at-risk',      posture: 62, lastSeen: '15 min ago', encrypted: true,  av: false, mdm: true },
  { id: 4, name: 'iPhone-7A', user: 'a.torres', os: 'iOS 17.4', compliance: 'compliant',   posture: 91, lastSeen: 'just now',   encrypted: true,  av: true,  mdm: true },
  { id: 5, name: 'LNX-DEV-03', user: 'echo',  os: 'Ubuntu 22.04', compliance: 'compliant', posture: 88, lastSeen: '5 min ago', encrypted: true,  av: true,  mdm: false },
  { id: 6, name: 'WIN-MGMT-01', user: 'admin', os: 'Windows Server 2022', compliance: 'compliant', posture: 95, lastSeen: '1 min ago', encrypted: true, av: true, mdm: false },
];

const USERS = [
  { id: 1, name: 'James Smith',    email: 'j.smith@corp.com',  risk: 89, mfa: true,  idp: 'Azure AD', dept: 'Finance',    unusualActivity: true,  lastLogin: 'Moscow, RU' },
  { id: 2, name: 'Maya Chen',      email: 'm.chen@corp.com',   risk: 62, mfa: true,  idp: 'Okta',     dept: 'Engineering',unusualActivity: true,  lastLogin: 'San Francisco, US' },
  { id: 3, name: 'Rahul Kumar',    email: 'r.kumar@corp.com',  risk: 38, mfa: true,  idp: 'Azure AD', dept: 'Sales',      unusualActivity: false, lastLogin: 'London, UK' },
  { id: 4, name: 'Ana Torres',     email: 'a.torres@corp.com', risk: 25, mfa: false, idp: 'Okta',     dept: 'Marketing',  unusualActivity: false, lastLogin: 'Madrid, ES' },
  { id: 5, name: 'Alex Chen',    email: 'sona@corp.com',     risk: 10, mfa: true,  idp: 'Azure AD', dept: 'Platform',   unusualActivity: false, lastLogin: 'San Francisco, US' },
  { id: 6, name: 'Echo (AI)',      email: 'echo@internal',     risk: 5,  mfa: true,  idp: 'Internal', dept: 'DevOps',     unusualActivity: false, lastLogin: 'Internal' },
];

const POLICIES = [
  { id: 1, name: 'Default Deny All',        type: 'baseline', enabled: true,  rules: 12, hits: 4521, action: 'block'   },
  { id: 2, name: 'Trusted Network Access',  type: 'network',  enabled: true,  rules: 8,  hits: 18920, action: 'allow'  },
  { id: 3, name: 'BYOD Restricted',         type: 'device',   enabled: true,  rules: 6,  hits: 342,  action: 'monitor' },
  { id: 4, name: 'Finance Data Guard',      type: 'data',     enabled: true,  rules: 4,  hits: 89,   action: 'block'   },
  { id: 5, name: 'After-Hours Alerting',    type: 'temporal', enabled: true,  rules: 3,  hits: 17,   action: 'alert'   },
  { id: 6, name: 'Shadow IT Block',         type: 'app',      enabled: true,  rules: 15, hits: 2304, action: 'block'   },
  { id: 7, name: 'Executive Bypass (temp)', type: 'override', enabled: false, rules: 2,  hits: 0,    action: 'allow'   },
];

const THREATS = [
  { id: 1, type: 'Malware',    name: 'Trojan.GenericKD',  severity: 'critical', source: '185.141.47.23',  target: 'WIN-089', status: 'active',     time: '09:41' },
  { id: 2, type: 'Phishing',   name: 'PayPal spoof email',severity: 'high',     source: 'external email', target: 'j.smith', status: 'blocked',    time: '09:28' },
  { id: 3, type: 'C2 Traffic', name: 'Cobalt Strike beacon',severity: 'critical',source: '91.234.x.x',   target: 'LNX-DEV-03', status: 'contained', time: '08:52' },
  { id: 4, type: 'Brute Force',name: 'SSH brute force',   severity: 'medium',   source: '103.19.x.x',    target: 'api-gateway', status: 'blocked',  time: '08:11' },
  { id: 5, type: 'Data Exfil', name: 'Large HTTPS upload', severity: 'high',    source: 'm.chen internal',target: 'dropbox.com', status: 'active',   time: '07:44' },
];

const CVE_LIST = [
  { id: 'CVE-2024-3094', severity: 'critical', product: 'XZ Utils 5.6.x',        score: 10.0, patched: false },
  { id: 'CVE-2024-21762',severity: 'critical', product: 'Fortinet FortiOS',       score: 9.6,  patched: true  },
  { id: 'CVE-2024-1708', severity: 'high',     product: 'ConnectWise ScreenConnect',score: 8.4, patched: true  },
  { id: 'CVE-2023-44487', severity: 'high',    product: 'HTTP/2 Rapid Reset',     score: 7.5,  patched: true  },
];

const NETWORK_SEGMENTS = [
  { id: 1, name: 'Production',     cidr: '10.0.1.0/24', devices: 34, status: 'secure',   allowedFrom: ['VPN', 'Corp-HQ'] },
  { id: 2, name: 'Development',    cidr: '10.0.2.0/24', devices: 18, status: 'secure',   allowedFrom: ['Corp-HQ', 'BYOD-Restricted'] },
  { id: 3, name: 'BYOD',           cidr: '10.0.10.0/24',devices: 45, status: 'isolated', allowedFrom: ['Internet-Auth'] },
  { id: 4, name: 'Guest WiFi',     cidr: '10.0.20.0/24',devices: 12, status: 'isolated', allowedFrom: ['Internet'] },
  { id: 5, name: 'Management',     cidr: '10.0.0.0/24', devices: 8,  status: 'secure',   allowedFrom: ['Jump-Server'] },
  { id: 6, name: 'IoT Devices',    cidr: '10.0.30.0/24',devices: 23, status: 'isolated', allowedFrom: [] },
];

const COMPLIANCE = [
  { name: 'SOC 2 Type II', score: 94, controls: 116, passing: 109, icon: Shield },
  { name: 'ISO 27001',     score: 88, controls: 93,  passing: 82,  icon: Lock },
  { name: 'HIPAA',         score: 91, controls: 54,  passing: 49,  icon: Eye },
  { name: 'GDPR',          score: 85, controls: 48,  passing: 41,  icon: Globe },
];

const LOG_STREAM_ENTRIES = [
  { t: '09:42:11', lvl: 'CRITICAL', user: 'j.smith@corp.com', action: 'AUTH',     msg: 'Login attempt from RU/185.141.47.x blocked by geo-policy' },
  { t: '09:42:08', lvl: 'INFO',     user: 'sona@corp.com',    action: 'ACCESS',   msg: 'Accessed Salesforce via SSO — allowed by policy P-002' },
  { t: '09:41:55', lvl: 'HIGH',     user: 'WIN-089',           action: 'ENDPOINT', msg: 'Encryption disabled — device quarantined by MDM' },
  { t: '09:41:33', lvl: 'INFO',     user: 'm.chen@corp.com',  action: 'DLP',      msg: 'Download of 450MB flagged for review — policy P-004' },
  { t: '09:40:02', lvl: 'MEDIUM',   user: 'api-gateway',      action: 'NETWORK',  msg: 'Outbound connection to 185.141.x.x blocked — threat intel match' },
  { t: '09:38:44', lvl: 'INFO',     user: 'r.kumar@corp.com', action: 'AUTH',     msg: 'MFA verified — access granted to AWS Console' },
  { t: '09:37:12', lvl: 'LOW',      user: 'a.torres@corp.com',action: 'APP',      msg: 'Dropbox personal access blocked — shadow IT policy' },
  { t: '09:35:58', lvl: 'HIGH',     user: 'LNX-DEV-03',       action: 'THREAT',   msg: 'C2 beacon traffic detected — connection severed' },
  { t: '09:34:21', lvl: 'INFO',     user: 'echo@internal',    action: 'API',      msg: 'AI agent token usage within daily limit' },
  { t: '09:32:10', lvl: 'MEDIUM',   user: 'unknown',           action: 'BRUTE',    msg: 'SSH brute force from 103.19.x.x — IP blocked' },
];

const TABS = ['Dashboard', 'Network', 'Applications', 'Devices', 'Users', 'Policies', 'Threats', 'Logs'] as const;
type Tab = typeof TABS[number];

// ── Shared sub-components ─────────────────────────────────────────────────────

function SevBadge({ sev }: { sev: string }) {
  const colors: Record<string, string> = {
    critical: T.red, high: '#ff6600', medium: T.yellow, low: T.blue, info: T.muted,
    blocked: T.green, allowed: T.green, monitor: T.yellow,
    compliant: T.green, 'at-risk': T.yellow, 'non-compliant': T.red,
    active: T.red, contained: T.yellow, secure: T.green, isolated: T.yellow,
    CRITICAL: T.red, HIGH: '#ff6600', MEDIUM: T.yellow, LOW: T.blue, INFO: T.muted,
  };
  const c = colors[sev] ?? T.muted;
  return (
    <span style={{
      color: c, border: `1px solid ${c}40`, background: `${c}18`,
      borderRadius: 4, padding: '1px 8px', fontSize: 11, fontFamily: T.mono,
      fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
    }}>{sev}</span>
  );
}

function StatCard({ icon: Icon, label, value, delta, color }: {
  icon: React.ElementType; label: string; value: string | number; delta?: string; color?: string;
}) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 24px', flex: 1, minWidth: 160 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ background: `${color ?? T.blue}20`, borderRadius: 8, padding: 8 }}>
          <Icon size={18} color={color ?? T.blue} />
        </div>
        <span style={{ color: T.muted, fontSize: 13 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: T.text, lineHeight: 1 }}>{value}</div>
      {delta && (
        <div style={{ marginTop: 8, fontSize: 12, color: delta.startsWith('+') ? T.red : T.green }}>
          {delta}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <h3 style={{ color: T.text, fontSize: 15, fontWeight: 600, margin: 0 }}>{title}</h3>
      {action}
    </div>
  );
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6,
      color: T.muted, fontSize: 12, padding: '4px 10px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 4,
    }}>{children}</button>
  );
}

// ── Risk Score Gauge ──────────────────────────────────────────────────────────

function RiskGauge({ score }: { score: number }) {
  const color = score >= 70 ? T.red : score >= 40 ? T.yellow : T.green;
  const angle = -135 + (score / 100) * 270;
  const r = 60, cx = 80, cy = 80;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arcX = cx + r * Math.cos(toRad(angle - 90));
  const arcY = cy + r * Math.sin(toRad(angle - 90));

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={160} height={120} viewBox="0 0 160 120">
        {/* Background arc */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`}
          fill="none" stroke={T.border} strokeWidth={8} strokeLinecap="round" />
        {/* Colored arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${score > 50 ? 1 : 0} 1 ${arcX} ${arcY}`}
          fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={cx + (r - 8) * Math.cos(toRad(angle - 90))}
          y2={cy + (r - 8) * Math.sin(toRad(angle - 90))}
          stroke={color} strokeWidth={2.5} strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={4} fill={color} />
        {/* Labels */}
        <text x={cx - r + 2} y={cy + 18} fill={T.green}  fontSize={10} textAnchor="middle">LOW</text>
        <text x={cx}         y={cy - r - 8} fill={T.yellow} fontSize={10} textAnchor="middle">MED</text>
        <text x={cx + r - 2} y={cy + 18} fill={T.red}    fontSize={10} textAnchor="middle">HIGH</text>
      </svg>
      <div style={{ fontSize: 36, fontWeight: 800, color, marginTop: -8, letterSpacing: '-1px' }}>{score}</div>
      <div style={{ color: T.muted, fontSize: 13, marginTop: 2 }}>Risk Score</div>
    </div>
  );
}

// ── Threat Map ────────────────────────────────────────────────────────────────

function ThreatMap() {
  const [ping, setPing] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPing(p => p + 1), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ position: 'relative', background: `${T.border}40`, borderRadius: 8, overflow: 'hidden', height: 200 }}>
      {/* Simple world map background using CSS gradients */}
      <svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice">
        {/* Continent blobs (simplified) */}
        <rect width="100" height="60" fill={T.bg} />
        {/* North America */}
        <ellipse cx="18" cy="25" rx="9" ry="8" fill={T.border} opacity={0.5} />
        {/* South America */}
        <ellipse cx="24" cy="45" rx="5" ry="8" fill={T.border} opacity={0.5} />
        {/* Europe */}
        <ellipse cx="44" cy="22" rx="5" ry="5" fill={T.border} opacity={0.5} />
        {/* Africa */}
        <ellipse cx="46" cy="40" rx="5" ry="8" fill={T.border} opacity={0.5} />
        {/* Russia/Asia */}
        <ellipse cx="65" cy="22" rx="18" ry="7" fill={T.border} opacity={0.5} />
        {/* India */}
        <ellipse cx="66" cy="35" rx="3" ry="4" fill={T.border} opacity={0.5} />
        {/* SE Asia */}
        <ellipse cx="77" cy="38" rx="5" ry="4" fill={T.border} opacity={0.5} />
        {/* Japan */}
        <ellipse cx="82" cy="26" rx="2" ry="4" fill={T.border} opacity={0.5} />
        {/* Australia */}
        <ellipse cx="80" cy="50" rx="6" ry="4" fill={T.border} opacity={0.5} />

        {/* Attack lines from threat origins to target (US HQ) */}
        {THREAT_MAP_POINTS.filter(p => !p.safe && p.count > 0).map(pt => (
          <line key={pt.country}
            x1={pt.x} y1={pt.y} x2={18} y2={28}
            stroke={T.red} strokeWidth={0.3} opacity={0.4}
            strokeDasharray="1 2"
          />
        ))}

        {/* Dots */}
        {THREAT_MAP_POINTS.map((pt, i) => (
          <g key={i}>
            <circle cx={pt.x} cy={pt.y} r={pt.safe ? 1.5 : 2.5}
              fill={pt.safe ? T.green : T.red}
              style={{ filter: `drop-shadow(0 0 ${pt.safe ? 3 : 6}px ${pt.safe ? T.green : T.red})` }}
            />
            {!pt.safe && (
              <circle cx={pt.x} cy={pt.y} r={5 + (ping % 3)}
                fill="none" stroke={T.red} strokeWidth={0.3}
                opacity={0.5 - (ping % 3) * 0.15}
              />
            )}
            {pt.count > 0 && (
              <text x={pt.x + 3} y={pt.y - 2} fill={T.red} fontSize={2.8} fontWeight="bold">{pt.count}</text>
            )}
          </g>
        ))}
      </svg>
      <div style={{ position: 'absolute', top: 8, left: 8, color: T.muted, fontSize: 11, fontFamily: T.mono }}>
        LIVE THREAT INTELLIGENCE
      </div>
      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.red }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.red, animation: 'pulse 1s infinite' }} />
        LIVE
      </div>
    </div>
  );
}

// ── Dashboard Tab ─────────────────────────────────────────────────────────────

function DashboardTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top stats */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, flex: '0 0 auto' }}>
          <RiskGauge score={67} />
        </div>
        <StatCard icon={Users}       label="Active Users"       value="342"   delta="+12 vs yesterday"  color={T.blue} />
        <StatCard icon={Shield}      label="Blocked Threats (24h)" value="2,847" delta="+124 today"    color={T.red}  />
        <StatCard icon={AlertTriangle} label="Policy Violations" value="23"    delta="+5 today"         color={T.yellow} />
        <StatCard icon={Laptop}      label="Compliant Devices"  value="89%"   delta="-3% vs last week"  color={T.green} />
      </div>

      {/* Threat map + alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
          <SectionHeader title="Global Threat Map" action={<GhostBtn><RefreshCw size={12} />Refresh</GhostBtn>} />
          <ThreatMap />
          <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12 }}>
            <span style={{ color: T.red }}>● Active threats: 5</span>
            <span style={{ color: T.yellow }}>● Monitoring: 3</span>
            <span style={{ color: T.green }}>● Protected regions: 6</span>
          </div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
          <SectionHeader title="Recent Alerts" action={<GhostBtn><Filter size={12} />Filter</GhostBtn>} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
            {ALERTS.map(a => (
              <div key={a.id} style={{
                background: `${T.bg}80`, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px',
                display: 'flex', alignItems: 'flex-start', gap: 10, opacity: a.resolved ? 0.5 : 1,
              }}>
                <span style={{ color: T.muted, fontSize: 11, fontFamily: T.mono, flexShrink: 0 }}>{a.time}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: T.text, marginBottom: 2 }}>{a.event}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>{a.user}</div>
                </div>
                <SevBadge sev={a.severity} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance scorecard */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
        <SectionHeader title="Compliance Scorecard" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {COMPLIANCE.map(c => (
            <div key={c.name} style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
                <svg width={90} height={90} viewBox="0 0 90 90">
                  <circle cx={45} cy={45} r={36} fill="none" stroke={T.border} strokeWidth={6} />
                  <circle cx={45} cy={45} r={36} fill="none"
                    stroke={c.score >= 90 ? T.green : c.score >= 70 ? T.yellow : T.red}
                    strokeWidth={6} strokeLinecap="round"
                    strokeDasharray={`${(c.score / 100) * 226} 226`}
                    strokeDashoffset={56.5}
                    transform="rotate(-90 45 45)"
                  />
                  <text x={45} y={50} textAnchor="middle" fill={T.text} fontSize={18} fontWeight={700}>{c.score}%</text>
                </svg>
              </div>
              <div style={{ color: T.text, fontSize: 13, fontWeight: 600 }}>{c.name}</div>
              <div style={{ color: T.muted, fontSize: 11, marginTop: 4 }}>{c.passing}/{c.controls} controls passing</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Network Tab ───────────────────────────────────────────────────────────────

function NetworkTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Segments */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
        <SectionHeader title="Zero Trust Network Segments" action={<GhostBtn><Plus size={12} />New Segment</GhostBtn>} />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>
              {['Segment', 'CIDR', 'Devices', 'Status', 'Allowed From', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NETWORK_SEGMENTS.map(seg => (
              <tr key={seg.id} style={{ borderBottom: `1px solid ${T.border}30`, color: T.text }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{seg.name}</td>
                <td style={{ padding: '10px 12px', fontFamily: T.mono, color: T.blue, fontSize: 12 }}>{seg.cidr}</td>
                <td style={{ padding: '10px 12px' }}>{seg.devices}</td>
                <td style={{ padding: '10px 12px' }}><SevBadge sev={seg.status} /></td>
                <td style={{ padding: '10px 12px', color: T.muted, fontSize: 12 }}>
                  {seg.allowedFrom.length > 0 ? seg.allowedFrom.join(', ') : <span style={{ color: T.red }}>None</span>}
                </td>
                <td style={{ padding: '10px 12px' }}><GhostBtn><Settings size={12} /></GhostBtn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Network topology SVG */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
        <SectionHeader title="Network Topology" />
        <svg width="100%" height={280} viewBox="0 0 700 280">
          {/* Internet */}
          <circle cx={350} cy={30} r={22} fill={T.bg} stroke={T.border} strokeWidth={2} />
          <text x={350} y={25} textAnchor="middle" fill={T.muted} fontSize={10}>INTERNET</text>
          <Globe x={340} y={30} size={12} color={T.muted} />

          {/* Zero Trust Gateway */}
          <rect x={300} y={75} width={100} height={36} rx={6} fill={`${T.blue}30`} stroke={T.blue} strokeWidth={1.5} />
          <text x={350} y={97} textAnchor="middle" fill={T.blue} fontSize={11} fontWeight={700}>ZT GATEWAY</text>

          {/* Line internet → gateway */}
          <line x1={350} y1={52} x2={350} y2={75} stroke={T.border} strokeWidth={1.5} strokeDasharray="4 2" />

          {/* Segments */}
          {NETWORK_SEGMENTS.slice(0, 5).map((seg, i) => {
            const x = 60 + i * 125;
            const c = seg.status === 'secure' ? T.green : T.yellow;
            return (
              <g key={seg.id}>
                <line x1={350} y1={111} x2={x + 40} y2={175} stroke={`${c}60`} strokeWidth={1} />
                <rect x={x} y={175} width={80} height={50} rx={6} fill={`${c}15`} stroke={c} strokeWidth={1.5} />
                <text x={x + 40} y={195} textAnchor="middle" fill={c} fontSize={10} fontWeight={600}>{seg.name}</text>
                <text x={x + 40} y={210} textAnchor="middle" fill={T.muted} fontSize={9}>{seg.devices} devices</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Private Access config */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
        <SectionHeader title="Zero Trust Private Access (ZTPA)" action={
          <div style={{ display: 'flex', gap: 8 }}>
            <SevBadge sev="active" />
            <GhostBtn><Settings size={12} />Configure</GhostBtn>
          </div>
        } />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            { label: 'Private Apps Protected', value: '14', icon: Lock, color: T.green },
            { label: 'Active Tunnels', value: '127', icon: Network, color: T.blue },
            { label: 'Bandwidth (today)', value: '2.4 TB', icon: Activity, color: T.purple },
          ].map(item => (
            <div key={item.label} style={{ background: `${T.bg}80`, borderRadius: 8, padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
              <item.icon size={24} color={item.color} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{item.value}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Applications Tab ──────────────────────────────────────────────────────────

function ApplicationsTab() {
  const [filter, setFilter] = useState<'all' | 'shadow' | 'blocked'>('all');
  const shown = filter === 'all' ? APPLICATIONS
    : filter === 'shadow' ? APPLICATIONS.filter(a => a.category === 'Shadow IT')
    : APPLICATIONS.filter(a => a.status === 'blocked');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 16 }}>
        <StatCard icon={Cloud}       label="Sanctioned Apps"  value="12" color={T.green}  />
        <StatCard icon={AlertTriangle} label="Shadow IT Apps" value="4"  color={T.red}    />
        <StatCard icon={Shield}      label="CASB Policies"    value="8"  color={T.blue}   />
        <StatCard icon={XCircle}     label="Apps Blocked"     value="3"  color={T.yellow} />
      </div>

      {/* App catalog */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: T.text, fontSize: 15, fontWeight: 600, margin: 0 }}>Application Catalog</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['all', 'shadow', 'blocked'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                background: filter === f ? `${T.blue}30` : 'transparent',
                border: `1px solid ${filter === f ? T.blue : T.border}`,
                color: filter === f ? T.blue : T.muted,
                borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12,
              }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
            ))}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>
              {['App', 'Category', 'Risk', 'Data Class', 'Users', 'SSO', 'CASB', 'Status', 'Action'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map(app => (
              <tr key={app.id} style={{ borderBottom: `1px solid ${T.border}30`, color: T.text }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{app.name}</td>
                <td style={{ padding: '10px 12px', color: T.muted }}>{app.category}</td>
                <td style={{ padding: '10px 12px' }}><SevBadge sev={app.risk} /></td>
                <td style={{ padding: '10px 12px', fontSize: 12, color: T.muted }}>{app.dataClass}</td>
                <td style={{ padding: '10px 12px' }}>{app.users}</td>
                <td style={{ padding: '10px 12px' }}>
                  {app.sso ? <CheckCircle2 size={14} color={T.green} /> : <XCircle size={14} color={T.red} />}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  {app.casb ? <CheckCircle2 size={14} color={T.green} /> : <span style={{ color: T.muted, fontSize: 11 }}>—</span>}
                </td>
                <td style={{ padding: '10px 12px' }}><SevBadge sev={app.status} /></td>
                <td style={{ padding: '10px 12px' }}>
                  <select style={{
                    background: T.bg, border: `1px solid ${T.border}`, color: T.text,
                    borderRadius: 4, padding: '2px 6px', fontSize: 11, cursor: 'pointer',
                  }}>
                    <option value="allowed">Allow</option>
                    <option value="monitor">Monitor</option>
                    <option value="blocked">Block</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Devices Tab ───────────────────────────────────────────────────────────────

function DevicesTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <StatCard icon={CheckCircle2} label="Compliant"     value="4"  color={T.green}  />
        <StatCard icon={AlertTriangle} label="At Risk"      value="1"  color={T.yellow} />
        <StatCard icon={XCircle}      label="Non-Compliant" value="1"  color={T.red}    />
        <StatCard icon={Laptop}       label="Total Devices" value="6"  color={T.blue}   />
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
        <SectionHeader title="Device Inventory" action={<GhostBtn><Download size={12} />Export</GhostBtn>} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {DEVICES.map(dev => (
            <div key={dev.id} style={{
              background: `${T.bg}80`, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: `${T.blue}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {dev.os.includes('iOS') ? <Smartphone size={20} color={T.blue} /> : <Laptop size={20} color={T.blue} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: T.text }}>{dev.name}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{dev.user} · {dev.os} · Last seen: {dev.lastSeen}</div>
              </div>
              {/* Posture score bar */}
              <div style={{ width: 120 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: T.muted }}>Posture</span>
                  <span style={{ fontSize: 11, color: dev.posture >= 80 ? T.green : dev.posture >= 60 ? T.yellow : T.red, fontWeight: 700 }}>{dev.posture}</span>
                </div>
                <div style={{ height: 4, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${dev.posture}%`, background: dev.posture >= 80 ? T.green : dev.posture >= 60 ? T.yellow : T.red, borderRadius: 2 }} />
                </div>
              </div>
              {/* Checks */}
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label: 'Enc', ok: dev.encrypted },
                  { label: 'AV', ok: dev.av },
                  { label: 'MDM', ok: dev.mdm },
                ].map(c => (
                  <div key={c.label} style={{ textAlign: 'center' }}>
                    <div>{c.ok ? <CheckCircle2 size={14} color={T.green} /> : <XCircle size={14} color={T.red} />}</div>
                    <div style={{ fontSize: 9, color: T.muted }}>{c.label}</div>
                  </div>
                ))}
              </div>
              <SevBadge sev={dev.compliance} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <StatCard icon={Users}    label="Total Users"        value="342" color={T.blue}   />
        <StatCard icon={AlertTriangle} label="High Risk Users" value="2" color={T.red}    />
        <StatCard icon={UserX}    label="MFA Not Enrolled"   value="1"  color={T.yellow} />
        <StatCard icon={UserCheck} label="Privileged Users"  value="12" color={T.purple} />
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
        <SectionHeader title="User Risk Dashboard" action={<GhostBtn><Filter size={12} />Filter</GhostBtn>} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {USERS.map(u => (
            <div key={u.id} style={{
              background: `${T.bg}80`, border: `1px solid ${u.unusualActivity ? `${T.red}60` : T.border}`,
              borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', background: `${T.blue}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.blue, fontWeight: 700,
              }}>{u.name.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: T.text }}>{u.name}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{u.email} · {u.dept}</div>
              </div>
              <div style={{ textAlign: 'center', width: 90 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: u.risk >= 70 ? T.red : u.risk >= 40 ? T.yellow : T.green }}>{u.risk}</div>
                <div style={{ fontSize: 10, color: T.muted }}>Risk Score</div>
              </div>
              <div style={{ textAlign: 'center', width: 80 }}>
                {u.mfa ? <CheckCircle2 size={16} color={T.green} /> : <XCircle size={16} color={T.red} />}
                <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>MFA</div>
              </div>
              <div style={{ fontSize: 12, color: T.muted, width: 100 }}>
                <div style={{ color: T.text }}>{u.idp}</div>
                <div style={{ fontSize: 11 }}>IdP</div>
              </div>
              <div style={{ fontSize: 12, color: T.muted, width: 120 }}>
                <div style={{ fontSize: 11 }}>{u.lastLogin}</div>
              </div>
              {u.unusualActivity && (
                <div style={{ background: `${T.red}20`, border: `1px solid ${T.red}40`, borderRadius: 4, padding: '2px 8px', fontSize: 11, color: T.red, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={11} />Unusual
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Policies Tab ──────────────────────────────────────────────────────────────

function PoliciesTab() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [condition, setCondition] = useState('user.group == "Finance"');
  const [action, setAction] = useState('block');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
        <SectionHeader title="Security Policies" action={<GhostBtn onClick={() => setShowBuilder(b => !b)}><Plus size={12} />New Policy</GhostBtn>} />

        <AnimatePresence>
          {showBuilder && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ background: `${T.blue}10`, border: `1px solid ${T.blue}40`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h4 style={{ color: T.blue, margin: '0 0 12px', fontSize: 13 }}>Visual Policy Builder</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ color: T.muted, fontSize: 13 }}>IF</span>
                <input value={condition} onChange={e => setCondition(e.target.value)} style={{
                  background: T.bg, border: `1px solid ${T.border}`, color: T.text, borderRadius: 6, padding: '6px 10px', fontSize: 13, fontFamily: T.mono, width: 280,
                }} />
                <span style={{ color: T.muted, fontSize: 13 }}>THEN</span>
                <select value={action} onChange={e => setAction(e.target.value)} style={{
                  background: T.bg, border: `1px solid ${T.border}`, color: T.text, borderRadius: 6, padding: '6px 10px', fontSize: 13,
                }}>
                  <option value="allow">Allow</option>
                  <option value="block">Block</option>
                  <option value="mfa">Require MFA</option>
                  <option value="alert">Alert</option>
                  <option value="monitor">Monitor</option>
                </select>
                <button style={{ background: T.blue, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 13 }}>
                  Save Policy
                </button>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: T.muted, fontFamily: T.mono }}>
                Preview: {condition} → {action.toUpperCase()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>
              {['Policy', 'Type', 'Rules', 'Hits (24h)', 'Action', 'Status', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {POLICIES.map(p => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}30`, color: T.text }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: '10px 12px', color: T.muted, fontSize: 12 }}>{p.type}</td>
                <td style={{ padding: '10px 12px', color: T.blue }}>{p.rules}</td>
                <td style={{ padding: '10px 12px' }}>{p.hits.toLocaleString()}</td>
                <td style={{ padding: '10px 12px' }}><SevBadge sev={p.action} /></td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{
                    display: 'inline-flex', width: 36, height: 18, borderRadius: 9,
                    background: p.enabled ? `${T.green}40` : T.border,
                    alignItems: 'center', padding: '0 2px', cursor: 'pointer',
                    justifyContent: p.enabled ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: p.enabled ? T.green : T.muted }} />
                  </div>
                </td>
                <td style={{ padding: '10px 12px', display: 'flex', gap: 8 }}>
                  <GhostBtn><Settings size={11} /></GhostBtn>
                  <GhostBtn><Trash2 size={11} /></GhostBtn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Threats Tab ───────────────────────────────────────────────────────────────

function ThreatsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <StatCard icon={AlertTriangle} label="Active Threats"    value="2" color={T.red}    />
        <StatCard icon={Shield}        label="Blocked Today"     value="2,847" color={T.green}  />
        <StatCard icon={Eye}           label="Monitoring"        value="3" color={T.yellow} />
        <StatCard icon={Database}      label="CVEs (unpatched)"  value="1" color={T.red}    />
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
        <SectionHeader title="Active Threats" action={
          <div style={{ display: 'flex', gap: 8 }}>
            <GhostBtn><RefreshCw size={12} />Refresh</GhostBtn>
            <GhostBtn><Filter size={12} />Filter</GhostBtn>
          </div>
        } />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {THREATS.map(t => (
            <div key={t.id} style={{
              background: t.status === 'active' ? `${T.red}08` : `${T.bg}80`,
              border: `1px solid ${t.status === 'active' ? `${T.red}40` : T.border}`,
              borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: `${T.red}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={18} color={T.red} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: T.text }}>{t.name}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{t.type} · {t.source} → {t.target}</div>
              </div>
              <span style={{ color: T.muted, fontSize: 12 }}>{t.time}</span>
              <SevBadge sev={t.severity} />
              <SevBadge sev={t.status} />
              {t.status === 'active' && (
                <button style={{ background: T.red, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}>
                  Quarantine
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CVE tracking */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
        <SectionHeader title="CVE Tracking" action={<GhostBtn><Download size={12} />Export</GhostBtn>} />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>
              {['CVE', 'Product', 'CVSS', 'Severity', 'Patched'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CVE_LIST.map(cve => (
              <tr key={cve.id} style={{ borderBottom: `1px solid ${T.border}30`, color: T.text }}>
                <td style={{ padding: '10px 12px', fontFamily: T.mono, color: T.blue, fontSize: 12 }}>{cve.id}</td>
                <td style={{ padding: '10px 12px' }}>{cve.product}</td>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: cve.score >= 9 ? T.red : T.yellow }}>{cve.score.toFixed(1)}</td>
                <td style={{ padding: '10px 12px' }}><SevBadge sev={cve.severity} /></td>
                <td style={{ padding: '10px 12px' }}>
                  {cve.patched ? <CheckCircle2 size={16} color={T.green} /> : (
                    <span style={{ color: T.red, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                      <XCircle size={14} />Unpatched
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Logs Tab ──────────────────────────────────────────────────────────────────

function LogsTab() {
  const [logs, setLogs] = useState(LOG_STREAM_ENTRIES);
  const [filter, setFilter] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setLogs(prev => {
        const newEntry = {
          t: new Date().toTimeString().slice(0, 8),
          lvl: ['INFO', 'INFO', 'INFO', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 5)],
          user: ['sona@corp.com', 'system', 'api-gw', 'echo@internal'][Math.floor(Math.random() * 4)],
          action: ['AUTH', 'ACCESS', 'API', 'NETWORK', 'DLP'][Math.floor(Math.random() * 5)],
          msg: ['Policy check passed', 'Token refreshed', 'Rate limit check ok', 'Connection verified'][Math.floor(Math.random() * 4)],
        };
        return [newEntry, ...prev].slice(0, 100);
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (autoScroll && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filtered = filter ? logs.filter(l => l.msg.toLowerCase().includes(filter.toLowerCase()) || l.user.toLowerCase().includes(filter.toLowerCase())) : logs;
  const levelColor = (lvl: string) => ({ CRITICAL: T.red, HIGH: '#ff6600', MEDIUM: T.yellow, LOW: T.blue, INFO: T.muted }[lvl] ?? T.muted);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} color={T.muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={filter} onChange={e => setFilter(e.target.value)}
            placeholder="Filter logs…"
            style={{ width: '100%', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px 8px 34px', color: T.text, fontSize: 13, boxSizing: 'border-box' }}
          />
        </div>
        <button onClick={() => setAutoScroll(a => !a)} style={{
          background: autoScroll ? `${T.green}20` : 'transparent', border: `1px solid ${autoScroll ? T.green : T.border}`,
          color: autoScroll ? T.green : T.muted, borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Radio size={12} />Live
        </button>
        <GhostBtn><Download size={12} />Export</GhostBtn>
      </div>

      {/* Log stream */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ background: T.bg, padding: '8px 16px', display: 'flex', gap: 16, fontSize: 11, color: T.muted, fontFamily: T.mono, borderBottom: `1px solid ${T.border}` }}>
          <span style={{ width: 80 }}>TIME</span>
          <span style={{ width: 70 }}>LEVEL</span>
          <span style={{ width: 80 }}>ACTION</span>
          <span style={{ width: 160 }}>USER/SOURCE</span>
          <span>MESSAGE</span>
        </div>
        <div style={{ height: 500, overflowY: 'auto', fontFamily: T.mono, fontSize: 12 }}>
          {filtered.map((entry, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              style={{
                display: 'flex', gap: 16, padding: '5px 16px',
                borderBottom: `1px solid ${T.border}20`,
                background: entry.lvl === 'CRITICAL' ? `${T.red}08` : entry.lvl === 'HIGH' ? `${T.yellow}05` : 'transparent',
              }}>
              <span style={{ color: T.muted, width: 80, flexShrink: 0 }}>{entry.t}</span>
              <span style={{ color: levelColor(entry.lvl), width: 70, flexShrink: 0, fontWeight: 700 }}>{entry.lvl}</span>
              <span style={{ color: T.blue, width: 80, flexShrink: 0 }}>{entry.action}</span>
              <span style={{ color: T.muted, width: 160, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.user}</span>
              <span style={{ color: T.text, flex: 1 }}>{entry.msg}</span>
            </motion.div>
          ))}
          <div ref={endRef} />
        </div>
      </div>

      {/* SIEM integration */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
        <SectionHeader title="SIEM Integration" />
        <div style={{ display: 'flex', gap: 12 }}>
          {['Splunk', 'Microsoft Sentinel', 'Elastic SIEM', 'AWS Security Hub'].map(siem => (
            <div key={siem} style={{ background: `${T.bg}80`, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, color: T.muted, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: siem === 'Splunk' ? T.green : T.border }} />
              {siem}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ZeroTrustPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');

  const tabContent: Record<Tab, React.ReactNode> = {
    Dashboard: <DashboardTab />,
    Network:   <NetworkTab />,
    Applications: <ApplicationsTab />,
    Devices:   <DevicesTab />,
    Users:     <UsersTab />,
    Policies:  <PoliciesTab />,
    Threats:   <ThreatsTab />,
    Logs:      <LogsTab />,
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Top header */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0' }}>
          <div style={{ background: `${T.blue}20`, borderRadius: 10, padding: 10 }}>
            <Shield size={24} color={T.blue} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text }}>Zero Trust Security Center</h1>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Brix OS · Enterprise Security Platform</div>
          </div>
          <div style={{ flex: 1 }} />
          {/* Live status indicators */}
          <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.green }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.green, boxShadow: `0 0 8px ${T.green}` }} />
              ZT Engine Active
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.red }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.red, animation: 'pulse 1s infinite' }} />
              5 Active Threats
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.muted }}>
              <Clock size={12} />
              {new Date().toLocaleTimeString()}
            </div>
          </div>
          <button style={{
            background: `${T.red}20`, border: `1px solid ${T.red}40`, color: T.red,
            borderRadius: 8, padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
          }}>
            <Bell size={14} />Emergency Lockdown
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: 'transparent', border: 'none',
              borderBottom: `2px solid ${activeTab === tab ? T.blue : 'transparent'}`,
              color: activeTab === tab ? T.blue : T.muted,
              padding: '10px 18px', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
              transition: 'all 0.15s',
            }}>{tab}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {tabContent[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${T.bg}; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
      `}</style>
    </div>
  );
}
