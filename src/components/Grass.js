import * as THREE from "three";
import { tilesPerRow, tileSize } from "../constants";

// ─────────────────────────────────────────────────────────────────────────────
// Grass.js — tạo một hàng cỏ (grass row) tại vị trí rowIndex.
//
// Khái niệm CG — Scene Graph / Local Transform:
//   Mỗi row là một THREE.Group đặt tại y = rowIndex * tileSize.
//   Các mesh con (foundation) dùng tọa độ local (z = 1.5) thay vì world.
//   Khi Group di chuyển, toàn bộ con kế thừa transform → không cần cập nhật riêng.
//
// Cấu trúc geometry:
//   foundation: BoxGeometry(width = 17*42 = 714, depth = 42, height = 3)
//   Đặt center z = 1.5 → mặt trên = z = 3 (ground plane của row này).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tạo một hàng cỏ xanh rộng toàn bộ map.
 * @param {number} rowIndex - Chỉ số hàng trong world (âm = phía sau spawn, dương = phía trước).
 * @returns {THREE.Group}
 */
export function Grass(rowIndex) {
  const grass = new THREE.Group();
  // Đặt group tại Y = rowIndex * tileSize — tất cả mesh con tính từ đây
  grass.position.y = rowIndex * tileSize;

  // Nền cỏ — BoxGeometry: tilesPerRow * tileSize = 17 * 42 = 714 đơn vị chiều ngang
  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(tilesPerRow * tileSize, tileSize, 3),
    // MeshLambertMaterial: tô bóng Lambert diffuse không có specular — phù hợp low-poly
    new THREE.MeshLambertMaterial({ color: 0xbaf455 }),
  );

  // Center box tại z = 1.5 → đỉnh = z = 3 (mặt đất của row cỏ)
  foundation.position.z = 1.5;
  foundation.receiveShadow = true;
  grass.add(foundation);

  return grass;
}
