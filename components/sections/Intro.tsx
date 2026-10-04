/**
 * GİRİŞ — koyu anlatıdan sıcak kâğıda geçiş.
 * Bölüm kâğıt gibi düşünülür: koyu bir arşive yerleştirilmiş bir sayfa.
 */
export function Intro() {
  return (
    <section className="on-paper relative bg-paper text-on-paper">
      <div className="mx-auto max-w-[1680px] px-5 py-24 md:px-10 md:py-32 xl:px-14 xl:py-40">
        <div className="grid grid-cols-12 gap-x-6 gap-y-10">
          {/* Sol: bölüm indeksi — geniş negatif alan */}
          <div className="col-span-12 md:col-span-2">
            <p className="label flex items-center gap-3 text-on-paper-muted">
              <span className="seal-index">01</span>
              <span className="h-px w-8 bg-line-paper" aria-hidden="true" />
              Stüdyo
            </p>
          </div>

          {/* Orta: dar editoryal metin — kolon 4–10 */}
          <div className="col-span-12 md:col-span-7 md:col-start-4">
            <p className="prose-muhur text-[clamp(20px,2.6vw,30px)] leading-[1.34]">
              Mühür Studio, Bursa merkezli bağımsız bir web tasarım stüdyosu.
              Web siteleri ve dijital deneyimler tasarlıyoruz.
            </p>
            <p className="mt-10 font-display text-[clamp(26px,3.6vw,44px)] leading-[1.14]">
              Az iş. Özenli iş.
            </p>
          </div>

          {/* Sağ: kısa bağlam notu — kolon 11–12, üstte */}
          <div className="col-span-12 md:col-span-2 md:col-start-11 md:pt-3">
            <p className="text-[14px] leading-[1.7] text-on-paper-muted">
              Web tasarımı ve frontend geliştirme. Çalışma alanımızı dar
              tutuyoruz; daha az projeye, daha fazla özen ayırıyoruz.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
