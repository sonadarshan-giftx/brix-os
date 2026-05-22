import { useState, useEffect } from "react";
import {
  Download,
  Trash2,
  Cookie,
  CheckCircle,
  AlertTriangle,
  FileText,
  MessageSquare,
  Calendar,
  Users,
  Paperclip,
  X,
  Check,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Eye,
  Megaphone,
  Puzzle,
} from "lucide-react";

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        background: "#242424",
        color: "#ffffff",
        padding: "14px 20px",
        borderRadius: "8px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        zIndex: 1000,
        animation: "slideIn 0.3s ease",
        fontSize: "14px",
      }}
    >
      <CheckCircle size={18} color="#7ce39c" />
      <span>{message}</span>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onChange}
      style={{
        width: "44px",
        height: "24px",
        borderRadius: "12px",
        border: "none",
        background: checked ? "#5b5fc7" : "#d4d4d4",
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative",
        transition: "background 0.2s",
        opacity: disabled ? 0.6 : 1,
        padding: 0,
      }}
    >
      <div
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          background: "#ffffff",
          position: "absolute",
          top: "2px",
          left: checked ? "22px" : "2px",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }}
      />
    </button>
  );
}

const exportOptions = [
  { id: "projects", label: "Projects", icon: <FileText size={18} color="#5b5fc7" /> },
  { id: "tasks", label: "Tasks", icon: <CheckCircle size={18} color="#5b5fc7" /> },
  { id: "chat", label: "Chat history", icon: <MessageSquare size={18} color="#5b5fc7" /> },
  { id: "calendar", label: "Calendar events", icon: <Calendar size={18} color="#5b5fc7" /> },
  { id: "team", label: "Team member list", icon: <Users size={18} color="#5b5fc7" /> },
  { id: "files", label: "Files", icon: <Paperclip size={18} color="#5b5fc7" /> },
];

