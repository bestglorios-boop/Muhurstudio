import type * as SealModule from "./threeModule";

/** Sahne kurucularına geçen modül biçimi (yalnızca ihtiyaç duyulan sınıflar). */
type T = typeof SealModule;

/**
 * Mühür geometrisi: basılmış disk, iki ince kabartma halka, kabartma "M"
 * ve arkasında tek parça, çok ince kontur alanı.
 * Hepsi yakın-siyah: ışık yalnızca formu açığa çıkarır.
 *
 * NOT: `THREE` parametresi artık `three` paketinin tamamı değil, yalnızca
 * gerçekten kullanılan sınıfları taşıyan ./threeModule'dur (bkz. o dosya).
 * Sahne içeriği ve görünüm değişmemiştir.
 */
export function buildSeal(
  THREE: T,
  group: InstanceType<T["Group"]>,
  segs: number,
  small: boolean
) {
  const body = new THREE.MeshStandardMaterial({
    color: 0x0b0b0b,
    roughness: 0.78,
    metalness: 0.06,
  });

  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 2.5, 0.34, segs, 1, false),
    body
  );
  plate.rotation.x = Math.PI / 2;
  group.add(plate);

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x161616,
    roughness: 0.55,
    metalness: 0.12,
  });

  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.05, 10, segs), ringMat);
  ring.position.z = 0.17;
  group.add(ring);

  const inner = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.022, 8, segs), ringMat);
  inner.position.z = 0.17;
  group.add(inner);

  // Mührün kendisi: geometrik M, hafif kabartma.
  // Bu monogram, public/icons/logo.svg içindeki M ile AYNI oranlardadır
  // (gövde genişliği 0.444, üst çentik 0.211, V sivri ucu -0.684). Ana logo
  // değişirse buradaki normalize koordinatlar da birlikte güncellenir; 3D
  // mühür ile marka işareti hep aynı M'yi gösterir.
  const shape = new THREE.Shape();
  const px = (x: number) => x * 0.92;
  const py = (y: number) => y * 1.16;
  const pts: [number, number][] = [
    [-1, -1],
    [-1, 1],
    [-0.444, 1],
    [0, 0.211],
    [0.389, 1],
    [1, 1],
    [1, -1],
    [0.444, -1],
    [0.444, 0.211],
    [0, -0.684],
    [-0.444, 0.211],
    [-0.444, -1],
  ];
  shape.moveTo(px(pts[0][0]), py(pts[0][1]));
  for (let i = 1; i < pts.length; i++) shape.lineTo(px(pts[i][0]), py(pts[i][1]));
  shape.closePath();

  const monogram = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: small ? 1 : 3,
      curveSegments: 4,
    }),
    new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.62, metalness: 0.08 })
  );
  monogram.name = "monogram";
  monogram.position.z = 0.17;
  group.add(monogram);

  // Arka konturlar: basınç alanı. Parçacık yok, yalnızca çizgi.
  const count = small ? 9 : 16;
  for (let i = 0; i < count; i++) {
    const r = 2.9 + i * 0.34;
    const verts: number[] = [];
    const steps = segs * 2;
    for (let s = 0; s <= steps; s++) {
      const a = (s / steps) * Math.PI * 2;
      const wob =
        1 + Math.sin(a * 3 + i * 0.5) * 0.012 + Math.cos(a * 5 - i * 0.3) * 0.008;
      verts.push(Math.cos(a) * r * wob, Math.sin(a) * r * wob, -0.42 - i * 0.012);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    const line = new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({
        color: 0xf5f2ed,
        transparent: true,
        opacity: 0.055 - i * 0.0022,
      })
    );
    group.add(line);
  }

  group.rotation.x = -0.34;
  group.rotation.y = 0.16;
  // Yatay konum SealScene tarafından EN-BOY ORANINA göre belirlenir
  // (dar ekranda sağa sıkışır, geniş ekranda daha da sağa gider).
  // Burada sabit değer yazılmaz.
}

/** Yumuşak, kontrollü ışık. Mor/mavi/parıltı yok. */
export function buildLights(THREE: T, scene: InstanceType<T["Scene"]>) {
  const key = new THREE.DirectionalLight(0xf5f2ed, 1.15);
  key.name = "key";
  key.position.set(-3.2, 2.6, 3.4);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x8a8a8a, 0.32);
  fill.position.set(3.4, -1.2, 2.2);
  scene.add(fill);

  // Marka detayı: çok küçük, çok sönük kırmızı temas.
  const seal = new THREE.PointLight(0xc23b22, 0.5, 9, 2);
  seal.position.set(1.9, -1.4, 1.6);
  scene.add(seal);

  scene.add(new THREE.AmbientLight(0x1a1a1a, 1.1));
}