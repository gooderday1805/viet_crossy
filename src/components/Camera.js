import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────────────────
// Camera.js — PerspectiveCamera với góc nhìn isometric kiểu Crossy Road.
//
// Khái niệm CG — PerspectiveCamera:
//   Chiếu phối cảnh (Perspective Projection): các vật thể xa trông nhỏ hơn,
//   tạo cảm giác chiều sâu tự nhiên (giống mắt người).
//   Tham số:
//     fov   (Field of View): góc nhìn dọc tính bằng độ — càng nhỏ càng "zoom in",
//           nhìn trực tiếp như ống kính tele, giảm méo hình học.
//     aspect: tỉ lệ chiều ngang / chiều cao canvas — phải khớp để không bị kéo dài.
//     near / far: frustum clipping planes — geometry ngoài khoảng [near, far]
//           sẽ bị loại bỏ (clipped) trước khi render để tiết kiệm GPU.
//
// Khái niệm CG — camera.up:
//   Xác định vector "đầu" (head-up direction) dùng khi tính ma trận View.
//   Đặt (0, 0, 1) vì game dùng Z-up: "lên" trong thế giới là trục Z.
//
// Camera KHÔNG tự follow player trong Camera.js — main.js cập nhật
// camera.position.y = player.position.y + CAMERA_Y_OFFSET mỗi frame.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Khởi tạo camera phối cảnh (PerspectiveCamera) với góc nhìn isometric.
 * @returns {THREE.PerspectiveCamera}
 */
export function Camera() {
  // aspect = chiều ngang / chiều cao → đảm bảo hình không méo khi cửa sổ thay đổi kích thước
  const aspect = window.innerWidth / window.innerHeight;

  // FOV 24° (nhỏ) = ống kính "zoom nhẹ", giảm distortion phối cảnh
  // → vật thể gần/xa ít bị chênh lệch kích thước → gần với cảm giác isometric
  const camera = new THREE.PerspectiveCamera(24, aspect, 1, 3000);

  // Z-up: hệ tọa độ game dùng Z là chiều cao, camera phải biết "đầu" nằm ở đâu
  camera.up.set(0, 0, 1);

  // Vị trí chéo phía sau-trên-phải nhân vật — tạo góc nhìn 3/4 kiểu Crossy Road.
  // X=280 (lệch phải nhẹ), Y=-600 (phía sau player ≈14 tile), Z=280 (cao)
  camera.position.set(280, -600, 280);

  // lookAt gần vị trí player lúc spawn (row -10, Y=-420) + offset nhỏ lên Z
  // → camera nhìn thẳng vào nhân vật lúc bắt đầu game.
  // Trong game loop, main.js cập nhật camera.position.y để follow player.
  camera.lookAt(70, -240, 20);

  return camera;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tham khảo — OrthographicCamera (đã thử nghiệm, hiện không dùng):
//   Chiếu trực giao (Orthographic Projection): không có hiệu ứng xa-gần,
//   mọi đối tượng cùng kích thước bất kể khoảng cách → phong cách pixel art.
//   Phù hợp khi muốn game nhìn phẳng hoàn toàn, nhưng thiếu chiều sâu tự nhiên.
//
// export function Camera() {
//   const size = 750;
//   const aspect = window.innerWidth / window.innerHeight;
//   const camera = new THREE.OrthographicCamera(
//     -(size * aspect) / 2, (size * aspect) / 2,
//      size / 2,           -size / 2,
//     1, 3000
//   );
//   camera.up.set(0, 0, 1);
//   camera.position.set(300, -380, 300);
//   camera.lookAt(0, -80, 0);
//   return camera;
// }
// ─────────────────────────────────────────────────────────────────────────────
