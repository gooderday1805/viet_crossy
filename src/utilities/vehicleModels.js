// ─────────────────────────────────────────────────────────────────────────────
// vehicleModels.js — cache GLB model xe cộ (SUV, Taxi).
//
// Khái niệm CG — Flyweight / Asset Cache:
//   Tải mỗi model một lần duy nhất, lưu vào đây dưới dạng THREE.Group đã xử lý
//   (rotation + scale + position). Mỗi lần cần xe mới, gọi .clone() để tạo bản sao
//   riêng mà không tốn thêm loadAsync call.
//
//   clone() trong Three.js:
//   - Deep copy cây Object3D (Group → Mesh → ...).
//   - Geometry được SHARE (không copy) → tiết kiệm VRAM.
//   - Material cũng share → mọi clone cùng dùng một material object.
//   - transform (position, rotation, scale) được copy → mỗi xe có vị trí riêng.
//
// main.js sẽ gán giá trị trước khi game bắt đầu (selectCharacter → initializeMap).
// ─────────────────────────────────────────────────────────────────────────────

/** Lưu THREE.Group đã scale/rotate sẵn cho mỗi loại xe GLB. null = chưa load xong. */
export const vehicleModelCache = {
  suv:  null,
  taxi: null,
};
