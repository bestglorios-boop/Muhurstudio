/**
 * MÜHÜR STUDIO — YASAL METİNLER
 * ===========================================================================
 * Gizlilik, KVKK, Çerez ve Kullanım Koşulları metinlerinin TEK kaynağı.
 *
 * NEDEN AYRI DOSYA
 * Yasal metin uzundur ve nadiren değişir. Bileşenlere gömülürse her düzenleme
 * bir JSX dosyasını bozar ve dört sayfa aynı düzeni kopyalar. Burada her metin
 * düz veridir: başlık, giriş, bölümler, maddeler.
 *
 * İÇERİK KURALI — EN ÖNEMLİ MADDE
 * Bu metinler YALNIZCA sitenin GERÇEKTEN yaptığı şeyi anlatır. Bu depoda
 * bilinçli olarak şunlar YOKTUR ve metinlere DE EKLENMEZ:
 *
 *   - vergi dairesi / MERSİS / ticaret sicil numarası
 *   - şirket türü, unvan, temsilci adı
 *   - açık adres (site yalnızca "Bursa · Türkiye" ve "uzaktan çalışıyoruz" der)
 *   - analitik, reklam, oturum kaydı veya benzeri takip aracı (depoda YOK)
 *   - çerez onay kutusu / rıza yönetim aracı (depoda YOK)
 *   - ödeme, iade, teslim veya SLA taahhüdü
 *   - barındırma sağlayıcısının adı (doğrulanmamış)
 *
 * Sitede gerçekten bulunmayan bir şeyi varmış gibi anlatmak metni yanlış
 * kılmakla kalmaz, kullanıcıyı da yanıltır. Bilinmeyen bilgi UYDURULMAZ.
 * ===========================================================================
 */

import { site } from "@/data/site";

export interface LegalSection {
  /** Bölüm başlığı. Sayfada <h2> olarak render edilir. */
  heading: string;
  /** Normal paragraflar. */
  paragraphs?: string[];
  /** Madde listesi. Sayfada tireli liste olarak render edilir. */
  items?: string[];
}

export interface LegalDoc {
  /** Site içi yol. */
  href: string;
  /** Sayfa <h1> ve <title>. */
  title: string;
  /** Alt bilgi ve gezinme bağlantısı için kısa etiket. */
  navLabel: string;
  /** Sayfa üstündeki tek cümlelik tanım. */
  lead: string;
  /** <meta name="description"> ve OG açıklaması. */
  description: string;
  /** Belge dönemi. Sözleşme tarihi değil. */
  revised: string;
  /** Başlıktan hemen sonraki giriş paragraf(lar)ı. */
  intro: string[];
  sections: LegalSection[];
}

/**
 * Dört belge de aynı iletişim kanalını verir. Kanal değişirse (yeni adres,
 * yeni numara) dört sayfada dört ayrı düzeltme gerekmesin diye ortaklaştırıldı.
 */
const CLOSING: LegalSection = {
  heading: "İletişim",
  paragraphs: [
    `Bu metinle ilgili sorularınız ve talepleriniz için ${site.name} ile e-posta üzerinden iletişime geçebilirsiniz: ${site.email}.`,
    `${site.location.label} · ${site.location.remote}`,
  ],
};

