import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────────────────
// DirectionalLight.js — ánh sáng mặt trời có bóng đổ (shadow map).
//
// Khái niệm CG — DirectionalLight:
//   Ánh sáng song song (Parallel Light): tất cả tia sáng cùng hướng, cường độ
//   không suy giảm theo khoảng cách — mô phỏng mặt trời ở vô cực.
//   Hướng = từ light.position về light.target.position.
//
// Khái niệm CG — Shadow Map (bản đồ bóng):
//   Kỹ thuật tạo bóng 2 pass:
//     Pass 1 (shadow pass): render scene từ góc nhìn ánh sáng → ghi depth vào texture
//                           (shadow map), kích thước mapSize × mapSize pixels.
//     Pass 2 (render pass): với mỗi pixel, so sánh depth thực tế với depth trong shadow map
//                           → nếu bị che → pixel đó nằm trong bóng tối.
//   mapSize lớn hơn → shadow sắc nét hơn nhưng tốn VRAM và thời gian render.
//   2048×2048 = chất lượng cao, phù hợp cho isometric game không cần realtime PBR.
//
// Khái niệm CG — Shadow Frustum (Orthographic):
//   DirectionalLight dùng OrthographicCamera để render shadow pass.
//   left/right/top/bottom = vùng thế giới được bao phủ bởi shadow map.
//   Vùng này phải bao toàn bộ đối tượng castShadow trong tầm nhìn camera chính.
//   near/far: khoảng không gian tính từ ánh sáng — geometry ngoài sẽ không có bóng.
//
// Vị trí ánh sáng: (-100, -100, 200) tương đối so với player (dirLight là con của player).
//   → Ánh sáng từ trên-trái-sau → bóng đổ sang phải-trước, tạo chiều sâu rõ ràng.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Khởi tạo DirectionalLight với shadow map 2048×2048.
 * Trả về light chưa có target — caller (main.js) gán dirLight.target = player.
 * @returns {THREE.DirectionalLight}
 */
export function DirectionalLight() {
  const dirLight = new THREE.DirectionalLight();

  // Offset so với parent (player): trên-trái-sau để tạo góc chiếu tự nhiên
  dirLight.position.set(-100, -100, 200);

  // Z-up: giúp Three.js tính đúng ma trận View khi render shadow pass
  dirLight.up.set(0, 0, 1);
  dirLight.castShadow = true;

  // Shadow map resolution: 2048×2048 px — cân bằng giữa chất lượng và hiệu năng
  dirLight.shadow.mapSize.width  = 2048;
  dirLight.shadow.mapSize.height = 2048;

  // Shadow camera (OrthographicCamera) — phải bao phủ vùng nhìn thấy được:
  //   ±400 đơn vị theo X/Y tính từ tâm bóng (= vị trí player)
  //   near=50 / far=400: đủ để bao toàn bộ geometry từ player đến xe cộ xa nhất
  dirLight.shadow.camera.up.set(0, 0, 1);
  dirLight.shadow.camera.left   = -400;
  dirLight.shadow.camera.right  =  400;
  dirLight.shadow.camera.top    =  400;
  dirLight.shadow.camera.bottom = -400;
  dirLight.shadow.camera.near   =  50;
  dirLight.shadow.camera.far    =  400;

  return dirLight;
}
