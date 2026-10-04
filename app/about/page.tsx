import type { Metadata } from "next";
import { site } from "@/data/site";
import { MuhurLink } from "@/components/ui/MuhurLink";
import { MuhurGlyph } from "@/components/brand/MuhurMark";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "Mühür Studio, Bursa merkezli bağımsız bir tasarım ve geliştirme stüdyosu. Web siteleri ve dijital deneyimler.",
  alternates: site.siteUrl ? { canonical: "/about" } : undefined,
};

/** Çalışma alanı. Kart yok, simge yok, yüzde yok. */
const FOCUS = [
  "Web Tasarım",
  "Frontend Geliştirme",
  "UI/UX Tasarımı",
  "Dönüşüm Odaklı Sayfalar",
];

export default function AboutPage() {
  return (
    <div className="bg-ink">
      <header className="mx-auto max-w-[1680px] px-5 pt-16 pb-16 md:px-10 md:pt-24 md:pb-24 xl:px-14">
        <div className="grid grid-cols-12 gap-x-6 gap-y-10">
          <div className="col-span-12 md:col-span-2">
            <p className="label flex items-center gap-3 text-on-ink-muted">
              Hakkımızda
            </p>
          </div>

          <div className="col-span-12 md:col-span-8">
            <h1 className="font-display text-[clamp(40px,7.4vw,92px)] leading-[1.0]">
              Mühür Studio, Bursa merkezli bağımsız bir tasarım ve geliştirme
              stüdyosu.
            </h1>
          </div>
        </div>
      </header>

      {/* Düşünme biçimi — iki sütun, geniş negatif alan */}
      <section className="on-paper bg-paper text-on-paper">
        <div className="mx-auto max-w-[1680px] px-5 py-20 md:px-10 md:py-28 xl:px-14">
          <div className="grid grid-cols-12 gap-x-6 gap-y-12">
            <div className="col-span-12 md:col-span-3">
              <p className="label flex items-center gap-3 text-on-paper-muted">
                <span className="seal-index">01</span>
                <span className="h-px w-8 bg-line-paper" aria-hidden="true" />
                Yaklaşım
              </p>
            </div>
            <div className="col-span-12 md:col-span-7 md:col-start-5">
              <p className="prose-muhur text-[clamp(19px,2.3vw,26px)] leading-[1.42]">
                Web siteleri ve dijital deneyimler tasarlıyor ve geliştiriyoruz.
                Yaklaşımımız net: gereksiz kalabalığı azaltmak, doğru şeyi iyi
                yapmak ve markaya gerçekten ait hissettiren işler üretmek.
              </p>
              <p className="prose-muhur mt-8 text-on-paper-muted">
                Küçük bir stüdyo olduğumuz için her projeye ayrılan zaman az.
                Bu yüzden iş sayısını bilerek sınırlıyoruz: aynı anda birkaç
                iş üzerinde çalışıyoruz ve her birine stüdyonun tamamını
                veriyoruz.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Çalışma alanı — sade bir liste */}
      <section>
        <div className="mx-auto max-w-[1680px] px-5 py-20 md:px-10 md:py-28 xl:px-14">
          <div className="grid grid-cols-12 gap-x-6 gap-y-12">
            <div className="col-span-12 md:col-span-3">
              <p className="label flex items-center gap-3 text-on-ink-muted">
                <span className="seal-index">02</span>
                <span className="h-px w-8 bg-line-ink" aria-hidden="true" />
                Çalışma alanı
              </p>
            </div>
            <div className="col-span-12 md:col-span-7 md:col-start-5">
              <ul className="border-t border-line-ink">
                {FOCUS.map((f) => (
                  <li
                    key={f}
                    className="border-b border-line-ink py-5 font-display text-[clamp(24px,3.4vw,40px)] leading-tight"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Manifesto + konum */}
      <section>
        <div className="mx-auto max-w-[1680px] px-5 pb-24 md:px-10 md:pb-32 xl:px-14">
          <div className="grid grid-cols-12 items-center gap-x-6 gap-y-12">
            <div className="col-span-12 md:col-span-7">
              <p className="font-display text-[clamp(28px,4.6vw,56px)] leading-[1.12]">
                {site.statements.philosophy}
              </p>
              <p className="label mt-10 text-on-ink-muted">
                {site.statements.triptych}
              </p>
            </div>
            <div className="col-span-12 md:col-span-3 md:col-start-10">
              <MuhurGlyph className="h-auto w-full text-[#101010]" />
            </div>
          </div>
        </div>
      </section>

      {/* İletişim: tek eylem */}
      <section className="border-t border-line-ink">
        <div className="mx-auto max-w-[1680px] px-5 py-20 md:px-10 md:py-28 xl:px-14">
          <div className="grid grid-cols-12 gap-x-6 gap-y-10">
            <div className="col-span-12 md:col-span-6">
              <h2 className="font-display text-[clamp(32px,5vw,60px)] leading-[1.04]">
                Konuşalım.
              </h2>
              <p className="prose-muhur mt-7 max-w-[40ch] text-on-ink-muted">
                {site.location.label} · {site.location.remote}
              </p>
            </div>
            <div className="flex items-end md:col-span-5 md:col-start-8">
              <div className="w-full md:w-auto">
                <MuhurLink
                  href={site.social.primaryActionHref}
                  size="lg"
                  className="w-full sm:w-auto"
                  external
                >
                  {site.primaryCta}
                </MuhurLink>
                <p className="mt-5 text-[15px] text-on-ink-muted">{site.email}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