/* ------------------------------------------------------------------ */
/* GİZLİLİK                                                          */
/* ------------------------------------------------------------------ */
const GIZLILIK: LegalDoc = {
  href: "/gizlilik",
  title: "Gizlilik Politikası",
  navLabel: "Gizlilik Politikası",
  lead: "Bu sayfa, sitede hangi bilgilerin hangi amaçla kullanıldığını açıklar.",
  description:
    "Mühür Studio gizlilik politikası: sitede hangi bilgilerin hangi amaçla toplandığı ve kullanıldığı.",
  revised: "2026",
  intro: [
    `${site.name} olarak, bu web sitesini ziyaretiniz sırasında hangi bilgilere eriştiğimizi ve ne yaptığımızı açıkça anlatmayı hedefliyoruz.`,
    `Bu politika yalnızca ${site.name} tarafından yayımlanan web sitesi için geçerlidir. Sitedeki arşiv çalışmalarının konsept olduğu ve gerçek müşteri projelerini içermediği ayrıca belirtilir.`,
  ],
  sections: [
    {
      heading: "Kapsam",
      paragraphs: [
        `Bu politika, ${site.name} tarafından yayımlanan web sitesinin tamamı için geçerlidir. Sitenin içeriğini görüntülemek, sayfalar arasında gezinmek veya bir bağlantıya tıklamak bu kapsamdadır.`,
      ],
    },
    {
      heading: "Toplanan bilgiler",
      paragraphs: [
        "Sitede üyelik, hesap açma veya iletişim formu bulunmadığı için ziyaretçilerden ad, adres, telefon veya ödeme bilgisi istenmez. Site üzerinden yalnızca aşağıdaki bilgilerle ilişkili olabiliriz:",
      ],
      items: [
        "Sunucu kayıtları: ziyaretin tarihi ve saati, istenen adres, kullanılan tarayıcı ve işletim sistemi bilgisi ve bağlantı sırasında atanan IP adresi. Bu kayıtlar sitenin sunucusu tarafından, hizmetin çalışması ve güvenliği için tutulur.",
        "Bize doğrudan yazdıklarınız: WhatsApp, e-posta, Instagram veya LinkedIn üzerinden ilettiğiniz mesajlarda kendinizle ilgili olarak paylaştığınız bilgiler.",
        "Site içi teknik tercihler: bu çerez politikasının konusu olmayan, yalnızca görüntüyü doğru ölçekte göstermeye yarayan ve sayfa yenilendiğinde silinen tarayıcı ayarları.",
      ],
    },
    {
      heading: "Kullanım amaçları",
      items: [
        "Sitenin hatasız ve erişilebilir biçimde çalışmasını sağlamak ve güvenlik açıklarını tespit etmek.",
        "Gelen mesajları yanıtlamak ve proje taleplerini değerlendirmek.",
        "Yayımlanmış içeriği güncel tutmak.",
      ],
    },
    {
      heading: "Paylaşım",
      paragraphs: [
        "Ziyaretçi bilgilerini satmıyoruz, takas etmiyoruz ve reklam amacıyla paylaşmıyoruz.",
        "Bilgilerin paylaşılabileceği durumlar sınırlıdır:",
      ],
      items: [
        "Bu sitenin barındırılmasını sağlayan altyapının sunucu kayıtlarını tutması gerektiği ölçüde. Bu kayıtların sorumluluğu ilgili altyapı sağlayıcısındadır.",
        "Bize WhatsApp, Instagram veya LinkedIn üzerinden yazıyorsanız, o platformların kendi gizlilik ve veri işleme kuralları geçerli olur; bu platformlar Türkiye dışında veri işleyebilir.",
        "Yasal olarak zorunlu hâllerde yetkili kamu kurumlarıyla.",
      ],
    },
    {
      heading: "Saklama",
      paragraphs: [
        "Sunucu kayıtları yalnızca hizmetin güvenli biçimde çalışması için gereken süre boyunca tutulur. Bize iletilen mesajlar ise konuşmanın sonuçlandırılması ve varsa yasal yükümlülükler açısından gereken süre boyunca saklanır; bu süre dolduğunda silinir.",
      ],
    },
    {
      heading: "Dış bağlantılar",
      paragraphs: [
        "Sitede WhatsApp, Instagram ve LinkedIn bağlantıları bulunur. Bu bağlantılar üzerinden tıklandığında ilgili platformun kendi gizlilik politikası geçerli hâle gelir. Sitede bunların dışında üçüncü taraf içerik, gömülü servis veya reklam ağı bulunmaz.",
      ],
    },
    {
      heading: "Güvenlik",
      paragraphs: [
        "Site HTTPS üzerinden sunulur ve veri iletimi şifrelidir. Yine de hiçbir internet aktarımının %100 güvenli olduğu iddia edilemez. Bize ilettiğiniz kişisel bilgileri, kendi iletişim kanalınızda görmeniz gerektiği şekilde paylaşmamaya özen gösterin.",
      ],
    },
    {
      heading: "Çocukların gizliliği",
      paragraphs: [
        "Site genel izleyiciye açıktır ve bilinçli olarak çocuklara yönelik değildir. Kimliği doğrudan belirleyebilecek bilgiler toplamak için tasarlanmamıştır.",
      ],
    },
    {
      heading: "Politikanın güncellenmesi",
      paragraphs: [
        "Sitede veya bu metinde bir değişiklik yapılırsa, sayfanın üst kısmındaki güncelleme bilgisi güncellenir. Geçmiş sürümler için ayrı bir arşiv tutulmaz.",
      ],
    },
    CLOSING,
  ],
};
/* ------------------------------------------------------------------ */
/* KVKK                                                               */
/* ------------------------------------------------------------------ */
const KVKK: LegalDoc = {
  href: "/kvkk",
  title: "KVKK Aydınlatma Metni",
  navLabel: "KVKK Aydınlatma Metni",
  lead: "6698 sayılı KVKK kapsamında hangi kişisel verilerin hangi amaçla işlendiğini açıklar.",
  description:
    "Mühür Studio KVKK aydınlatma metni: işlenen kişisel veri kategorileri, amaçları, hukuki sebepleri ve ilgili kişinin hakları.",
  revised: "2026",
  intro: [
    `6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla ${site.name} tarafından kişisel verilerin hangi amaçla işlendiğini bu metinle açıklarız.`,
    "Bu metin yalnızca işleme faaliyeti kapsamında toplayabildiğimiz bilgileri anlatır. Sitede üyelik, profil, ödeme veya iletişim formu bulunmadığı için bu metinde bunlara ilişkin bir işleme faaliyeti tarif edilmemiştir.",
  ],
  sections: [
    {
      heading: "Veri sorumlusu",
      paragraphs: [
        `Veri sorumlusu: ${site.name}`,
        `Konum: ${site.location.label} — ${site.location.remote}`,
        `İletişim: ${site.email}`,
        "Bu metinde şirket sicil numarası, vergi numarası veya unvan bilgisi verilmemektedir; bu bilgiler kamuya açık kayıtlardan alınır ve metnin konusu değildir.",
      ],
    },
    {
      heading: "İşlenebilen kişisel veri kategorileri",
      paragraphs: [
        "Sitede otomatik yolla veya elektronik ortamda toplayabildiğimiz kişisel veri aşağıdaki kategorilerle sınırlıdır:",
      ],
      items: [
        "Kimlik bilgisi: yalnızca bize yazarsanız mesajın içinde kendinizi belirten ad, kullanıcı adı veya imza bilgisi.",
        "İletişim bilgisi: bize verdiğiniz e-posta adresi, WhatsApp numarası veya sosyal medya hesap adresi.",
        "İşlem / talep bilgisi: bir proje fikri, web sitesi ihtiyacı veya bize ilettiğiniz konu kapsamındaki açıklama.",
        "Teknik bilgi: IP adresi, istek zamanı, istenen adres ve tarayıcı bilgisi (sunucu kayıtları).",
        "Özel nitelikli kişisel veri: bu site üzerinden bilinçli olarak talep edilmez ve işlenmez.",
      ],
    },
    {
      heading: "İşleme amaçları",
      items: [
        "Web sitesinin teknik olarak çalışmasının sağlanması, hataların giderilmesi ve güvenliğin korunması.",
        "Bize iletilen proje ve iş birliği taleplerinin değerlendirilmesi ve yanıtlanması.",
        "Yayımlanmış içeriğin güncel tutulması.",
        "Hukuki yükümlülüklerimizin yerine getirilmesi.",
      ],
    },
    {
      heading: "Toplama yöntemi",
      paragraphs: ["Verileriniz iki yolla toplanır:"],
      items: [
        "Teknik yolla: siteyi ziyaretiniz sırasında sunucu tarafından otomatik olarak oluşturulan güvenlik ve çalışma kayıtları.",
        "Beyan yoluyla: WhatsApp, e-posta, Instagram veya LinkedIn üzerinden bize kendiniz ileterek paylaştığınız bilgiler.",
      ],
    },
    {
      heading: "İşleme hukuki sebepleri",
      paragraphs: [
        "Kişisel verileriniz aşağıdaki hukuki sebeplerden birine dayanılarak işlenir:",
      ],
      items: [
        "KVKK m.5/1-f — Sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olduğu ölçüde: bir proje talebinizi değerlendirmek ve yanıtlamak, ardından iş birliği kurulması hâlinde bu ilişkinin yürütülmesi.",
        "KVKK m.5/1-f — Sitenin sunulması: hizmetin çalışması için teknik olarak zorunlu olan sunucu kayıtlarının işlenmesi.",
        "KVKK m.5/1-a — Açık rıza: yalnızca hizmetin çalışması için gerekli olmayan ve talebiniz üzerine kurulmayan durumlarda, ayrıca ve açıkça onayınız istenirse.",
        "KVKK m.5/1-e — Kanun yoluyla hukuki yükümlülük: yasal bir zorunluluk hâlinde.",
      ],
    },
    {
      heading: "Aktarım ve yurt dışı aktarımı",
      paragraphs: [
        "Kişisel verileriniz üçüncü kişilere satılmaz veya reklam amacıyla paylaşılmaz. Verilerin paylaşılabileceği tek altyapı, sitenin barındırılmasını sağlayan ve sunucu kayıtlarını tutmakla yükümlü olan sağlayıcıdır.",
        "Bize WhatsApp, Instagram veya LinkedIn üzerinden yazmanız hâlinde, veriniz ilgili platform tarafından kendi sunucularında işlenir. Bu platformlardan bazıları Türkiye dışındaki sunuculardan hizmet verdiğinden KVKK m.9 kapsamındaki yurt dışı aktarım hükümleri gündeme gelebilir; bu durumda aktarımın yasal dayanağı ilgili platformun kendi aydınlatma metninde belirtilir.",
      ],
    },
    {
      heading: "Saklama süresi",
      paragraphs: [
        "KVKK m.7 uyarınca veriler, işlenme amacının gerektirdiği süre boyunca saklanır. Bu süre sonunda, yasal bir saklama yükümlülüğü yoksa veriler silinir, yok edilir veya anonim hâle getirilerek işlenme amacının dışındaki amaçlarla kullanılamaz hâle getirilir.",
      ],
      items: [
        "Sunucu kayıtları: hizmetin güvenli ve kesintisiz çalışmasını destekleyecek makul süre boyunca.",
        "Bize iletilen mesajlar: konuşmanın sonuçlanmasını takiben gerekli süre boyunca; yasal bir saklama yükümlülüğü doğarsa o süre boyunca.",
      ],
    },
    {
      heading: "İlgili kişinin hakları",
      paragraphs: [
        "KVKK m.11 uyarınca kişisel verilerinizin işlenip işlenmediğini öğrenme, işlem varsa bilgi talep etme, düzeltilmesini veya silinmesini isteme ve işlemenin sınırlandırılmasını talep etme haklarına sahipsiniz.",
      ],
      items: [
        "Taleplerinizi e-posta üzerinden iletebilirsiniz.",
        "Talepler değerlendirilir ve sonuç, kanunda öngörülen süre içinde yazılı olarak bildirilir.",
        "Taleplerin karşılanması için kimliğinizi doğrulayan ek bilgi gerekebilir; bu bilgi yalnızca talebin değerlendirilmesi için kullanılır.",
      ],
    },
    {
      heading: "Bilgilendirme ile açık rıza arasındaki fark",
      paragraphs: [
        "Sitenin çalışması ve bir talebinizin yanıtlanması için açık rıza aranmaz; bu işlemler KVKK m.5/1-f kapsamında, sözleşmenin ifası ve hizmetin sunulması gereği yapılır. Yani ziyaret etmeniz veya mesaj göndermeniz, bu metinde anlatılan işlemeler için hukuki sebep oluşturur.",
        "Açık rıza yalnızca hizmetin çalışması için gerekli olmayan ve talebiniz üzerine kurulmayan bir işlem için, ayrıca ve sizin özgür iradenizle verdiğiniz onayla alınır. Sitede şu anda rıza istenen bir akış veya onay kutusu bulunmamaktadır.",
        "Onay vermek zorunda değilsiniz; vermemeniz hâlinde sitenin temel işlevleri etkilenmez.",
      ],
    },
    {
      heading: "Güvenlik",
      paragraphs: [
        "Site HTTPS üzerinden sunulur. Erişim kayıtları yalnızca yetkili kişiler tarafından görüntülenir ve teknik güvenlik açıklarına karşı önlemler alınır.",
      ],
    },
    CLOSING,
  ],
};

