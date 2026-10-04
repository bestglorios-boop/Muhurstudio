import type { MetadataRoute } from "next";
import { site } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  if (!site.siteUrl) {
    // Alan adı bilinmiyorsa yalnızca disallow: her şey indekslenebilir kalır.
    return { rules: [{ userAgent: "*", allow: "/" }] };
  }

  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${site.siteUrl}/sitemap.xml`,
  };
}
