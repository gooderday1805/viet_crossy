import * as THREE from "three";
import { makeCoinMesh } from "./components/Coin";
import { tileSize, minTileIndex, maxTileIndex } from "./constants";

// ─────────────────────────────────────────────────────────────────────────────
// coins.js — quản lý toàn bộ vòng đời đồng xu:
//   spawn (tạo), animate (xoay + bob), collect (thu thập khi player chạm).
//
// Hai loại xu:
//   - Road coins: đặt trực tiếp trong coinsGroup (world space), vị trí tĩnh.
//   - Pond coins: là CON của platform.ref → tự động dịch theo bệ mà không
//     cần cập nhật vị trí riêng (khai thác Parent–Child Transform của Three.js).
// ─────────────────────────────────────────────────────────────────────────────

// Nhóm gốc chứa tất cả road coins — thêm vào scene trong main.js.
export const coinsGroup = new THREE.Group();

// Danh sách metadata xu (dùng trong animateCoins + collectCoins).
// roadCoins: mảng xu trên lane đường — mỗi phần tử gồm mesh, worldX, worldY, collected
const roadCoins = [];
// pondCoins: mảng xu trên bệ hồ sen — mỗi phần tử gồm mesh, platformEntry, collected
const pondCoins = [];

// Clock nội bộ cho animation (tách riêng để không ảnh hưởng clock của module khác).
const clock = new THREE.Clock();
// Thời gian tích lũy dùng cho hàm bob sin — reset về 0 khi initializeCoins().
let coinTime = 0;

// Bán kính thu thập xu (world units).
// = tileSize * 0.45 ≈ 19 — nhỏ hơn nửa tile để tránh collect nhầm row lân cận.
const COLLECT_RADIUS = tileSize * 0.45;

