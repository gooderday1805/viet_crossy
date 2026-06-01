import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────────────────
// Wheel.js — tạo một bánh xe hình hộp (low-poly style).
//
// Khái niệm CG — Low-Poly Stylization:
//   Bánh xe thật là hình tròn (CylinderGeometry) nhưng ở đây dùng BoxGeometry
//   để thống nhất phong cách "blocky" của toàn game (giống Crossy Road gốc).
//   BoxGeometry(12, 33, 12): rộng=12(X), dày=33(Y) để bánh rộng hơn thân xe, cao=12(Z).
//   position.z = 6: center bánh = z=6, đáy = z=0 (tiếp đất), đỉnh = z=12.
//
// Bánh là mesh độc lập (không phải con của thân xe) — Car.js/Truck.js thêm
// trực tiếp vào group xe ở vị trí X offset.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tạo bánh xe hình hộp tại vị trí X offset trên trục xe.
 * @param {number} x - Offset trục X so với tâm xe (dương = phía trước xe khi direction=true).
 * @returns {THREE.Mesh}
 */
export function Wheel(x) {
  const wheel = new THREE.Mesh(
    new THREE.BoxGeometry(12, 33, 12),
    new THREE.MeshLambertMaterial({ color: 0x333333, flatShading: true })
  );
  wheel.position.x = x;
  wheel.position.z = 6; // đáy bánh tiếp mặt đường (z=0), center tại z=6
  return wheel;
}
