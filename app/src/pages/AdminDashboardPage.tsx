import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Building2,
  DollarSign,
  TrendingDown,
  Ticket,
  Activity,
  Send,
  Flag,
  FileText,
  Download,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Layers,
  ScrollText,
  Database,
} from "lucide-react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/* ─── Design Tokens ─── */
const PRIMARY = "#5b5fc7";
const BG = "#f5f5f3";
const SURFACE = "#ffffff";
const TEXT_PRIMARY = "#242424";
const TEXT_SECONDARY = "#616161";
const ERROR = "#c4314b";
const WARNING = "#d97706";
const SUCCESS = "#237b4b";
const RADIUS = 12;

/* ─── Mock Data ─── */
const revenueData = [
  { month: "Jan", revenue: 12400 },
  { month: "Feb", revenue: 14200 },
  { month: "Mar", revenue: 13800 },
  { month: "Apr", revenue: 16500 },
  { month: "May", revenue: 18900 },
  { month: "Jun", revenue: 20100 },
  { month: "Jul", revenue: 23400 },
  { month: "Aug", revenue: 22100 },
  { month: "Sep", revenue: 25600 },
  { month: "Oct", revenue: 27200 },
  { month: "Nov", revenue: 28900 },
  { month: "Dec", revenue: 31000 },
];

const userGrowthData = [
  { month: "Jan", users: 120 },
  { month: "Feb", users: 145 },
  { month: "Mar", users: 168 },
  { month: "Apr", users: 195 },
  { month: "May", users: 230 },
  { month: "Jun", users: 268 },
  { month: "Jul", users: 310 },
  { month: "Aug", users: 342 },
  { month: "Sep", users: 390 },
  { month: "Oct", users: 435 },
  { month: "Nov", users: 480 },
  { month: "Dec", users: 520 },
];

const planDistributionData = [
  { name: "Starter", value: 320, color: "#EBB59C" },
  { name: "Pro", value: 160, color: PRIMARY },
  { name: "Enterprise", value: 40, color: "#7A3A1E" },
];

const signups = Array.from({ length: 28 }, (_, i) => ({
  id: i + 1,
  name: [
    "Alice Johnson", "Bob Smith", "Carol White", "David Brown", "Eva Green",
    "Frank Lee", "Grace Kim", "Henry Davis", "Ivy Chen", "Jack Wilson",
    "Kate Moore", "Liam Taylor", "Mia Anderson", "Noah Thomas", "Olivia Jackson",
    "Paul Harris", "Quinn Clark", "Ryan Lewis", "Sophia Walker", "Tom Hall",
    "Uma Young", "Victor King", "Wendy Wright", "Xavier Lopez", "Yara Hill",
    "Zack Scott", "Amy Adams", "Ben Baker"
  ][i],
  email: `user${i + 1}@example.com`,
  workspace: ["Acme Corp", "Beta Inc", "Gamma LLC", "Delta Co", "Epsilon Ltd"][i % 5],
  plan: ["Starter", "Pro", "Enterprise"][i % 3],
  date: `2024-01-${String((i % 28) + 1).padStart(2, "0")}`,
  status: i < 25 ? "Active" : "Pending",
}));

const systemHealth = [
  {
    name: "API",
    status: "healthy",
    uptime: "99.98%",
    lastIncident: "14 days ago",
    icon: Activity,
    color: SUCCESS,
  },
  {
    name: "Database",
    status: "healthy",
    uptime: "99.99%",
    lastIncident: "32 days ago",
    icon: Database,
    color: SUCCESS,
  },
  {
    name: "WebSocket",
    status: "healthy",
    uptime: "99.95%",
    lastIncident: "7 days ago",
    icon: Layers,
    color: SUCCESS,
  },
  {
    name: "AI Service",
    status: "degraded",
    uptime: "97.40%",
    lastIncident: "2 hours ago",
    icon: AlertTriangle,
    color: WARNING,
  },
];

