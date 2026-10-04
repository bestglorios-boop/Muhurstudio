import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { projects } from "@/data/projects";
import { legalDocs } from "@/data/legal";

/**
 * Üretim alan adı bilinmiyorsa sitemap boş döner; sahte alan adı uydurulmaz.
 *
 * Yasal sayfalar da listelenir: KVKK m.12 uyarınca aydınlatma metni
 * kamuya açık olmalı ve arama motorlarınca bulunabilmelidir.
 */
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
    // Yasal metinler: seyrek değişir, bu yüzden en düşük öncelik.
    ...legalDocs.map((d) => ({
      url: `${site.siteUrl}${d.href}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
