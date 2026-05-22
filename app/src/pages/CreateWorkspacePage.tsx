import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Building2,
  Users,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Plus,
  Crown,
  Sparkles,
  Shield,
} from "lucide-react";

// Inline toast
function useToast() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; visible: boolean } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const ToastComponent = toast?.visible ? (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg"
      style={{
        background: toast.type === "success" ? "#237b4b" : "#dc2626",
        color: "#ffffff",
      }}
    >
      {toast.type === "success" ? <Check size={18} /> : <X size={18} />}
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  ) : null;

  return { showToast, ToastComponent };
}

interface Invitee {
  email: string;
  role: "Member" | "Manager";
}

const industries = [
  "Software",
  "Fintech",
  "Healthcare",
  "E-commerce",
  "AI/ML",
  "Other",
];

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "For small teams getting started",
    features: ["Up to 5 members", "5GB storage", "Basic analytics", "Email support"],
    recommended: false,
    icon: Sparkles,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/user/mo",
    description: "For growing teams that need more power",
    features: [
      "Unlimited members",
      "100GB storage",
      "Advanced analytics",
      "Priority support",
      "Custom integrations",
      "SSO ready",
    ],
    recommended: true,
    icon: Crown,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations with advanced needs",
    features: [
      "Everything in Pro",
      "Unlimited storage",
      "Dedicated success manager",
      "Custom contracts",
      "Advanced security",
      "On-premise option",
    ],
    recommended: false,
    icon: Shield,
  },
];

