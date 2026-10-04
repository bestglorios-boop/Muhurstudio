# Kalite betikleri

Bu klasör **dağıtıma girmez**. `app/`, `components/`, `data/` ve `public/`
üretim kodu; buradaki her şey ölçüm ve varlık üretimi içindir.

## Çalıştırma

Betikler çalışan bir **üretim** sunucusu bekler:

```bash
npm run build
npm start              # ayrı terminal, :3000
node scripts/<betik>.mjs
```

`node scripts/xxx.mjs 3100` ile farklı bir port verilebilir.

Gereksinim: kurulu Chrome veya Edge. Bulunamazsa betik **sessizce geçmez**,
hata fırlatır — "temiz" gibi görünen bir ölçümsüz koşum üretilmez.

## Ortak altyapı

`_harness.mjs` — tarayıcı açma, bekleme stratejisi ve temizlik.
`withBrowser` her koşumda tarayıcıyı **her hâlükârda** kapatır; işi
bitirmeyen bir ölçüm arka planda Chrome bırakmaz.

## Günlük kullanım

| Betik | Ne ölçer |
| --- | --- |
| `audit.mjs` | Konsol hataları, yatay taşma, erişilebilirlik, görseller |
| `qa-console.mjs` | Uygulama konsolu temiz mi, kırık kaynak var mı |
| `responsive-check.mjs` | Kritik genişliklerde hızlı tarama |
| `viewport-check.mjs` | Tüm en-boy oranlarında kapsamlı tarama |
| `link-audit.mjs` | Her bağlantıya tıklar, gidilen adresi doğrular |
| `img-check.mjs` | Görseller gerçekten yükleniyor mu (naturalWidth > 0) |
| `three-check.mjs` | 3B sahne, SVG yedeği, indirgemiş hareket, görünürlük |
| `strings-qa.mjs` | Kâğıt zemindeki iplik dokusunun yoğunluğu ve katman sırası |
| `lighthouse-audit.mjs` | Lighthouse çalıştırır ve rapor üretir |

## Özel inceleme

Tek bir kararı ölçmek için yazılmış, dar kapsamlı betikler. Çalışma sırasında
bir sorunu aşama aşama izlemek için kullanılmıştır; her biri tek bir şeyi
doğrular ve ana denetimin yerine geçmez.

`gate1` … `gate7`, `gate11` — adım adım geçiş denetimleri
`align` · `collide` · `cta-tap` · `check-crop` · `copy-verify` · `footer-grid`
`wa-center` · `wa-device` · `wa-pixel` · `wa-rootcause` · `wa-shot`
`wa-verify` · `wa-visual` · `logo-compare` · `logo-shot` · `level`
`final-check` · `final-shots` · `qa2` · `verify-now` · `copy-dump`
`shots` · `perf-detail`

## Varlık üreticileri

| Betik | Ne üretir |
| --- | --- |
| `make-logo.mjs` | `public/icons/logo.svg` — **markanın tek kaynağı** |
| `make-plates.mjs` | `public/projects/*/kapak*.svg` — nötr arşiv plakaları |

Bu ikisi **ellerle düzenlenen çıktı dosyalarının** üreticisidir. Marka
değişecekse `make-logo.mjs` güncellenir ve yeniden çalıştırılır; `logo.svg`
elle düzenlenmez.

`make-plates.mjs` çıktıları gerçek ekran görüntüsü DEĞİLDİR. Gerçek proje
görselleri eklendiğinde yol `data/projects.ts` içinden güncellenir.

## Düzen

Betikler `package.json` içine eklenmez: çalışma zamanı bağımlılıkları
üretim paketini şişirmesin diye `puppeteer-core`, `lighthouse` ve
`chrome-launcher` yalnızca `devDependencies` alanındadır.
