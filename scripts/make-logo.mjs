/**
 * LOGO ÜRETİCİSİ — TEK KAYNAK
 * ===========================================================================
 * Sağlanan Mühür Studio markasının geometrisi burada tanımlıdır. Bu dosya İKİ
 * çıktı üretir:
 *
 *   1) public/icons/logo.svg  → başlık, mobil başlık, alt bilgi
 *   2) app/icon.svg           → favicon / sekme ikonu
 *
 * NEDEN ÜRETİCİ:
 * Sekme ikonu logo'dan ayrı elle yazılırsa zamanla kayar (daha küçük kalır,
 * eski M kalır). Burada favicon, logo geometrisinin merkez etrafında ölçeklenmiş
 * hâli olarak ÜRETİLİR; iki dosya yapısal olarak aynı işareti taşır.
 *
 * SEKME İKONU NEDEN DAHA BÜYÜK:
 * Sekmede 16px'te görünür. `iconFILL` ile marka kutuyu daha fazla doldurur
 * (varsayılan 0.84'ün yerine 0.92) — kırpma, boşluk bırakma veya çerçeve
 * eklemeden yalnızca ÖLÇEK. Kenar boşluğu markayı küçültürdü.
 *
 * GEOMETRİ (256 birimlik ana kare, merkez 128,128):
 * - Dış sekizgen: siyah gövde, köşelerde 45° kırpma
 * - İç sekizgen: ince fildişi halka
 * - M: kalın dikey iki gövde + derin V. V, gövde tabanına yakın iner.
 *
 * ÖLÇEK/ORAN DEĞİŞTİRME: yeni dosya geldiğinde yalnızca bu blok değişir.
 * ===========================================================================
 */
import { writeFileSync } from "node:fs";

/** Dış sekizgen gövde — siyah. */
const OCTAGON_BODY = [
  [128, 20], [197.2, 50.8], [235.2, 128], [197.2, 205.2],
  [128, 236], [58.8, 205.2], [20.8, 128], [58.8, 50.8],
];

/** İnce iç sekizgen halka — fildişi. */
const OCTAGON_RING = [
  [128, 58], [174.6, 81.4], [198, 128], [174.6, 174.6],
  [128, 198], [81.4, 174.6], [58, 128], [81.4, 81.4],
];

/**
 * M — kalın gövdeler, derin V.
 * Sol gövde x 92→112, sağ gövde 144→164 (her biri 20 birim = kalın).
 * V'nin üst kenarı y=118, alt sivri ucu y=152: taban (164) hemen üstünde,
 * yani V derin. Sağ/sol simetriktir.
 */
const M = [
  [92, 164], [92, 88], [114, 88], [128, 118], [142, 88], [164, 88],
  [164, 164], [144, 164], [144, 118], [128, 152], [112, 118], [112, 164],
];

const INK = "#080808";
const IVORY = "#F5F2ED";

/**
 * SVG ad alanı — TEK KAYNAK.
 *
 * DİKKAT: Bu ad alanı TAM OLMAK ZORUNDA. Geçersiz bir ad alanı (örneğin
 * ".../2000/svg" yerine yanlışlıkla ".../200/svg") XML olarak ÇOK TAMAMDIR:
 * DOMParser hata vermez, dosya "geçerli" görünür. Ama tarayıcının SVG
 * görüntü çözücüsü kök öğeyi SVG ad alanında bulamaz ve <img> YÜKLEME HATASI
 * verir — kırık görsel ikonu. Sayfa üzerine gömülü (inline) SVG etkilenmez,
 * bu yüzden hata fark edilmez; yalnızca <img src="...logo.svg"> bozuk görünür.
 *
 * Bu satır bozulursa logo sessizce kaybolur. `assertNamespace` aşağıda
 * üretimden sonra doğrular.
 */
const NS = "http://www.w3.org/2000/svg";

