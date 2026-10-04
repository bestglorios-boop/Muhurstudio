import Link from "next/link";
import { MuhurLink } from "@/components/ui/MuhurLink";
import { FallbackSeal } from "@/components/three/FallbackSeal";

/** Hata durumu da markalıdır. "Burada bir iz yok." */
export default function NotFound() {
  return (
    <div className="relative overflow-hidden bg-ink">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-end overflow-hidden opacity-60">
        <div className="h-[70vh] max-h-[520px] w-[70vw] max-w-[520px] shrink-0 -mr-[8%]">
          <FallbackSeal />
        </div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[70svh] max-w-[1680px] flex-col justify-center px-5 py-24 md:px-10 xl:px-14">
        <p className="label mb-8 flex items-center gap-3 text-on-ink-muted">
          404
        </p>

        <h1 className="max-w-[16ch] font-display text-[clamp(44px,8vw,96px)] leading-[0.98]">
          Burada bir iz yok.
        </h1>

        <p className="prose-muhur mt-8 max-w-[42ch] text-on-ink-muted">
          Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir. Ana sayfaya
          dönüp arşivden devam edebilirsiniz.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <MuhurLink href="/" size="lg" className="w-full sm:w-auto">
            Ana sayfaya dön
          </MuhurLink>
          <Link
            href="/work"
            className="hairline self-start px-1 py-1 text-[15px] text-on-ink-muted transition-colors duration-200 hover:text-on-ink"
          >
            Çalışmaları gör
          </Link>
        </div>
      </div>
    </div>
  );
}
