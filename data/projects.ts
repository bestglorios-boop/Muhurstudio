/**
 * MÜHÜR STUDIO — PROJE VERİSİ
 * ===========================================================================
 * Bu dosya, projelerin TEK kaynağıdır. Arayüzdeki tüm proje metni buradan gelir.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * KONUMSAL ÇALIŞMA — AÇIKÇA BELİRTİLMİŞTİR
 * ───────────────────────────────────────────────────────────────────────────
 * Aşağıdaki iki proje de KONSEPT çalışmasıdır. Gerçek müşteri projeleri
 * DEĞİLDİR. Bu dosyada bilinçli olarak şunlar YOKTUR:
 *
 *   - müşteri adı, toplantı, brief
 *   - kullanıcı araştırması / pazar araştırması iddiası
 *   - ziyaretçi davranışı gözlemi ("kullanıcılar şurada zorlandı")
 *   - analitik, dönüşüm, satış, trafik, gelir ölçümü
 *   - performans veya dönüşüm iyileşmesi iddiası
 *   - müşteri yorumu / referans / ödül
 *
 * Proje adı bir kanıt DEĞİLDİR. "Notella" adından bir özellik çıkarılmaz.
 * Yazılan her cümle ya (a) tasarımın gerçekten yaptığı şeyi söyler ya da
 * (b) açıkça bir tasarım amacı/nihai olarak çerçevelenir. Ölçülmüş ya da
 * test edilmiş bir başarı iddiası yoktur.
 *
 * Görseller: /public/projects/<slug>/ altındaki plakalar gerçek ekran
 * görüntüsü DEĞİLDİR; nötr arşiv plakalarıdır (bkz. scripts/make-plates.mjs).
 * Bu yüzden metin, bu plakalarda görülebilen bir arayüzü tarif etmez.
 *
 * Gerçek proje eklendiğinde yalnızca bu dosyada güncellenir:
 *   title / subtitle / year / type / status / summary / role
 *   cover / gallery / liveUrl / sourceUrl / featured
 *
 * ÖNEMLİ: Gerçek değeri olmayan alan alanın TAMAMEN SİLİNİR; boş arayüz
 * üretilmez. Müşteri adı, ölçüm, yorum veya ödül bilgisi UYDURULMAZ.
 * ===========================================================================
 */

export type ProjectStatus =
  | "Konsept çalışma"
  | "Müşteri projesi"
  | "Deneysel çalışma"
  | "Devam ediyor";

export type Ratio = "16/9" | "3/2" | "4/5" | "1/1" | "21/9";

export interface Project {
  slug: string;
  /** Arşiv numarası. Manuel ve sabit tutulur. */
  index: string;
  title: string;
  subtitle?: string;
  year: string;
  type: string;
  status: ProjectStatus;
  /** Arşiv satırında ve detay sayfasının girişinde kullanılan kısa metin. */
  summary: string;
  role?: string;
  /**
   * Kapak görseli. Şu anda public/projects/<slug>/ altında üretilmiş nötr
   * "arşiv plakaları" vardır. Gerçek ekran görüntüleri eklendiğinde yalnızca
   * bu yolu güncellemeniz yeterlidir.
   */
  cover: string;
  coverAlt: string;
  /**
   * 2–6 arası görsel. Fazlası arşiv hissini bozar, ölçülü tutun.
   *
   * ALT KURALI: `alt` yalnızca görsel GERÇEKTEN bilgi taşıyorsa doldurulur.
   * Kapakla aynı dosya olan ya da aynı sayfada tekrar eden bir plaka
   * yinelemedir → `alt=""` (ekran okuyucu aynı plakayı iki kez okumaz).
   * Dekoratif/boş `alt` meşrudur; UYDURMA açıklama yazılmaz.
   */
  gallery?: { src: string; alt: string; ratio: Exclude<Ratio, "21/9"> }[];
  /** Görsel oranı — arşivin tek bir kalıba indirgenmemesi için. */
  coverRatio: Ratio;
  /**
   * Projenin amacı / tasarım yönü.
   * Konsept çalışmalarda "sorun" başlığı kullanılmaz: gerçek bir müşteri
   * problemi belgelenmediği için uydurma bir sorun anlatmak doğru olmaz.
   */
  aim: string[];
  approach: string[];
  result: string;
  liveUrl?: string;
  sourceUrl?: string;
  featured: boolean;
  /** Anasayfadaki kompozisyon varyantı: geniş / dar / ofset / satır. */
  featureLayout: "wide" | "narrow" | "offset" | "row";
}

