/**
 * Seed: bootstraps the minimum data needed to render the public site.
 * Idempotent — re-runs replace existing rows by `key`.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_THEME_TOKENS = {
  background: "0 0% 100%",
  foreground: "222 47% 11%",
  card: "0 0% 100%",
  cardForeground: "222 47% 11%",
  popover: "0 0% 100%",
  popoverForeground: "222 47% 11%",
  primary: "221 83% 53%",
  primaryForeground: "210 40% 98%",
  secondary: "210 40% 96%",
  secondaryForeground: "222 47% 11%",
  muted: "210 40% 96%",
  mutedForeground: "215 16% 47%",
  accent: "210 40% 96%",
  accentForeground: "222 47% 11%",
  destructive: "0 84% 60%",
  destructiveForeground: "210 40% 98%",
  border: "214 32% 91%",
  input: "214 32% 91%",
  ring: "221 83% 53%",
};

const EMERALD_THEME_TOKENS = {
  ...DEFAULT_THEME_TOKENS,
  primary: "160 84% 39%",
  primaryForeground: "0 0% 100%",
  ring: "160 84% 39%",
};

const MIDNIGHT_THEME_TOKENS = {
  background: "222 47% 11%",
  foreground: "210 40% 98%",
  card: "222 47% 13%",
  cardForeground: "210 40% 98%",
  popover: "222 47% 11%",
  popoverForeground: "210 40% 98%",
  primary: "210 40% 98%",
  primaryForeground: "222 47% 11%",
  secondary: "217 33% 18%",
  secondaryForeground: "210 40% 98%",
  muted: "217 33% 18%",
  mutedForeground: "215 20% 65%",
  accent: "217 33% 18%",
  accentForeground: "210 40% 98%",
  destructive: "0 63% 31%",
  destructiveForeground: "210 40% 98%",
  border: "217 33% 18%",
  input: "217 33% 18%",
  ring: "212 27% 84%",
};

async function main() {
  // Themes
  await prisma.siteTheme.upsert({
    where: { key: "default" },
    update: { tokens: DEFAULT_THEME_TOKENS },
    create: {
      key: "default",
      name: "Default Blue",
      isActive: true,
      isDefault: true,
      tokens: DEFAULT_THEME_TOKENS,
      fontHeading: "Inter",
      fontBody: "Inter",
    },
  });
  await prisma.siteTheme.upsert({
    where: { key: "emerald" },
    update: { tokens: EMERALD_THEME_TOKENS },
    create: { key: "emerald", name: "Emerald", tokens: EMERALD_THEME_TOKENS },
  });
  await prisma.siteTheme.upsert({
    where: { key: "midnight" },
    update: { tokens: MIDNIGHT_THEME_TOKENS, isDarkMode: true },
    create: {
      key: "midnight",
      name: "Midnight",
      tokens: MIDNIGHT_THEME_TOKENS,
      isDarkMode: true,
    },
  });

  // Site settings
  const settings = [
    { key: "site.name", group: "branding", type: "string", value: "Educational Consultancy" },
    { key: "site.tagline", group: "branding", type: "string", value: "Your gateway to global education" },
    { key: "site.logoUrl", group: "branding", type: "image", value: "" },
    { key: "contact.email", group: "contact", type: "string", value: "hello@example.com" },
    { key: "contact.phone", group: "contact", type: "string", value: "+977 1 0000000" },
    { key: "contact.address", group: "contact", type: "text", value: "Kathmandu, Nepal" },
    { key: "social.facebook", group: "social", type: "url", value: "" },
    { key: "social.instagram", group: "social", type: "url", value: "" },
    { key: "social.linkedin", group: "social", type: "url", value: "" },
  ];
  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, group: s.group, type: s.type },
      create: s,
    });
  }

  // Nav menus
  await prisma.navMenu.upsert({
    where: { key: "header-main" },
    update: {},
    create: {
      key: "header-main",
      location: "HEADER",
      items: {
        create: [
          { label: "Study Abroad", url: "/study-abroad", order: 1 },
          { label: "Services", url: "/services", order: 2 },
          { label: "Resources", url: "/resources", order: 3 },
          { label: "About", url: "/about", order: 4 },
          { label: "Contact", url: "/contact", order: 5 },
        ],
      },
    },
  });

  // Footer columns
  const cols = [
    {
      key: "footer-company",
      heading: "Company",
      order: 1,
      links: [
        { label: "About Us", url: "/about", order: 1 },
        { label: "Team", url: "/team", order: 2 },
        { label: "Careers", url: "/careers", order: 3 },
      ],
    },
    {
      key: "footer-services",
      heading: "Services",
      order: 2,
      links: [
        { label: "Counseling", url: "/services/counseling", order: 1 },
        { label: "Visa Support", url: "/services/visa", order: 2 },
        { label: "Test Prep", url: "/services/test-prep", order: 3 },
      ],
    },
    {
      key: "footer-legal",
      heading: "Legal",
      order: 3,
      links: [
        { label: "Privacy", url: "/privacy", order: 1 },
        { label: "Terms", url: "/terms", order: 2 },
      ],
    },
  ];
  for (const c of cols) {
    await prisma.footerColumn.upsert({
      where: { key: c.key },
      update: {},
      create: {
        key: c.key,
        heading: c.heading,
        order: c.order,
        links: { create: c.links },
      },
    });
  }

  // Homepage — pre-populated with one section of each spec type so the engine
  // can be eyeballed without admin work. Reorder / hide / edit any of these
  // from /admin/pages/{id}/edit.
  const homepageSections = [
    {
      id: "sec-hero",
      type: "hero",
      order: 0,
      isVisible: true,
      settings: { paddingY: "xl", background: "default", containerWidth: "default" },
      data: {
        eyebrow: "Global education, made simple",
        headline: "Your gateway to studying abroad",
        subheadline:
          "Pick a destination, check eligibility, see your visa odds, and start your application — all in one place.",
        primaryCta: { label: "Check eligibility", url: "/eligibility" },
        secondaryCta: { label: "Talk to a counselor", url: "/contact" },
      },
    },
    {
      id: "sec-stats",
      type: "stats",
      order: 1,
      isVisible: true,
      settings: { paddingY: "lg", background: "muted" },
      data: {
        items: [
          { value: "2,500+", label: "Students placed" },
          { value: "12", label: "Destination countries" },
          { value: "94%", label: "Visa success rate" },
          { value: "15 yrs", label: "Counseling experience" },
        ],
      },
    },
    {
      id: "sec-countries",
      type: "countryGrid",
      order: 2,
      isVisible: true,
      settings: { paddingY: "lg" },
      data: {
        heading: "Choose your destination",
        countries: [
          { name: "United States", href: "/study-abroad/us" },
          { name: "United Kingdom", href: "/study-abroad/uk" },
          { name: "Canada", href: "/study-abroad/ca" },
          { name: "Australia", href: "/study-abroad/au" },
          { name: "Germany", href: "/study-abroad/de" },
          { name: "Japan", href: "/study-abroad/jp" },
        ],
      },
    },
    {
      id: "sec-eligibility",
      type: "eligibility",
      order: 3,
      isVisible: true,
      settings: { paddingY: "lg" },
      data: {
        heading: "Are you eligible?",
        subheading:
          "These are the baseline criteria. Take the 2-minute eligibility check for a personalized assessment.",
        criteria: [
          { label: "Academic record", description: "Minimum 60% in the most recent qualification." },
          { label: "English proficiency", description: "IELTS 6.0 / TOEFL 80 or equivalent waiver." },
          { label: "Financial proof", description: "Documented funding for first year of study." },
          { label: "Statement of purpose", description: "Clear academic and career intent." },
        ],
        ctaLabel: "Run the eligibility check",
        ctaUrl: "/eligibility",
      },
    },
    {
      id: "sec-pathways",
      type: "coursePathways",
      order: 4,
      isVisible: true,
      settings: { paddingY: "lg", background: "muted" },
      data: {
        heading: "Popular pathways",
        subheading:
          "Curated combinations of destination, level, and field with the strongest outcomes.",
        pathways: [
          {
            title: "MS Computer Science",
            level: "PG",
            field: "Computer Science",
            countryName: "United States",
            durationMonths: 24,
            avgTuitionUsd: 45000,
            href: "/pathways/us-ms-cs",
          },
          {
            title: "MBA",
            level: "PG",
            field: "Business",
            countryName: "United Kingdom",
            durationMonths: 12,
            avgTuitionUsd: 38000,
            href: "/pathways/uk-mba",
          },
          {
            title: "BSc Data Science",
            level: "UG",
            field: "Data Science",
            countryName: "Canada",
            durationMonths: 36,
            avgTuitionUsd: 22000,
            href: "/pathways/ca-bsc-ds",
          },
        ],
      },
    },
    {
      id: "sec-visa",
      type: "visaRisk",
      order: 5,
      isVisible: true,
      settings: { paddingY: "lg" },
      data: {
        heading: "What affects your visa odds",
        subheading: "Each factor contributes to your overall risk score. Improve them before applying.",
        factors: [
          {
            label: "Financial documentation",
            severity: "high",
            description: "Funds available for tuition + living, with traceable origin.",
          },
          {
            label: "Academic profile",
            severity: "medium",
            description: "Grades and gap years versus the destination's baseline.",
          },
          {
            label: "Intent clarity",
            severity: "medium",
            description: "How well your SOP answers 'why this program in this country'.",
          },
          {
            label: "English proficiency",
            severity: "low",
            description: "Test scores or proof of waiver eligibility.",
          },
        ],
        ctaLabel: "Get your risk score",
        ctaUrl: "/visa-risk",
      },
    },
    {
      id: "sec-testimonials",
      type: "testimonials",
      order: 6,
      isVisible: true,
      settings: { paddingY: "lg", background: "muted" },
      data: {
        heading: "Students who got there",
        items: [
          {
            name: "Aakash Sharma",
            title: "MS Computer Science, NYU '24",
            quote:
              "The eligibility check told me exactly which programs were in reach. Saved me months of guessing.",
          },
          {
            name: "Priyanka Adhikari",
            title: "BSc Data Science, U of Toronto '25",
            quote:
              "Visa coaching made the difference. They walked me through every document before the interview.",
          },
          {
            name: "Bibek KC",
            title: "MBA, Warwick Business School '24",
            quote:
              "Honest counseling. They told me my first-choice school was a stretch and helped me pick a better fit.",
          },
        ],
      },
    },
    {
      id: "sec-resources",
      type: "resources",
      order: 7,
      isVisible: true,
      settings: { paddingY: "lg" },
      data: {
        heading: "Free resources",
        items: [
          {
            title: "Visa interview checklist",
            description: "Every document and answer prep for your embassy day.",
            type: "CHECKLIST",
            href: "/resources/visa-interview-checklist",
          },
          {
            title: "SOP template — STEM programs",
            description: "Field-tested template with example openings and closings.",
            type: "TEMPLATE",
            href: "/resources/sop-template-stem",
          },
          {
            title: "Budgeting for a 2-year MS",
            description: "Tuition + living + buffer + return-flight math.",
            type: "PDF",
            href: "/resources/ms-budget-guide.pdf",
          },
        ],
      },
    },
    {
      id: "sec-cta",
      type: "cta",
      order: 8,
      isVisible: true,
      settings: { paddingY: "lg" },
      data: {
        heading: "Talk to a counselor — free",
        body: "30-minute consultation. We'll review your profile and tell you what's realistic.",
        primaryCta: { label: "Book a session", url: "/contact" },
        secondaryCta: { label: "Browse pathways", url: "/pathways" },
      },
    },
  ];

  await prisma.page.upsert({
    where: { slug: "home" },
    update: { sections: homepageSections },
    create: {
      slug: "home",
      title: "Home",
      status: "PUBLISHED",
      publishedAt: new Date(),
      isHomepage: true,
      template: "home",
      sections: homepageSections,
      seoTitle: "Educational Consultancy",
      seoDescription: "Your gateway to global education.",
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  //  Programmatic SEO landing pages
  //
  //  Each row targets a specific search query. The slug matches the query so
  //  the URL itself carries keyword signal. The Hero headline is the literal
  //  H1; the FAQ block claims FAQ rich results in SERPs. Admin can edit any
  //  field via /admin/pages.
  // ──────────────────────────────────────────────────────────────────────────

  type SeoLanding = {
    slug: string;
    title: string;
    seoTitle: string;
    seoDescription: string;
    hero: { eyebrow?: string; headline: string; subheadline: string; primaryCta: { label: string; url: string } };
    eligibility?: Array<{ label: string; description: string }>;
    faq: Array<{ q: string; a: string }>;
    ctaHeading: string;
    ctaBody: string;
  };

  const seoLandings: SeoLanding[] = [
    {
      slug: "study-in-australia-from-nepal",
      title: "Study in Australia from Nepal",
      seoTitle: "Study in Australia from Nepal — Universities, Cost & Visa Guide",
      seoDescription:
        "Nepalese student's guide to studying in Australia: top universities, tuition, scholarships, visa requirements and the application timeline.",
      hero: {
        eyebrow: "Destination guide",
        headline: "Study in Australia from Nepal",
        subheadline:
          "Top universities, tuition ranges, scholarships, and the full visa pathway — built for Nepalese students.",
        primaryCta: { label: "Check eligibility", url: "/eligibility" },
      },
      eligibility: [
        { label: "Academic threshold", description: "Minimum 60% in +2 / Bachelor's depending on level." },
        { label: "English proficiency", description: "IELTS 6.0–6.5 overall (most universities)." },
        { label: "Financial proof", description: "Funds covering tuition + AUD 24,505 living for the first year." },
        { label: "GTE statement", description: "Genuine Temporary Entrant statement aligned with your career goals." },
      ],
      faq: [
        {
          q: "How much does it cost to study in Australia from Nepal?",
          a: "Tuition ranges from AUD 20,000 to AUD 45,000 per year. Plan AUD 24,505 for annual living costs — that's the DHA minimum used in visa assessment.",
        },
        {
          q: "Which Australian universities accept Nepalese students?",
          a: "All Group of Eight (Go8) universities accept Nepalese students. Popular choices include University of Melbourne, ANU, Monash, University of Sydney, and UNSW.",
        },
        {
          q: "What IELTS score is required?",
          a: "Most undergraduate programs require 6.0 overall with no band below 5.5. Postgraduate programs typically require 6.5 overall with 6.0 in writing.",
        },
        {
          q: "Can I work while studying?",
          a: "Student visa holders can work up to 48 hours per fortnight during semester and unlimited hours during scheduled breaks.",
        },
      ],
      ctaHeading: "Plan your Australia application with a counselor",
      ctaBody: "Free 30-minute session — university shortlist, deadlines, and visa-document checklist.",
    },
    {
      slug: "study-in-canada-from-nepal",
      title: "Study in Canada from Nepal",
      seoTitle: "Study in Canada from Nepal — Programs, Cost & Study Permit Guide",
      seoDescription:
        "Step-by-step guide for Nepalese students to study in Canada: SDS vs non-SDS routes, GIC, cost of living and post-study work permits.",
      hero: {
        eyebrow: "Destination guide",
        headline: "Study in Canada from Nepal",
        subheadline:
          "SDS-eligible institutions, GIC requirements, and the road from offer letter to study permit — for Nepalese applicants.",
        primaryCta: { label: "Check eligibility", url: "/eligibility" },
      },
      eligibility: [
        { label: "Academic record", description: "Minimum 60–70% in most recent qualification." },
        { label: "English test", description: "IELTS 6.0 with no band below 6.0 for SDS route." },
        { label: "GIC of CAD 20,635", description: "Required for the Student Direct Stream (SDS) processing." },
        { label: "Tuition paid in full", description: "First-year tuition must be paid before applying for SDS." },
      ],
      faq: [
        {
          q: "What is the SDS route from Nepal?",
          a: "Student Direct Stream — a faster study-permit category for Nepalese applicants who meet IELTS 6.0, pay first-year tuition upfront, and buy a GIC of CAD 20,635.",
        },
        {
          q: "Which Canadian colleges are SDS-eligible?",
          a: "All Designated Learning Institutions (DLIs) on the federal list. Popular SDS-friendly choices include Seneca, Centennial, Conestoga, George Brown, and Humber.",
        },
        {
          q: "How long is the post-graduate work permit (PGWP)?",
          a: "Up to 3 years depending on program length. Programs of 8+ months qualify; 2-year programs typically yield the maximum 3-year PGWP.",
        },
        {
          q: "Can I bring my family?",
          a: "Spouses of study-permit holders can apply for an open work permit valid for the duration of the study permit.",
        },
      ],
      ctaHeading: "Map your Canada study permit timeline",
      ctaBody: "We'll review your profile and tell you SDS vs non-SDS, deadlines, and required documents.",
    },
    {
      slug: "australia-student-visa-nepal",
      title: "Australia Student Visa from Nepal",
      seoTitle: "Australia Student Visa (Subclass 500) from Nepal — Complete Guide",
      seoDescription:
        "Subclass 500 student visa application from Nepal: documents, GTE statement, financial evidence, processing times and common refusal reasons.",
      hero: {
        eyebrow: "Visa guide",
        headline: "Australia Student Visa (Subclass 500) from Nepal",
        subheadline:
          "Document checklist, GTE essentials, financial-evidence depth, and timing — for Nepalese applicants.",
        primaryCta: { label: "Get visa risk score", url: "/visa-risk" },
      },
      eligibility: [
        { label: "Confirmation of Enrolment (CoE)", description: "Issued by your Australian institution after offer acceptance." },
        { label: "Genuine Temporary Entrant", description: "Statement showing intent to return after studies." },
        { label: "Health insurance (OSHC)", description: "Mandatory cover for the full visa duration." },
        { label: "Funds evidence", description: "Tuition + AUD 24,505 living + AUD 8,000 travel + family proof if applicable." },
      ],
      faq: [
        {
          q: "How long does the Subclass 500 visa take from Nepal?",
          a: "Median processing is 4–8 weeks; 90th-percentile cases stretch to 10–12 weeks during peak intake. Apply at least 12 weeks before semester start.",
        },
        {
          q: "What is the most common refusal reason?",
          a: "Weak GTE statement. The Department of Home Affairs is looking for a clear, credible reason your study + return plan makes sense — generic templates fail.",
        },
        {
          q: "Can I switch courses after arriving?",
          a: "Yes, but only to a course at the same AQF level or higher. Dropping to a lower-level course requires a new visa application.",
        },
        {
          q: "Is biometrics required from Nepal?",
          a: "Yes — biometrics are collected at VFS Global Kathmandu after application lodgement.",
        },
      ],
      ctaHeading: "Build a visa-ready application",
      ctaBody: "We'll structure your GTE, financials, and documentation to minimize refusal risk.",
    },
    {
      slug: "canada-visa-rejection-nepal",
      title: "Canada Study Permit Rejection — Reasons & Next Steps",
      seoTitle: "Canada Study Permit Rejection from Nepal — Reasons & Reapplication",
      seoDescription:
        "Why Canada study permits get refused for Nepalese applicants and how to reapply with a stronger case — GCMS notes, SOP, financial proof.",
      hero: {
        eyebrow: "Visa support",
        headline: "Canada Study Permit Rejection — Reasons & Reapplication",
        subheadline:
          "Top refusal grounds, how to request GCMS notes, and a reapplication playbook for Nepalese applicants.",
        primaryCta: { label: "Talk to a visa counselor", url: "/contact" },
      },
      faq: [
        {
          q: "What are the most common Canada study permit refusal reasons?",
          a: "Weak ties to home country, unclear study plan, insufficient funds documentation, and program-mismatch with prior education. GCMS notes will list the exact reason.",
        },
        {
          q: "How do I get GCMS notes after refusal?",
          a: "File an ATIP request (Access to Information). Processing is typically 30–60 days. Once received, the officer's notes show the exact decision rationale.",
        },
        {
          q: "How soon can I reapply?",
          a: "Immediately, but only after addressing the specific refusal reasons. Reapplying with the same package usually gets the same refusal.",
        },
        {
          q: "Should I appeal or reapply?",
          a: "For most study-permit refusals, reapplying with a stronger SOP and additional documentation is faster than judicial review. A counselor can help you choose.",
        },
      ],
      ctaHeading: "Reapply with a stronger case",
      ctaBody: "We'll review your GCMS notes, rebuild your SOP, and tighten your financial documentation.",
    },
    {
      slug: "study-gap-australia",
      title: "Study Gap for Australia — How to Explain It",
      seoTitle: "Study Gap Acceptable for Australia Student Visa — Explanation Guide",
      seoDescription:
        "How many years of study gap is acceptable for Australia, and how to explain a gap in your GTE statement and visa application.",
      hero: {
        eyebrow: "Visa guide",
        headline: "Study gap for Australia — what's acceptable and how to explain it",
        subheadline:
          "Documenting work, certifications, and life events to neutralize a study gap in your subclass-500 application.",
        primaryCta: { label: "Get a visa risk review", url: "/visa-risk" },
      },
      faq: [
        {
          q: "How many years of study gap is acceptable for Australia?",
          a: "There is no fixed cap. Up to 2 years with clear justification (work, certifications, family) is routinely approved. Longer gaps need stronger evidence of productive activity.",
        },
        {
          q: "What evidence justifies a study gap?",
          a: "Employment letters with role + salary, tax filings, professional certifications, language coaching, or documented family responsibilities.",
        },
        {
          q: "Does a study gap require a different GTE statement?",
          a: "Yes — the GTE must specifically address the gap, what you did during it, and why you're returning to study now.",
        },
        {
          q: "Will a study gap reduce my visa chances?",
          a: "Not on its own. Refusals tied to gaps almost always have a deeper weakness — usually missing GTE detail or thin financial documentation.",
        },
      ],
      ctaHeading: "Frame your study gap correctly",
      ctaBody: "We'll structure your GTE so the gap reads as productive, not as a red flag.",
    },
  ];

  for (const lp of seoLandings) {
    const sections = [
      {
        id: `${lp.slug}-hero`,
        type: "hero",
        order: 0,
        isVisible: true,
        settings: { paddingY: "xl" },
        data: {
          eyebrow: lp.hero.eyebrow,
          headline: lp.hero.headline,
          subheadline: lp.hero.subheadline,
          primaryCta: lp.hero.primaryCta,
        },
      },
      ...(lp.eligibility
        ? [
            {
              id: `${lp.slug}-eligibility`,
              type: "eligibility",
              order: 1,
              isVisible: true,
              settings: { paddingY: "lg", background: "muted" },
              data: {
                heading: "Eligibility at a glance",
                criteria: lp.eligibility,
              },
            },
          ]
        : []),
      {
        id: `${lp.slug}-faq`,
        type: "faq",
        order: lp.eligibility ? 2 : 1,
        isVisible: true,
        settings: { paddingY: "lg" },
        data: {
          heading: "Frequently asked",
          items: lp.faq,
        },
      },
      {
        id: `${lp.slug}-cta`,
        type: "cta",
        order: lp.eligibility ? 3 : 2,
        isVisible: true,
        settings: { paddingY: "lg" },
        data: {
          heading: lp.ctaHeading,
          body: lp.ctaBody,
          primaryCta: { label: "Book a counseling session", url: "/contact" },
        },
      },
    ];

    await prisma.page.upsert({
      where: { slug: lp.slug },
      update: { sections, seoTitle: lp.seoTitle, seoDescription: lp.seoDescription, title: lp.title },
      create: {
        slug: lp.slug,
        title: lp.title,
        status: "PUBLISHED",
        publishedAt: new Date(),
        template: "seo-landing",
        sections,
        seoTitle: lp.seoTitle,
        seoDescription: lp.seoDescription,
      },
    });
  }

  await seedCountries();
  await seedVisaRiskRules();
  await seedCareerEngine();

  console.log("Seed complete.");
}

// ── Countries: minimal set referenced by career engine + visa-risk rules ──

const DEFAULT_COUNTRIES: {
  code: string;
  slug: string;
  name: string;
  shortIntro: string;
  avgTuitionUsd: number;
  visaSuccessRate: number;
  popularity: number;
  isFeatured: boolean;
}[] = [
  {
    code: "AU",
    slug: "australia",
    name: "Australia",
    shortIntro: "PR-friendly, strong post-study work rights, skills-shortage list.",
    avgTuitionUsd: 28_000,
    visaSuccessRate: 0.87,
    popularity: 95,
    isFeatured: true,
  },
  {
    code: "CA",
    slug: "canada",
    name: "Canada",
    shortIntro: "Express Entry pathway, PGWP up to 3 years, multicultural.",
    avgTuitionUsd: 22_000,
    visaSuccessRate: 0.84,
    popularity: 92,
    isFeatured: true,
  },
  {
    code: "US",
    slug: "united-states",
    name: "United States",
    shortIntro: "World-leading universities, OPT/STEM-OPT post-study work.",
    avgTuitionUsd: 40_000,
    visaSuccessRate: 0.78,
    popularity: 90,
    isFeatured: true,
  },
  {
    code: "GB",
    slug: "united-kingdom",
    name: "United Kingdom",
    shortIntro: "2-year Graduate Visa, 1-year Masters, top research universities.",
    avgTuitionUsd: 26_000,
    visaSuccessRate: 0.86,
    popularity: 88,
    isFeatured: true,
  },
  {
    code: "NZ",
    slug: "new-zealand",
    name: "New Zealand",
    shortIntro: "Post-study work visa, skill-shortage PR pathways.",
    avgTuitionUsd: 22_000,
    visaSuccessRate: 0.83,
    popularity: 70,
    isFeatured: false,
  },
  {
    code: "DE",
    slug: "germany",
    name: "Germany",
    shortIntro: "Low/no tuition at public universities, strong engineering job market.",
    avgTuitionUsd: 1_500,
    visaSuccessRate: 0.9,
    popularity: 80,
    isFeatured: true,
  },
];

async function seedCountries() {
  for (const c of DEFAULT_COUNTRIES) {
    const row = await prisma.country.upsert({
      where: { code: c.code },
      update: {
        slug: c.slug,
        avgTuitionUsd: c.avgTuitionUsd,
        visaSuccessRate: c.visaSuccessRate,
        popularity: c.popularity,
        isFeatured: c.isFeatured,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      create: {
        code: c.code,
        slug: c.slug,
        avgTuitionUsd: c.avgTuitionUsd,
        visaSuccessRate: c.visaSuccessRate,
        popularity: c.popularity,
        isFeatured: c.isFeatured,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
    await prisma.countryTranslation.upsert({
      where: { countryId_locale: { countryId: row.id, locale: "EN" } },
      update: { name: c.name, shortIntro: c.shortIntro },
      create: { countryId: row.id, locale: "EN", name: c.name, shortIntro: c.shortIntro },
    });
  }
}

// ── Visa risk engine: default rules ────────────────────────────────────────

// Predicate DSL re-declared here to avoid importing server-only code into the
// seed runner. Shape matches src/server/visa-risk/dsl.ts.
type SeedPredicate =
  | { kind: "leaf"; field: string; op: string; value?: unknown }
  | { kind: "all"; predicates: SeedPredicate[] }
  | { kind: "any"; predicates: SeedPredicate[] }
  | { kind: "not"; predicate: SeedPredicate };

type SeedRule = {
  key: string;
  countryCode?: string | null;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  score: number;
  priority: number;
  condition: SeedPredicate;
  label: string;
  message: string;
  guidance: string;
};

const DEFAULT_RULES: SeedRule[] = [
  // Academic
  {
    key: "academic.gpa-very-low",
    riskLevel: "HIGH",
    score: 22,
    priority: 80,
    condition: { kind: "leaf", field: "gpa4", op: "lt", value: 2.5 },
    label: "Very low GPA",
    message: "Your GPA is below 2.5 (4.0 scale), which most universities consider below admission threshold.",
    guidance: "Consider a foundation/pathway program or pursue a re-test where available.",
  },
  {
    key: "academic.gpa-low",
    riskLevel: "MEDIUM",
    score: 10,
    priority: 70,
    condition: {
      kind: "all",
      predicates: [
        { kind: "leaf", field: "gpa4", op: "gte", value: 2.5 },
        { kind: "leaf", field: "gpa4", op: "lt", value: 3.0 },
      ],
    },
    label: "Borderline GPA",
    message: "GPA between 2.5 and 3.0 is admissible but reduces program choice.",
    guidance: "Strengthen SOP and LORs; target programs that emphasize practical experience.",
  },

  // English
  {
    key: "english.missing",
    riskLevel: "MEDIUM",
    score: 14,
    priority: 60,
    condition: { kind: "leaf", field: "englishBand", op: "notExists" },
    label: "No English score on file",
    message: "Visa applications require a recognized English proficiency result.",
    guidance: "Book IELTS / TOEFL / PTE / Duolingo well before the intake deadline.",
  },
  {
    key: "english.weak-band",
    riskLevel: "HIGH",
    score: 20,
    priority: 65,
    condition: { kind: "leaf", field: "englishBand", op: "lt", value: 6.0 },
    label: "English below band 6.0",
    message: "Most student visas require IELTS 6.0 overall (or equivalent).",
    guidance: "Aim for IELTS 6.5+ to broaden program and destination options.",
  },

  // Study gap
  {
    key: "study_gap.long",
    riskLevel: "MEDIUM",
    score: 12,
    priority: 50,
    condition: {
      kind: "all",
      predicates: [
        { kind: "leaf", field: "studyGapYears", op: "gte", value: 3 },
        { kind: "leaf", field: "studyGapYears", op: "lt", value: 5 },
      ],
    },
    label: "Multi-year study gap",
    message: "A study gap of 3–4 years draws additional scrutiny.",
    guidance: "Document employment, professional certifications, or family obligations for the gap period.",
  },
  {
    key: "study_gap.very-long",
    riskLevel: "HIGH",
    score: 22,
    priority: 55,
    condition: { kind: "leaf", field: "studyGapYears", op: "gte", value: 5 },
    label: "Extended study gap",
    message: "Gaps of 5+ years are a common refusal trigger.",
    guidance: "Plan a strong SOP narrative tying the gap to the chosen program; consider stepping-stone qualifications.",
  },

  // Financial
  {
    key: "financial.low-funds",
    riskLevel: "HIGH",
    score: 26,
    priority: 90,
    condition: {
      kind: "all",
      predicates: [
        { kind: "leaf", field: "showFundsUsd", op: "gt", value: 0 },
        { kind: "leaf", field: "showFundsUsd", op: "lt", value: 15000 },
      ],
    },
    label: "Insufficient show funds",
    message: "Show funds below USD 15,000 typically fail the 1-year tuition+living test.",
    guidance: "Add sponsor affidavits, fixed deposits, or an education loan sanction letter to cross the threshold.",
  },
  {
    key: "financial.tight-funds",
    riskLevel: "MEDIUM",
    score: 12,
    priority: 80,
    condition: {
      kind: "all",
      predicates: [
        { kind: "leaf", field: "showFundsUsd", op: "gte", value: 15000 },
        { kind: "leaf", field: "showFundsUsd", op: "lt", value: 25000 },
      ],
    },
    label: "Show funds near threshold",
    message: "Funds meet the minimum but leave little margin.",
    guidance: "A 15–20% buffer above the destination's stated requirement materially reduces refusal risk.",
  },
  {
    key: "financial.loan-without-itr",
    riskLevel: "MEDIUM",
    score: 10,
    priority: 70,
    condition: {
      kind: "all",
      predicates: [
        { kind: "leaf", field: "fundingSource", op: "eq", value: "loan" },
        { kind: "leaf", field: "hasIncomeTaxReturn", op: "eq", value: false },
      ],
    },
    label: "Loan-only without sponsor ITRs",
    message: "Loan funding without supporting tax returns is a recurring credibility issue.",
    guidance: "Submit 2–3 years of sponsor ITRs alongside the loan sanction.",
  },

  // Visa history
  {
    key: "visa_history.refused-once",
    riskLevel: "HIGH",
    score: 25,
    priority: 95,
    condition: { kind: "leaf", field: "previousVisaRefusals", op: "gte", value: 1 },
    label: "Prior visa refusal",
    message: "A previous refusal must be addressed in the SOP and re-application addendum.",
    guidance: "Prepare a written response to the specific 214(b)/credibility ground from the prior refusal.",
  },
  {
    key: "visa_history.refused-multiple",
    riskLevel: "CRITICAL",
    score: 45,
    priority: 100,
    condition: { kind: "leaf", field: "previousVisaRefusals", op: "gte", value: 2 },
    label: "Multiple visa refusals",
    message: "Two or more refusals significantly raise re-application difficulty.",
    guidance: "Speak with a senior counsellor about destination alternatives and a re-application strategy.",
  },

  // Country-specific tightening (illustrative — admin tunes per destination)
  {
    key: "country.us-ielts-floor",
    countryCode: "US",
    riskLevel: "MEDIUM",
    score: 8,
    priority: 40,
    condition: { kind: "leaf", field: "englishBand", op: "lt", value: 6.5 },
    label: "US: English below 6.5",
    message: "Top US universities typically require IELTS 6.5+ (TOEFL 79+).",
    guidance: "Re-take the test targeting an overall 6.5 with no band below 6.0.",
  },
  {
    key: "country.gb-funds-floor",
    countryCode: "GB",
    riskLevel: "HIGH",
    score: 18,
    priority: 90,
    condition: {
      kind: "all",
      predicates: [
        { kind: "leaf", field: "showFundsUsd", op: "gt", value: 0 },
        { kind: "leaf", field: "showFundsUsd", op: "lt", value: 18000 },
      ],
    },
    label: "UK: maintenance funds below threshold",
    message: "UK Student Route requires holding maintenance funds for 28 consecutive days.",
    guidance: "Top up the account 6+ weeks before submission and avoid large dips during the 28-day window.",
  },
  {
    key: "country.ca-gap-tight",
    countryCode: "CA",
    riskLevel: "MEDIUM",
    score: 10,
    priority: 50,
    condition: { kind: "leaf", field: "studyGapYears", op: "gte", value: 3 },
    label: "Canada: study gap > 3 years",
    message: "Canadian IRCC commonly requests gap justification for breaks beyond 3 years.",
    guidance: "Attach employment letters and certifications covering the gap window.",
  },
];

async function seedVisaRiskRules() {
  for (const r of DEFAULT_RULES) {
    let countryId: string | null = null;
    if (r.countryCode) {
      const c = await prisma.country.findUnique({
        where: { code: r.countryCode },
        select: { id: true },
      });
      if (!c) {
        // Skip country-specific rules until the Country row exists — leaving
        // them as global rules would apply the country threshold to every
        // applicant, which is the wrong behavior.
        console.log(`Skipping visa-risk rule ${r.key} — Country ${r.countryCode} not seeded yet.`);
        continue;
      }
      countryId = c.id;
    }

    const rule = await prisma.visaRiskRule.upsert({
      where: { key: r.key },
      update: {
        countryId,
        riskLevel: r.riskLevel,
        score: r.score,
        priority: r.priority,
        isActive: true,
        condition: r.condition as unknown as object,
        deletedAt: null,
      },
      create: {
        key: r.key,
        countryId,
        riskLevel: r.riskLevel,
        score: r.score,
        priority: r.priority,
        isActive: true,
        condition: r.condition as unknown as object,
      },
    });

    await prisma.visaRiskRuleTranslation.upsert({
      where: { ruleId_locale: { ruleId: rule.id, locale: "EN" } },
      update: { label: r.label, message: r.message, guidance: r.guidance },
      create: {
        ruleId: rule.id,
        locale: "EN",
        label: r.label,
        message: r.message,
        guidance: r.guidance,
      },
    });
  }

  // Default weights + buckets (admin can edit later).
  await prisma.siteSetting.upsert({
    where: { key: "visa-risk.weights" },
    update: {},
    create: {
      key: "visa-risk.weights",
      group: "engine",
      type: "json",
      isPublic: false,
      value: {
        academic: 1.0,
        english: 1.0,
        study_gap: 0.9,
        financial: 1.2,
        visa_history: 1.4,
        country: 1.0,
        other: 0.8,
      },
    },
  });
  await prisma.siteSetting.upsert({
    where: { key: "visa-risk.buckets" },
    update: {},
    create: {
      key: "visa-risk.buckets",
      group: "engine",
      type: "json",
      isPublic: false,
      value: { medium: 20, high: 45, critical: 75 },
    },
  });
}

// ── Career engine: courses, mappings, PR pathways, salary, demand ────────

type SeedCourse = {
  slug: string;
  code: string;
  level: "CERTIFICATE" | "DIPLOMA" | "ADVANCED_DIPLOMA" | "BACHELORS" | "MASTERS" | "PHD";
  field: string;
  discipline: string;
  durationMonths: number;
  isFeatured: boolean;
  popularity: number;
  name: string;
  shortIntro: string;
  description: string;
  outcomes: { occupation: string; title: string; blurb: string; fitScore: number; order: number }[];
};

const DEFAULT_COURSES: SeedCourse[] = [
  {
    slug: "master-of-computer-science",
    code: "MSC-CS",
    level: "MASTERS",
    field: "Computer Science",
    discipline: "STEM",
    durationMonths: 24,
    isFeatured: true,
    popularity: 100,
    name: "Master of Computer Science",
    shortIntro: "Advanced computing with electives in AI, security, and systems.",
    description:
      "A two-year postgraduate degree covering algorithms, distributed systems, AI/ML, and software engineering. Strong industry placement and PR-friendly across major destinations.",
    outcomes: [
      { occupation: "Software Engineer", title: "Software Engineer", blurb: "Design, build, and ship production software.", fitScore: 92, order: 0 },
      { occupation: "Data Engineer", title: "Data Engineer", blurb: "Move data through pipelines and warehouses.", fitScore: 80, order: 1 },
      { occupation: "Machine Learning Engineer", title: "Machine Learning Engineer", blurb: "Ship ML systems to production.", fitScore: 78, order: 2 },
    ],
  },
  {
    slug: "master-of-nursing",
    code: "MSC-NURSE",
    level: "MASTERS",
    field: "Nursing",
    discipline: "Health",
    durationMonths: 18,
    isFeatured: true,
    popularity: 88,
    name: "Master of Nursing",
    shortIntro: "Postgraduate nursing with specialisation tracks.",
    description:
      "Specialist nursing program preparing graduates for high-demand registered-nurse roles. On most countries' skills-shortage lists.",
    outcomes: [
      { occupation: "Registered Nurse", title: "Registered Nurse", blurb: "Frontline clinical care across settings.", fitScore: 95, order: 0 },
      { occupation: "Nurse Practitioner", title: "Nurse Practitioner", blurb: "Advanced-practice nursing with prescribing rights.", fitScore: 80, order: 1 },
    ],
  },
  {
    slug: "bachelor-of-business",
    code: "BBA",
    level: "BACHELORS",
    field: "Business Administration",
    discipline: "Business",
    durationMonths: 36,
    isFeatured: false,
    popularity: 70,
    name: "Bachelor of Business",
    shortIntro: "Foundational business with marketing, finance, and management tracks.",
    description:
      "Three-year undergraduate degree covering core business functions. Common entry point into management trainee, marketing, and operations roles.",
    outcomes: [
      { occupation: "Marketing Coordinator", title: "Marketing Coordinator", blurb: "Plan and execute marketing campaigns.", fitScore: 72, order: 0 },
      { occupation: "Business Analyst", title: "Business Analyst", blurb: "Translate business needs into requirements.", fitScore: 70, order: 1 },
    ],
  },
  {
    slug: "diploma-of-cookery",
    code: "DIP-COOK",
    level: "DIPLOMA",
    field: "Hospitality",
    discipline: "Hospitality",
    durationMonths: 18,
    isFeatured: false,
    popularity: 60,
    name: "Diploma of Commercial Cookery",
    shortIntro: "Hands-on chef training mapped to ANZSCO 351311.",
    description:
      "Vocational diploma producing qualified cooks/chefs. Often paves a fast PR pathway in Australia via regional sponsorship.",
    outcomes: [
      { occupation: "Chef", title: "Chef", blurb: "Run a kitchen or station in commercial venues.", fitScore: 90, order: 0 },
      { occupation: "Cook", title: "Cook", blurb: "Prepare meals in commercial kitchens.", fitScore: 85, order: 1 },
    ],
  },
  {
    slug: "master-of-data-science",
    code: "MSC-DS",
    level: "MASTERS",
    field: "Data Science",
    discipline: "STEM",
    durationMonths: 24,
    isFeatured: true,
    popularity: 95,
    name: "Master of Data Science",
    shortIntro: "Applied stats, ML, and data engineering.",
    description:
      "Applied data-science postgraduate degree blending statistics, machine learning, and data engineering. High-demand outcomes across destinations.",
    outcomes: [
      { occupation: "Data Scientist", title: "Data Scientist", blurb: "Discover insights from data.", fitScore: 95, order: 0 },
      { occupation: "Data Analyst", title: "Data Analyst", blurb: "Report on business metrics and trends.", fitScore: 80, order: 1 },
      { occupation: "Machine Learning Engineer", title: "Machine Learning Engineer", blurb: "Build production ML systems.", fitScore: 78, order: 2 },
    ],
  },
];

type SeedMapping = {
  courseSlug: string;
  countryCode: string;
  avgTuitionUsd: number;
  livingCostUsd: number;
  intakeMonths: string;
  prEligible: boolean;
  graduateVisaMonths: number;
  topUniversities: { name: string; rank?: number; city?: string }[];
  isFeatured?: boolean;
  prPathwaySlugs?: string[];
};

const DEFAULT_MAPPINGS: SeedMapping[] = [
  // CS
  { courseSlug: "master-of-computer-science", countryCode: "AU", avgTuitionUsd: 32_000, livingCostUsd: 15_000, intakeMonths: "Feb,Jul", prEligible: true, graduateVisaMonths: 36, topUniversities: [{ name: "University of Melbourne", rank: 13, city: "Melbourne" }, { name: "UNSW Sydney", rank: 19, city: "Sydney" }], isFeatured: true, prPathwaySlugs: ["au-485-graduate", "au-189-skilled-independent"] },
  { courseSlug: "master-of-computer-science", countryCode: "CA", avgTuitionUsd: 25_000, livingCostUsd: 13_000, intakeMonths: "Jan,Sep", prEligible: true, graduateVisaMonths: 36, topUniversities: [{ name: "University of Toronto", rank: 21, city: "Toronto" }], prPathwaySlugs: ["ca-pgwp", "ca-express-entry"] },
  { courseSlug: "master-of-computer-science", countryCode: "US", avgTuitionUsd: 50_000, livingCostUsd: 18_000, intakeMonths: "Aug", prEligible: false, graduateVisaMonths: 36, topUniversities: [{ name: "Carnegie Mellon", rank: 1, city: "Pittsburgh" }, { name: "Stanford University", rank: 2, city: "Stanford" }], prPathwaySlugs: ["us-opt-stem"] },
  { courseSlug: "master-of-computer-science", countryCode: "GB", avgTuitionUsd: 30_000, livingCostUsd: 14_000, intakeMonths: "Sep", prEligible: false, graduateVisaMonths: 24, topUniversities: [{ name: "Imperial College London", rank: 6, city: "London" }], prPathwaySlugs: ["gb-graduate-route"] },
  { courseSlug: "master-of-computer-science", countryCode: "DE", avgTuitionUsd: 1_500, livingCostUsd: 11_000, intakeMonths: "Apr,Oct", prEligible: true, graduateVisaMonths: 18, topUniversities: [{ name: "TU Munich", rank: 4, city: "Munich" }], prPathwaySlugs: ["de-eu-blue-card"] },

  // Nursing
  { courseSlug: "master-of-nursing", countryCode: "AU", avgTuitionUsd: 30_000, livingCostUsd: 15_000, intakeMonths: "Feb,Jul", prEligible: true, graduateVisaMonths: 36, topUniversities: [{ name: "University of Sydney", rank: 13, city: "Sydney" }], isFeatured: true, prPathwaySlugs: ["au-485-graduate", "au-491-regional", "au-189-skilled-independent"] },
  { courseSlug: "master-of-nursing", countryCode: "CA", avgTuitionUsd: 22_000, livingCostUsd: 13_000, intakeMonths: "Jan,Sep", prEligible: true, graduateVisaMonths: 36, topUniversities: [{ name: "University of British Columbia", rank: 38, city: "Vancouver" }], prPathwaySlugs: ["ca-pgwp", "ca-express-entry"] },
  { courseSlug: "master-of-nursing", countryCode: "GB", avgTuitionUsd: 24_000, livingCostUsd: 14_000, intakeMonths: "Sep", prEligible: true, graduateVisaMonths: 24, topUniversities: [{ name: "King's College London", rank: 40, city: "London" }], prPathwaySlugs: ["gb-graduate-route", "gb-health-care-worker"] },

  // Business
  { courseSlug: "bachelor-of-business", countryCode: "AU", avgTuitionUsd: 28_000, livingCostUsd: 15_000, intakeMonths: "Feb,Jul", prEligible: false, graduateVisaMonths: 24, topUniversities: [{ name: "Monash University", rank: 37, city: "Melbourne" }], prPathwaySlugs: ["au-485-graduate"] },
  { courseSlug: "bachelor-of-business", countryCode: "GB", avgTuitionUsd: 22_000, livingCostUsd: 14_000, intakeMonths: "Sep", prEligible: false, graduateVisaMonths: 24, topUniversities: [{ name: "Warwick Business School", rank: 64, city: "Coventry" }], prPathwaySlugs: ["gb-graduate-route"] },

  // Cookery
  { courseSlug: "diploma-of-cookery", countryCode: "AU", avgTuitionUsd: 14_000, livingCostUsd: 15_000, intakeMonths: "Feb,May,Aug,Nov", prEligible: true, graduateVisaMonths: 24, topUniversities: [{ name: "William Angliss Institute", city: "Melbourne" }], isFeatured: true, prPathwaySlugs: ["au-485-graduate", "au-491-regional"] },

  // Data Science
  { courseSlug: "master-of-data-science", countryCode: "AU", avgTuitionUsd: 33_000, livingCostUsd: 15_000, intakeMonths: "Feb,Jul", prEligible: true, graduateVisaMonths: 36, topUniversities: [{ name: "Australian National University", rank: 30, city: "Canberra" }], isFeatured: true, prPathwaySlugs: ["au-485-graduate", "au-189-skilled-independent"] },
  { courseSlug: "master-of-data-science", countryCode: "CA", avgTuitionUsd: 26_000, livingCostUsd: 13_000, intakeMonths: "Jan,Sep", prEligible: true, graduateVisaMonths: 36, topUniversities: [{ name: "University of Waterloo", rank: 112, city: "Waterloo" }], prPathwaySlugs: ["ca-pgwp", "ca-express-entry"] },
  { courseSlug: "master-of-data-science", countryCode: "US", avgTuitionUsd: 52_000, livingCostUsd: 18_000, intakeMonths: "Aug", prEligible: false, graduateVisaMonths: 36, topUniversities: [{ name: "MIT", rank: 1, city: "Cambridge" }], prPathwaySlugs: ["us-opt-stem"] },
];

type SeedPathway = {
  slug: string;
  countryCode: string;
  type:
    | "POST_STUDY_WORK"
    | "GRADUATE_VISA"
    | "SKILLED_INDEPENDENT"
    | "EMPLOYER_SPONSORED"
    | "REGIONAL"
    | "EXPRESS_ENTRY"
    | "INVESTOR"
    | "FAMILY"
    | "OTHER";
  difficulty: "EASY" | "MODERATE" | "HARD" | "VERY_HARD";
  minYearsToPr?: number;
  pointsRequired?: number;
  ageLimit?: number;
  englishMinBand?: number;
  priority: number;
  name: string;
  summary: string;
  steps: { order: number; durationMonths: number; title: string; detail: string }[];
};

const DEFAULT_PATHWAYS: SeedPathway[] = [
  {
    slug: "au-485-graduate",
    countryCode: "AU",
    type: "POST_STUDY_WORK",
    difficulty: "EASY",
    minYearsToPr: 3,
    englishMinBand: 6.0,
    priority: 80,
    name: "Subclass 485 — Temporary Graduate Visa",
    summary: "Live and work in Australia for 2–4 years after graduation.",
    steps: [
      { order: 0, durationMonths: 24, title: "Complete eligible CRICOS course", detail: "Two academic years (92 weeks) full-time." },
      { order: 1, durationMonths: 0, title: "Apply for 485 within 6 months", detail: "Submit before student visa expiry plus 6 months." },
      { order: 2, durationMonths: 24, title: "Work in nominated occupation", detail: "Build skilled experience toward 189/190/491 PR." },
    ],
  },
  {
    slug: "au-189-skilled-independent",
    countryCode: "AU",
    type: "SKILLED_INDEPENDENT",
    difficulty: "HARD",
    minYearsToPr: 4,
    pointsRequired: 90,
    ageLimit: 45,
    englishMinBand: 7.0,
    priority: 60,
    name: "Subclass 189 — Skilled Independent",
    summary: "Points-tested PR without sponsorship.",
    steps: [
      { order: 0, durationMonths: 6, title: "Skills assessment", detail: "Assessed by your occupation's authority (e.g. ACS for IT)." },
      { order: 1, durationMonths: 6, title: "Submit Expression of Interest", detail: "Through SkillSelect; receive invitation when points clear cutoff." },
      { order: 2, durationMonths: 9, title: "Lodge 189 visa application", detail: "PR granted typically within 9–14 months." },
    ],
  },
  {
    slug: "au-491-regional",
    countryCode: "AU",
    type: "REGIONAL",
    difficulty: "MODERATE",
    minYearsToPr: 5,
    pointsRequired: 65,
    ageLimit: 45,
    englishMinBand: 6.0,
    priority: 70,
    name: "Subclass 491 — Skilled Work Regional",
    summary: "5-year provisional regional visa with PR via 191 after 3 years.",
    steps: [
      { order: 0, durationMonths: 6, title: "State/regional nomination", detail: "Apply through a regional sponsoring state or regional employer." },
      { order: 1, durationMonths: 36, title: "Live + work in regional area", detail: "3 years of regional residency + work to unlock 191 PR." },
      { order: 2, durationMonths: 6, title: "Apply for 191 PR", detail: "Permanent residence on completion of regional commitment." },
    ],
  },
  {
    slug: "ca-pgwp",
    countryCode: "CA",
    type: "POST_STUDY_WORK",
    difficulty: "EASY",
    minYearsToPr: 2,
    englishMinBand: 6.0,
    priority: 80,
    name: "Post-Graduation Work Permit (PGWP)",
    summary: "Open work permit valid up to 3 years after qualifying study.",
    steps: [
      { order: 0, durationMonths: 24, title: "Complete DLI program", detail: "Designated Learning Institution program, 8+ months." },
      { order: 1, durationMonths: 0, title: "Apply within 180 days of grad", detail: "PGWP grants up to 3 years of open work rights." },
    ],
  },
  {
    slug: "ca-express-entry",
    countryCode: "CA",
    type: "EXPRESS_ENTRY",
    difficulty: "MODERATE",
    minYearsToPr: 3,
    pointsRequired: 470,
    ageLimit: 45,
    englishMinBand: 6.5,
    priority: 65,
    name: "Express Entry — Canadian Experience Class",
    summary: "Federal PR via CRS points for skilled workers with Canadian experience.",
    steps: [
      { order: 0, durationMonths: 12, title: "Gain 1 year skilled Canadian work", detail: "TEER 0/1/2/3 occupation, full-time." },
      { order: 1, durationMonths: 6, title: "Enter Express Entry pool", detail: "Receive ITA when CRS clears latest cutoff." },
      { order: 2, durationMonths: 6, title: "Lodge PR application", detail: "PR decision typically within 6 months." },
    ],
  },
  {
    slug: "us-opt-stem",
    countryCode: "US",
    type: "POST_STUDY_WORK",
    difficulty: "MODERATE",
    minYearsToPr: 8,
    englishMinBand: 6.5,
    priority: 70,
    name: "OPT + STEM Extension",
    summary: "Up to 3 years post-study work for STEM degree holders.",
    steps: [
      { order: 0, durationMonths: 12, title: "12-month OPT", detail: "Apply 90 days before graduation." },
      { order: 1, durationMonths: 24, title: "STEM 24-month extension", detail: "Employer must be E-Verified." },
      { order: 2, durationMonths: 0, title: "Move to H-1B/EB-2/EB-3", detail: "Sponsorship-dependent; long PR queue for high-volume countries." },
    ],
  },
  {
    slug: "gb-graduate-route",
    countryCode: "GB",
    type: "GRADUATE_VISA",
    difficulty: "EASY",
    minYearsToPr: 5,
    englishMinBand: 6.0,
    priority: 75,
    name: "UK Graduate Route",
    summary: "Unrestricted 2-year (3-year PhD) post-study work.",
    steps: [
      { order: 0, durationMonths: 12, title: "Complete eligible UK degree", detail: "Bachelors/Masters at a sponsoring institution." },
      { order: 1, durationMonths: 24, title: "Apply for Graduate Route", detail: "Switch to Skilled Worker before expiry to keep PR clock ticking." },
    ],
  },
  {
    slug: "gb-health-care-worker",
    countryCode: "GB",
    type: "EMPLOYER_SPONSORED",
    difficulty: "MODERATE",
    minYearsToPr: 5,
    englishMinBand: 6.5,
    priority: 70,
    name: "Health and Care Worker Visa",
    summary: "Discounted skilled-worker visa for NHS and care roles.",
    steps: [
      { order: 0, durationMonths: 3, title: "Secure NHS/care sponsorship", detail: "Job offer in an eligible health code." },
      { order: 1, durationMonths: 60, title: "5 years skilled work", detail: "Settle as ILR after 5 continuous years." },
    ],
  },
  {
    slug: "de-eu-blue-card",
    countryCode: "DE",
    type: "EMPLOYER_SPONSORED",
    difficulty: "MODERATE",
    minYearsToPr: 3,
    englishMinBand: 5.5,
    priority: 60,
    name: "EU Blue Card (Germany)",
    summary: "Skilled-worker route to settlement in 33 months (21 with B1 German).",
    steps: [
      { order: 0, durationMonths: 3, title: "Salary threshold job offer", detail: "Meet annual gross salary threshold (~€45k, less for shortage roles)." },
      { order: 1, durationMonths: 21, title: "21–33 months continuous work", detail: "21 months if B1 German; 33 months otherwise." },
    ],
  },
];

type SeedSalary = {
  courseSlug?: string;
  countryCode: string;
  occupation?: string;
  level: "ENTRY" | "MID" | "SENIOR" | "LEAD";
  min: number;
  mid: number;
  max: number;
  year: number;
  source: string;
};

const DEFAULT_SALARIES: SeedSalary[] = [
  // CS in AU/CA/US/GB/DE
  { courseSlug: "master-of-computer-science", countryCode: "AU", level: "MID", min: 75_000, mid: 95_000, max: 130_000, year: 2026, source: "internal" },
  { courseSlug: "master-of-computer-science", countryCode: "CA", level: "MID", min: 70_000, mid: 90_000, max: 120_000, year: 2026, source: "internal" },
  { courseSlug: "master-of-computer-science", countryCode: "US", level: "MID", min: 95_000, mid: 130_000, max: 180_000, year: 2026, source: "BLS" },
  { courseSlug: "master-of-computer-science", countryCode: "GB", level: "MID", min: 50_000, mid: 70_000, max: 100_000, year: 2026, source: "ONS" },
  { courseSlug: "master-of-computer-science", countryCode: "DE", level: "MID", min: 55_000, mid: 70_000, max: 95_000, year: 2026, source: "Destatis" },
  // Nursing
  { courseSlug: "master-of-nursing", countryCode: "AU", level: "MID", min: 65_000, mid: 80_000, max: 110_000, year: 2026, source: "ABS" },
  { courseSlug: "master-of-nursing", countryCode: "CA", level: "MID", min: 60_000, mid: 78_000, max: 105_000, year: 2026, source: "internal" },
  { courseSlug: "master-of-nursing", countryCode: "GB", level: "MID", min: 35_000, mid: 45_000, max: 65_000, year: 2026, source: "ONS" },
  // Business
  { courseSlug: "bachelor-of-business", countryCode: "AU", level: "MID", min: 55_000, mid: 70_000, max: 95_000, year: 2026, source: "internal" },
  { courseSlug: "bachelor-of-business", countryCode: "GB", level: "MID", min: 35_000, mid: 50_000, max: 75_000, year: 2026, source: "ONS" },
  // Cookery
  { courseSlug: "diploma-of-cookery", countryCode: "AU", level: "MID", min: 55_000, mid: 65_000, max: 85_000, year: 2026, source: "ABS" },
  // Data Science
  { courseSlug: "master-of-data-science", countryCode: "AU", level: "MID", min: 85_000, mid: 110_000, max: 150_000, year: 2026, source: "internal" },
  { courseSlug: "master-of-data-science", countryCode: "CA", level: "MID", min: 80_000, mid: 100_000, max: 135_000, year: 2026, source: "internal" },
  { courseSlug: "master-of-data-science", countryCode: "US", level: "MID", min: 110_000, mid: 145_000, max: 200_000, year: 2026, source: "BLS" },
];

type SeedDemand = {
  courseSlug?: string;
  countryCode: string;
  occupation?: string;
  demandLevel: "VERY_LOW" | "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";
  shortageListed: boolean;
  vacancies12mo?: number;
  growthPercent?: number;
  year: number;
  source: string;
};

const DEFAULT_DEMAND: SeedDemand[] = [
  // CS — high demand across destinations
  { courseSlug: "master-of-computer-science", countryCode: "AU", demandLevel: "HIGH", shortageListed: true, vacancies12mo: 18_000, growthPercent: 8, year: 2026, source: "Jobs and Skills AU" },
  { courseSlug: "master-of-computer-science", countryCode: "CA", demandLevel: "HIGH", shortageListed: true, vacancies12mo: 24_000, growthPercent: 9, year: 2026, source: "Stats Canada" },
  { courseSlug: "master-of-computer-science", countryCode: "US", demandLevel: "VERY_HIGH", shortageListed: false, vacancies12mo: 180_000, growthPercent: 11, year: 2026, source: "BLS" },
  { courseSlug: "master-of-computer-science", countryCode: "GB", demandLevel: "HIGH", shortageListed: false, vacancies12mo: 35_000, growthPercent: 7, year: 2026, source: "ONS" },
  { courseSlug: "master-of-computer-science", countryCode: "DE", demandLevel: "VERY_HIGH", shortageListed: true, vacancies12mo: 80_000, growthPercent: 12, year: 2026, source: "Destatis" },
  // Nursing
  { courseSlug: "master-of-nursing", countryCode: "AU", demandLevel: "VERY_HIGH", shortageListed: true, vacancies12mo: 30_000, growthPercent: 14, year: 2026, source: "Jobs and Skills AU" },
  { courseSlug: "master-of-nursing", countryCode: "CA", demandLevel: "VERY_HIGH", shortageListed: true, vacancies12mo: 45_000, growthPercent: 13, year: 2026, source: "Stats Canada" },
  { courseSlug: "master-of-nursing", countryCode: "GB", demandLevel: "HIGH", shortageListed: true, vacancies12mo: 40_000, growthPercent: 6, year: 2026, source: "NHS" },
  // Business
  { courseSlug: "bachelor-of-business", countryCode: "AU", demandLevel: "MODERATE", shortageListed: false, vacancies12mo: 6_000, growthPercent: 3, year: 2026, source: "internal" },
  { courseSlug: "bachelor-of-business", countryCode: "GB", demandLevel: "MODERATE", shortageListed: false, vacancies12mo: 8_000, growthPercent: 2, year: 2026, source: "internal" },
  // Cookery
  { courseSlug: "diploma-of-cookery", countryCode: "AU", demandLevel: "HIGH", shortageListed: true, vacancies12mo: 12_000, growthPercent: 6, year: 2026, source: "Jobs and Skills AU" },
  // Data Science
  { courseSlug: "master-of-data-science", countryCode: "AU", demandLevel: "VERY_HIGH", shortageListed: true, vacancies12mo: 9_000, growthPercent: 16, year: 2026, source: "Jobs and Skills AU" },
  { courseSlug: "master-of-data-science", countryCode: "CA", demandLevel: "HIGH", shortageListed: true, vacancies12mo: 14_000, growthPercent: 12, year: 2026, source: "Stats Canada" },
  { courseSlug: "master-of-data-science", countryCode: "US", demandLevel: "VERY_HIGH", shortageListed: false, vacancies12mo: 120_000, growthPercent: 15, year: 2026, source: "BLS" },
];

type SeedTrend = {
  courseSlug?: string;
  countryCode?: string;
  occupation?: string;
  year: number;
  direction: "GROWING" | "STABLE" | "DECLINING";
  metric: string;
  value: number;
};

const DEFAULT_TRENDS: SeedTrend[] = [
  { courseSlug: "master-of-computer-science", countryCode: "AU", year: 2025, direction: "GROWING", metric: "vacancy_yoy_pct", value: 7.2 },
  { courseSlug: "master-of-computer-science", countryCode: "AU", year: 2026, direction: "GROWING", metric: "vacancy_yoy_pct", value: 8.1 },
  { courseSlug: "master-of-data-science", countryCode: "AU", year: 2026, direction: "GROWING", metric: "salary_yoy_pct", value: 5.4 },
  { courseSlug: "master-of-nursing", countryCode: "GB", year: 2026, direction: "STABLE", metric: "salary_yoy_pct", value: 1.1 },
  { courseSlug: "bachelor-of-business", countryCode: "AU", year: 2026, direction: "DECLINING", metric: "vacancy_yoy_pct", value: -2.4 },
];

async function seedCareerEngine() {
  // 1. Courses + translations + outcomes
  const courseIdBySlug = new Map<string, string>();
  for (const c of DEFAULT_COURSES) {
    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {
        code: c.code,
        level: c.level,
        field: c.field,
        discipline: c.discipline,
        durationMonths: c.durationMonths,
        isFeatured: c.isFeatured,
        popularity: c.popularity,
        status: "PUBLISHED",
        publishedAt: new Date(),
        deletedAt: null,
      },
      create: {
        slug: c.slug,
        code: c.code,
        level: c.level,
        field: c.field,
        discipline: c.discipline,
        durationMonths: c.durationMonths,
        isFeatured: c.isFeatured,
        popularity: c.popularity,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
    courseIdBySlug.set(c.slug, course.id);

    await prisma.courseTranslation.upsert({
      where: { courseId_locale: { courseId: course.id, locale: "EN" } },
      update: { name: c.name, shortIntro: c.shortIntro, description: c.description },
      create: {
        courseId: course.id,
        locale: "EN",
        name: c.name,
        shortIntro: c.shortIntro,
        description: c.description,
      },
    });

    for (const o of c.outcomes) {
      const existing = await prisma.courseCareerOutcome.findFirst({
        where: { courseId: course.id, occupation: o.occupation },
      });
      const outcome = existing
        ? await prisma.courseCareerOutcome.update({
            where: { id: existing.id },
            data: { fitScore: o.fitScore, order: o.order },
          })
        : await prisma.courseCareerOutcome.create({
            data: { courseId: course.id, occupation: o.occupation, fitScore: o.fitScore, order: o.order },
          });
      await prisma.courseCareerOutcomeTranslation.upsert({
        where: { outcomeId_locale: { outcomeId: outcome.id, locale: "EN" } },
        update: { title: o.title, blurb: o.blurb },
        create: { outcomeId: outcome.id, locale: "EN", title: o.title, blurb: o.blurb },
      });
    }
  }

  // 2. PR pathways + steps
  const pathwayIdBySlug = new Map<string, string>();
  const countryIdByCode = new Map<string, string>();
  for (const c of DEFAULT_COUNTRIES) {
    const row = await prisma.country.findUnique({ where: { code: c.code }, select: { id: true } });
    if (row) countryIdByCode.set(c.code, row.id);
  }

  for (const p of DEFAULT_PATHWAYS) {
    const countryId = countryIdByCode.get(p.countryCode);
    if (!countryId) {
      console.log(`Skipping pathway ${p.slug} — country ${p.countryCode} not seeded.`);
      continue;
    }
    const pathway = await prisma.prPathway.upsert({
      where: { slug: p.slug },
      update: {
        countryId,
        type: p.type,
        difficulty: p.difficulty,
        minYearsToPr: p.minYearsToPr ?? null,
        pointsRequired: p.pointsRequired ?? null,
        ageLimit: p.ageLimit ?? null,
        englishMinBand: p.englishMinBand ?? null,
        isActive: true,
        priority: p.priority,
        deletedAt: null,
      },
      create: {
        slug: p.slug,
        countryId,
        type: p.type,
        difficulty: p.difficulty,
        minYearsToPr: p.minYearsToPr ?? null,
        pointsRequired: p.pointsRequired ?? null,
        ageLimit: p.ageLimit ?? null,
        englishMinBand: p.englishMinBand ?? null,
        priority: p.priority,
      },
    });
    pathwayIdBySlug.set(p.slug, pathway.id);
    await prisma.prPathwayTranslation.upsert({
      where: { pathwayId_locale: { pathwayId: pathway.id, locale: "EN" } },
      update: { name: p.name, summary: p.summary },
      create: { pathwayId: pathway.id, locale: "EN", name: p.name, summary: p.summary },
    });
    // Steps — replace-all for simplicity.
    await prisma.prPathwayStep.deleteMany({ where: { pathwayId: pathway.id } });
    for (const s of p.steps) {
      const step = await prisma.prPathwayStep.create({
        data: { pathwayId: pathway.id, order: s.order, durationMonths: s.durationMonths },
      });
      await prisma.prPathwayStepTranslation.create({
        data: { stepId: step.id, locale: "EN", title: s.title, detail: s.detail },
      });
    }
  }

  // 3. Course-Country mappings (+ PR pathway links)
  for (const m of DEFAULT_MAPPINGS) {
    const courseId = courseIdBySlug.get(m.courseSlug);
    const countryId = countryIdByCode.get(m.countryCode);
    if (!courseId || !countryId) continue;
    const mapping = await prisma.courseCountryMapping.upsert({
      where: { courseId_countryId: { courseId, countryId } },
      update: {
        avgTuitionUsd: m.avgTuitionUsd,
        livingCostUsd: m.livingCostUsd,
        intakeMonths: m.intakeMonths,
        prEligible: m.prEligible,
        graduateVisaMonths: m.graduateVisaMonths,
        topUniversities: m.topUniversities,
        isFeatured: m.isFeatured ?? false,
      },
      create: {
        courseId,
        countryId,
        avgTuitionUsd: m.avgTuitionUsd,
        livingCostUsd: m.livingCostUsd,
        intakeMonths: m.intakeMonths,
        prEligible: m.prEligible,
        graduateVisaMonths: m.graduateVisaMonths,
        topUniversities: m.topUniversities,
        isFeatured: m.isFeatured ?? false,
      },
    });
    await prisma.prPathwayOnCourseMapping.deleteMany({ where: { mappingId: mapping.id } });
    if (m.prPathwaySlugs?.length) {
      for (const [i, slug] of m.prPathwaySlugs.entries()) {
        const pathwayId = pathwayIdBySlug.get(slug);
        if (!pathwayId) continue;
        await prisma.prPathwayOnCourseMapping.create({
          data: {
            mappingId: mapping.id,
            pathwayId,
            priority: m.prPathwaySlugs.length - i,
          },
        });
      }
    }
  }

  // 4. Salary estimates
  for (const s of DEFAULT_SALARIES) {
    const countryId = countryIdByCode.get(s.countryCode);
    if (!countryId) continue;
    const courseId = s.courseSlug ? courseIdBySlug.get(s.courseSlug) ?? null : null;
    const existing = await prisma.salaryEstimate.findFirst({
      where: {
        courseId,
        countryId,
        occupation: s.occupation ?? null,
        level: s.level,
        effectiveYear: s.year,
      },
    });
    const data = {
      courseId,
      countryId,
      occupation: s.occupation ?? null,
      level: s.level,
      period: "YEARLY" as const,
      currency: "USD",
      minAmount: s.min,
      midAmount: s.mid,
      maxAmount: s.max,
      effectiveYear: s.year,
      source: s.source,
    };
    if (existing) {
      await prisma.salaryEstimate.update({ where: { id: existing.id }, data });
    } else {
      await prisma.salaryEstimate.create({ data });
    }
  }

  // 5. Demand signals
  for (const d of DEFAULT_DEMAND) {
    const countryId = countryIdByCode.get(d.countryCode);
    if (!countryId) continue;
    const courseId = d.courseSlug ? courseIdBySlug.get(d.courseSlug) ?? null : null;
    const existing = await prisma.demandSignal.findFirst({
      where: {
        courseId,
        countryId,
        occupation: d.occupation ?? null,
        effectiveYear: d.year,
      },
    });
    const data = {
      courseId,
      countryId,
      occupation: d.occupation ?? null,
      demandLevel: d.demandLevel,
      shortageListed: d.shortageListed,
      vacancies12mo: d.vacancies12mo ?? null,
      growthPercent: d.growthPercent ?? null,
      effectiveYear: d.year,
      source: d.source,
    };
    if (existing) {
      await prisma.demandSignal.update({ where: { id: existing.id }, data });
    } else {
      await prisma.demandSignal.create({ data });
    }
  }

  // 6. Career trends — append-only; clear+reseed so the snapshot stays canonical.
  await prisma.careerTrend.deleteMany({});
  for (const t of DEFAULT_TRENDS) {
    const countryId = t.countryCode ? countryIdByCode.get(t.countryCode) ?? null : null;
    const courseId = t.courseSlug ? courseIdBySlug.get(t.courseSlug) ?? null : null;
    await prisma.careerTrend.create({
      data: {
        courseId,
        countryId,
        occupation: t.occupation ?? null,
        year: t.year,
        direction: t.direction,
        metric: t.metric,
        value: t.value,
      },
    });
  }

  // 7. Default weights + score buckets in SiteSetting (matches engine defaults).
  await prisma.siteSetting.upsert({
    where: { key: "career.weights" },
    update: {},
    create: {
      key: "career.weights",
      group: "career",
      type: "json",
      isPublic: false,
      value: {
        interest: 0.25,
        country: 0.1,
        demand: 0.2,
        pr: 0.15,
        salary: 0.15,
        budget: 0.15,
      },
    },
  });
  await prisma.siteSetting.upsert({
    where: { key: "career.buckets" },
    update: {},
    create: {
      key: "career.buckets",
      group: "career",
      type: "json",
      isPublic: false,
      value: { good: 50, strong: 70, excellent: 85 },
    },
  });
}

async function seedAnalytics() {
  // Singleton config — created lazily on first read elsewhere, but we want
  // the IP-hash salt set deterministically on first deploy.
  await prisma.analyticsConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      ipHashSalt: randomSalt(),
    },
  });

  // Built-in funnels — the four flows the platform always supports. Admins
  // can disable but should not delete; the seed re-creates them on every run.
  const funnels = [
    {
      slug: "eligibility",
      name: "Eligibility check",
      description: "Eligibility form → submit → lead created → won",
      steps: [
        { name: "Viewed eligibility form", eventType: "FORM_VIEW" },
        { name: "Started form", eventType: "FORM_START" },
        { name: "Submitted form", eventType: "FORM_SUCCESS" },
        { name: "Lead won", eventType: "LEAD_WON" },
      ],
    },
    {
      slug: "visa-risk",
      name: "Visa risk assessment",
      description: "Visa-risk form viewed → completed → lead → consultation booked",
      steps: [
        { name: "Viewed visa-risk form", eventType: "FORM_VIEW" },
        { name: "Completed risk check", eventType: "VISA_RISK_CHECKED" },
        { name: "Lead created", eventType: "LEAD_CREATED" },
        { name: "Consultation booked", eventType: "CONSULTATION_BOOKED" },
      ],
    },
    {
      slug: "consultation",
      name: "Free consultation",
      description: "Booking flow from page view to confirmed consultation",
      steps: [
        { name: "Viewed booking form", eventType: "FORM_VIEW" },
        { name: "Submitted booking", eventType: "FORM_SUCCESS" },
        { name: "Lead won", eventType: "LEAD_WON" },
      ],
    },
    {
      slug: "resource-download",
      name: "Gated resource",
      description: "Resource gate → download → lead → enrolled",
      steps: [
        { name: "Viewed resource gate", eventType: "FORM_VIEW" },
        { name: "Downloaded resource", eventType: "RESOURCE_DOWNLOAD" },
        { name: "Lead created", eventType: "LEAD_CREATED" },
        { name: "Lead won", eventType: "LEAD_WON" },
      ],
    },
  ];

  for (const f of funnels) {
    await prisma.funnelDefinition.upsert({
      where: { slug: f.slug },
      update: { name: f.name, description: f.description, steps: f.steps },
      create: {
        slug: f.slug,
        name: f.name,
        description: f.description,
        steps: f.steps,
        windowHours: 168,
        isActive: true,
      },
    });
  }
}

function randomSalt(): string {
  // 16 bytes of randomness, hex-encoded — deterministic on re-seed via the
  // upsert's `update: {}` (the salt is only set on create).
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("hex");
}

main()
  .then(seedAnalytics)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
