import Link from "next/link";
import type { Project } from "@/data/projects";
import { Reveal } from "@/components/motion/Reveal";

/**
 * SEÇİLİ ÇALIŞMALAR — bir İNDEKS.
 *
 * Bu bölüm bir vaka çalışması değil, bir dizin listesi. Ziyaretçi önce
 * yalnızca isimleri görür, ilgisini çeken satıra gider, derinlik kendi
 * proje sayfasında açılır.
 *
 * Bu yüzden bilgi yoğunluğu bilinçli olarak düşük tutulur:
 * numara + proje adı + yıl. Kapak görseli, tür, durum ve alt başlık YOK —
 * bunlar ilk kaydırmada değil, projenin kendi sayfasında işe yarar.
 *
 * Hâlâ editoryal kalanlar: geniş negatif alan, asimetrik kolon kaymaları,
 * ince ayrım çizgileri, kontrollü kırmızı indeks ve ölçülü hover.
 */
export function FeaturedWork({ projects }: { projects: Project[] }) {
  return (
    <section id="calismalar" className="relative bg-ink">
      <div className="mx-auto max-w-[1680px] px-5 py-24 md:px-10 md:py-32 xl:px-14 xl:py-40">
        {/* Bölüm başlığı: kolon 1–5, index çizgisiyle */}
        <div className="grid grid-cols-12 items-end gap-x-6 gap-y-6 border-b border-line-ink pb-8">
          <div className="col-span-12 md:col-span-5">
            <p className="label mb-5 flex items-center gap-3 text-on-ink-muted">
              <span className="seal-index">02</span>
              <span className="h-px w-8 bg-line-ink" aria-hidden="true" />
              Seçili Çalışmalar
            </p>
            <h2 className="font-display text-[clamp(34px,5vw,60px)]">
              İzi kalan
              <br />
              işler.
            </h2>
          </div>
          <div className="col-span-12 md:col-span-3 md:col-start-10">
            <Link
              href="/work"
              className="tap hairline text-[14px] text-on-ink-muted transition-colors duration-200 hover:text-on-ink"
            >
              Tüm çalışmalar
              <span aria-hidden="true"> →</span>
            </Link>
          </div>
        </div>

        {/* Dizin: iki satır, bol boşluk, tipografik ritim. */}
        <ul className="mt-16 md:mt-24">
          {projects.map((p, i) => (
            <FeaturedIndexRow key={p.slug} project={p} offset={i} />
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Satır kaymaları asimetriktir ama kurallıdır: 01 → 1. kolon, 02 → 2. kolon.
 * Başlık 6 kolon genişliğinde olduğu için son kayma 9. kolonda biter; yıl
 * 11–12'de kalır ve çakışma olmaz. Böylece dizi bir blok gibi okunmaz, bir
 * arşiv gibi okunur. Rastgele değil, ölçülü.
 *
 * Arşivde şu an İKİ proje var; dizi üçüncü bir projeye izin verecek kadar
 * genel tutulur, ama üçüncü proje UYDURULMAZ — yalnızca gerçek iş eklenir.
 */
const OFFSETS = ["md:col-start-1", "md:col-start-2", "md:col-start-3"] as const;

function FeaturedIndexRow({
  project: p,
  offset,
}: {
  project: Project;
  offset: number;
}) {
  const shift = OFFSETS[offset % OFFSETS.length];

  return (
    <Reveal as="li" className="border-b border-line-ink">
      <Link
        href={`/work/${p.slug}`}
        className="group grid grid-cols-12 items-baseline gap-x-6 py-10 transition-colors duration-300 hover:bg-ink-raised md:py-16"
      >
        <span className="label col-span-2 md:col-span-1">{p.index}</span>

        {/* Başlık masaüstünde 1 → 2 → 3 arasında kayar; yıl HER ZAMAN
            sağda sabit kalır. Böylece otomatik yerleşim asla ikinci bir
            satıra taşmaz ve numara–yıl–başlık tek bir baz çizgisinde durur. */}
        <h3
          className={`col-span-8 font-display text-[clamp(28px,7.4vw,80px)] leading-[1.06] transition-transform duration-300 ease-seal group-hover:translate-x-2 md:col-span-6 md:leading-[1.02] ${shift}`}
        >
          {p.title}
        </h3>

        <span className="label col-span-2 self-baseline text-right text-on-ink-muted md:col-start-11 md:col-span-2">
          {p.year}
        </span>
      </Link>
    </Reveal>
  );
}
