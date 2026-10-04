import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "X-Powered-By: Next.js" sürüm sızdırır; işe yaramaz, kapatılır.
  poweredByHeader: false,

  images: {
    // Arşiv plakaları SVG'dir. Next'in görüntü iyileştiricisi SVG'yi
    // güvenlik nedeniyle varsayılan olarak reddeder; bu yüzden açıkça izin
    // verilir ve içerik güvenlik politikası sıkılaştırılır.
    // Gerçek ekran görüntüleri (jpg/png/webp) yine de optimize edilir.
    // `contentSecurityPolicy`, /_next/image üzerinden DÖNEN gövdeye uygulanır:
    // script kaynakları kapatılır → SVG içindeki betik çalışamaz (XSS).
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  /**
   * GÜVENLİK BAŞLIKLARI (§25/§26/§30) — yalnızca yan etkisi OLMAYAN dördü.
   *
   *  nosniff            MIME sniffer'ı kapatır. SVG/JSON/JS karıştırılmasını
   *                      engeller. Hiçbir görsel/font/3D etkisi yoktur.
   *  X-Frame-Options    SAMEORIGIN → sayfa başka bir sitede çerçeve içinde
   *                      açılamaz (clickjacking). Kendi sayfalarımız
   *                      aynı origin'dedir, dolayısıyla etkilenmez.
   *  Referrer-Policy    Çapraz origin'e yalnızca origin gider; reklam/tracking
   *                      yok, bu yüzden hem güvenli hem yeterlidir.
   *  Permissions-Policy  Kamera/mikrofon/coğrafi konum isteği YOK; site bu
   *                      API'leri hiç çağırmaz — erişimi kapatmak zararsızdır.
   *
   * GENEL CSP BİLEREK EKLENMEDİ (§26: "CSP, 3D/görsel/font/Next'i bozmasın").
   * App Router'ın önceden ürettiği HTML'e satır içi hydration betikleri gömülüdür.
   * Katı bir CSP için her satır içi betiğin nonce/hash üretmesi gerekir — bu
   * da statik önrender + RSC ile middleware kurulumu demektir. Yarı-yarıya
   * gevşek bir CSP (`script-src 'unsafe-inline'`) ise XSS'e karşı koruma
   * SAĞLAMAZ, yani sahte bir güvenlik duygusu yaratır. Bu yüzden: yok.
   * Görsel tarafı zaten `images.contentSecurityPolicy` ile korunuyor.
   *
   * HSTS YALNIZCA GERÇEK HTTPS ALAN ADI VERİLDİĞİNDE eklenmeli;
   * `site.siteUrl` boşken (şu anki durum) eklenmesi yanıltıcı olurdu.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