function kebabCase(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CreateWorkspacePage() {
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();

  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Member" | "Manager">("Member");
  const [invitees, setInvitees] = useState<Invitee[]>([]);

  const [selectedPlan, setSelectedPlan] = useState("Pro");

  useEffect(() => {
    setSlug(kebabCase(workspaceName));
  }, [workspaceName]);

  const canProceedStep1 = workspaceName.trim().length > 0 && industry !== "";

  const addInvitee = () => {
    const email = inviteEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    if (invitees.some((i) => i.email === email)) return;
    setInvitees([...invitees, { email, role: inviteRole }]);
    setInviteEmail("");
    setInviteRole("Member");
  };

  const removeInvitee = (email: string) => {
    setInvitees(invitees.filter((i) => i.email !== email));
  };

  const updateInviteeRole = (email: string, role: "Member" | "Manager") => {
    setInvitees(invitees.map((i) => (i.email === email ? { ...i, role } : i)));
  };

  const handleCreate = () => {
    // Save workspace to store (mock)
    const workspace = {
      id: crypto.randomUUID?.() || Date.now().toString(),
      name: workspaceName,
      slug,
      description,
      industry,
      plan: selectedPlan,
      invitees,
      createdAt: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem("brixstac_workspaces") || "[]");
    localStorage.setItem("brixstac_workspaces", JSON.stringify([...existing, workspace]));

    showToast("Workspace created successfully!", "success");
    setTimeout(() => navigate("/projects"), 800);
  };

  const stepTitles = ["Create your workspace", "Invite your team", "Choose your plan"];

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "#f5f5f3", fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* Progress Header */}
      <div className="w-full border-b" style={{ borderColor: "#d1d1d1", background: "#ffffff" }}>
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: "#5b5fc7" }}
              >
                <Building2 size={20} color="#ffffff" />
              </div>
              <span className="text-lg font-semibold" style={{ color: "#242424" }}>
                Brixstac
              </span>
            </div>
            <span className="text-sm font-medium" style={{ color: "#616161" }}>
              Step {step} of 3
            </span>
          </div>

          {/* Progress bars */}
          <div className="flex gap-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1">
                <div
                  className="h-2 w-full rounded-full transition-all duration-300"
                  style={{
                    background: s <= step ? "#5b5fc7" : "#d1d1d1",
                    opacity: s < step ? 0.6 : 1,
                  }}
                />
                <p
                  className="mt-2 text-xs font-medium"
                  style={{ color: s <= step ? "#5b5fc7" : "#616161" }}
                >
                  {stepTitles[s - 1]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div
          className="rounded-xl border p-6 shadow-sm sm:p-8"
          style={{ background: "#ffffff", borderColor: "#d1d1d1", borderRadius: "12px" }}
        >
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold" style={{ color: "#242424" }}>
                  Create your workspace
                </h1>
                <p className="mt-1 text-sm" style={{ color: "#616161" }}>
                  Set up the foundation for your team
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: "#242424" }}>
                    Workspace name <span style={{ color: "#5b5fc7" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#5b5fc7] focus:ring-1 focus:ring-[#5b5fc7]"
                    style={{ borderColor: "#d1d1d1", color: "#242424", borderRadius: "12px" }}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: "#242424" }}>
                    Workspace slug
                  </label>
                  <div className="relative">
                    <span
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                      style={{ color: "#616161" }}
                    >
                      brixstac.io/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      readOnly
                      className="w-full rounded-lg border bg-gray-50 px-3 py-2.5 pl-[5.5rem] text-sm"
                      style={{ borderColor: "#d1d1d1", color: "#616161", borderRadius: "12px" }}
                    />
                  </div>
                  <p className="mt-1 text-xs" style={{ color: "#616161" }}>
                    Auto-generated from your workspace name
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: "#242424" }}>
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does your team work on?"
                    rows={3}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#5b5fc7] focus:ring-1 focus:ring-[#5b5fc7]"
                    style={{ borderColor: "#d1d1d1", color: "#242424", borderRadius: "12px", resize: "vertical" }}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: "#242424" }}>
                    Industry <span style={{ color: "#5b5fc7" }}>*</span>
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#5b5fc7] focus:ring-1 focus:ring-[#5b5fc7]"
                    style={{ borderColor: "#d1d1d1", color: "#242424", borderRadius: "12px" }}
                  >
                    <option value="">Select an industry</option>
                    {industries.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold" style={{ color: "#242424" }}>
                  Invite your team
                </h1>
                <p className="mt-1 text-sm" style={{ color: "#616161" }}>
                  Add colleagues to collaborate in your workspace
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addInvitee()}
                  placeholder="colleague@company.com"
                  className="flex-1 rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#5b5fc7] focus:ring-1 focus:ring-[#5b5fc7]"
                  style={{ borderColor: "#d1d1d1", color: "#242424", borderRadius: "12px" }}
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "Member" | "Manager")}
                  className="rounded-lg border px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: "#d1d1d1", color: "#242424", borderRadius: "12px" }}
                >
                  <option value="Member">Member</option>
                  <option value="Manager">Manager</option>
                </select>
                <button
                  onClick={addInvitee}
                  disabled={!inviteEmail.trim()}
                  className="flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-50"
                  style={{ background: "#5b5fc7", borderRadius: "12px" }}
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>

              {invitees.length > 0 && (
                <div
                  className="rounded-xl border"
                  style={{ borderColor: "#d1d1d1", borderRadius: "12px" }}
                >
                  {invitees.map((inv, idx) => (
                    <div
                      key={inv.email}
                      className="flex items-center justify-between px-4 py-3"
                      style={{
                        borderBottom: idx < invitees.length - 1 ? "1px solid #d1d1d1" : "none",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white"
                          style={{ background: "#5b5fc7" }}
                        >
                          {inv.email[0].toUpperCase()}
                        </div>
                        <span className="text-sm" style={{ color: "#242424" }}>
                          {inv.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={inv.role}
                          onChange={(e) =>
                            updateInviteeRole(inv.email, e.target.value as "Member" | "Manager")
                          }
                          className="rounded-lg border px-2 py-1 text-xs outline-none"
                          style={{ borderColor: "#d1d1d1", color: "#242424", borderRadius: "8px" }}
                        >
                          <option value="Member">Member</option>
                          <option value="Manager">Manager</option>
                        </select>
                        <button
                          onClick={() => removeInvitee(inv.email)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
                        >
                          <X size={14} style={{ color: "#616161" }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setStep(3)}
                className="text-sm font-medium transition-colors hover:underline"
                style={{ color: "#616161" }}
              >
                Skip for now
              </button>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold" style={{ color: "#242424" }}>
                  Choose your plan
                </h1>
                <p className="mt-1 text-sm" style={{ color: "#616161" }}>
                  Select the plan that fits your team's needs
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {plans.map((plan) => {
                  const Icon = plan.icon;
                  const isSelected = selectedPlan === plan.name;
                  return (
                    <button
                      key={plan.name}
                      onClick={() => setSelectedPlan(plan.name)}
                      className="relative flex flex-col items-start rounded-xl border p-5 text-left transition-all"
                      style={{
                        borderColor: isSelected ? "#5b5fc7" : "#d1d1d1",
                        background: isSelected ? "rgba(91, 95, 199, 0.04)" : "#ffffff",
                        borderRadius: "12px",
                        boxShadow: isSelected ? "0 0 0 1px #5b5fc7" : "none",
                      }}
                    >
                      {plan.recommended && (
                        <span
                          className="absolute -top-2.5 left-4 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                          style={{ background: "#5b5fc7" }}
                        >
                          Recommended
                        </span>
                      )}
                      <div
                        className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{
                          background: isSelected ? "#5b5fc7" : "#f5f5f3",
                          color: isSelected ? "#ffffff" : "#616161",
                        }}
                      >
                        <Icon size={20} />
                      </div>
                      <h3 className="text-base font-semibold" style={{ color: "#242424" }}>
                        {plan.name}
                      </h3>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-xl font-bold" style={{ color: "#242424" }}>
                          {plan.price}
                        </span>
                        <span className="text-xs" style={{ color: "#616161" }}>
                          {plan.period}
                        </span>
                      </div>
                      <p className="mt-2 text-xs" style={{ color: "#616161" }}>
                        {plan.description}
                      </p>
                      <ul className="mt-4 space-y-2">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-xs" style={{ color: "#616161" }}>
                            <Check size={14} style={{ color: "#237b4b" }} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-40"
            style={{
              borderColor: "#d1d1d1",
              color: "#242424",
              background: "#ffffff",
              borderRadius: "12px",
            }}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !canProceedStep1}
              className="flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-50"
              style={{ background: "#5b5fc7", borderRadius: "12px" }}
            >
              Next
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-opacity"
              style={{ background: "#5b5fc7", borderRadius: "12px" }}
            >
              <Check size={16} />
              Create Workspace
            </button>
          )}
        </div>
      </div>

      {ToastComponent}
    </div>
  );
}
