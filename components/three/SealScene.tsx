"use client";

import { useEffect, useRef, useState } from "react";
import { FallbackSeal } from "./FallbackSeal";
import { buildLights, buildSeal } from "./sealGeometry";

/**
 * MÜHÜR — 3D / gerçek zamanlı katman.
 *
 * Amaç: "koyu bir yüzeye basılmış mühür" hissi.
 * - Yakın-siyah nesne, yakın-siyah ortam. Işık formu açığa çıkarır, parıltı yaratmaz.
 * - Ağır, yavaş, fiziksel. İmleç yalnızca hafif dönüş ve ışık yönü değiştirir.
 * - WebGL yoksa boş alan bırakılmaz: SVG mühür kompozisyonu devreye girer.
 * - prefers-reduced-motion: döngü kurulmaz, tek kare sabit kompozisyon çizilir.
 *
 * Three yalnızca tarayıcıda dinamik olarak yüklenir; sunucu paketine girmez.
 */
export function SealScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let started = false;

    /**
     * AĞIR KURULUM ERTELENİR.
     *
     * Three.js'in indirilmesi ve sahne kurulumu, React'in ilk boyamasından
     * SONRA başlar. Daha önce burada yapılıyordu ve ana iş parçacığını
     * uzun süre bloke ediyordu — TBT'nin ana kaynağı buydu.
     *
     * requestIdleCallback tarayıcıyı boşta bulduğunda çalıştırır; elde yoksa
     * kısa bir timeout'a düşer. `timeout` güvenlik ağıdır: boşta zaman
     * hiç gelmezse bile sahne yine de kurulur (3D asla kaybolmaz).
     */
    const start = async () => {
      if (disposed || started) return;
      started = true;
      /*
       * YALNIZCA GEREKEN Three.js SINIFLARI yüklenir.
       * Önceden `import("three")` tüm paketi getiriyordu (720 KB, tek parça).
       * Artık yalnızca sahneyi kuran sınıflar gelir; ağaç budama ile
       * kullanılmayan %50'lik kısım indirilmez. Bkz. ./threeModule.
       */
      let THREE: typeof import("./threeModule");
      try {
        THREE = await import("./threeModule");
      } catch {
        return; // Fallback zaten DOM'da duruyor.
      }
      if (disposed) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Geometri bütçesi: yalnızca gerçekten gerektiğinde düşürülür.
      // 3D her cihazda kurulur; sadece segment sayısı ve DPR değişir.
      const w0 = mount.clientWidth || 1;
      const h0 = mount.clientHeight || 1;
      const aspect = w0 / h0;
      const small = w0 < 768;
      const tiny = w0 < 380;
      const segs = tiny ? 40 : small ? 56 : 128;
      // Çok geniş ekranda DPR düşürülür: 4K'da tam çözünürlük pahalıdır ve
      // mühür ince çizgili olduğu için görsel fark etmez.
      const dprCap = w0 >= 2560 ? 1 : w0 >= 1600 ? 1.5 : small ? 1.5 : 2;

      let renderer: import("./threeModule").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: !small,
          alpha: true,
          powerPreference: "low-power",
        });
      } catch {
        return; // WebGL yok → fallback.
      }
      if (disposed) {
        renderer.dispose();
        return;
      }

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";

      const scene = new THREE.Scene();

      /**
       * ORAN DUYARLI KADRAJ — tek sabit kompozisyon her ekranda çalışmaz.
       * Amaç: mühür hiçbir en-boy oranında istemeden kırpılmasın, metin
       * okunabilir kalsın ve görsel sayfayı ele geçirmesin.
       *
       * - Dar/dikey (portre): fov genişler, kamera geri çekilir, mühür sağa
       *   kaydırılır → metin alanı boş kalır.
       * - Geniş (ultrawide/4K): fov daralır, mühür sağa daha çok gider,
       *   çünkü geniş ekranda metin zaten sol tarafta toplanır.
       * - Kısa (landscape telefon): kompozisyon dikey alana göre değil
       *   yüksekliğe göre ayarlanır.
       */
      const fov = aspect < 0.75 ? 50 : aspect < 1 ? 46 : aspect > 2.1 ? 30 : 34;
      const camZ = aspect < 0.75 ? 7.4 : aspect < 1 ? 7.0 : 6.4;
      // Mührün ekrandaki yatay konumu: dar ekranda sağa sıkışır, geniş
      // ekranda daha da sağa gider (metin bloğu solda kalır).
      const offX = aspect < 0.75 ? 0.35 : aspect > 2.1 ? 1.85 : small ? 0.55 : 1.55;
      const offY = aspect < 0.75 ? -0.3 : 0.05;

      const camera = new THREE.PerspectiveCamera(
        fov,
        mount.clientWidth / mount.clientHeight,
        0.1,
        100
      );
      camera.position.set(0, 0.35, camZ);

      const group = new THREE.Group();
      scene.add(group);

      buildSeal(THREE, group, segs, small);
      group.position.set(offX, offY, 0);
      buildLights(THREE, scene);

      // --- Pointer (yalnızca ince imleç). React state yok, doğrudan yazılır.
      const target = { x: 0, y: 0 };
      const fine = window.matchMedia("(pointer: fine)").matches;

      /*
       * ÖLÇÜM ÖNBELLEĞİ — zorlanmış düzen (layout) maliyetini kaldırır.
       *
       * Önceden pointermove'un HER olayında getBoundingClientRect() çağrılıyordu.
       * Bu, her imleç hareketinde bir düzen hesabı tetikliyordu (60–1000/sn).
       * Dikdörtgen yalnızca boyut değişince ve kaydırmada değiştiği için
       * bir kopyası tutulur; pointer artık yalnızca aritmetik yapar.
       */
      let rect = mount.getBoundingClientRect();
      const refreshRect = () => {
        rect = mount.getBoundingClientRect();
      };

      const onPointer = (e: PointerEvent) => {
        if (!rect.width || !rect.height) return;
        target.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        target.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      };
      if (fine) window.addEventListener("pointermove", onPointer, { passive: true });

      // --- Scroll: mühür yavaşça döner ve zeminin içine geri çekilir.
      // Ölçüm kare başına BİR kez yapılır (rAF ile kısılır): kaydırma
      // sırasında her olayda düzen hesabı yapılmaz.
      let scrollT = 0;
      let scrollQueued = false;
      const measureScroll = () => {
        scrollQueued = false;
        const r = mount.getBoundingClientRect();
        rect = r;
        scrollT = Math.min(1, Math.max(0, -r.top / Math.max(r.height, 1)));
      };
      const onScroll = () => {
        if (scrollQueued) return;
        scrollQueued = true;
        requestAnimationFrame(measureScroll);
      };
      window.addEventListener("scroll", onScroll, { passive: true });

      // Yeniden boyutlandırmada kadraj yeniden HESAPLANIR. Sadece boyut
      // güncellemek, en-boy oranı değişince mührün kırpılmasına yol açardı.
      const onResize = () => {
        const w = mount.clientWidth || 1;
        const h = mount.clientHeight || 1;
        const a = w / h;
        refreshRect();
        camera.aspect = a;
        camera.fov = a < 0.75 ? 50 : a < 1 ? 46 : a > 2.1 ? 30 : 34;
        camera.position.z = a < 0.75 ? 7.4 : a < 1 ? 7.0 : 6.4;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w >= 2560 ? 1 : w >= 1600 ? 1.5 : w < 768 ? 1.5 : 2));
        renderer.setSize(w, h);
        group.position.x = a < 0.75 ? 0.35 : a > 2.1 ? 1.85 : w < 768 ? 0.55 : 1.55;
        group.position.y = a < 0.75 ? -0.3 : 0.05;
      };
      window.addEventListener("resize", onResize);

      let running = true;
      let onScreen = true;
      let raf = 0;

      // Iki ayrı durum, iki ayrı olay kaynağı: görünürlük ve sekme durumu.
      // Tek bayrağa sıkıştırılırsa, sekmeye dönüş görünürlüğü YENİDEN
      // sorgulamadan yeniden başlatır ve ekran dışındayken çalışmaya devam eder.
      const io = new IntersectionObserver(
        (entries) => {
          onScreen = entries[0]?.isIntersecting ?? true;
          if (onScreen && running && !reduced && !raf) raf = requestAnimationFrame(loop);
        },
        { threshold: 0 }
      );
      io.observe(mount);

      const onVisibility = () => {
        running = document.visibilityState === "visible";
        if (onScreen && running && !reduced && !raf) raf = requestAnimationFrame(loop);
      };
      document.addEventListener("visibilitychange", onVisibility);

      const monogram = group.children.find((c) => c.name === "monogram") as
        | import("./threeModule").Mesh
        | undefined;
      const key = (scene.children.find((c) => c.name === "key") as import("./threeModule").DirectionalLight)!;
      /**
       * ZAMAN ÖLÇÜMÜ — `Clock` yerine `THREE.Timer` (Clock r183'de kaldırıldı).
       *
       * GÖRSEL DAVRANIŞ BİREBİR KORUNUR:
       *   Clock.getElapsedTime() -> saniye | Timer.getElapsed() -> saniye.
       * Fark yalnızca ilerleme biçimindedir: Timer durumu yalnızca `update()`
       * çağrısında ilerletir. `update(now)` kare kısayından SONRA ve rAF'ın
       * kendi zaman damgasıyla çağrıldığı için `_elapsed`, art arda ÇİZİLEN
       * kareler arasındaki gerçek süreyi toplar — Clock'un duvar saatiyle aynı
       * sonuç (en fazla bir kare aralığı, yani ≤33 ms fark). `t` zaten yalnızca
       * `sin(t*0.16)` ve `sin(t*0.5)` içinde faz olarak kullanılıyor; bu fark
       * görülemez.
       *
       * `timer.connect(document)` BİLEREK çağrılmıyor: connect(), sekme
       * gizliyken delta'yı 0'a kilitleyip görünür olunca saati sıfırlar — bu
       * Clock'un mevcut davranışından FARKLI olurdu (Clock gizlilik sonrası
       * olduğu yerden, büyük sıçramayla devam eder). Döngü zaten
       * `visibilitychange` + IntersectionObserver ile durduğu için connect
       * eklemek davranışı DEĞİŞTİRİRDİ. Eklenmedi.
       *
       * Sonuç: connect edilmediğinden Timer'da silinecek dinleyici/ kaynak
       * yoktur; `cleanupRef` içinde ayrıca bir dispose gerekmez.
       */
      const timer = new THREE.Timer();

      // Kare hızı sınırı. Bu mühür çok yavaş drift ettiği için 30 fps
      // gözle AYIRT EDİLEMEZ; buna karşılık GPU/CPU yükü yarıya iner.
      // Ana iş parçacığı boşa çalışmaz.
      const FRAME_MS = 1000 / 30;
      let last = 0;

      function loop(now: number) {
        raf = 0;
        if (!running || !onScreen) return;
        raf = requestAnimationFrame(loop);
        if (now - last < FRAME_MS) return;
        last = now;
        // Timer durumu yalnızca update() ile ilerler; rAF'ın kendi zaman
        // damgası verilir ki kare kısayonu süreyi olduğumuz gibi görsün.
        timer.update(now);
        const t = timer.getElapsed();

        // Çok yavaş, sürekli fiziksel drift. Aşma yok, zıplama yok.
        group.rotation.y += (target.x * 0.18 + 0.16 - group.rotation.y) * 0.02;
        group.rotation.x = -0.34 + target.y * 0.1 + Math.sin(t * 0.16) * 0.03;
        group.rotation.z = scrollT * 0.42;
        group.position.z = THREE.MathUtils.lerp(group.position.z, -scrollT * 1.4, 0.03);
        group.scale.setScalar(1 - scrollT * 0.12);

        key.position.x = -3.2 + target.x * 1.5;
        key.position.y = 2.6 - target.y * 1.1;

        if (monogram) monogram.position.z = 0.17 + Math.sin(t * 0.5) * 0.012;

        renderer.render(scene, camera);
      }

      if (reduced) {
        group.rotation.set(-0.34, 0.16, 0.2);
        renderer.render(scene, camera);
        // Yedeğin de kapanması ŞART: aksi halde statik SVG mühür, çizilmiş
        // WebGL mührünün ÜZERİNDE kalır ve iki mühür üst üste basılır.
        setReady(true);
      } else {
        setReady(true);
        raf = requestAnimationFrame(loop);
      }

      cleanupRef.current = () => {
        running = false;
        cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        document.removeEventListener("visibilitychange", onVisibility);
        scene.traverse((obj) => {
          const mesh = obj as import("./threeModule").Mesh;
          mesh.geometry?.dispose();
          const m = mesh.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else if (m) m.dispose();
        });
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      };
    };

    /*
     * KURULUM YALNIZCA BOŞTA ZAMANDA.
     *
     * ÖNEMLİ: burada bir requestAnimationFrame tetikleyicisi YOK. rAF, ilk
     * boyamadan hemen sonra çalışır; yani Three.js yine de LCP'nin
     * ölçüldüğü kritik pencerede yüklenirdi (ölçüm: 726 ms'lik tek bir uzun
     * görev, TBT ~1.040 ms). Gerçek amaç, kurulumu tarayıcı BOŞTA olduğunda
     * başlatmaktır.
     *
     * `timeout` yalnızca güvenlik ağıdır: boşta zaman hiç gelmezse bile
     * sahne yine de kurulur — 3D asla kaybolmaz.
     */
    const ric = (
      window as unknown as {
        requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
        cancelIdleCallback?: (id: number) => void;
      }
    ).requestIdleCallback;

    const pending = ric
      ? ric(
          () => {
            start().catch(() => {
              /* Fallback DOM'da zaten mevcut. */
            });
          },
          { timeout: 2000 }
        )
      : window.setTimeout(() => {
          start().catch(() => {
            /* Fallback DOM'da zaten mevcut. */
          });
        }, 400);

    return () => {
      disposed = true;
      // Kurulum başlamadıysa bekleyen zamanlayıcıyı iptal et.
      if (!started) {
        if (pending !== undefined) {
          if (ric) {
            (window as unknown as { cancelIdleCallback?: (id: number) => void })
              .cancelIdleCallback?.(pending);
          } else {
            window.clearTimeout(pending);
          }
        }
      }
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: ready ? 0 : 1 }}
      >
        <FallbackSeal />
      </div>
    </div>
  );
}
