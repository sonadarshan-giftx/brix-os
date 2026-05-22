import { useState } from "react";
import {
  FileSignature,
  Briefcase,
  UserCog,
  CreditCard,
  Scale,
  LockKeyhole,
  Gavel,
  AlertTriangle,
  ShieldCheck,
  Globe,
  RefreshCw,
  Mail,
} from "lucide-react";

export default function TermsOfServicePage() {
  const iconStyle: React.CSSProperties = {
    color: "#5b5fc7",
    flexShrink: 0,
    marginTop: "4px",
  };

  return (
    <div style={{ background: "#f5f5f3", minHeight: "100vh" }}>
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
            Terms of Service
          </h1>
          <p style={{ margin: "8px 0 0", color: "#616161", fontSize: "14px" }}>
            Last updated: January 15, 2025
          </p>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "40px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          {/* Section 1: Acceptance */}
          <section style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <FileSignature size={22} style={iconStyle} />
              <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "#242424" }}>
                1. Acceptance of Terms
              </h2>
            </div>
            <p style={{ margin: 0, color: "#616161", fontSize: "15px" }}>
              By accessing or using the Brixstac platform and services ("Services"), you agree
              to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms,
              you may not access or use the Services. These Terms constitute a legally binding
              agreement between you and Brixstac, Inc. ("Brixstac," "we," "us," or "our").
            </p>
          </section>

          {/* Section 2: Description of Service */}
          <section style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Briefcase size={22} style={iconStyle} />
              <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "#242424" }}>
                2. Description of Service
              </h2>
            </div>
            <p style={{ margin: 0, color: "#616161", fontSize: "15px" }}>
              Brixstac provides a cloud-based software-as-a-service platform for project management,
              team collaboration, AI-powered workflow automation, and related productivity tools.
              We reserve the right to modify, suspend, or discontinue any aspect of the Services
              at any time, with or without notice. We will not be liable to you or any third party
              for any modification, suspension, or discontinuation.
            </p>
          </section>

          {/* Section 3: Account Registration */}
          <section style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <UserCog size={22} style={iconStyle} />
              <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "#242424" }}>
                3. Account Registration and Security
              </h2>
            </div>
            <p style={{ margin: "0 0 12px", color: "#616161", fontSize: "15px" }}>
              To use certain features of the Services, you must register for an account. You agree
              to:
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
              <li>Provide accurate, current, and complete information during registration.</li>
              <li>Maintain and promptly update your account information.</li>
              <li>Keep your password secure and confidential.</li>
              <li>Notify us immediately of any unauthorized use of your account.</li>
              <li>Accept full responsibility for all activities that occur under your account.</li>
            </ul>
          </section>

          {/* Section 4: Payment and Billing */}
          <section style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <CreditCard size={22} style={iconStyle} />
              <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "#242424" }}>
                4. Payment and Billing
              </h2>
            </div>
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
                  Subscription Terms
                </h3>
                <p style={{ margin: 0, color: "#616161", fontSize: "14px" }}>
                  Certain features require a paid subscription. Subscriptions automatically renew
                  at the end of each billing period unless cancelled. You may cancel at any time
                  through your account settings or by contacting support.
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
                  Refund Policy
                </h3>
                <p style={{ margin: 0, color: "#616161", fontSize: "14px" }}>
                  We offer a 14-day money-back guarantee for annual subscriptions. Monthly
                  subscriptions can be cancelled anytime but are not eligible for refunds for
                  prior billing periods. Refunds are processed within 10 business days.
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
                  Price Changes
                </h3>
                <p style={{ margin: 0, color: "#616161", fontSize: "14px" }}>
                  We may adjust subscription pricing with 30 days' advance notice. Price changes
                  take effect at the start of the next billing cycle following the notice period.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Acceptable Use */}
          <section style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Scale size={22} style={iconStyle} />
              <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "#242424" }}>
                5. Acceptable Use Policy
              </h2>
            </div>
            <p style={{ margin: "0 0 12px", color: "#616161", fontSize: "15px" }}>
              You agree not to use the Services to:
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
              <li>Violate any applicable law, regulation, or governmental order.</li>
              <li>Infringe upon intellectual property rights or privacy rights of others.</li>
              <li>Distribute malware, viruses, or other harmful code.</li>
              <li>Engage in unauthorized scraping, data mining, or harvesting of content.</li>
              <li>Send unsolicited communications (spam) or harass other users.</li>
              <li>Attempt to gain unauthorized access to the Services or related systems.</li>
              <li>Use the Services in a manner that degrades performance for other users.</li>
            </ul>
            <p style={{ margin: "12px 0 0", color: "#616161", fontSize: "15px" }}>
              Violation of this policy may result in immediate suspension or termination of your
              account, at our sole discretion.
            </p>
          </section>

          {/* Section 6: Intellectual Property */}
          <section style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <LockKeyhole size={22} style={iconStyle} />
              <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "#242424" }}>
                6. Intellectual Property
              </h2>
            </div>
            <p style={{ margin: "0 0 12px", color: "#616161", fontSize: "15px" }}>
              All content, features, and functionality of the Services, including but not limited
              to software, text, graphics, logos, icons, images, and source code, are owned by
              Brixstac and protected by intellectual property laws. You are granted a limited,
              non-exclusive, non-transferable license to use the Services in accordance with these
              Terms. You retain ownership of any data you upload to the Services. You grant
              Brixstac a license to use such data solely as necessary to provide and improve the
              Services.
            </p>
          </section>

          {/* Section 7: Termination */}
          <section style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <AlertTriangle size={22} style={iconStyle} />
              <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "#242424" }}>
                7. Termination
              </h2>
            </div>
            <p style={{ margin: "0 0 12px", color: "#616161", fontSize: "15px" }}>
              We may suspend or terminate your access to the Services at any time, with or
              without cause, with or without notice. Upon termination:
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
                Your right to use the Services immediately ceases, and all licenses granted to
                you terminate.
              </li>
              <li>
                We may delete your account data in accordance with our Data Retention Policy.
              </li>
              <li>
                Provisions of these Terms that by their nature should survive termination shall
                survive, including intellectual property, limitation of liability, and
                indemnification provisions.
              </li>
            </ul>
          </section>

          {/* Section 8: Limitation of Liability */}
          <section style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Gavel size={22} style={iconStyle} />
              <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "#242424" }}>
                8. Limitation of Liability
              </h2>
            </div>
            <p style={{ margin: "0 0 12px", color: "#616161", fontSize: "15px" }}>
              To the maximum extent permitted by applicable law, Brixstac and its affiliates,
              officers, employees, agents, and licensors shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, including loss of
              profits, data, or goodwill, arising out of or in connection with your use of the
              Services. Our total liability for any claim arising under these Terms shall not
              exceed the amount you paid to us for the Services in the 12 months preceding the
              claim, or $100 if you have not made any payments.
            </p>
          </section>

          {/* Section 9: Indemnification */}
          <section style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <ShieldCheck size={22} style={iconStyle} />
              <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "#242424" }}>
                9. Indemnification
              </h2>
            </div>
            <p style={{ margin: 0, color: "#616161", fontSize: "15px" }}>
              You agree to indemnify, defend, and hold harmless Brixstac and its affiliates,
              officers, employees, and agents from and against any claims, liabilities, damages,
              losses, and expenses (including reasonable attorneys' fees) arising out of or in
              any way connected with your access to or use of the Services, your violation of
              these Terms, or your violation of any rights of another.
            </p>
          </section>

          {/* Section 10: Governing Law */}
          <section style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Globe size={22} style={iconStyle} />
              <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "#242424" }}>
                10. Governing Law and Dispute Resolution
              </h2>
            </div>
            <p style={{ margin: 0, color: "#616161", fontSize: "15px" }}>
              These Terms shall be governed by and construed in accordance with the laws of the
              State of California, without regard to its conflict of law principles. Any dispute
              arising out of or relating to these Terms shall be resolved through binding
              arbitration in San Francisco, California, in accordance with the rules of the
              American Arbitration Association. Each party waives any right to participate in
              class actions or class-wide arbitration.
            </p>
          </section>

          {/* Section 11: Changes to Terms */}
          <section style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <RefreshCw size={22} style={iconStyle} />
              <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "#242424" }}>
                11. Changes to Terms
              </h2>
            </div>
            <p style={{ margin: 0, color: "#616161", fontSize: "15px" }}>
              We reserve the right to modify these Terms at any time. We will provide notice of
              material changes by posting the updated Terms on this page with a revised "Last
              updated" date and, for significant changes, by emailing the address associated
              with your account. Your continued use of the Services after such changes
              constitutes your acceptance of the revised Terms.
            </p>
          </section>

          {/* Section 12: Contact */}
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Mail size={22} style={iconStyle} />
              <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "#242424" }}>
                12. Contact Information
              </h2>
            </div>
            <p style={{ margin: "0 0 12px", color: "#616161", fontSize: "15px" }}>
              If you have any questions about these Terms, please contact us:
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
                <a href="mailto:legal@brixstac.com" style={{ color: "#5b5fc7" }}>
                  legal@brixstac.com
                </a>
              </p>
              <p style={{ margin: "0 0 6px", fontSize: "15px", color: "#242424" }}>
                <strong>Address:</strong> Brixstac, Inc. 123 Innovation Drive, Suite 400, San
                Francisco, CA 94105, USA
              </p>
              <p style={{ margin: 0, fontSize: "15px", color: "#242424" }}>
                <strong>Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM PST
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
