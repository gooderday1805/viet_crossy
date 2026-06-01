import * as THREE from "three";
import { tileSize } from "../constants";

// Bệ nhảy hồ sen nay là MOVING PLATFORMS (PondPlatforms.js).
// safePathTiles tĩnh đã được thay thế — xem src/components/PondPlatforms.js.

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: tạo BoxGeometry + MeshLambertMaterial và thêm vào parent group.
//
// BoxGeometry(w, d, h):
//   w = chiều ngang (X), d = chiều sâu (Y), h = chiều cao (Z)
//   → Tạo AABB (Axis-Aligned Bounding Box) gồm 12 tam giác (6 mặt × 2).
//
// MeshLambertMaterial: mô hình tô bóng Lambert khuếch tán đơn giản.
//   Phản xạ ánh sáng tỷ lệ với cos(θ) — không có thành phần specular (gương).
//   flatShading = true: dùng 1 normal vector cho cả mặt thay vì nội suy per-vertex
//   → tạo phong cách "lowpoly" / faceted đặc trưng.
// ─────────────────────────────────────────────────────────────────────────────
function box(parent, w, d, h, color, pos) {
  const mat = new THREE.MeshLambertMaterial({ color, flatShading: true });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, d, h), mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  // castShadow / receiveShadow: tham gia vào shadow map của DirectionalLight
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

// Tạo texture biển tên bằng Canvas 2D API — không cần file ảnh ngoài.
// THREE.CanvasTexture bọc HTMLCanvasElement thành texture GPU trực tiếp.
function createSignTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#8B0000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 58px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CHÙA MỘT CỘT", canvas.width / 2, canvas.height / 2 + 4);
  return new THREE.CanvasTexture(canvas);
}

