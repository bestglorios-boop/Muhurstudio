"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
import type { Variants, Transition } from "motion/react";

/**
 * Ortak geçiş: tek bir hareket dili, keskin ve yavaş.
 */
const EASE: Transition["ease"] = [0.16, 1, 0.3, 1];

/**
 * DÖNGÜSEL BAĞIMLILIK UYARISI — bu dosyadaki iki bileşende de aynı tuzak var:
 *
 * `whileInView` bir IntersectionObserver'a bağlıdır ve tarayıcı, hedef
 * elemanın KENDİ clip-path'i tarafından kırpılmış kısmını kesişim alanı
 * dışında sayar. Animasyon `inset(0 0 100% 0)` gibi tamamen kapalı bir
 * clip-path ile başladığı için gözlemci elemanı "görünmüyor" ilan eder;
 * görünmediği için animasyon tetiklenmez. Sonuç: içerik kalıcı olarak boş
 * kalır (aşağıdaki IntersectionObserver testi bunu doğruluyor).
 *
 * Çözüm: gözlemciyi kırpılmamış bir DIŞ kutuya bağla, animasyonu içerideki
 * bir çocuk üzerinde çalıştır. Dış kutu hiçbir zaman kırpılmadığı için
 * gözlemci onu her zaman doğru şekilde "görünür" sayar.
 */

/**
 * `useReducedMotion` sunucuda `null` (bilinmiyor), istemcide ise gerçek değer
 * döner. Değeri doğrudan dallandırmak sunucu HTML'i ile istemci ağacını
 * farklılaştırır ve React "Hydration failed" hatası verip ağacı baştan
 * üretir.
 *
 * `useSyncExternalStore` bu sorunu kökten çözer: `getServerSnapshot` sunucu
 * render'ı için SABİT bir değer döndürür, `getSnapshot` yalnızca istemcide
 * kullanılır. Böylece ilk render her iki tarafta birebir aynıdır ve React
 * uyarısı vermez; ardından abone olup gerçek tercihe geçer.
 */
const NO_PREF = () => false;

function subscribeToReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function useReducedMotionStable() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    NO_PREF
  );
}

/**
 * Level 2 — bölüm reveal'ı.
 * Anti-fade-up kuralı: opacity 0 + translateY(30px) kullanılmaz.
 * Bunun yerine clip-path ile dikey bir silme kullanılır.
 *
 * Not: Metin gövdesi ve çoğu metadata HİÇ animasyon almaz (Level 0).
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "figure" | "li";
}) {
  const reduced = useReducedMotionStable();
  const Tag = motion[as];

  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Tag
      className={className}
      initial="closed"
      whileInView="open"
      viewport={{ once: true, margin: "-12% 0px -12% 0px" }}
    >
      <motion.div
        variants={SECTION_VARIANTS}
        transition={{ duration: 0.78, delay, ease: EASE }}
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </Tag>
  );
}

const SECTION_VARIANTS: Variants = {
  closed: { clipPath: "inset(0 0 100% 0)" },
  open: { clipPath: "inset(0 0 0% 0)" },
};

/**
 * Level 2 — görsel kırpma reveal'ı.
 * Görsel soldan sağa doğru açılır; ölçek 1.01 → 1.
 */
export function RevealCrop({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotionStable();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      {/* Dış kutu: gözlemcinin hedefi, kırpma YOK. */}
      <motion.div
        className="h-full w-full"
        initial="closed"
        whileInView="open"
        viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      >
        {/* İç kutu: asıl kırpma animasyonu. */}
        <motion.div
          variants={CROP_VARIANTS}
          transition={{ duration: 0.9, delay, ease: EASE }}
          className="h-full w-full"
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}

const CROP_VARIANTS: Variants = {
  closed: { clipPath: "inset(0 100% 0 0)", scale: 1.01 },
  open: { clipPath: "inset(0 0% 0 0)", scale: 1 },
};

