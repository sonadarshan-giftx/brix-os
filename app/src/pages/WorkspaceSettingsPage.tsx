import { useState, useEffect } from "react";
import {
  Settings,
  Users,
  CreditCard,
  Shield,
  Puzzle,
  Upload,
  Trash2,
  X,
  Plus,
  Check,
  MoreHorizontal,
  Mail,
  FileText,
  AlertTriangle,
  ChevronDown,
  Search,
  LogOut,
  Lock,
  Clock,
  Eye,
  Slack,
  Github,
  Calendar,
  Video,
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

interface Member {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Manager" | "Member";
  status: "Active" | "Invited" | "Inactive";
  avatar?: string;
}

const mockMembers: Member[] = [
  { id: "1", name: "Alex Morgan", email: "alex@brixos.io", role: "Owner", status: "Active" },
  { id: "2", name: "Sam Rivera", email: "sam@brixos.io", role: "Manager", status: "Active" },
  { id: "3", name: "Jordan Lee", email: "jordan@brixos.io", role: "Member", status: "Active" },
  { id: "4", name: "Taylor Chen", email: "taylor@brixos.io", role: "Member", status: "Invited" },
  { id: "5", name: "Casey Brooks", email: "casey@brixos.io", role: "Member", status: "Active" },
];

const timezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

const languages = ["English", "Spanish", "French", "German", "Japanese", "Chinese"];

const invoices = [
  { id: "INV-2024-001", date: "Jan 15, 2024", amount: "$87.00", status: "Paid" },
  { id: "INV-2024-002", date: "Feb 15, 2024", amount: "$87.00", status: "Paid" },
  { id: "INV-2024-003", date: "Mar 15, 2024", amount: "$87.00", status: "Paid" },
];

const integrations = [
  { name: "Slack", icon: Slack, connected: true, description: "Get notifications in your channels" },
  { name: "GitHub", icon: Github, connected: false, description: "Link repositories and issues" },
  { name: "Jira", icon: FileText, connected: false, description: "Sync tasks and sprints" },
  { name: "Google Calendar", icon: Calendar, connected: true, description: "Schedule meetings and events" },
  { name: "Zoom", icon: Video, connected: false, description: "Start video calls from tasks" },
];

const tabs = [
  { id: "general", label: "General", icon: Settings },
  { id: "members", label: "Members", icon: Users },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "security", label: "Security", icon: Shield },
  { id: "integrations", label: "Integrations", icon: Puzzle },
];

