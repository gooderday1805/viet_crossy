import * as THREE from "three";
import { tileSize } from "../constants";
import { vehicleModelCache } from "../utilities/vehicleModels";
import { Wheel } from "./Wheel";

// ─────────────────────────────────────────────────────────────────────────────
// Taxi.js — xe taxi dùng GLB model (khi đã load) hoặc BoxGeometry (fallback).
//
// Cùng kiến trúc với SUV.js — xem chú thích CG ở đó.
// Fallback của Taxi thêm bảng hiệu "TAXI" trên nóc xe (1 mesh nhỏ màu vàng đậm).
//
// Khái niệm CG — Composite Object:
//   Bảng hiệu là một Mesh riêng gắn vào Group `group`.
//   Box3.setFromObject(group) khi kiểm tra collision sẽ bao cả bảng hiệu
//   → hitbox tự động mở rộng đúng kích thước xe thực.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tạo xe taxi tại tile xuất phát.
 * @param {number}  initialTileIndex - Tile X xuất phát (−8 → +8).
 * @param {boolean} direction        - true = di chuyển +X, false = di chuyển −X.
 * @param {number}  color            - Màu hex (thường là 0xf5c518 vàng taxi).
 * @returns {THREE.Group}
 */
export function Taxi(initialTileIndex, direction, color) {
  const group = new THREE.Group();
  group.position.x = initialTileIndex * tileSize;
  if (!direction) group.rotation.z = Math.PI;

  if (vehicleModelCache.taxi) {
    // ── GLB MODEL PATH ──────────────────────────────────────────────────────
    group.add(vehicleModelCache.taxi.clone());
  } else {
    // ── FALLBACK: BoxGeometry ─────────────────────────────────────────────
    // Thân taxi — màu vàng đặc trưng nếu không có GLB
    const bodyColor = color ?? 0xf5c518;
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(60, 30, 15),
      new THREE.MeshLambertMaterial({ color: bodyColor, flatShading: true })
    );
    body.position.z = 12;
    body.castShadow    = true;
    body.receiveShadow = true;
    group.add(body);

    // Cabin
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(33, 24, 12),
      new THREE.MeshLambertMaterial({ color: bodyColor, flatShading: true })
    );
    cabin.position.x = -6;
    cabin.position.z = 25.5;
    cabin.castShadow    = true;
    cabin.receiveShadow = true;
    group.add(cabin);

    // Bảng hiệu TAXI trên nóc — hộp dẹt màu vàng đậm
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(18, 8, 5),
      new THREE.MeshLambertMaterial({ color: 0xe6a800, flatShading: true })
    );
    sign.position.x = -6;
    sign.position.z = 34;
    sign.castShadow = true;
    group.add(sign);

    group.add(Wheel( 18));
    group.add(Wheel(-18));
  }

  return group;
}
