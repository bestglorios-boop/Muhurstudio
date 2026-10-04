import type { Metadata } from "next";
import { LegalPage, legalMetadata } from "@/components/legal/LegalPage";

/** Gizlilik Politikası — metin ve düzen `data/legal.ts` + `components/legal`. */
export const metadata: Metadata = legalMetadata("/gizlilik");

export default function GizlilikPage() {
  return <LegalPage href="/gizlilik" />;
}
