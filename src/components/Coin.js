import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────────────────
// makeCoinMesh: tạo đồng xu 3D giống đồng dollar ($).
//
// Cấu trúc:
//   1. Thân đĩa vàng (CylinderGeometry) — phần cơ thể chính
//   2. Viền cạnh sẫm (TorusGeometry)   — tạo depth cho cạnh xu
//   3. Mặt nổi sáng (CylinderGeometry nhỏ hơn, mỏng hơn) — highlight bề mặt
//   4. Ký hiệu $ (thanh dọc + 2 cung S + 2 vạch ngang)
//
// Khái niệm CG:
//  - CylinderGeometry(rTop, rBot, height, segments): hình trụ. Trục mặc định Y;
//    xoay PI/2 quanh X → trục Z (Z-up game), mặt đĩa song song XY-plane.
//  - TorusGeometry(R, tube, radialSeg, tubularSeg, arc): hình xuyến (vòng tròn).
//    arc < 2*PI → chỉ vẽ một phần cung (dùng cho cung S trong ký hiệu $).
//  - Parent–Child Transform: tất cả chi tiết trong group cùng nhận rotation.z
//    của group → toàn bộ xu xoay cùng nhau như một khối.
// ─────────────────────────────────────────────────────────────────────────────
export function makeCoinMesh() {
  const group = new THREE.Group();

  // ── Materials ──────────────────────────────────────────────────────────────
  // MeshLambertMaterial: phản chiếu ánh sáng diffuse (Lambert) — nhẹ, phù hợp
  // với low-poly style. flatShading=true → mỗi mặt tam giác một màu đồng nhất.
  const goldMat       = new THREE.MeshLambertMaterial({ color: 0xd4a017, flatShading: true }); // vàng ấm chính
  const brightGoldMat = new THREE.MeshLambertMaterial({ color: 0xffd700, flatShading: true }); // vàng sáng mặt nổi
  const darkGoldMat   = new THREE.MeshLambertMaterial({ color: 0x8b6914, flatShading: true }); // vàng sậm viền
  const dollarMat     = new THREE.MeshLambertMaterial({ color: 0x5c4000, flatShading: true }); // nâu tối cho ký hiệu $

  // ── 1. Thân đĩa chính ─────────────────────────────────────────────────────
  // CylinderGeometry: trục mặc định Y → rotation.x = PI/2 chuyển sang trục Z.
  // Sau xoay: mặt đĩa nằm song song XY (nhìn từ camera trên xuống thấy hình tròn).
  // Mặt trên (face) ở z = +1.75 (= height/2 = 3.5/2).
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(8, 8, 3.5, 24),
    goldMat
  );
  disc.rotation.x = Math.PI / 2;
  disc.castShadow = true;
  group.add(disc);

  // ── 2. Viền cạnh (TorusGeometry) ──────────────────────────────────────────
  // Torus nằm trong mặt phẳng XY mặc định → bao quanh cạnh của đĩa (r=8).
  // Tạo hiệu ứng viền nổi đậm và tăng depth cho đồng xu.
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(8, 1, 8, 24),
    darkGoldMat
  );
  rim.castShadow = true;
  group.add(rim);

  // ── 3. Mặt nổi sáng (raised face) ─────────────────────────────────────────
  // Đĩa nhỏ hơn (r=6.2), mỏng (h=0.6), đặt lên trên mặt đĩa chính.
  // Màu vàng sáng hơn → highlight bề mặt, tạo cảm giác lồi.
  // Vị trí z = 1.75 (top disc) + 0.3 (half of 0.6) = 2.05
  const face = new THREE.Mesh(
    new THREE.CylinderGeometry(6.2, 6.2, 0.6, 24),
    brightGoldMat
  );
  face.rotation.x = Math.PI / 2;
  face.position.z = 2.05;
  group.add(face);

  // ── 4. Ký hiệu $ ──────────────────────────────────────────────────────────
  // Tất cả chi tiết $ ở z = SZ (nổi trên mặt face), nằm trong mặt phẳng XY.
  //
  // Khái niệm CG — cung S bằng TorusGeometry arc:
  //   TorusGeometry mặc định: arc bắt đầu từ +X, đi ngược chiều kim đồng hồ.
  //   arc = PI → nửa đường tròn.
  //   rotation.z = -PI/2 → xoay cung thành nửa PHẢI (mở sang trái) → cung trên của S.
  //   rotation.z = +PI/2 → xoay cung thành nửa TRÁI (mở sang phải) → cung dưới của S.
  const SZ = 2.65; // z của ký hiệu $ (0.6 trên mặt face)
  const R  = 1.5;  // bán kính cung S

  // 4a. Thanh dọc xuyên qua $ (từ y = -3.6 đến y = +3.6)
  const bar = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 7.2, 1),
    dollarMat
  );
  bar.position.set(0, 0, SZ);
  group.add(bar);

  // 4b. Vạch ngang trên (tick trên đầu $)
  const topTick = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.75, 1),
    dollarMat
  );
  topTick.position.set(0, 3.4, SZ);
  group.add(topTick);

  // 4c. Vạch ngang dưới (tick dưới đuôi $)
  const botTick = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.75, 1),
    dollarMat
  );
  botTick.position.set(0, -3.4, SZ);
  group.add(botTick);

  // 4d. Cung S trên — nửa PHẢI đường tròn bán kính R, tâm tại (0, R).
  //   Arc đi từ (0, 0) qua (R, R) đến (0, 2R): lồi sang phải phần trên.
  //   rotation.z = -PI/2: chuyển nửa trên (mặc định) → nửa phải.
  const topArc = new THREE.Mesh(
    new THREE.TorusGeometry(R, 0.62, 6, 12, Math.PI),
    dollarMat
  );
  topArc.position.set(0, R, SZ);
  topArc.rotation.z = -Math.PI / 2;
  group.add(topArc);

  // 4e. Cung S dưới — nửa TRÁI đường tròn bán kính R, tâm tại (0, -R).
  //   Arc đi từ (0, 0) qua (-R, -R) đến (0, -2R): lồi sang trái phần dưới.
  //   rotation.z = +PI/2: chuyển nửa trên (mặc định) → nửa trái.
  const botArc = new THREE.Mesh(
    new THREE.TorusGeometry(R, 0.62, 6, 12, Math.PI),
    dollarMat
  );
  botArc.position.set(0, -R, SZ);
  botArc.rotation.z = Math.PI / 2;
  group.add(botArc);

  return group;
}
