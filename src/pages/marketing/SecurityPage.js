import React from "react";
import { Helmet } from "react-helmet";
import { Shield, Lock, Server, Users, CreditCard, Eye, Mail } from "lucide-react";
import Navbar from "../../components/marketing/layout/Navbar";
import PageHeader from "../../components/marketing/common/sections/PageHeader";
import Footer from "../../components/marketing/layout/Footer";

const SecurityPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Security | Chatters - Enterprise-Grade Protection</title>
        <meta
          name="description"
          content="Learn about Chatters' security practices. We protect your data with encryption, secure authentication, and industry-leading infrastructure partners."
        />
        <meta
          name="keywords"
          content="Chatters security, data protection, GDPR, encryption, secure feedback platform, hospitality software security"
        />
        <meta property="og:title" content="Security | Chatters" />
        <meta
          property="og:description"
          content="Enterprise-grade security for your feedback data. Learn how Chatters protects your business."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://getchatters.com/security" />
      </Helmet>

      <Navbar overlay />

      <PageHeader
        title="Security"
        description="Your data security is our priority. Learn how we protect your business with enterprise-grade security measures."
        backgroundGradient="from-white to-gray-100"
        showSubtitle={true}
        subtitle="Trust & Safety"
      />

      <section className="max-w-4xl mx-auto px-6 py-20 text-left">
        <div className="prose prose-lg prose-gray max-w-none">
          <p className="text-sm text-gray-600 mb-8">
            <strong>Last Updated:</strong> November 2025
          </p>

          {/* Security Overview */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 m-0">Security Overview</h2>
            </div>
            <p className="text-gray-700 leading-relaxed m-0">
              Chatters is built on enterprise-grade infrastructure with security at every layer.
              We partner with industry-leading providers who maintain the highest security certifications,
              and we implement defence-in-depth practices to protect your data.
            </p>
          </div>

          {/* Infrastructure Partners */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Server className="w-6 h-6 text-gray-700" />
            Infrastructure Partners
          </h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            We partner with industry-leading cloud providers who maintain rigorous security certifications:
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">Vercel</h4>
              <ul className="text-sm text-gray-600 space-y-1 m-0 list-none p-0">
                <li>SOC 2 Type II certified</li>
                <li>Global edge network with DDoS protection</li>
                <li>Automatic HTTPS encryption</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">Supabase</h4>
              <ul className="text-sm text-gray-600 space-y-1 m-0 list-none p-0">
                <li>SOC 2 Type II certified</li>
                <li>ISO 27001 certified</li>
                <li>Enterprise-grade database infrastructure</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">Stripe</h4>
              <ul className="text-sm text-gray-600 space-y-1 m-0 list-none p-0">
                <li>PCI DSS Level 1 certified</li>
                <li>No card details stored on our servers</li>
                <li>Secure tokenised payments</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">Sentry</h4>
              <ul className="text-sm text-gray-600 space-y-1 m-0 list-none p-0">
                <li>SOC 2 Type II certified</li>
                <li>Real-time error detection</li>
                <li>No customer PII in error logs</li>
              </ul>
            </div>
          </div>

          {/* Data Encryption */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Lock className="w-6 h-6 text-gray-700" />
            Data Encryption
          </h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            Your data is encrypted both in transit and at rest:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-8 space-y-2">
            <li><strong>In Transit:</strong> All data transmitted using TLS encryption</li>
            <li><strong>At Rest:</strong> AES-256 encryption for all stored data</li>
            <li><strong>Database:</strong> Encrypted connections required</li>
            <li><strong>Backups:</strong> Encrypted automatic daily backups</li>
          </ul>

          {/* Authentication & Access Control */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Users className="w-6 h-6 text-gray-700" />
            Authentication & Access Control
          </h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            We implement robust authentication and authorisation controls:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
            <li><strong>Secure Authentication:</strong> Industry-standard authentication with automatic session management</li>
            <li><strong>Password Security:</strong> Passwords are securely hashed and never stored in plain text</li>
            <li><strong>Role-Based Access:</strong> Users only see data they're authorised to access</li>
            <li><strong>Account Isolation:</strong> Complete separation of data between customer accounts</li>
          </ul>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">
            <h4 className="font-semibold text-blue-900 mb-2">Role-Based Access Control</h4>
            <p className="text-blue-800 text-sm leading-relaxed m-0">
              Account owners have full access to their account data and billing.
              Staff members only see venues they've been explicitly assigned to.
            </p>
          </div>

          {/* Payment Security */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-gray-700" />
            Payment Security
          </h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            All payment processing is handled by Stripe, a PCI DSS Level 1 certified payment processor:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-8 space-y-2">
            <li><strong>No Card Storage:</strong> Credit card details never touch our servers</li>
            <li><strong>Secure Processing:</strong> All payments processed through Stripe's secure infrastructure</li>
            <li><strong>Billing Portal:</strong> Subscription management through Stripe's secure hosted portal</li>
          </ul>

          {/* Monitoring */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Eye className="w-6 h-6 text-gray-700" />
            Monitoring & Incident Response
          </h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            We maintain continuous monitoring and have established incident response procedures:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-8 space-y-2">
            <li><strong>Error Tracking:</strong> Real-time monitoring for rapid issue detection</li>
            <li><strong>Uptime Monitoring:</strong> Continuous availability monitoring</li>
            <li><strong>Incident Response:</strong> Documented procedures for security incident handling</li>
          </ul>

          {/* Privacy & Compliance */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy & Compliance</h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            We're committed to protecting privacy and complying with data protection regulations:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
            <li><strong>GDPR Compliant:</strong> We follow GDPR requirements for data handling and user rights</li>
            <li><strong>Data Minimisation:</strong> We only collect data necessary for service delivery</li>
            <li><strong>Anonymous Feedback:</strong> Customer feedback is collected anonymously by default</li>
            <li><strong>Data Portability:</strong> Account data can be exported upon request</li>
            <li><strong>Right to Deletion:</strong> Accounts and associated data can be fully deleted</li>
          </ul>

          <p className="text-gray-700 mb-8 leading-relaxed">
            For full details, please review our{" "}
            <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
          </p>

          {/* Data Retention */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Retention</h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            We retain data only as long as necessary:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-10 space-y-2">
            <li><strong>Active Accounts:</strong> Data retained while your subscription is active</li>
            <li><strong>Cancelled Accounts:</strong> Data deleted within 30 days after cancellation</li>
          </ul>

          {/* Security Contact */}
          <div className="bg-gray-900 rounded-2xl p-8 mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white m-0">Security Contact</h2>
            </div>
            <p className="text-gray-300 leading-relaxed mb-4">
              We take security seriously. If you have security concerns or questions,
              please contact us.
            </p>
            <div className="space-y-2">
              <p className="text-white m-0">
                <strong>Email:</strong>{" "}
                <a href="mailto:security@getchatters.com" className="text-blue-400 hover:underline">
                  security@getchatters.com
                </a>
              </p>
            </div>
          </div>

          {/* Commitment */}
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Commitment</h2>
            <p className="text-gray-700 leading-relaxed">
              Security is an ongoing process. We continuously review and improve our
              security practices and work with our infrastructure partners
              to maintain high standards of protection for your data.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SecurityPage;
