import * as THREE from "three";
import { tileSize } from "../constants";

// Kích thước bệ đá (BoxGeometry): rộng đúng 1 tile để vừa với lưới game.
export const PLATFORM_W = tileSize; // = 42 đơn vị
export const PLATFORM_HALF = PLATFORM_W / 2; // = 21 (dùng trong hitTest)

// Biên trái/phải căn theo tường bao khuôn viên chùa (X = ±210 = ±5*tileSize).
// Bệ không được vượt ra ngoài tường → BOUND = ±5*tileSize.
const BOUND_LEFT  = -5 * tileSize; // -210
const BOUND_RIGHT =  5 * tileSize; //  +210
export const POND_BOUNDS = { LEFT: BOUND_LEFT, RIGHT: BOUND_RIGHT };

// Mỗi hàng hồ: 2 bệ chạy cùng chiều, xuất phát khác nhau để luôn có 1 bệ gần player.
// Initial X nằm trong [-180, +180] để có buffer với tường (BOUND = ±210).
// speed: đơn vị/giây; direction: +1 (phải) hoặc -1 (trái)
const ROW_CONFIGS = [
  { rowIndex: -9, speed:  80, platforms: [{ x:    0, dir:  1 }, { x: -180, dir:  1 }] },
  { rowIndex: -8, speed: 110, platforms: [{ x:  100, dir: -1 }, { x: -160, dir: -1 }] },
  { rowIndex: -7, speed:  70, platforms: [{ x:  -80, dir:  1 }, { x:  170, dir:  1 }] },
  { rowIndex: -6, speed: 130, platforms: [{ x:   50, dir: -1 }, { x: -180, dir: -1 }] },
  { rowIndex: -5, speed:  95, platforms: [{ x: -120, dir:  1 }, { x:  150, dir:  1 }] },
  { rowIndex: -4, speed:  85, platforms: [{ x:   80, dir: -1 }, { x: -180, dir: -1 }] },
];

// platformData: mảng shared dùng trong animatePond.js + hitTest.js
// Mỗi phần tử: { ref: THREE.Group, rowIndex, speed, direction, initialX }
export const platformData = [];

// ─────────────────────────────────────────────────────────────────────────────
// Tạo 1 bệ đá: BoxGeometry đế xám + mặt xanh nhạt để dễ nhận biết.
// Cấu trúc Group (local transform) cho phép animate position.x độc lập.
// ─────────────────────────────────────────────────────────────────────────────
function makePlatform(x, rowY) {
  const g = new THREE.Group();
  g.position.set(x, rowY, 0);

  // Đế bệ đá — BoxGeometry(w, d, h): w=X, d=Y, h=Z
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(PLATFORM_W, tileSize, 6),
    new THREE.MeshLambertMaterial({ color: 0x717d7e, flatShading: true })
  );
  base.position.z = 9; // center Z=9 → đỉnh = Z=12 (nổi trên mặt nước Z=6)
  base.castShadow = true;
  base.receiveShadow = true;
  g.add(base);

  // Mặt bệ (màu xanh nhạt, nhỏ hơn 6 đơn vị) để phân biệt với đế
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(PLATFORM_W - 6, tileSize - 6, 2),
    new THREE.MeshLambertMaterial({ color: 0xa9cce3, flatShading: true })
  );
  top.position.z = 12.5;
  g.add(top);

  return g;
}

// Tạo toàn bộ bệ nhảy cho 6 hàng hồ và điền platformData.
export function createPondPlatforms() {
  const group = new THREE.Group();
  platformData.length = 0;

  ROW_CONFIGS.forEach(({ rowIndex, speed, platforms }) => {
    platforms.forEach(({ x, dir }) => {
      const mesh = makePlatform(x, rowIndex * tileSize);
      group.add(mesh);
      platformData.push({
        ref: mesh,
        rowIndex,
        speed,
        direction: dir,
        initialX: x,    // lưu để reset khi Retry
        initialDir: dir, // lưu chiều ban đầu để reset khi Retry (bounce thay đổi direction)
      });
    });
  });

  return group;
}

// Reset vị trí và chiều di chuyển tất cả bệ về ban đầu khi Retry.
// Phải reset cả direction vì bounce đã thay đổi nó trong lúc chơi.
export function initializePondPlatforms() {
  platformData.forEach((p) => {
    p.ref.position.x = p.initialX;
    p.direction     = p.initialDir;
  });
}