/* ─── Sub-components ─── */
function StatCard({
  title,
  value,
  change,
  icon: Icon,
  changePositive,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  changePositive: boolean;
}) {
  return (
    <div
      style={{
        background: SURFACE,
        borderRadius: RADIUS,
        padding: "20px 24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: TEXT_SECONDARY, fontWeight: 500 }}>{title}</span>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `${PRIMARY}12`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={18} color={PRIMARY} />
        </div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: changePositive ? SUCCESS : ERROR, fontWeight: 600 }}>
        {changePositive ? "+" : ""}{change} from last month
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 18,
        fontWeight: 700,
        color: TEXT_PRIMARY,
        marginBottom: 16,
        marginTop: 8,
      }}
    >
      {children}
    </h2>
  );
}

/* ─── Main Page ─── */
export default function AdminDashboardPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signupPage, setSignupPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setUserRole("Admin");
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const paginatedSignups = useMemo(() => {
    const start = (signupPage - 1) * itemsPerPage;
    return signups.slice(start, start + itemsPerPage);
  }, [signupPage]);

  const totalPages = Math.ceil(signups.length / itemsPerPage);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ color: TEXT_SECONDARY, fontSize: 14 }}>Loading admin dashboard...</div>
      </div>
    );
  }

  if (userRole !== "Owner" && userRole !== "Admin") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, system-ui, sans-serif",
          padding: 24,
        }}
      >
        <div
          style={{
            background: SURFACE,
            borderRadius: RADIUS,
            padding: "48px 40px",
            textAlign: "center",
            maxWidth: 420,
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          }}
        >
          <ShieldAlert size={48} color={ERROR} style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 8 }}>Access Denied</h2>
          <p style={{ fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.6 }}>
            You do not have permission to view this page. Admin access is restricted to Owners and Admins only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        fontFamily: "Inter, system-ui, sans-serif",
        color: TEXT_PRIMARY,
        padding: "24px 32px",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 4 }}>Admin Dashboard</h1>
        <p style={{ fontSize: 14, color: TEXT_SECONDARY }}>Overview of platform health, revenue, and user activity</p>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <StatCard title="Total Users" value="1,248" change="12.5%" icon={Users} changePositive />
        <StatCard title="Active Workspaces" value="86" change="8.3%" icon={Building2} changePositive />
        <StatCard title="MRR" value="$31,000" change="15.2%" icon={DollarSign} changePositive />
        <StatCard title="Churn Rate" value="2.4%" change="0.3%" icon={TrendingDown} changePositive={false} />
        <StatCard title="Support Tickets" value="18" change="5" icon={Ticket} changePositive={false} />
        <StatCard title="API Usage" value="2.4M" change="22%" icon={Activity} changePositive />
      </div>

      {/* Charts */}
      <SectionTitle>Analytics</SectionTitle>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20,
          marginBottom: 28,
        }}
      >
        {/* Revenue Area Chart */}
        <div
          style={{
            background: SURFACE,
            borderRadius: RADIUS,
            padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            minWidth: 0,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 12 }}>Revenue</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: TEXT_SECONDARY }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: TEXT_SECONDARY }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 13 }}
              />
              <Area type="monotone" dataKey="revenue" stroke={PRIMARY} strokeWidth={2.5} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth Line Chart */}
        <div
          style={{
            background: SURFACE,
            borderRadius: RADIUS,
            padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            minWidth: 0,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 12 }}>User Growth</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: TEXT_SECONDARY }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: TEXT_SECONDARY }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value: number) => [`${value}`, "Users"]}
                contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 13 }}
              />
              <Line type="monotone" dataKey="users" stroke={SUCCESS} strokeWidth={2.5} dot={{ r: 4, fill: SUCCESS, strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Distribution Pie Chart */}
        <div
          style={{
            background: SURFACE,
            borderRadius: RADIUS,
            padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            minWidth: 0,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 12 }}>Plan Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={planDistributionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {planDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value} users`, name]}
                contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 13 }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                formatter={(value) => <span style={{ fontSize: 12, color: TEXT_SECONDARY }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Signups Table */}
      <SectionTitle>Recent Signups</SectionTitle>
      <div
        style={{
          background: SURFACE,
          borderRadius: RADIUS,
          padding: "20px 24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          marginBottom: 28,
          overflowX: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Name", "Email", "Workspace", "Plan", "Date", "Status"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    color: TEXT_SECONDARY,
                    fontWeight: 600,
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    borderBottom: "1px solid #eee",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedSignups.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "12px", fontWeight: 500, color: TEXT_PRIMARY }}>{u.name}</td>
                <td style={{ padding: "12px", color: TEXT_SECONDARY }}>{u.email}</td>
                <td style={{ padding: "12px", color: TEXT_SECONDARY }}>{u.workspace}</td>
                <td style={{ padding: "12px" }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: 20,
                      background:
                        u.plan === "Enterprise" ? `${PRIMARY}15` : u.plan === "Pro" ? `${SUCCESS}15` : "#e5e5e5",
                      color:
                        u.plan === "Enterprise" ? PRIMARY : u.plan === "Pro" ? SUCCESS : TEXT_SECONDARY,
                    }}
                  >
                    {u.plan}
                  </span>
                </td>
                <td style={{ padding: "12px", color: TEXT_SECONDARY }}>{u.date}</td>
                <td style={{ padding: "12px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      color: u.status === "Active" ? SUCCESS : WARNING,
                    }}
                  >
                    {u.status === "Active" ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
          <span style={{ fontSize: 12, color: TEXT_SECONDARY }}>
            Showing {(signupPage - 1) * itemsPerPage + 1}–{Math.min(signupPage * itemsPerPage, signups.length)} of {signups.length}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setSignupPage((p) => Math.max(1, p - 1))}
              disabled={signupPage === 1}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #e5e5e5",
                background: SURFACE,
                cursor: signupPage === 1 ? "not-allowed" : "pointer",
                opacity: signupPage === 1 ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: 13, color: TEXT_PRIMARY, padding: "6px 0" }}>
              Page {signupPage} of {totalPages}
            </span>
            <button
              onClick={() => setSignupPage((p) => Math.min(totalPages, p + 1))}
              disabled={signupPage === totalPages}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #e5e5e5",
                background: SURFACE,
                cursor: signupPage === totalPages ? "not-allowed" : "pointer",
                opacity: signupPage === totalPages ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* System Health */}
      <SectionTitle>System Health</SectionTitle>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {systemHealth.map((svc) => (
          <div
            key={svc.name}
            style={{
              background: SURFACE,
              borderRadius: RADIUS,
              padding: "20px 24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              borderLeft: `4px solid ${svc.color}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <svc.icon size={20} color={svc.color} />
              <span style={{ fontWeight: 700, fontSize: 15, color: TEXT_PRIMARY }}>{svc.name}</span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 20,
                  background: svc.status === "healthy" ? `${SUCCESS}15` : `${WARNING}15`,
                  color: svc.status === "healthy" ? SUCCESS : WARNING,
                  textTransform: "uppercase",
                }}
              >
                {svc.status}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: TEXT_SECONDARY }}>
              <span>Uptime: <strong style={{ color: TEXT_PRIMARY }}>{svc.uptime}</strong></span>
              <span>Last incident: <strong style={{ color: svc.color }}>{svc.lastIncident}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <SectionTitle>Quick Actions</SectionTitle>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          marginBottom: 40,
        }}
      >
        {[
          { label: "Send Announcement", icon: Megaphone, action: () => showToast("Announcement composer opened", "info") },
          { label: "Manage Feature Flags", icon: Flag, action: () => showToast("Feature flags panel opened", "info") },
          { label: "View Audit Logs", icon: ScrollText, action: () => showToast("Audit logs loading...", "info") },
          { label: "Export User Data", icon: Download, action: () => showToast("Export started. Check your email.", "success") },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={btn.action}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 18px",
              borderRadius: RADIUS,
              border: "1px solid #e5e5e5",
              background: SURFACE,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              color: TEXT_PRIMARY,
              transition: "all 0.15s ease",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = PRIMARY;
              (e.currentTarget as HTMLButtonElement).style.color = PRIMARY;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e5e5";
              (e.currentTarget as HTMLButtonElement).style.color = TEXT_PRIMARY;
            }}
          >
            <btn.icon size={18} />
            {btn.label}
          </button>
        ))}
      </div>

      {/* Inline Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            padding: "14px 22px",
            borderRadius: RADIUS,
            background:
              toast.type === "success" ? SUCCESS : toast.type === "error" ? ERROR : PRIMARY,
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            zIndex: 9999,
            animation: "slideIn 0.25s ease",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {toast.type === "success" && <CheckCircle2 size={18} />}
          {toast.type === "error" && <AlertTriangle size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
