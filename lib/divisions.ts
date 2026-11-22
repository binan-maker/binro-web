export type DivisionId = "utilities" | "business" | "developer" | "intelligence";

export interface ProductCategory {
  title: string;
  description: string;
  group?: string;
  status: "Active direction" | "Planned direction";
}

export interface DivisionInfo {
  id: DivisionId;
  index: string;
  name: string;
  shortName: string;
  href: string;
  tagline: string;
  summary: string;
  overview: string;
  statusNote: string;
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
    tagline: "Everyday technology, made simple.",
    summary: "Digital tools that help people complete everyday tasks.",
    overview:
      "BinRo Utilities is focused on helping individuals, students, and professionals complete everyday digital tasks quickly, reliably, and without unnecessary complexity.",
    statusNote:
      "This collection is currently being planned and developed. The categories below outline future product directions rather than live tools.",
    accentColor: "#5C7E8F",
    accentSurface: "#F3F6F7",
    categories: [
      {
        title: "PDF and document tools",
        description:
          "Straightforward utilities for reading, organising, merging, splitting, and preparing everyday documents.",
        group: "Documents & Files",
        status: "Planned direction",
      },
      {
        title: "Image editing and compression",
        description:
          "Lightweight tools to resize, crop, optimise, and prepare visual files without heavy desktop software.",
        group: "Visual & Media",
        status: "Planned direction",
      },
      {
        title: "File conversion",
        description:
          "Clean format conversion workflows across common document, image, and structured data types.",
        group: "Documents & Files",
        status: "Planned direction",
      },
      {
        title: "Text utilities",
        description:
          "Practical formatting, comparison, cleanup, and writing support utilities for daily digital work.",
        group: "Everyday Productivity",
        status: "Planned direction",
      },
      {
        title: "Calculators",
        description:
          "Focused financial, academic, unit, and operational calculators designed for clarity and speed.",
        group: "Everyday Productivity",
        status: "Planned direction",
      },
      {
        title: "Productivity tools",
        description:
          "Focused browser-friendly utilities that reduce friction in recurring personal and professional tasks.",
        group: "Everyday Productivity",
        status: "Planned direction",
      },
      {
        title: "Student and professional utilities",
        description:
          "Accessible study, reference, and everyday preparation tools built for clarity across desktop and mobile.",
        group: "Everyday Productivity",
        status: "Planned direction",
      },
    ],
  },
  {
    id: "business",
    index: "02",
    name: "BinRo Business",
    shortName: "Business",
    href: "/business",
    tagline: "Software that helps businesses operate better.",
    summary:
      "Applications that help businesses manage and improve their operations.",
    overview:
      "BinRo Business builds operational software that helps organisations manage daily workflows, properties, customers, staff, inventory, and finances with clarity.",
    statusNote:
      "BinRo Business is actively developing its PG and Hostel Operations Management application while planning broader industry-specific software over time.",
    accentColor: "#426579",
    accentSurface: "#EFF4F6",
    categories: [
      {
        title: "Accommodation and PG management",
        description:
          "Purpose-built operational software for PG and hostel operators covering properties, rooms, beds, tenants, and rent records.",
        group: "Active product direction",
        status: "Active direction",
      },
      {
        title: "Rental property management",
        description:
          "Structured tracking for leases, occupancy schedules, maintenance records, and recurring collections.",
        group: "Future planned directions",
        status: "Planned direction",
      },
      {
        title: "Retail and shop management",
        description:
          "Everyday point-of-operations software to help local shops and growing retailers manage daily sales and records.",
        group: "Future planned directions",
        status: "Planned direction",
      },
      {
        title: "Inventory and stock management",
        description:
          "Clear stock tracking, reorder visibility, and movement logs across locations and suppliers.",
        group: "Future planned directions",
        status: "Planned direction",
      },
      {
        title: "Customer management (CRM)",
        description:
          "Organised customer histories, follow-up tracking, and service records built for small and mid-sized teams.",
        group: "Future planned directions",
        status: "Planned direction",
      },
      {
        title: "Billing and finance",
        description:
          "Accurate invoicing, payment records, and clear financial summaries tailored to everyday business workflows.",
        group: "Future planned directions",
        status: "Planned direction",
      },
      {
        title: "Employee and staff management",
        description:
          "Attendance, role assignments, shift coordination, and structured team records.",
        group: "Future planned directions",
        status: "Planned direction",
      },
      {
        title: "Restaurant management",
        description:
          "Order flow, table coordination, kitchen tracking, and daily operational reporting for food businesses.",
        group: "Future planned directions",
        status: "Planned direction",
      },
      {
        title: "Business analytics and automation",
        description:
          "Practical reporting and workflow automation that turn operational records into clearer decisions.",
        group: "Future planned directions",
        status: "Planned direction",
      },
    ],
  },
  {
    id: "developer",
    index: "03",
    name: "BinRo Developer",
    shortName: "Developer",
    href: "/developer",
    tagline: "Tools and infrastructure for people who build technology.",
    summary:
      "Developer tools, APIs and services that make building software easier.",
    overview:
      "BinRo Developer aims to give builders reliable primitives, clean interfaces, and practical infrastructure so teams can create, test, integrate, and operate software with less overhead.",
    statusNote:
      "These capabilities represent future areas of development for the BinRo developer ecosystem and are not yet publicly launched.",
    accentColor: "#3D5C6E",
    accentSurface: "#F0F4F6",
    categories: [
      {
        title: "Developer tools",
        description:
          "Focused utilities for inspection, formatting, schema validation, and everyday engineering workflows.",
        group: "Build & Test",
        status: "Planned direction",
      },
      {
        title: "APIs",
        description:
          "Predictable, well-structured application interfaces exposing core capabilities for third-party software.",
        group: "Core Platform",
        status: "Planned direction",
      },
      {
        title: "SDKs",
        description:
          "Typed client libraries designed to make integration straightforward across web and server environments.",
        group: "Core Platform",
        status: "Planned direction",
      },
      {
        title: "Authentication services",
        description:
          "Reliable identity, session, and access foundations for applications built on the platform.",
        group: "Core Platform",
        status: "Planned direction",
      },
      {
        title: "Webhooks and integrations",
        description:
          "Event delivery and structured integration bridges connecting business systems and external services.",
        group: "Core Platform",
        status: "Planned direction",
      },
      {
        title: "API documentation",
        description:
          "Clear, human-readable references, guides, and integration examples designed for fast comprehension.",
        group: "Build & Test",
        status: "Planned direction",
      },
      {
        title: "Testing and debugging tools",
        description:
          "Request inspection, payload verification, and diagnostics to help developers validate integrations early.",
        group: "Build & Test",
        status: "Planned direction",
      },
      {
        title: "Infrastructure, monitoring and analytics",
        description:
          "Operational visibility, health tracking, and dependable service foundations for production workloads.",
        group: "Operate",
        status: "Planned direction",
      },
    ],
  },
  {
    id: "intelligence",
    index: "04",
    name: "BinRo Intelligence",
    shortName: "Intelligence",
    href: "/intelligence",
    tagline: "Intelligent technology that helps people achieve more.",
    summary: "AI assistants, agents and intelligent systems.",
    overview:
      "BinRo Intelligence explores practical AI-powered products, assistants, and automated systems that help individuals and businesses work with greater clarity and capability. We focus on applied intelligence—building upon proven foundation models and services rather than claiming proprietary foundational model research.",
    statusNote:
      "The areas outlined below represent BinRo's planned direction for applied intelligence products and systems, and are not yet released as public products.",
    accentColor: "#4D6F80",
    accentSurface: "#F2F5F7",
    categories: [
      {
        title: "AI chat assistants",
        description:
          "Helpful conversational interfaces tailored for clear everyday guidance, customer support, and structured problem solving.",
        group: "Conversational Systems",
        status: "Planned direction",
      },
      {
        title: "Voice AI",
        description:
          "Natural spoken interfaces that make digital workflows more accessible across languages and contexts.",
        group: "Conversational Systems",
        status: "Planned direction",
      },
      {
        title: "AI calling and conversations",
        description:
          "Structured voice workflows for routine enquiries, scheduling, and operational coordination.",
        group: "Conversational Systems",
        status: "Planned direction",
      },
      {
        title: "AI agents",
        description:
          "Task-oriented systems designed to carry out multi-step digital workflows under clear human oversight.",
        group: "Applied Automation",
        status: "Planned direction",
      },
      {
        title: "Business automation",
        description:
          "Intelligent routing, classification, and repetitive task assistance integrated into business software.",
        group: "Applied Automation",
        status: "Planned direction",
      },
      {
        title: "Document intelligence",
        description:
          "Structured extraction, summarisation, and organisation for everyday business and personal documents.",
        group: "Knowledge & Analysis",
        status: "Planned direction",
      },
      {
        title: "Knowledge assistants",
        description:
          "Context-aware assistants that help teams navigate internal documentation, procedures, and operational records.",
        group: "Knowledge & Analysis",
        status: "Planned direction",
      },
      {
        title: "AI analytics and infrastructure",
        description:
          "Applied intelligence pipelines, evaluation tooling, and orchestration layers connecting existing models to real workflows.",
        group: "Knowledge & Analysis",
        status: "Planned direction",
      },
    ],
  },
];

export const FEATURED_BUSINESS_PRODUCT = {
  division: "BinRo Business",
  title: "PG and Hostel Operations Management",
  subtitle: "Existing product direction",
  description:
    "BinRo Business is being developed to help PG and hostel accommodation operators manage properties, rooms, beds, tenants, rent records, and day-to-day operations from one structured system.",
  ctaLabel: "Visit BinRo Business",
  ctaHref: "https://business.binro.in",
  capabilities: [
    {
      label: "Properties & Rooms",
      detail: "Organise buildings, floors, rooms, and individual bed capacity.",
    },
    {
      label: "Tenant Records",
      detail: "Maintain clear resident profiles, stays, and occupancy status.",
    },
    {
      label: "Rent & Operations",
      detail: "Track rent schedules, payment records, and daily property tasks.",
    },
  ],
} as const;

export function getDivisionById(id: DivisionId): DivisionInfo {
  const division = DIVISIONS.find((d) => d.id === id);
  if (!division) {
    throw new Error(`Unknown division id: ${id}`);
  }
  return division;
}
