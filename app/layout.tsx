import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import { site } from "@/data/site";
import { Navigation } from "@/components/navigation/Navigation";
import { Footer } from "@/components/footer/Footer";
import { SkipLink } from "@/components/motion/SkipLink";
import { WhatsAppButton } from "@/components/contact/WhatsAppButton";

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/*
 * OG/Twitter görseli YALNIZCA üretim alan adı bilindiğinde üretilir.
 *
 * NEDEN (ölçülen hata): göreli "/og/og.svg" verildiğinde Next.js onu
 * `metadataBase`e göre MUTLAKLAŞTIRIR. metadataBase tanımsızken Next'in
 * varsayılanı http://localhost:3000 olduğu için sunucudan çıkan HTML'de
 *   <meta property="og:image" content="http://localhost:3000/og/og.svg">
 * yazıyordu. Yayına çıktığında sosyal önizlemeler kırık olurdu.
 *
 * Çözüm, dosyanın kendi kuralının aynısı: canonical gibi — alan adı
 * bilinmiyorsa alan HİÇ üretilmez. Sahte alan adı UYDURULMAZ.
 * `site.siteUrl` doldurulduğu an hem canonical hem OG görseli
 * kendiliğinden doğru mutlak adresle çalışır.
 */
const ogUrl = site.siteUrl ? `${site.siteUrl}/og/og.svg` : null;

/*
 * YAPISAL VERİ — YALNIZCA DOĞRULANABİLİR OLAN.
 *
 * Neden ekleniyor: site gerçek bir işletmedir ve arama motorlarının
 * "Organization" bilgisine ihtiyaç vardır. Ancak bu blok yalnızca elimizde
 * GERÇEKTEN OLAN alanları taşır:
 *
 *   - name, description, email, url (varsa), logo, sameAs sosyal hesaplar
 *   - address: YALNIZCA şehir/ülke. AÇIK ADRES YOKTUR ve uydurulmamıştır.
 *   - contactPoint yalnızca e-posta üzerinden gerçek bir iletişim kanalıdır.
 *
 * BİLEREK YAZILMAYANLAR: aggregateRating, review, award, foundingDate,
 * numberOfEmployees, vatID, taxID, sicil numarası, SAME AS'lı sahte hesaplar.
 * Hiçbiri bu depoda mevcut değil; schema.org bunları "isteğe bağlı" kabul
 * eder, ama YANLIŞ doldurulmuş hâli arama sonuçlarında doğrulanabilir bir
 * yanlışlık olur.
 *
 * `site.siteUrl` boşken blok HİÇ ÜRETİLMEZ: `url` alanı olmayan bir
 * Organization, localhost'a işaret eden bir Organization'dan daha iyidir —
 * ve hiçbir şey üretmemek en dürüst seçenektir.
 */
const jsonLd =
  site.siteUrl && ogUrl
    ? {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: site.name,
        description: site.description,
        url: site.siteUrl,
        email: site.email,
        logo: ogUrl,
        address: {
          "@type": "PostalAddress",
          addressLocality: site.location.city,
          addressCountry: "TR",
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          email: site.email,
          availableLanguage: ["Turkish"],
        },
        sameAs: [site.social.instagram, site.social.linkedin],
      }
    : null;

export const metadata: Metadata = {
  metadataBase: site.siteUrl ? new URL(site.siteUrl) : undefined,
  title: {
    default: site.meta.title,
    template: "%s — Mühür Studio",
  },
  description: site.meta.description,
  applicationName: site.name,
  keywords: [
    "web tasarım",
    "web sitesi",
    "frontend geliştirme",
    "UI/UX tasarımı",
    "dijital deneyim",
    "Bursa",
  ],
  authors: [{ name: site.name }],
  creator: site.name,
  publisher: site.name,
  // Alan adı bilinmiyorsa canonical HİÇ üretilmez. Üretilirse Next.js
  // metadataBase olmadığı için "http://localhost:3000" yazar ve bu geçersiz
  // bir canonical olur (SEO puanını düşürür). Alan adı girilince kendiliğinden
  // doğru adresle çalışır. Sahte alan adı UYDURULMAZ.
  alternates: site.siteUrl ? { canonical: "/" } : undefined,
  openGraph: {
    type: "website",
    locale: site.meta.locale,
    siteName: site.name,
    title: site.meta.title,
    description: site.meta.description,
    url: site.siteUrl || undefined,
    images: ogUrl
      ? [{ url: ogUrl, width: 1200, height: 630, alt: `${site.name} — ${site.tagline}` }]
      : undefined,
  },
  twitter: {
    card: "summary_large_image",
    title: site.meta.title,
    description: site.meta.description,
    images: ogUrl ? [ogUrl] : undefined,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  formatDetection: { telephone: false, address: false, email: true },
};

export const viewport: Viewport = {
  themeColor: "#080808",
  colorScheme: "dark",
  /*
   * viewportFit: "cover" — ZORUNLU.
   *
   * Bu bayrak OLMADAN `env(safe-area-inset-*)` her cihazda 0 döner. Yani
   * çentikli/alt çubuklu iPhone'larda güvenli alan bilgisi hiç gelmez ve
   * sabit WhatsApp düğmesi ekran çubuğunun ALTINDA kalır — kullanıcıya
   * "düğme yok" gibi görünür. Bu, küçük cihazlarda düğmenin güvenilmez
   * görünmesinin kök nedeniydi.
   *
   * `cover` verildiğinde `env(safe-area-inset-bottom)` gerçek değeri döner ve
   * WhatsAppButton'daki `calc(env(...) + 1.25rem)` ifadesi çalışır.
   * Kesme/çentik bölgesi artık içerik alanına dahil olur; bu yüzden alt
   * bilgi ve hero zaten safe-area payı olan dolgular kullanır.
   */
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" className={`${display.variable} ${sans.variable} antialiased`}>
      {/*
       * YIĞIN MİMARİSİ — üçü de `<body>`'nin doğrudan çocuğu, açık sırayla:
       *
       *   <Navigation />    z-70  → mobil menü dahil her şey EN ÜSTTE
       *   içerik sarmalayıcı z-2   → sayfa gövdesi (grain katmanının z-1 üstünde)
       *   <WhatsAppButton /> z-40  → menünün ALTINDA, içeriğin ÜSTÜNDE
       *
       * Böylece istenen sıra sağlanır:  menü > WhatsApp > içerik
       *
       * WhatsApp artık içerik sarmalayıcısının İÇİNDE DEĞİL. Eski düzen
       * `div.relative.z-[2]` içindeydi; yığın sırası o bağlama göre
       * sınırlıyordu. Kök seviyeye taşındı: bölüm, grid, kart, overflow
       * ya da transform yok — kontrol doğrudan viewport'a sabitlenir.
       *
       * `flex flex-col` gövdede: başlık + içerik + alt bilgi dağılımı
       * eskisiyle aynı (içerik `flex-1` ile büyür), toplam yükseklik
       * yine `min-h-dvh`. Yalnızca başlık artık sarmalayıcının dışında.
       */}
      <body className="flex min-h-dvh flex-col bg-ink text-on-ink">
        {/* JSON-LD yalnızca üretim alan adı bilindiğinde basılır (yukarıya bak). */}
        {jsonLd && (
          <script
            type="application/ld+json"
            // Next.js içerik kaçırması zorunlu kılar: kullanıcı verisi değil,
            // build sırasında üretilen sabit bir nesnedir.
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
        <SkipLink />
        <Navigation />
        <div className="relative z-[2] flex flex-1 flex-col">
          <main id="icerik" className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
        <WhatsAppButton />
      </body>
    </html>
  );
}
