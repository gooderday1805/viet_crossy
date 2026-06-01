import * as THREE from "three";
import { metadata as rows } from "./components/Map";
import { minTileIndex, maxTileIndex, tileSize } from "./constants";

// ─────────────────────────────────────────────────────────────────────────────
// animateVehicles.js — di chuyển xe cộ theo delta-time, wrap-around ở 2 đầu row.
//
// Khái niệm CG — Delta-time animation:
//   position += speed * delta  (đơn vị/giây × giây/frame = đơn vị/frame độc lập FPS)
//   Nếu dùng giá trị cố định (không × delta), tốc độ xe sẽ phụ thuộc FPS
//   → máy 120 FPS chạy nhanh gấp đôi máy 60 FPS.
//
// Wrap-around: khi xe vượt quá biên (±2 tile ngoài map) → teleport về đầu bên kia.
//   Buffer ±2 tile cho phép xe "biến mất" trước khi teleport, tránh nhìn thấy snap.
// ─────────────────────────────────────────────────────────────────────────────

const clock = new THREE.Clock();

/**
 * Cập nhật vị trí X của tất cả xe cộ mỗi frame.
 * Gọi trong animation loop (main.js) khi game không pause/over.
 */
export function animateVehicles() {
  const delta = clock.getDelta();

  rows.forEach((rowData) => {
    if (rowData.type !== "car" && rowData.type !== "truck") return;

    // Biên wrap: 2 tile ngoài map để xe biến mất trước khi teleport
    const beginningOfRow = (minTileIndex - 2) * tileSize;
    const endOfRow       = (maxTileIndex + 2) * tileSize;

    rowData.vehicles.forEach(({ ref }) => {
      // ref được gán trong Map.js khi tạo mesh; undefined = bug sinh row
      if (!ref) {
        console.warn("[animateVehicles] Vehicle ref missing — row skipped.");
        return;
      }

      if (rowData.direction) {
        // Hướng +X: khi qua biên phải → teleport về biên trái
        ref.position.x =
          ref.position.x > endOfRow
            ? beginningOfRow
            : ref.position.x + rowData.speed * delta;
      } else {
        // Hướng -X: khi qua biên trái → teleport về biên phải
        ref.position.x =
          ref.position.x < beginningOfRow
            ? endOfRow
            : ref.position.x - rowData.speed * delta;
      }
    });
  });
}