import { site } from "@/data/site";
import { MuhurGlyph } from "@/components/brand/MuhurMark";

/**
 * MANİFESTO — sakinlik anı. Hareket yok, efekt yok, yalnızca ölçü.
 * Buradaki sessizlik, sayfanın geri kalanındaki hareketi anlamlı kılar.
 *
 * KÂĞIT ZEMİN: Manifesto, koyu arşivin içine yerleştirilmiş sıcak bir sayfa
 * gibi düşünülür — Intro ve Hizmetler ile aynı "on-paper" ailesine girer.
 * Metin rengi #111111 (--on-paper), indeks `seal-index` ile kâğıtta kırmızı
 * (#C23B22) kalır; böylece markanın tek vurgusu bozulmaz.
 *
 * `scroll-mt`: başlık `sticky` olduğu için bağlantıyla gelindiğinde bölümün
 * üst kısmı başlığın ALTINDA kalmasın diye başlık yüksekliği kadar pay bırakılır
 * (mobil 4rem / md 5rem). Hash bağlantıları #hizmetler ve #yaklasim'dir.
 */
export function Manifesto() {
  return (
    <section className="on-paper relative bg-paper text-on-paper">
      <div className="mx-auto max-w-[1680px] px-5 py-24 md:px-10 md:py-28 xl:px-14 xl:py-32">
        <div className="grid grid-cols-12 items-center gap-x-6 gap-y-10">
          <div className="col-span-12 md:col-span-7">
            <p className="label mb-7 flex items-center gap-3 text-on-paper-muted">
              <span className="seal-index">05</span>
              <span className="h-px w-8 bg-line-paper" aria-hidden="true" />
              {site.sections.manifestoLabel}
            </p>
            <p className="font-display text-[clamp(30px,5.2vw,64px)] leading-[1.12]">
              {site.statements.philosophy}
            </p>
            <p className="label mt-9 text-on-paper-muted">{site.statements.triptych}</p>
          </div>

          {/* Büyük, çok soluk M: yapısal, dekoratif değil. Kâğıt zeminde
              #101010 görünmez olurdu; bu yüzden ince ve açık bir tonu
              (--on-paper-muted ailesi) kullanılır. */}
          <div className="col-span-12 md:col-span-4 md:col-start-9">
            <MuhurGlyph className="h-auto w-full text-[#E6E0D9]" />
          </div>
        </div>
      </div>
    </section>
  );
}
