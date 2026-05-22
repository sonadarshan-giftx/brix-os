import { useState } from "react";
import {
  CreditCard,
  Calendar,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  AlertTriangle,
  Users,
  HardDrive,
  Zap,
  BrainCircuit,
  Shield,
  Sparkles,
  X,
} from "lucide-react";

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
const currentPlan = {
  tier: "Pro",
  price: "$29",
  period: "per user / month",
  renewalDate: "March 15, 2025",
  status: "Active",
  users: 3,
};

const usage = [
  { label: "Seats", used: 3, total: 5, unit: "", icon: Users, color: PRIMARY },
  { label: "Storage", used: 2.1, total: 10, unit: "GB", icon: HardDrive, color: SUCCESS },
  { label: "API Calls", used: 45, total: 100, unit: "K", icon: Zap, color: WARNING },
  { label: "AI Tokens", used: 850, total: 2000, unit: "K", icon: BrainCircuit, color: PRIMARY },
];

const invoices = Array.from({ length: 10 }, (_, i) => ({
  id: `INV-2024-${String(12 - i).padStart(2, "0")}`,
  date: `2024-${String(12 - i).padStart(2, "0")}-15`,
  amount: ["87.00", "87.00", "87.00", "87.00", "87.00", "58.00", "58.00", "58.00", "29.00", "29.00"][i],
  status: i < 8 ? "Paid" : i === 8 ? "Failed" : "Pending",
}));

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "For individuals exploring the platform",
    features: ["1 user", "1GB storage", "1K API calls/mo", "Community support", "Basic analytics"],
    current: false,
    cta: "Downgrade",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/ user / month",
    description: "For growing teams that need more power",
    features: ["Unlimited users", "10GB storage", "100K API calls/mo", "Priority support", "Advanced analytics", "AI assistant", "SSO"],
    current: true,
    cta: "Current Plan",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations with custom needs",
    features: ["Unlimited everything", "Dedicated infra", "Unlimited API", "24/7 phone support", "Custom AI models", "SLA guarantee", "Audit logs", "Onboarding"],
    current: false,
    cta: "Contact Sales",
  },
];

