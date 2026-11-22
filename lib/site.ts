export interface NavItem {
  label: string;
  href: string;
}

export interface FooterLinkGroup {
  title: string;
  links: NavItem[];
}

export const SITE_CONFIG = {
  name: "BINRO",
  legalName: "BinRo",
  tagline: "Technology for everyday life.",
  description:
    "BinRo builds useful digital products, business software, developer tools and intelligent systems to make technology more accessible, understandable and useful.",
  url: "https://binro.in",
  originRegion: "India",
} as const;

export const PRIMARY_NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Utilities", href: "/utilities" },
  { label: "Business", href: "/business" },
  { label: "Developer", href: "/developer" },
  { label: "Intelligence", href: "/intelligence" },
  { label: "About", href: "/about" },
];

export const HEADER_CONTACT_LINK: NavItem = {
  label: "Contact",
  href: "/contact",
};

export const FOOTER_GROUPS: FooterLinkGroup[] = [
  {
    title: "Divisions",
    links: [
      { label: "Utilities", href: "/utilities" },
      { label: "Business", href: "/business" },
      { label: "Developer", href: "/developer" },
      { label: "Intelligence", href: "/intelligence" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export const COMPANY_PURPOSE = {
  purpose:
    "To make technology accessible, understandable and useful to everyone, while developing new technologies that expand what people and businesses can achieve.",
  vision:
    "To help create a more technologically capable society. A society where people can access useful technology, understand how it works, use it responsibly, solve meaningful problems and create technology themselves.",
  philosophy:
    "Technology should make people more capable, not more dependent on BinRo.",
  mission: [
    "Make existing technology easier to access and use.",
    "Build useful software for individuals and businesses.",
    "Give developers better tools and infrastructure.",
    "Develop intelligent AI-powered products and systems.",
    "Make useful technology accessible in India and eventually worldwide.",
    "Build reliable products that create measurable value.",
  ],
  ambition:
    "Build a globally significant technology company that contributes to technological advancement and helps individuals, businesses and society benefit from technology. India first. Global expansion over time.",
} as const;

export const APPROACH_PRINCIPLES = [
  {
    index: "01",
    title: "Accessibility",
    description:
      "Make useful technology easier for more people to access and use.",
  },
  {
    index: "02",
    title: "Simplicity",
    description:
      "Make complex technology easier to understand and work with.",
  },
  {
    index: "03",
    title: "Advancement",
    description:
      "Continuously develop better products and new technological capabilities.",
  },
] as const;
