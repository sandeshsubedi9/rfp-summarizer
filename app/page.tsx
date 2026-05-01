import Link from "next/link";
import FaqItem from "./components/FaqItem";
import Navbar from "./components/Navbar";
import HeroCTA from "./components/HeroCTA";

/* ─────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────── */

const steps = [
  {
    num: "01",
    title: "Upload Your RFP",
    body: "Drag and drop any PDF bid document | government tenders, enterprise RFPs, security questionnaires | up to 200 pages.",
  },
  {
    num: "02",
    title: "AI Reads Everything",
    body: "Our AI model reads the full document, identifies every requirement, deadline, compliance item, and question buried in the text.",
  },
  {
    num: "03",
    title: "Get Your Action Plan",
    body: "Download a clean Excel or PDF checklist. Every item has a confidence score and the exact page it came from.",
  },
  {
    num: "04",
    title: "Submit & Win",
    body: "Use your saved Answer Bank to reuse past responses. Save 2–5 days of manual work per RFP.",
  },
];

const features = [
  {
    icon: "📄",
    title: "Full Document Extraction",
    body: "No page limits. Send us a 150-page government tender and we'll read every single word.",
  },
  {
    icon: "🎯",
    title: "Confidence Scoring",
    body: "Every extracted item shows a confidence percentage and a citation back to the source page.",
  },
  {
    icon: "📅",
    title: "Deadline Calendar",
    body: "All submission dates, section deadlines, and clarification windows extracted into a single timeline.",
  },
  {
    icon: "⚖️",
    title: "Compliance Checker",
    body: "Mandatory items flagged with SHALL / MUST / REQUIRED language so nothing slips through.",
  },
  {
    icon: "🗂️",
    title: "Answer Bank",
    body: "Save your team's answers by category. Next RFP? Reuse them instead of starting from scratch.",
  },
  {
    icon: "📊",
    title: "Excel & PDF Export",
    body: "One-click download as a structured spreadsheet or a clean PDF summary report.",
  },
];

const pricingPlans = [
  {
    tier: "Free",
    price: "0",
    desc: "Perfect for trying the tool on a real document before you commit.",
    features: [
      "3 RFP uploads per month",
      "Up to 200 pages per document",
      "Full AI extraction (requirements + deadlines)",
      "Download as PDF",
      "Results saved for 24 hours",
    ],
    cta: "Start Free",
    href: "/signup",
    popular: false,
  },
  {
    tier: "Pro",
    price: "19",
    desc: "For solo bid writers and freelancers who process RFPs regularly.",
    features: [
      "Unlimited uploads",
      "Unlimited document size",
      "Full extraction + compliance flagging",
      "Confidence scoring + source citations",
      "Download as Excel + PDF",
      "Answer Bank (save & reuse past answers)",
      "Deadline Calendar export",
      "History saved for 90 days",
    ],
    cta: "Start Pro",
    href: "/signup?plan=pro",
    popular: true,
  },
  {
    tier: "Team",
    price: "49",
    desc: "For bid teams of 3–5 people working on proposals together.",
    features: [
      "Everything in Pro",
      "Up to 5 team member accounts",
      "Section assignment to teammates",
      "Progress tracker (who's done what)",
      "Shared Answer Bank across the whole team",
      "Priority AI processing",
    ],
    cta: "Start Team Trial",
    href: "/signup?plan=team",
    popular: false,
  },
  {
    tier: "Pay-as-you-go",
    price: "9",
    desc: "One RFP. No subscription. No commitment. Pay once and you're done.",
    features: [
      "Single document credit",
      "Full AI extraction",
      "Unlimited pages",
      "Download as Excel + PDF",
      "Results saved for 7 days",
    ],
    cta: "Buy 1 Credit",
    href: "/signup?plan=payg",
    popular: false,
    priceNote: "per document",
  },
];

