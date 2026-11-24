import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/site";
import { UTILITY_TOOLS } from "@/lib/utilities";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
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

  const availableToolRoutes = UTILITY_TOOLS.filter(
    (tool) => tool.status === "available"
  ).map((tool) => tool.href);

  const allRoutes = [...staticRoutes, ...availableToolRoutes];
  const lastModified = new Date("2026-11-22T00:00:00.000Z");

  return allRoutes.map((route) => ({
    url: `${SITE_CONFIG.url}${route}`,
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority:
      route === ""
        ? 1.0
        : route === "/utilities" ||
            route === "/utilities/image-resizer" ||
            route === "/utilities/pdf-compressor" ||
            route === "/utilities/pdf-merger" ||
            route === "/utilities/pdf-splitter" ||
            route === "/utilities/image-to-pdf" ||
            route === "/utilities/text-to-handwriting"
          ? 0.9
          : route === "/about"
            ? 0.8
            : 0.7,
  }));
}