/* ------------------------------------------------------------------ */
/* ÇEREZLER                                                           */
/* ------------------------------------------------------------------ */
const CEREZLER: LegalDoc = {
  href: "/cerezler",
  title: "Çerez Politikası",
  navLabel: "Çerez Politikası",
  lead: "Bu sitede hangi çerezlerin kullanıldığını ve neden kullanıldığını açıklar.",
  description:
    "Mühür Studio çerez politikası: sitede çerez kullanımının kapsamı, üçüncü taraf içerikler ve tarayıcı ayarları.",
  revised: "2026",
  intro: [
    `Bu politika, ${site.name} web sitesinde çerez ve benzeri teknolojilerin kullanılıp kullanılmadığını açıklar.`,
    "Kısa yanıt: bu site çerez tabanlı bir takip ya da profilleme yapmaz. Aşağıda bunun ne anlama geldiği ayrıntılı olarak açıklanmıştır.",
  ],
  sections: [
    {
      heading: "Bu sitede hangi çerezler var?",
      paragraphs: [
        "Bu site, çerez oluşturan, okuyan veya yazan bir izleme kodu içermez. Dolayısıyla sitede analiz, reklam, oturum kaydı veya davranışsal profilleme amaçlı çerez bulunmaz.",
        "Kullanılmayan teknolojiler için onay kutusu, çerez bandı veya rıza yönetim aracı da bulunmamaktadır; bunun nedeni ihtiyaç duyulmamasıdır, unutulması değil.",
      ],
    },
    {
      heading: "Neden çerez gerekmiyor?",
      paragraphs: [
        "Site, sunucu tarafında oluşturulan statik bir içeriktir. Kullanıcı hesabı açılmaz, oturum tutulmaz, kişiselleştirme yapılmaz ve sunucu tarafında durum saklanmaz. Bu nedenle işlevsel bir çerez gereksinimi doğmaz.",
        "Site, görüntüyü cihazınıza uygun boyutta göstermek için görüntü yollarında cihaz bilgisi içeren bir değer kullanabilir. Bu değer tarayıcının istek başlığıyla iletilir, kalıcı olarak depolanmaz ve cihazınızdan çıkmaz.",
      ],
    },
    {
      heading: "Takip ve analitik araçları",
      paragraphs: [
        "Bu depoda ve yayımlanan sitede Google Analytics, Meta Pixel, Microsoft Clarity, Hotjar, reklam ağı etiketleri, oturum kaydı veya benzeri bir ölçüm aracı bulunmamaktadır. Ziyaretçi davranışı ölçülmez ve profilleme yapılmaz.",
        "Bu bölüm ileride gerçek bir analitik aracı eklenirse güncellenecektir; mevcut durumda herhangi bir aracın varlığı iddia edilmemektedir.",
      ],
    },
    {
      heading: "Üçüncü taraf içerikler",
      paragraphs: [
        "Sitede gömülü video, harita, canlı yayın, sosyal medya gömmesi veya başka bir üçüncü taraf çerçevesi (iframe) bulunmaz. Bu nedenle üçüncü taraf içeriklerin kendi çerezleri yüklenmez.",
        "Sayfada WhatsApp, Instagram ve LinkedIn bağlantıları bulunur. Bu bağlantılara tıklandığında ilgili platformun kendi çerezleri ve gizlilik kuralları devreye girer; bu andan itibaren site üzerindeki bu politika yerine ilgili platformun politikası geçerlidir.",
      ],
    },
    {
      heading: "Tarayıcı ayarlarınız",
      paragraphs: [
        "Bu siteden herhangi bir çerez oluşmadığı için tarayıcınızdan bu siteye ait bir kaydı silmeniz gerekmez. Yine de tarayıcınızın kendi ayarları üzerinden site verilerini temizlemek isterseniz bu işlem tarayıcınıza bağlıdır.",
      ],
    },
    {
      heading: "Politikanın güncellenmesi",
      paragraphs: [
        "Sitede çerez kullanan bir teknoloji eklenirse veya mevcut bir teknoloji kaldırılırsa bu sayfa güncellenir.",
      ],
    },
    CLOSING,
  ],
};