const faqs = [
  {
    q: "What types of documents does BidBrief support?",
    a: "Any PDF document works | government RFPs, enterprise procurement docs, security questionnaires (RFIs), or vendor assessment forms. If it's a bid document, we can read it.",
  },
  {
    q: "Can the AI miss important information?",
    a: "It can | and we're completely transparent about that. Every extracted item includes a confidence score (e.g. 94%) and a direct citation to the source page. You're always in control of the final review.",
  },
  {
    q: "Is my document kept private?",
    a: "Yes. Your documents are encrypted at rest and in transit. Free tier files are deleted after 24 hours. Pro and Team documents are stored for your history period and never shared.",
  },
  {
    q: "Which AI model does BidBrief use?",
    a: "We use Google Gemini | a state-of-the-art model with one of the largest context windows available, allowing us to process 150+ page documents in a single pass.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. No contracts, no lock-in. Cancel from your account settings at any time and you won't be charged again.",
  },
  {
    q: "What if I only get one RFP a year?",
    a: "Use the Pay-As-You-Go option: $9 for a single document credit, no subscription required.",
  },
];

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-brand-white text-brand-dark selection:bg-brand-teal/20">
      <Navbar />

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-brand-white pt-28 pb-24 border-b border-brand-border">
        {/* Subtler Light Glow */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(4,124,88,0.08)_0%,transparent_70%)]" />
        
        <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center gap-7 max-w-7xl">
          <div className="inline-flex items-center gap-2 bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-[0.78rem] font-bold px-4 py-1.5 rounded-full tracking-wide uppercase">
            Free RFP Analyzer Tool
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-brand-dark max-w-4xl tracking-tight leading-[1.1]">
            Turn 100-Page RFPs into<br />
            <span className="text-brand-teal italic font-bold">Clear Action Plans</span>
          </h1>

          <p className="text-xl text-brand-sage max-w-2xl leading-relaxed">
            BidBrief extracts every requirement, deadline, and compliance item 
            with precision citations so your team can focus on winning.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5 mt-2">
            <HeroCTA label="Upload Your First RFP Free" variant="primary" />
            <Link href="#how-it-works" className="inline-flex items-center justify-center px-9 py-4 rounded-brand text-base font-bold border border-brand-border text-brand-dark hover:border-brand-teal hover:text-brand-teal transition-all">
              See How It Works
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 mt-6 text-[0.9rem] text-brand-sage font-medium">
            <span className="flex items-center gap-2">✓ No credit card required</span>
            <span className="hidden sm:block w-px h-4 bg-brand-border" />
            <span className="flex items-center gap-2">✓ 3 free uploads per month</span>
            <span className="hidden sm:block w-px h-4 bg-brand-border" />
            <span className="flex items-center gap-2">✓ Results in 60 seconds</span>
          </div>

        </div>
      </section>



      {/* ── WHY CHOOSE US ──────────────────────────────────── */}
      <section className="bg-white py-24 border-b border-brand-border" id="why-us">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
            <span className="inline-block text-[0.8rem] font-bold tracking-[0.1em] uppercase text-brand-teal mb-4">Why BidBrief</span>
            <h2 className="text-4xl font-bold text-brand-dark mb-4">Built for People Who Actually Do the Work</h2>
            <p className="text-brand-sage max-w-2xl mx-auto text-lg leading-relaxed">
              Most RFP software is sold to procurement directors with six-figure budgets.
              We built BidBrief for the consultant submitting a proposal from their home office,
              and the 5-person firm that can't justify a $10,000 annual contract.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="relative p-10 bg-brand-muted rounded-[calc(var(--radius-brand)*2)] border border-brand-border group hover:border-brand-teal hover:shadow-[0_10px_40px_rgba(4,124,88,0.06)] transition-all overflow-hidden">
              <div className="absolute -top-6 -right-6 text-[5rem] opacity-5 select-none">🚀</div>
              <div className="w-12 h-12 rounded-2xl bg-brand-teal-lt flex items-center justify-center text-2xl mb-6">
                🚀
              </div>
              <h3 className="text-xl font-bold text-brand-dark mb-3">Start in 30 Seconds</h3>
              <p className="text-brand-sage text-[0.95rem] leading-relaxed mb-6">
                No demo call. No sales rep. No credit card. Create your account and upload your first RFP in under a minute.
                If it doesn't work for you, you haven't paid a cent.
              </p>
              <div className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-[0.85rem] font-semibold text-brand-teal">
                  <span className="w-5 h-5 rounded-full bg-brand-teal/10 flex items-center justify-center text-xs">✓</span>
                  3 free uploads, no card required
                </span>
                <span className="inline-flex items-center gap-2 text-[0.85rem] font-semibold text-brand-teal">
                  <span className="w-5 h-5 rounded-full bg-brand-teal/10 flex items-center justify-center text-xs">✓</span>
                  Full extraction on every free upload
                </span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="relative p-10 bg-brand-teal rounded-[calc(var(--radius-brand)*2)] border border-brand-teal shadow-[0_15px_50px_rgba(4,124,88,0.2)] group overflow-hidden">
              <div className="absolute -top-6 -right-6 text-[5rem] opacity-10 select-none">💳</div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl mb-6">
                💳
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Pay for What You Use</h3>
              <p className="text-white/75 text-[0.95rem] leading-relaxed mb-6">
                No credit bundles. No confusing tier limits. Either subscribe for $19/month flat,
                or buy a single document credit for $9 and be done with it.
              </p>
              <div className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-[0.85rem] font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
                  $9 per document | no subscription
                </span>
                <span className="inline-flex items-center gap-2 text-[0.85rem] font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
                  $19/mo flat | unlimited uploads
                </span>
                <span className="inline-flex items-center gap-2 text-[0.85rem] font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
                  Cancel any time | no lock-in
                </span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="relative p-10 bg-brand-muted rounded-[calc(var(--radius-brand)*2)] border border-brand-border group hover:border-brand-teal hover:shadow-[0_10px_40px_rgba(4,124,88,0.06)] transition-all overflow-hidden">
              <div className="absolute -top-6 -right-6 text-[5rem] opacity-5 select-none">🏢</div>
              <div className="w-12 h-12 rounded-2xl bg-brand-teal-lt flex items-center justify-center text-2xl mb-6">
                🏢
              </div>
              <h3 className="text-xl font-bold text-brand-dark mb-3">Small Teams Are First-Class</h3>
              <p className="text-brand-sage text-[0.95rem] leading-relaxed mb-6">
                Enterprise tools gate the features you actually need behind tiers you can't afford.
                BidBrief gives independent contractors and growing firms the same extraction
                quality at a fraction of the cost.
              </p>
              <div className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-[0.85rem] font-semibold text-brand-teal">
                  <span className="w-5 h-5 rounded-full bg-brand-teal/10 flex items-center justify-center text-xs">✓</span>
                  Solo consultants welcome
                </span>
                <span className="inline-flex items-center gap-2 text-[0.85rem] font-semibold text-brand-teal">
                  <span className="w-5 h-5 rounded-full bg-brand-teal/10 flex items-center justify-center text-xs">✓</span>
                  Team plan for up to 5 people
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section className="bg-brand-muted py-24" id="how-it-works">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
            <span className="inline-block text-[0.8rem] font-bold tracking-[0.1em] uppercase text-brand-teal mb-4">The Process</span>
            <h2 className="text-4xl font-bold text-brand-dark mb-4">From Upload to Action Plan</h2>
            <p className="text-brand-sage max-w-xl mx-auto text-lg leading-relaxed">
              No setup, no training, no sales call. Upload your PDF and your
              structured checklist is ready in under a minute.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="flex flex-col items-start gap-5 p-10 bg-white border border-brand-border rounded-[calc(var(--radius-brand)*2)] hover:border-brand-teal hover:shadow-[0_8px_30px_rgba(4,124,88,0.06)] transition-all group">
                <div className="w-12 h-12 rounded-full bg-brand-teal-lt flex items-center justify-center text-brand-teal text-lg font-black group-hover:bg-brand-teal group-hover:text-white transition-all">
                  {s.num}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-brand-dark">{s.title}</h3>
                  <p className="text-brand-sage text-[0.95rem] leading-relaxed mt-2.5">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORKFLOW DEMO ──────────────────────────────────── */}
      <section className="py-24" id="workflow">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="flex flex-col">
              <span className="inline-block text-[0.8rem] font-bold tracking-[0.1em] uppercase text-brand-teal mb-4">Why BidBrief</span>
              <h2 className="text-4xl font-bold text-brand-dark mb-6">Built for Teams Who Win Contracts</h2>
              <p className="text-brand-sage text-lg leading-relaxed mb-8">
                Every competitor in this space charges $10,000 a year and requires
                a 45-minute sales demo. BidBrief is self-serve, starts free, and
                was designed for independent contractors and small consulting firms.
              </p>
              <ul className="flex flex-col gap-5 list-none">
                <li className="flex items-start gap-4 text-base text-brand-dark font-medium">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-teal/10 flex items-center justify-center text-brand-teal font-bold text-xs mt-0.5">✓</span>
                  No sales demo required: sign up and start immediately
                </li>
                <li className="flex items-start gap-4 text-base text-brand-dark font-medium">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-teal/10 flex items-center justify-center text-brand-teal font-bold text-xs mt-0.5">✓</span>
                  Full extraction capabilities on your first upload
                </li>
                <li className="flex items-start gap-4 text-base text-brand-dark font-medium">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-teal/10 flex items-center justify-center text-brand-teal font-bold text-xs mt-0.5">✓</span>
                  Pay $9 for a single document if you never need more
                </li>
                <li className="flex items-start gap-4 text-base text-brand-dark font-medium">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-teal/10 flex items-center justify-center text-brand-teal font-bold text-xs mt-0.5">✓</span>
                  Precision citations: every item cites its source page
                </li>
              </ul>
              <div className="mt-10">
                <HeroCTA label="Start Free Today" variant="primary" />
              </div>
            </div>

            {/* Live Demo Preview - Light/Clean Style */}
            <div className="p-8 bg-white border-1.5 border-brand-border rounded-[calc(var(--radius-brand)*3)] shadow-[0_20px_50px_rgba(30,23,2,0.04)] relative">
              <div className="absolute -top-4 -right-4 bg-brand-teal text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                Live Output Preview
              </div>
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-border" />
                <span className="w-2.5 h-2.5 rounded-full bg-brand-border" />
                <span className="w-2.5 h-2.5 rounded-full bg-brand-border" />
                <span className="ml-2 text-[0.85rem] font-bold text-brand-sage uppercase tracking-widest">
                  BidBrief Viewer
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4 p-4 rounded-brand bg-brand-teal-lt/40 border-l-4 border-brand-teal">
                  <span className="text-[0.7rem] font-black px-3 py-1.5 rounded-full bg-[#fef3c7] text-[#92400e] uppercase tracking-tighter whitespace-nowrap">Deadline</span>
                  <span className="text-[0.85rem] text-brand-dark leading-snug font-medium">Proposal submission due: <strong>June 15, 2025</strong> (Page 3)</span>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-brand bg-brand-muted/50 border-l-4 border-brand-border">
                  <span className="text-[0.7rem] font-black px-3 py-1.5 rounded-full bg-brand-teal-lt text-brand-teal uppercase tracking-tighter whitespace-nowrap">Requirement</span>
                  <span className="text-[0.85rem] text-brand-dark leading-snug font-medium">System SHALL support 500 concurrent users (Page 12)</span>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-brand bg-brand-muted/50 border-l-4 border-brand-border">
                  <span className="text-[0.7rem] font-black px-3 py-1.5 rounded-full bg-[#fce7f3] text-[#9d174d] uppercase tracking-tighter whitespace-nowrap">Compliance</span>
                  <span className="text-[0.85rem] text-brand-dark leading-snug font-medium">MUST provide HIPAA compliance certificate (Page 18)</span>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-brand bg-brand-teal-lt/40 border-l-4 border-brand-teal">
                  <span className="text-[0.7rem] font-black px-3 py-1.5 rounded-full bg-[#fef3c7] text-[#92400e] uppercase tracking-tighter whitespace-nowrap">Deadline</span>
                  <span className="text-[0.85rem] text-brand-dark leading-snug font-medium">Clarification questions due: <strong>May 28, 2025</strong> (Page 5)</span>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button className="flex-1 inline-flex items-center justify-center px-5 py-3 rounded-brand text-sm font-bold bg-brand-dark text-white hover:bg-brand-teal transition-all">
                  ⬇ Export to Excel
                </button>
                <button className="flex-1 inline-flex items-center justify-center px-5 py-3 rounded-brand text-sm font-bold border-1.5 border-brand-border text-brand-dark hover:border-brand-teal transition-all">
                  ⬇ View Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────── */}
      <section className="bg-brand-muted py-24" id="features">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
            <span className="inline-block text-[0.8rem] font-bold tracking-[0.1em] uppercase text-brand-teal mb-4">What You Get</span>
            <h2 className="text-4xl font-bold text-brand-dark mb-4">Everything Your Team Needs</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="p-9 bg-white border border-brand-border rounded-[calc(var(--radius-brand)*2)] hover:border-brand-teal hover:shadow-[0_10px_40px_rgba(4,124,88,0.06)] hover:-translate-y-1 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-brand-teal-lt flex items-center justify-center text-2xl mb-6">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-brand-dark">{f.title}</h3>
                <p className="text-[1rem] text-brand-sage leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────── */}
      <section className="py-24 bg-white" id="pricing">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
            <span className="inline-block text-[0.8rem] font-bold tracking-[0.1em] uppercase text-brand-teal mb-4">Pricing</span>
            <h2 className="text-4xl font-bold text-brand-dark mb-4">Simple Pricing. No Sales Calls.</h2>
            <p className="text-brand-sage max-w-xl mx-auto text-lg leading-relaxed">
              Start free. Upgrade only when you need to. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 items-start">
            {pricingPlans.map((plan) => (
              <div
                key={plan.tier}
                className={`p-10 flex flex-col gap-7 bg-white border border-brand-border rounded-[calc(var(--radius-brand)*2)] transition-all hover:border-brand-teal hover:shadow-[0_15px_50px_rgba(4,124,88,0.08)] ${plan.popular ? "border-brand-teal shadow-[0_15px_50px_rgba(4,124,88,0.12)] relative bg-brand-teal-lt/10" : ""}`}
              >
                {plan.popular && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-teal text-white text-[0.75rem] font-black tracking-widest uppercase px-5 py-1.5 rounded-full shadow-lg">Most Popular</span>}

                <div>
                  <div className="text-[0.8rem] font-black tracking-[0.15em] uppercase text-brand-teal mb-3">{plan.tier}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-brand-sage">$</span>
                    <span className="text-5xl font-black text-brand-dark leading-none">{plan.price}</span>
                    <span className="text-[1rem] font-bold text-brand-sage">/{plan.priceNote ?? "mo"}</span>
                  </div>
                  <p className="text-[0.95rem] text-brand-sage mt-4 leading-relaxed font-medium">{plan.desc}</p>
                </div>

                <ul className="flex flex-col gap-3.5 list-none">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-3 text-[0.9rem] text-brand-dark font-medium leading-tight">
                      <span className="text-brand-teal text-base flex-shrink-0">✓</span>
                      {feat}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-4">
                  <HeroCTA
                    label={plan.cta}
                    variant={plan.popular ? "primary" : "secondary"}
                    className="w-full text-sm font-black uppercase tracking-wider"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section className="bg-brand-muted py-24" id="faq">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
            <span className="inline-block text-[0.8rem] font-bold tracking-[0.1em] uppercase text-brand-teal mb-4">FAQ</span>
            <h2 className="text-4xl font-bold text-brand-dark">Common Questions</h2>
          </div>

          <div className="max-w-3xl mx-auto flex flex-col bg-white p-8 rounded-[calc(var(--radius-brand)*2.5)] border border-brand-border shadow-sm">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER - NEW LIGHT STYLE ────────────────────── */}
      <section className="bg-brand-teal-lt py-28 border-y border-brand-border">
        <div className="container mx-auto px-6 max-w-7xl text-center">
          <span className="inline-block text-[0.85rem] font-black tracking-[0.2em] uppercase text-brand-teal mb-5">Start Winning Today</span>
          <h2 className="text-brand-dark text-4xl md:text-5xl font-black mb-6 tracking-tight">
            Stop Manual RFP Skimming
          </h2>
          <p className="text-brand-sage max-w-xl mx-auto text-lg font-medium leading-relaxed mb-10">
            Upload your first document for free. No credit card required.
            Get your structured action plan in under 60 seconds.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <HeroCTA label="Start Free Trial" variant="primary" className="px-12 py-5 font-black" />
            <Link href="#pricing" className="inline-flex items-center justify-center px-12 py-5 rounded-brand text-base font-black border-2 border-brand-border text-brand-dark hover:border-brand-teal hover:text-brand-teal transition-all bg-white">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER - LIGHT ─────────────────────────────────── */}
      <footer className="bg-white pt-20 pb-10 text-brand-dark border-t border-brand-border">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
            <div className="flex flex-col">
              <div className="text-2xl font-black text-brand-dark tracking-tighter flex items-center gap-2 mb-6">
                📋 <span className="text-brand-teal">BidBrief</span>
              </div>
              <p className="text-brand-sage text-[0.95rem] leading-relaxed max-w-[280px] font-medium">
                The precision RFP summarizer for modern bid teams and independent consultants.
              </p>
            </div>

            <div className="flex flex-col">
              <div className="text-[0.75rem] font-black tracking-[0.2em] uppercase text-brand-dark mb-6">Product</div>
              <ul className="flex flex-col gap-4 list-none">
                <li><Link href="#how-it-works" className="text-[0.95rem] font-medium text-brand-sage hover:text-brand-teal transition-colors">How It Works</Link></li>
                <li><Link href="#features" className="text-[0.95rem] font-medium text-brand-sage hover:text-brand-teal transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="text-[0.95rem] font-medium text-brand-sage hover:text-brand-teal transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div className="flex flex-col">
              <div className="text-[0.75rem] font-black tracking-[0.2em] uppercase text-brand-dark mb-6">Company</div>
              <ul className="flex flex-col gap-4 list-none">
                <li><Link href="/about" className="text-[0.95rem] font-medium text-brand-sage hover:text-brand-teal transition-colors">About</Link></li>
                <li><Link href="/blog" className="text-[0.95rem] font-medium text-brand-sage hover:text-brand-teal transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="text-[0.95rem] font-medium text-brand-sage hover:text-brand-teal transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div className="flex flex-col">
              <div className="text-[0.75rem] font-black tracking-[0.2em] uppercase text-brand-dark mb-6">Legal</div>
              <ul className="flex flex-col gap-4 list-none">
                <li><Link href="/privacy" className="text-[0.95rem] font-medium text-brand-sage hover:text-brand-teal transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-[0.95rem] font-medium text-brand-sage hover:text-brand-teal transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-10 border-t border-brand-border flex flex-wrap items-center justify-between gap-6">
            <p className="text-[0.85rem] text-brand-sage font-bold">© {new Date().getFullYear()} BidBrief. Engineered for Precision.</p>
            <div className="flex gap-8">
              <span className="text-[0.85rem] text-brand-sage font-bold uppercase tracking-widest cursor-pointer hover:text-brand-teal transition-colors">Twitter</span>
              <span className="text-[0.85rem] text-brand-sage font-bold uppercase tracking-widest cursor-pointer hover:text-brand-teal transition-colors">LinkedIn</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
