import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getAdjacentProjects, getProject, projects } from "@/data/projects";
import { site } from "@/data/site";
import { ProjectImage } from "@/components/project/ProjectImage";
import { RevealCrop } from "@/components/motion/Reveal";
import { MuhurLink } from "@/components/ui/MuhurLink";

const RATIO: Record<string, string> = {
  "16/9": "16 / 9",
  "3/2": "3 / 2",
  "4/5": "4 / 5",
  "1/1": "1 / 1",
  "21/9": "21 / 9",
};

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return { title: "Çalışma bulunamadı" };

  return {
    title: p.title,
    description: p.summary,
    alternates: site.siteUrl ? { canonical: `/work/${p.slug}` } : undefined,
    openGraph: {
      title: `${p.title} — Mühür Studio`,
      description: p.summary,
      type: "article",
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const { prev, next } = getAdjacentProjects(project.slug);

  // Yalnızca gerçekten var olan alanlar render edilir; boş düğme üretilmez.
  const meta: { label: string; value: string }[] = [
    { label: "Yıl", value: project.year },
    { label: "Tür", value: project.type },
    { label: "Durum", value: project.status },
  ];
  if (project.role) meta.push({ label: "Rol", value: project.role });

  return (
    <article className="bg-ink">
      {/* 01 — Başlık + özet */}
      <header className="mx-auto max-w-[1680px] px-5 pt-14 pb-12 md:px-10 md:pt-20 md:pb-16 xl:px-14">
        <div className="grid grid-cols-12 gap-x-6 gap-y-8">
          <div className="col-span-12 md:col-span-8">
            <p className="label mb-8 flex items-center gap-3 text-on-ink-muted">
              <span className="seal-index">{project.index}</span>
              <span aria-hidden="true" className="h-px w-8 bg-line-ink" />
              <Link href="/work" className="tap transition-colors duration-200 hover:text-on-ink">
                Çalışmalar
              </Link>
            </p>
            <h1 className="font-display text-[clamp(46px,9vw,104px)] leading-[0.98]">
              {project.title}
            </h1>
            {project.subtitle && (
              <p className="mt-5 font-display text-[clamp(20px,2.6vw,30px)] text-on-ink-muted">
                {project.subtitle}
              </p>
            )}
          </div>

          <div className="col-span-12 md:col-span-4 md:self-end">
            <p className="prose-muhur text-on-ink-muted">{project.summary}</p>
          </div>
        </div>
      </header>

      {/* 02 — Meta bilgi */}
      <div className="mx-auto max-w-[1680px] px-5 md:px-10 xl:px-14">
        <dl className="grid grid-cols-2 gap-y-6 border-y border-line-ink py-7 md:grid-cols-4">
          {meta.map((m) => (
            <div key={m.label}>
              <dt className="label mb-2 text-on-ink-muted">{m.label}</dt>
              <dd className="text-[15px]">{m.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* 03 — Kapak görsel */}
      <div className="mx-auto max-w-[1680px] px-5 pt-14 md:px-10 md:pt-20 xl:px-14">
        <RevealCrop>
          <ProjectImage
            src={project.cover}
            alt={project.coverAlt}
            ratio={RATIO[project.coverRatio]}
            sizes="(min-width:1280px) 1400px, 100vw"
            priority
          />
        </RevealCrop>
      </div>

      {/* 04 — AMAÇ (konsept çalışmada "Sorun" başlığı kullanılmaz:
          belgelenmiş bir müşteri problemi yoktur) */}
      <Section n="01" title="Amaç">
        <ul className="space-y-4">
          {project.aim.map((t) => (
            <li key={t} className="flex gap-4 text-[17px] leading-[1.62]">
              <span aria-hidden="true" className="mt-[0.7em] h-px w-4 shrink-0 bg-line-ink" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* 05 — YAKLAŞIM */}
      <Section n="02" title="Yaklaşım" onPaper>
        <ul className="space-y-4">
          {project.approach.map((t) => (
            <li key={t} className="flex gap-4 text-[17px] leading-[1.62]">
              <span aria-hidden="true" className="mt-[0.7em] h-px w-4 shrink-0 bg-line-paper" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* 06 — Galeri */}
      {project.gallery && project.gallery.length > 0 && (
        <section className="mx-auto max-w-[1680px] px-5 py-20 md:px-10 md:py-28 xl:px-14">
          <div className="grid grid-cols-12 items-end gap-x-6 gap-y-8">
            <div className="col-span-12 md:col-span-4">
              {/* seal-index: kâğıt zeminde kırmızı, koyu zeminde fildişi.
                  #C23B22 koyu zeminde 3.75:1 verir (11px için gereken 4.5:1'i
                  geçmez) — bu yüzden koyu zeminde kırmızı KULLANILMAZ. */}
              <p className="label flex items-center gap-3 text-on-ink-muted">
                <span className="seal-index">03</span>
                <span className="h-px w-8 bg-line-ink" aria-hidden="true" />
                Görseller
              </p>
            </div>
            {/* Ölçülü: farklı genişliklerde, tek düzende değil. */}
            <div className="col-span-12 grid grid-cols-12 gap-6 md:col-span-8">
              {project.gallery.map((g, i) => (
                <RevealCrop
                  key={`${g.src}-${i}`}
                  className={i === 0 ? "col-span-12" : "col-span-12 sm:col-span-7"}
                  delay={i * 0.06}
                >
                  <ProjectImage
                    src={g.src}
                    alt={g.alt}
                    ratio={RATIO[g.ratio]}
                    sizes="(min-width:768px) 45vw, 100vw"
                  />
                </RevealCrop>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 07 — SONUÇ */}
      <Section n="04" title="Sonuç">
        <p className="max-w-[62ch] text-[17px] leading-[1.66]">{project.result}</p>
      </Section>

      {/* 08 — Kaynaklar: yalnızca gerçekten varsa */}
      {(project.liveUrl || project.sourceUrl) && (
        <div className="mx-auto max-w-[1680px] px-5 pb-16 md:px-10 xl:px-14">
          <div className="flex flex-wrap gap-3">
            {project.liveUrl && (
              <MuhurLink href={project.liveUrl} variant="outline" size="md" external>
                Canlıda Gör
              </MuhurLink>
            )}
            {project.sourceUrl && (
              <MuhurLink href={project.sourceUrl} variant="outline" size="md" external>
                Kaynağı Gör
              </MuhurLink>
            )}
          </div>
        </div>
      )}

      {/* 09 — Önceki / Sonraki proje: dev bir CTA kartı değil, editoryal devam. */}
      <nav aria-label="Proje gezinmesi" className="border-t border-line-ink">
        <div className="mx-auto max-w-[1680px] px-5 md:px-10 xl:px-14">
          <ul className="grid grid-cols-1 md:grid-cols-2">
            <li className="border-b border-line-ink py-10 md:border-b-0 md:border-r md:py-14 md:pr-10">
              {prev ? (
                <Link href={`/work/${prev.slug}`} className="group block">
                  <span className="label flex items-center gap-3 text-on-ink-muted">
                    <span aria-hidden="true">←</span> Önceki Proje
                  </span>
                  <span className="mt-4 block font-display text-[clamp(28px,4vw,48px)] leading-none transition-transform duration-200 ease-seal group-hover:translate-x-1.5">
                    {prev.title}
                  </span>
                </Link>
              ) : (
                <span className="label text-on-ink-muted">Arşivin başındasınız</span>
              )}
            </li>
            <li className="py-10 md:py-14 md:pl-10 md:text-right">
              {next ? (
                <Link href={`/work/${next.slug}`} className="group block">
                  <span className="label flex items-center gap-3 text-on-ink-muted md:justify-end">
                    Sonraki Proje <span aria-hidden="true">→</span>
                  </span>
                  <span className="mt-4 block font-display text-[clamp(28px,4vw,48px)] leading-none transition-transform duration-200 ease-seal group-hover:-translate-x-1.5">
                    {next.title}
                  </span>
                </Link>
              ) : (
                <span className="label text-on-ink-muted">Arşivin sonu</span>
              )}
            </li>
          </ul>
        </div>
      </nav>
    </article>
  );
}

/** Ortak bölüm kalıbı: numara + başlık + dar metin ölçüsü. */
function Section({
  n,
  title,
  children,
  onPaper,
}: {
  n: string;
  title: string;
  children: ReactNode;
  onPaper?: boolean;
}) {
  return (
    <section className={onPaper ? "on-paper bg-paper text-on-paper" : "bg-ink"}>
      <div className="mx-auto max-w-[1680px] px-5 py-20 md:px-10 md:py-28 xl:px-14">
        <div className="grid grid-cols-12 gap-x-6 gap-y-8">
          <h2
            className={`label col-span-12 flex items-center gap-3 md:col-span-3 ${
              onPaper ? "text-on-paper-muted" : "text-on-ink-muted"
            }`}
          >
            <span className="seal-index">{n}</span>
            <span
              aria-hidden="true"
              className={`h-px w-8 ${onPaper ? "bg-line-paper" : "bg-line-ink"}`}
            />
            {title}
          </h2>
          <div className="col-span-12 md:col-span-7 md:col-start-5">{children}</div>
        </div>
      </div>
    </section>
  );
}

