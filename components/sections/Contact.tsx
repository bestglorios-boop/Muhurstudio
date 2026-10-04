import { site } from "@/data/site";
import { MuhurLink } from "@/components/ui/MuhurLink";
import { LineField } from "@/components/background/LineField";
import {
  IconSpacer,
  InstagramIcon,
  LinkedInIcon,
  MailIcon,
  WhatsAppIcon,
} from "@/components/brand/ContactIcons";
/**
 * İLETİŞİM — form yok, arka uç yok, sahte gönderim yok.
 * Doğrudan temas: birincil CTA WhatsApp, e-posta ayrı bir yöntem.
 *
 * HİZA SİSTEMİ: beş satır da aynı iki sütunlu ritmi kurar —
 *   [18px işaret hücresi] + 14px boşluk + [metin]
 * `dt` VE `dd` aynı `pl-[32px]` girintisini taşır; böylece her dd kendi
 * dt'sinin metniyle dikeyde çakışır. Hiza margin tahminiyle değil, YAPIYLA
 * sağlanır. Konum satırı da dahildir: ikonu yok ama `IconSpacer` aynı
 * 18px'i korur — tek sol hiza, beş satırda da aynıdır.
 */
export function Contact() {
  return (
    <section id="iletisim" className="relative isolate scroll-mt-(--header-h) overflow-hidden bg-ink">
      <div className="absolute inset-0 z-0 opacity-60" aria-hidden="true">
        <LineField />
      </div>

      <div className="relative z-10 mx-auto max-w-[1680px] px-5 pt-24 pb-20 md:px-10 md:pt-32 md:pb-24 xl:px-14 xl:pt-40">
        <div className="grid grid-cols-12 gap-x-6 gap-y-12">
          {/* Sol: başlık + eylem. `max-w` sınırı sağdaki bilgi sütununu ezmez. */}
          <div className="col-span-12 md:col-span-7">
            <p className="label mb-10 flex items-center gap-3 text-on-ink-muted">
              <span className="seal-index">06</span>
              <span className="h-px w-8 bg-line-ink" aria-hidden="true" />
              İletişim
            </p>

            <h2 className="font-display text-[clamp(38px,7vw,92px)] leading-[1.02]">
              Bir proje
              <br />
              başlatalım.
            </h2>

            <p className="prose-muhur mt-8 max-w-[40ch] text-on-ink-muted">
              Yeni bir web sitesi, dijital bir deneyim veya sıfırdan şekillenecek
              bir fikir üzerine konuşalım. Kısaca yazın; ne düşündüğünüzü
              anlatın.
            </p>

            <div className="mt-10 max-w-[min(100%,520px)]">
              <MuhurLink
                href={site.social.primaryActionHref}
                size="lg"
                className="w-full sm:w-auto"
                external
              >
                {site.primaryCta}
              </MuhurLink>
            </div>

            <p className="mt-6 text-[15px] text-on-ink-muted">{site.email}</p>
          </div>

          {/* Doğrudan bilgiler: ziyaretçi bunları aramak zorunda kalmamalı. */}
          <div className="col-span-12 md:col-span-4 md:col-start-9 md:self-end">
            {/*
             * İKONLAR (§4, §10): işaret solda, etiket sağda. İkon DEKORATİFTİR
             * (aria-hidden) — erişilebilir adı yanındaki metin verir, böylece
             * ekran okuyucu "Instagram ikonu Instagram" DEMEZ.
             *
             * HİZA SİSTEMİ (§5, §11): her satır aynı iki sütunlu ritmi kurar —
             *   [18px işaret hücresi] + 14px boşluk + [metin]
             * `dt` VE `dd` aynı `pl-[32px]` girintisini taşır; böylece her dd,
             * kendi dt'sinin metniyle DİKEYDE çakışır. Hiza margin
             * tahminiyle değil, YAPIYLA sağlanır. Konum satırı da aynı
             * sisteme dahildir (ikonu yok ama `IconSpacer` aynı 18px'i
             * korur) — §5'te istenen tek sol hiza budur.
             *
             * Hover kısıtlı: tek hareket, satır renginin soluktan tamına
             * dönmesi. Yönlendirme, ölçek, glow yok.
             */}
            <dl className="space-y-8">
              <div className="group">
                <dt className="label mb-2 flex items-center gap-3.5 text-on-ink-muted transition-colors duration-200 group-hover:text-on-ink">
                  <span className="flex w-[18px] shrink-0 items-center justify-center" aria-hidden="true">
                    <MailIcon />
                  </span>
                  <span>E-posta</span>
                </dt>
                <dd className="pl-[32px]">
                  <a
                  href={`mailto:${site.email}`}
                  className="hairline text-[15px] break-all sm:break-normal"
                  >
                  {site.email}
                  </a>
                </dd>
              </div>
              <div className="group">
                <dt className="label mb-2 flex items-center gap-3.5 text-on-ink-muted transition-colors duration-200 group-hover:text-on-ink">
                  <span className="flex w-[18px] shrink-0 items-center justify-center" aria-hidden="true">
                    <WhatsAppIcon />
                  </span>
                  <span>WhatsApp</span>
                </dt>
                <dd className="pl-[32px]">
                  <a
                  href={site.social.primaryActionHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hairline text-[15px]"
                  >
                  {site.whatsapp.display}
                  <span className="sr-only"> — dış bağlantı</span>
                  </a>
                </dd>
              </div>
              <div className="group">
                <dt className="label mb-2 flex items-center gap-3.5 text-on-ink-muted transition-colors duration-200 group-hover:text-on-ink">
                  <span className="flex w-[18px] shrink-0 items-center justify-center" aria-hidden="true">
                    <InstagramIcon />
                  </span>
                  <span>Instagram</span>
                </dt>
                <dd className="pl-[32px]">
                  <a
                  href={site.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hairline text-[15px]"
                  >
                  {site.social.instagramHandle}
                  <span className="sr-only"> — dış bağlantı</span>
                  </a>
                </dd>
              </div>
              <div className="group">
                <dt className="label mb-2 flex items-center gap-3.5 text-on-ink-muted transition-colors duration-200 group-hover:text-on-ink">
                  <span className="flex w-[18px] shrink-0 items-center justify-center" aria-hidden="true">
                    <LinkedInIcon />
                  </span>
                  <span>LinkedIn</span>
                </dt>
                <dd className="pl-[32px]">
                  <a
                  href={site.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hairline text-[15px]"
                  >
                  LinkedIn
                  <span className="sr-only"> — dış bağlantı</span>
                  </a>
                </dd>
              </div>
              <div>
                <dt className="label mb-2 flex items-center gap-3.5 text-on-ink-muted">
                  <span className="flex w-[18px] shrink-0 items-center justify-center" aria-hidden="true">
                    <IconSpacer />
                  </span>
                  <span>Konum</span>
                </dt>
                <dd className="pl-[32px] text-[15px]">
                  {site.location.label}
                  <span className="mt-1 block text-on-ink-muted">
                  {site.location.remote}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
