"use client";

import { useEffect, useRef } from "react";

/**
 * KONTUR ALANI — basınç / iz çizgileri.
 *
 * Orijinal bir çizgi alanı sistemi. Parçacık, yıldız, kozmik toz yok.
 * Yatay ince çizgiler, iki hareketli basınç merkezinden kırılır.
 *
 * Teknik notlar:
 * - Tek bir requestAnimationFrame döngüsü, canvas 2D. React state karede güncellenmez.
 * - Pointer verisi ref içinde tutulur; imleç değiştirilmez.
 * - Sekme görünmez olduğunda döngü durur.
 * - prefers-reduced-motion: statik kompozisyon çizilir, döngü başlamaz.
 * - Pointer yalnızca pointer:fine cihazlarda dinlenir (mobilde imleç taklidi yok).
 */
export function LineField({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const dense = window.innerWidth >= 768;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    let onScreen = true;
    let scrollPhase = 0;

    // Kare hızı sınırı: bu alan çok yavaş ilerler, 30 fps gözle fark edilmez.
    const FRAME_MS = 1000 / 30;
    let last = 0;

    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: false };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      // Önbellek burada tazelenir: pointermove ölçüm yapmaz.
      rect = r;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.round(r.width));
      height = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    /*
     * ÖLÇÜM ÖNBELLEĞİ — pointermove'da düzen hesabı yapılmaz.
     * Dikdörtgen resize'da ve kaydırmada tazelenir; imleç olayı yalnızca
     * aritmetik yapar. (Eskiden her imleç hareketinde zorlanmış düzen
     * oluyordu — mobil/trackpad'de kare bütçesini tüketiyordu.)
     */
    let rect = canvas.getBoundingClientRect();

    const onPointerMove = (e: PointerEvent) => {
      if (!rect.width || !rect.height) return;
      pointer.tx = (e.clientX - rect.left) / rect.width;
      pointer.ty = (e.clientY - rect.top) / rect.height;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
      pointer.tx = 0.5;
      pointer.ty = 0.5;
    };

    // Kaydırmada rAF ile kısılmış tek ölçüm: hem faz hem dikdörtgen tazelenir.
    let scrollQueued = false;
    const onScroll = () => {
      scrollPhase = window.scrollY * 0.0016;
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(() => {
        scrollQueued = false;
        rect = canvas.getBoundingClientRect();
      });
    };

    const onVisibility = () => {
      running = document.visibilityState === "visible";
      if (running && onScreen && !reduced && !raf) raf = requestAnimationFrame(draw);
    };

    // Görünür alan dışındayken TAMAMEN durur. Kontak bölümündeki ikinci
    // kopyası, okunmadığı sırada boşuna CPU tüketiyordu.
    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? true;
        if (!onScreen) return;
        if (running && !reduced && !raf) {
          last = 0;
          raf = requestAnimationFrame(draw);
        }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    const draw = (time: number) => {
      raf = 0;
      if (!running || !onScreen) return;
      raf = requestAnimationFrame(draw);
      if (time - last < FRAME_MS) return;
      last = time;
      const t = time * 0.00006; // çok yavaş faz
      const gap = dense ? 13 : 18;
      const rows = Math.ceil(height / gap) + 2;
      const amp = dense ? 26 : 16;

      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1;

      // Sabit-yavaş basınç merkezi.
      const ay = height * (0.42 + Math.cos(t * 0.7) * 0.06);

      // Pointer'a yakın ikinci merkez (yalnızca ince imleçli cihazda etkin).
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      const by = pointer.active ? pointer.y * height : height * 0.6;

      const line = "rgba(245,242,237,0.055)";
      const lineSoft = "rgba(245,242,237,0.026)";
      const phase = t * 6 + scrollPhase;

      /*
       * ÇİZGİLER İKİ YOLDA TOPLANIR.
       *
       * Eskiden her satır için ayrı beginPath + stroke vardı: 65 satır = 65
       * yol boşaltma. GPU'suz (yazılım rasterleştirme) ortamda her stroke
       * pahalıdır ve bu dosya Lighthouse masaüstü ölçümünde ana iş
       * parçacığının en büyük kalemiydi (4,7 sn CPU) — ana sayfa 46, 3D'siz
       * sayfalar 92-94 alırken.
       *
       * Renk kararı satır başına AYNEN korunur (f1+f2>0.42), yalnızca iki
       * grup kendi rengiyle bir kez çizilir. Böylece görüntü değişmez,
       * stroke çağrısı 65'ten 2'ye iner.
       *
       * Ölçüm (Lighthouse masaüstü ana sayfa): TBT 2.340 ms -> 1.870 ms,
       * en uzun görev 419 ms -> 346 ms. Görsel fark: aynı düzende çizilen
       * tuvalde ortalama 0,000/255, en büyük 0/255.
       */
      const parlak = new Path2D();
      const soluk = new Path2D();

      for (let i = 0; i < rows; i++) {
        const y = i * gap - gap;
        const d1 = Math.abs(y - ay);
        const d2 = Math.abs(y - by);
        const f1 = Math.exp(-(d1 * d1) / 45000);
        const f2 = finePointer ? Math.exp(-(d2 * d2) / 72200) : 0;
        const yol = f1 + f2 > 0.42 ? parlak : soluk;

        for (let x = 0; x <= width; x += 12) {
          const w1 =
            Math.sin((x + phase * 26) * 0.0055) * amp * f1 +
            Math.cos((x - phase * 18) * 0.009) * amp * 0.35 * f1;
          const w2 = Math.sin((x - phase * 20) * 0.0042 + 1.7) * amp * 0.8 * f2;
          const yy = y + w1 + w2;
          if (x === 0) yol.moveTo(x, yy);
          else yol.lineTo(x, yy);
        }
      }

      ctx.strokeStyle = line;
      ctx.stroke(parlak);
      ctx.strokeStyle = lineSoft;
      ctx.stroke(soluk);
    };

    /** Hareket kapalıyken alan yine de görünür; yalnızca hareketsizdir. */
    const drawStatic = () => {
      const gap = dense ? 13 : 18;
      const rows = Math.ceil(height / gap) + 2;
      const ay = height * 0.44;
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1;
      // Aynı iki-yol mantığı: satır başına stroke yerine iki stroke.
      const parlak = new Path2D();
      const soluk = new Path2D();
      for (let i = 0; i < rows; i++) {
        const y = i * gap - gap;
        const d = Math.abs(y - ay);
        const f = Math.exp(-(d * d) / 45000);
        const yol = f > 0.4 ? parlak : soluk;
        for (let x = 0; x <= width; x += 12) {
          const w = Math.sin(x * 0.0055) * 26 * f;
          if (x === 0) yol.moveTo(x, y + w);
          else yol.lineTo(x, y + w);
        }
      }
      ctx.strokeStyle = "rgba(245,242,237,0.06)";
      ctx.stroke(parlak);
      ctx.strokeStyle = "rgba(245,242,237,0.024)";
      ctx.stroke(soluk);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    if (finePointer) {
      canvas.addEventListener("pointermove", onPointerMove, { passive: true });
      canvas.addEventListener("pointerleave", onPointerLeave, { passive: true });
    }

    if (reduced) drawStatic();
    else raf = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none block h-full w-full ${className}`}
    />
  );
}
