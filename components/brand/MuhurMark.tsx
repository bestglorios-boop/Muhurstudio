import Image from "next/image";

/**
 * Mühür Studio logosu.
 *
 * GERÇEK LOGO MARKASI: sekizgen mühür — dışta siyah sekizgen gövde, içinde
 * ince beyaz sekizgen halka ve merkezde "M". Bu, stüdyonun gerçek mark
 * işaretidir; muhurdan üretilmiş bir varyant değildir.
 *
 * NEDEN AYRI BİR DOSYA:
 * Marka dosyası değişirse (yeni ikon dosyası, farklı kenar yumuşatma, farklı
 * oran) tek yer güncellenir. Logo bir "dokunulmazlık sınırı"dır:
 *   public/icons/logo.svg  →  gerçek marka dosyası
 * Gerçek dosya geldiğinde buradaki yol değiştirilir; boyut/renk değerleri
 * navigasyonun tasarım ölçüsüne göre ayarlanır, başka hiçbir yer değişmez.
 */

/** Marka dosyasının yolu. Gerçek dosya geldiğinde YALNIZCA burası güncellenir. */
export const LOGO_SRC = "/icons/logo.svg";

/**
 * Marka işareti. Kırmızı vurgu rengi YOK: sekizgen mühür siyah/beyaz
 * çalışır ve kırmızı yalnızca arayüzde (indeks, hover) kullanılır.
 *
 * `alt` boş bırakıldığında dekoratif sayılır ve ekran okuyucuya bildirilmez.
 */
export function Logo({
  className = "",
  alt = "",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <Image
      src={LOGO_SRC}
      alt={alt}
      width={256}
      height={256}
      priority
      /*
       * unoptimized — ZORUNLU.
       *
       * Marka işareti ~1 KB'lık bir SVG'dir; rasterleştirmeye/optimizasyona
       * ihtiyacı yoktur (bkz. ProjectImage'deki aynı karar). Optimizatör
       * devreye girdiğinde iki ayrı hata oluşur:
       *   1) SVG ad alanı yeniden yazımında bozulabiliyor,
       *   2) yanıta eklenen `Content-Security-Policy: ... sandbox` başlığı
       *      tarayıcının SVG'ye içsel ölçü atamasını engelliyor.
       * Sonuç: dosya 200 dönüyor, konsolda hata yok, ama görsel 0x0 boyutlu
       * olup KIRIK GÖRSEL İKONU olarak çiziliyordu. Yani logo sessizce yoktu.
       *
       * Doğrulama: `node scripts/img-check.mjs <port>` → naturalSize 256x256
       * olmalı. 0x0 ise bu bayrak yanlışlıkla kaldırılmış demektir.
       */
      unoptimized
      className={className}
    />
  );
}

/** Footer ve ikincil konumlarda kullanılan büyük M filigranı. */
export function MuhurGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 88" className={className} fill="none" aria-hidden="true">
      <path
        d="M2 86V2h11L50 42.4 87 2h11v84H86V26.4L50 66 14 26.4V86Z"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}