/* ------------------------------------------------------------------ */
/* KULLANIM KOŞULLARI                                                  */
/* ------------------------------------------------------------------ */
const KOSULLAR: LegalDoc = {
  href: "/kullanim-kosullari",
  title: "Kullanım Koşulları",
  navLabel: "Kullanım Koşulları",
  lead: "Bu siteyi kullanırken uymanız gereken birkaç temel kural.",
  description:
    "Mühür Studio kullanım koşulları: site içeriğinin kullanımı, arşiv çalışmalarının niteliği ve dış bağlantılar.",
  revised: "2026",
  intro: [
    `Bu koşullar, ${site.name} web sitesini kullanan herkes için geçerlidir. Siteyi kullanmaya başladığınızda koşulları kabul etmiş sayılırsınız.`,
    "Burada bir hizmet sözleşmesi, fiyat listesi, teslim süresi veya iade koşulu bulunmaz. Proje görüşmeleri, kapsam ve koşullar doğrudan e-posta ya da WhatsApp üzerinden konuşulur.",
  ],
  sections: [
    {
      heading: "Koşulların kapsamı",
      paragraphs: [
        "Bu koşullar yalnızca bu web sitesinin kullanımına ilişkindir. Site aracılığıyla başlatılan bir proje için hizmet kapsamı, ücretlendirme ve teslim koşulları yazılı olarak ayrıca kararlaştırılır.",
      ],
    },
    {
      heading: "Sitenin kullanımı",
      paragraphs: [
        "Siteyi yasalara ve genel ahlaka aykırı amaçlarla, hizmeti aksatacak biçimde veya izinsiz erişim girişimleriyle kullanamazsınız. Siteyi meşru amaçlarla kullandığınız ölçüde erişim sağlanır; erişimin bir süreyle sınırlandırılması gerekebilir.",
      ],
    },
    {
      heading: "Arşiv çalışmalarının niteliği",
      paragraphs: [
        "Sitede yayımlanan Notella ve Bursa Sofrası çalışmaları KONSEPT çalışmadır. Gerçek müşteri projeleri değildir. Bu çalışmaların sayfalarında gerçek müşteri ilişkisi, ölçülmüş performans sonucu veya müşteri yorumu yer almaz; tasarım yönü anlatılır.",
        "Sitede müşteri adı, referans, ödül, başarı oranı veya benzeri doğrulanabilir iddia bulunmamaktadır.",
      ],
    },
    {
      heading: "İçerik ve fikri mülkiyet",
      paragraphs: [
        `Sitedeki metinler, tasarım, düzen, kod ve marka işaretleri ${site.name}'ya aittir. İzni olmadan kopyalanamaz, çoğaltılamaz, yeniden yayımlanamaz veya ticari amaçla kullanılamaz.`,
        "Kaynak gösterilerek alıntı yapmak ve kişisel, ticari olmayan amaçla bağlantı vermek makul kullanım sınırları içindedir.",
      ],
    },
    {
      heading: "Dış bağlantılar",
      paragraphs: [
        "Sitede WhatsApp, Instagram ve LinkedIn bağlantıları bulunur. Bu bağlantılar üçüncü taraflara aittir; içerikleri, güvenlikleri ve kullanım koşulları üzerinden hiçbir kontrolümüz veya sorumluluğumuz bulunmamaktadır.",
      ],
    },
    {
      heading: "Sorumluluğun sınırı",
      paragraphs: [
        "Site bilgilendirme amaçlıdır. İçerik, tasarım yaklaşımı ve arşiv çalışmaları, somut bir proje için taahhüt veya teknik sonuç garantisi olarak sunulamaz. Yasal olarak kabul edilen sorumluluk sınırları saklıdır.",
        "Site üzerinden verilen iletişim bilgileri değişebilir; güncel iletişim kanalı için alt bilgideki adres ve bağlantılar esas alınır.",
      ],
    },
    {
      heading: "Koşulların değiştirilmesi",
      paragraphs: [
        "Bu koşullar gerekli görüldüğünde güncellenebilir. Sayfanın üst kısmındaki güncelleme bilgisi, hangi sürümün geçerli olduğunu gösterir.",
      ],
    },
    CLOSING,
  ],
};

/** Kaynak sırası alt bilgide ve yasal gezinmede de aynı sırayı izler. */
export const legalDocs: LegalDoc[] = [GIZLILIK, KVKK, CEREZLER, KOSULLAR];

/** Alt bilgi ve yasal gezinme bağlantıları. Tek kaynak `legalDocs`. */
export const legalNav = legalDocs.map((d) => ({
  href: d.href,
  label: d.navLabel,
}));

export function getLegalDoc(href: string): LegalDoc | undefined {
  return legalDocs.find((d) => d.href === href);
}

export default legalDocs;
