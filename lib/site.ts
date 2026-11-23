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
    "BinRo is a technology company building accessible digital tools and dependable software that expand human capability—starting in India with a long-term global vision.",
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

export interface CompanyValue {
  title: string;
  description: string;
}

export const COMPANY_PURPOSE = {
  opening: [
    "We believe technology should expand what people can do.",
    "It should make useful capabilities easier to access, help people solve problems, and create opportunities that were previously out of reach.",
    "That belief is why we are building BinRo.",
  ],
  purpose:
    "To make technology accessible, understandable and useful to everyone, and to create technologies that expand human capabilities, unlock opportunities and help people build a better future.",
  mission:
    "We build useful, dependable and innovative technology that helps people and businesses solve meaningful problems, work more effectively, access new possibilities and achieve things that were previously difficult or inaccessible.",
  vision:
    "A world where every person, regardless of location, background or resources, has the opportunity to understand, access and benefit from technology—and where technology continually expands humanity's ability to learn, create, solve problems and progress.",
  philosophy:
    "Technology should increase human capability—without making ordinary tasks complicated, exploiting attention, sacrificing privacy without reason, or excluding people by cost or technical background.",
  ambitionHeadline: "India is our starting point, not our limit.",
  ambition:
    "We are working to build an Indian-origin technology company that contributes meaningfully to humanity's technological progress through products, engineering, research, innovation and intellectual property—serving people and businesses globally over time.",
  values: [
    {
      title: "Human usefulness",
      description: "Every product should solve a real problem.",
    },
    {
      title: "Accessibility",
      description:
        "Technology should be understandable and usable across different abilities, devices, resources, and levels of technical experience.",
    },
    {
      title: "Reliability",
      description: "Products must work cleanly and dependably as promised.",
    },
    {
      title: "Integrity",
      description:
        "Be honest about functionality, limitations, privacy, pricing, and results.",
    },
    {
      title: "Privacy and security",
      description:
        "Respect people's information and protect their data by design.",
    },
    {
      title: "Innovation",
      description:
        "Do not limit the company to copying existing tools—develop original capabilities over time.",
    },
    {
      title: "Responsibility",
      description:
        "Consider the social, economic, and environmental consequences of the technology we create.",
    },
    {
      title: "Long-term thinking",
      description:
        "Prefer lasting product value and steady improvement over short-term attention.",
    },
  ] satisfies CompanyValue[],
} as const;
