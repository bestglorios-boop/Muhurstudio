import type { Metadata } from "next";
import { LegalPage, legalMetadata } from "@/components/legal/LegalPage";

/** KVKK Aydınlatma Metni — metin ve düzen `data/legal.ts` + `components/legal`. */
export const metadata: Metadata = legalMetadata("/kvkk");

export default function KvkkPage() {
  return <LegalPage href="/kvkk" />;
}
