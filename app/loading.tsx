import { Logo } from "@/components/brand/MuhurMark";

/**
 * YÜKLEME EKRANI — rota geçişi sırasında.
 *
 * TASARIM: gerçek logo + kelime markası + TEK ince daire. Üçten fazla öğe
 * yoktur; spinner, yüzde, sayaç veya ilerleme çubuğu YOKTUR.
 *
 * NEDEN SUNUCU BİLEŞENİ: bu ekran JavaScript'in yüklenmesini beklemez, bu
 * yüzden ilk boyamada anında görünür. "use client" olsaydı JS indirilene
 * kadar ekran BOŞ kalırdı — yani loader'ın kendisi yavaşlığa dönüşürdü.
 *
 * NEDEN YAPAY GECİKME YOK: rota geçişi doğal olarak birkaç yüz ms sürer.
 * Daha uzun sürmesi için bekleme eklemek navigasyonu BILEREK yavaşlatır;
 * yavaşlığın amacı loader'ı göstermek olamaz.
 *
 * HAREKET: daire yalnızca bir tur döner. `prefers-reduced-motion` altında
 * `globals.css` genel kuralı süreyi ~0'a indirdiği için ekran statik görünür,
 * ayrı bir JS dalı veya `@media` bloğu gerekmez.
 *
 * Erişilebilirlik: dekoratif daire `aria-hidden`; görünür metin yalnızca
 * marka adı. `role="status"` + `aria-live="polite"` ilerleme UYDURMAZ —
 * "Yükleniyor" yazısı ekran okuyucuya ne olup bittiğini bildirmediği için
 * sessiz geçiş daha dürüst.
 */
export default function Loading() {
  return (
    <div
      className="flex min-h-[60svh] w-full flex-col items-center justify-center gap-7 bg-ink px-5"
      aria-hidden="true"
    >
      <Logo className="h-14 w-14" />

      <span className="font-display text-[22px] leading-none text-on-ink">
        Mühür Studio
      </span>

      {/* Tek ince daire: gövde yok, yalnızca 1px kenar. Markanın
          hairline diliyle aynı ailede — dekoratif bir "spinner" değil. */}
      <span className="seal-loader block h-5 w-5 rounded-full border border-line-ink" />
    </div>
  );
}
