"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Proje görseli.
 * Varsayılan: siyah-beyaz / desatüre (arşiv hissi).
 * Hover veya klavye odağı: kontrollü renk dönüşü + en fazla 1.02 ölçek.
 *
 * Hover'a bağlı TEK BİR bilgi yok: dokunma cihazlarda tüm bilgi
 * (başlık, kategori, yıl) metin olarak zaten görünür durumdadır.
 */
export function ProjectImage({
  src,
  alt,
  ratio,
  sizes,
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  ratio: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const svg = isSvg(src);

  return (
    <div
      className={`group/img relative overflow-hidden rounded-seal bg-ink-raised ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {failed ? (
        <ImageFallback alt={alt} />
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          // Arşiv plakaları vektörel SVG'dir ve birkaç KB'tır: rasterleştirilmeye
          // ihtiyaçları yok. Bu yüzden optimize edici devreye girmez ve
          // tembel yükleme de kullanılmaz — hem küçük dosyada bekleme süresini
          // ortadan kaldırır hem de sayfa açılır açılmaz plakalar hazır olur.
          unoptimized={svg}
          priority={priority || svg}
          loading={priority || svg ? undefined : "lazy"}
          onError={() => setFailed(true)}
          className="img-archival object-cover transition-[filter,transform] duration-500 ease-seal group-hover/img:scale-[1.02] group-focus-within/img:scale-[1.02]"
        />
      )}
    </div>
  );
}

function isSvg(src: string) {
  return src.split("?")[0].toLowerCase().endsWith(".svg");
}

/**
 * Görsel yüklenemezse: kırık görsel değil, markalı nötr bir yüzey.
 *
 * `alt=""` (dekoratif / yineleme) durumunda `role="img"` + boş ad
 * KULLANILMAZ: erişilebilir adı olmayan bir görsel, ekran okuyucuda
 * "resim" diye okunur ve WCAG 1.1.1'i ihlal eder. Bu durumda yedek yüzey
 * erişim ağacından tamamen çıkarılır. Tasarım, ölçü ve sınıflar aynıdır.
 */
function ImageFallback({ alt }: { alt: string }) {
  const yineleme = alt.trim() === "";
  return (
    <div
      role={yineleme ? undefined : "img"}
      aria-hidden={yineleme ? true : undefined}
      aria-label={yineleme ? undefined : alt}
      className="absolute inset-0 flex items-end justify-between border border-line-ink p-5"
    >
      <span className="label text-on-ink-muted">Görsel</span>
      <svg viewBox="0 0 40 40" className="h-8 w-8 text-[#1A1A1A]" aria-hidden="true">
        <path
          d="M2 38V2h6l12 18 12-18h6v36h-6.4V14.6L20 32.4 8.4 14.6V38Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
