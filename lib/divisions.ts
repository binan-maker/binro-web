export type DivisionId = "utilities" | "business" | "developer" | "intelligence";

export interface ProductCategory {
  title: string;
  description: string;
  group?: string;
  status: "Planned direction";
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
      "Useful digital tools that help people complete everyday tasks more easily, privately and efficiently.",
    statusNote:
      "BinRo Utilities is organised as a growing directory under /utilities. Tools are listed here as they are prepared and published—nothing is marked usable until the working tool exists.",
    accentColor: "#5C7E8F",
    accentSurface: "#F3F6F7",
    categories: [
      {
        title: "Image Tools",
        description:
          "Browser-based utilities for resizing, compressing, and preparing photographs, signatures, and visual assets.",
        group: "Category A",
        status: "Planned direction",
      },
      {
        title: "PDF and Document Tools",
        description:
          "Practical tools for organising, combining, splitting, and preparing everyday documents.",
        group: "Category B",
        status: "Planned direction",
      },
      {
        title: "File Conversion",
        description:
          "Straightforward conversion between common document, image, and data formats.",
        group: "Category C",
        status: "Planned direction",
      },
      {
        title: "Text Utilities",
        description:
          "Formatting, comparison, cleanup, and writing utilities for daily digital work.",
        group: "Category D",
        status: "Planned direction",
      },
      {
        title: "Calculators",
        description:
          "Focused financial, academic, unit, and everyday calculation tools designed for clarity.",
        group: "Category E",
        status: "Planned direction",
      },
      {
        title: "Productivity Tools",
        description:
          "Lightweight utilities that reduce friction in recurring personal, study, and professional tasks.",
        group: "Category F",
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
      "BinRo Business aims to build useful software that helps businesses manage their operations, customers, employees, inventory and workflows.",
    statusNote:
      "We are developing our vision for useful business software. Explore the areas of technology we aim to build.",
    accentColor: "#426579",
    accentSurface: "#EFF4F6",
    categories: [
      {
        title: "Business management software",
        description:
          "Structured operational software to help organisations coordinate daily activities, records, and internal processes with clarity.",
        group: "Core Operations",
        status: "Planned direction",
      },
      {
        title: "Retail and shop management",
        description:
          "Everyday software designed to help local shops and growing retailers manage daily sales, counter operations, and records.",
        group: "Commerce & Sales",
        status: "Planned direction",
      },
      {
        title: "Inventory and stock management",
        description:
          "Clear stock tracking, reorder visibility, and movement logs across locations and suppliers.",
        group: "Core Operations",
        status: "Planned direction",
      },
      {
        title: "Customer relationship management",
        description:
          "Organised customer histories, follow-up tracking, and service records built for small and mid-sized teams.",
        group: "Customers & People",
        status: "Planned direction",
      },
      {
        title: "Billing and financial tools",
        description:
          "Accurate invoicing, payment records, and clear financial summaries tailored to everyday business workflows.",
        group: "Finance & Records",
        status: "Planned direction",
      },
      {
        title: "Employee management",
        description:
          "Attendance, role assignments, shift coordination, and structured team records.",
        group: "Customers & People",
        status: "Planned direction",
      },
      {
        title: "Business reporting and analytics",
        description:
          "Practical reporting that turns everyday operational records into clearer business visibility.",
        group: "Intelligence & Insights",
        status: "Planned direction",
      },
      {
        title: "Workflow automation",
        description:
          "Reliable automation for routine operational steps, reminders, and recurring administrative tasks.",
        group: "Core Operations",
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

export function getDivisionById(id: DivisionId): DivisionInfo {
  const division = DIVISIONS.find((d) => d.id === id);
  if (!division) {
    throw new Error(`Unknown division id: ${id}`);
  }
  return division;
}
