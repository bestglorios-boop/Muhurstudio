"use client";

import Link from "next/link";
import { useState } from "react";
import type { Project } from "@/data/projects";
import { ProjectImage } from "@/components/project/ProjectImage";

const RATIO: Record<Project["coverRatio"], string> = {
  "16/9": "16 / 9",
  "3/2": "3 / 2",
  "4/5": "4 / 5",
  "1/1": "1 / 1",
  "21/9": "21 / 9",
};

/**
 * ARŞİV — müze kataloğu mantığı.
 * Satır: numara, başlık, yıl, kategori, durum. Görsel, satır etkinleştiğinde
 * yapışkan bir alanda belirir. İmleç değiştirilmez; dev imleç görseli yok.
 *
 * Dokunma cihazlarda görsel tamamen gizli değildir: küçük ekranlarda her proje
 * büyük bir editoryal giriş olarak listelenir. Bilgi yalnızca hover'a bağlı değildir.
 */
export function ProjectArchive({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<string | null>(null);
  const activeProject = projects.find((p) => p.slug === active);

  return (
    <div className="mx-auto max-w-[1680px] px-5 md:px-10 xl:px-14">
      <div className="grid grid-cols-12 gap-x-6">
        <ul className="col-span-12 border-t border-line-ink md:col-span-8 xl:col-span-7">
          {projects.map((p) => (
            <li key={p.slug} className="border-b border-line-ink">
              <Link
                href={`/work/${p.slug}`}
                onMouseEnter={() => setActive(p.slug)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(p.slug)}
                onBlur={() => setActive(null)}
                className="group grid grid-cols-12 items-baseline gap-x-4 gap-y-2 py-7 md:gap-x-6 md:py-9"
              >
                {/* Numara: kırmızı indeks, projeden küçük */}
                <span className="label col-span-2 text-on-ink-muted transition-colors duration-200 group-hover:text-on-ink md:col-span-1">
                  {p.index}
                </span>

                {/* Başlık: satırın en büyük öğesi, hafif kayma */}
                <span className="col-span-10 font-display text-[clamp(28px,4.4vw,52px)] leading-[1.04] transition-transform duration-200 ease-seal group-hover:translate-x-1.5 md:col-span-5">
                  {p.title}
                </span>

                <span className="label col-span-7 text-on-ink-muted md:col-span-3">
                  {p.type}
                </span>
                <span className="label col-span-5 text-on-ink-muted md:col-span-2">
                  {p.status}
                </span>
                <span className="label col-span-12 text-on-ink-muted md:col-span-1 md:text-right">
                  {p.year}
                </span>

                {/* Kısa açıklama: dar ölçüde, her zaman erişilebilir */}
                <span className="col-span-12 mt-3 max-w-[52ch] text-[15px] leading-[1.65] text-on-ink-muted md:col-span-11 md:col-start-2 md:mt-5">
                  {p.summary}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Yapışkan önizleme: masaüstünde satırla birlikte gelir, imleç değişmez. */}
        <div className="pointer-events-none sticky top-28 hidden self-start md:col-span-4 md:block md:pt-9 xl:col-span-4 xl:col-start-9">
          <div
            className="transition-opacity duration-300 ease-seal"
            style={{ opacity: active ? 1 : 0 }}
          >
            {activeProject && (
              <div className="overflow-hidden rounded-seal border border-line-ink">
                <ProjectImage
                  src={activeProject.cover}
                  alt={activeProject.coverAlt}
                  ratio="3/2"
                  sizes="(min-width:768px) 32vw, 0px"
                />
              </div>
            )}
            <p className="label mt-3 text-on-ink-muted">
              {activeProject ? `${activeProject.index} — ${activeProject.year}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Dokunma: küçük ekranlarda her proje büyük bir editoryal giriş olarak görünür. */}
      <ul className="mt-16 space-y-14 md:hidden">
        {projects.map((p) => (
          <li key={p.slug}>
            <Link href={`/work/${p.slug}`} className="group block">
              <ProjectImage
                src={p.cover}
                alt={p.coverAlt}
                ratio={RATIO[p.coverRatio]}
                sizes="100vw"
              />
              <div className="mt-4 flex items-baseline gap-4">
                <span className="seal-index">{p.index}</span>
                <span className="font-display text-[30px] leading-none">{p.title}</span>
                <span className="label ml-auto text-on-ink-muted">{p.year}</span>
              </div>
              <p className="label mt-2 text-on-ink-muted">
                {p.type} · {p.status}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
