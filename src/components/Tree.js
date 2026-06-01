import * as THREE from "three";
import { tileSize } from "../constants";

// ─────────────────────────────────────────────────────────────────────────────
// Tree.js — tạo cây chướng ngại vật phong cách low-poly.
//
// Cấu trúc:
//   trunk (thân cây): BoxGeometry(15, 20, 30) màu nâu tối
//   crown (tán lá):  BoxGeometry(30, 30, height) màu xanh lá — chiều cao tuỳ biến
//
// Khái niệm CG — Hierarchical Transform (Scene Graph):
//   Cả trunk và crown đều là con của Group `tree`.
//   tree.position.x = tileIndex * tileSize → tất cả con tự động được đặt đúng cột tile.
//   Khi kiểm tra va chạm (AABB), chỉ cần so tileIndex thay vì đo world position.
//
// Chiều cao crown thay đổi (height tham số) → cây không đồng đều về hình dạng,
// tạo cảnh quan tự nhiên hơn trong forest row.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tạo cây đứng tại tileIndex với tán lá cao `height` đơn vị.
 * @param {number} tileIndex - Chỉ số tile ngang (-8 → +8).
 * @param {number} height    - Chiều cao tán lá (20, 45, hoặc 60 đơn vị).
 * @returns {THREE.Group}
 */
export function Tree(tileIndex, height) {
  const tree = new THREE.Group();
  tree.position.x = tileIndex * tileSize;

  // Thân cây: cao 30, center z=10 → đỉnh thân = z=25 (= trên mặt cỏ z=3 rõ ràng)
  const trunk = new THREE.Mesh(
    new THREE.BoxGeometry(15, 20, 30),
    new THREE.MeshLambertMaterial({ color: 0x4d2926, flatShading: true }),
  );
  trunk.position.z = 10;
  tree.add(trunk);

  // Tán lá: center z = height/2 + 25 → gốc tán = z=25 (đỉnh thân), ngọn = z = 25 + height
  const crown = new THREE.Mesh(
    new THREE.BoxGeometry(30, 30, height),
    new THREE.MeshLambertMaterial({ color: 0x7aa21d, flatShading: true }),
  );
  crown.position.z = height / 2 + 25;
  crown.castShadow    = true;
  crown.receiveShadow = true;
  tree.add(crown);

  return tree;
}
