import * as THREE from "three";
import { tileSize } from "../constants";
import { Wheel } from "./Wheel";

// ─────────────────────────────────────────────────────────────────────────────
// Xichlo.js — xích lô ba bánh đặc trưng đô thị cũ Việt Nam.
//
// Khái niệm CG — Scene Graph Hierarchy:
//   Xích lô gồm nhiều Group con lồng nhau (khung, khoang khách, mái, người lái).
//   Khi xichlo.position.x thay đổi (do animateVehicles), toàn bộ cây kế thừa.
//
// Khái niệm CG — Nan hoa bánh xe bằng BoxGeometry:
//   Dùng vòng lặp tạo 8 mesh, mỗi mesh xoay Math.PI/8 * i quanh Z.
//   Tạo ảo giác nan hoa tròn mà chỉ dùng hộp vuông đơn giản.
//
// Là phương tiện di chuyển trên đường (road lane) — animateVehicles.js
// cập nhật ref.position.x mỗi frame, hitTest.js dùng AABB để phát hiện va chạm.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tạo xích lô ba bánh.
 * @param {number} initialTileIndex - Vị trí tile X ban đầu.
 * @param {boolean} direction - true = đi về +X, false = đi về -X.
 * @returns {THREE.Group}
 */
export function Xichlo(initialTileIndex, direction) {
  const xichlo = new THREE.Group();
  xichlo.position.x = initialTileIndex * tileSize;

  // Lật 180° quanh Z khi đi ngược chiều (thay vì scale.y = -1 như xe đẩy)
  if (!direction) xichlo.rotation.z = Math.PI;

  const frameMat = new THREE.MeshLambertMaterial({ color: 0x1f4e79, flatShading: true });

  // ── Khung xe ─────────────────────────────────────────────────────────────
  const frame = new THREE.Mesh(new THREE.BoxGeometry(55, 4, 4), frameMat);
  frame.position.set(0, 0, 12);
  xichlo.add(frame);

  const support1 = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 20), frameMat);
  support1.position.set(-18, 0, 20);
  xichlo.add(support1);
  const support2 = support1.clone();
  support2.position.x = 18;
  xichlo.add(support2);

  // ── Khoang khách (ghế + lưng ghế) ────────────────────────────────────────
  const seatBase = new THREE.Mesh(
    new THREE.BoxGeometry(35, 26, 6),
    new THREE.MeshLambertMaterial({ color: 0xd62828, flatShading: true })
  );
  seatBase.position.set(-18, 0, 18);
  xichlo.add(seatBase);

  const backSeat = new THREE.Mesh(
    new THREE.BoxGeometry(35, 4, 18),
    new THREE.MeshLambertMaterial({ color: 0xb22222, flatShading: true })
  );
  backSeat.position.set(-18, -11, 28);
  xichlo.add(backSeat);

  // Tay vịn trái + phải
  const armL = new THREE.Mesh(new THREE.BoxGeometry(4, 24, 8), frameMat);
  armL.position.set(-18, 13, 22);
  xichlo.add(armL);
  const armR = armL.clone();
  armR.position.y = -13;
  xichlo.add(armR);

  // ── Mái che vàng ─────────────────────────────────────────────────────────
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(40, 30, 4),
    new THREE.MeshLambertMaterial({ color: 0xffc857, flatShading: true })
  );
  roof.position.set(-18, 0, 42);
  xichlo.add(roof);

  [[-35, 12], [-35, -12], [0, 12], [0, -12]].forEach(([x, y]) => {
    const rs = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 20), frameMat);
    rs.position.set(x, y, 30);
    xichlo.add(rs);
  });

  // ── Bánh trước (bánh đạp) ─────────────────────────────────────────────────
  const frontWheel = new THREE.Mesh(
    new THREE.CylinderGeometry(10, 10, 3, 16),
    new THREE.MeshLambertMaterial({ color: 0x222222, flatShading: true })
  );
  frontWheel.rotation.x = Math.PI / 2;
  frontWheel.position.set(40, 0, 10);
  xichlo.add(frontWheel);

  // Nan hoa — 8 thanh xoay đều quanh tâm bánh
  for (let i = 0; i < 8; i++) {
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(1, 20, 1),
      new THREE.MeshLambertMaterial({ color: 0xcccccc, flatShading: true })
    );
    spoke.position.copy(frontWheel.position);
    spoke.rotation.z = (Math.PI / 8) * i;
    xichlo.add(spoke);
  }

  // ── Ghi đông ─────────────────────────────────────────────────────────────
  const handleBar = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 2), frameMat);
  handleBar.position.set(42, 0, 28);
  xichlo.add(handleBar);

  const stem = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 15), frameMat);
  stem.position.set(40, 0, 20);
  xichlo.add(stem);

  // ── Yên xe ───────────────────────────────────────────────────────────────
  const saddle = new THREE.Mesh(
    new THREE.BoxGeometry(8, 4, 2),
    new THREE.MeshLambertMaterial({ color: 0x111111, flatShading: true })
  );
  saddle.position.set(20, 0, 22);
  xichlo.add(saddle);

  // ── Người đạp xe ─────────────────────────────────────────────────────────
  const riderBody = new THREE.Mesh(
    new THREE.BoxGeometry(8, 8, 12),
    new THREE.MeshLambertMaterial({ color: 0x00a8ff, flatShading: true })
  );
  riderBody.position.set(18, 0, 30);
  xichlo.add(riderBody);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(6, 6, 6),
    new THREE.MeshLambertMaterial({ color: 0xffd6a5, flatShading: true })
  );
  head.position.set(18, 0, 40);
  xichlo.add(head);

  // Nón lá — ConeGeometry lộn ngược (mũi chỉ xuống = đỉnh nón)
  const hat = new THREE.Mesh(
    new THREE.ConeGeometry(6, 5, 12),
    new THREE.MeshLambertMaterial({ color: 0xe9c46a, flatShading: true })
  );
  hat.position.set(18, 0, 45);
  hat.rotation.x = Math.PI;
  xichlo.add(hat);

  // ── Bánh sau (2 bánh như xe đẩy) ─────────────────────────────────────────
  xichlo.add(Wheel(-5));
  xichlo.add(Wheel(-35));

  return xichlo;
}