// ─────────────────────────────────────────────────────────────────────────────
// initializeCoins: xóa tất cả xu hiện có.
// Gọi khi Retry hoặc bắt đầu game mới.
// ─────────────────────────────────────────────────────────────────────────────
export function initializeCoins() {
  // Xóa road coins khỏi coinsGroup
  coinsGroup.clear();
  roadCoins.length = 0;

  // Xóa pond coins khỏi platform group cha
  pondCoins.forEach(({ mesh }) => mesh.parent?.remove(mesh));
  pondCoins.length = 0;

  coinTime = 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// spawnCoinsForRow: spawn 0 hoặc 1 xu cho một lane đường xe/xe tải (25% xác suất).
// Chọn tile ngẫu nhiên không bị phương tiện chiếm (buffer ±1 tile).
//
// Khái niệm CG:
//  World Position — tọa độ tuyệt đối trong scene (không phụ thuộc parent).
//  Xu đặt trong coinsGroup (gốc tọa độ world) nên mesh.position = world position.
//    worldX = tileIndex * tileSize
//    worldY = rowIndex * tileSize  (road group cũng đặt y = rowIndex * tileSize)
// ─────────────────────────────────────────────────────────────────────────────
export function spawnCoinsForRow(rowData, rowIndex) {
  if (Math.random() > 0.25) return; // xác suất 25%

  // Tập hợp tile bị xe chiếm (± 1 tile buffer để không bị đè)
  const occupied = new Set();
  rowData.vehicles.forEach((v) => {
    occupied.add(v.initialTileIndex - 1);
    occupied.add(v.initialTileIndex);
    occupied.add(v.initialTileIndex + 1);
  });

  // Thu thập tile còn trống
  const free = [];
  for (let t = minTileIndex; t <= maxTileIndex; t++) {
    if (!occupied.has(t)) free.push(t);
  }
  if (free.length === 0) return;

  const tileIndex = free[Math.floor(Math.random() * free.length)];
  const worldX = tileIndex * tileSize;
  const worldY = rowIndex * tileSize;

  const mesh = makeCoinMesh();
  // Z = 8: nổi 5 đơn vị trên mặt đường (road surface z = 3)
  mesh.position.set(worldX, worldY, 8);
  coinsGroup.add(mesh);
  roadCoins.push({ mesh, worldX, worldY, collected: false });
}

// ─────────────────────────────────────────────────────────────────────────────
// spawnPondCoins: spawn xu trên ~50% bệ nhảy hồ sen.
// Xu là CON của platform.ref → kế thừa transform của bệ (carry tự động).
//
// Khái niệm CG:
//  Parent–Child Transform (Scene Graph): khi parent di chuyển, children
//  thừa hưởng transform đó qua ma trận world = parent.matrixWorld * local.matrix.
//  Không cần cập nhật position xu riêng — Three.js tự tính mỗi frame.
// ─────────────────────────────────────────────────────────────────────────────
export function spawnPondCoins(platformDataArr) {
  platformDataArr.forEach((p) => {
    if (Math.random() > 0.5) return; // 50% mỗi bệ có xu

    const mesh = makeCoinMesh();
    // Local position trong platform group:
    //   x=0, y=0 → trung tâm bệ theo XY
    //   z=20 → 6.5 đơn vị trên đỉnh bệ (platform top ở world z = 13.5)
    mesh.position.set(0, 0, 20);
    p.ref.add(mesh);
    pondCoins.push({ mesh, platformEntry: p, collected: false });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// animateCoins: xoay xu liên tục quanh trục Z + hiệu ứng bob (lên/xuống sin).
// Gọi mỗi frame trong game loop khi game đang chạy (không pause/over).
//
// Khái niệm CG:
//  Delta-time animation: nhân tốc độ với delta (giây/frame) thay vì giá trị cố định
//  → animation mượt và frame-rate independent (không phụ thuộc FPS).
//  sin(time): hàm tuần hoàn [−1, 1] tạo chuyển động bob tự nhiên.
// ─────────────────────────────────────────────────────────────────────────────
export function animateCoins() {
  const delta = clock.getDelta();
  coinTime += delta;

  roadCoins.forEach((c) => {
    if (c.collected) return;
    c.mesh.rotation.z += delta * 2.5;                              // xoay 2.5 rad/s
    c.mesh.position.z = 8 + Math.sin(coinTime * 3 + c.worldX * 0.01) * 2; // bob ±2
  });

  pondCoins.forEach((c) => {
    if (c.collected) return;
    c.mesh.rotation.z += delta * 2.5;
    // local z trong platform: 20 ± 2 (world z dao động 18–22)
    c.mesh.position.z = 20 + Math.sin(coinTime * 3 + c.platformEntry.rowIndex) * 2;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// collectCoins: kiểm tra va chạm player–xu theo bán kính 2D (bỏ qua trục Z).
// Trả về số xu thu thập trong frame này (0 nếu không có).
//
// Khái niệm CG:
//  Broad-phase collision bằng distance check đơn giản (O(n) theo số xu).
//  Bỏ qua trục Z vì game về cơ bản là 2D trên mặt phẳng XY —
//  chỉ cần so sánh XY để xác định player đứng trên ô tile chứa xu.
// ─────────────────────────────────────────────────────────────────────────────
export function collectCoins(playerX, playerY) {
  let count = 0;

  roadCoins.forEach((c) => {
    if (c.collected) return;
    if (
      Math.abs(playerX - c.worldX) < COLLECT_RADIUS &&
      Math.abs(playerY - c.worldY) < COLLECT_RADIUS
    ) {
      c.collected = true;
      c.mesh.visible = false;
      count++;
    }
  });

  pondCoins.forEach((c) => {
    if (c.collected) return;
    // World X của xu = world X của bệ cha (platform.ref.position.x thay đổi liên tục)
    const wx = c.platformEntry.ref.position.x;
    const wy = c.platformEntry.ref.position.y; // = rowIndex * tileSize (không đổi)
    if (
      Math.abs(playerX - wx) < COLLECT_RADIUS &&
      Math.abs(playerY - wy) < COLLECT_RADIUS
    ) {
      c.collected = true;
      c.mesh.visible = false;
      count++;
    }
  });

  return count;
}
