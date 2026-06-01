import * as THREE from "three";
import { tileSize } from "../constants";
import { Wheel } from "./Wheel";

// ─────────────────────────────────────────────────────────────────────────────
// HuTieuCart.js — xe đẩy hủ tiếu nước lèo phong cách Nam Bộ.
//
// Khái niệm CG — Local Coordinate System:
//   Tất cả mesh con đặt trong local space của cart (THREE.Group).
//   Khi cart.position thay đổi, toàn bộ con kế thừa transform qua scene graph.
//
// Khái niệm CG — Material reuse:
//   Có thể tạo 1 material instance và chia sẻ cho nhiều mesh có cùng màu,
//   giảm số lần upload uniform lên GPU. Ở đây mỗi mesh có material riêng
//   để đơn giản hóa code và dễ chỉnh màu từng bộ phận.
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
 * Tạo xe đẩy hủ tiếu với nồi nước lèo bốc khói.
 * @param {number} initialTileIndex - Vị trí tile X trên hàng map.
 * @param {boolean} direction - true = quay về +Y, false = lật -Y.
 * @returns {THREE.Group}
 */
export function HuTieuCart(initialTileIndex, direction) {
  const cart = new THREE.Group();
  cart.position.x = initialTileIndex * tileSize;
  if (!direction) cart.scale.y = -1;

  // ── Thân xe inox ────────────────────────────────────────────────────────
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(65, 32, 10),
    new THREE.MeshLambertMaterial({ color: 0xb8b8b8, flatShading: true })
  );
  body.position.z = 10;
  cart.add(body);

  // ── Mái che xanh dương ──────────────────────────────────────────────────
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(58, 34, 4),
    new THREE.MeshLambertMaterial({ color: 0x1d4ed8, flatShading: true })
  );
  roof.position.set(0, 0, 48);
  cart.add(roof);

  // ── Cột chống mái ────────────────────────────────────────────────────────
  [-12, 12].forEach((y) => {
    const pole = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 20),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    pole.position.set(-20, y, 36);
    cart.add(pole);
  });

  // ── Biển hủ tiếu ─────────────────────────────────────────────────────────
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 10),
    new THREE.MeshLambertMaterial({
      map: createTextTexture("HU TIEU", "#1d4ed8"),
      transparent: true,
    })
  );
  sign.rotation.x = Math.PI / 2;
  sign.position.set(15, 0, 55);
  cart.add(sign);

  // ── Nồi nước lèo ─────────────────────────────────────────────────────────
  // CylinderGeometry: radiusTop=8, radiusBottom=8, height=12, segments=16
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(8, 8, 12, 16),
    new THREE.MeshLambertMaterial({ color: 0xe5e5e5, flatShading: true })
  );
  pot.rotation.x = Math.PI / 2;
  pot.position.set(-20, 0, 30);
  cart.add(pot);

  // ── Nắp nồi ──────────────────────────────────────────────────────────────
  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(9, 9, 2, 16),
    new THREE.MeshLambertMaterial({ color: 0xffffff })
  );
  lid.rotation.x = Math.PI / 2;
  lid.position.set(-20, 0, 37);
  cart.add(lid);

  // ── Khay rau ─────────────────────────────────────────────────────────────
  const vegetableTray = new THREE.Mesh(
    new THREE.BoxGeometry(14, 12, 3),
    new THREE.MeshLambertMaterial({ color: 0x2ecc71, flatShading: true })
  );
  vegetableTray.position.set(0, 0, 28);
  cart.add(vegetableTray);

  // ── Khay thịt ────────────────────────────────────────────────────────────
  const meatTray = new THREE.Mesh(
    new THREE.BoxGeometry(14, 12, 3),
    new THREE.MeshLambertMaterial({ color: 0xa0522d, flatShading: true })
  );
  meatTray.position.set(16, 0, 28);
  cart.add(meatTray);

  // ── 6 tô hủ tiếu (3 cột × 2 hàng) ──────────────────────────────────────
  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 2; y++) {
      const bowl = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 3, 2, 12),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
      );
      bowl.rotation.x = Math.PI / 2;
      bowl.position.set(-5 + x * 8, -5 + y * 10, 34);
      cart.add(bowl);
    }
  }

  // ── Đũa (6 đôi) ──────────────────────────────────────────────────────────
  for (let i = 0; i < 6; i++) {
    const chopstick = new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.5, 0.5),
      new THREE.MeshLambertMaterial({ color: 0xd4a373 })
    );
    chopstick.position.set(-5 + i * 5, 12, 36);
    cart.add(chopstick);
  }

  // ── Hộp gia vị ───────────────────────────────────────────────────────────
  [-4, 0, 4].forEach((y) => {
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 5, 8),
      new THREE.MeshLambertMaterial({ color: 0xff4444 })
    );
    bottle.rotation.x = Math.PI / 2;
    bottle.position.set(25, y, 34);
    cart.add(bottle);
  });

  // ── Tay đẩy ──────────────────────────────────────────────────────────────
  [-10, 10].forEach((y) => {
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(18, 2, 2),
      new THREE.MeshLambertMaterial({ color: 0x777777 })
    );
    handle.position.set(-40, y, 15);
    cart.add(handle);
  });

  // ── Bánh xe ──────────────────────────────────────────────────────────────
  cart.add(Wheel(22));
  cart.add(Wheel(-22));

  return cart;
}
