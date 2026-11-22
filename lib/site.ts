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
    "Useful technology for people, professionals and businesses across everyday utilities, business software, developer tools and applied intelligence.",
  url: "https://binro.in",
  originRegion: "India",
} as const;

export const PRIMARY_NAV: NavItem[] = [
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
    "Make technology accessible, understandable and useful to everyone, while developing new technology that expands what people and businesses can achieve.",
  vision:
    "Help build a more technologically capable society where useful tools are easy to reach and understand.",
  philosophy:
    "Technology should make people more capable, not more dependent on BinRo.",
  mission: [
    "Make existing technology easier to access and use.",
    "Build practical software for individuals and businesses.",
    "Equip developers with dependable tools and infrastructure.",
    "Develop applied AI products that assist with real work.",
    "Start in India and expand globally over time.",
  ],
  ambition: "India first. Global over time.",
} as const;
