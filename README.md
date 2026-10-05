# Mühür Studio

**Dijital iz bırakır.**

Bursa merkezli, uzaktan çalışan bağımsız web tasarım ve geliştirme stüdyosunun
web sitesi. Next.js App Router üzerine kurulu, statik olarak üretilen bir tanıtım
ve portfolyo sitesidir.

> **Mühür** = mühür, damga. "Bir iz bırakmak, damga vurmak."

---

## Teknoloji

| Alan | Seçim | Not |
| --- | --- | --- |
| Çatı | Next.js 16 (App Router) | Tüm rotalar statik olarak önceden üretilir |
| Dil | TypeScript 5 (`strict`) | `typecheck` betiği CI'da zorunlu adımdır |
| Stil | Tailwind CSS 4 | Tasarım belirteçleri `app/globals.css` içinde |
| Yazı tipi | Instrument Serif + Inter | `next/font/google` ile derleme anında gömülür |
| Animasyon | `motion` | Yalnızca bölüm reveal'ı ve hizmet akordiyonu |
| 3B | Three.js (ağaç budamalı alt küme) | `components/three/threeModule.ts` |
| QA | Puppeteer Core + Lighthouse | `scripts/` altında, çalışan sunucu gerektirir |

Üretim bağımlılıkları: `next`, `react`, `react-dom`, `three`, `motion`.

---

## Yerel geliştirme

```bash
npm ci          # kilit dosyasına sadık kurulum
npm run dev     # http://localhost:3000
```

Node.js 22 önerilir (CI ile aynı sürüm).

## Betikler

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi (tüm rotalar statik) |
| `npm start` | Üretim derlemesini sunar (QA betikleri bunu kullanır) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run verify` | lint → typecheck → build, sırayla |
| `npm run audit:prod` | Yalnızca üretim bağımlılıklarında güvenlik denetimi |

`verify` gerçekten her şeyi çalıştırır; hiçbir adım temiz geçmiş gibi
gösterilmez. Üçü de sıfır çıkış koduyla bitmelidir.

---

## Proje yapısı

```
app/                     rotalar + metadata + global stil
  layout.tsx             kök düzen, fontlar, metadata, JSON-LD
  loading.tsx            rota geçişi yükleme ekranı
  icon.svg               sekme/favicon işareti
  robots.ts sitemap.ts   site.siteUrl boşsa ikisi de güvenli biçimde çıkarılır
  page.tsx               ana sayfa
  about/ work/           içerik rotaları
  work/[slug]/           proje detayları
  gizlilik/ kvkk/ cerezler/ kullanim-kosullari/

components/
  brand/                 gerçek logo varlığı + M filigranı
  navigation/ footer/    başlık ve alt bilgi
  sections/              Intro, Services, Approach, Manifesto, Contact
  hero/ project/         ana sayfa ve arşiv parçaları
  three/                 3B mühür sahnesi, SVG yedeği, alt küme modülü
  background/            LineField (tuval kontur alanı)
  motion/                Reveal, SkipLink
  ui/                    MuhurLink (CTA sistemi)
  legal/                 yasal sayfaların ortak düzeni

data/                    İÇERİĞİN TEK KAYNAĞI
  site.ts                marka, iletişim, gezinme, CTA metinleri
  projects.ts            çalışma kayıtları
  legal.ts               yasal metinler

public/
  icons/logo.svg         gerçek marka dosyası (üretici: scripts/make-logo.mjs)
  og/og.svg              sosyal önizleme görseli
  projects/<slug>/       arşiv plakaları (üretici: scripts/make-plates.mjs)

### İçerik değiştirme

Arayüz metinlerinin tamamı `data/` altındadır. Site metnini değiştirmek için
bileşenlere dokunmayın.

**Çalışma eklerken `data/projects.ts` güncellenir.** Bir alanın gerçek değeri
yoksa alanın tamamı silinir; boş arayüz üretilmez. Müşteri adı, ölçüm, yorum
veya ödül bilgisi uydurulmaz. Arşivdeki iki çalışma da **konsept** çalışmadır.

### Marka

`public/icons/logo.svg` gerçek marka dosyasıdır ve elle düzenlenmez.
`scripts/make-logo.mjs` tek üreticidir; çalıştırmak dosyayı yeniden yazar.

---

## Tasarım dili

