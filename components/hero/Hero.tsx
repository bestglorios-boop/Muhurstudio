import { site } from "@/data/site";
import { LineField } from "@/components/background/LineField";
import { SealScene } from "@/components/three/SealScene";
import { MuhurLink } from "@/components/ui/MuhurLink";

/**
 * HERO — Mühür'ün en önemli yüzeyi.
 *
 * Sol: kimlik, slogan, tek konumlandırma cümlesi, tek birincil eylem.
 * Sağ/arka: kontrollü 3D mühür + çok ince kontur alanı.
 *
 * Metin anında görünür. 3D ve çizgi alanı üzerine gelir (progressive enhancement).
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-ink">
      {/* Katman 0 — kontur alanı (dekoratif, etkileşimi engellemez) */}
      <div className="absolute inset-0 z-0 opacity-70" aria-hidden="true">
        <LineField />
      </div>

      {/* Katman 1 — 3D mühür */}
      <SealScene />

      {/* İçerik: gerçek metin, gerçek HTML. Canvas'ta metin yok. */}
      {/* Alt kenar (pb-24 / md:pb-28) bilinçli: sağ altta SABİT duran WhatsApp
          düğmesinin yüksekliği (mobil 48px + 1.25rem, masaüstü 56px + 1.25rem
          = 76px) hero CTA'sının üstüne binmemeli. md:pb-20 idi ve yalnızca 4px
          boşluk bırakıyordu. */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] max-w-[1680px] flex-col justify-end px-5 pt-16 pb-24 md:min-h-[calc(100svh-5rem)] md:px-10 md:pt-24 md:pb-28 xl:px-14">
        <div className="grid grid-cols-12 gap-x-6 gap-y-10">
          {/* Sol küme: kolon 1–7 */}
          <div className="col-span-12 lg:col-span-7">
            {/* 320px'te kicker kümelerinin kırılmasını kontrol eder. */}
            <p className="label mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-on-ink-muted md:mb-10">
              <span className="whitespace-nowrap">
                {site.location.label}
                <span aria-hidden="true" className="ml-3 text-[#3A3A3A]">
                  /
                </span>
              </span>
              <span className="whitespace-nowrap">{site.location.remote}</span>
            </p>

            <h1 className="font-display text-[clamp(48px,11vw,112px)]">
              <span className="block">Mühür</span>
              <span className="block pl-[0.14em] italic text-on-ink-muted">Studio</span>
            </h1>

            <p className="mt-7 max-w-[22ch] font-display text-[clamp(22px,3.4vw,34px)] leading-[1.18] md:mt-9">
              {site.tagline}
            </p>
          </div>

          {/* Sağ küme: kolon 8–12, alt hizalı */}
          <div className="col-span-12 flex flex-col justify-end lg:col-span-5 lg:col-start-8">
            <p className="prose-muhur max-w-[38ch] text-on-ink-muted">
              Web siteleri ve dijital deneyimler tasarlıyoruz.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6 lg:mt-10">
              <MuhurLink
                href={site.social.primaryActionHref}
                size="lg"
                className="w-full sm:w-auto"
                external
              >
                {site.primaryCta}
              </MuhurLink>
              <MuhurLink href={site.secondaryCtaHref} variant="ghost" size="lg">
                {site.secondaryCta}
              </MuhurLink>
            </div>
          </div>
        </div>

        {/* Alt kenar: ince ayrım + büyük M filigranı */}
        <div className="mt-16 flex items-end justify-between border-t border-line-ink pt-6 md:mt-24">
          <p className="label text-on-ink-muted">
            {site.statements.short}
          </p>
          <p aria-hidden="true" className="font-display text-[64px] leading-[0.7] text-[#101010] md:text-[96px]">
            M
          </p>
        </div>
      </div>
    </section>
  );
}