// ─────────────────────────────────────────────────────────────────────────────
// createPagodaArea(): trả về THREE.Group chứa toàn bộ khu vực chùa.
//
// Hệ tọa độ Z (chiều cao):
//   Z = 0   → mặt đất
//   Z = 1.5 → mặt cỏ (grass foundation cao 3, center = 0)
//   Z = 5   → mặt đường đá (stone path)
//   Z = 6   → mặt nước hồ (water top surface)
//   Z = 11  → mặt bệ bậc nhảy (jumping platform surface)
// ─────────────────────────────────────────────────────────────────────────────
export function createPagodaArea() {
  // THREE.Group: nút trong scene graph, gom nhiều mesh lại để transform chung.
  const g = new THREE.Group();

  // ── 1. ĐƯỜNG ĐÁ DẪN VÀO (Stone Approach Path: rows -1 → -3) ─────────────
  for (let row = -1; row >= -3; row--) {
    box(g, 34, tileSize, 3, 0xd5d8dc, [0, row * tileSize, 4.5]);
  }

  // ── 2. CỔ TAM QUAN (Triple Archway Gate) ─────────────────────────────────
  // Tam Quan = cổng chính khuôn viên chùa Việt Nam, gồm 3 lối: giữa lớn + 2 bên nhỏ.
  const gateY = -2 * tileSize; // = -84 (row -2)
  const CZ    = 10;            // Z đỉnh nền móng (foundation top)
  const CH    = 82;            // chiều cao cổng giữa (Center Gate Height)
  const SH    = 60;            // chiều cao cổng phụ (Side Gate Height)

  // Nền móng đá chung (stone foundation) — đỡ toàn bộ Tam Quan
  box(g, 410, 22, 10, 0x9e9e9e, [0, gateY, 5]);

  // Cổng giữa (Center Archway) — cao 82 đơn vị tính từ đỉnh nền
  box(g, 12, 12, CH, 0x8b2500, [-36, gateY, CZ + CH / 2]); // cột trái
  box(g, 12, 12, CH, 0x8b2500, [+36, gateY, CZ + CH / 2]); // cột phải
  box(g, 82, 12, 22, 0xf5e0a0, [  0, gateY, CZ + CH - 11]); // lintel ngang đỉnh
  box(g, 98, 16, 16, 0xc0392b, [  0, gateY, CZ + CH + 8 ]); // thân mái ngói
  box(g,106, 18,  7, 0x7d1e06, [  0, gateY, CZ + CH + 17]); // gờ sống mái đậm
  box(g, 10, 10, 14, 0xe6a817, [  0, gateY, CZ + CH + 25]); // chóp vàng đỉnh

  // Cổng phụ trái + phải (Side Arches) × 2
  [{ cx: -118 }, { cx: +118 }].forEach(({ cx }) => {
    box(g, 10, 10, SH, 0x8b2500, [cx - 26, gateY, CZ + SH / 2]);
    box(g, 10, 10, SH, 0x8b2500, [cx + 26, gateY, CZ + SH / 2]);
    box(g, 60, 12, 16, 0xf5e0a0, [cx, gateY, CZ + SH - 8 ]);
    box(g, 72, 14, 14, 0xc0392b, [cx, gateY, CZ + SH + 7 ]);
    box(g, 78, 16,  6, 0x7d1e06, [cx, gateY, CZ + SH + 14]);
    box(g,  8,  8,  9, 0xe6a817, [cx, gateY, CZ + SH + 19]);
  });

  // Tường nối giữa các cổng (Connecting Wall Segments)
  box(g, 38, 12, 30, 0xf5e0a0, [ -68, gateY, CZ + 15]); // giữa → trái
  box(g, 38, 12, 30, 0xf5e0a0, [ +68, gateY, CZ + 15]); // giữa → phải
  box(g, 44, 12, 30, 0xf5e0a0, [-168, gateY, CZ + 15]); // đầu hồi trái
  box(g, 44, 12, 30, 0xf5e0a0, [+168, gateY, CZ + 15]); // đầu hồi phải

  // Cột đèn lồng 2 bên cổng giữa (Lantern Posts)
  [{ x: -88 }, { x: +88 }].forEach(({ x }) => {
    box(g, 10, 10,  5, 0x9e9e9e, [x, gateY,  2.5]); // đế đá
    box(g,  6,  6, 40, 0x9e9e9e, [x, gateY, 25  ]); // thân cột
    box(g, 14, 14,  4, 0x9e9e9e, [x, gateY, 47  ]); // mũ cột
    box(g, 11, 11, 16, 0xe74c3c, [x, gateY, 57  ]); // đèn lồng đỏ
    box(g,  6,  6,  6, 0xe6a817, [x, gateY, 67  ]); // chóp vàng
  });

  // Cây Bồ Đề cặp 1 — hai bên cổng Tam Quan (cùng row với cổng = gateY)
  [{ x: -120 }, { x: +120 }].forEach(({ x }) => {
    box(g, 14, 16, 32, 0x4e342e, [x, gateY, 16]); // thân cây
    box(g, 46, 50, 40, 0x27ae60, [x, gateY, 52]); // tán lá
  });

  // ── 4. SÂN CHÙA (Temple Courtyard: row -3.5, khoảng giữa bình phong và hồ)
  box(g, 360, tileSize, 3, 0xcacfd2, [0, -3.5 * tileSize, 3.5]);

  // ── 5. HỒ SEN + BẬC NHẢY (Lotus Pond: rows -4 → -9) ─────────────────────
  // TRÒ CHƠI NHẢY BẬC: người chơi phải nhảy qua đúng các bệ đá (safePathTiles).
  // Rơi xuống nước → game over.
  //
  // Mặt nước dùng transparent material (alpha blending):
  //   opacity=0.88, depthWrite=false → tránh z-fighting với các mesh bậc đá bên trên.
  const pondTopCenter    = -4 * tileSize; // = -168 (row -4)
  const pondBottomCenter = -9 * tileSize; // = -378 (row -9)
  const pondLen          = 6 * tileSize;  // = 252 (6 hàng × 42)
  const pondCenterY      = (pondTopCenter + pondBottomCenter) / 2; // = -273

  const waterMat = new THREE.MeshLambertMaterial({
    color: 0x1a5276,    // xanh dương sâu — nước hồ nguy hiểm
    transparent: true,
    opacity: 0.88,
    flatShading: true,
    depthWrite: false,  // không ghi depth buffer → mesh bậc đá phía trên không bị clip
  });
  const waterMesh = new THREE.Mesh(
    new THREE.BoxGeometry(17 * tileSize, pondLen, 6),
    waterMat
  );
  waterMesh.position.set(0, pondCenterY, 3); // Z=3 → mặt nước = Z=6
  waterMesh.receiveShadow = true;
  g.add(waterMesh);

  // Bệ nhảy nay là MOVING PLATFORMS — tạo và animate trong PondPlatforms.js + animatePond.js.
  // Không tạo static mesh ở đây nữa để tránh chồng lên bệ di động.

  // Lá sen & hoa sen trang trí (phủ khắp hồ)
  const lotusSpots = [
    { xi:  3, yi: -5 }, { xi: -3, yi: -5 },
    { xi:  3, yi: -6 }, { xi: -3, yi: -7 },
    { xi:  2, yi: -8 }, { xi: -3, yi: -8 },
    { xi:  3, yi: -9 }, { xi: -2, yi: -4 },
  ];
  lotusSpots.forEach(({ xi, yi }) => {
    box(g, 20, 20,  1, 0x1e8449, [xi * tileSize, yi * tileSize, 6.5]); // lá sen phẳng
    box(g, 10, 10,  7, 0xf1948a, [xi * tileSize, yi * tileSize, 10  ]); // hoa sen nhô lên
  });

  // Cây Bồ Đề cặp 2 — hai bên hồ, hàng -6 (giữa hồ)
  [{ x: -165 }, { x: +165 }].forEach(({ x }) => {
    box(g, 14, 16, 32, 0x4e342e, [x, -6 * tileSize, 16]);
    box(g, 46, 50, 40, 0x27ae60, [x, -6 * tileSize, 52]);
  });

  // ── 6. LỐI RA HỒ (Approach strip: row -10) ───────────────────────────────
  box(g, 300, tileSize, 3, 0xcacfd2, [0, -10 * tileSize, 3.5]);

  // ── 7. CHÙA MỘT CỘT (Single Pillar Pagoda) ───────────────────────────────
  // Biểu tượng kiến trúc Phật giáo Việt Nam: 1 cột đá đỡ gian thờ → như hoa sen vươn khỏi hồ.
  // Dùng THREE.Group con (shrineGroup) để tạo local coordinate system:
  // tất cả tọa độ bên trong tính từ tâm nhóm (shrineGroup.position).
  const shrineGroup = new THREE.Group();
  shrineGroup.position.set(0, -11 * tileSize, 0); // world Y = -462
  g.add(shrineGroup);

  // Hồ nhỏ quanh chân cột (Mini Pond)
  const miniMat = new THREE.MeshLambertMaterial({
    color: 0x1a5276,
    transparent: true,
    opacity: 0.88,
    flatShading: true,
    depthWrite: false,
  });
  const miniPond = new THREE.Mesh(new THREE.BoxGeometry(130, 130, 7), miniMat);
  miniPond.position.set(0, 0, 3.5);
  miniPond.receiveShadow = true;
  shrineGroup.add(miniPond);

  // Bệ đá trong hồ (Stone Base)
  box(shrineGroup, 30, 30,  6, 0x9e9e9e, [0, 0,  3]);

  // Cột đá duy nhất (Single Stone Pillar) — "một cột" trong tên chùa
  // Đây là cấu kiện chịu lực duy nhất — toàn bộ tải trọng gian thờ dồn vào 1 cột.
  box(shrineGroup, 22, 22, 72, 0x9e9e9e, [0, 0, 36]); // Z center=36 → từ Z=0 đến Z=72

  // Sàn gỗ trên đỉnh cột (Wooden Platform)
  box(shrineGroup, 66, 66,  6, 0x6d4c41, [0, 0, 75]); // Z=72(đỉnh cột)+3=75

  // Lan can hành lang (Balcony Rail)
  box(shrineGroup, 74, 74,  5, 0x7d1e06, [0, 0, 81]);

  // Cột xiên 4 góc (Diagonal Support Beams) — phân phối tải từ sàn xuống cột chính
  // Dùng rotation.x / rotation.y để nghiêng beam về phía tâm.
  // Rotation Euler: xoay quanh trục X và Y của local frame.
  const beamMat = new THREE.MeshLambertMaterial({ color: 0x6d4c41, flatShading: true });
  [[-24, -24], [-24, 24], [24, -24], [24, 24]].forEach(([bx, by]) => {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 30), beamMat);
    beam.position.set(bx, by, 72);
    beam.rotation.x = (by > 0 ? 1 : -1) * 0.38; // nghiêng về tâm theo trục X
    beam.rotation.y = (bx > 0 ? -1 : 1) * 0.38; // nghiêng về tâm theo trục Y
    beam.castShadow = true;
    beam.receiveShadow = true;
    shrineGroup.add(beam);
  });

  // Gian thờ chính (Prayer Hall Body) — tường màu kem/vàng nhạt
  box(shrineGroup, 52, 52, 32, 0xf5e0a0, [0, 0, 97]);

  // 3 tầng mái ngói đỏ (Three-Tier Pagoda Roof)
  // Mái nhiều tầng = đặc trưng chùa chiền châu Á.
  // Mỗi tầng cao hơn và hẹp hơn tầng dưới → tạo đường viền hình kim tự tháp.
  box(shrineGroup, 78, 78,  8, 0xc0392b, [0, 0, 123]); // tầng 1 — rộng nhất
  box(shrineGroup, 62, 62,  7, 0xc0392b, [0, 0, 134]); // tầng 2
  box(shrineGroup, 46, 46,  5, 0xc0392b, [0, 0, 143]); // tầng 3 — hẹp nhất
  box(shrineGroup, 14, 14, 28, 0xe6a817, [0, 0, 160]); // chóp vàng đỉnh tháp

  // Biển tên chùa (Sign with Canvas Texture)
  // BoxGeometry dẹt làm bảng, map texture Canvas lên mặt trước.
  // sign.rotation.x = π/2 để biển đứng song song trục Y (hướng về phía camera).
  const signTex = createSignTexture();
  const signMat = new THREE.MeshLambertMaterial({
    map: signTex,
    color: 0xffffff, // white → không tint, texture hiện nguyên màu canvas
    flatShading: true,
  });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 10), signMat);
  sign.position.set(0, -27, 97); // Y=-27: mặt trước gian thờ (52/2+1=27)
  sign.rotation.x = Math.PI;
  sign.castShadow = true;
  sign.receiveShadow = true;
  shrineGroup.add(sign);

  // ── 8. TƯỜNG BAO KHUÔN VIÊN (Compound Perimeter Walls) ───────────────────
  // Tường gạch bao quanh toàn bộ chùa — ranh giới thánh địa.
  // Tường dọc (Y-direction) + tường hậu (back wall) tại Y âm nhất.
  const wallStartY = gateY;           // Y = -84 (cổng trước)
  const wallEndY   = -12 * tileSize;  // Y = -504 (sau chùa)
  const wallLen    = Math.abs(wallEndY - wallStartY); // 420 đơn vị
  const wallMidY   = (wallStartY + wallEndY) / 2;    // -294

  // Tường dọc trái và phải (X = ±210)
  box(g,  8, wallLen, 30, 0xf5e0a0, [-210, wallMidY, 15]);
  box(g, 10, wallLen,  5, 0x7d1e06, [-210, wallMidY, 32]);
  box(g,  8, wallLen, 30, 0xf5e0a0, [+210, wallMidY, 15]);
  box(g, 10, wallLen,  5, 0x7d1e06, [+210, wallMidY, 32]);

  // Tường hậu (Back Wall tại Y=-504)
  box(g, 428, 8, 30, 0xf5e0a0, [0, wallEndY, 15]);
  box(g, 432,10,  5, 0x7d1e06, [0, wallEndY, 32]);

  return g;
}
