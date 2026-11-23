export type DivisionId = "utilities" | "business" | "developer" | "intelligence";

export interface ProductCategory {
  title: string;
  description: string;
  group?: string;
}

export type DivisionStatus = "active" | "planned";

export interface DivisionInfo {
  id: DivisionId;
  index: string;
  name: string;
  shortName: string;
  href: string;
  status: DivisionStatus;
  statusLabel: string;
  tagline: string;
  summary: string;
  overview: string;
  accentColor: string;
  accentSurface: string;
  categories: ProductCategory[];
}

export const DIVISIONS: DivisionInfo[] = [
  {
    id: "utilities",
    index: "01",
    name: "BinRo Utilities",
    shortName: "Utilities",
    href: "/utilities",
    status: "active",
    statusLabel: "Active now",
    tagline: "Practical technology tools for everyday digital tasks.",
    summary:
      "Make useful digital capabilities easier to access and use every day.",
    overview:
      "Fast, browser-local tools built to help people work with images and PDFs cleanly without accounts or unnecessary complexity.",
    accentColor: "#5C7E8F",
    accentSurface: "#F3F6F7",
    categories: [
      {
        title: "Image Tools",
        description:
          "Resize, compress, and prepare photographs, signatures, and visual assets directly in the browser.",
        group: "Category A",
      },
      {
        title: "PDF and Document Tools",
        description:
          "Organise, combine, split, and prepare everyday documents cleanly.",
        group: "Category B",
      },
      {
        title: "File Conversion",
        description:
          "Direct conversion between common image, document, and data formats.",
        group: "Category C",
      },
      {
        title: "Text Utilities",
        description:
          "Formatting, comparison, and cleanup tools for daily writing and editing.",
        group: "Category D",
      },
      {
        title: "Calculators",
        description:
          "Clear financial, academic, and unit calculations without clutter.",
        group: "Category E",
      },
      {
        title: "Productivity Tools",
        description:
          "Lightweight utilities that remove friction from routine tasks.",
        group: "Category F",
      },
    ],
  },
  {
    id: "business",
    index: "02",
    name: "BinRo Business",
    shortName: "Business",
    href: "/business",
    status: "planned",
    statusLabel: "In planning",
    tagline: "Software and technology that help businesses operate more effectively.",
    summary:
      "Help organizations improve daily operations and access dependable business tools.",
    overview:
      "Planned operational software for managing everyday workflows, inventory, billing, customers, and teams with clarity.",
    accentColor: "#426579",
    accentSurface: "#F3F6F7",
    categories: [
      {
        title: "Business management software",
        description:
          "Coordinate daily operations, records, and internal processes in one structured system.",
        group: "Operations",
      },
      {
        title: "Retail and shop management",
        description:
          "Counter sales, billing, and daily store records built for local shops and growing retailers.",
        group: "Commerce",
      },
      {
        title: "Inventory and stock management",
        description:
          "Track stock levels, reorder thresholds, and supplier movements with clear visibility.",
        group: "Operations",
      },
      {
        title: "Customer relationship management",
        description:
          "Organised customer histories, follow-ups, and service records for small and mid-sized teams.",
        group: "Customers",
      },
      {
        title: "Billing and financial tools",
        description:
          "Straightforward invoicing, payment tracking, and clean financial summaries.",
        group: "Finance",
      },
      {
        title: "Employee management",
        description:
          "Attendance, role coordination, shifts, and structured team records.",
        group: "People",
      },
      {
        title: "Business reporting and analytics",
        description:
          "Operational reporting that turns daily activity into clear, readable summaries.",
        group: "Insights",
      },
      {
        title: "Workflow automation",
        description:
          "Dependable automation for recurring administrative steps and reminders.",
        group: "Operations",
      },
    ],
  },
  {
    id: "developer",
    index: "03",
    name: "BinRo Developer",
    shortName: "Developer",
    href: "/developer",
    status: "planned",
    statusLabel: "In planning",
    tagline: "Tools, APIs, infrastructure and technology for developers.",
    summary:
      "Help developers create, build, deploy, and innovate more effectively.",
    overview:
      "Planned developer utilities, typed SDKs, APIs, and service foundations designed to keep software engineering direct and reliable.",
    accentColor: "#426579",
    accentSurface: "#F3F6F7",
    categories: [
      {
        title: "Developer tools",
        description:
          "Focused utilities for payload inspection, formatting, and schema checks.",
        group: "Build",
      },
      {
        title: "APIs",
        description:
          "Predictable application interfaces with consistent conventions and clear contracts.",
        group: "Platform",
      },
      {
        title: "SDKs",
        description:
          "Typed client libraries designed for straightforward integration across web and server stacks.",
        group: "Platform",
      },
      {
        title: "Authentication services",
        description:
          "Identity, session, and access foundations for applications built on the platform.",
        group: "Platform",
      },
      {
        title: "Webhooks and integrations",
        description:
          "Reliable event delivery connecting business systems and external services.",
        group: "Platform",
      },
      {
        title: "API documentation",
        description:
          "Readable reference guides and working examples written for fast comprehension.",
        group: "Build",
      },
      {
        title: "Testing and debugging tools",
        description:
          "Request inspection and verification diagnostics to catch integration issues early.",
        group: "Build",
      },
      {
        title: "Infrastructure, monitoring and analytics",
        description:
          "Health tracking, usage telemetry, and dependable hosting for production workloads.",
        group: "Operate",
      },
    ],
  },
  {
    id: "intelligence",
    index: "04",
    name: "BinRo Intelligence",
    shortName: "Intelligence",
    href: "/intelligence",
    status: "planned",
    statusLabel: "In planning",
    tagline:
      "Artificial intelligence, intelligent systems, agents and automation.",
    summary:
      "Develop responsible intelligent systems that help people understand, create, and automate meaningful work.",
    overview:
      "Planned applied AI products and workflow automation built with clear human oversight to assist with real work.",
    accentColor: "#426579",
    accentSurface: "#F3F6F7",
    categories: [
      {
        title: "AI chat assistants",
        description:
          "Clear conversational interfaces for everyday guidance, support, and problem solving.",
        group: "Interfaces",
      },
      {
        title: "Voice AI",
        description:
          "Natural spoken workflows that make software accessible across languages and contexts.",
        group: "Interfaces",
      },
      {
        title: "AI calling and conversations",
        description:
          "Structured voice handling for routine enquiries, scheduling, and coordination.",
        group: "Interfaces",
      },
      {
        title: "AI agents",
        description:
          "Task-oriented systems engineered to carry out multi-step workflows with clear human control.",
        group: "Automation",
      },
      {
        title: "Business automation",
        description:
          "Intelligent routing, classification, and administrative assistance inside business software.",
        group: "Automation",
      },
      {
        title: "Document intelligence",
        description:
          "Structured extraction, summarisation, and organisation for everyday documents.",
        group: "Knowledge",
      },
      {
        title: "Knowledge assistants",
        description:
          "Context-aware search and synthesis across internal procedures and records.",
        group: "Knowledge",
      },
      {
        title: "AI analytics and infrastructure",
        description:
          "Evaluation tooling and orchestration connecting reliable models to real tasks.",
        group: "Knowledge",
      },
    ],
  },
];

export function getDivisionById(id: DivisionId): DivisionInfo {
  const division = DIVISIONS.find((d) => d.id === id);
  if (!division) {
    throw new Error(`Unknown division id: ${id}`);
  }
  return division;
}
