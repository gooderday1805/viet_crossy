import * as THREE from "three";
import { tileSize } from "../constants";
import { Wheel } from "./Wheel";

// ─────────────────────────────────────────────────────────────────────────────
// SugarcaneCart.js — xe nước mía với máy ép mía đặc trưng Sài Gòn.
//
// Khái niệm CG — Procedural Geometry:
//   Bó mía = 6 CylinderGeometry xếp cạnh nhau, mỗi cái xoay nhẹ để tạo
//   cảm giác tự nhiên, không đều. Kỹ thuật đặt nhiều primitive đơn giản
//   để tạo vật thể phức tạp — rất phổ biến trong low-poly art style.
//
// Khái niệm CG — DoubleSide rendering:
//   PlaneGeometry mặc định chỉ render một mặt (front face).
//   THREE.DoubleSide = render cả hai mặt — cần thiết cho biển hiệu phẳng
//   vì camera có thể nhìn từ nhiều góc.
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
 * Tạo xe đẩy nước mía với máy ép và bó mía.
 * @param {number} initialTileIndex - Vị trí tile X trên hàng map.
 * @param {boolean} direction - true = quay về +Y, false = lật -Y.
 * @returns {THREE.Group}
 */
export function SugarcaneCart(initialTileIndex, direction) {
  const cart = new THREE.Group();
  cart.position.x = initialTileIndex * tileSize;
  if (!direction) cart.scale.y = -1;

  // ── Thân xe gỗ/nhôm ─────────────────────────────────────────────────────
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(65, 32, 12),
    new THREE.MeshLambertMaterial({ color: 0xd2b48c, flatShading: true })
  );
  body.position.z = 10;
  cart.add(body);

  // ── Mái che cam ──────────────────────────────────────────────────────────
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(60, 34, 3),
    new THREE.MeshLambertMaterial({ color: 0xff7f11, flatShading: true })
  );
  roof.position.z = 42;
  cart.add(roof);

  // ── Cột đỡ mái (4 góc) ───────────────────────────────────────────────────
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x666666, flatShading: true });
  [[-25, -12], [-25, 12], [25, -12], [25, 12]].forEach(([x, y]) => {
    const pole = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 28), poleMat);
    pole.position.set(x, y, 26);
    cart.add(pole);
  });

  // ── Máy ép mía (hộp xanh lá) ─────────────────────────────────────────────
  const machine = new THREE.Mesh(
    new THREE.BoxGeometry(22, 18, 18),
    new THREE.MeshLambertMaterial({ color: 0x2e8b57, flatShading: true })
  );
  machine.position.set(-12, 0, 24);
  cart.add(machine);

  // Con lăn ép mía — CylinderGeometry quay 90° để nằm ngang theo trục X
  const rollerMat = new THREE.MeshLambertMaterial({ color: 0xc0c0c0, flatShading: true });
  const roller1 = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 12, 12), rollerMat);
  roller1.rotation.z = Math.PI / 2;
  roller1.position.set(-12, -4, 24);
  cart.add(roller1);
  const roller2 = roller1.clone();
  roller2.position.y = 4;
  cart.add(roller2);

  // ── Bó mía (6 cây xếp hàng) ──────────────────────────────────────────────
  // rotation.y = 0.4 rad → xoay nhẹ để mía không thẳng hoàn toàn (tự nhiên hơn)
  for (let i = 0; i < 6; i++) {
    const cane = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 26, 6),
      new THREE.MeshLambertMaterial({ color: 0x9acd32, flatShading: true })
    );
    cane.rotation.y = 0.4;
    cane.position.set(12 + i * 3, 0, 26);
    cart.add(cane);
  }

  // ── Thùng đá ─────────────────────────────────────────────────────────────
  const iceBox = new THREE.Mesh(
    new THREE.BoxGeometry(15, 14, 12),
    new THREE.MeshLambertMaterial({ color: 0x87ceeb, flatShading: true })
  );
  iceBox.position.set(20, -8, 18);
  cart.add(iceBox);

  // ── Ly nước mía (3 ly) ───────────────────────────────────────────────────
  for (let i = 0; i < 3; i++) {
    const cup = new THREE.Mesh(
      new THREE.BoxGeometry(3, 3, 6),
      new THREE.MeshLambertMaterial({ color: 0xfff176, flatShading: true })
    );
    cup.position.set(18 + i * 5, 8, 22);
    cart.add(cup);
  }

  // ── Biển nước mía ────────────────────────────────────────────────────────
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 10),
    new THREE.MeshLambertMaterial({
      map: createTextTexture("NUOC MIA", "#16a34a"),
      transparent: true,
      side: THREE.DoubleSide,
    })
  );
  sign.rotation.x = Math.PI / 2;
  sign.position.set(0, 0, 58);
  cart.add(sign);

  // ── Trang trí quả chanh ───────────────────────────────────────────────────
  for (let i = 0; i < 3; i++) {
    const lemon = new THREE.Mesh(
      new THREE.SphereGeometry(2, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0xffff00, flatShading: true })
    );
    lemon.position.set(5 + i * 5, -10, 23);
    cart.add(lemon);
  }

  // ── Bánh xe ──────────────────────────────────────────────────────────────
  cart.add(Wheel(20));
  cart.add(Wheel(-20));

  return cart;
}
