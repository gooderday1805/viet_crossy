import * as THREE from "three";
import { tileSize } from "../constants";
import { vehicleModelCache } from "../utilities/vehicleModels";
import { Wheel } from "./Wheel";

// ─────────────────────────────────────────────────────────────────────────────
// SUV.js — xe SUV dùng GLB model (khi đã load) hoặc BoxGeometry (fallback).
//
// Khái niệm CG — Asset Instancing (Clone):
//   vehicleModelCache.suv là một THREE.Group đã được main.js xử lý sẵn:
//     - rotation.x = -π/2  : chuyển GLTF Y-up → Z-up của game
//     - rotation.z = π/2   : quay mũi xe về hướng +X (mặc định, direction=true)
//     - scale: chuẩn hoá ~65 units theo trục dài nhất
//     - position.z: đáy model đặt ngay trên mặt đường (z=3)
//   .clone() tạo bản sao độc lập → mỗi xe có position.x riêng nhưng dùng chung geometry.
//
// Khái niệm CG — Group Rotation cho hướng xe:
//   direction=false → group.rotation.z = π (lật 180° quanh Z).
//   Model con kế thừa rotation của group → mũi xe lật từ +X sang −X.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tạo xe SUV tại tile xuất phát.
 * @param {number}  initialTileIndex - Tile X xuất phát (−8 → +8).
 * @param {boolean} direction        - true = di chuyển +X, false = di chuyển −X.
 * @param {number}  color            - Màu hex (dùng cho fallback block).
 * @returns {THREE.Group}
 */
export function SUV(initialTileIndex, direction, color) {
  const group = new THREE.Group();
  group.position.x = initialTileIndex * tileSize;
  if (!direction) group.rotation.z = Math.PI;

  if (vehicleModelCache.suv) {
    // ── GLB MODEL PATH ──────────────────────────────────────────────────────
    // clone() kế thừa toàn bộ rotation + scale + position.z đã xử lý sẵn.
    group.add(vehicleModelCache.suv.clone());
  } else {
    // ── FALLBACK: BoxGeometry (khi model chưa load xong) ────────────────────
    // Thân SUV: rộng và cao hơn sedan thường (65×35×20 vs 60×30×15)
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(65, 35, 20),
      new THREE.MeshLambertMaterial({ color, flatShading: true })
    );
    body.position.z = 14;
    body.castShadow    = true;
    body.receiveShadow = true;
    group.add(body);

    // Cabin SUV: rộng và dài hơn sedan (kiểu dáng crossover)
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(45, 28, 16),
      new THREE.MeshLambertMaterial({ color: "white", flatShading: true })
    );
    cabin.position.x = -5;
    cabin.position.z = 28;
    cabin.castShadow    = true;
    cabin.receiveShadow = true;
    group.add(cabin);

    group.add(Wheel( 22));
    group.add(Wheel(-22));
  }

  return group;
}