export const projects: Project[] = [
  {
    slug: "notella",
    index: "01",
    title: "Notella",
    subtitle: "Not tutma arayüzü üzerine bir deneme",
    year: "2026",
    type: "Konsept · Arayüz",
    status: "Konsept çalışma",
    summary:
      "Not tutma deneyimini daha sakin ve tipografi merkezli bir arayüz üzerinden araştıran bir konsept çalışma.",
    role: "Konsept, tasarım, frontend",
    cover: "/projects/notella/kapak.svg",
    coverAlt:
      "Notella arşiv plakası: koyu zemin üzerinde iç içe ince elips konturları; altta proje adı ve arşiv etiketi.",
    coverRatio: "3/2",
    gallery: [
      // Kapakla AYNI dosya (kapak.svg) ve aynı oran: bu plaka aynı sayfada
      // kapaktan hemen sonra tekrar görünür. Görsel KALIR (tasarım/ölçü
      // değişmez) ama `alt=""` ile yineleme olarak işaretlenir; ekran
      // okuyucu aynı plakayı iki kez anlatmaz.
      { src: "/projects/notella/kapak.svg", alt: "", ratio: "3/2" },
      { src: "/projects/notella/kapak-2.svg", alt: "Notella arşiv plakası — dikey kural dizisi.", ratio: "4/5" },
    ],
    aim: [
      "Bu çalışmada not tutma deneyimini, arayüzü ayrı bir katmana değil doğrudan metne yaslayarak kurgulamayı denedik.",
      "Notun kendisini görünür kılmak ve notun etrafındaki gereksiz arayüz katmanlarını azaltmak tasarımın ana amacıydı.",
    ],
    approach: [
      "İçeriği kart yığını yerine tek bir tipografik eksen üzerinde düzenledik; her satır bir ölçü, her bölüm bir başlık.",
      "Paleti nötr bir zemin ve tek bir vurgu rengiyle sınırladık. Hiçbir öğe gölge taşımıyor.",
      "Ayırıcı olarak çizgi ve kutu yerine boşluk ve tipografi kullandık; arayüzün kendisini mümkün olduğunca geri planda tuttuk.",
      "Hareketi yalnızca düzenin değiştiği anlara sınırladık; dekoratif animasyon eklemedik.",
    ],
    result:
      "Ortaya çıkan yön, not alma deneyimini daha tipografik, sakin ve görsel olarak daha belirgin bir yapıda ele alıyor. Bu bir konsept çalışmadır.",
    featured: true,
    featureLayout: "wide",
  },
  {
    slug: "bursa-sofrasi",
    index: "02",
    title: "Bursa Sofrası",
    subtitle: "Tek sayfalık bir restoran konsepti",
    year: "2026",
    type: "Konsept · Web Tasarım",
    status: "Konsept çalışma",
    summary:
      "Menü, restoran bilgisi ve iletişim aksiyonunu tek sayfada toplayan sade bir restoran web konsepti.",
    role: "Konsept, tasarım, frontend",
    cover: "/projects/bursa-sofrasi/kapak.svg",
    coverAlt:
      "Bursa Sofrası arşiv plakası: koyu zemin üzerinde çapraz ince çizgi taraması; altta proje adı ve arşiv etiketi.",
    coverRatio: "16/9",
    gallery: [
      // Kapakla AYNI dosya (kapak.svg) ve aynı oran: yineleme → `alt=""`
      // (yukarıdaki Notella notuyla aynı gerekçe).
      { src: "/projects/bursa-sofrasi/kapak.svg", alt: "", ratio: "16/9" },
      // ÖLÇÜLEN İÇERİK: plakada BEŞ dikey kural ve KISALAN yatay ölçü
      // çizgileri var (public/projects/bursa-sofrasi/kapak-2.svg).
      // Eski metin ("iki sütunlu dikey düzen") plakada olmayan bir şeyi
      // anlatıyordu; alt metin varlığın kendisine göre düzeltildi.
      { src: "/projects/bursa-sofrasi/kapak-2.svg", alt: "Bursa Sofrası arşiv plakası — dikey kurallar ve kısalan yatay ölçü çizgileri.", ratio: "4/5" },
    ],
    aim: [
      "Bursa Sofrası için sade, tek sayfalık ve içeriğin hızlı okunabildiği bir restoran web deneyimi araştırdık.",
      "Menüyü, restoran bilgisini ve iletişim aksiyonunu tek bir akışta toplamak; ziyaretçiyi sayfalar arasında dolaştırmamak tasarımın amacıydı.",
    ],
    approach: [
      "Menü bilgisini açık bir tipografik hiyerarşiyle düzenledik: mutfak grupları ve kısa açıklamalar okunabilir bir ölçüde ilerliyor.",
      "İçeriği kartlara bölmek yerine güçlü tipografik hiyerarşi kullandık; her bölüm aynı ritimde ilerliyor.",
      "Restoran bilgisini (adres, saatler, iletişim) tek bir blok hâlinde topladık.",
      "İletişim aksiyonunu sayfa boyunca görünür tuttuk; araya form doldurma zorunlu bir adım koymadık.",
      "Gereksiz UI katmanlarından, dekoratif görsellerden ve ekran dolusu düzenlerden kaçındık.",
    ],
    result:
      "Sonuç, menü, restoran bilgisi ve iletişim aksiyonunu tek bir akışta birleştiren sade bir restoran konsepti oldu. Bu bir konsept çalışmadır.",
    featured: true,
    featureLayout: "narrow",
  },
];

export const featuredProjects = projects.filter((p) => p.featured);

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/** Arşiv sırasına göre bir projenin komşularını verir. */
export function getAdjacentProjects(slug: string): {
  prev?: Project;
  next?: Project;
} {
  const i = projects.findIndex((p) => p.slug === slug);
  if (i === -1) return {};
  return { prev: projects[i - 1], next: projects[i + 1] };
}

