import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "seal" | "outline" | "ghost";
type Size = "md" | "lg";

const base =
  "group relative inline-flex items-center justify-between gap-6 rounded-seal border text-left transition-colors duration-200 ease-seal";

const variants: Record<Variant, string> = {
  // Tek dolgu rengi: mühür kırmızısı.
  // Hover'da metin FİLDİŞİ olur, kırmızı değil: şeffaf zemin koyu (ink)
  // olduğu için #C23B22 metin olarak 3.75:1 verir ve 4.5:1'i geçmez. Kırmızı
  // hover'da yalnızca ÇERÇEVEde kalır — marka vurgusu korunur, kontrast düzelir.
  seal: "border-seal bg-seal text-on-ink hover:bg-transparent hover:text-on-ink",
  outline: "border-line-ink text-on-ink hover:border-on-ink",
  ghost: "border-transparent text-on-ink-muted hover:text-on-ink",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-3 text-[13px] font-medium tracking-[0.02em]",
  lg: "px-6 py-4 text-[14px] font-medium tracking-[0.02em] sm:px-8 sm:py-5 sm:text-[15px]",
};

interface Props {
  children: ReactNode;
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  external?: boolean;
  "aria-label"?: string;
}

/** Mühür CTA sistemi: dikdörtgen, 4px köşe, minimal yön oku. */
export function MuhurLink({
  children,
  href,
  variant = "seal",
  size = "lg",
  className = "",
  external,
  ...rest
}: Props) {
  const isMail = href.startsWith("mailto:");
  const isHash = href.startsWith("#");
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  const inner = (
    <>
      <span className="relative z-[1]">{children}</span>
      <span
        aria-hidden="true"
        className="relative z-[1] flex h-[10px] w-[22px] shrink-0 items-center"
      >
        <span className="h-px w-full bg-current transition-transform duration-200 ease-seal group-hover:translate-x-[3px]" />
        <span className="absolute right-0 h-[7px] w-[7px] rotate-45 border-r border-t border-current transition-transform duration-200 ease-seal group-hover:translate-x-[2px]" />
      </span>
    </>
  );

  if (external || isMail) {
    return (
      <a
        href={href}
        className={cls}
        {...(isMail ? {} : { target: "_blank", rel: "noopener noreferrer" })}
        {...rest}
      >
        {inner}
      </a>
    );
  }

  if (isHash) {
    return (
      <a href={href} className={cls} {...rest}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={cls} {...rest}>
      {inner}
    </Link>
  );
}