Palet ve tipografi `app/globals.css` içindeki belirteçlerde tanımlıdır:
mat siyah zemin, sıcak kırık beyaz, tek kırmızı vurgu (`#C23B22`), ince
hairline kenarlıklar, tek yarıçap (`4px`). Gölge, degrade, cam efekti ve
dekoratif parçacık kullanılmaz.

3B mühür sahnesi imzanın bir parçasıdır ve **kaldırılmaz**. Performans
kazancı için 3B'yi düz bir tasarıma indirgemek yerine mevcut uygulama
optimize edilmiştir (ağaç budamalı Three.js alt kümesi, boştta kurulum,
kare hızı sınırı, görünürlük ve sekme durumu denetimleri).

WebGL yoksa, cihaz zayıfsa, indirgemiş hareket açıksa veya alan görünür
değilse sahne devreye girmeden `components/three/FallbackSeal.tsx` devreye girer.
Sayfa asla 3B yüzünden kullanılamaz hâle gelmez.

---

## Yasal metinler

`/gizlilik`, `/kvkk`, `/cerezler`, `/kullanim-kosullari` rotaları
`components/legal/LegalPage.tsx` düzenini paylaşır; metinlerin tamamı
`data/legal.ts` içindedir.

Bu metinler **yalnızca sitenin gerçekten yaptığı şeyi anlatır**. Sitede
olmayan bir çerez, analitik aracı, barındırma sağlayıcısı, ödeme akışı veya
şirket sicil bilgisi metinlere **eklenmez**. Sitede olmayan bir şeyi varmış gibi
anlatmak, metni yanlış kılmakla kalmaz; kullanıcıyı da yanıltır.

Metin değiştirmek için `data/legal.ts` dosyasını düzenleyin.

---

## Alan adı ve SEO

`data/site.ts` içindeki `siteUrl` **bilinçli olarak boştur**: üretim alan adı
henüz belirlenmemiştir. Bu değer boşken:

- canonical URL üretilmez,
- Open Graph / Twitter görseli üretilmez,
- `sitemap.xml` boş döner,
- JSON-LD bloğu basılmaz.

Böylece `http://localhost:3000` gibi bir geliştirme adresi **üretim
metadata'sına sızmaz**. Alan adı belirlendiğinde `siteUrl` tek satırdan
doldurulur; canonical, OG görseli, sitemap ve JSON-LD kendiliğinden doğru
mutlak adresle çalışmaya başlar. Sahte alan adı **uydurulmamalıdır**.

---

## Dağıtım

Statik çıktı üretir; herhangi bir Node.js barındırma, veritabanı veya sunucu
tarafı çalışma zamanı gerekmez. Vercel'e bağlanabilir ya da `npm run build`
sonrası `.next/` çıktısı herhangi bir Node barındırmaya verilebilir.

### Yayın kontrol listesi

1. **Alan adı:** Vercel → Settings → Environment Variables içinde
   `NEXT_PUBLIC_SITE_URL=https://gercek-alan-adiniz` tanımlayın ve yeniden
   dağıtın. Bu olmadan canonical, sitemap ve sosyal önizleme adresleri
   üretilmez (bilerek — localhost sızmaz).
2. **Önizleme:** dağıtım URL'sini açın, tüm rotaları ve WhatsApp CTA'yı
   tıklayın.
3. **Doğrulama:** `npm run verify` ve `npm run audit:prod` temiz olmalı.

HTTPS kullanılmalıdır; `next.config.ts` HSTS başlığı yalnızca gerçek bir
HTTPS alan adı olduğunda eklenmelidir.

---

## Kalite denetimi

`scripts/` altındaki betikler çalışan bir **üretim** sunucusu gerektirir:

```bash
npm run build
npm start                 # ayrı bir terminalde, :3000
node scripts/qa-console.mjs
```

`scripts/_harness.mjs` ortak altyapıdır: kurulu Chrome/Edge bulur, ölçüm yapar
ve her koşumda tarayıcıyı kapatır. `scripts/README.md` betiklerin tamamını ve
ne ölçtüklerini listeler.

Üretim kodu ile kalite betikleri birbirinden ayrıdır: `app/`, `components/`,
`data/` ve `public/` dağıtıma girer, `scripts/` girmez.

---

## CI

`.github/workflows/ci.yml` her push ve PR'da: `npm ci` → lint → typecheck →
build → `npm audit --omit=dev`. Depoda hiçbir sır saklanmaz; CI gizli
değişken kullanmaz.

