import { site } from "@/data/site";

/**
 * WHATSAPP — kök seviyede, görünüre sabitlenmiş bağımsız denetim.
 *
 * NEDEN YENİDEN YAZILDI (eski hâli artık yamalanmıyor):
 *
 *  1) KONTRAST — ölçüm: gövde #141414, koyu zemin #080808 → 1.09:1.
 *     Yani dairenin kendisinin bir sınırı yok; ekranda yalnızca 28px'lik
 *     yeşil ikon duruyor. Sitenin çoğu koyu bölüm olduğu için denetim
 *     "yokmuş" gibi okunuyordu.
 *
 *  2) SAFE-AREA — eski `right` düz 16px idi. Çentikli cihazlarda YATAY
 *     modda `env(safe-area-inset-right)` ~44-47px'tir; denetim sensör
 *     bölgesinin altında kalıyordu. Headless Chrome bu değeri 0 döndürdüğü
 *     için otomatik testler "geçti" raporlarken gerçek cihazda kırpılıyordu.
 *
 *  3) TEK `bottom` BİLDİRİMİ — `calc(env(...) + 1.25rem)` geçersizse
 *     (env() desteklemeyen eski WebView / uygulama içi tarayıcı) tüm
 *     bildirim düşer, `bottom` → `auto` olur ve sabit denetim STATİK
 *     konumuna — yani `<Footer />` sonrasına, ~6000px aşağıya — park eder.
 *     Görünmez. Artık yedek VE güvenli değer AYRI bildirimlerdir.
 *
 *  4) KÖK SEVİYE — artık düzen sarmalayıcısının (`div.relative.z-[2]`)
 *     içinde değil, `<body>`'nin doğrudan çocuğudur. Yığın sırası açıkça:
 *     mobil menü (z-70) > WhatsApp (z-40) > sayfa içeriği (z-2).
 *
 * Görsel dil aynen korunur: tek daire, tek ikon, Mühür paleti.
 * Halka / pulse / glow / rozet / baloncuk YOK.
 */
export function WhatsAppButton() {
  const href = `https://wa.me/${site.whatsapp.number}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp'tan iletişime geç"
      className="wa-fab"
    >
      {/* Resmî WhatsApp glyph'i (marka yolu). Konteyner içinde 10px
          dolgu kalır; kenarlara değmez. translate-* YOK: flex
          items-center + justify-center merkezlemeyi yapar. */}
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        className="wa-fab__glyph"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.12-.01-.24-.01-.36-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.464 3.488" />
      </svg>
    </a>
  );
}

