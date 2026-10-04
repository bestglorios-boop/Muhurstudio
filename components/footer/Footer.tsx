import Link from "next/link";
import { site } from "@/data/site";
import { legalNav } from "@/data/legal";
import { Logo, MuhurGlyph } from "@/components/brand/MuhurMark";

/**
 * Footer sütun sözleşmesi (md+ 12 kolon):
 *   Konum   → 7–9
 *   E-posta → 10–12
 * Aralıklar ayrıdır; ikisi hiçbir zaman çakışmaz.
 *
 * İki değer tek bir yerel sabitte tutulur: eşleşmeleri birbirine bağlar,
 * böylece biri değiştiğinde diğerinin uyumu bozulmaz.
 */
const FOOTER_COLS = {
  location: "md:col-span-3 md:col-start-7",
  email: "md:col-span-3 md:col-start-10",
} as const;

/**
 * Sessiz, kısa, kanıtlayıcı. Devasa site haritası yok.
 *
 * Konum ve E-posta sütunları aynı hiza ritmini kurar:
 * [label mb-4] + [15px içerik, ilk satır]. İki sütunun da ilk satır
 * tabanı aynıdır; rastgele margin yok.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-line-ink bg-ink">
      <div className="mx-auto max-w-[1680px] px-5 md:px-10 xl:px-14">
        {/* Üst satır: kimlik + konum */}
        <div className="grid grid-cols-1 gap-10 py-14 md:grid-cols-12 md:py-20">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              {/* Dekoratif: yanındaki kelime markası zaten kimliği söylüyor.
                  Bu yüzden alt metin BOŞ bırakılır — ekran okuyucu aynı
                  etiketi iki kez duymaz. */}
              <Logo className="h-10 w-10" />
              <p className="font-display text-[30px] leading-none md:text-[38px]">
                {site.name}
              </p>
            </div>
            <p className="mt-3 text-[15px] text-on-ink-muted">{site.tagline}</p>
          </div>

          <div className={FOOTER_COLS.location}>
            <p className="label mb-4 text-on-ink-muted">Konum</p>
            <p className="text-[15px]">{site.location.label}</p>
            <p className="mt-1 text-[15px] text-on-ink-muted">{site.location.remote}</p>
          </div>

          <div className={FOOTER_COLS.email}>
            <p className="label mb-4 text-on-ink-muted">E-posta</p>
            <a
              href={`mailto:${site.email}`}
              className="hairline text-[15px] break-all"
            >
              {site.email}
            </a>
          </div>
        </div>

        {/* Alt satır: sosyal + telif */}
        <div className="flex flex-col gap-6 border-t border-line-ink py-8 md:flex-row md:items-center md:justify-between">
          <ul className="flex items-center gap-8">
            <li>
              <a
                href={site.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="hairline inline-block py-0.5 text-[14px] text-on-ink-muted transition-colors duration-200 hover:text-on-ink"
              >
                Instagram
                <span className="sr-only"> — dış bağlantı</span>
              </a>
            </li>
            <li>
              <a
                href={site.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="hairline inline-block py-0.5 text-[14px] text-on-ink-muted transition-colors duration-200 hover:text-on-ink"
              >
                LinkedIn
                <span className="sr-only"> — dış bağlantı</span>
              </a>
            </li>
          </ul>

          <p className="text-[13px] text-on-ink-muted">
            © {year} {site.name}
          </p>
        </div>

        {/*
         * Yasal satır — ayrı ve EN SON sırada.
         *
         * Neden ayrı satır: dört bağlantı sosyal satırının içine sıkıştırılırsa
         * 320px'te alt alta dizilir ve telif satırıyla çakışma riski doğar.
         * Kendi satırında hem mobilde okunur hem de mevcut footer yapısı
         * (sütun sözleşmesi, M filigranı, kapanış cümlesi) bozulmaz.
         *
         * Metin `data/legal.ts`'den gelir; burada yalnızca YERLEŞİM tanımlıdır.
         */}
        <nav
          aria-label="Yasal metinler"
          className="border-t border-line-ink py-6"
        >
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {legalNav.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="hairline inline-block py-0.5 text-[13px] text-on-ink-muted transition-colors duration-200 hover:text-on-ink"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* M filigranı: footer'ın kapanış imzası. Çok soluk, dekoratif değil yapısal. */}
      <div className="pointer-events-none flex justify-end overflow-hidden px-5 pb-2 md:px-10 xl:px-14">
        <MuhurGlyph className="h-24 w-auto text-[#101010] md:h-32" />
      </div>

      {/* Kapanış cümlesi — tek satır, abartısız. Alt boşluk, sağ alttaki SABİT
          WhatsApp düğmesi (masaüstü 56px + 1.25rem = 76px) son satırları
          kapatmasın diye bırakıldı. */}
      <div className="mx-auto max-w-[1680px] px-5 pb-24 md:px-10 md:pb-16 xl:px-14">
        <p className="text-[13px] text-on-ink-muted">
              <Link href="/about" className="tap hairline">
                {site.statements.signoff}
              </Link>
        </p>
      </div>
    </footer>
  );
}
