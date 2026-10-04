"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { site } from "@/data/site";
import { MuhurLink } from "@/components/ui/MuhurLink";
import { Logo } from "@/components/brand/MuhurMark";

function isActive(pathname: string, href: string) {
  // Hash bağlantılar (/, /#hizmetler) asla "aktif" sayılmaz: bunlar
  // ana sayfadaki bölüm bağlantılarıdır, ayrı bir sayfa değildir.
  if (href.includes("#")) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Başlık: sayfaya entegre, yukarıda saydam. Kaydırmada yalnızca ince bir
 * ayrım çizgisi ve kontrast değişimi. Cam, blur, hap şekli, dev menü yok.
 */
export function Navigation() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  // Yol değişince menüyü kapat. Effect içinde setState çağırmak kademeli
  // render'a yol açar; bunun yerine render sırasında türetilir ve önceki
  // yol hafızada tutulur.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Menü açıkken arka plan kilitlenir.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Esc ile kapatma.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-[70] transition-colors duration-300 ${
        scrolled ? "border-b border-line-ink bg-ink" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1680px] items-center justify-between px-5 md:h-20 md:px-10 xl:px-14">
        <Link
          href="/"
          className="group flex items-center gap-3 py-1.5"
          aria-label={`${site.name} — ana sayfa`}
        >
          {/* Gerçek marka işareti. Kelime markası yanda kalır: logo tek başına
              değil, adıyla birlikte okunur.
              ORAN KORUNUR: Logo 256x256 kare bir varlıktır ve `h-* w-*` ile
              daima kare kalır; `object-cover`/esneme yoktur.
              BOYUT: marka 8-9px büyütüldü (h-9 / md:h-10). Sekizgen ince
              çizgili olduğu için 32px altında "M" seçilemiyordu. Başlık
              4rem/5rem yüksekliğinde ve marka 36/40px — hero'nun ~112px
              tipografisini kesinlikle yarışmaz. */}
          <Logo className="h-9 w-9 md:h-10 md:w-10" />
          <span className="font-display text-[19px] leading-none tracking-[-0.01em] md:text-[21px]">
            {site.name}
          </span>
        </Link>

        <nav aria-label="Ana gezinme" className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {site.nav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className="group inline-flex items-center gap-2 py-2 text-[14px] text-on-ink-muted transition-colors duration-200 hover:text-on-ink aria-[current]:text-on-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          {/* Mobilde başlık CTA'sı gizlidir: hero içinde zaten var.
              MuhurLink taban sınıfında `inline-flex` taşıdığı için gizleme
              bir sarmalayıcı üzerinden yapılır (sınıf çakışması olmasın). */}
          <span className="hidden sm:block">
            <MuhurLink href={site.social.primaryActionHref} size="md" external>
              {site.primaryCta}
            </MuhurLink>
          </span>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobil-menu"
            className="relative -mr-2 flex h-11 w-11 items-center justify-center rounded-seal lg:hidden"
          >
            <span className="sr-only">{open ? "Menüyü kapat" : "Menüyü aç"}</span>
            <span aria-hidden="true" className="relative block h-[10px] w-[22px]">
              <span
                className={`absolute left-0 top-0 h-px w-full bg-on-ink transition-transform duration-200 ease-seal ${
                  open ? "translate-y-[5px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[10px] h-px w-full bg-on-ink transition-transform duration-200 ease-seal ${
                  open ? "-translate-y-[5px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobil-menu"
          className="fixed inset-x-0 top-16 bottom-0 z-[60] overflow-y-auto border-t border-line-ink bg-ink lg:hidden"
        >
          <nav aria-label="Mobil gezinme" className="px-5 pt-2 pb-16 md:px-10">
            <ul>
              {site.nav.map((item, i) => (
                <li key={item.href} className="border-b border-line-ink">
                  <Link
                    href={item.href}
                    className="flex items-baseline justify-between py-6"
                    onClick={() => setOpen(false)}
                  >
                    <span className="font-display text-[34px] leading-none">{item.label}</span>
                    <span className="label text-on-ink-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-10 space-y-6">
              <MuhurLink href={site.social.primaryActionHref} size="lg" className="w-full" external>
                {site.primaryCta}
              </MuhurLink>
              <p className="text-[14px] text-on-ink-muted">
                {site.location.label} · {site.location.remote}
              </p>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
