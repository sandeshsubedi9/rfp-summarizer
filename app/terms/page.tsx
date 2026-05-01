import Link from "next/link";

export const metadata = {
  title: "Terms of Service | BidBrief",
  description: "Terms and conditions for using BidBrief.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-brand-muted py-16 px-6">
      <div className="max-w-3xl mx-auto bg-white p-10 md:p-16 rounded-2xl border border-brand-border shadow-sm">
        <Link href="/" className="text-brand-sage hover:text-brand-dark font-bold text-sm mb-8 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-extrabold text-brand-dark mb-6">Terms of Service</h1>
        <p className="text-brand-sage text-sm mb-8">Last Updated: May 2026</p>

        <div className="space-y-8 text-brand-dark leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-3">1. Acceptance of Terms</h2>
            <p className="text-brand-sage">
              By accessing and using BidBrief ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. Description of Service</h2>
            <p className="text-brand-sage">
              BidBrief provides AI-assisted analysis of Request for Proposal (RFP) documents. The AI extractions are for informational purposes to accelerate your review process and should not be considered legal or professional advice. You must verify all critical compliance items against the original source documents.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. User Accounts</h2>
            <p className="text-brand-sage">
              You are responsible for maintaining the confidentiality of your account credentials. You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. Document Handling & Privacy</h2>
            <p className="text-brand-sage leading-relaxed">
              Documents uploaded to the Service are processed temporarily for analysis and stored solely for your historical reference. BidBrief treats your data as confidential; we never use your extracted information for any purpose other than providing your dashboard and reports. For full details, please refer to our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. Disclaimer of Warranties</h2>
            <p className="text-brand-sage">
              The Service is provided "as is" and "as available" without any warranties of any kind. We do not guarantee that the AI extraction will be 100% accurate, complete, or error-free.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
