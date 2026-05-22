import { useState } from "react";
import {
  Shield,
  Download,
  FileText,
  CheckCircle,
  Clock,
  Globe,
  Lock,
  UserCheck,
  Database,
  Mail,
  Cookie,
  AlertCircle,
} from "lucide-react";

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
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

export default function PrivacyPolicyPage() {
  const [showToast, setShowToast] = useState(false);

  const handleDownloadPDF = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const iconStyle: React.CSSProperties = {
    color: "#5b5fc7",
    flexShrink: 0,
    marginTop: "4px",
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: 700,
                margin: 0,
                letterSpacing: "-0.5px",
                color: "#242424",
              }}
            >
              Privacy Policy
            </h1>
            <p style={{ margin: "8px 0 0", color: "#616161", fontSize: "14px" }}>
              Last updated: January 15, 2025
            </p>
          </div>
          <button
            onClick={handleDownloadPDF}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#5b5fc7",
              color: "#ffffff",
              border: "none",
              padding: "10px 18px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 0.2s",
              fontFamily: "Inter, sans-serif",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#4a4eb5")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#5b5fc7")}
          >
            <Download size={16} />
            Download as PDF
          </button>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "40px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          {/* Section 1: Introduction */}
          <section style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <FileText size={22} style={iconStyle} />
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  margin: 0,
                  color: "#242424",
                }}
              >
                1. Introduction
              </h2>
            </div>
            <p style={{ margin: 0, color: "#616161", fontSize: "15px" }}>
              Brixstac ("we," "us," or "our") is committed to protecting your privacy. This
              Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you use our SaaS platform and related services (collectively,
              the "Services"). Please read this policy carefully. By using our Services, you
              consent to the data practices described herein.
            </p>
          </section>

          {/* Section 2: Information We Collect */}
          <section style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Database size={22} style={iconStyle} />
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  margin: 0,
                  color: "#242424",
                }}
              >
                2. Information We Collect
              </h2>
            </div>
            <p style={{ margin: "0 0 12px", color: "#616161", fontSize: "15px" }}>
              We collect several types of information from and about users of our Services:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  background: "#f8f8fb",
                  borderRadius: "8px",
                  padding: "16px 20px",
                  borderLeft: "3px solid #5b5fc7",
                }}
              >
                <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 600, color: "#242424" }}>
                  Account Information
                </h3>
                <p style={{ margin: 0, color: "#616161", fontSize: "14px" }}>
                  When you register for an account, we collect your name, email address,
                  company name, job title, and password (stored in hashed form).
                </p>
              </div>
              <div
                style={{
                  background: "#f8f8fb",
                  borderRadius: "8px",
                  padding: "16px 20px",
                  borderLeft: "3px solid #5b5fc7",
                }}
              >
                <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 600, color: "#242424" }}>
                  Usage Data
                </h3>
                <p style={{ margin: 0, color: "#616161", fontSize: "14px" }}>
                  We collect information about how you interact with our Services, including
                  pages visited, features used, time spent, clicks, and workflow patterns.
                </p>
              </div>
              <div
                style={{
                  background: "#f8f8fb",
                  borderRadius: "8px",
                  padding: "16px 20px",
                  borderLeft: "3px solid #5b5fc7",
                }}
              >
                <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 600, color: "#242424" }}>
                  Cookies and Tracking Technologies
                </h3>
                <p style={{ margin: 0, color: "#616161", fontSize: "14px" }}>
                  We use cookies, web beacons, and similar technologies to track activity
                  and store preferences. You can manage cookie settings through your browser.
                </p>
              </div>
              <div
                style={{
                  background: "#f8f8fb",
                  borderRadius: "8px",
                  padding: "16px 20px",
                  borderLeft: "3px solid #5b5fc7",
                }}
              >
                <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 600, color: "#242424" }}>
                  Third-Party Integrations
                </h3>
                <p style={{ margin: 0, color: "#616161", fontSize: "14px" }}>
                  If you connect third-party services (e.g., Slack, GitHub, Google Calendar),
                  we collect data necessary to facilitate those integrations per their
                  respective privacy policies.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: How We Use Your Information */}
          <section style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <UserCheck size={22} style={iconStyle} />
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  margin: 0,
                  color: "#242424",
                }}
              >
                3. How We Use Your Information
              </h2>
            </div>
            <p style={{ margin: "0 0 12px", color: "#616161", fontSize: "15px" }}>
              We use the information we collect for the following purposes:
            </p>
            <ul
              style={{
                margin: 0,
                paddingLeft: "20px",
                color: "#616161",
                fontSize: "15px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <li>
                <strong style={{ color: "#242424" }}>Service Provision:</strong> To operate,
                maintain, and provide the features and functionality of our Services.
              </li>
              <li>
                <strong style={{ color: "#242424" }}>Improvement:</strong> To analyze usage
                patterns, troubleshoot issues, and enhance user experience.
              </li>
              <li>
                <strong style={{ color: "#242424" }}>Communications:</strong> To send service
                updates, security alerts, and marketing communications (with opt-out
                options).
              </li>
              <li>
                <strong style={{ color: "#242424" }}>Legal Compliance:</strong> To comply with
                applicable laws, regulations, and legal processes.
              </li>
            </ul>
          </section>

          {/* Section 4: Data Sharing */}
          <section style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Globe size={22} style={iconStyle} />
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  margin: 0,
                  color: "#242424",
                }}
              >
                4. Data Sharing and Disclosure
              </h2>
            </div>
            <p style={{ margin: "0 0 12px", color: "#616161", fontSize: "15px" }}>
              We do not sell your personal information. We may share data in the following
              circumstances:
            </p>
            <ul
              style={{
                margin: 0,
                paddingLeft: "20px",
                color: "#616161",
                fontSize: "15px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <li>
                <strong style={{ color: "#242424" }}>Service Providers:</strong> With trusted
                vendors who perform services on our behalf under strict confidentiality
                agreements.
              </li>
              <li>
                <strong style={{ color: "#242424" }}>Legal Requirements:</strong> When
                required by law, court order, or governmental authority.
              </li>
              <li>
                <strong style={{ color: "#242424" }}>Business Transfers:</strong> In connection
                with a merger, acquisition, or sale of assets, subject to continued privacy
                protections.
              </li>
            </ul>
          </section>

          {/* Section 5: Data Security */}
          <section style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Lock size={22} style={iconStyle} />
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  margin: 0,
                  color: "#242424",
                }}
              >
                5. Data Security
              </h2>
            </div>
            <p style={{ margin: "0 0 12px", color: "#616161", fontSize: "15px" }}>
              We implement robust security measures to protect your data:
            </p>
            <ul
              style={{
                margin: 0,
                paddingLeft: "20px",
                color: "#616161",
                fontSize: "15px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <li>
                <strong style={{ color: "#242424" }}>Encryption:</strong> All data is
                encrypted in transit (TLS 1.3) and at rest (AES-256).
              </li>
              <li>
                <strong style={{ color: "#242424" }}>Access Controls:</strong> Role-based
                access controls with multi-factor authentication.
              </li>
              <li>
                <strong style={{ color: "#242424" }}>Breach Notification:</strong> In the
                unlikely event of a data breach, we will notify affected users within 72 hours
                as required by applicable law.
              </li>
            </ul>
          </section>

          {/* Section 6: Your Rights */}
          <section style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Shield size={22} style={iconStyle} />
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  margin: 0,
                  color: "#242424",
                }}
              >
                6. Your Rights
              </h2>
            </div>
            <p style={{ margin: "0 0 12px", color: "#616161", fontSize: "15px" }}>
              Depending on your jurisdiction, you may have the following rights:
            </p>
            <ul
              style={{
                margin: 0,
                paddingLeft: "20px",
                color: "#616161",
                fontSize: "15px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <li>
                <strong style={{ color: "#242424" }}>Access:</strong> Request a copy of the
                personal data we hold about you.
              </li>
              <li>
                <strong style={{ color: "#242424" }}>Correction:</strong> Request correction
                of inaccurate or incomplete data.
              </li>
              <li>
                <strong style={{ color: "#242424" }}>Deletion:</strong> Request deletion of
                your personal data, subject to legal retention requirements.
              </li>
              <li>
                <strong style={{ color: "#242424" }}>Portability:</strong> Receive your data
                in a structured, machine-readable format.
              </li>
              <li>
                <strong style={{ color: "#242424" }}>Objection:</strong> Object to certain
                processing activities, including direct marketing.
              </li>
            </ul>
            <p style={{ margin: "12px 0 0", color: "#616161", fontSize: "15px" }}>
              To exercise these rights, contact us at{" "}
              <a href="mailto:privacy@brixstac.com" style={{ color: "#5b5fc7" }}>
                privacy@brixstac.com
              </a>
              .
            </p>
          </section>

          {/* Section 7: Data Retention */}
          <section style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Clock size={22} style={iconStyle} />
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  margin: 0,
                  color: "#242424",
                }}
              >
                7. Data Retention
              </h2>
            </div>
            <p style={{ margin: 0, color: "#616161", fontSize: "15px" }}>
              We retain your personal data only for as long as necessary to fulfill the
              purposes outlined in this policy, unless a longer retention period is required
              by law. When your account is deleted, we remove personal data within 90 days,
              though anonymized usage statistics may be retained for analytical purposes.
            </p>
          </section>

          {/* Section 8: International Transfers */}
          <section style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Globe size={22} style={iconStyle} />
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  margin: 0,
                  color: "#242424",
                }}
              >
                8. International Data Transfers
              </h2>
            </div>
            <p style={{ margin: 0, color: "#616161", fontSize: "15px" }}>
              Your data may be transferred to and processed in countries other than your
              country of residence. We ensure appropriate safeguards are in place, including
              Standard Contractual Clauses approved by the European Commission, to protect
              your data during international transfers.
            </p>
          </section>

          {/* Section 9: Children's Privacy */}
          <section style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <AlertCircle size={22} style={iconStyle} />
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  margin: 0,
                  color: "#242424",
                }}
              >
                9. Children's Privacy
              </h2>
            </div>
            <p style={{ margin: 0, color: "#616161", fontSize: "15px" }}>
              Our Services are not intended for individuals under 16 years of age. We do not
              knowingly collect personal information from children. If you believe we have
              inadvertently collected data from a minor, please contact us immediately and we
              will take steps to delete such information.
            </p>
          </section>

          {/* Section 10: Changes to This Policy */}
          <section style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <FileText size={22} style={iconStyle} />
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  margin: 0,
                  color: "#242424",
                }}
              >
                10. Changes to This Policy
              </h2>
            </div>
            <p style={{ margin: 0, color: "#616161", fontSize: "15px" }}>
              We may update this Privacy Policy from time to time. We will notify you of any
              material changes by posting the new policy on this page and updating the "Last
              updated" date. For significant changes, we will also send an email notification
              to the address associated with your account.
            </p>
          </section>

          {/* Section 11: Contact Us */}
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Mail size={22} style={iconStyle} />
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  margin: 0,
                  color: "#242424",
                }}
              >
                11. Contact Us
              </h2>
            </div>
            <p style={{ margin: "0 0 12px", color: "#616161", fontSize: "15px" }}>
              If you have any questions, concerns, or requests regarding this Privacy Policy
              or our data practices, please contact our Data Protection Officer:
            </p>
            <div
              style={{
                background: "#f8f8fb",
                borderRadius: "8px",
                padding: "20px",
                borderLeft: "3px solid #5b5fc7",
              }}
            >
              <p style={{ margin: "0 0 6px", fontSize: "15px", color: "#242424" }}>
                <strong>Email:</strong>{" "}
                <a href="mailto:privacy@brixstac.com" style={{ color: "#5b5fc7" }}>
                  privacy@brixstac.com
                </a>
              </p>
              <p style={{ margin: "0 0 6px", fontSize: "15px", color: "#242424" }}>
                <strong>Address:</strong> Brixstac, Inc. 123 Innovation Drive, Suite 400, San
                Francisco, CA 94105, USA
              </p>
              <p style={{ margin: 0, fontSize: "15px", color: "#242424" }}>
                <strong>Response time:</strong> We aim to respond within 48 hours.
              </p>
            </div>
          </section>
        </div>
      </div>

      {showToast && (
        <Toast message="PDF download started" onClose={() => setShowToast(false)} />
      )}
    </div>
  );
}
