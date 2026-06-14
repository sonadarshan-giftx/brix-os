import { useState, useEffect } from "react";
import {
  Search,
  Rocket,
  CreditCard,
  FolderOpen,
  Bot,
  Users,
  ShieldCheck,
  Plug,
  Code,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
  CheckCircle,
  HelpCircle,
  X,
} from "lucide-react";

interface Article {
  id: string;
  title: string;
  content: string;
}

interface Category {
  id: string;
  icon: React.ReactNode;
  title: string;
  articles: Article[];
}

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

const categoriesData: Category[] = [
  {
    id: "getting-started",
    icon: <Rocket size={22} color="#D97757" />,
    title: "Getting Started",
    articles: [
      { id: "gs-1", title: "Creating your first workspace", content: "Learn how to set up your BrixOS workspace, invite team members, and configure your first project board in under 5 minutes." },
      { id: "gs-2", title: "Quick start guide", content: "A comprehensive walkthrough of BrixOS features, from basic navigation to advanced workflow automation." },
      { id: "gs-3", title: "Setting up integrations", content: "Connect BrixOS with your existing tools including Slack, GitHub, Google Workspace, and more." },
    ],
  },
  {
    id: "account-billing",
    icon: <CreditCard size={22} color="#D97757" />,
    title: "Account & Billing",
    articles: [
      { id: "ab-1", title: "Managing your subscription", content: "Upgrade, downgrade, or cancel your subscription. Understand billing cycles and payment methods." },
      { id: "ab-2", title: "Understanding invoices", content: "How to read your BrixOS invoices, download receipts, and manage billing history." },
      { id: "ab-3", title: "Refund policy explained", content: "Our 14-day money-back guarantee for annual plans and pro-rated refund eligibility." },
      { id: "ab-4", title: "Adding team members to your plan", content: "How to invite colleagues, manage seats, and understand per-user pricing." },
    ],
  },
  {
    id: "projects-tasks",
    icon: <FolderOpen size={22} color="#D97757" />,
    title: "Projects & Tasks",
    articles: [
      { id: "pt-1", title: "Creating and organizing projects", content: "Best practices for project structure, templates, folder hierarchies, and tagging systems." },
      { id: "pt-2", title: "Task management workflows", content: "Set up Kanban boards, Gantt charts, and custom workflows that match your team's process." },
      { id: "pt-3", title: "Using deadlines and reminders", content: "Configure automated reminders, due date tracking, and escalation rules for overdue tasks." },
    ],
  },
  {
    id: "ai-agents",
    icon: <Bot size={22} color="#D97757" />,
    title: "AI Agents",
    articles: [
      { id: "ai-1", title: "Configuring your first AI agent", content: "Step-by-step guide to creating AI agents for task automation, data analysis, and content generation." },
      { id: "ai-2", title: "AI agent permissions and safety", content: "Understanding agent access levels, data handling, and safety guardrails." },
      { id: "ai-3", title: "Customizing agent behavior", content: "Fine-tune agent responses, set custom instructions, and integrate with external APIs." },
    ],
  },
  {
    id: "team-management",
    icon: <Users size={22} color="#D97757" />,
    title: "Team Management",
    articles: [
      { id: "tm-1", title: "Role-based access control", content: "Configure admin, editor, viewer, and custom roles with granular permissions." },
      { id: "tm-2", title: "Managing team directories", content: "Organize teams, departments, and cross-functional groups for efficient collaboration." },
      { id: "tm-3", title: "Activity tracking and reporting", content: "Monitor team productivity with dashboards, activity feeds, and automated reports." },
      { id: "tm-4", title: "Guest access for external collaborators", content: "Safely share projects with clients and contractors using time-limited guest accounts." },
    ],
  },
  {
    id: "security",
    icon: <ShieldCheck size={22} color="#D97757" />,
    title: "Security",
    articles: [
      { id: "sec-1", title: "Enabling two-factor authentication", content: "Protect your account with 2FA using authenticator apps or security keys." },
      { id: "sec-2", title: "SSO and SAML configuration", content: "Set up single sign-on with your identity provider for enterprise security." },
      { id: "sec-3", title: "Security audit logs", content: "Review login history, data access logs, and administrative actions for compliance." },
      { id: "sec-4", title: "Data encryption explained", content: "Understanding our encryption at rest, in transit, and end-to-end encryption options." },
    ],
  },
  {
    id: "integrations",
    icon: <Plug size={22} color="#D97757" />,
    title: "Integrations",
    articles: [
      { id: "int-1", title: "Slack integration setup", content: "Receive notifications, create tasks, and run commands directly from Slack." },
      { id: "int-2", title: "GitHub and GitLab connections", content: "Link commits, pull requests, and issues to your BrixOS projects for full traceability." },
      { id: "int-3", title: "Calendar sync (Google & Outlook)", content: "Two-way sync with Google Calendar and Outlook for deadline management." },
    ],
  },
  {
    id: "api-developers",
    icon: <Code size={22} color="#D97757" />,
    title: "API & Developers",
    articles: [
      { id: "api-1", title: "Getting started with the API", content: "Generate API keys, understand rate limits, and make your first request." },
      { id: "api-2", title: "Webhook configuration", content: "Set up webhooks for real-time event notifications and automation triggers." },
      { id: "api-3", title: "SDKs and client libraries", content: "Official SDKs for JavaScript, Python, Ruby, and community-supported libraries." },
      { id: "api-4", title: "API versioning and changelog", content: "Stay up to date with API changes, deprecation notices, and migration guides." },
    ],
  },
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [ticketForm, setTicketForm] = useState({ subject: "", message: "", priority: "medium" });
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const showToast = (message: string) => {
    setToast(message);
  };

  const filteredCategories = categoriesData.map((cat) => ({
    ...cat,
    articles: cat.articles.filter(
      (a) =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.articles.length > 0 || searchQuery === "");

  const handleArticleClick = (articleId: string) => {
    if (expandedArticle === articleId) {
      setExpandedArticle(null);
    } else {
      setExpandedArticle(articleId);
    }
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) {
      showToast("Please fill in all required fields");
      return;
    }
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubmitted(false);
      setTicketForm({ subject: "", message: "", priority: "medium" });
    }, 4000);
  };

  return (
    <div style={{ background: "#f5f5f3", minHeight: "100vh" }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
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
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              background: "#D97757",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <HelpCircle size={28} color="#ffffff" />
          </div>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 700,
              margin: 0,
              letterSpacing: "-0.5px",
              color: "#242424",
            }}
          >
            Help Center
          </h1>
          <p style={{ margin: "8px 0 0", color: "#616161", fontSize: "15px" }}>
            Find answers, browse categories, or contact our support team
          </p>
        </div>

        {/* Search Bar */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "#f5f5f3",
              borderRadius: "10px",
              padding: "12px 16px",
              border: "1px solid transparent",
              transition: "border-color 0.2s",
            }}
          >
            <Search size={20} color="#616161" />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "15px",
                color: "#242424",
                fontFamily: "Inter, sans-serif",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={16} color="#616161" />
              </button>
            )}
          </div>
        </div>

        {/* Categories Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    background: "#f0f0f8",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {category.icon}
                </div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#242424" }}>
                  {category.title}
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {category.articles.length === 0 && searchQuery !== "" && (
                  <p style={{ margin: 0, color: "#616161", fontSize: "13px" }}>
                    No matching articles
                  </p>
                )}
                {category.articles.map((article) => {
                  const isExpanded = expandedArticle === article.id;
                  return (
                    <div key={article.id}>
                      <button
                        onClick={() => handleArticleClick(article.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          textAlign: "left",
                          background: isExpanded ? "#f8f8fb" : "transparent",
                          border: "none",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "14px",
                          color: isExpanded ? "#D97757" : "#616161",
                          fontFamily: "Inter, sans-serif",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpanded) e.currentTarget.style.background = "#f8f8fb";
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <span style={{ fontWeight: isExpanded ? 500 : 400 }}>{article.title}</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {isExpanded && (
                        <div
                          style={{
                            padding: "8px 10px 12px",
                            fontSize: "14px",
                            color: "#616161",
                            lineHeight: "1.6",
                            animation: "slideDown 0.2s ease",
                          }}
                        >
                          {article.content}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {searchQuery && filteredCategories.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#616161",
              fontSize: "15px",
            }}
          >
            <Search size={40} color="#c4c4c4" style={{ marginBottom: "12px" }} />
            <p>No articles found for "{searchQuery}"</p>
          </div>
        )}

        {/* Contact Support Section */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <MessageSquare size={22} color="#D97757" />
            <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "#242424" }}>
              Contact Support
            </h2>
          </div>
          <p style={{ margin: "0 0 24px", color: "#616161", fontSize: "15px" }}>
            Cannot find what you are looking for? Submit a support ticket and our team will respond
            within 24 hours.
          </p>

          {ticketSubmitted ? (
            <div
              style={{
                background: "#f0fdf4",
                borderRadius: "10px",
                padding: "24px",
                textAlign: "center",
              }}
            >
              <CheckCircle size={40} color="#22c55e" style={{ marginBottom: "12px" }} />
              <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 600, color: "#242424" }}>
                Ticket Submitted
              </h3>
              <p style={{ margin: 0, color: "#616161", fontSize: "14px" }}>
                Our support team will reach out to you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitTicket}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label
                    htmlFor="subject"
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#242424",
                      marginBottom: "6px",
                    }}
                  >
                    Subject *
                  </label>
                  <input
                    id="subject"
                    type="text"
                    placeholder="What is your issue about?"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #e0e0e0",
                      fontSize: "14px",
                      fontFamily: "Inter, sans-serif",
                      color: "#242424",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="priority"
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#242424",
                      marginBottom: "6px",
                    }}
                  >
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #e0e0e0",
                      fontSize: "14px",
                      fontFamily: "Inter, sans-serif",
                      color: "#242424",
                      boxSizing: "border-box",
                      outline: "none",
                      background: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="low">Low - General question</option>
                    <option value="medium">Medium - Feature not working as expected</option>
                    <option value="high">High - Major functionality impaired</option>
                    <option value="critical">Critical - Service completely unavailable</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="message"
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#242424",
                      marginBottom: "6px",
                    }}
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    placeholder="Describe your issue in detail..."
                    value={ticketForm.message}
                    onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                    rows={5}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #e0e0e0",
                      fontSize: "14px",
                      fontFamily: "Inter, sans-serif",
                      color: "#242424",
                      boxSizing: "border-box",
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="submit"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "#D97757",
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
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#C4623E")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#D97757")}
                  >
                    <Send size={16} />
                    Submit Ticket
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
