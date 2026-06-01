import * as THREE from "three";
import { tilesPerRow, tileSize } from "../constants";

// ─────────────────────────────────────────────────────────────────────────────
// Road.js — tạo một hàng đường xe cộ tại vị trí rowIndex.
//
// Cấu trúc:
//   1. foundation: mặt đường xám tối (BoxGeometry rộng toàn map)
//   2. dash lines: vạch kẻ đứt màu trắng giữa đường (lặp theo X)
//
// Khái niệm CG — Procedural Geometry:
//   Vạch kẻ đường được sinh bằng vòng lặp (không dùng texture).
//   Mỗi đoạn dash = BoxGeometry mỏng, cách nhau đều theo bước (dashLength + gap).
//   Đây là ví dụ đơn giản của procedural content generation (PCG) trong CG:
//   tạo chi tiết hình học bằng code thay vì đặt thủ công từng mesh.
//
// Vạch kẻ nổi lên z = 3.01 (trên mặt đường z = 3) để tránh z-fighting:
//   Z-fighting: khi 2 mesh gần như đồng phẳng, GPU không xác định được mesh nào
//   "trên" → sinh ra hiệu ứng nhấp nháy. Offset 0.01 đủ để loại bỏ vấn đề này.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tạo một hàng đường với vạch kẻ đứt giữa đường.
 * @param {number} rowIndex - Chỉ số hàng trong world.
 * @returns {THREE.Group}
 */
export function Road(rowIndex) {
  const road = new THREE.Group();
  road.position.y = rowIndex * tileSize;

  // ── Mặt đường (foundation) ─────────────────────────────────────────────────
  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(tilesPerRow * tileSize, tileSize, 3),
    new THREE.MeshLambertMaterial({ color: 0x454a59 })
  );
  foundation.position.z = 1.5; // center z=1.5 → mặt trên = z=3
  foundation.receiveShadow = true;
  road.add(foundation);

  // ── Vạch kẻ đứt (center dashed line) ──────────────────────────────────────
  const dashLength = tileSize * 0.8; // độ dài mỗi đoạn vạch (33.6 đơn vị)
  const gap        = tileSize * 0.7; // khoảng cách giữa 2 đoạn (29.4 đơn vị)
  const startX     = -(tilesPerRow * tileSize) / 2;

  for (let x = startX; x < -startX; x += dashLength + gap) {
    const dash = new THREE.Mesh(
      new THREE.BoxGeometry(dashLength, tileSize * 0.1, 0.2),
      new THREE.MeshLambertMaterial({ color: "white" })
    );
    dash.position.x = x + dashLength / 2; // đặt từ cạnh trái của mỗi đoạn
    dash.position.y = 0;
    dash.position.z = 3.01; // offset nhỏ để tránh z-fighting với mặt đường
    road.add(dash);
  }

  return road;
}