export default function WorkspaceSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { showToast, ToastComponent } = useToast();

  // General state
  const [wsName, setWsName] = useState("Acme Corp");
  const [wsSlug] = useState("acme-corp");
  const [wsDescription, setWsDescription] = useState("Building the future of productivity.");
  const [timezone, setTimezone] = useState("America/New_York");
  const [language, setLanguage] = useState("English");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Members state
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [memberSearch, setMemberSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Member" | "Manager">("Member");

  // Billing state
  const [billingEmail, setBillingEmail] = useState("billing@brixos.io");

  // Security state
  const [require2FA, setRequire2FA] = useState(false);
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const updateMemberRole = (id: string, role: Member["role"]) => {
    if (role === "Owner") {
      showToast("Transfer ownership from the member profile page.", "error");
      return;
    }
    setMembers(members.map((m) => (m.id === id ? { ...m, role } : m)));
    showToast("Role updated successfully", "success");
  };

  const removeMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
    showToast("Member removed", "success");
  };

  const sendInvite = () => {
    if (!inviteEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      showToast("Please enter a valid email", "error");
      return;
    }
    const newMember: Member = {
      id: crypto.randomUUID?.() || Date.now().toString(),
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      status: "Invited",
    };
    setMembers([...members, newMember]);
    setInviteEmail("");
    setInviteRole("Member");
    setIsInviteOpen(false);
    showToast("Invitation sent", "success");
  };

  const handleDeleteWorkspace = () => {
    setIsDeleteOpen(false);
    showToast("Workspace deleted", "success");
  };

  const handleSaveGeneral = () => {
    showToast("Settings saved", "success");
  };

  return (
    <div className="min-h-screen w-full" style={{ background: "#f5f5f3", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Header */}
      <div className="border-b" style={{ background: "#ffffff", borderColor: "#d1d1d1" }}>
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ background: "#D97757" }}
          >
            <Settings size={20} color="#ffffff" />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "#242424" }}>
              Workspace Settings
            </h1>
            <p className="text-sm" style={{ color: "#616161" }}>
              Manage your workspace preferences and team
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar */}
          <div className="w-full shrink-0 lg:w-56">
            <div
              className="sticky top-6 rounded-xl border p-2"
              style={{ background: "#ffffff", borderColor: "#d1d1d1", borderRadius: "12px" }}
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                    style={{
                      background: isActive ? "rgba(217,119,87,0.08)" : "transparent",
                      color: isActive ? "#D97757" : "#616161",
                    }}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* General Tab */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <div
                  className="rounded-xl border p-6"
                  style={{ background: "#ffffff", borderColor: "#d1d1d1", borderRadius: "12px" }}
                >
                  <h2 className="text-base font-semibold" style={{ color: "#242424" }}>
                    General Information
                  </h2>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium" style={{ color: "#242424" }}>
                        Workspace name
                      </label>
                      <input
                        type="text"
                        value={wsName}
                        onChange={(e) => setWsName(e.target.value)}
                        className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]"
                        style={{ borderColor: "#d1d1d1", color: "#242424", borderRadius: "12px" }}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium" style={{ color: "#242424" }}>
                        Slug
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#616161" }}>
                          brixos.io/
                        </span>
                        <input
                          type="text"
                          value={wsSlug}
                          readOnly
                          className="w-full rounded-lg border bg-gray-50 px-3 py-2.5 pl-[5.5rem] text-sm"
                          style={{ borderColor: "#d1d1d1", color: "#616161", borderRadius: "12px" }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium" style={{ color: "#242424" }}>
                        Description
                      </label>
                      <textarea
                        value={wsDescription}
                        onChange={(e) => setWsDescription(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]"
                        style={{ borderColor: "#d1d1d1", color: "#242424", borderRadius: "12px", resize: "vertical" }}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium" style={{ color: "#242424" }}>
                          Timezone
                        </label>
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                          style={{ borderColor: "#d1d1d1", color: "#242424", borderRadius: "12px" }}
                        >
                          {timezones.map((tz) => (
                            <option key={tz} value={tz}>
                              {tz}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium" style={{ color: "#242424" }}>
                          Language
                        </label>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                          style={{ borderColor: "#d1d1d1", color: "#242424", borderRadius: "12px" }}
                        >
                          {languages.map((lang) => (
                            <option key={lang} value={lang}>
                              {lang}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleSaveGeneral}
                      className="rounded-lg px-5 py-2.5 text-sm font-medium text-white"
                      style={{ background: "#D97757", borderRadius: "12px" }}
                    >
                      Save changes
                    </button>
                  </div>
                </div>

                {/* Logo Upload */}
                <div
                  className="rounded-xl border p-6"
                  style={{ background: "#ffffff", borderColor: "#d1d1d1", borderRadius: "12px" }}
                >
                  <h2 className="text-base font-semibold" style={{ color: "#242424" }}>
                    Workspace Logo
                  </h2>
                  <div className="mt-4">
                    <label
                      className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors hover:bg-gray-50"
                      style={{ borderColor: "#d1d1d1", borderRadius: "12px" }}
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="h-16 w-16 rounded-lg object-cover" />
                      ) : (
                        <div
                          className="flex h-16 w-16 items-center justify-center rounded-lg"
                          style={{ background: "#f5f5f3" }}
                        >
                          <Upload size={24} style={{ color: "#616161" }} />
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-sm font-medium" style={{ color: "#242424" }}>
                          Click to upload or drag and drop
                        </p>
                        <p className="mt-1 text-xs" style={{ color: "#616161" }}>
                          SVG, PNG, JPG up to 2MB
                        </p>
                      </div>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Danger Zone */}
                <div
                  className="rounded-xl border p-6"
                  style={{ background: "#ffffff", borderColor: "#fca5a5", borderRadius: "12px" }}
                >
                  <h2 className="text-base font-semibold" style={{ color: "#dc2626" }}>
                    Danger Zone
                  </h2>
                  <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#242424" }}>
                        Delete this workspace
                      </p>
                      <p className="text-xs" style={{ color: "#616161" }}>
                        Once deleted, all data will be permanently removed. This cannot be undone.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsDeleteOpen(true)}
                      className="flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium"
                      style={{ borderColor: "#fca5a5", color: "#dc2626", background: "#fef2f2", borderRadius: "12px" }}
                    >
                      <Trash2 size={16} />
                      Delete workspace
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Members Tab */}
            {activeTab === "members" && (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#616161" }} />
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Search members..."
                      className="w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm outline-none"
                      style={{ borderColor: "#d1d1d1", color: "#242424", borderRadius: "12px" }}
                    />
                  </div>
                  <button
                    onClick={() => setIsInviteOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
                    style={{ background: "#D97757", borderRadius: "12px" }}
                  >
                    <Plus size={16} />
                    Invite member
                  </button>
                </div>

                <div
                  className="overflow-hidden rounded-xl border"
                  style={{ background: "#ffffff", borderColor: "#d1d1d1", borderRadius: "12px" }}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: "1px solid #d1d1d1" }}>
                          <th className="px-4 py-3 text-left font-medium" style={{ color: "#616161" }}>
                            Name
                          </th>
                          <th className="px-4 py-3 text-left font-medium" style={{ color: "#616161" }}>
                            Email
                          </th>
                          <th className="px-4 py-3 text-left font-medium" style={{ color: "#616161" }}>
                            Role
                          </th>
                          <th className="px-4 py-3 text-left font-medium" style={{ color: "#616161" }}>
                            Status
                          </th>
                          <th className="px-4 py-3 text-right font-medium" style={{ color: "#616161" }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMembers.map((member) => (
                          <tr key={member.id} style={{ borderBottom: "1px solid #f5f5f3" }}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white"
                                  style={{ background: "#D97757" }}
                                >
                                  {member.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </div>
                                <span className="font-medium" style={{ color: "#242424" }}>
                                  {member.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3" style={{ color: "#616161" }}>
                              {member.email}
                            </td>
                            <td className="px-4 py-3">
                              {member.role === "Owner" ? (
                                <span
                                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                                  style={{ background: "rgba(217,119,87,0.1)", color: "#D97757" }}
                                >
                                  <CrownPlaceholder />
                                  Owner
                                </span>
                              ) : (
                                <select
                                  value={member.role}
                                  onChange={(e) => updateMemberRole(member.id, e.target.value as Member["role"])}
                                  className="rounded-lg border px-2 py-1 text-xs outline-none"
                                  style={{ borderColor: "#d1d1d1", color: "#242424", borderRadius: "8px" }}
                                >
                                  <option value="Member">Member</option>
                                  <option value="Manager">Manager</option>
                                  <option value="Owner">Owner</option>
                                </select>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                                style={{
                                  background:
                                    member.status === "Active"
                                      ? "rgba(35, 123, 75, 0.1)"
                                      : member.status === "Invited"
                                      ? "rgba(217,119,87,0.1)"
                                      : "#f5f5f3",
                                  color:
                                    member.status === "Active"
                                      ? "#237b4b"
                                      : member.status === "Invited"
                                      ? "#D97757"
                                      : "#616161",
                                }}
                              >
                                {member.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {member.role !== "Owner" && (
                                <button
                                  onClick={() => removeMember(member.id)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
                                  title="Remove member"
                                >
                                  <LogOut size={14} style={{ color: "#616161" }} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredMembers.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm" style={{ color: "#616161" }}>
                      No members found
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === "billing" && (
              <div className="space-y-6">
                {/* Current Plan */}
                <div
                  className="rounded-xl border p-6"
                  style={{ background: "#ffffff", borderColor: "#d1d1d1", borderRadius: "12px" }}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-base font-semibold" style={{ color: "#242424" }}>
                        Current Plan
                      </h2>
                      <p className="mt-1 text-sm" style={{ color: "#616161" }}>
                        Pro Plan — billed monthly
                      </p>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-2xl font-bold" style={{ color: "#242424" }}>
                          $29
                        </span>
                        <span className="text-sm" style={{ color: "#616161" }}>
                          /user/month
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => showToast("Downgrade initiated", "success")}
                        className="rounded-lg border px-4 py-2.5 text-sm font-medium"
                        style={{ borderColor: "#d1d1d1", color: "#242424", background: "#ffffff", borderRadius: "12px" }}
                      >
                        Downgrade
                      </button>
                      <button
                        onClick={() => showToast("Upgrade to Enterprise — contact sales", "success")}
                        className="rounded-lg px-4 py-2.5 text-sm font-medium text-white"
                        style={{ background: "#D97757", borderRadius: "12px" }}
                      >
                        Upgrade
                      </button>
                    </div>
                  </div>
                </div>

                {/* Usage Stats */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div
                    className="rounded-xl border p-5"
                    style={{ background: "#ffffff", borderColor: "#d1d1d1", borderRadius: "12px" }}
                  >
                    <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#616161" }}>
                      Seats used
                    </p>
                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-2xl font-bold" style={{ color: "#242424" }}>
                        5
                      </span>
                      <span className="text-sm" style={{ color: "#616161" }}>
                        / 10 included
                      </span>
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full" style={{ background: "#f5f5f3" }}>
                      <div className="h-2 rounded-full" style={{ width: "50%", background: "#D97757" }} />
                    </div>
                  </div>
                  <div
                    className="rounded-xl border p-5"
                    style={{ background: "#ffffff", borderColor: "#d1d1d1", borderRadius: "12px" }}
                  >
                    <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#616161" }}>
                      Storage used
                    </p>
                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-2xl font-bold" style={{ color: "#242424" }}>
                        12.4 GB
                      </span>
                      <span className="text-sm" style={{ color: "#616161" }}>
                        / 100 GB
                      </span>
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full" style={{ background: "#f5f5f3" }}>
                      <div className="h-2 rounded-full" style={{ width: "12.4%", background: "#D97757" }} />
                    </div>
                  </div>
                </div>

                {/* Billing Email */}
                <div
                  className="rounded-xl border p-6"
                  style={{ background: "#ffffff", borderColor: "#d1d1d1", borderRadius: "12px" }}
                >
                  <h2 className="text-base font-semibold" style={{ color: "#242424" }}>
                    Billing Details
                  </h2>
                  <div className="mt-4">
                    <label className="mb-1.5 block text-sm font-medium" style={{ color: "#242424" }}>
                      Billing email
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#616161" }} />
                        <input
                          type="email"
                          value={billingEmail}
                          onChange={(e) => setBillingEmail(e.target.value)}
                          className="w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm outline-none"
                          style={{ borderColor: "#d1d1d1", color: "#242424", borderRadius: "12px" }}
                        />
                      </div>
                      <button
                        onClick={() => showToast("Billing email updated", "success")}
                        className="rounded-lg px-4 py-2.5 text-sm font-medium text-white"
                        style={{ background: "#D97757", borderRadius: "12px" }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>

                {/* Invoice History */}
                <div
                  className="rounded-xl border p-6"
                  style={{ background: "#ffffff", borderColor: "#d1d1d1", borderRadius: "12px" }}
                >
                  <h2 className="text-base font-semibold" style={{ color: "#242424" }}>
                    Invoice History
                  </h2>
                  <div className="mt-4 overflow-hidden rounded-lg border" style={{ borderColor: "#d1d1d1", borderRadius: "12px" }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: "1px solid #d1d1d1", background: "#f5f5f3" }}>
                          <th className="px-4 py-3 text-left font-medium" style={{ color: "#616161" }}>
                            Invoice
                          </th>
                          <th className="px-4 py-3 text-left font-medium" style={{ color: "#616161" }}>
                            Date
                          </th>
                          <th className="px-4 py-3 text-left font-medium" style={{ color: "#616161" }}>
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left font-medium" style={{ color: "#616161" }}>
                            Status
                          </th>
                          <th className="px-4 py-3 text-right font-medium" style={{ color: "#616161" }}>
                            
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((inv) => (
                          <tr key={inv.id} style={{ borderBottom: "1px solid #f5f5f3" }}>
                            <td className="px-4 py-3 font-medium" style={{ color: "#242424" }}>
                              {inv.id}
                            </td>
                            <td className="px-4 py-3" style={{ color: "#616161" }}>
                              {inv.date}
                            </td>
                            <td className="px-4 py-3 font-medium" style={{ color: "#242424" }}>
                              {inv.amount}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                                style={{ background: "rgba(35, 123, 75, 0.1)", color: "#237b4b" }}
                              >
                                {inv.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: "#D97757" }}>
                                <FileText size={14} />
                                Download
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div
                  className="rounded-xl border p-6"
                  style={{ background: "#ffffff", borderColor: "#d1d1d1", borderRadius: "12px" }}
                >
                  <h2 className="text-base font-semibold" style={{ color: "#242424" }}>
                    Authentication
                  </h2>

                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: "rgba(217,119,87,0.08)" }}
                        >
                          <Lock size={18} style={{ color: "#D97757" }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: "#242424" }}>
                            Require 2FA
                          </p>
                          <p className="text-xs" style={{ color: "#616161" }}>
                            Enforce two-factor authentication for all workspace members
                          </p>
                        </div>
                      </div>
                      <Toggle checked={require2FA} onChange={setRequire2FA} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: "rgba(217,119,87,0.08)" }}
                        >
                          <Shield size={18} style={{ color: "#D97757" }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: "#242424" }}>
                            SSO / SAML
                          </p>
                          <p className="text-xs" style={{ color: "#616161" }}>
                            Enterprise feature — enable single sign-on for your organization
                          </p>
                        </div>
                      </div>
                      <Toggle checked={ssoEnabled} onChange={setSsoEnabled} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: "rgba(217,119,87,0.08)" }}
                        >
                          <Clock size={18} style={{ color: "#D97757" }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: "#242424" }}>
                            Session timeout
                          </p>
                          <p className="text-xs" style={{ color: "#616161" }}>
                            Automatically log out inactive users after a period of time
                          </p>
                        </div>
                      </div>
                      <select
                        value={sessionTimeout}
                        onChange={(e) => setSessionTimeout(e.target.value)}
                        className="rounded-lg border px-3 py-2 text-sm outline-none"
                        style={{ borderColor: "#d1d1d1", color: "#242424", borderRadius: "12px" }}
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                        <option value="240">4 hours</option>
                        <option value="480">8 hours</option>
                        <option value="never">Never</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-xl border p-6"
                  style={{ background: "#ffffff", borderColor: "#d1d1d1", borderRadius: "12px" }}
                >
                  <h2 className="text-base font-semibold" style={{ color: "#242424" }}>
                    Audit Log
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: "#616161" }}>
                    View a complete history of actions taken in your workspace
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => showToast("Opening audit log...", "success")}
                      className="flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium"
                      style={{ borderColor: "#d1d1d1", color: "#242424", background: "#ffffff", borderRadius: "12px" }}
                    >
                      <Eye size={16} />
                      View audit log
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === "integrations" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold" style={{ color: "#242424" }}>
                    Connected Apps
                  </h2>
                  <p className="text-sm" style={{ color: "#616161" }}>
                    Link your favorite tools to streamline your workflow
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {integrations.map((integration) => {
                    const Icon = integration.icon;
                    return (
                      <div
                        key={integration.name}
                        className="flex flex-col rounded-xl border p-5"
                        style={{ background: "#ffffff", borderColor: "#d1d1d1", borderRadius: "12px" }}
                      >
                        <div className="flex items-start justify-between">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-lg"
                            style={{ background: "#f5f5f3" }}
                          >
                            <Icon size={20} style={{ color: "#242424" }} />
                          </div>
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                            style={{
                              background: integration.connected
                                ? "rgba(35, 123, 75, 0.1)"
                                : "#f5f5f3",
                              color: integration.connected ? "#237b4b" : "#616161",
                            }}
                          >
                            {integration.connected ? "Connected" : "Disconnected"}
                          </span>
                        </div>
                        <h3 className="mt-3 text-sm font-semibold" style={{ color: "#242424" }}>
                          {integration.name}
                        </h3>
                        <p className="mt-1 text-xs" style={{ color: "#616161" }}>
                          {integration.description}
                        </p>
                        <button
                          onClick={() =>
                            showToast(
                              integration.connected
                                ? `${integration.name} disconnected`
                                : `${integration.name} connected`,
                              "success"
                            )
                          }
                          className="mt-4 w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                          style={{
                            background: integration.connected ? "#fef2f2" : "rgba(217,119,87,0.08)",
                            color: integration.connected ? "#dc2626" : "#D97757",
                            borderRadius: "12px",
                          }}
                        >
                          {integration.connected ? "Disconnect" : "Connect"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            className="w-full max-w-md rounded-xl border p-6 shadow-xl"
            style={{ background: "#ffffff", borderColor: "#d1d1d1", borderRadius: "12px" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: "#242424" }}>
                Invite member
              </h3>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
              >
                <X size={18} style={{ color: "#616161" }} />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: "#242424" }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendInvite()}
                  placeholder="colleague@company.com"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: "#d1d1d1", color: "#242424", borderRadius: "12px" }}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: "#242424" }}>
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "Member" | "Manager")}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: "#d1d1d1", color: "#242424", borderRadius: "12px" }}
                >
                  <option value="Member">Member</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsInviteOpen(false)}
                  className="rounded-lg border px-4 py-2.5 text-sm font-medium"
                  style={{ borderColor: "#d1d1d1", color: "#242424", background: "#ffffff", borderRadius: "12px" }}
                >
                  Cancel
                </button>
                <button
                  onClick={sendInvite}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-white"
                  style={{ background: "#D97757", borderRadius: "12px" }}
                >
                  Send invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Workspace Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            className="w-full max-w-md rounded-xl border p-6 shadow-xl"
            style={{ background: "#ffffff", borderColor: "#fca5a5", borderRadius: "12px" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: "#fef2f2" }}
              >
                <AlertTriangle size={20} style={{ color: "#dc2626" }} />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: "#dc2626" }}>
                Delete workspace
              </h3>
            </div>
            <p className="mt-3 text-sm" style={{ color: "#616161" }}>
              This will permanently delete <strong style={{ color: "#242424" }}>{wsName}</strong> and all associated data.
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="rounded-lg border px-4 py-2.5 text-sm font-medium"
                style={{ borderColor: "#d1d1d1", color: "#242424", background: "#ffffff", borderRadius: "12px" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteWorkspace}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-white"
                style={{ background: "#dc2626", borderRadius: "12px" }}
              >
                Delete workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {ToastComponent}
    </div>
  );
}

/* Inline sub-components */

function CrownPlaceholder() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm11 12v4m-4-4v4m8-4v4" />
    </svg>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative h-6 w-11 rounded-full transition-colors"
      style={{ background: checked ? "#D97757" : "#d1d1d1" }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all"
        style={{ left: checked ? "22px" : "2px" }}
      />
    </button>
  );
}
