import * as THREE from "three";
import { tileSize } from "../constants";
import { Wheel } from "./Wheel";

// ─────────────────────────────────────────────────────────────────────────────
// BanhMiCart.js — xe bánh mì vỉa hè phong cách VN.
//
// Khái niệm CG — Constructive Solid Geometry (CSG) thủ công:
//   Thay vì dùng CSG thực sự (phép boolean), ta xếp chồng nhiều BoxGeometry
//   để tạo hình phức tạp. Phổ biến trong low-poly game vì chi phí render thấp.
//
// Khái niệm CG — Texture Procedural (CanvasTexture):
//   Canvas 2D API vẽ text → THREE.CanvasTexture chuyển thành WebGL texture.
//   Tiết kiệm tài nguyên hơn tải file PNG riêng cho biển hiệu.
// ─────────────────────────────────────────────────────────────────────────────

function createTextTexture(text, bgColor) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = "white";
  ctx.font = "bold 54px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 64);
  return new THREE.CanvasTexture(canvas);
}

/**
 * Tạo xe đẩy bánh mì vỉa hè.
 * @param {number} initialTileIndex - Vị trí tile X trên hàng map.
 * @param {boolean} direction - true = quay về +Y, false = quay về -Y (lật scale.y).
 * @returns {THREE.Group}
 */
export function BanhMiCart(initialTileIndex, direction) {
  const cart = new THREE.Group();
  cart.position.x = initialTileIndex * tileSize;

  // Lật hướng nhìn theo trục Y (dùng scale âm thay rotate để giữ Z đúng chiều)
  if (!direction) cart.scale.y = -1;

  // ── Khung xe inox ────────────────────────────────────────────────────────
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(65, 32, 10),
    new THREE.MeshLambertMaterial({ color: 0xc0c0c0, flatShading: true })
  );
  base.position.z = 10;
  cart.add(base);

  // ── Tủ kính trưng bày ────────────────────────────────────────────────────
  const cabinet = new THREE.Mesh(
    new THREE.BoxGeometry(42, 26, 22),
    new THREE.MeshLambertMaterial({ color: 0xfff0c2, transparent: true, opacity: 0.9 })
  );
  cabinet.position.set(-4, 0, 26);
  cart.add(cabinet);

  // ── Mái che đỏ ──────────────────────────────────────────────────────────
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(58, 34, 4),
    new THREE.MeshLambertMaterial({ color: 0xd62828, flatShading: true })
  );
  roof.position.set(0, 0, 48);
  cart.add(roof);

  // ── Cột đỡ mái (trái + phải) ─────────────────────────────────────────────
  [-12, 12].forEach((y) => {
    const pole = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 20),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    pole.position.set(-20, y, 36);
    cart.add(pole);
  });

  // ── Biển hiệu (CanvasTexture) ────────────────────────────────────────────
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 10),
    new THREE.MeshLambertMaterial({
      map: createTextTexture("BANH MI", "#d62828"),
      transparent: true,
    })
  );
  sign.rotation.x = Math.PI / 2;
  sign.position.set(15, 0, 55);
  cart.add(sign);

  // ── Khay rau ─────────────────────────────────────────────────────────────
  const vegetableTray = new THREE.Mesh(
    new THREE.BoxGeometry(12, 10, 2),
    new THREE.MeshLambertMaterial({ color: 0x2ecc71, flatShading: true })
  );
  vegetableTray.position.set(-12, 0, 29);
  cart.add(vegetableTray);

  // ── Khay thịt ────────────────────────────────────────────────────────────
  const meatTray = new THREE.Mesh(
    new THREE.BoxGeometry(12, 10, 2),
    new THREE.MeshLambertMaterial({ color: 0x8d5524, flatShading: true })
  );
  meatTray.position.set(2, 0, 29);
  cart.add(meatTray);

  // ── 12 ổ bánh mì (3 hàng × 4 cột) ──────────────────────────────────────
  // Khái niệm CG — Instance geometry: dùng vòng lặp tạo nhiều mesh cùng geometry
  // thay vì InstancedMesh vì số lượng nhỏ (12), không cần tối ưu draw call.
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const bread = new THREE.Mesh(
        new THREE.BoxGeometry(6, 3, 3),
        new THREE.MeshLambertMaterial({ color: 0xc68642, flatShading: true })
      );
      bread.position.set(10 + col * 6, -6 + row * 6, 31);
      cart.add(bread);
    }
  }

  // ── Bình gas ─────────────────────────────────────────────────────────────
  const gasTank = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 5, 12, 12),
    new THREE.MeshLambertMaterial({ color: 0xff4444, flatShading: true })
  );
  gasTank.rotation.x = Math.PI / 2;
  gasTank.position.set(-28, 0, 15);
  cart.add(gasTank);

  // ── Bếp nướng ────────────────────────────────────────────────────────────
  const grill = new THREE.Mesh(
    new THREE.BoxGeometry(12, 10, 3),
    new THREE.MeshLambertMaterial({ color: 0x444444, flatShading: true })
  );
  grill.position.set(-25, 0, 25);
  cart.add(grill);

  // ── Chai tương (3 chai) ──────────────────────────────────────────────────
  [-4, 0, 4].forEach((y) => {
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 5, 8),
      new THREE.MeshLambertMaterial({ color: 0xffe100 })
    );
    bottle.rotation.x = Math.PI / 2;
    bottle.position.set(-5, y, 35);
    cart.add(bottle);
  });

  // ── Tay đẩy (trái + phải) ────────────────────────────────────────────────
  [-10, 10].forEach((y) => {
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(18, 2, 2),
      new THREE.MeshLambertMaterial({ color: 0x777777 })
    );
    handle.position.set(-40, y, 15);
    cart.add(handle);
  });

  // ── Bánh xe (trước + sau) ────────────────────────────────────────────────
  cart.add(Wheel(22));
  cart.add(Wheel(-22));

  return cart;
}
