import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/utilities",
    "/business",
    "/developer",
    "/intelligence",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
  ];

  const lastModified = new Date("2026-11-01T00:00:00.000Z");

  return routes.map((route) => ({
    url: `${SITE_CONFIG.url}${route}`,
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1.0 : route === "/about" ? 0.8 : 0.7,
  }));
}
