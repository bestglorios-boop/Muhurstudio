/**
 * İLETİŞİM İKONLARI — küçük, tek renk, dekoratif işaretler.
 * ---------------------------------------------------------------------------
 *
 * AMAÇ: §9–§14. İletişim bölümündeki her yöntemin ÖNÜNE tanınabilir bir
 * işaret konur. İkonlar bilgi taşımaz, süs de değildir: satırın taranmasını
 * sağlayan görsel işaretçidir.
 *
 * MARKA DİLİ:
 *  - Renk YOK. Hepsi `currentColor`. Yöntemin rengi, satırın metin rengidir;
 *    böylece ikon her zeminde (koyu/acık) kendiliğinden doğru kalır ve yeni
 *    bir renk sistemi doğmaz (§11).
 *  - Rozet, pil, kart, renkli kare zemin, halka, glow, gölge YOK (§10).
 *  - Resmî marka çizimleri kullanılır: WhatsApp ve LinkedIn kendi orijinal
 *    vektör yollarıyla; e-posta ve Instagram sitenin çizgi diline uyarlanır.
 *    Emoji, sohbet balonu, telefon ahizesi veya elle uydurma biçim YOK (§16–19).
 *
 * OPTİK AĞIRLIK (§12): kutu boyutu 24×24'tür ama her logonun Kütlesi farklıdır.
 * Dolu (WhatsApp/LinkedIn) markalar, çizgi (e-posta/Instagram) markalardan daha
 * koyu görünür; bu yüzden dolu markalar bir iki pikut KÜÇÜK çizilir. Amaç
 * eşit GÖRÜNEN boy, eşit piksel boyu değil.
 *
 * ERİŞİLEBİLİRLİK (§13): her ikon `aria-hidden="true"` + `focusable="false"`.
 * Ekran okuyucu satırı yalnızca yanındaki metinden okur; "Instagram ikonu
 * Instagram" gibi yineleme OLMAZ.
 */
import type { ReactNode } from "react";

type IconProps = { className?: string };

/**
 * Ortak gövde. `strokeWidth` 1.6: 18px'e küçültülünce hâlâ okunur kalır,
 * ama 24px çizgi kalınlığındaki UI kütüphane ikonları gibi "demo" durmaz.
 *
 * `size` bileşenin İÇİNDE sabittir (optik ağırlık her logoda farklıdır, o
 * bilgi burada durur); `className` ÜSTEYİR — rengi/geçişi ekler, boyutu
 * ezmez.
 */
function Icon({
  className = "",
  size,
  children,
}: IconProps & { size: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={`${size} shrink-0 ${className}`.trim()}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/** E-posta — zarf. Çizgi diline uyarlanmış, içi boş (§16). */
export function MailIcon({ className }: IconProps) {
  return (
    <Icon size="h-[18px] w-[18px]" className={className}>
      <path d="M3 6.9A2.4 2.4 0 0 1 5.4 4.5h13.2a2.4 2.4 0 0 1 2.4 2.4v10.2a2.4 2.4 0 0 1-2.4 2.4H5.4A2.4 2.4 0 0 1 3 17.1Z" />
      <path d="m3.7 7.5 7.4 5.1a1.5 1.5 0 0 0 1.8 0l7.4-5.1" />
    </Icon>
  );
}

/** WhatsApp — resmî marka glifi, dolu. Ahize/sohbaliçi balonu değil (§17). */
export function WhatsAppIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={`h-[17px] w-[17px] shrink-0 ${className}`.trim()}
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.12-.01-.24-.01-.36-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.464 3.488" />
    </svg>
  );
}

/** Instagram — tanınan çizgi işareti. Gradyan/renk YOK (§18). */
export function InstagramIcon({ className }: IconProps) {
  return (
    <Icon size="h-[18px] w-[18px]" className={className}>
      <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="4.8" />
      <circle cx="12" cy="12" r="4.05" />
      <circle cx="16.95" cy="7.05" r="1.05" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/**
 * LinkedIn — resmî "in" işareti. Rozet/renkli zemin YOK; kare, logonun
 * kendi biçimidir ve metin renginde çizilir (§19). Dolu kütle olduğu için
 * 15px: çizgi ikonlarla GÖRÜNEN ağırlığı ancak böyle eşitlenir (§12).
 */
export function LinkedInIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={`h-[15px] w-[15px] shrink-0 ${className}`.trim()}
      fill="currentColor"
    >
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a1.83 1.83 0 1 1 0-3.67 1.83 1.83 0 0 1 0 3.67zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

/**
 * Konum satırı ikon TAŞIMAZ (§9 yalnızca iletişim YÖNTEMLERİNİ sayar).
 * Yalnızca etiketleri aynı dikey hizada tutmak için aynı genişlikte BOŞ
 * bir hücre bırakılır; böylece liste boyunca sol kenar kırılmaz (§10).
 */
export function IconSpacer() {
  return <span aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />;
}