export default function DataExportPage() {
  const [selectedExports, setSelectedExports] = useState<string[]>(["projects", "tasks"]);
  const [exportStatus, setExportStatus] = useState<"idle" | "processing" | "ready">("idle");
  const [exportProgress, setExportProgress] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);
  const [cookies, setCookies] = useState({
    essential: true,
    analytics: true,
    marketing: false,
    functional: true,
  });
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const toggleExport = (id: string) => {
    setSelectedExports((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleRequestExport = () => {
    if (selectedExports.length === 0) {
      showToast("Please select at least one data type");
      return;
    }
    setExportStatus("processing");
    setExportProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setExportStatus("ready");
        showToast("Your data export is ready");
      }
      setExportProgress(Math.min(progress, 100));
    }, 400);
  };

  const handleDownload = () => {
    showToast("Download started");
  };

  const handleDeleteAccount = () => {
    if (!deleteConfirmChecked) return;
    setShowDeleteModal(false);
    showToast("Account deletion request submitted");
    setDeleteConfirmChecked(false);
  };

  const sectionCardStyle: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "32px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  };

  const sectionIconBoxStyle: React.CSSProperties = {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "#f0f0f8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "12px",
  };

  return (
    <div style={{ background: "#f5f5f3", minHeight: "100vh" }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "48px 24px 64px",
          fontFamily: "Inter, sans-serif",
          color: "#242424",
          lineHeight: "1.7",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 700,
              margin: 0,
              letterSpacing: "-0.5px",
              color: "#242424",
            }}
          >
            Data & Privacy
          </h1>
          <p style={{ margin: "8px 0 0", color: "#616161", fontSize: "15px" }}>
            Export your data, manage your account, and control cookie preferences
          </p>
        </div>

        {/* Section 1: Export Your Data */}
        <div style={sectionCardStyle}>
          <div style={sectionIconBoxStyle}>
            <Download size={22} color="#5b5fc7" />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 8px", color: "#242424" }}>
            Export Your Data
          </h2>
          <p style={{ margin: "0 0 24px", color: "#616161", fontSize: "15px" }}>
            Select the data you would like to export. You will receive a ZIP file containing
            your data in JSON and CSV formats.
          </p>

          {exportStatus === "ready" ? (
            <div
              style={{
                background: "#f0fdf4",
                borderRadius: "10px",
                padding: "24px",
                textAlign: "center",
              }}
            >
              <CheckCircle size={40} color="#22c55e" style={{ marginBottom: "12px" }} />
              <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 600, color: "#242424" }}>
                Export Ready
              </h3>
              <p style={{ margin: "0 0 16px", color: "#616161", fontSize: "14px" }}>
                Your data export has been prepared and is ready for download.
              </p>
              <button
                onClick={handleDownload}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#5b5fc7",
                  color: "#ffffff",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                <Download size={16} />
                Download Export (24 MB)
              </button>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: "10px",
                  marginBottom: "20px",
                }}
              >
                {exportOptions.map((opt) => {
                  const isSelected = selectedExports.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleExport(opt.id)}
                      disabled={exportStatus === "processing"}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: isSelected ? "2px solid #5b5fc7" : "2px solid #e0e0e0",
                        background: isSelected ? "#f0f0f8" : "#ffffff",
                        cursor: exportStatus === "processing" ? "not-allowed" : "pointer",
                        transition: "all 0.15s",
                        fontFamily: "Inter, sans-serif",
                        fontSize: "14px",
                        color: isSelected ? "#5b5fc7" : "#616161",
                        fontWeight: isSelected ? 500 : 400,
                        textAlign: "left",
                        opacity: exportStatus === "processing" ? 0.6 : 1,
                      }}
                    >
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "4px",
                          border: isSelected ? "none" : "1.5px solid #c4c4c4",
                          background: isSelected ? "#5b5fc7" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && <Check size={14} color="#ffffff" />}
                      </div>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {opt.icon}
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {exportStatus === "processing" && (
                <div style={{ marginBottom: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "8px",
                    }}
                  >
                    <Loader2 size={16} color="#5b5fc7" style={{ animation: "spin 1s linear infinite" }} />
                    <span style={{ fontSize: "14px", color: "#616161" }}>
                      Preparing your export... {Math.round(exportProgress)}%
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "8px",
                      background: "#e8e8f0",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${exportProgress}%`,
                        height: "100%",
                        background: "#5b5fc7",
                        borderRadius: "4px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleRequestExport}
                disabled={exportStatus === "processing"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#5b5fc7",
                  color: "#ffffff",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: exportStatus === "processing" ? "not-allowed" : "pointer",
                  fontFamily: "Inter, sans-serif",
                  opacity: exportStatus === "processing" ? 0.6 : 1,
                }}
              >
                {exportStatus === "processing" ? (
                  <>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    Processing...
                  </>
                ) : (
                  <>
                    Request Export
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Section 2: Delete Your Account */}
        <div style={{ ...sectionCardStyle, marginTop: "20px" }}>
          <div style={{ ...sectionIconBoxStyle, background: "#fef2f2" }}>
            <Trash2 size={22} color="#dc2626" />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 8px", color: "#242424" }}>
            Delete Your Account
          </h2>
          <p style={{ margin: "0 0 20px", color: "#616161", fontSize: "15px" }}>
            This action is permanent and cannot be undone. All your data will be permanently
            deleted from our systems within 30 days.
          </p>

          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "10px",
              padding: "20px",
              marginBottom: "20px",
              display: "flex",
              gap: "12px",
            }}
          >
            <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ fontSize: "14px", color: "#7f1d1d", lineHeight: "1.6" }}>
              <strong>Warning:</strong> Deleting your account will permanently remove all projects,
              tasks, chat history, files, and team associations. This action cannot be reversed.
              Any active subscriptions will be cancelled but are not eligible for refunds.
            </div>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              cursor: "pointer",
              marginBottom: "20px",
              fontSize: "14px",
              color: "#242424",
            }}
          >
            <input
              type="checkbox"
              checked={deleteConfirmChecked}
              onChange={(e) => setDeleteConfirmChecked(e.target.checked)}
              style={{ marginTop: "4px", cursor: "pointer" }}
            />
            <span>
              I understand this will permanently delete my account and all associated data. I
              have exported any data I wish to keep.
            </span>
          </label>

          <button
            onClick={() => {
              if (!deleteConfirmChecked) {
                showToast("Please confirm that you understand the consequences");
                return;
              }
              setShowDeleteModal(true);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#dc2626",
              color: "#ffffff",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#b91c1c")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#dc2626")}
          >
            <Trash2 size={16} />
            Delete My Account
          </button>
        </div>

        {/* Section 3: Cookie Preferences */}
        <div style={{ ...sectionCardStyle, marginTop: "20px" }}>
          <div style={sectionIconBoxStyle}>
            <Cookie size={22} color="#5b5fc7" />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 8px", color: "#242424" }}>
            Cookie Preferences
          </h2>
          <p style={{ margin: "0 0 24px", color: "#616161", fontSize: "15px" }}>
            Manage which cookies and tracking technologies you allow. Essential cookies are
            required for the platform to function.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Essential */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                background: "#f8f8fb",
                borderRadius: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <ShieldCheck size={20} color="#5b5fc7" />
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 500, color: "#242424" }}>
                    Essential
                  </div>
                  <div style={{ fontSize: "13px", color: "#616161" }}>
                    Required for login, security, and basic functionality
                  </div>
                </div>
              </div>
              <ToggleSwitch checked={cookies.essential} onChange={() => {}} disabled />
            </div>

            {/* Analytics */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                background: "#f8f8fb",
                borderRadius: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Eye size={20} color="#5b5fc7" />
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 500, color: "#242424" }}>
                    Analytics
                  </div>
                  <div style={{ fontSize: "13px", color: "#616161" }}>
                    Helps us understand how visitors interact with our platform
                  </div>
                </div>
              </div>
              <ToggleSwitch
                checked={cookies.analytics}
                onChange={() => setCookies((c) => ({ ...c, analytics: !c.analytics }))}
              />
            </div>

            {/* Marketing */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                background: "#f8f8fb",
                borderRadius: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Megaphone size={20} color="#5b5fc7" />
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 500, color: "#242424" }}>
                    Marketing
                  </div>
                  <div style={{ fontSize: "13px", color: "#616161" }}>
                    Used to deliver relevant advertisements and measure their effectiveness
                  </div>
                </div>
              </div>
              <ToggleSwitch
                checked={cookies.marketing}
                onChange={() => setCookies((c) => ({ ...c, marketing: !c.marketing }))}
              />
            </div>

            {/* Functional */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                background: "#f8f8fb",
                borderRadius: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Puzzle size={20} color="#5b5fc7" />
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 500, color: "#242424" }}>
                    Functional
                  </div>
                  <div style={{ fontSize: "13px", color: "#616161" }}>
                    Enables enhanced features like preferences and customizations
                  </div>
                </div>
              </div>
              <ToggleSwitch
                checked={cookies.functional}
                onChange={() => setCookies((c) => ({ ...c, functional: !c.functional }))}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
            <button
              onClick={() => showToast("Cookie preferences saved")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#5b5fc7",
                color: "#ffffff",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#4a4eb5")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#5b5fc7")}
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "24px",
          }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "32px",
              maxWidth: "440px",
              width: "100%",
              animation: "fadeIn 0.2s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "#fef2f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle size={20} color="#dc2626" />
              </div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#242424" }}>
                Confirm Account Deletion
              </h3>
            </div>
            <p style={{ margin: "0 0 20px", color: "#616161", fontSize: "15px", lineHeight: "1.6" }}>
              Are you absolutely sure you want to delete your account? This will permanently erase:
            </p>
            <ul
              style={{
                margin: "0 0 20px",
                paddingLeft: "20px",
                color: "#616161",
                fontSize: "14px",
                lineHeight: "1.7",
              }}
            >
              <li>All projects and associated data</li>
              <li>All tasks, comments, and chat history</li>
              <li>All uploaded files and attachments</li>
              <li>Team memberships and permissions</li>
              <li>Integration configurations</li>
            </ul>
            <div
              style={{
                background: "#fef2f2",
                borderRadius: "8px",
                padding: "12px 16px",
                fontSize: "13px",
                color: "#7f1d1d",
                marginBottom: "24px",
              }}
            >
              This action is irreversible. Your data cannot be recovered after deletion.
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0",
                  background: "#ffffff",
                  color: "#242424",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#dc2626",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Yes, Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