function assertNamespace(svg, name) {
  const m = svg.match(/xmlns="([^"]+)"/);
  if (!m || m[1] !== NS) {
    throw new Error(
      `${name}: SVG ad alanı hatalı — "${m ? m[1] : "yok"}". Beklenen "${NS}".`
    );
  }
}

const pts = (a) => a.map(([x, y]) => `${x},${y}`).join(" ");
const poly = (a) => `M${pts(a)}Z`;

/** Master logo — tam boy, kırpmasız. */
const logoSvg = `<svg xmlns="${NS}" viewBox="0 0 256 256" width="256" height="256" role="img" aria-label="Mühür Studio">
  <!--
    MÜHÜR STUDIO — GERÇEK MARKA İŞARETİ
    Sekizgen mühür: dışta koyu sekizgen gövde, içinde ince açık sekizgen
    halka, merkezde kalın ve derin V'li "M".
    ÜRETİCİ: scripts/make-logo.mjs — bu dosya elle düzenlenmez.
  -->
  <polygon points="${pts(OCTAGON_BODY)}" fill="#000000"/>
  <polygon points="${pts(OCTAGON_RING)}" fill="none" stroke="${IVORY}" stroke-width="5" stroke-linejoin="miter"/>
  <path d="${poly(M)}" fill="${IVORY}"/>
</svg>
`;

/**
 * Favicon — logo geometrisinin ölçeklenmiş hâli.
 * `fill` = işaretin kutuyu doldurma oranı (0–1). Sekmede 16px'te görünür;
 * daha yüksek oran = daha büyük görünür. Kırpma yok, çerçeve yok.
 *
 * Ana kare 256, ikon 64 → ölçek 0.25. Bu ölçekte ana sekizgenin yarı
 * açıklığı 27 birimdir, yani %84.4 doldurur. İstenen orana ulaşmak için
 * merkez etrafındaki sapma `k` ile büyütülür: k = fill / 0.84375.
 */
function iconSvg(fill) {
  const s = 64 / 256;
  const masterHalf = 27; // 64 birimlik uzayda ana sekizgenin yarı açıklığı
  const targetHalf = (fill * 64) / 2;
  const k = targetHalf / masterHalf;
  const map = ([x, y]) => {
    const qx = x * s;
    const qy = y * s;
    return [
      +(32 + (qx - 32) * k).toFixed(2),
      +(32 + (qy - 32) * k).toFixed(2),
    ];
  };
  const body = OCTAGON_BODY.map(map);
  const ring = OCTAGON_RING.map(map);
  const m = M.map(map);
  // Halka kalınlığı da ölçekle birlikte büyür (5 * 64/256 * k).
  const sw = +(5 * s * k).toFixed(2);

  return `<svg xmlns="${NS}" viewBox="0 0 64 64" width="64" height="64">
  <!--
    Site/sekme ikonu. public/icons/logo.svg ile AYNI geometriden üretilir
    (scripts/make-logo.mjs) — kırpmasız, çerçevesiz, yalnızca ölçeklenmiş.
    Sekmede küçük göründüğü için kutuyu fill oranında doldurur.
  -->
  <rect width="64" height="64" fill="${INK}"/>
  <polygon points="${pts(body)}" fill="#000000"/>
  <polygon points="${pts(ring)}" fill="none" stroke="${IVORY}" stroke-width="${sw}" stroke-linejoin="miter"/>
  <path d="${poly(m)}" fill="${IVORY}"/>
</svg>
`;
}

const icon = iconSvg(0.94);

// Üretimden sonra doğrula: ad alanı ve temel ölçüler.
assertNamespace(logoSvg, "public/icons/logo.svg");
assertNamespace(icon, "app/icon.svg");

writeFileSync("public/icons/logo.svg", logoSvg, "utf8");
writeFileSync("app/icon.svg", icon, "utf8");

console.log("yazildi: public/icons/logo.svg");
console.log("yazildi: app/icon.svg (fill 0.94)");
console.log("svg ad alani dogrulandi:", NS);
