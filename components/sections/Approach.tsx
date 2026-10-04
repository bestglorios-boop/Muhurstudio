/**
 * YAKLAŞIM — beş adım, beş yatay satır. Sahte danışmanlık süreci değil.
 * Her adım gerçekte yaptığımız işi anlatır.
 */
const STEPS = [
  {
    n: "01",
    title: "Dinliyoruz.",
    body: "Ne yaptığınızı, kime hitap ettiğinizi ve neye ihtiyaç duyduğunuzu dinleriz. Tahmin yürütmeden başlarız.",
  },
  {
    n: "02",
    title: "Çerçeveyi kuruyoruz.",
    body: "Hangi sayfalar var, hangisi önce geliyor, neyin nerede duracağı. İskelet netleşmeden tasarıma geçmeyiz.",
  },
  {
    n: "03",
    title: "Tasarlıyoruz.",
    body: "Tipografi, aralık, renk ve hareket tek bir sistem içinde ele alınır. Her kararın bir nedeni vardır.",
  },
  {
    n: "04",
    title: "Geliştiriyoruz.",
    body: "Tasarımı tarayıcıya doğru şekilde taşırız. Mobil, masaüstü ve erişilebilirlik birlikte düşünülür.",
  },
  {
    n: "05",
    title: "Yayınlıyoruz.",
    body: "Yayına alırız ve son kontrolleri tamamlarız. Teslim sonrasında ihtiyaç duyulan konularda da iletişimde kalırız.",
  },
];

export function Approach() {
  return (
    <section id="yaklasim" className="relative scroll-mt-(--header-h) bg-ink">
      <div className="mx-auto max-w-[1680px] px-5 py-24 md:px-10 md:py-32 xl:px-14 xl:py-40">
        <div className="grid grid-cols-12 gap-x-6 gap-y-12">
          <div className="col-span-12 md:col-span-4">
            <p className="label mb-6 flex items-center gap-3 text-on-ink-muted">
              <span className="seal-index">04</span>
              <span className="h-px w-8 bg-line-ink" aria-hidden="true" />
              Yaklaşımımız
            </p>
            <h2 className="font-display text-[clamp(32px,4.4vw,52px)] leading-[1.05]">
              Beş adım.
              <br />
              Gereksiz adım yok.
            </h2>
          </div>

          <div className="col-span-12 md:col-span-7 md:col-start-6">
            <ol className="border-t border-line-ink">
              {STEPS.map((s) => (
                <li
                  key={s.n}
                  className="group grid grid-cols-12 items-baseline gap-x-4 gap-y-2 border-b border-line-ink py-7 md:gap-x-6"
                >
                  <span className="col-span-2 label md:col-span-1">{s.n}</span>
                  <h3 className="col-span-10 font-display text-[clamp(24px,3vw,36px)] leading-tight md:col-span-4">
                    {s.title}
                  </h3>
                  <p className="col-span-12 max-w-[46ch] text-[15px] leading-[1.7] text-on-ink-muted md:col-span-7">
                    {s.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
