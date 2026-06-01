import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────────────────
// Rain.js — hệ thống hạt mưa dùng THREE.Points (particle system).
//
// Khái niệm CG — Particle System:
//   Render N điểm trong một draw call duy nhất bằng THREE.Points.
//   Mỗi "hạt" = 1 vertex trong BufferGeometry → cực kỳ hiệu quả so với
//   N mesh riêng biệt (N draw calls).
//
//   Workflow:
//     1. Tạo Float32Array chứa [x0,y0,z0, x1,y1,z1, ...] — vị trí N hạt.
//     2. Gán vào BufferAttribute → BufferGeometry.
//     3. Cập nhật array mỗi frame + đánh dấu needsUpdate=true → GPU re-upload.
//
// Khái niệm CG — Delta-time animation:
//   position.z -= RAIN_SPEED * delta  (đơn vị/giây × giây/frame)
//   Đảm bảo mưa rơi cùng tốc độ trên mọi FPS.
//
// Kỹ thuật theo dõi camera:
//   rainGroup.position.y = player.position.y (cập nhật trong main.js)
//   → hạt mưa luôn xuất hiện quanh vùng nhìn thấy, không cần số hạt quá lớn.
// ─────────────────────────────────────────────────────────────────────────────

const RAIN_COUNT  = 800;   // số hạt mưa — đủ dày nhưng không nặng GPU
const AREA_X      = 500;   // trải rộng ±250 theo X
const AREA_Y      = 700;   // trải rộng ±350 theo Y (theo camera)
const RAIN_HEIGHT = 350;   // chiều cao mưa từ z=0 đến z=350
const RAIN_SPEED  = 450;   // đơn vị/giây (rơi nhanh như mưa to)

/**
 * Tạo particle system mưa và clock riêng để tính delta.
 * @returns {{ group: THREE.Points, clock: THREE.Clock }}
 */
export function createRain() {
  // Float32Array: 3 float per hạt (x, y, z) — compact hơn Array thường
  const positions = new Float32Array(RAIN_COUNT * 3);

  for (let i = 0; i < RAIN_COUNT; i++) {
    // Phân bố ngẫu nhiên đều (uniform) trong hộp AREA × RAIN_HEIGHT
    positions[i * 3]     = (Math.random() - 0.5) * AREA_X;
    positions[i * 3 + 1] = (Math.random() - 0.5) * AREA_Y;
    positions[i * 3 + 2] = Math.random() * RAIN_HEIGHT;
  }

  const geometry = new THREE.BufferGeometry();
  // BufferAttribute(array, itemSize=3): mỗi vertex = 3 float
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  // PointsMaterial: render mỗi vertex như một điểm có kích thước cố định (pixels)
  const material = new THREE.PointsMaterial({
    color: 0x99ccff,       // xanh nhạt — màu nước mưa dưới đèn đêm
    size: 1.8,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,     // tránh Z-fighting với geometry phía sau
    sizeAttenuation: true, // hạt nhỏ lại khi xa camera (phối cảnh)
  });

  const group = new THREE.Points(geometry, material);
  const clock = new THREE.Clock();

  return { group, clock };
}

/**
 * Cập nhật vị trí hạt mưa mỗi frame.
 * @param {{ group: THREE.Points, clock: THREE.Clock }} rain - Object trả về từ createRain().
 */
export function animateRain(rain) {
  const delta = rain.clock.getDelta();
  const positions = rain.group.geometry.attributes.position.array;

  for (let i = 0; i < RAIN_COUNT; i++) {
    // Hạt rơi theo -Z (xuống dưới trong hệ Z-up)
    positions[i * 3 + 2] -= RAIN_SPEED * delta;

    // Khi chạm mặt đất (z < 0) → reset về đỉnh với vị trí X/Y mới
    // Tạo hiệu ứng liên tục không lặp vì vị trí X/Y ngẫu nhiên mỗi lần
    if (positions[i * 3 + 2] < 0) {
      positions[i * 3]     = (Math.random() - 0.5) * AREA_X;
      positions[i * 3 + 1] = (Math.random() - 0.5) * AREA_Y;
      positions[i * 3 + 2] = RAIN_HEIGHT;
    }
  }

  // Báo GPU cần re-upload buffer — bắt buộc sau khi sửa array
  rain.group.geometry.attributes.position.needsUpdate = true;
}
