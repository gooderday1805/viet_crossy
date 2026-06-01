import * as THREE from "three";
import { tileSize } from "../constants";
import { Wheel } from "./Wheel";

// ─────────────────────────────────────────────────────────────────────────────
// Truck.js — tạo xe tải 3 trục (cargo truck) phong cách low-poly.
//
// Cấu trúc (tất cả là con của Group `truck`):
//   cargo : thùng hàng BoxGeometry(70, 35, 35), lệch về sau (x=-15)
//   cabin : buồng lái  BoxGeometry(30, 30, 30), phía trước (x=+35)
//   wheels: 3 bánh tại X = +37 (trước), +5 (giữa), −35 (sau)
//
// Xe tải rộng hơn xe con (70 vs 60 đơn vị) và cao hơn (cargo h=35 vs main h=15).
// endsUpInValidPosition dùng buffer ±2 tile cho xe tải (vs ±1 cho xe con)
// để tránh player bị block hoàn toàn bởi xe tải dài.
//
// Khái niệm CG — Composite Object:
//   Ô tô/xe tải là ví dụ của Composite Object: nhiều primitive (Box) gắn vào
//   một Group chung, chia sẻ transform. AABB collision detection dùng
//   Box3.setFromObject(truck) sẽ tính bounding box bao toàn bộ con.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tạo xe tải tại tile xuất phát với màu cabin và hướng cho trước.
 * @param {number}  initialTileIndex - Tile X xuất phát (−8 → +8).
 * @param {boolean} direction        - true = di chuyển theo +X, false = theo −X.
 * @param {number}  color            - Màu hex cabin.
 * @returns {THREE.Group}
 */
export function Truck(initialTileIndex, direction, color) {
  const truck = new THREE.Group();
  truck.position.x = initialTileIndex * tileSize;

  // Xoay 180° quanh Z để cabin quay đúng chiều di chuyển khi đi về phía -X
  if (!direction) truck.rotation.z = Math.PI;

  // Thùng hàng — lớn, lệch về phía sau (x=-15), cao 35 đơn vị
  const cargo = new THREE.Mesh(
    new THREE.BoxGeometry(70, 35, 35),
    new THREE.MeshLambertMaterial({ color: 0xb4c6fc, flatShading: true })
  );
  cargo.position.x = -15;
  cargo.position.z = 25;
  cargo.castShadow    = true;
  cargo.receiveShadow = true;
  truck.add(cargo);

  // Cabin — vuông (30×30×30), phía trước, màu theo tham số
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(30, 30, 30),
    new THREE.MeshLambertMaterial({ color, flatShading: true })
  );
  cabin.position.x = 35;
  cabin.position.z = 20;
  cabin.castShadow    = true;
  cabin.receiveShadow = true;
  truck.add(cabin);

  // 3 bánh: trước (+37), giữa (+5) dưới thùng hàng, sau (−35)
  truck.add(Wheel( 37));
  truck.add(Wheel(  5));
  truck.add(Wheel(-35));

  return truck;
}
