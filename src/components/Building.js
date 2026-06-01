import * as THREE from "three";
import { tileSize } from "../constants";

// ─────────────────────────────────────────────────────────────────────────────
// Building.js — tòa nhà low-poly phong cách đô thị tạo bằng BoxGeometry.
//
// Khái niệm CG — Procedural Geometry Generation:
//   Thay vì một model nghệ thuật duy nhất, ta sinh hình học từ tham số
//   (height, wallColor) → mỗi lần gọi Building() ra 1 tòa nhà khác.
//   Kỹ thuật này được dùng rộng rãi trong game để tạo môi trường vô hạn
//   mà không tốn bộ nhớ như khi lưu nhiều file GLB.
//
// Cấu trúc (tất cả là con của Group `group`):
//   body     : thân nhà  BoxGeometry(W, W, height)
//              center z = 3 + height/2 → đáy = mặt cỏ (z=3)
//   roof     : mái nhà   BoxGeometry(W+2, W+2, 6)
//              center z = 3 + height + 3
//   windows  : mỗi tầng 2 cửa sổ × 2 mặt (trước + sau theo trục Y)
//              BoxGeometry(8, 1, 8) — depth=1 để nhô ra khỏi tường 0.5 unit,
//              tránh z-fighting với mặt tường.
//
// Khái niệm CG — Z-fighting:
//   Xảy ra khi 2 mặt phẳng cùng depth → GPU không xác định được thứ tự vẽ
//   → nhấp nháy. Offset cửa sổ ra ngoài mặt tường 0.5 unit giải quyết vấn đề.
//
// Khái niệm CG — Shadow Casting:
//   castShadow=true trên body/roof → DirectionalLight tạo bóng đổ lên mặt đất.
//   Tòa nhà cao → bóng dài → hiệu ứng đô thị rõ nét.
// ─────────────────────────────────────────────────────────────────────────────

// Bảng màu tường — xám + đất nung + xanh dương nhạt (phong cách urban Việt Nam)
const WALL_COLORS = [0x8a9ba8, 0x9a8c7e, 0x7e9a8c, 0x9a9070, 0x8070a0];
// Màu cửa sổ — phát sáng dịu như nhìn từ xa lúc chiều tối
const WINDOW_COLORS = [0xfff5b0, 0xd0eeff, 0xffffff, 0xffe0a0];

/**
 * Tạo tòa nhà tại tileIndex với chiều cao chỉ định.
 * @param {number} tileIndex - Tile X trong hàng (−8 → +8).
 * @param {number} height    - Chiều cao tòa nhà (đơn vị world).
 * @returns {THREE.Group}
 */
export function Building(tileIndex, height = 80) {
  const group = new THREE.Group();
  group.position.x = tileIndex * tileSize;
  // position.y = 0 (tính theo hàng — Grass row đặt y = rowIndex * tileSize)
  // position.z = 0 (mặt cỏ ở z=3, thân nhà được offset bên trong)

  const W = tileSize - 4; // 38 units — khoảng cách 2 unit mỗi bên để nhà không sát nhau

  const wallColor = WALL_COLORS[Math.floor(Math.random() * WALL_COLORS.length)];
  const wallMat   = new THREE.MeshLambertMaterial({ color: wallColor, flatShading: true });

  // ── Thân tòa nhà ──────────────────────────────────────────────────────────
  // BoxGeometry(width=X, height=Y, depth=Z trong hệ Three.js nhưng Z-up của game)
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(W, W, height),
    wallMat
  );
  // Đặt đáy tại z=3 (mặt cỏ), center tại z = 3 + height/2
  body.position.z = 3 + height / 2;
  body.castShadow    = true;
  body.receiveShadow = true;
  group.add(body);

  // ── Mái nhà ───────────────────────────────────────────────────────────────
  // Slab dẹt đen xám, nhô ra 1 unit mỗi bên so với thân
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(W + 2, W + 2, 6),
    new THREE.MeshLambertMaterial({ color: 0x2e2e2e, flatShading: true })
  );
  roof.position.z = 3 + height + 3; // đỉnh mái = z = 3 + height + 6
  roof.castShadow = true;
  group.add(roof);

  // ── Cửa sổ ────────────────────────────────────────────────────────────────
  // Sinh cửa sổ trên mặt trước (+Y) và mặt sau (−Y) theo từng tầng.
  // Mỗi tầng 2 cửa sổ (lệch X = ±9 so với tâm).
  const winColor = WINDOW_COLORS[Math.floor(Math.random() * WINDOW_COLORS.length)];
  const winMat   = new THREE.MeshLambertMaterial({ color: winColor, flatShading: true });

  // Tầng 1: z=18, tầng 2: z=43, ... (cách 25 units / tầng)
  const numFloors = Math.floor((height - 20) / 25);
  for (let f = 0; f < numFloors; f++) {
    const winZ = 3 + 15 + f * 25; // z thế giới từ mặt cỏ
    if (winZ + 4 > 3 + height) break; // không vẽ cửa sổ sát mái

    // 2 vị trí X lệch nhau để tạo 2 cửa sổ mỗi mặt
    [-9, 9].forEach((offsetX) => {
      // Mặt trước (hướng +Y)
      const winFront = new THREE.Mesh(
        new THREE.BoxGeometry(8, 1, 8), // depth=1 → nhô 0.5 unit ra ngoài tường
        winMat
      );
      winFront.position.set(offsetX, W / 2 + 0.5, winZ);
      group.add(winFront);

      // Mặt sau (hướng −Y) — clone để dùng chung geometry/material
      const winBack = winFront.clone();
      winBack.position.y = -(W / 2 + 0.5);
      group.add(winBack);
    });
  }

  return group;
}
