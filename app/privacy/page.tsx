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
            <p className="text-brand-sage leading-relaxed">
              We use your information exclusively to provide, maintain, and improve the Service. The documents you upload and the data extracted from them are used <strong>solely for the purpose of generating your analysis and maintaining your account history.</strong> We do not sell, lease, or use your private data for any other commercial or external purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. Data Security</h2>
            <p className="text-brand-sage">
              We implement industry-standard security measures to protect your data. Your documents are processed using secure AI infrastructure to generate your analysis results.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. Data Retention</h2>
            <p className="text-brand-sage leading-relaxed">
              Uploaded documents and their extracted analysis results are stored securely to provide your account history. <strong>This data is automatically deleted based on the retention period associated with your specific plan</strong> (e.g., 48 hours for Free users). You may also request the permanent deletion of your account and all associated files at any time by contacting our support team.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
