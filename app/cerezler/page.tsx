import type { Metadata } from "next";
import { LegalPage, legalMetadata } from "@/components/legal/LegalPage";

/** Çerez Politikası — metin ve düzen `data/legal.ts` + `components/legal`. */
export const metadata: Metadata = legalMetadata("/cerezler");

export default function CerezlerPage() {
  return <LegalPage href="/cerezler" />;
}
