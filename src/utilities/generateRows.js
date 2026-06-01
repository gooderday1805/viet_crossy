import * as THREE from "three";
import { minTileIndex, maxTileIndex } from "../constants";

// ─────────────────────────────────────────────────────────────────────────────
// generateRows.js — sinh ngẫu nhiên metadata cho các hàng map mới.
//
// Khái niệm CG — Procedural Content Generation (PCG):
//   Nội dung được tạo bằng thuật toán ngẫu nhiên thay vì thiết kế thủ công.
//   Ưu điểm: gameplay vô hạn, không lặp lại; Nhược điểm: khó kiểm soát difficulty.
//
// Dữ liệu sinh ra là METADATA (mô tả) — không chứa Three.js object.
// Map.js (addRows) đọc metadata và tạo mesh thực tế.
// Tách biệt data và presentation = mô hình MVC cơ bản trong game dev.
//
// Hai vùng nội dung theo rowIndex tuyệt đối:
//   Normal zone (row < 30) : car, truck, suv, taxi (ít), forest nhiều
//   Urban zone  (row ≥ 30) : thêm type "urban" (tòa nhà), suv/taxi tần suất cao hơn
//
// Type phân bố (dùng mảng có trọng số để tránh thêm hàm random phức tạp):
//   Normal: ["car","car","truck","suv","taxi","forest","forest"] → car+forest ưu tiên
//   Urban:  ["car","suv","taxi","truck","urban","urban","forest"] → urban xuất hiện ~2/7
// ─────────────────────────────────────────────────────────────────────────────

const NORMAL_TYPES = ["car", "car", "truck", "suv", "taxi", "forest", "forest"];
const URBAN_TYPES  = ["car", "suv", "taxi", "truck", "urban", "urban", "forest"];

/**
 * Sinh metadata cho `amount` hàng map mới.
 * @param {number} amount     - Số hàng cần sinh.
 * @param {number} startIndex - Chỉ số tuyệt đối của hàng đầu tiên (0 = hàng đầu game).
 *                              Dùng để quyết định chuyển sang nội dung đô thị.
 * @returns {Array} Mảng metadata hàng.
 */
export function generateRows(amount, startIndex = 0) {
  const rows = [];
  for (let i = 0; i < amount; i++) {
    rows.push(generateRow(startIndex + i));
  }
  return rows;
}

/**
 * Sinh metadata 1 hàng dựa theo vị trí tuyệt đối.
 * @param {number} absoluteIndex - Chỉ số hàng tuyệt đối trong toàn bộ game session.
 */
function generateRow(absoluteIndex) {
  const isUrbanZone = absoluteIndex >= 30;
  const type = randomElement(isUrbanZone ? URBAN_TYPES : NORMAL_TYPES);

  if (type === "car")    return generateCarLaneMetadata();
  if (type === "suv")    return generateSUVLaneMetadata();
  if (type === "taxi")   return generateTaxiLaneMetadata();
  if (type === "truck")  return generateTruckLaneMetadata();
  if (type === "urban")  return generateUrbanMetadata();
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
 * Sinh metadata hàng đô thị (tòa nhà): 3–4 tòa nhà, buffer ±1 tile.
 * Buildings cao từ 60–160 units → đa dạng đường chân trời thành phố.
 */
function generateUrbanMetadata() {
  const occupiedTiles = new Set();
  const count = randomElement([3, 4]);

  const buildings = Array.from({ length: count }, () => {
    let tileIndex;
    do {
      tileIndex = THREE.MathUtils.randInt(minTileIndex, maxTileIndex);
    } while (occupiedTiles.has(tileIndex));

    // Buffer ±1 tile: building rộng 38 units ≈ 0.9 tile, cần khoảng cách tối thiểu 1 tile
    occupiedTiles.add(tileIndex - 1);
    occupiedTiles.add(tileIndex);
    occupiedTiles.add(tileIndex + 1);

    return { tileIndex, height: randomElement([60, 80, 100, 130, 160]) };
  });

  return { type: "urban", buildings };
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
 * Sinh metadata lane SUV: 2–3 xe.
 * SUV to hơn sedan nhưng dùng cùng buffer ±1 tile với car.
 */
function generateSUVLaneMetadata() {
  const direction = randomElement([true, false]);
  const speed     = randomElement([125, 156, 188]);

  const occupiedTiles = new Set();
  const vehicles = Array.from({ length: randomElement([2, 3]) }, () => {
    let initialTileIndex;
    do {
      initialTileIndex = THREE.MathUtils.randInt(minTileIndex, maxTileIndex);
    } while (occupiedTiles.has(initialTileIndex));

    occupiedTiles.add(initialTileIndex - 1);
    occupiedTiles.add(initialTileIndex);
    occupiedTiles.add(initialTileIndex + 1);

    // SUV màu trung tính + xanh dương đậm
    return { initialTileIndex, color: randomElement([0x556b8d, 0x8d6b55, 0x556b55, 0xaaaaaa]) };
  });

  return { type: "suv", direction, speed, vehicles };
}

/**
 * Sinh metadata lane taxi: 2–3 xe, tốc độ nhanh hơn car thường.
 * Taxi luôn màu vàng để nhận biết ngay — màu được bỏ qua khi dùng GLB.
 */
function generateTaxiLaneMetadata() {
  const direction = randomElement([true, false]);
  // Taxi chạy nhanh hơn (chạy dịch vụ)
  const speed     = randomElement([156, 188, 220]);

  const occupiedTiles = new Set();
  const vehicles = Array.from({ length: randomElement([2, 3]) }, () => {
    let initialTileIndex;
    do {
      initialTileIndex = THREE.MathUtils.randInt(minTileIndex, maxTileIndex);
    } while (occupiedTiles.has(initialTileIndex));

    occupiedTiles.add(initialTileIndex - 1);
    occupiedTiles.add(initialTileIndex);
    occupiedTiles.add(initialTileIndex + 1);

    return { initialTileIndex, color: 0xf5c518 }; // vàng taxi
  });

  return { type: "taxi", direction, speed, vehicles };
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
