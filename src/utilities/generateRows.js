import * as THREE from "three";
import { minTileIndex, maxTileIndex } from "../constants";

// ─────────────────────────────────────────────────────────────────────────────
// generateRows.js — sinh ngẫu nhiên metadata cho các hàng map mới.
//
// Khái niệm CG — Procedural Content Generation (PCG):
//   Nội dung được tạo bằng thuật toán ngẫu nhiên thay vì thiết kế thủ công.
//   Ưu điểm: gameplay vô hạn, không lặp lại; Nhược điểm: khó kiểm soát difficulty.
//
// Mỗi hàng có 1 trong 3 loại (xác suất đều nhau: 1/3):
//   "car"    — lane ô tô (2–3 xe, speed ngẫu nhiên)
//   "truck"  — lane xe tải (1–2 xe, chiếm nhiều tile hơn)
//   "forest" — hàng cỏ + cây (4 cây, vị trí ngẫu nhiên không trùng nhau)
//
// Dữ liệu sinh ra là METADATA (mô tả) — không chứa Three.js object.
// Map.js (addRows) đọc metadata và tạo mesh thực tế.
// Tách biệt data và presentation = mô hình MVC cơ bản trong game dev.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sinh metadata cho `amount` hàng map mới.
 * @param {number} amount - Số hàng cần sinh.
 * @returns {Array} Mảng metadata hàng (car/truck/forest).
 */
export function generateRows(amount) {
  const rows = [];
  for (let i = 0; i < amount; i++) {
    rows.push(generateRow());
  }
  return rows;
}

/** Chọn ngẫu nhiên loại hàng và sinh metadata tương ứng. */
function generateRow() {
  const type = randomElement(["car", "truck", "forest"]);
  if (type === "car")    return generateCarLaneMetadata();
  if (type === "truck")  return generateTruckLaneMetadata();
  return generateForestMetadata();
}

/** Trả về phần tử ngẫu nhiên từ mảng (uniform distribution). */
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Sinh metadata hàng cỏ+cây: 4 cây, tileIndex không trùng nhau.
 * do-while loop đảm bảo không đặt 2 cây cùng tile (rejection sampling).
 */
function generateForestMetadata() {
  const occupiedTiles = new Set();
  const trees = Array.from({ length: 4 }, () => {
    let tileIndex;
    do {
      tileIndex = THREE.MathUtils.randInt(minTileIndex, maxTileIndex);
    } while (occupiedTiles.has(tileIndex));
    occupiedTiles.add(tileIndex);

    return { tileIndex, height: randomElement([20, 45, 60]) };
  });

  return { type: "forest", trees };
}

/**
 * Sinh metadata lane ô tô: 3 xe, speed ngẫu nhiên, tileIndex không xếp chồng.
 * Buffer ±1 tile quanh mỗi xe để tránh 2 xe quá sát nhau → không gian hẹp cho player.
 */
function generateCarLaneMetadata() {
  const direction = randomElement([true, false]);
  const speed     = randomElement([125, 156, 188]);

  const occupiedTiles = new Set();
  const vehicles = Array.from({ length: 3 }, () => {
    let initialTileIndex;
    do {
      initialTileIndex = THREE.MathUtils.randInt(minTileIndex, maxTileIndex);
    } while (occupiedTiles.has(initialTileIndex));

    // Đánh dấu 3 tile (center ± 1) để xe kế tiếp không đặt quá sát
    occupiedTiles.add(initialTileIndex - 1);
    occupiedTiles.add(initialTileIndex);
    occupiedTiles.add(initialTileIndex + 1);

    return { initialTileIndex, color: randomElement([0xa52523, 0xbdb638, 0x78b14b]) };
  });

  return { type: "car", direction, speed, vehicles };
}

/**
 * Sinh metadata lane xe tải: 2 xe, buffer ±2 tile (xe tải dài hơn xe con).
 */
function generateTruckLaneMetadata() {
  const direction = randomElement([true, false]);
  const speed     = randomElement([125, 156, 188]);

  const occupiedTiles = new Set();
  const vehicles = Array.from({ length: 2 }, () => {
    let initialTileIndex;
    do {
      initialTileIndex = THREE.MathUtils.randInt(minTileIndex, maxTileIndex);
    } while (occupiedTiles.has(initialTileIndex));

    // Buffer ±2 tile vì xe tải rộng hơn xe con (body = 70 units ≈ 1.67 tile)
    for (let d = -2; d <= 2; d++) occupiedTiles.add(initialTileIndex + d);

    return { initialTileIndex, color: randomElement([0xa52523, 0xbdb638, 0x78b14b]) };
  });

  return { type: "truck", direction, speed, vehicles };
}
