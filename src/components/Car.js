import * as THREE from "three";
import { tileSize } from "../constants";
import { Wheel } from "./Wheel";

// ─────────────────────────────────────────────────────────────────────────────
// Car.js — tạo xe ô tô 2 trục (sedan) phong cách low-poly.
//
// Cấu trúc (tất cả là con của Group `car`):
//   main  : thân xe chính  BoxGeometry(60, 30, 15), center z=12 → đỉnh = z=19.5
//   cabin : buồng lái nhỏ BoxGeometry(33, 24, 12), center z=25.5
//   wheels: 2 bánh (Wheel) tại X = ±18 (trước/sau)
//
// Khái niệm CG — Object Hierarchy / Scene Graph:
//   Group `car` chứa tất cả bộ phận → xoay/dịch chuyển Group = toàn bộ xe cùng di chuyển.
//   Khi animateVehicles.js cập nhật car.position.x, main + cabin + wheels đều theo.
//
// Khái niệm CG — Rotation để đổi chiều xe:
//   direction=false → car.rotation.z = π (180°) → xe quay ngược = di chuyển -X.
//   Xoay quanh trục Z (Z-up) giữ xe nằm ngang trong mặt phẳng XY.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tạo xe ô tô tại tile xuất phát với màu và hướng cho trước.
 * @param {number}  initialTileIndex - Tile X xuất phát (−8 → +8).
 * @param {boolean} direction        - true = di chuyển theo +X, false = theo −X.
 * @param {number}  color            - Màu hex thân xe.
 * @returns {THREE.Group}
 */
export function Car(initialTileIndex, direction, color) {
  const car = new THREE.Group();
  car.position.x = initialTileIndex * tileSize;

  // Xoay 180° quanh Z để cabin quay đúng chiều di chuyển khi đi về phía -X
  if (!direction) car.rotation.z = Math.PI;

  // Thân xe chính — center z=12 → đáy = z=4.5, đỉnh = z=19.5
  const main = new THREE.Mesh(
    new THREE.BoxGeometry(60, 30, 15),
    new THREE.MeshLambertMaterial({ color, flatShading: true })
  );
  main.position.z = 12;
  main.castShadow    = true;
  main.receiveShadow = true;
  car.add(main);

  // Cabin (buồng lái) — nhỏ hơn, nằm trên thân, lệch về phía trước (x=-6)
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(33, 24, 12),
    new THREE.MeshLambertMaterial({ color: "white", flatShading: true })
  );
  cabin.position.x = -6;
  cabin.position.z = 25.5;
  cabin.castShadow    = true;
  cabin.receiveShadow = true;
  car.add(cabin);

  // 2 bánh xe: trước (x=+18) và sau (x=-18)
  car.add(Wheel( 18));
  car.add(Wheel(-18));

  return car;
}
