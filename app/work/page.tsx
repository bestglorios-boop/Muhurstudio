import type { Metadata } from "next";
import { projects } from "@/data/projects";
import { site } from "@/data/site";
import { ProjectArchive } from "@/components/project/ProjectArchive";

export const metadata: Metadata = {
  title: "Çalışmalar",
  description:
    "Mühür Studio çalışmaları: web tasarım, arayüz ve tasarım sistemi konsept çalışmaları.",
  alternates: site.siteUrl ? { canonical: "/work" } : undefined,
};

/** Çalışmalar bir portfolyo ızgarası değil, bir arşivdir. */
export default function WorkPage() {
  return (
    <div className="bg-ink">
      <header className="mx-auto max-w-[1680px] px-5 pt-16 pb-14 md:px-10 md:pt-24 md:pb-20 xl:px-14">
        <div className="grid grid-cols-12 gap-x-6 gap-y-8">
          <div className="col-span-12 md:col-span-2">
            <p className="label flex items-center gap-3 text-on-ink-muted">
              Arşiv
            </p>
          </div>
          <div className="col-span-12 md:col-span-7">
            <h1 className="font-display text-[clamp(46px,9vw,110px)] leading-[0.98]">
              Çalışmalar
            </h1>
            <p className="prose-muhur mt-7 max-w-[46ch] text-on-ink-muted">
              {projects.length} çalışma. Her biri farklı bir tasarım yönünü
              araştırıyor.
            </p>
          </div>
        </div>
      </header>

      <ProjectArchive projects={projects} />

      {/* Arşiv kapanışı: tek bir eylem, tek bir yol. */}
      <section className="border-t border-line-ink">
        <div className="mx-auto max-w-[1680px] px-5 py-20 md:px-10 md:py-28 xl:px-14">
          <p className="max-w-[34ch] font-display text-[clamp(26px,3.6vw,42px)] leading-[1.14]">
            Aramak istediğiniz bir iş varsa yazın.
          </p>
          <p className="mt-5 text-[15px] text-on-ink-muted">
            {site.location.label} · {site.email}
          </p>
        </div>
      </section>
    </div>
  );
}
