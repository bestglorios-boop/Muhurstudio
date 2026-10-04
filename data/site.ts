/**
 * MÜHÜR STUDIO — SİTE KİMLİĞİ
 * ---------------------------------------------------------------------------
 * Stüdyo kimliği, iletişim bilgileri ve sabit metinlerin TEK kaynağı.
 * Arayüz metinlerinin tamamı Türkçedir.
 *
 * DÜZENLEME: Site metnini değiştirmek için yalnızca bu dosyayı düzenleyin.
 * Üretim alan adı bilinmiyorsa siteUrl boş bırakılır; alan adı bilinmeden canonical ve OG görseli üretilmez.
 */

export const site = {
  name: "Mühür Studio",
  wordmarkShort: "MÜHÜR",
  tagline: "Dijital iz bırakır.",

  /** Üretim alan adı bilinmiyorsa boş bırakılır. */
  siteUrl: "",

  description:
    "Bursa merkezli bağımsız web tasarım ve geliştirme stüdyosu. Web siteleri ve dijital deneyimler tasarlanır ve geliştirilir.",

  meta: {
    locale: "tr_TR",
    title: "Mühür Studio — Dijital iz bırakır.",
    description:
      "Bursa merkezli bağımsız web tasarım ve geliştirme stüdyosu. Az iş, özenli iş.",
  },

  /** E-posta bağlantıları doğrudan kullanılır. Sunucu tarafı form yok. */
  email: "muhur.studio@gmail.com",

  /**
   * WhatsApp — doğrudan iletişim kanalı.
   * `number` uluslararası biçimde ve BAŞINDA "+" OLMADAN yazılır; wa.me
   * bağlantısı bu değerden üretilir. Ekranda gösterilen biçim ayrıdır.
   */
  whatsapp: {
    number: "905399542171",
    display: "0539 954 21 71",
  },

  social: {
    instagram: "https://www.instagram.com/muhur.studio/",
    instagramHandle: "@muhur.studio",
    linkedin: "https://www.linkedin.com/in/muhurstudio",

    /**
     * BİRİNCİL CTA HEDEFİ — §2/§16/§43.
     *
     * "Proje Başlatalım" ARTIK e-posta DEĞİL, doğrudan WhatsApp açar.
     * `site.primaryActionHref` TEK kaynaktır; tüm MuhurLink'ler bunu kullanır.
     * E-posta ayrı bir iletişim yöntemi olarak kalır (§2B).
     *
     * Neden temiz URL: önceden doldurulmuş metin (`?text=...`) Türkçe karakter
     * kodlaması + kırık satır varsayımıyla kırılganlaşır; ayrıca görevin §2A
     * maddesi mesajı İSTEĞE BAĞLI bırakır. Karar: temiz bağlantı.
     * Bundan böyle CTA metniyle oynanmaz; hedef değişirse YALNIZCA burası değişir.
     */
    primaryActionHref: "https://wa.me/905399542171",
  },

  location: {
    city: "Bursa",
    country: "Türkiye",
    label: "Bursa · Türkiye",
    remote: "Uzaktan çalışıyoruz.",
  },

  /** Tek birincil eylem. Site genelinde başka birincil CTA kullanılmaz. */
  primaryCta: "Proje Başlatalım",
  secondaryCta: "Çalışmaları Gör",
  secondaryCtaHref: "/work",

  nav: [
    { label: "Çalışmalar", href: "/work" },
    { label: "Hizmetler", href: "/#hizmetler" },
    { label: "Yaklaşımımız", href: "/#yaklasim" },
    { label: "Hakkımızda", href: "/about" },
  ],

  /** Gezinme ve alt bilgi gibi tekrar eden yerlerde kullanılan kısa ifadeler. */
  statements: {
    short: "Az iş. Özenli iş.",
    philosophy:
      "İyi tasarım sadece güzel görünmez. Bir şey hissettirir.",
    triptych: "Tasarım · Kod · Deneyim",
    signoff: "Bir iz bırakalım.",
  },

  /** Anasayfa bölüm başlıkları. */
  sections: {
    introLabel: "Stüdyo",
    workLabel: "Seçili Çalışmalar",
    workIndexLabel: "Tüm çalışmalar",
    servicesLabel: "Hizmetler",
    approachLabel: "Yaklaşımımız",
    manifestoLabel: "Manifesto",
    contactLabel: "İletişim",
  },
} as const;

export const navigation = site.nav;

export default site;
