import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Building2,
  Users,
  UserCircle,
  ArrowRight,
  Check,
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

function useToast() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; visible: boolean } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(null), 3000);
  };

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

/* Mock workspace lookup by invite token */
function getWorkspaceByToken(token: string) {
  const workspaces = JSON.parse(localStorage.getItem("brixstac_workspaces") || "[]");
  // In a real app, the token maps to a specific workspace. Mock fallback:
  if (workspaces.length > 0) {
    return workspaces[0];
  }
  return {
    id: "ws-demo-123",
    name: "Acme Corp",
    slug: "acme-corp",
    description: "Building the future of productivity.",
    industry: "Software",
    ownerName: "Alex Morgan",
    memberCount: 12,
  };
}

/* Check login state from localStorage mock */
function isLoggedIn() {
  return !!localStorage.getItem("brixstac_user");
}

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();

  const [workspace, setWorkspace] = useState<ReturnType<typeof getWorkspaceByToken> | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sign-up form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  useEffect(() => {
    const ws = getWorkspaceByToken(token || "");
    setWorkspace(ws);
    setLoggedIn(isLoggedIn());
    // Small artificial loading for realism
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, [token]);

  const handleJoin = () => {
    // Add user to workspace (mock)
    const existing = JSON.parse(localStorage.getItem("brixstac_workspaces") || "[]");
    const updated = existing.map((w: any) =>
      w.id === workspace?.id
        ? { ...w, memberCount: (w.memberCount || 0) + 1 }
        : w
    );
    localStorage.setItem("brixstac_workspaces", JSON.stringify(updated));
    showToast(`You joined ${workspace?.name || "the workspace"}`, "success");
    setTimeout(() => navigate("/projects"), 800);
  };

  const handleCreateAccount = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      showToast("Please fill in all fields", "error");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("Please enter a valid email", "error");
      return;
    }
    if (password.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }
    if (!agreeTerms) {
      showToast("Please agree to the terms", "error");
      return;
    }

    // Mock create account
    localStorage.setItem("brixstac_user", JSON.stringify({ name, email }));
    setLoggedIn(true);
    showToast("Account created successfully", "success");
  };

  const handleLogin = () => {
    localStorage.setItem("brixstac_user", JSON.stringify({ name: "Demo User", email: "demo@brixstac.io" }));
    setLoggedIn(true);
    showToast("Logged in successfully", "success");
  };

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "#f5f5f3", fontFamily: "Inter, system-ui, sans-serif" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: "#d1d1d1", borderTopColor: "#5b5fc7" }}
          />
          <p className="text-sm" style={{ color: "#616161" }}>
            Loading invitation...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "#f5f5f3", fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* Top bar */}
      <div className="w-full border-b px-4 py-4" style={{ background: "#ffffff", borderColor: "#d1d1d1" }}>
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "#5b5fc7" }}
          >
            <Building2 size={18} color="#ffffff" />
          </div>
          <span className="text-base font-semibold" style={{ color: "#242424" }}>
            Brixstac
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-10">
        {/* Invite card */}
        <div
          className="rounded-xl border p-6 text-center shadow-sm sm:p-8"
          style={{ background: "#ffffff", borderColor: "#d1d1d1", borderRadius: "12px" }}
        >
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "rgba(91, 95, 199, 0.08)" }}
          >
            <Mail size={24} style={{ color: "#5b5fc7" }} />
          </div>

          <h1 className="mt-4 text-xl font-semibold" style={{ color: "#242424" }}>
            You've been invited
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#616161" }}>
            to join{" "}
            <span className="font-medium" style={{ color: "#5b5fc7" }}>
              {workspace?.name || "a workspace"}
            </span>
          </p>

          {/* Workspace info */}
          <div
            className="mt-6 rounded-xl border p-4 text-left"
            style={{ background: "#f5f5f3", borderColor: "#d1d1d1", borderRadius: "12px" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
                style={{ background: "#5b5fc7" }}
              >
                {(workspace?.name || "W")[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#242424" }}>
                  {workspace?.name || "Workspace"}
                </p>
                <p className="text-xs" style={{ color: "#616161" }}>
                  {workspace?.description || "No description"}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-4">
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "#616161" }}>
                <Users size={14} />
                {workspace?.memberCount || 0} members
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "#616161" }}>
                <UserCircle size={14} />
                Owner: {workspace?.ownerName || "Unknown"}
              </div>
            </div>
          </div>
        </div>

        {/* Logged in: Join action */}
        {loggedIn && (
          <div className="mt-6">
            <button
              onClick={handleJoin}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: "#5b5fc7", borderRadius: "12px" }}
            >
              Join workspace
              <ArrowRight size={16} />
            </button>
            <p className="mt-3 text-center text-xs" style={{ color: "#616161" }}>
              You'll be added as a Member. You can change your role later.
            </p>
          </div>
        )}

        {/* Not logged in: Sign up form */}
        {!loggedIn && (
          <div className="mt-6 space-y-4">
            <div
              className="rounded-xl border p-6 shadow-sm"
              style={{ background: "#ffffff", borderColor: "#d1d1d1", borderRadius: "12px" }}
            >
              <h2 className="text-base font-semibold" style={{ color: "#242424" }}>
                Create account to join
              </h2>
              <p className="mt-1 text-xs" style={{ color: "#616161" }}>
                Set up your Brixstac account to accept the invitation
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: "#242424" }}>
                    Full name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#5b5fc7] focus:ring-1 focus:ring-[#5b5fc7]"
                    style={{ borderColor: "#d1d1d1", color: "#242424", borderRadius: "12px" }}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: "#242424" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@company.com"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#5b5fc7] focus:ring-1 focus:ring-[#5b5fc7]"
                    style={{ borderColor: "#d1d1d1", color: "#242424", borderRadius: "12px" }}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: "#242424" }}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full rounded-lg border px-3 py-2.5 pr-10 text-sm outline-none transition-colors focus:border-[#5b5fc7] focus:ring-1 focus:ring-[#5b5fc7]"
                      style={{ borderColor: "#d1d1d1", color: "#242424", borderRadius: "12px" }}
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      type="button"
                    >
                      {showPassword ? (
                        <EyeOff size={16} style={{ color: "#616161" }} />
                      ) : (
                        <Eye size={16} style={{ color: "#616161" }} />
                      )}
                    </button>
                  </div>
                </div>

                <label className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#5b5fc7] focus:ring-[#5b5fc7]"
                  />
                  <span className="text-xs" style={{ color: "#616161" }}>
                    I agree to the{" "}
                    <a href="#" className="font-medium" style={{ color: "#5b5fc7" }}>
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="font-medium" style={{ color: "#5b5fc7" }}>
                      Privacy Policy
                    </a>
                  </span>
                </label>

                <button
                  onClick={handleCreateAccount}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: "#5b5fc7", borderRadius: "12px" }}
                >
                  Create account and join
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Login link */}
            <div className="text-center">
              <p className="text-sm" style={{ color: "#616161" }}>
                Already have an account?{" "}
                <button
                  onClick={handleLogin}
                  className="font-medium transition-colors hover:underline"
                  style={{ color: "#5b5fc7" }}
                >
                  Log in
                </button>
              </p>
            </div>
          </div>
        )}
      </div>

      {ToastComponent}
    </div>
  );
}
