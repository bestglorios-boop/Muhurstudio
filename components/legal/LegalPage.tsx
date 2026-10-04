import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLegalDoc, legalDocs } from "@/data/legal";
import { site } from "@/data/site";
import { MuhurGlyph } from "@/components/brand/MuhurMark";
import { MuhurLink } from "@/components/ui/MuhurLink";

/**
 * Yasal sayfa — dört belgenin TEK düzeni.
 *
 * Neden ayrı bir bileşen: dört sayfanın başlığı, girişi, bölüm hiyerarşisi ve
 * alt gezinmesi birebir aynıdır. Düzen bir kez burada yazılır; metin
 * `data/legal.ts`'den gelir. Metin değişirse bu dosyaya dokunulmaz.
 *
 * TASARIM: ana siteyle aynı dil — koyu başlık bloğu, kâğıt gövde, ince
 * hairline ayrım, `seal-index` kırmızısı. Genel bir yasal şablon DEĞİLDİR:
 * kart yok, kutu yok, gölge yok.
 *
 * ERİŞİLEBİLİRLİK: her belge tam olarak bir <h1> ve sıralı <h2> üretir;
 * bölüm listeleri gerçek <ul>, alt gezinme gerçek <nav>.
 */

export function legalMetadata(href: string): Metadata {
  const doc = getLegalDoc(href);
  if (!doc) return { title: "Sayfa bulunamadı" };
  return {
    title: doc.title,
    description: doc.description,
    // Alan adı bilinmiyorsa canonical ÜRETİLMEZ — localhost'a sızmasın.
    alternates: site.siteUrl ? { canonical: doc.href } : undefined,
    openGraph: {
      title: `${doc.title} — ${site.name}`,
      description: doc.description,
      type: "article",
    },
  };
}

export function LegalPage({ href }: { href: string }) {
  const doc = getLegalDoc(href);
  if (!doc) notFound();

  const others = legalDocs.filter((d) => d.href !== href);

  return (
    <div className="bg-ink">
      {/* Başlık — koyu, yükseklikte M filigranı. */}
      <header className="mx-auto max-w-[1680px] px-5 pt-14 pb-12 md:px-10 md:pt-20 md:pb-16 xl:px-14">
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-8">
          <div className="col-span-12 md:col-span-8">
            {/* Ana sayfaya dönüş — yasal sayfalarda zorunlu çıkış yolu. */}
            <p className="label mb-8 flex items-center gap-3 text-on-ink-muted">
              <span aria-hidden="true" className="h-px w-8 bg-line-ink" />
              <Link
                href="/"
                className="tap transition-colors duration-200 hover:text-on-ink"
              >
                {site.name}
              </Link>
            </p>

            <h1 className="font-display text-[clamp(38px,7vw,84px)] leading-[1.02]">
              {doc.title}
            </h1>

            <p className="prose-muhur mt-7 max-w-[46ch] text-on-ink-muted">
              {doc.lead}
            </p>
          </div>

          {/* Belge dönemi — sözleşme tarihi DEĞİLDİR, metnin dönemidir. */}
          <div className="col-span-12 md:col-span-3 md:col-start-10 md:self-end">
            <p className="label text-on-ink-muted">Güncelleme</p>
            <p className="mt-2 text-[15px]">{doc.revised}</p>
          </div>
        </div>
      </header>

      {/* Gövde — kâğıt. `.on-paper` ailesi iplik dokusunu ve mühür izinin
          kendiliğinden getirir; bu sayfada ayrı bir arka plan gerekmez. */}
      <div className="on-paper bg-paper text-on-paper">
        <article className="mx-auto max-w-[1680px] px-5 py-20 md:px-10 md:py-28 xl:px-14">
          <div className="grid grid-cols-12 gap-x-6 gap-y-12">
            {/* Sol: ince içindekiler listesi. */}
            <nav
              aria-label="Bu sayfa içindeki bölümler"
              className="col-span-12 md:col-span-3"
            >
              <div className="md:sticky md:top-28">
                <p className="label mb-5 text-on-paper-muted">İçindekiler</p>
                <ol className="space-y-3 border-t border-line-paper pt-5">
                  {doc.sections.map((s, i) => (
                    <li key={s.heading} className="flex gap-3 text-[14px]">
                      <span className="seal-index label shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <a
                        href={`#b${i + 1}`}
                        className="hairline text-on-paper-muted transition-colors duration-200 hover:text-on-paper"
                      >
                        {s.heading}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            </nav>

            {/* Sağ: metin. Ölçü 68ch ile sınırlı — uzun satır okunur kalmaz. */}
            <div className="col-span-12 md:col-span-7 md:col-start-5">
              {doc.intro.map((p) => (
                <p
                  key={p}
                  className="mb-5 max-w-[68ch] text-[17px] leading-[1.68] text-on-paper-muted"
                >
                  {p}
                </p>
              ))}

              {doc.sections.map((s, i) => (
                <section
                  key={s.heading}
                  id={`b${i + 1}`}
                  className="scroll-mt-(--header-h) pt-12 first:pt-4"
                >
                  <h2 className="mb-5 font-display text-[clamp(24px,3vw,34px)] leading-[1.12]">
                    {s.heading}
                  </h2>

                  {s.paragraphs?.map((p) => (
                    <p
                      key={p}
                      className="mb-4 max-w-[68ch] text-[17px] leading-[1.68] text-on-paper-muted"
                    >
                      {p}
                    </p>
                  ))}

                  {s.items && (
                    <ul className="mt-5 mb-4 space-y-3">
                      {s.items.map((item) => (
                        <li
                          key={item}
                          className="flex max-w-[68ch] gap-4 text-[16px] leading-[1.66] text-on-paper-muted"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-[0.85em] h-px w-4 shrink-0 bg-line-paper"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </div>
        </article>
      </div>

      {/* Kapanış: diğer yasal metinler + ana siteye dönüş eylemi. */}
      <section className="border-t border-line-ink">
        <div className="mx-auto max-w-[1680px] px-5 py-16 md:px-10 md:py-24 xl:px-14">
          <div className="grid grid-cols-12 items-end gap-x-6 gap-y-10">
            <nav
              aria-label="Diğer yasal metinler"
              className="col-span-12 md:col-span-7"
            >
              <p className="label mb-6 text-on-ink-muted">Diğer metinler</p>
              <ul className="border-t border-line-ink">
                {others.map((o) => (
                  <li key={o.href} className="border-b border-line-ink">
                    <Link
                      href={o.href}
                      className="group flex items-baseline justify-between gap-6 py-5 transition-colors duration-200 hover:bg-ink-raised"
                    >
                      <span className="font-display text-[clamp(20px,2.6vw,28px)] leading-tight">
                        {o.title}
                      </span>
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-on-ink-muted transition-transform duration-200 ease-seal group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="col-span-12 md:col-span-4 md:col-start-9 md:self-end">
              <MuhurLink href="/" size="lg" className="w-full sm:w-auto">
                Ana sayfaya dön
              </MuhurLink>
              <div aria-hidden="true" className="mt-10 hidden md:block">
                <MuhurGlyph className="h-auto w-full text-[#101010]" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