/* ─── Sub-components ─── */
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

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: SURFACE,
        borderRadius: RADIUS,
        padding: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function ProgressBar({
  used,
  total,
  color,
  label,
  unit,
}: {
  used: number;
  total: number;
  color: string;
  label: string;
  unit: string;
}) {
  const pct = Math.min(100, Math.round((used / total) * 100));
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
        <span style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>{label}</span>
        <span style={{ color: TEXT_SECONDARY }}>
          {used}{unit} / {total}{unit}
        </span>
      </div>
      <div style={{ width: "100%", height: 8, borderRadius: 4, background: "#e5e5e5", overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 4,
            background: color,
            transition: "width 0.5s ease",
          }}
        />
      </div>
      <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginTop: 4 }}>{pct}% used</div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function BillingPage() {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [apiSubscription, setApiSubscription] = useState<any>(null);
  const [apiInvoices, setApiInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stripeConfigured, setStripeConfigured] = useState(false);

  const token = localStorage.getItem('brixstac_token') || '';

  useEffect(() => {
    const load = async () => {
      try {
        const [subRes, invRes] = await Promise.all([
          fetch('/api/billing/subscription', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/billing/invoices', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (subRes.ok) { const s = await subRes.json(); setApiSubscription(s); setStripeConfigured(s?.stripeConfigured || false); }
        if (invRes.ok) { const i = await invRes.json(); setApiInvoices(Array.isArray(i) ? i : []); }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDownload = (invoiceId: string) => {
    showToast(`Invoice ${invoiceId} downloaded`, "success");
  };

  const handleChangePlan = async (planId: string) => {
    try {
      const res = await fetch('/api/billing/subscription', { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ planId }) });
      const data = await res.json();
      if (data.success) { setApiSubscription(data.subscription); showToast(data.message || `Switched to ${planId} plan`, 'success'); }
      else showToast(data.error || 'Failed to update plan', 'error');
    } catch { showToast('Failed to update plan', 'error'); }
  };

  const handleCancel = async () => {
    if (cancelConfirm.trim().toLowerCase() !== "cancel") {
      showToast("Please type 'cancel' to confirm", "error");
      return;
    }
    try {
      const res = await fetch('/api/billing/subscription/cancel', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setShowCancelModal(false);
      setCancelConfirm("");
      if (data.success) { setApiSubscription((p: any) => p ? { ...p, cancelAtPeriodEnd: true, status: 'CANCELLED' } : p); showToast(data.message || 'Subscription cancelled.', 'info'); }
      else showToast(data.error || 'Failed to cancel', 'error');
    } catch { showToast('Failed to cancel subscription', 'error'); }
  };

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
        <h1 style={{ fontSize: 26, fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 4 }}>Billing</h1>
        <p style={{ fontSize: 14, color: TEXT_SECONDARY }}>Manage your subscription, usage, and payment methods</p>
      </div>

      {/* Current Plan */}
      <SectionTitle>Current Plan</SectionTitle>
      <Card style={{ marginBottom: 24, border: `2px solid ${PRIMARY}25` }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <Sparkles size={22} color={PRIMARY} />
              <span style={{ fontSize: 22, fontWeight: 800, color: TEXT_PRIMARY }}>{currentPlan.tier}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 20,
                  background: `${SUCCESS}15`,
                  color: SUCCESS,
                  textTransform: "uppercase",
                }}
              >
                {currentPlan.status}
              </span>
            </div>
            <div style={{ fontSize: 14, color: TEXT_SECONDARY, marginBottom: 4 }}>
              {currentPlan.price} <span style={{ fontSize: 13, color: TEXT_SECONDARY }}>{currentPlan.period}</span>
            </div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY, display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar size={14} />
              Renews on {currentPlan.renewalDate}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: PRIMARY,
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={() => showToast("Change plan drawer opened", "info")}
            >
              Change Plan
            </button>
          </div>
        </div>
      </Card>

      {/* Usage Breakdown */}
      <SectionTitle>Usage Breakdown</SectionTitle>
      <Card style={{ marginBottom: 24 }}>
        {usage.map((u) => (
          <ProgressBar
            key={u.label}
            label={u.label}
            used={u.used}
            total={u.total}
            color={u.color}
            unit={u.unit}
          />
        ))}
      </Card>

      {/* Payment Method */}
      <SectionTitle>Payment Method</SectionTitle>
      <Card style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 32,
                borderRadius: 6,
                background: "#1a1a1a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CreditCard size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>Visa ending in 4242</div>
              <div style={{ fontSize: 12, color: TEXT_SECONDARY }}>Expires 12/26</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #e5e5e5",
                background: SURFACE,
                color: TEXT_PRIMARY,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={() => showToast("Payment method update form opened", "info")}
            >
              Update
            </button>
            <button
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #e5e5e5",
                background: SURFACE,
                color: TEXT_PRIMARY,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={() => showToast("Add backup payment method", "info")}
            >
              Add Backup Method
            </button>
          </div>
        </div>
      </Card>

      {/* Billing History */}
      <SectionTitle>Billing History</SectionTitle>
      <Card style={{ marginBottom: 24, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Date", "Invoice #", "Amount", "Status", ""].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: h === "" ? "right" : "left",
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
            {invoices.map((inv) => (
              <tr key={inv.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "12px", color: TEXT_PRIMARY }}>{inv.date}</td>
                <td style={{ padding: "12px", color: TEXT_SECONDARY, fontFamily: "monospace", fontSize: 12 }}>{inv.id}</td>
                <td style={{ padding: "12px", color: TEXT_PRIMARY, fontWeight: 600 }}>${inv.amount}</td>
                <td style={{ padding: "12px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 20,
                      background:
                        inv.status === "Paid" ? `${SUCCESS}15` : inv.status === "Failed" ? `${ERROR}15` : `${WARNING}15`,
                      color: inv.status === "Paid" ? SUCCESS : inv.status === "Failed" ? ERROR : WARNING,
                    }}
                  >
                    {inv.status === "Paid" ? <CheckCircle2 size={13} /> : inv.status === "Failed" ? <XCircle size={13} /> : <Clock size={13} />}
                    {inv.status}
                  </span>
                </td>
                <td style={{ padding: "12px", textAlign: "right" }}>
                  <button
                    onClick={() => handleDownload(inv.id)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: TEXT_SECONDARY,
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                    title="Download PDF"
                  >
                    <Download size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Change Plan */}
      <SectionTitle>Change Plan</SectionTitle>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {plans.map((plan) => (
          <Card
            key={plan.name}
            style={{
              border: plan.current ? `2px solid ${PRIMARY}` : "1px solid #e5e5e5",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {plan.current && (
              <div
                style={{
                  position: "absolute",
                  top: -1,
                  right: 20,
                  background: PRIMARY,
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: "0 0 6px 6px",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Current
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 4 }}>{plan.name}</h3>
              <div style={{ fontSize: 28, fontWeight: 800, color: PRIMARY, marginBottom: 2 }}>
                {plan.price}
                {plan.period && <span style={{ fontSize: 14, color: TEXT_SECONDARY, fontWeight: 500 }}>{plan.period}</span>}
              </div>
              <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4 }}>{plan.description}</p>
            </div>
            <div style={{ flex: 1 }}>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px" }}>
                {plan.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: TEXT_SECONDARY,
                      padding: "4px 0",
                    }}
                  >
                    <CheckCircle2 size={14} color={SUCCESS} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <button
              disabled={plan.current}
              onClick={() => showToast(`${plan.cta} — ${plan.name} plan selected`, plan.current ? "info" : "success")}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                border: plan.current ? "none" : `1px solid ${PRIMARY}`,
                background: plan.current ? `${PRIMARY}15` : PRIMARY,
                color: plan.current ? PRIMARY : "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: plan.current ? "default" : "pointer",
                opacity: plan.current ? 0.7 : 1,
              }}
            >
              {plan.current ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <CheckCircle2 size={16} /> Current Plan
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {plan.cta} <ChevronRight size={16} />
                </span>
              )}
            </button>
          </Card>
        ))}
      </div>

      {/* Cancel Subscription — Danger Zone */}
      <SectionTitle>Danger Zone</SectionTitle>
      <Card style={{ border: `1px solid ${ERROR}30` }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `${ERROR}12`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} color={ERROR} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 4 }}>Cancel Subscription</h3>
            <p style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.6, marginBottom: 14 }}>
              Cancelling will downgrade your workspace to the free Starter plan at the end of your billing period. All Pro features will be lost.
            </p>
            <button
              onClick={() => setShowCancelModal(true)}
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                border: `1px solid ${ERROR}`,
                background: SURFACE,
                color: ERROR,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancel Subscription
            </button>
          </div>
        </div>
      </Card>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9998,
            padding: 24,
          }}
          onClick={() => setShowCancelModal(false)}
        >
          <div
            style={{
              background: SURFACE,
              borderRadius: RADIUS,
              padding: "28px 32px",
              maxWidth: 440,
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY }}>Cancel Subscription</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_SECONDARY }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.6, marginBottom: 20 }}>
              This action cannot be undone. Your subscription will remain active until <strong>{currentPlan.renewalDate}</strong>, then downgrade to Starter.
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 6 }}>
                Type <code style={{ background: "#eee", padding: "1px 4px", borderRadius: 4, fontFamily: "monospace" }}>cancel</code> to confirm
              </label>
              <input
                type="text"
                value={cancelConfirm}
                onChange={(e) => setCancelConfirm(e.target.value)}
                placeholder="Type 'cancel' to confirm"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: `1px solid ${cancelConfirm.trim().toLowerCase() === "cancel" ? SUCCESS : "#ddd"}`,
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: "1px solid #e5e5e5",
                  background: SURFACE,
                  color: TEXT_PRIMARY,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancel}
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: ERROR,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}

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
