"use client";

import { useState } from "react";
import { site } from "@/data/site";

/**
 * HİZMETLER — editoryal liste. Sekiz özdeş kart değil.
 * Her hizmet tek bir yatay satır. Hover/focus: kısa açıklama, kırmızı indeks.
 * Simge yok. Rastgele ikon ızgarası yok.
 */
const SERVICES = [
  {
    id: "01",
    title: "Web Tasarım",
    detail:
      "Markanın karakterini sayfada taşıyan, tipografi ve hiyerarşiye dayalı web siteleri.",
  },
  {
    id: "02",
    title: "Frontend Geliştirme",
    detail:
      "Tasarımın verdiği kararların birebir uygulandığı, hızlı ve erişilebilir arayüzler.",
  },
  {
    id: "03",
    title: "UI/UX Tasarımı",
    detail:
      "Ekranların akışını, kullanım sırasını ve her dokunuşun nereye düştüğünü birlikte kurarız.",
  },
  {
    id: "04",
    title: "Landing Page",
    detail:
      "Tek bir fikri, tek bir kararı anlatmak için kurulan sade ve ölçülü sayfalar.",
  },
  {
    id: "05",
    title: "Responsive Web Geliştirme",
    detail:
      "Her ekran genişliğinde yeniden düzenlenen, küçültülmüş değil yeniden kurulan düzenler.",
  },
  {
    id: "06",
    title: "Dijital Marka Görünümü",
    detail:
      "Renk, tipografi ve görsel dilin web üzerinde tutarlı bir bütün hâline gelmesi.",
  },
  {
    id: "07",
    title: "Konsept ve Prototip Tasarımı",
    detail:
      "Fikir daha gelişmeden önce çalışan bir prototip üzerinde tartışmak.",
  },
];

export function Services() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section
      id="hizmetler"
      className="on-paper relative scroll-mt-(--header-h) bg-paper text-on-paper"
    >
      <div className="mx-auto max-w-[1680px] px-5 py-24 md:px-10 md:py-32 xl:px-14 xl:py-40">
        <div className="grid grid-cols-12 gap-x-6 gap-y-10">
          <div className="col-span-12 md:col-span-3">
            <p className="label mb-5 flex items-center gap-3 text-on-paper-muted">
              <span className="seal-index">03</span>
              <span className="h-px w-8 bg-line-paper" aria-hidden="true" />
              {site.sections.servicesLabel}
            </p>
            <p className="mt-6 max-w-[26ch] text-[15px] leading-[1.7] text-on-paper-muted">
              Web tasarımı, arayüz tasarımı ve frontend geliştirme.
            </p>
          </div>

          <div className="col-span-12 md:col-span-8 md:col-start-5">
            <ul className="border-t border-line-paper">
              {SERVICES.map((s) => {
                const isOpen = open === s.id;
                return (
                  <li key={s.id} className="border-b border-line-paper">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? null : s.id)}
                      onMouseEnter={() => setOpen(s.id)}
                      onMouseLeave={() => setOpen(null)}
                      className="group flex w-full items-baseline gap-5 py-6 text-left md:gap-8 md:py-7"
                    >
                      <span
                        className={`label shrink-0 transition-colors duration-200 ${
                          isOpen ? "text-seal" : "text-on-paper-muted"
                        }`}
                      >
                        {s.id}
                      </span>
                      <span className="flex-1">
                        <span
                          className={`block font-display leading-tight transition-transform duration-200 ease-seal ${
                            isOpen ? "translate-x-1" : ""
                          } text-[clamp(24px,3.2vw,38px)]`}
                        >
                          {s.title}
                        </span>
                      </span>
                    </button>

                    {/* Açıklama: hover'a bağlı tek bilgi değil — tıklayınca da açılır,
                        yani dokunma ve klavye kullanıcıları da bilgiyi alır. */}
                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-seal ${
                        isOpen
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="pb-7 pl-[3.1rem] text-[15px] leading-[1.7] text-on-paper-muted md:pl-[3.6rem]">
                          {s.detail}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
