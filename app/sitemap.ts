import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { projects } from "@/data/projects";

/** Üretim alan adı bilinmiyorsa sitemap boş döner; sahte alan adı uydurulmaz. */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!site.siteUrl) return [];

  const now = new Date();
  const routes = ["", "/work", "/about"].map((r) => ({
    url: `${site.siteUrl}${r}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: r === "" ? 1 : 0.7,
  }));

  return [
    ...routes,
    ...projects.map((p) => ({
      url: `${site.siteUrl}/work/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
