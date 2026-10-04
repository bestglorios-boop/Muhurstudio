import type { Metadata } from "next";
import { LegalPage, legalMetadata } from "@/components/legal/LegalPage";

/** Kullanım Koşulları — metin ve düzen `data/legal.ts` + `components/legal`. */
export const metadata: Metadata = legalMetadata("/kullanim-kosullari");

export default function KullanimKosullariPage() {
  return <LegalPage href="/kullanim-kosullari" />;
}
