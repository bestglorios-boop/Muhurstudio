/**
 * MÜHÜR — ÜRETİM THREE MODÜLÜ
 * --------------------------------------------------------------------------
 * Yalnızca sahneyi kuran sınıflar dışa aktarılır.
 *
 * NEDEN AYRI BİR DOSYA:
 * Sahne, `three` paketinin TAMAMINI içeri alınıyordu. Paket ~720 KB'tır ve
 * TEK parçadır: kullanılmayan yükleyiciler (GLTF/Texture/FBX), PMREM,
 * ACES tone mapping, LOD, iskelet (Skeleton/IK) sistemleri, gölge
 * haritaları ve WebGL yedekleri de bu parçayla birlikte indirilip
 * ÇALIŞTIRILIYORDU. Lighthouse bunu "kullanılmayan JavaScript" olarak
 * ölçüyordu: 181 KB'lık sıkıştırılmış yükün 95 KB'ı hiç çalıştırılmıyordu.
 *
 * Burada sadece gereken sınıflar listelenir; ağaç budama (tree-shaking)
 * sayesinde kullanılmayan kod parçaya hiç girmez.
 *
 * SAHNE DEĞİŞMEDİ: aynı geometri, aynı malzemeler, aynı ışıklar, aynı
 * sonuç. Yalnızca indirilen ve derlenen kod azalır.
 *
 * `three/src/*` yolları three@0.186'ın `exports` haritasıyla desteklenir
 * ve resmî dağıtımın parçasıdır.
 */

// Sahne / nesne
export { Scene } from "three/src/scenes/Scene.js";
export { Group } from "three/src/objects/Group.js";
export { Mesh } from "three/src/objects/Mesh.js";
export { Line } from "three/src/objects/Line.js";

// Kamera / zaman
export { PerspectiveCamera } from "three/src/cameras/PerspectiveCamera.js";
/**
 * `Clock` r183'de kullanımdan kaldırıldı; kurucusu artık şu uyarıyı basıyor:
 *   "THREE.Clock: This module has been deprecated. Please use THREE.Timer instead."
 * `Timer` aynı `src/core` alt ağacından gelir, hiçbir iç bağımlılığı yoktur ve
 * `getElapsed()` saniye döndürür — yani birim `Clock.getElapsedTime()` ile aynıdır.
 * Bu dosya ağaç budama için tek tek sınıf listelediğinden paket boyutu değişmez.
 */
export { Timer } from "three/src/core/Timer.js";
export { MathUtils } from "three/src/math/MathUtils.js";

// Geometri
export { CylinderGeometry } from "three/src/geometries/CylinderGeometry.js";
export { TorusGeometry } from "three/src/geometries/TorusGeometry.js";
export { ExtrudeGeometry } from "three/src/geometries/ExtrudeGeometry.js";
export { BufferGeometry } from "three/src/core/BufferGeometry.js";
export { Float32BufferAttribute } from "three/src/core/BufferAttribute.js";
export { Shape } from "three/src/extras/core/Shape.js";

// Malzeme
export { MeshStandardMaterial } from "three/src/materials/MeshStandardMaterial.js";
export { LineBasicMaterial } from "three/src/materials/LineBasicMaterial.js";

// Işık
export { DirectionalLight } from "three/src/lights/DirectionalLight.js";
export { PointLight } from "three/src/lights/PointLight.js";
export { AmbientLight } from "three/src/lights/AmbientLight.js";

// Render
export { WebGLRenderer } from "three/src/renderers/WebGLRenderer.js";
