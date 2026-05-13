import * as THREE from "three";
import { tileSize } from "../constants";

export const safePathTiles = [
  { xIndex:  0, yIndex: -4 }, // Bước vào hồ từ phía Cổng Tam Quan
  { xIndex: -1, yIndex: -5 }, // Lệch trái
  { xIndex: -1, yIndex: -5 }, // Giữ nguyên (trùng, dùng cho logic nhảy đôi)
  { xIndex:  0, yIndex: -6 }, // Về giữa
  { xIndex:  1, yIndex: -7 }, // Lệch phải, tiến vào Chùa
];

function box(parent, w, d, h, color, pos) {
  const mat = new THREE.MeshLambertMaterial({ color, flatShading: true });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, d, h), mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

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

export function createPagodaArea() {
  const pagodaGroup = new THREE.Group();

  for (let row = -1; row >= -3; row--) {
    const worldY = row * tileSize;
    // Con đường đá (stone path): dẫn từ điểm xuất phát vào cổng chùa
    box(pagodaGroup, 24, tileSize - 2, 2, 0xd5d8dc, [0, worldY, 4.5]);
  }

  const gateY = -84; // world Y của cổng

  // --- Nền móng đá (Stone Foundation) ---
  box(pagodaGroup, 336, 16, 6, 0x9e9e9e, [0, gateY, 3]);

  // --- Cổng giữa (Center Archway) — cao ~55 đơn vị ---
  // Hai cột đỏ sơn mài (8×8 mặt cắt), tường lintel màu kem, mái ngói đỏ
  box(pagodaGroup,  8,  8, 55, 0x8b2500, [-22, gateY, 6 + 55 / 2]); // cột trái
  box(pagodaGroup,  8,  8, 55, 0x8b2500, [+22, gateY, 6 + 55 / 2]); // cột phải
  box(pagodaGroup, 36,  8, 14, 0xf5e0a0, [  0, gateY, 6 + 55 - 7]); // đỉnh tường lintel
  box(pagodaGroup, 54, 12,  8, 0xc0392b, [  0, gateY, 6 + 55 + 4]); // thân mái
  box(pagodaGroup, 58, 14,  4, 0x7d1e06, [  0, gateY, 6 + 55 + 10]); // gờ sống mái đậm
  box(pagodaGroup,  6,  6,  5, 0xe6a817, [  0, gateY, 6 + 55 + 14]); // chóp vàng

  // --- Cổng phụ trái (Left Side Archway) — cao ~38 đơn vị ---
  const lGateX = -90;
  box(pagodaGroup,  8,  8, 38, 0x8b2500, [lGateX - 20, gateY, 6 + 38 / 2]);
  box(pagodaGroup,  8,  8, 38, 0x8b2500, [lGateX + 20, gateY, 6 + 38 / 2]);
  box(pagodaGroup, 32,  8, 10, 0xf5e0a0, [lGateX, gateY, 6 + 38 - 5]);
  box(pagodaGroup, 46, 12,  7, 0xc0392b, [lGateX, gateY, 6 + 38 + 3]);
  box(pagodaGroup, 50, 14,  3, 0x7d1e06, [lGateX, gateY, 6 + 38 + 8]);
  box(pagodaGroup,  5,  5,  4, 0xe6a817, [lGateX, gateY, 6 + 38 + 11]);

  // --- Cổng phụ phải (Right Side Archway) — cao ~38 đơn vị ---
  const rGateX = +90;
  box(pagodaGroup,  8,  8, 38, 0x8b2500, [rGateX - 20, gateY, 6 + 38 / 2]);
  box(pagodaGroup,  8,  8, 38, 0x8b2500, [rGateX + 20, gateY, 6 + 38 / 2]);
  box(pagodaGroup, 32,  8, 10, 0xf5e0a0, [rGateX, gateY, 6 + 38 - 5]);
  box(pagodaGroup, 46, 12,  7, 0xc0392b, [rGateX, gateY, 6 + 38 + 3]);
  box(pagodaGroup, 50, 14,  3, 0x7d1e06, [rGateX, gateY, 6 + 38 + 8]);
  box(pagodaGroup,  5,  5,  4, 0xe6a817, [rGateX, gateY, 6 + 38 + 11]);

  // --- Tường nối giữa các cổng (Wall Sections) ---
  box(pagodaGroup, 28, 8, 20, 0xf5e0a0, [-45,  gateY, 6 + 10]); // nối giữa-trái
  box(pagodaGroup, 28, 8, 20, 0xf5e0a0, [+45,  gateY, 6 + 10]); // nối giữa-phải
  box(pagodaGroup, 24, 8, 20, 0xf5e0a0, [-145, gateY, 6 + 10]); // đầu hồi trái
  box(pagodaGroup, 24, 8, 20, 0xf5e0a0, [+145, gateY, 6 + 10]); // đầu hồi phải

  const screenY = -126;

  // Bình phong — tường đứng trước sân chùa
  box(pagodaGroup, 90,  8, 30, 0xf5e0a0, [  0, screenY, 15]); // thân tường
  box(pagodaGroup, 98, 10,  5, 0xc0392b, [  0, screenY, 32]); // mái bình phong
  box(pagodaGroup, 14,  8, 30, 0x9e9e9e, [-52, screenY, 15]); // trụ đầu hồi trái
  box(pagodaGroup, 14,  8, 30, 0x9e9e9e, [+52, screenY, 15]); // trụ đầu hồi phải

  [-80, +80].forEach(lpX => {
    box(pagodaGroup,  8,  8,  4, 0x9e9e9e, [lpX, gateY,  2]);             // đế stone
    box(pagodaGroup,  5,  5, 30, 0x9e9e9e, [lpX, gateY, 19]);             // thân cột (Z=4+15)
    box(pagodaGroup, 12, 12,  3, 0x9e9e9e, [lpX, gateY, 35.5]);           // mũ cột (Z=4+30+1.5)
    box(pagodaGroup,  9,  9, 10, 0xe74c3c, [lpX, gateY, 42]);             // đèn lồng đỏ (Z=4+30+3+5)
    box(pagodaGroup,  5,  5,  4, 0xe6a817, [lpX, gateY, 49]);             // chóp vàng (Z=4+30+3+10+2)
  });

  [-100, +100].forEach(tx => {
    box(pagodaGroup, 12, 14, 25, 0x4e342e, [tx, screenY, 12.5]); // thân cây đậm
    box(pagodaGroup, 35, 38, 30, 0x27ae60, [tx, screenY, 40]);    // tán lá xanh đậm
  });

  // =========================================================================
  const pondCenterY = (-168 + -294) / 2; // = -231, tâm hồ theo Y
  const pondLengthY = 4 * tileSize;       // 4 hàng × 42 = 168 đơn vị
  const pondWidth   = 17 * tileSize;      // ~15 tiles rộng bản đồ

  const waterMat = new THREE.MeshLambertMaterial({
    color: 0x2471a3,     // xanh dương nước sâu
    transparent: true,
    opacity: 0.85,
    flatShading: true,
    depthWrite: false,   // tránh z-fighting với bệ đá phía trên
  });
  const waterMesh = new THREE.Mesh(
    new THREE.BoxGeometry(pondWidth, pondLengthY, 4),
    waterMat
  );
  waterMesh.position.set(0, pondCenterY, 2); // Z=2 = mặt nước
  waterMesh.receiveShadow = true;
  pagodaGroup.add(waterMesh);

  // --- Lá sen và hoa sen trang trí (Lotus Leaves & Flowers) ---
  // Đặt rải rác ở vùng không có bệ đá để không cản lối đi an toàn
  const lotusDecorations = [
    { x:  3, y: -5   }, { x: -3, y: -5.5 },
    { x:  2, y: -6   }, { x: -2, y: -4.5 },
    { x:  4, y: -6.5 }, { x: -4, y: -5   },
  ];
  lotusDecorations.forEach(({ x, y }) => {
    const wx = x * tileSize;
    const wy = y * tileSize;
    box(pagodaGroup, 16, 16, 1, 0x27ae60, [wx, wy, 4.5]); // lá sen phẳng
    box(pagodaGroup,  8,  8, 5, 0xf1948a, [wx, wy, 7]);   // hoa sen nhô lên
  });


  safePathTiles.forEach(({ xIndex, yIndex }) => {
    box(
      pagodaGroup,
      tileSize - 4, tileSize - 4, 4,
      0x9e9e9e,
      [xIndex * tileSize, yIndex * tileSize, 6]
    );
  });

  // --- Cây Bồ Đề cặp 2 (gần row -6) ---
  [-100, +100].forEach(tx => {
    box(pagodaGroup, 12, 14, 25, 0x4e342e, [tx, -6 * tileSize, 12.5]);
    box(pagodaGroup, 35, 38, 30, 0x27ae60, [tx, -6 * tileSize, 40]);
  });
 
  const shrineGroup = new THREE.Group();
  shrineGroup.position.set(0, -336, 0); // đặt sub-group tại world Y=-336
  pagodaGroup.add(shrineGroup);

  // --- Hồ nhỏ xung quanh cột (Mini Pond) ---
  const miniPondMat = new THREE.MeshLambertMaterial({
    color: 0x2471a3,
    transparent: true,
    opacity: 0.85,
    flatShading: true,
    depthWrite: false,
  });
  const miniPondMesh = new THREE.Mesh(new THREE.BoxGeometry(90, 90, 5), miniPondMat);
  miniPondMesh.position.set(0, 0, 2.5); // Z=2.5, tâm theo chiều cao
  miniPondMesh.receiveShadow = true;
  shrineGroup.add(miniPondMesh);

  // --- Đế đá trong hồ (Stone Base in Pond) ---
  box(shrineGroup, 20, 20,  4, 0x9e9e9e, [0, 0,   2]); // Z center=2

  // --- Cột đá duy nhất (Single Stone Pillar) ---
  // Từ Z=0 (mặt đất) đến Z=50 — đặc trưng nổi bật nhất của Chùa Một Cột.
  box(shrineGroup, 14, 14, 50, 0x9e9e9e, [0, 0,  25]); // Z center=25

  // --- Sàn gỗ trên cột (Wooden Platform) ---
  box(shrineGroup, 46, 46,  4, 0x6d4c41, [0, 0,  52]); // Z=50(đỉnh cột)+2=52

  // --- Lan can / hành lang (Rail/Balcony) ---
  box(shrineGroup, 52, 52,  3, 0x7d1e06, [0, 0,  57]); // màu đỏ thẫm

  // --- Gian thờ chính (Prayer Hall Body) ---
  // Tường màu kem/vàng nhạt — trung tâm kiến trúc Chùa Một Cột
  box(shrineGroup, 36, 36, 22, 0xf5e0a0, [0, 0,  69]);

  const beamPositions = [
    { x: +18, y: +18 },
    { x: -18, y: +18 },
    { x: +18, y: -18 },
    { x: -18, y: -18 },
  ];
  const beamMat = new THREE.MeshLambertMaterial({ color: 0x6d4c41, flatShading: true });
  beamPositions.forEach(({ x, y }) => {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 24), beamMat);
    beam.position.set(x, y, 57);                          // Z=57 giữa sàn → gian thờ
    beam.rotation.x = (y > 0 ? +1 : -1) * 0.4;          // nghiêng về tâm theo trục X
    beam.rotation.y = (x > 0 ? -1 : +1) * 0.4;          // nghiêng về tâm theo trục Y
    beam.castShadow = true;
    beam.receiveShadow = true;
    shrineGroup.add(beam);
  });

  // --- 3 Tầng mái (Roof Tiers) — mái ngói đỏ thu nhỏ dần lên trên ---
  // Mái nhiều tầng (pagoda roof) là đặc trưng kiến trúc Phật giáo châu Á.
  box(shrineGroup, 54, 54, 6, 0xc0392b, [0, 0,  82]); // tầng 1 — rộng nhất
  box(shrineGroup, 42, 42, 5, 0xc0392b, [0, 0,  91]); // tầng 2
  box(shrineGroup, 30, 30, 4, 0xc0392b, [0, 0,  99]); // tầng 3 — hẹp nhất

  // --- Chóp vàng đỉnh (Gold Spire) ---
  box(shrineGroup,  8,  8, 18, 0xe6a817, [0, 0, 112]);

  const signTexture = createSignTexture();
  const signMat = new THREE.MeshLambertMaterial({
    map: signTexture,
    color: 0xffffff,  // trắng → không bị tint, texture hiển thị nguyên bản màu sắc
    flatShading: true,
  });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(30, 2, 8), signMat);
  sign.position.set(0, -19, 69);    // Y=-19: phía trước mặt gian thờ (36/2+1=19)
  sign.rotation.x = Math.PI / 2;   // xoay 90° để biển dựng đứng hướng về -Y
  sign.castShadow = true;
  sign.receiveShadow = true;
  shrineGroup.add(sign);

  const wallLengthY = Math.abs(-360 - (-84)); // 276
  const wallCenterY = (-84 + -360) / 2;       // -222

  // Tường dọc trái
  box(pagodaGroup, 6, wallLengthY, 20, 0xf5e0a0, [-168, wallCenterY, 10]); // thân
  box(pagodaGroup, 8, wallLengthY,  4, 0x7d1e06, [-168, wallCenterY, 22]); // mái cap

  // Tường dọc phải
  box(pagodaGroup, 6, wallLengthY, 20, 0xf5e0a0, [+168, wallCenterY, 10]);
  box(pagodaGroup, 8, wallLengthY,  4, 0x7d1e06, [+168, wallCenterY, 22]);

  // Tường hậu (Back Wall) tại Y=-360
  box(pagodaGroup, 336, 6, 20, 0xf5e0a0, [0, -360, 10]);
  box(pagodaGroup, 340, 8,  4, 0x7d1e06, [0, -360, 22]);

  return pagodaGroup;
}
