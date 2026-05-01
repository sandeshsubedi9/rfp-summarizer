import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | BidBrief",
  description: "Privacy policy for BidBrief users.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-brand-muted py-16 px-6">
      <div className="max-w-3xl mx-auto bg-white p-10 md:p-16 rounded-2xl border border-brand-border shadow-sm">
        <Link href="/" className="text-brand-sage hover:text-brand-dark font-bold text-sm mb-8 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-extrabold text-brand-dark mb-6">Privacy Policy</h1>
        <p className="text-brand-sage text-sm mb-8">Last Updated: May 2026</p>

        <div className="space-y-8 text-brand-dark leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-3">1. Information We Collect</h2>
            <p className="text-brand-sage">
              We collect information you provide directly to us when you create an account, such as your name and email address. We also collect the documents (RFPs) you upload for analysis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. How We Use Your Information</h2>
            <p className="text-brand-sage">
              We use your information to provide, maintain, and improve the Service. The documents you upload are processed by our AI partners (e.g., Google Gemini) solely for the purpose of generating your analysis dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. Data Security & AI Training</h2>
            <p className="text-brand-sage">
              <strong>We do NOT use your private RFP documents to train public AI models.</strong> Data sent to our AI providers is strictly used for your inference request and is not retained by them for model training purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. Data Retention</h2>
            <p className="text-brand-sage">
              Uploaded documents and their extracted analysis are stored securely in our database so you can access your dashboard. You may request the deletion of your account and all associated documents at any time by contacting support.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
